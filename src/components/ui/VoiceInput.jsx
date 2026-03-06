import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

/**
 * VoiceInput - a mic button that appends dictated speech to a text field.
 * Props:
 *   onTranscript(text) - called with the final transcript to append
 *   className - optional extra classes for the button
 *   accentColor - tailwind bg color class when recording, defaults to 'bg-red-500'
 */
export default function VoiceInput({ onTranscript, className = '', accentColor = 'bg-red-500' }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recogRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) setSupported(true);
  }, []);

  if (!supported) return null;

  const start = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recog = new SR();
    recog.lang = navigator.language || 'en-US';
    recog.interimResults = false;
    recog.continuous = false;

    recog.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(r => r[0].transcript)
        .join(' ')
        .trim();
      if (transcript) onTranscript(transcript);
    };

    recog.onend = () => setListening(false);
    recog.onerror = () => setListening(false);

    recogRef.current = recog;
    recog.start();
    setListening(true);
  };

  const stop = () => {
    recogRef.current?.stop();
    setListening(false);
  };

  return (
    <button
      type="button"
      onMouseDown={start}
      onMouseUp={stop}
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