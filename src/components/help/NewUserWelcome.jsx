import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Play, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppTour from './AppTour';

const STORAGE_KEY = 'together_welcome_seen';

export default function NewUserWelcome() {
  const [visible, setVisible] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      // Small delay so the home feed renders first
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  };

  const startTour = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
    setTourOpen(true);
  };

  if (!visible && !tourOpen) return null;

  return (
    <>
      {visible && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm px-4 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="bg-stone-800 px-6 pt-6 pb-5 text-center">
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
                <Heart className="w-7 h-7 text-white" fill="white" />
              </div>
              <h2 className="text-xl font-bold text-white">Welcome to Together</h2>
              <p className="text-stone-400 text-sm mt-1.5 leading-relaxed">
                An app built to support your relationship — not replace it.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-stone-600 leading-relaxed text-center">
                Would you like a quick tour of the app to learn how to use it with intention?
              </p>
              <Button
                onClick={startTour}
                className="w-full bg-stone-800 hover:bg-stone-900 text-white h-11 rounded-xl font-medium"
              >
                <Play className="w-4 h-4 mr-2" />
                Yes, take me on a tour
              </Button>
              <button
                onClick={dismiss}
                className="w-full text-sm text-stone-400 hover:text-stone-600 transition-colors py-2 flex items-center justify-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                Skip for now
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {tourOpen && <AppTour onClose={() => setTourOpen(false)} />}
    </>
  );
}