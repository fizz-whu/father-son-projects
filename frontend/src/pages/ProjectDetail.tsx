import { useState, useEffect, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import DNATranslator from '../components/DNATranslator';
import type { Project, Comment } from '../types';
import { getProject, getComments, createComment, updateProject } from '../api';
import { useAuth } from '../context/AuthContext';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      const [projectData, commentsData] = await Promise.all([
        getProject(id!),
        getComments(id!),
      ]);
      setProject(projectData);
      setComments(commentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const comment = await createComment(id!, newComment);
      setComments([...comments, comment]);
      setNewComment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async () => {
    if (!project) return;
    try {
      const newStatus = project.status === 'active' ? 'completed' : 'active';
      const updated = await updateProject(id!, { status: newStatus });
      setProject(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-8 text-slate-600">Loading...</div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="bg-red-100 text-red-700 p-4 rounded">
          Project not found
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Link
        to="/"
        className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
      >
        &larr; Back to Projects
      </Link>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{project.title}</h1>
            <p className="text-slate-600 mt-2 whitespace-pre-wrap">{project.description}</p>
          </div>
          <button
            onClick={toggleStatus}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              project.status === 'completed'
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            {project.status === 'completed' ? 'Reopen' : 'Mark Complete'}
          </button>
        </div>
        <div className="mt-4 text-sm text-slate-500">
          Created {formatDate(project.createdAt)}
        </div>
      </div>

      <DNATranslator />

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Discussion</h2>
        </div>

        <div className="divide-y divide-slate-200">
          {comments.length === 0 ? (
            <div className="p-4 text-center text-slate-500">
              No comments yet. Start the discussion!
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-slate-800">
                    {comment.authorName}
                  </span>
                  <span className="text-sm text-slate-500">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                <p className="text-slate-700 whitespace-pre-wrap">{comment.content}</p>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSubmitComment} className="p-4 border-t border-slate-200">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={`Add a comment as ${user?.name}...`}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            required
          />
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
