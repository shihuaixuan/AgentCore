"""Declarative, endpoint-bound authentication for catalogued MCP servers."""

from __future__ import annotations

import base64
import binascii
import ipaddress
import re
from collections.abc import Mapping
from typing import TYPE_CHECKING, Annotated, Literal
from urllib.parse import parse_qsl, urlsplit

from pydantic import BaseModel, ConfigDict, Field, SecretStr, model_validator

if TYPE_CHECKING:
    from backend.integrations.mcp_catalog import MCPServerMetadata

AuthType = Literal["none", "oauth", "bearer", "basic", "header", "query_key"]
Identifier = Annotated[str, Field(pattern=r"^[a-z][a-z0-9_]{0,63}$")]
Label = Annotated[str, Field(min_length=1, max_length=160)]
_PARAM = re.compile(r"[A-Za-z][A-Za-z0-9_-]{0,63}")
_SEGMENT = re.compile(r"[A-Za-z0-9_-]{1,256}")
_VARIABLE = re.compile(r"\{([a-z][a-z0-9_]{0,63})\}")
_HOST = re.compile(r"(?ai:https://)((?:[a-zA-Z0-9-]+\.)+[a-zA-Z0-9-]+)(?::443)?(?=/|$)")


class MethodField(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    id: Identifier
    label: Label
    type: Literal["secret", "text", "secret_url"]


class MCPMethod(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    id: Identifier
    kind: Literal["none", "oauth2", "user_input"]
    label: Label
    fields: list[MethodField] = Field(default_factory=list, max_length=8)
    auth_type: AuthType
    name: str | None = None
    auth_prefix: str = Field(default="", max_length=32)
    endpoint_path: str | None = None
    fixed_params: dict[str, str] = Field(default_factory=dict, max_length=16)

    @model_validator(mode="after")
    def validate_method(self) -> MCPMethod:
        expected = {"none": "none", "oauth": "oauth2"}.get(self.auth_type, "user_input")
        if self.kind != expected:
            raise ValueError("Method kind and authentication type disagree")
        if self.auth_type in {"header", "query_key"}:
            if not self.name or not _PARAM.fullmatch(self.name):
                raise ValueError("Named credentials require a valid parameter name")
        elif self.name is not None:
            raise ValueError("Unexpected delivery parameter name")
        if self.auth_type == "header" and not re.fullmatch(
            r"(?i:(?!proxy-|sec-|mcp-|x-forwarded-)[a-z0-9_-]*(?:key|token|secret|credential|auth))", self.name or ""
        ):
            raise ValueError("Only credential headers are supported")
        if any(
            ord(character) < 32 or ord(character) == 127
            for character in self.auth_prefix
        ):
            raise ValueError("Authentication prefixes must be printable")
        if self.auth_type != "header" and self.auth_prefix:
            raise ValueError("Authentication prefixes are only valid for headers")
        if any(
            not _PARAM.fullmatch(name) or not re.fullmatch(r"[A-Za-z0-9_.~-]{1,128}", value)
            for name, value in self.fixed_params.items()
        ) or (self.auth_type == "query_key" and self.name in self.fixed_params):
            raise ValueError("Invalid or conflicting fixed query parameter")
        variables = set()
        if self.endpoint_path is not None:
            _clean_url("https://catalog.example" + self.endpoint_path, template=True)
            if not self.endpoint_path.startswith("/"):
                raise ValueError("Endpoint template must be an absolute path")
            variables = set(_VARIABLE.findall(self.endpoint_path))
        text = {field.id for field in self.fields if field.type == "text"}
        secrets = [field for field in self.fields if field.type != "text"]
        if len({field.id for field in self.fields}) != len(self.fields):
            raise ValueError("Field IDs must be unique")
        if len(secrets) != int(self.kind == "user_input"):
            raise ValueError("User input requires exactly one secret field")
        if secrets and secrets[0].type == "secret_url":
            if self.auth_type != "query_key" or text:
                raise ValueError("A complete URL supplies its own path and query credential")
        elif text != variables:
            raise ValueError("Path variables and text fields must match")
        return self


class PreparedMethod(BaseModel):
    model_config = ConfigDict(frozen=True)

    server_url: str
    method: MCPMethod
    secret: SecretStr | None


def legacy_method(auth: AuthType, server_url: str | None) -> MCPMethod:
    if auth == "query_key":
        return MCPMethod(id=auth, kind="user_input", label="API Key URL", auth_type=auth,
                         name="key", endpoint_path=None,
                         fields=[MethodField(id="url", label="Complete URL", type="secret_url")])
    if auth in {"none", "oauth"}:
        return MCPMethod(id=auth, kind="none" if auth == "none" else "oauth2",
                         label="No authentication" if auth == "none" else "Sign in", auth_type=auth)
    return MCPMethod(id=auth, kind="user_input", label=auth.title(), auth_type=auth,
                     fields=[MethodField(id="token", label="Credential", type="secret")])


def resolve_method(server: MCPServerMetadata, method_id: str) -> MCPMethod:
    for method in server.methods:
        if method.id == method_id:
            return method
    raise ValueError("Unknown MCP connection method")


def prepare_method(
    server: MCPServerMetadata,
    method_id: str,
    *,
    server_url: str | None = None,
    values: Mapping[str, str | SecretStr] | None = None,
) -> PreparedMethod:
    method = resolve_method(server, method_id)
    values = values or {}
    if values.keys() != {field.id for field in method.fields}:
        raise ValueError("Supply exactly the fields declared by the MCP method")
    path = method.endpoint_path
    secret = None
    for field in method.fields:
        supplied = values[field.id]
        value = supplied.get_secret_value() if isinstance(supplied, SecretStr) else supplied
        if not isinstance(value, str):
            raise ValueError("Invalid MCP field value")
        if field.type == "text":
            if not path or not _SEGMENT.fullmatch(value):
                raise ValueError("Invalid MCP endpoint path segment")
            path = path.replace("{" + field.id + "}", value)
        else:
            if field.type == "secret_url":
                link_url, value = _split_link(method, value)
                if server_url is not None and _clean_url(server_url) != link_url:
                    raise ValueError("Conflicting MCP endpoints")
                server_url = link_url
            secret = _canonical_secret(method, value)
    if path and not _VARIABLE.search(path):
        base = _default_endpoint(server, method)
        if base is None:
            raise ValueError("Method requires a catalogued origin")
        rendered = urlsplit(base)._replace(path=path).geturl()
        if server_url is not None and _clean_url(server_url) != _clean_url(rendered):
            raise ValueError("Conflicting MCP endpoints")
        server_url = rendered
    return PreparedMethod(
        server_url=method_endpoint(server, method, server_url), method=method, secret=secret
    )


def method_endpoint(server: MCPServerMetadata, method: MCPMethod, url: str | None) -> str:
    """Revalidate the saved clean endpoint, not just the form that created it."""
    default = _default_endpoint(server, method)
    clean = _clean_url(url if url is not None else default or "")
    if method.endpoint_path is not None:
        if not default or urlsplit(clean).netloc != urlsplit(_clean_url(default)).netloc:
            raise ValueError("Endpoint does not match the catalogued origin")
        parts = method.endpoint_path.split("/")
        actual = urlsplit(clean).path.split("/")
        if len(parts) != len(actual) or not all(
            _SEGMENT.fullmatch(segment) if _VARIABLE.fullmatch(part) else part == segment
            for part, segment in zip(parts, actual)
        ):
            raise ValueError("Endpoint does not match the method path")
    else:
        allowed = [default, *(option.url for option in server.server_url_options)]
        if clean not in {_clean_url(candidate) for candidate in allowed if candidate}:
            if server.connection_mode != "custom" and not server.allow_custom_url or any(server.server_url_options):
                raise ValueError("Endpoint does not match the catalogued method")
    return clean


def _default_endpoint(server: MCPServerMetadata, method: MCPMethod) -> str | None:
    # OAuth discovery may happen at a different URL, but the access token is
    # used against the MCP tool endpoint.  A saved connection must never be
    # bound to the authorization-server URL by accident.
    return server.server_url


def _clean_url(url: str, *, template: bool = False) -> str:
    origin = _HOST.match(url)
    if not origin or len(url) > 4096:
        raise ValueError("Expected a clean public HTTPS endpoint")
    host = origin[1].lower()
    if host.endswith((".localhost", ".local", ".internal")) or any(
        not re.fullmatch(r"[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?", label) for label in host.split(".")
    ):
        raise ValueError("Invalid endpoint hostname")
    try:
        ipaddress.ip_address(host)
    except ValueError:
        pass
    else:
        raise ValueError("Endpoint must use a public hostname")
    path = url[origin.end():]
    if "//" in path or any(
        segment in {".", ".."} or not (
            re.fullmatch(r"[A-Za-z0-9._~-]*", segment) or template and _VARIABLE.fullmatch(segment)
        ) for segment in path.split("/")
    ):
        raise ValueError("Invalid endpoint path")
    return f"https://{host}{path}"


def _split_link(method: MCPMethod, link: str) -> tuple[str, str]:
    endpoint, separator, query = link.partition("?")
    if (not separator or len(link) > 32768 or "#" in query or "?" in query
        or not link.isascii() or not link.isprintable() or " " in link
        or re.search(r"%(?![a-fA-F0-9]{2})", query)):
        raise ValueError("Invalid complete MCP URL")
    failed = False
    try:
        pairs = parse_qsl(query, strict_parsing=True, keep_blank_values=True, max_num_fields=17, errors="strict")
    except ValueError:
        failed = True
    if failed:
        raise ValueError("Invalid MCP URL parameters")
    params = dict(pairs)
    if len(pairs) != len(params) or method.name not in params:
        raise ValueError("Missing or repeated MCP URL parameter")
    value = params.pop(method.name)
    if set(params) != set(method.fixed_params) or any(
        method.fixed_params.get(name) != val for name, val in params.items()
    ):
        raise ValueError("Unexpected MCP URL parameter")
    return _clean_url(endpoint), value


def _canonical_secret(method: MCPMethod, value: str) -> SecretStr:
    if not re.fullmatch(r"[!-~]{1,8192}", value):
        raise ValueError("Expected a nonempty printable credential")
    if method.auth_type == "basic":
        try:
            valid = b":" in base64.b64decode(value, validate=True)
        except (ValueError, binascii.Error):
            valid = False
        if not valid:
            raise ValueError("Basic requires Base64-encoded username:password")
    if method.auth_type in {"basic", "bearer"}:
        return SecretStr(f"{method.auth_type.title()} {value}")
    return SecretStr(value)


def runtime_token(method: MCPMethod, secret: SecretStr | None) -> SecretStr | None:
    if method.kind == "none" and secret is None:
        return None
    if method.kind == "none" or not isinstance(secret, SecretStr):
        raise ValueError("Credential does not match the MCP method")
    value = secret.get_secret_value()
    if method.auth_type in {"basic", "bearer"}:
        prefix = method.auth_type.title() + " "
        if not value.startswith(prefix):
            raise ValueError("Invalid stored MCP credential")
        value = value[len(prefix):]
    _canonical_secret(method, value)
    return SecretStr(value)
