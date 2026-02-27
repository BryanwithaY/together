import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HandHeart, Sparkles, Ear, BookOpen, Flag, Users, MessageCircle, CheckCircle, ChevronDown, Pencil, Trash2, Star, MoreHorizontal } from 'lucide-react';
import { format, isToday, isYesterday, differenceInMinutes } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import CommentThread from './CommentThread';
import MomentEditForm from './MomentEditForm';
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const subtypeConfig = {
  listened: { icon: Ear, label: 'Listened' },
  learned: { icon: BookOpen, label: 'Learned' },
  admitted_mistake: { icon: Flag, label: 'Admitted a Mistake' },
  let_partner_lead: { icon: Users, label: 'Let Partner Lead' },
  general: { icon: HandHeart, label: 'Ego Aside' },
};

function formatDate(dateStr) {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d, yyyy');
}

function canEdit(createdDate) {
  return differenceInMinutes(new Date(), new Date(createdDate)) < 10;
}

export default function MomentCard({ moment, index, currentUser, onDeleted }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const queryClient = useQueryClient();

  const isEgoAside = moment.type === 'ego_aside';
  const subtype = subtypeConfig[moment.subtype] || subtypeConfig.general;
  const Icon = isEgoAside ? subtype.icon : Sparkles;
  const isOwner = moment.created_by === currentUser?.email;
  const isReviewed = moment.reviewed_by === currentUser?.email;
  const canReview = !isOwner && !isReviewed;
  const editable = isOwner && canEdit(moment.created_date);

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', moment.id],
    queryFn: () => base44.entities.Comment.filter({ moment_id: moment.id }, '-created_date'),
    enabled: expanded,
  });

  const markReviewedMutation = useMutation({
    mutationFn: () => base44.entities.Moment.update(moment.id, { reviewed_by: currentUser.email }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['moments'] }),
  });

  const favoriteMutation = useMutation({
    mutationFn: () => base44.entities.Moment.update(moment.id, { is_favorite: !moment.is_favorite }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moments'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Moment.delete(moment.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moments'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      if (onDeleted) onDeleted();
    },
  });

  if (editing) {
    return (
      <MomentEditForm
        moment={moment}
        onClose={() => setEditing(false)}
        onSaved={() => {
          setEditing(false);
          queryClient.invalidateQueries({ queryKey: ['moments'] });
          queryClient.invalidateQueries({ queryKey: ['favorites'] });
        }}
      />
    );
  }

  const isVideo = (url) => url && url.match(/\.(mp4|mov|webm|ogg)/i);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="group relative rounded-2xl bg-white border border-stone-200/60 shadow-sm hover:shadow-md transition-shadow duration-300"
    >
      <div className="flex gap-4 p-4">
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
          isEgoAside ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
        }`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold uppercase tracking-wider ${
                isEgoAside ? 'text-amber-600' : 'text-emerald-600'
              }`}>
                {isEgoAside ? subtype.label : 'Gratitude'}
              </span>
              <span className="text-stone-300">·</span>
              <span className="text-xs text-stone-400">{formatDate(moment.date)}</span>
              <span className="text-stone-300">·</span>
              <span className="text-xs text-stone-500">{isOwner ? 'You' : 'Your Partner'}</span>
              {isReviewed && (
                <>
                  <span className="text-stone-300">·</span>
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="w-3 h-3" />
                    <span>Reviewed</span>
                  </div>
                </>
              )}
              {moment.is_demo && (
                <span className="text-xs text-stone-300 italic">demo</span>
              )}
            </div>
            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
              <button
                onClick={() => favoriteMutation.mutate()}
                className={`p-1.5 rounded-lg transition-colors ${
                  moment.is_favorite ? 'text-amber-400' : 'text-stone-300 hover:text-amber-400'
                }`}
              >
                <Star className="w-3.5 h-3.5" fill={moment.is_favorite ? 'currentColor' : 'none'} />
              </button>
              {isOwner && (
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="p-1.5 rounded-lg text-stone-300 hover:text-stone-600 transition-colors"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-7 bg-white border border-stone-200 rounded-xl shadow-lg z-10 py-1 min-w-[120px]" onMouseLeave={() => setMenuOpen(false)}>
                      {editable && (
                        <button
                          onClick={() => { setEditing(true); setMenuOpen(false); }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-stone-600 hover:bg-stone-50"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this moment?</AlertDialogTitle>
                            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {moment.what_happened && (
            <div className="mb-2">
              <p className="text-xs font-semibold text-stone-500 mb-1">What happened:</p>
              <p className="text-sm text-stone-600 leading-relaxed">{moment.what_happened}</p>
            </div>
          )}
          {moment.how_it_felt && (
            <div className="mb-2">
              <p className="text-xs font-semibold text-stone-500 mb-1">How it felt:</p>
              <p className="text-sm text-stone-600 leading-relaxed">{moment.how_it_felt}</p>
            </div>
          )}
          {!moment.what_happened && !moment.how_it_felt && (
            <p className="text-sm text-stone-400 italic">No details added</p>
          )}

          {moment.media_url && (
            <div className="mt-2 rounded-xl overflow-hidden border border-stone-100">
              {isVideo(moment.media_url) ? (
                <video src={moment.media_url} controls className="w-full max-h-48 object-cover" />
              ) : (
                <img src={moment.media_url} alt="moment media" className="w-full max-h-48 object-cover" />
              )}
            </div>
          )}

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-700 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
            {canReview && (
              <Button
                onClick={() => markReviewedMutation.mutate()}
                disabled={markReviewedMutation.isPending}
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                Mark as Reviewed
              </Button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-stone-200/60"
          >
            <CommentThread momentId={moment.id} comments={comments} currentUser={currentUser} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}