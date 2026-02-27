import React from 'react';
import { motion } from 'framer-motion';

const typeFilters = [
  { value: 'all', label: 'All' },
  { value: 'ego_aside', label: 'Ego Aside' },
  { value: 'gratitude', label: 'Gratitude' },
];

const ownerFilters = [
  { value: 'all', label: 'All Moments' },
  { value: 'mine', label: 'My Moments' },
  { value: 'partner', label: "Partner's Moments" },
];

export default function FilterTabs({ activeType, activeOwner, onTypeChange, onOwnerChange }) {
  return (
    <div className="space-y-3">
      {/* Owner Filter */}
      <div className="flex gap-1 p-1 bg-stone-100 rounded-xl w-fit">
        {ownerFilters.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onOwnerChange(value)}
            className="relative px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 select-none"
          >
            {activeOwner === value && (
              <motion.div
                layoutId="activeOwner"
                className="absolute inset-0 bg-white rounded-lg shadow-sm"
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              />
            )}
            <span className={`relative z-10 ${activeOwner === value ? 'text-stone-800' : 'text-stone-500'}`}>
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* Type Filter */}
      <div className="flex gap-1 p-1 bg-stone-100 rounded-xl w-fit">
        {typeFilters.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onTypeChange(value)}
            className="relative px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 select-none"
          >
            {activeType === value && (
              <motion.div
                layoutId="activeType"
                className="absolute inset-0 bg-white rounded-lg shadow-sm"
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              />
            )}
            <span className={`relative z-10 ${activeType === value ? 'text-stone-800' : 'text-stone-500'}`}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}