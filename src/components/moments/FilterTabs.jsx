import React from 'react';
import { motion } from 'framer-motion';

const filters = [
  { value: 'all', label: 'All' },
  { value: 'ego_aside', label: 'Ego Aside' },
  { value: 'gratitude', label: 'Gratitude' },
];

export default function FilterTabs({ active, onChange }) {
  return (
    <div className="flex gap-1 p-1 bg-stone-100 rounded-xl w-fit">
      {filters.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className="relative px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200"
        >
          {active === value && (
            <motion.div
              layoutId="activeFilter"
              className="absolute inset-0 bg-white rounded-lg shadow-sm"
              transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
            />
          )}
          <span className={`relative z-10 ${active === value ? 'text-stone-800' : 'text-stone-500'}`}>
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}