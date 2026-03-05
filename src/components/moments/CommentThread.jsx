import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, User, Pencil, Trash2, Check, X } from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import MediaUpload from './MediaUpload';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function canEdit(createdDate) {
  return differenceInMinutes(new Date(), new Date(createdDate)) < 10;
}

function CommentItem({ comment, currentUser, momentId }) {
  const isOwner = comment.created_by === currentUser?.email;
  const editable = isOwner && canEdit(comment.created_date);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: () => base44.entities.Comment.update(comment.id, { content: editText.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', momentId] });
      setEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Comment.delete(comment.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', momentId] }),
  });

  const isVideo = (url) => url && url.match(/\.(mp4|mov|webm|ogg)/i);

  return (
    <div className={`flex gap-3 ${isOwner ? 'flex-row-reverse' : ''}`}>
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center mt-1">
        <User className="w-4 h-4 text-stone-500" />
      </div>
      <div className={`flex-1 ${isOwner ? 'flex flex-col items-end' : ''}`}>
        {editing ? (
          <div className="w-full max-w-[85%] space-y-2">
            <Textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              className="resize-none rounded-xl border-stone-200 text-sm min-h-[50px]"
            />
            <div className="flex gap-1">
              <Button size="sm" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="h-7 text-xs rounded-lg bg-stone-800 hover:bg-stone-900 text-white px-3">
                <Check className="w-3 h-3 mr-1" /> Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="h-7 text-xs rounded-lg">
                <X className="w-3 h-3 mr-1" /> Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className={`rounded-xl px-3 py-2 max-w-[85%] ${
              isOwner ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-700'
            }`}>
              <p className="text-sm leading-relaxed">{comment.content}</p>
              {comment.media_url && (
                <div className="mt-1.5 rounded-lg overflow-hidden">
                  {isVideo(comment.media_url)
                    ? <video src={comment.media_url} controls className="max-h-36 w-full object-cover" />
                    : <img src={comment.media_url} alt="attachment" className="max-h-36 w-full object-cover" />
                  }
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 px-1">
              <span className="text-xs text-stone-400">{isOwner ? 'You' : 'Your Partner'}</span>
              <span className="text-stone-300">·</span>
              <span className="text-xs text-stone-400">{format(new Date(comment.created_date), 'MMM d, h:mm a')}</span>
              {editable && (
                <>
                  <button onClick={() => setEditing(true)} className="text-stone-300 hover:text-stone-500 transition-colors">
                    <Pencil className="w-3 h-3" />
                  </button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="text-stone-300 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete comment?</AlertDialogTitle>
                        <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function CommentThread({ momentId, comments, currentUser, moment }) {
  const [newComment, setNewComment] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const queryClient = useQueryClient();

  const addCommentMutation = useMutation({
    mutationFn: () => base44.entities.Comment.create({
      moment_id: momentId,
      content: newComment.trim(),
      media_url: mediaUrl || undefined,
    }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['comments', momentId] });
      const prev = queryClient.getQueryData(['comments', momentId]);
      const optimistic = {
        id: `optimistic-${Date.now()}`,
        moment_id: momentId,
        content: newComment.trim(),
        media_url: mediaUrl || undefined,
        created_date: new Date().toISOString(),
        created_by: '__optimistic__',
      };
      queryClient.setQueryData(['comments', momentId], (old) => [optimistic, ...(old || [])]);
      setNewComment('');
      setMediaUrl('');
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(['comments', momentId], context.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', momentId] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newComment.trim()) addCommentMutation.mutate();
  };

  return (
    <div className="p-4 space-y-4 bg-stone-50/50">
      {comments.length > 0 && (
        <div className="space-y-3">
          {comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} currentUser={currentUser} momentId={momentId} />
          ))}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <div className="flex-1">
          <Textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="resize-none rounded-xl border-stone-200 focus:border-stone-400 min-h-[60px] text-sm"
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
            }}
          />
          <MediaUpload currentUrl={mediaUrl} onUpload={setMediaUrl} onClear={() => setMediaUrl('')} />
        </div>
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