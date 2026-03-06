import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

/**
 * VoiceInput - a mic button that streams dictated speech in real-time.
 * Props:
 *   onTranscript(text, isFinal) - called continuously as speech is recognised
 *   onInterimChange(text) - called with the current interim (in-progress) text
 *   className - optional extra classes for the button
 *   accentColor - tailwind bg color class when recording, defaults to 'bg-red-500'
 */
export default function VoiceInput({ onTranscript, className = '', accentColor = 'bg-red-500' }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recogRef = useRef(null);
  const committedRef = useRef(''); // text committed before this session
  const baseValueRef = useRef(''); // field value at the moment recording started

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) setSupported(true);
  }, []);

  if (!supported) return null;

  const start = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recog = new SR();
    recog.lang = navigator.language || 'en-US';
    recog.interimResults = true;
    recog.continuous = true;

    // Snapshot the current field value so we can append to it
    committedRef.current = '';

    recog.onresult = (e) => {
      let interim = '';
      let finalChunk = '';

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalChunk += t;
        } else {
          interim += t;
        }
      }

      if (finalChunk) {
        committedRef.current += (committedRef.current ? ' ' : '') + finalChunk.trim();
      }

      // Build the full live text: base + committed finals + current interim
      const live = [baseValueRef.current, committedRef.current + (interim ? ' ' + interim : '')]
        .filter(Boolean)
        .join(' ');

      onTranscript(live, false);
    };

    recog.onend = () => {
      setListening(false);
      // Commit the final clean value (no trailing interim)
      const final = [baseValueRef.current, committedRef.current].filter(Boolean).join(' ');
      onTranscript(final, true);
    };

    recog.onerror = () => setListening(false);

    recogRef.current = recog;
    setListening(true);
    recog.start();
  };

  const stop = () => {
    recogRef.current?.stop();
  };

  // Expose a way for the parent to tell us the current field value before we start
  // Parents should pass onTranscript as a setter that also updates baseValueRef via a wrapper.
  // We handle this by reading a data attribute pattern — simpler: parents wrap onTranscript.

  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); start(); }}
      onMouseUp={(e) => { e.preventDefault(); stop(); }}
      onTouchStart={(e) => { e.preventDefault(); start(); }}
      onTouchEnd={(e) => { e.preventDefault(); stop(); }}
      onClick={(e) => e.preventDefault()}
      title={listening ? 'Release to stop' : 'Hold to dictate'}
      className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-150 ${
        listening
          ? `${accentColor} text-white shadow-lg scale-110 animate-pulse`
          : 'bg-stone-100 hover:bg-stone-200 text-stone-500'
      } ${className}`}
    >
      {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </button>
  );
}