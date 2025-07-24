// QueryEditorPrism.jsx
import { useEffect, useRef } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-json"; // JSON grammar
import "prismjs/plugins/line-numbers/prism-line-numbers.css";
import "prismjs/themes/prism.css"; // use light Prism theme

interface QueryEditorProps {
  value?: string;
  readOnly?: boolean;
  placeholder?: string;
}

const QueryEditorPrism = ({
  value = "",
  readOnly = false,
  placeholder = "Enter your JSON query here...",
}: QueryEditorProps) => {
  const codeRef = useRef<HTMLElement>(null);

  // Re-highlight whenever `value` changes
  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.textContent = value;
      Prism.highlightElement(codeRef.current);
    }
  }, [value]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        fontFamily:
          "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
        border: "1px solid #e5e7eb",
        borderRadius: "6px",
        overflow: "auto",
        background: "#f5f5f5", // match Prism light theme
      }}
    >
      <pre
        className={`line-numbers language-json${readOnly ? "" : ""}`}
        style={{
          margin: 0,
          padding: "1rem",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
        }}
      >
        <code
          ref={codeRef}
          className="language-json"
          // initial content
          dangerouslySetInnerHTML={{
            __html: Prism.highlight(value, Prism.languages.json, "json"),
          }}
        />
      </pre>
      {/* Overlay a textarea for editing */}
      {!readOnly && (
        <textarea
          value={value}
          placeholder={placeholder}
          spellCheck={false}
          onChange={(e) => {
            const txt = e.target.value;
            if (codeRef.current) {
              codeRef.current.textContent = txt;
              Prism.highlightElement(codeRef.current);
            }
          }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "transparent",
            color: "transparent",
            caretColor: "#333",
            border: "none",
            resize: "none",
            padding: "1rem",
            fontFamily:
              "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
            whiteSpace: "pre-wrap",
            overflow: "hidden",
            outline: "none",
          }}
        />
      )}
    </div>
  );
};

export default QueryEditorPrism;
