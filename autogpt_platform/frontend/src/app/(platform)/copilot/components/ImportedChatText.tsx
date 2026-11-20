import { Text } from "@/components/atoms/Text/Text";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function ImportedChatText({
  text,
  role,
}: {
  text: string;
  role: "user" | "assistant";
}) {
  if (role === "user") {
    return (
      <Text
        variant="body"
        tone="inherit"
        className="break-words whitespace-pre-wrap"
        dir="auto"
      >
        {text}
      </Text>
    );
  }

  return (
    <div
      className="max-w-full overflow-x-auto break-words [&_ol]:ml-5 [&_ol]:list-decimal [&_ul]:ml-5 [&_ul]:list-disc [&>*+*]:mt-2"
      dir="auto"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        disallowedElements={["a", "img"]}
        unwrapDisallowed
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
