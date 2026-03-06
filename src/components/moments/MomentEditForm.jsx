import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Save, ShieldAlert } from 'lucide-react';
import MediaUpload from './MediaUpload';
import VoiceInput from '../ui/VoiceInput';

export default function MomentEditForm({ moment, onClose, onSaved }) {
  const isReflection = moment.type === 'self_reflection';

  const [whatHappened, setWhatHappened] = useState(moment.what_happened || '');
  const [howItFelt, setHowItFelt] = useState(moment.how_it_felt || '');
  const [couldHaveDoneBetter, setCouldHaveDoneBetter] = useState(moment.could_have_done_better || '');
  const [showUpNextTime, setShowUpNextTime] = useState(moment.show_up_next_time || '');
  const [mediaUrl, setMediaUrl] = useState(moment.media_url || '');

  const saveMutation = useMutation({
    mutationFn: () => base44.entities.Moment.update(moment.id, {
      what_happened: whatHappened.trim(),
      how_it_felt: howItFelt.trim(),
      ...(isReflection && {
        could_have_done_better: couldHaveDoneBetter.trim() || null,
        show_up_next_time: showUpNextTime.trim() || null,
      }),
      media_url: mediaUrl || null,
    }),
    onSuccess: onSaved,
  });

  return (
    <div className="rounded-2xl bg-white border border-stone-200/60 shadow-lg p-6">
      <div className="flex items-center justify-between mb-5">
        <p className="text-lg font-semibold text-stone-800">Edit Moment</p>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100">
          <X className="w-4 h-4 text-stone-400" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
            What happened? <span className="text-stone-400 font-normal">(optional)</span>
          </p>
          <div className="relative">
            <Textarea
              value={whatHappened}
              onChange={e => setWhatHappened(e.target.value)}
              placeholder={isReflection ? "What did you do or say? Be honest with yourself..." : "Describe the situation..."}
              className="resize-none rounded-xl border-stone-200 focus:border-stone-400 min-h-[120px] text-base pr-12"
              style={{ userSelect: 'text', WebkitUserSelect: 'text', fontSize: '16px' }}
            />
            <div className="absolute bottom-2 right-2">
              <VoiceInput value={whatHappened} onChange={setWhatHappened} />
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
            How did it make you feel? <span className="text-stone-400 font-normal">(optional)</span>
          </p>
          <div className="relative">
            <Textarea
              value={howItFelt}
              onChange={e => setHowItFelt(e.target.value)}
              placeholder={isReflection ? "What would you do differently? What can you learn from this?" : "Share your emotions and reflections..."}
              className="resize-none rounded-xl border-stone-200 focus:border-stone-400 min-h-[120px] text-base pr-12"
              style={{ userSelect: 'text', WebkitUserSelect: 'text', fontSize: '16px' }}
            />
            <div className="absolute bottom-2 right-2">
              <VoiceInput value={howItFelt} onChange={setHowItFelt} />
            </div>
          </div>
        </div>

        {isReflection && (
          <div className="space-y-4 border border-violet-100 bg-violet-50/40 rounded-xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 flex items-center gap-1.5">
              <ShieldAlert className="w-3 h-3" /> Follow-up
            </p>
            <div>
              <p className="text-xs font-semibold text-stone-500 mb-2">
                What could you have done better? <span className="text-stone-400 font-normal">(optional)</span>
              </p>
              <div className="relative">
                <Textarea
                  value={couldHaveDoneBetter}
                  onChange={e => setCouldHaveDoneBetter(e.target.value)}
                  placeholder="Be honest and specific with yourself..."
                  className="resize-none rounded-xl border-violet-200 focus:border-violet-400 min-h-[90px] text-base bg-white pr-12"
                  style={{ userSelect: 'text', WebkitUserSelect: 'text', fontSize: '16px' }}
                />
                <div className="absolute bottom-2 right-2">
                  <VoiceInput value={couldHaveDoneBetter} onChange={setCouldHaveDoneBetter} />
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-500 mb-2">
                How do you hope to show up next time? <span className="text-stone-400 font-normal">(optional)</span>
              </p>
              <div className="relative">
                <Textarea
                  value={showUpNextTime}
                  onChange={e => setShowUpNextTime(e.target.value)}
                  placeholder="What intention do you want to set for similar situations?"
                  className="resize-none rounded-xl border-violet-200 focus:border-violet-400 min-h-[90px] text-base bg-white pr-12"
                  style={{ userSelect: 'text', WebkitUserSelect: 'text', fontSize: '16px' }}
                />
                <div className="absolute bottom-2 right-2">
                  <VoiceInput value={showUpNextTime} onChange={setShowUpNextTime} />
                </div>
              </div>
            </div>
          </div>
        )}

        <MediaUpload currentUrl={mediaUrl} onUpload={setMediaUrl} onClear={() => setMediaUrl('')} />

        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={onClose} className="flex-1 h-11 rounded-xl">Cancel</Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="flex-1 h-11 rounded-xl bg-stone-800 hover:bg-stone-900 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}