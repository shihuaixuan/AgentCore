"""
MCP (Model Context Protocol) Tool Block.

A single dynamic block that can connect to any MCP server, discover available tools,
and execute them. Works like AgentExecutorBlock — the user selects a tool from a
dropdown and the input/output schema adapts dynamically.
"""

import logging
from typing import Any, Literal

from pydantic import SecretStr

from backend.blocks._base import (
    Block,
    BlockCategory,
    BlockSchemaInput,
    BlockSchemaOutput,
    BlockType,
)
from backend.blocks.mcp.client import MCPClient, MCPClientError
from backend.blocks.mcp.helpers import (
    mcp_authorization_header,
    mcp_query_key,
    normalize_mcp_url,
    parse_mcp_content,
)
from backend.data.block import BlockInput, BlockOutput
from backend.data.model import (
    CredentialsField,
    CredentialsMetaInput,
    OAuth2Credentials,
    SchemaField,
)
from backend.integrations.providers import ProviderName
from backend.util.request import HTTPClientError

logger = logging.getLogger(__name__)

TEST_CREDENTIALS = OAuth2Credentials(
    id="test-mcp-cred",
    provider="mcp",
    access_token=SecretStr("mock-mcp-token"),
    refresh_token=SecretStr("mock-refresh"),
    scopes=[],
    title="Mock MCP credential",
    metadata={"mcp_server_url": "https://mcp.example.com/mcp"},
)
TEST_CREDENTIALS_INPUT = {
    "provider": TEST_CREDENTIALS.provider,
    "id": TEST_CREDENTIALS.id,
    "type": TEST_CREDENTIALS.type,
    "title": TEST_CREDENTIALS.title,
}


MCPCredentials = CredentialsMetaInput[Literal[ProviderName.MCP], Literal["oauth2"]]


