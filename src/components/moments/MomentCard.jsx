import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HandHeart, Sparkles, Ear, BookOpen, Flag, Users, MessageCircle, CheckCircle, ChevronDown } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import CommentThread from './CommentThread';
import { Button } from "@/components/ui/button";

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

export default function MomentCard({ moment, index, currentUser }) {
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();
  
  const isEgoAside = moment.type === 'ego_aside';
  const subtype = subtypeConfig[moment.subtype] || subtypeConfig.general;
  const Icon = isEgoAside ? subtype.icon : Sparkles;
  
  const isOwner = moment.created_by === currentUser?.email;
  const isReviewed = moment.reviewed_by === currentUser?.email;
  const canReview = !isOwner && !isReviewed;

  // Fetch comments for this moment
  const { data: comments = [] } = useQuery({
    queryKey: ['comments', moment.id],
    queryFn: () => base44.entities.Comment.filter({ moment_id: moment.id }, '-created_date'),
    enabled: expanded,
  });

  const markReviewedMutation = useMutation({
    mutationFn: () => base44.entities.Moment.update(moment.id, { reviewed_by: currentUser.email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moments'] });
    },
  });

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
          <div className="flex items-center gap-2 mb-1 flex-wrap">
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