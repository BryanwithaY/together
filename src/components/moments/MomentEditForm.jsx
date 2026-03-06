import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Save } from 'lucide-react';
import MediaUpload from './MediaUpload';
import VoiceInput from '../ui/VoiceInput';

export default function MomentEditForm({ moment, onClose, onSaved }) {
  const [whatHappened, setWhatHappened] = useState(moment.what_happened || '');
  const [howItFelt, setHowItFelt] = useState(moment.how_it_felt || '');
  const [mediaUrl, setMediaUrl] = useState(moment.media_url || '');

  const saveMutation = useMutation({
    mutationFn: () => base44.entities.Moment.update(moment.id, {
      what_happened: whatHappened.trim(),
      how_it_felt: howItFelt.trim(),
      media_url: mediaUrl || null,
    }),
    onSuccess: onSaved,
  });

  return (
    <div className="rounded-2xl bg-white border border-stone-200/60 shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-stone-700">Edit Moment</p>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-stone-100">
          <X className="w-4 h-4 text-stone-400" />
        </button>
      </div>
      <div className="space-y-3">
        <div className="relative">
          <Textarea
            value={whatHappened}
            onChange={e => setWhatHappened(e.target.value)}
            placeholder="What happened?"
            className="resize-none rounded-xl border-stone-200 text-sm min-h-[60px] pr-12"
          />
          <div className="absolute bottom-2 right-2">
            <VoiceInput onTranscript={t => setWhatHappened(prev => prev ? prev + ' ' + t : t)} />
          </div>
        </div>
        <div className="relative">
          <Textarea
            value={howItFelt}
            onChange={e => setHowItFelt(e.target.value)}
            placeholder="How did it feel?"
            className="resize-none rounded-xl border-stone-200 text-sm min-h-[60px] pr-12"
          />
          <div className="absolute bottom-2 right-2">
            <VoiceInput onTranscript={t => setHowItFelt(prev => prev ? prev + ' ' + t : t)} />
          </div>
        </div>
        <MediaUpload
          currentUrl={mediaUrl}
          onUpload={setMediaUrl}
          onClear={() => setMediaUrl('')}
        />
        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={onClose} className="flex-1 h-9 rounded-xl text-sm">Cancel</Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="flex-1 h-9 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-sm">
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}