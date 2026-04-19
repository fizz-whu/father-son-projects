import { useState } from 'react';
import type { Phase, Attachment } from '../types';
import { useAuth } from '../context/AuthContext';
import { MarkdownViewer } from './MarkdownEditor';
import MarkdownEditor from './MarkdownEditor';

interface PhaseCardProps {
  phase: Phase;
  onSubmit: (phaseId: string, content: string, attachments: Attachment[]) => Promise<void>;
  onUpdateStatus: (phaseId: string, status: Phase['status']) => Promise<void>;
  isSubmitting?: boolean;
}

const statusConfig = {
  pending: { label: 'Not Started', bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' },
  in_progress: { label: 'In Progress', bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  submitted: { label: 'Submitted', bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  completed: { label: 'Completed', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
};

export default function PhaseCard({ phase, onSubmit, onUpdateStatus, isSubmitting }: PhaseCardProps) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [submitContent, setSubmitContent] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const config = statusConfig[phase.status];
  const canSubmit = user?.role === 'domi' && (phase.status === 'pending' || phase.status === 'in_progress');
  const canMarkComplete = user?.role === 'qi' && phase.status === 'submitted';

  const handleAddLink = () => {
    if (!linkUrl.trim()) return;
    const attachment: Attachment = {
      id: crypto.randomUUID(),
      title: linkTitle || linkUrl,
      url: linkUrl,
      type: linkUrl.includes('docs.google') ? 'google-doc' : linkUrl.includes('github.com') ? 'github' : 'link',
      addedAt: new Date().toISOString(),
    };
    setAttachments([...attachments, attachment]);
    setLinkUrl('');
    setLinkTitle('');
  };

  const handleSubmit = async () => {
    await onSubmit(phase.id, submitContent, attachments);
    setShowSubmitForm(false);
    setSubmitContent('');
    setAttachments([]);
  };

  const handleStartPhase = async () => {
    await onUpdateStatus(phase.id, 'in_progress');
  };

  const handleMarkComplete = async () => {
    await onUpdateStatus(phase.id, 'completed');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow border-l-4 border-l-slate-300" style={{
      borderLeftColor: config.dot.replace('bg-', '').includes('slate') ? '#94a3b8' :
        config.dot.replace('bg-', '').includes('blue') ? '#3b82f6' :
        config.dot.replace('bg-', '').includes('yellow') ? '#eab308' : '#22c55e'
    }}>
      {/* Header */}
      <div
        className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-500">Phase {phase.order + 1}</span>
            <h3 className="font-semibold text-slate-800">{phase.name}</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-2 py-1 text-xs rounded ${config.bg} ${config.text}`}>
              {config.label}
            </span>
            <svg
              className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {phase.dueDate && (
          <div className="mt-1 text-sm text-slate-500">
            Due: {formatDate(phase.dueDate)}
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-slate-100">
          {/* Description */}
          {phase.description && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-slate-700 mb-2">Description</h4>
              <MarkdownViewer content={phase.description} className="text-slate-600" />
            </div>
          )}

          {/* Submission */}
          {phase.submission && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-slate-700">Submission</h4>
                <span className="text-xs text-slate-500">
                  Submitted {formatDate(phase.submission.submittedAt)}
                </span>
              </div>
              <MarkdownViewer content={phase.submission.content} />
              {phase.submission.attachments.length > 0 && (
                <div className="mt-3">
                  <h5 className="text-xs font-medium text-slate-600 mb-2">Attachments</h5>
                  <div className="flex flex-wrap gap-2">
                    {phase.submission.attachments.map(att => (
                      <a
                        key={att.id}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded text-sm text-blue-600 hover:bg-blue-50"
                      >
                        {att.type === 'github' && (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                          </svg>
                        )}
                        {att.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            {phase.status === 'pending' && canSubmit && (
              <button
                onClick={handleStartPhase}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                Start Phase
              </button>
            )}
            {canSubmit && !showSubmitForm && (
              <button
                onClick={() => setShowSubmitForm(true)}
                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
              >
                Submit Work
              </button>
            )}
            {canMarkComplete && (
              <button
                onClick={handleMarkComplete}
                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
              >
                Mark Complete
              </button>
            )}
          </div>

          {/* Submit Form */}
          {showSubmitForm && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg">
              <h4 className="text-sm font-medium text-slate-700 mb-3">Submit Your Work</h4>
              <MarkdownEditor
                value={submitContent}
                onChange={setSubmitContent}
                placeholder="Describe what you've done, what you learned, and any questions..."
              />

              {/* Add Link */}
              <div className="mt-4">
                <h5 className="text-xs font-medium text-slate-600 mb-2">Add Links (optional)</h5>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={linkTitle}
                    onChange={(e) => setLinkTitle(e.target.value)}
                    placeholder="Link title"
                    className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddLink}
                    className="px-3 py-1.5 bg-slate-200 text-slate-700 text-sm rounded hover:bg-slate-300"
                  >
                    Add
                  </button>
                </div>
                {attachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {attachments.map(att => (
                      <span
                        key={att.id}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded text-sm"
                      >
                        {att.title}
                        <button
                          onClick={() => setAttachments(attachments.filter(a => a.id !== att.id))}
                          className="text-slate-400 hover:text-red-500"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !submitContent.trim()}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
                <button
                  onClick={() => {
                    setShowSubmitForm(false);
                    setSubmitContent('');
                    setAttachments([]);
                  }}
                  className="px-4 py-2 bg-slate-200 text-slate-700 text-sm rounded hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
