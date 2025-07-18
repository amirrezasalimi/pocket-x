import { RichTextarea, createRegexRenderer } from "rich-textarea";

const jsonRenderer = createRegexRenderer([
  // Strings (including keys) - light blue
  [/"([^"\\]|\\.)*"/g, { color: "#0ea5e9", fontWeight: "normal" }],

  // Numbers - orange
  [/\b-?\d+\.?\d*([eE][+-]?\d+)?\b/g, { color: "#f97316" }],

  // Booleans - purple
  [/\b(true|false)\b/g, { color: "#a855f7", fontWeight: "bold" }],

  // Null - red
  [/\bnull\b/g, { color: "#ef4444", fontWeight: "bold" }],

  // Brackets and braces - gray
  [/[\[\]{}]/g, { color: "#6b7280", fontWeight: "bold" }],

  // Colons and commas - gray
  [/[,:]/g, { color: "#6b7280" }],

  // Object keys (strings followed by colon) - green
  [/"([^"\\]|\\.)*"(?=\s*:)/g, { color: "#10b981", fontWeight: "600" }],
]);

interface QueryEditorProps {
  value?: string;
  readOnly?: boolean;
  placeholder?: string;
}

const QueryEditor = ({
  value,
  readOnly = false,
  placeholder = "Enter your JSON query here...",
}: QueryEditorProps) => {
  return (
    <RichTextarea
      value={value}
      readOnly={readOnly}
      placeholder={placeholder}
      style={{
        width: "100%",
        height: "100%",
        fontFamily:
          "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
        border: "1px solid #e5e7eb",
        borderRadius: "6px",
        resize: "none",
        outline: "none",
      }}
      spellCheck={false}
    >
      {jsonRenderer}
    </RichTextarea>
  );
};

export default QueryEditor;
