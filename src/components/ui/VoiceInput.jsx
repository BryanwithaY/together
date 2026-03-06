import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

/**
 * VoiceInput - streams dictated speech live into a field as you speak.
 *
 * Props:
 *   value       - current value of the field (so we can append to it)
 *   onChange    - setter called with the full new string during + after dictation
 *   className   - optional extra classes for the button
 *   accentColor - tailwind bg class when recording (default 'bg-red-500')
 */
export default function VoiceInput({ value = '', onChange, className = '', accentColor = 'bg-red-500' }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recogRef = useRef(null);
  const baseRef = useRef('');       // field value at the moment recording started
  const committedRef = useRef('');  // finals accumulated during this session

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

    // Snapshot the current field value so we can non-destructively append
    baseRef.current = value;
    committedRef.current = '';

    recog.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          committedRef.current += (committedRef.current ? ' ' : '') + t.trim();
        } else {
          interim += t;
        }
      }

      const live = [baseRef.current, committedRef.current + (interim ? ' ' + interim.trim() : '')]
        .filter(Boolean)
        .join(' ');

      onChange(live);
    };

    recog.onend = () => {
      setListening(false);
      // Settle to finals only (drop any trailing interim)
      const final = [baseRef.current, committedRef.current].filter(Boolean).join(' ');
      onChange(final);
    };

    recog.onerror = () => {
      setListening(false);
    };

    recogRef.current = recog;
    recog.start();
    setListening(true);
  };

  const stop = () => {
    recogRef.current?.stop();
  };

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