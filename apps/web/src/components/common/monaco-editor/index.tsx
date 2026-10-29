'use client';

import { useRef, useState } from 'react';
import Editor from '@monaco-editor/react';

interface MonacoHtmlEditorProps {
  initialHtml?: string;
}

export default function MonacoHtmlEditor({ initialHtml = '<h1>Hello Newsletter!</h1>' }: MonacoHtmlEditorProps) {
  const editorRef = useRef<any>(null);
  const [previewHtml, setPreviewHtml] = useState<string>(initialHtml);

  function handleEditorDidMount(editor: any) {
    editorRef.current = editor;
  }

  function showValue() {
    if (editorRef.current) {
      setPreviewHtml(editorRef.current.getValue());
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      <div className="w-1/2 p-8 bg-white border-r border-gray-300 flex flex-col">
        <h2 className="text-xl font-bold mb-4">Paste HTML Code</h2>
        <button onClick={showValue} className="self-start px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
          Show value
        </button>
        <Editor
          height="90vh"
          defaultLanguage="html"
          defaultValue={initialHtml}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
          }}
        />
      </div>
    </div>
  );
}
