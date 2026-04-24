import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TaskComment } from '../types';
import { timeAgo } from '../utils/timeAgo';

function authorColor(author: string): string {
  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
    '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
  ];
  let hash = 0;
  for (let i = 0; i < author.length; i++) {
    hash = author.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

interface Props {
  taskId: string;
}

export function CommentThread({ taskId }: Props) {
  const { activeProjectId } = useApp();
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const handlePost = async () => {
    if (!body.trim() || !activeProjectId) return;
    setPosting(true);
    try {
      const now = new Date().toISOString();
      const comment: TaskComment = {
        id: crypto.randomUUID(),
        taskId,
        projectId: activeProjectId,
        author: 'user',
        authorType: 'user',
        body: body.trim(),
        createdAt: now,
        updatedAt: now,
      };
      setComments(prev => [...prev, comment]);
      setBody('');
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingIds(prev => new Set([...prev, id]));
    setComments(prev => prev.filter(c => c.id !== id));
    setDeletingIds(prev => { const next = new Set(prev); next.delete(id); return next; });
  };

  return (
    <div className="space-y-4">
      {/* Comment list */}
      {comments.length === 0 ? (
        <p className="text-xs py-4 text-center" style={{ color: '#a1a1aa' }}>
          No comments yet. Be the first to comment.
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => {
            const initials = comment.author === 'user'
              ? 'U'
              : comment.author.slice(0, 2).toUpperCase();
            const accentColor = authorColor(comment.author);
            const isOwn = comment.authorType === 'user';
            return (
              <div
                key={comment.id}
                className="flex gap-2.5"
                onMouseEnter={() => setHoveredId(comment.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Avatar */}
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[0.6rem] font-bold"
                  style={{ background: accentColor, color: '#ffffff' }}
                >
                  {initials}
                </div>

                {/* Bubble */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[0.7rem] font-semibold" style={{ color: '#0f0f0f' }}>
                      {comment.author === 'user' ? 'You' : comment.author}
                    </span>
                    <span className="text-[0.65rem]" style={{ color: '#a1a1aa' }}>
                      {timeAgo(comment.createdAt)}
                    </span>
                    {isOwn && hoveredId === comment.id && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        disabled={deletingIds.has(comment.id)}
                        className="ml-auto p-0.5 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ color: '#a1a1aa' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#be123c';
                          e.currentTarget.style.background = '#fff1f2';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#a1a1aa';
                          e.currentTarget.style.background = 'transparent';
                        }}
                        title="Delete comment"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <p
                    className="text-xs leading-relaxed"
                    style={{
                      color: '#3f3f46',
                      background: '#f4f4f5',
                      borderRadius: '4px',
                      padding: '6px 8px',
                    }}
                  >
                    {comment.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Input */}
      <div
        className="pt-3"
        style={{ borderTop: '1px solid #e4e4e7' }}
      >
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handlePost();
            }
          }}
          placeholder="Write a comment... (Cmd+Enter to post)"
          rows={2}
          className="w-full text-xs px-3 py-2 resize-none outline-none"
          style={{
            background: '#fafafa',
            border: '1px solid #e4e4e7',
            borderRadius: '4px',
            color: '#0f0f0f',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#a1a1aa')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#e4e4e7')}
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={handlePost}
            disabled={!body.trim() || posting}
            className="px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: '#0f0f0f',
              color: '#ffffff',
              borderRadius: '4px',
              border: 'none',
            }}
          >
            {posting ? 'Posting...' : 'Add Comment'}
          </button>
        </div>
      </div>
    </div>
  );
}
