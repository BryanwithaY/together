import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const QUOTES = [
  "Small moments, consistently noticed, are the foundation of deep connection.",
  "The ego that steps aside makes room for love to grow.",
  "Gratitude isn't just a feeling — it's a practice you can build.",
  "Noticing how you show up is the first step to showing up better.",
  "Real intimacy grows in the space between reaction and response.",
  "Every relationship is co-created, one moment at a time.",
  "The partner who reflects is the partner who grows.",
  "Accountability without self-compassion is just punishment.",
  "Presence is the rarest gift you can offer someone you love.",
  "What you track, you tend to.",
];

function TypewriterText({ text, onComplete }) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayed('');
    indexRef.current = 0;
    const interval = setInterval(() => {
      indexRef.current += 1;
      setDisplayed(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) {
        clearInterval(interval);
        // Wait 2s after fully typed before calling complete
        if (onComplete) setTimeout(onComplete, 2000);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <span>
      {displayed}
      <span className="animate-pulse">|</span>
    </span>
  );
}

export default function AppLoadingScreen({ onReady }) {
  const [quoteIndex] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const [visible, setVisible] = useState(true);

  const handleComplete = () => {
    setVisible(false);
    // Give the fade-out animation time, then signal ready
    setTimeout(() => {
      if (onReady) onReady();
    }, 400);
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-8">
      {/* Logo / wordmark */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-16 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-stone-800 flex items-center justify-center mx-auto mb-3">
          <span className="text-white text-2xl">✦</span>
        </div>
        <p className="text-xs font-semibold tracking-widest text-stone-400 uppercase">Together</p>
      </motion.div>

      {/* Quote card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="max-w-xs text-center"
      >
        <AnimatePresence mode="wait">
          {visible && (
            <motion.p
              key={quoteIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-lg font-medium text-stone-700 leading-relaxed min-h-[5rem]"
            >
              <TypewriterText text={QUOTES[quoteIndex]} onComplete={handleComplete} />
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Loading dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="mt-16 flex gap-1.5"
      >
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-stone-400"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </motion.div>
    </div>
  );
}