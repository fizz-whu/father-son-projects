import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
  disabled?: boolean;
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Write your content here... (Markdown supported)',
  minRows = 4,
  disabled = false,
}: MarkdownEditorProps) {
  const [isPreview, setIsPreview] = useState(false);

  return (
    <div className="border border-slate-300 rounded-md overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-slate-50 px-3 py-2 border-b border-slate-300">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setIsPreview(false)}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              !isPreview
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setIsPreview(true)}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              isPreview
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Preview
          </button>
        </div>
        <div className="text-xs text-slate-500">
          Markdown supported
        </div>
      </div>

      {/* Editor/Preview */}
      {isPreview ? (
        <div className="p-4 min-h-[120px] prose prose-slate prose-sm max-w-none">
          {value ? (
            <ReactMarkdown>{value}</ReactMarkdown>
          ) : (
            <p className="text-slate-400 italic">Nothing to preview</p>
          )}
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={minRows}
          disabled={disabled}
          className="w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset resize-y disabled:bg-slate-100 disabled:cursor-not-allowed"
        />
      )}

      {/* Quick formatting hints */}
      {!isPreview && (
        <div className="flex gap-4 px-3 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
          <span>**bold**</span>
          <span>*italic*</span>
          <span>`code`</span>
          <span>[link](url)</span>
          <span>- list</span>
        </div>
      )}
    </div>
  );
}

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

export function MarkdownViewer({ content, className = '' }: MarkdownViewerProps) {
  return (
    <div className={`prose prose-slate prose-sm max-w-none ${className}`}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
