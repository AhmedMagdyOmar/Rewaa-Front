"use client";

import * as React from "react";
import dynamic from "next/dynamic";
// Note: We moved the style.css import and cn utility to the InitializedMDXEditor component.

// Dynamically import our configured editor instead of the raw module
const MDXEditorComponent = dynamic(() => import("./initialized-mdx-editor"), {
  ssr: false,
  loading: () => (
    <div className="min-h-32 border rounded-md p-4 text-muted-foreground bg-muted/20">
      Loading editor...
    </div>
  ),
});

export interface FormMarkdownEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  className?: string;
  contentEditableClassName?: string;
}

export const FormMarkdownEditor = React.memo(function FormMarkdownEditor({
  value,
  onChange,
  placeholder,
  className,
  contentEditableClassName,
}: FormMarkdownEditorProps) {
  return (
    <MDXEditorComponent
      markdown={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      contentEditableClassName={contentEditableClassName}
    />
  );
});
