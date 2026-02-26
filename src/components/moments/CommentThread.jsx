import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, User } from 'lucide-react';
import { format } from 'date-fns';

function CommentItem({ comment, currentUser }) {
  const isOwner = comment.created_by === currentUser?.email;
  
  return (
    <div className={`flex gap-3 ${isOwner ? 'flex-row-reverse' : ''}`}>
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center mt-1">
        <User className="w-4 h-4 text-stone-500" />
      </div>
      <div className={`flex-1 ${isOwner ? 'flex flex-col items-end' : ''}`}>
        <div className={`rounded-xl px-3 py-2 max-w-[85%] ${
          isOwner ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-700'
        }`}>
          <p className="text-sm leading-relaxed">{comment.content}</p>
        </div>
        <div className="flex items-center gap-2 mt-1 px-1">
          <span className="text-xs text-stone-400">
            {isOwner ? 'You' : 'Your Partner'}
          </span>
          <span className="text-stone-300">·</span>
          <span className="text-xs text-stone-400">
            {format(new Date(comment.created_date), 'MMM d, h:mm a')}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function CommentThread({ momentId, comments, currentUser }) {
  const [newComment, setNewComment] = useState('');
  const queryClient = useQueryClient();

  const addCommentMutation = useMutation({
    mutationFn: (content) => base44.entities.Comment.create({
      moment_id: momentId,
      content,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', momentId] });
      setNewComment('');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment.trim());
    }
  };

  return (
    <div className="p-4 space-y-4 bg-stone-50/50">
      {comments.length > 0 && (
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} currentUser={currentUser} />
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="resize-none rounded-xl border-stone-200 focus:border-stone-400 min-h-[60px] text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <Button
          type="submit"
          disabled={!newComment.trim() || addCommentMutation.isPending}
          className="h-[60px] px-4 rounded-xl bg-stone-800 hover:bg-stone-900"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}