import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HandHeart, Sparkles, Ear, BookOpen, Flag, Users, MessageCircle, CheckCircle, ChevronDown, Pencil, Trash2, Star, ShieldAlert, Lock, Share2, Zap, VolumeX, PhoneOff, Frown } from 'lucide-react';
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
  reacted_poorly: { icon: Zap, label: 'Reacted Poorly' },
  was_dismissive: { icon: VolumeX, label: 'Was Dismissive' },
  not_present: { icon: PhoneOff, label: "Wasn't Present" },
  unkind: { icon: Frown, label: 'Was Unkind' },
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

const SWIPE_THRESHOLD = 80;
const DELETE_THRESHOLD = 160;
const EDIT_THRESHOLD = 80; // px right-swipe to reveal edit

export default function MomentCard({ moment, index, currentUser, onDeleted }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [swipeX, setSwipeX] = useState(0); // positive = left swipe (delete), negative = right swipe (edit)
  const [swiping, setSwiping] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const touchStart = useRef(null);
  const queryClient = useQueryClient();

  const isEgoAside = moment.type === 'ego_aside';
  const isReflection = moment.type === 'self_reflection';
  const subtype = subtypeConfig[moment.subtype] || subtypeConfig.general;
  const Icon = isEgoAside ? subtype.icon : isReflection ? ShieldAlert : Sparkles;
  const isOwner = moment.created_by === currentUser?.email;
  const isReviewed = !!moment.reviewed_by;
  const canReview = !isOwner && !isReviewed && !isReflection;
  const isPrivate = moment.is_private && !moment.shared_with_partner;
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
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['moments'] });
      await queryClient.cancelQueries({ queryKey: ['favorites'] });
      const prev = queryClient.getQueryData(['moments']);
      queryClient.setQueryData(['moments'], (old) =>
        old ? old.map(m => m.id === moment.id ? { ...m, is_favorite: !m.is_favorite } : m) : old
      );
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(['moments'], context.prev);
    },
    onSettled: () => {
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

  // Swipe handlers (owner + editable only)
  const onTouchStart = (e) => {
    if (!isOwner || !editable) return;
    touchStart.current = e.touches[0].clientX;
  };

  const onTouchMove = (e) => {
    if (!isOwner || !editable || touchStart.current === null) return;
    const delta = touchStart.current - e.touches[0].clientX;
    setSwiping(true);
    if (delta > 0) {
      // left swipe → delete
      setSwipeX(Math.min(delta, DELETE_THRESHOLD + 10));
    } else {
      // right swipe → edit
      setSwipeX(Math.max(delta, -(EDIT_THRESHOLD + 10)));
    }
  };

  const onTouchEnd = () => {
    if (!isOwner || !editable) return;
    if (swipeX >= DELETE_THRESHOLD) {
      setShowDeleteConfirm(true);
      setSwipeX(SWIPE_THRESHOLD);
    } else if (swipeX > 0 && swipeX < SWIPE_THRESHOLD) {
      setSwipeX(0);
    } else if (swipeX > 0) {
      setSwipeX(SWIPE_THRESHOLD);
    } else if (swipeX <= -EDIT_THRESHOLD) {
      // full right-swipe → open edit
      setSwipeX(0);
      setEditing(true);
    } else {
      setSwipeX(0);
    }
    setSwiping(false);
    touchStart.current = null;
  };

  const resetSwipe = () => setSwipeX(0);

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
  const deleteRevealWidth = swipeX > 0 ? Math.min(swipeX, SWIPE_THRESHOLD + 10) : 0;
  const editRevealWidth = swipeX < 0 ? Math.min(-swipeX, EDIT_THRESHOLD + 10) : 0;

  return (
    <AlertDialog open={showDeleteConfirm} onOpenChange={(open) => { setShowDeleteConfirm(open); if (!open) resetSwipe(); }}>
      <div className="relative rounded-2xl overflow-hidden">
        {/* Edit background — left side (owner + editable) */}
        {isOwner && editable && (
          <div
            className="absolute inset-y-0 left-0 flex items-center justify-center bg-stone-700 rounded-2xl"
            style={{ width: Math.max(editRevealWidth, 0) }}
          >
            <Pencil className="w-5 h-5 text-white select-none" />
          </div>
        )}
        {/* Delete background — right side (owner + editable only) */}
        {isOwner && editable && (
          <div
            className="absolute inset-y-0 right-0 flex items-center justify-center bg-red-500 rounded-2xl"
            style={{ width: Math.max(deleteRevealWidth, 0) }}
          >
            <Trash2 className="w-5 h-5 text-white select-none" />
          </div>
        )}

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0, x: swipeX > 0 ? -swipeX : -swipeX }}
          transition={swiping ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 40, delay: index * 0.05 }}
          className="relative rounded-2xl bg-white border border-stone-200/60 shadow-sm"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onClick={swipeX > 10 ? resetSwipe : undefined}
        >
          <div className="flex gap-4 p-4">
            <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
              isEgoAside ? 'bg-amber-50 text-amber-600' : isReflection ? 'bg-violet-50 text-violet-600' : 'bg-emerald-50 text-emerald-600'
            }`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-semibold uppercase tracking-wider ${
                    isEgoAside ? 'text-amber-600' : isReflection ? 'text-violet-600' : 'text-emerald-600'
                  }`}>
                    {isEgoAside ? subtype.label : isReflection ? (subtypeConfig[moment.subtype]?.label || 'Self Reflection') : 'Gratitude'}
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
                    className={`p-1.5 rounded-lg transition-colors select-none ${
                      moment.is_favorite ? 'text-amber-400' : 'text-stone-300 hover:text-amber-400'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5 select-none" fill={moment.is_favorite ? 'currentColor' : 'none'} />
                  </button>
                  {editable && (
                    <button
                      onClick={() => setEditing(true)}
                      className="p-1.5 rounded-lg text-stone-300 hover:text-stone-600 transition-colors select-none"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isOwner && editable && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="p-1.5 rounded-lg text-stone-300 hover:text-red-500 transition-colors select-none"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
                  onClick={() => { if (swipeX === 0) setExpanded(!expanded); else resetSwipe(); }}
                  className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-700 transition-colors select-none"
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
                    className="h-7 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 select-none"
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                    Mark as Reviewed
                  </Button>
                )}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {expanded && swipeX === 0 && (
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
      </div>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this moment?</AlertDialogTitle>
          <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => { deleteMutation.mutate(); setShowDeleteConfirm(false); }}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}