class MCPToolBlock(Block):
    """
    A block that connects to an MCP server, lets the user pick a tool,
    and executes it with dynamic input/output schema.

    The flow:
    1. User provides an MCP server URL (and optional credentials)
    2. Frontend calls the backend to get tool list from that URL
    3. User selects a tool from a dropdown (available_tools)
    4. The block's input schema updates to reflect the selected tool's parameters
    5. On execution, the block calls the MCP server to run the tool
    """

    class Input(BlockSchemaInput):
        connection_id: str = SchemaField(
            description="Saved MCP connection ID", default="", hidden=True
        )
        server_url: str = SchemaField(
            description="URL of the MCP server (Streamable HTTP endpoint)",
            placeholder="https://mcp.example.com/mcp",
        )
        credentials: MCPCredentials = CredentialsField(
            discriminator="server_url",
            description="MCP server OAuth credentials",
            default={},
        )
        selected_tool: str = SchemaField(
            description="The MCP tool to execute",
            placeholder="Select a tool",
            default="",
        )
        tool_input_schema: dict[str, Any] = SchemaField(
            description="JSON Schema for the selected tool's input parameters. "
            "Populated automatically when a tool is selected.",
            default={},
            hidden=True,
        )
        tool_description: str = SchemaField(
            description="Description of the selected MCP tool. "
            "Populated automatically when a tool is selected.",
            default="",
            hidden=True,
        )

        tool_arguments: dict[str, Any] = SchemaField(
            description="Arguments to pass to the selected MCP tool. "
            "The fields here are defined by the tool's input schema.",
            default={},
        )

        @classmethod
        def get_input_schema(cls, data: BlockInput) -> dict[str, Any]:
            """Return the tool's input schema so the builder UI renders dynamic fields."""
            return data.get("tool_input_schema", {})

        @classmethod
        def get_input_defaults(cls, data: BlockInput) -> BlockInput:
            """Return the current tool_arguments as defaults for the dynamic fields."""
            return data.get("tool_arguments", {})

        @classmethod
        def get_missing_input(cls, data: BlockInput) -> set[str]:
            """Check which required tool arguments are missing."""
            required_fields = cls.get_input_schema(data).get("required", [])
            tool_arguments = data.get("tool_arguments", {})
            return set(required_fields) - set(tool_arguments)

        @classmethod
        def get_mismatch_error(
            cls, data: BlockInput, exclude_fields: set[str] | None = None
        ) -> str | None:
            # `data` holds the flattened `tool_arguments` (see validate_exec), never
            # the node's `tool_input_schema`; the MCP server validates its arguments.
            return None

    class Output(BlockSchemaOutput):
        result: Any = SchemaField(description="The result returned by the MCP tool")
        error: str = SchemaField(description="Error message if the tool call failed")

    def __init__(self):
        super().__init__(
            id="a0a4b1c2-d3e4-4f56-a7b8-c9d0e1f2a3b4",
            description="Connect to any MCP server and execute its tools. "
            "Provide a server URL, select a tool, and pass arguments dynamically.",
            categories={BlockCategory.DEVELOPER_TOOLS},
            input_schema=MCPToolBlock.Input,
            output_schema=MCPToolBlock.Output,
            block_type=BlockType.MCP_TOOL,
            test_credentials=TEST_CREDENTIALS,
            test_input={
                "server_url": "https://mcp.example.com/mcp",
                "credentials": TEST_CREDENTIALS_INPUT,
                "selected_tool": "get_weather",
                "tool_input_schema": {
                    "type": "object",
                    "properties": {"city": {"type": "string"}},
                    "required": ["city"],
                },
                "tool_arguments": {"city": "London"},
            },
            test_output=[
                (
                    "result",
                    {"weather": "sunny", "temperature": 20},
                ),
            ],
            test_mock={
                "_call_mcp_tool": lambda *a, **kw: {
                    "weather": "sunny",
                    "temperature": 20,
                },
            },
        )

    async def _call_mcp_tool(
        self,
        server_url: str,
        tool_name: str,
        arguments: dict[str, Any],
        authorization: str | None = None,
        input_schema: dict[str, Any] | None = None,
        query_key: SecretStr | None = None,
    ) -> Any:
        """Call a tool on the MCP server. Extracted for easy mocking in tests."""
        client = MCPClient(server_url, authorization=authorization, query_key=query_key)
        try:
            await client.initialize()
            result = await client.call_tool(
                tool_name, arguments, input_schema=input_schema
            )
        finally:
            await client.close()

        if result.is_error:
            error_text = ""
            for item in result.content:
                if item.get("type") == "text":
                    error_text += item.get("text", "")
            raise MCPClientError(
                f"MCP tool '{tool_name}' returned an error: "
                f"{error_text or 'Unknown error'}"
            )

        return parse_mcp_content(result.content, result.structured_content)

    async def run(
        self,
        input_data: Input,
        *,
        user_id: str,
        credentials: OAuth2Credentials | None = None,
        **kwargs,
    ) -> BlockOutput:
        if input_data.connection_id:
            from backend.data import db
            from backend.data.custom_mcp import get_custom_mcp_connection
            from backend.util.clients import get_database_manager_async_client

            execution_context = kwargs.get("execution_context")
            if execution_context and execution_context.expert_id:
                yield (
                    "error",
                    "Custom connections are not available to expert workflows yet.",
                )
                return
            lookup = (
                get_custom_mcp_connection
                if db.is_connected()
                else get_database_manager_async_client().get_custom_mcp_connection
            )
            connection = await lookup(user_id, input_data.connection_id)
            if not connection or not connection["enabled"]:
                yield (
                    "error",
                    "This connection is unavailable. Select another connection.",
                )
                return
            if normalize_mcp_url(connection["serverUrl"]) != normalize_mcp_url(
                input_data.server_url
            ):
                yield (
                    "error",
                    "This connection's server address changed. Select its tool again.",
                )
                return
            credential_id = connection["credentialId"]
            if credential_id:
                if (
                    not isinstance(credentials, OAuth2Credentials)
                    or credentials.id != credential_id
                ):
                    yield "error", "This connection's credential is unavailable."
                    return
            else:
                if credentials is not None:
                    yield (
                        "error",
                        "This connection's credentials changed. Run it again.",
                    )
                    return
        if not input_data.server_url:
            yield "error", "MCP server URL is required"
            return

        if not input_data.selected_tool:
            yield "error", "No tool selected. Please select a tool from the dropdown."
            return

        # Validate required tool arguments before calling the server.
        # The executor-level validation is bypassed for MCP blocks because
        # get_input_defaults() flattens tool_arguments, stripping tool_input_schema
        # from the validation context.
        required = set(input_data.tool_input_schema.get("required", []))
        if required:
            missing = required - set(input_data.tool_arguments.keys())
            if missing:
                yield (
                    "error",
                    (
                        f"Missing required argument(s): {', '.join(sorted(missing))}. "
                        f"Please fill in all required fields marked with * in the block form."
                    ),
                )
                return

        # Only the credential selected for this node or run is used, and only at
        # the server it was connected for.
        if credentials and normalize_mcp_url(
            (credentials.metadata or {}).get("mcp_server_url") or ""
        ) != normalize_mcp_url(input_data.server_url):
            yield (
                "error",
                (
                    "The selected credentials were connected for a different MCP "
                    "server. Select credentials for this server and run again."
                ),
            )
            return

        authorization = mcp_authorization_header(credentials) if credentials else None

        try:
            result = await self._call_mcp_tool(
                server_url=input_data.server_url,
                tool_name=input_data.selected_tool,
                arguments=input_data.tool_arguments,
                authorization=authorization,
                query_key=mcp_query_key(credentials) if credentials else None,
                input_schema=input_data.tool_input_schema or None,
            )
            yield "result", result
        except MCPClientError as e:
            yield "error", str(e)
        except HTTPClientError as e:
            if credentials is None and e.status_code in (401, 403):
                yield (
                    "error",
                    (
                        "This MCP server requires credentials. Select credentials "
                        "for this server and run again."
                    ),
                )
                return
            logger.exception("MCP tool call failed")
            yield "error", f"MCP tool call failed: {e}"
        except Exception as e:
            logger.exception(f"MCP tool call failed: {e}")
            yield "error", f"MCP tool call failed: {e!s}"
