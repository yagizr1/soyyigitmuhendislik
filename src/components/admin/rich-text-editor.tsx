"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { useEffect } from "react";

export function RichTextEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({ openOnClick: false, autolink: false, protocols: ["http", "https", "mailto", "tel"] }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "rich-text min-h-48 rounded-md border border-border bg-card px-3 py-2 outline-none",
      },
    },
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  if (!editor) return <p>Editör yükleniyor.</p>;

  const button = (label: string, active: boolean, command: () => void) => (
    <button type="button" className={`h-9 rounded border px-2 text-sm ${active ? "bg-steel text-white" : "bg-card"}`} onClick={command}>
      {label}
    </button>
  );

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        {button("Kalın", editor.isActive("bold"), () => editor.chain().focus().toggleBold().run())}
        {button("İtalik", editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run())}
        {button("Başlık", editor.isActive("heading", { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run())}
        {button("Liste", editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run())}
        {button("Alıntı", editor.isActive("blockquote"), () => editor.chain().focus().toggleBlockquote().run())}
        {button("Bağlantı", editor.isActive("link"), () => {
          const previous = editor.getAttributes("link").href as string | undefined;
          const href = window.prompt("Bağlantı", previous ?? "https://");
          if (href === null) return;
          if (href === "") {
            editor.chain().focus().unsetLink().run();
            return;
          }
          editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
        })}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
