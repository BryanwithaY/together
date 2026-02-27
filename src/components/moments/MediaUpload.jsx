import React, { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Paperclip, X, Loader2 } from 'lucide-react';

export default function MediaUpload({ onUpload, currentUrl, onClear }) {
  const inputRef = useRef();
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onUpload(file_url);
    setUploading(false);
  };

  if (currentUrl) {
    const isVideo = currentUrl.match(/\.(mp4|mov|webm|ogg)/i);
    return (
      <div className="relative mt-2 rounded-xl overflow-hidden border border-stone-200">
        {isVideo ? (
          <video src={currentUrl} controls className="w-full max-h-48 object-cover" />
        ) : (
          <img src={currentUrl} alt="attachment" className="w-full max-h-48 object-cover" />
        )}
        <button
          onClick={onClear}
          className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors mt-1"
      >
        {uploading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Paperclip className="w-3.5 h-3.5" />
        )}
        {uploading ? 'Uploading...' : 'Attach photo / video'}
      </button>
    </div>
  );
}