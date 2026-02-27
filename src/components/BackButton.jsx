import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function BackButton({ className = '' }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(-1)}
      className={`p-2 hover:bg-stone-100 rounded-lg transition-colors select-none ${className}`}
      aria-label="Go back"
    >
      <ArrowLeft className="w-5 h-5 text-stone-600" />
    </button>
  );
}