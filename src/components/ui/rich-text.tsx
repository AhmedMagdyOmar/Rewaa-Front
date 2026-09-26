import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Define Lexical Node interfaces
export interface LexicalTextNode {
  type: "text";
  text: string;
  format: number; // bitwise flags for bold (1), italic (2), strikethrough (4), underline (8), code (16)
}

export interface LexicalElementNode {
  type:
    | "paragraph"
    | "heading"
    | "list"
    | "listitem"
    | "link"
    | "quote"
    | "horizontalrule"
    | "autolink";
  tag?: string;
  listType?: "bullet" | "number";
  format?: string | number;
  indent?: number;
  url?: string;
  children?: LexicalNode[];
}

export type LexicalNode = LexicalTextNode | LexicalElementNode;

// Text format flags constant (Lexical standard representation)
const IS_BOLD = 1;
const IS_ITALIC = 2;
const IS_STRIKETHROUGH = 4;
const IS_UNDERLINE = 8;
const IS_CODE = 16;

export interface RichTextProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any; // Can accept Lexical JSON structure, raw string, or array
  className?: string;
}

/**
 * RichText parses and renders Payload CMS Lexical JSON structures into semantic HTML
 * styled with the Tailwind Typography plugin (prose) and dark-mode adaptations.
 */
export const RichText: React.FC<RichTextProps> = ({ content, className }) => {
  if (!content) return null;

  // Fallback: If content is just plain HTML string, render via dangerouslySetInnerHTML
  if (typeof content === "string") {
    return (
      <div
        className={cn("prose max-w-none", className)}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // Recursive Lexical parser
  const renderNode = (node: LexicalNode, index: number): React.ReactNode => {
    if (!node) return null;

    // Handle Text nodes
    if (node.type === "text" || ("text" in node && !node.type)) {
      const textNode = node as LexicalTextNode;
      let element: React.ReactNode = textNode.text;

      if (!element) return null;

      const format = textNode.format || 0;
      if (format & IS_BOLD) {
        element = <strong key={`bold-${index}`}>{element}</strong>;
      }
      if (format & IS_ITALIC) {
        element = <em key={`italic-${index}`}>{element}</em>;
      }
      if (format & IS_STRIKETHROUGH) {
        element = (
          <span key={`strike-${index}`} className="line-through">
            {element}
          </span>
        );
      }
      if (format & IS_UNDERLINE) {
        element = (
          <span key={`underline-${index}`} className="underline">
            {element}
          </span>
        );
      }
      if (format & IS_CODE) {
        element = (
          <code key={`code-${index}`} className="px-1.5 py-0.5 rounded bg-muted text-mono text-xs">
            {element}
          </code>
        );
      }

      return <React.Fragment key={index}>{element}</React.Fragment>;
    }

    // Handle Element nodes
    const elementNode = node as LexicalElementNode;
    const children = elementNode.children?.map((child, i) => renderNode(child, i)) || [];

    switch (elementNode.type) {
      case "paragraph":
        return <p key={index}>{children}</p>;
      case "heading": {
        const Tag = (elementNode.tag as keyof React.JSX.IntrinsicElements) || "h2";
        return <Tag key={index}>{children}</Tag>;
      }
      case "list": {
        const Tag = elementNode.listType === "number" ? "ol" : "ul";
        return <Tag key={index}>{children}</Tag>;
      }
      case "listitem":
        return <li key={index}>{children}</li>;
      case "link":
      case "autolink": {
        const url = elementNode.url || "#";
        const isExternal = url.startsWith("http");
        if (isExternal) {
          return (
            <a key={index} href={url} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          );
        }
        return (
          <Link key={index} href={url}>
            {children}
          </Link>
        );
      }
      case "quote":
        return <blockquote key={index}>{children}</blockquote>;
      case "horizontalrule":
        return <hr key={index} />;
      default:
        // Fallback render nested elements if type not matches
        if (children.length > 0) {
          return <div key={index}>{children}</div>;
        }
        return null;
    }
  };

  // Extract root children nodes
  let nodes: LexicalNode[] = [];
  if (
    content &&
    typeof content === "object" &&
    content.root &&
    Array.isArray(content.root.children)
  ) {
    nodes = content.root.children;
  } else if (Array.isArray(content)) {
    nodes = content;
  }

  return (
    <div
      className={cn(
        "prose max-w-none prose-headings:font-bold prose-a:text-primary hover:prose-a:underline",
        className,
      )}
    >
      {nodes.map((node, index) => renderNode(node, index))}
    </div>
  );
};
