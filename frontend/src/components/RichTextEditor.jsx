import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Undo, Redo } from 'lucide-react';

export default function RichTextEditor({ value, onChange, placeholder }) {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;

  const btn = (action, active, icon) => (
    <button
      type="button"
      onClick={action}
      className={`p-1.5 rounded hover:bg-gray-100 ${active ? 'bg-gray-200 text-indigo-600' : 'text-gray-600'}`}
    >
      {icon}
    </button>
  );

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex gap-1 p-2 border-b bg-gray-50 flex-wrap">
        {btn(() => editor.chain().focus().toggleBold().run(), editor.isActive('bold'), <Bold size={15} />)}
        {btn(() => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'), <Italic size={15} />)}
        {btn(() => editor.chain().focus().toggleUnderline().run(), editor.isActive('underline'), <UnderlineIcon size={15} />)}
        <div className="w-px bg-gray-300 mx-1" />
        {btn(() => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'), <List size={15} />)}
        {btn(() => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'), <ListOrdered size={15} />)}
        <div className="w-px bg-gray-300 mx-1" />
        {btn(() => editor.chain().focus().undo().run(), false, <Undo size={15} />)}
        {btn(() => editor.chain().focus().redo().run(), false, <Redo size={15} />)}
      </div>
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-3 min-h-[120px] focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[100px]"
      />
    </div>
  );
}
