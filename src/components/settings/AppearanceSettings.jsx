import React from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sun, Moon, Monitor } from 'lucide-react';

const themes = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'system', icon: Monitor, label: 'System' },
];

export default function AppearanceSettings({ user }) {
  const queryClient = useQueryClient();

  const updateThemeMutation = useMutation({
    mutationFn: (theme) => base44.auth.updateMe({ theme }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  return (
    <div>
      <h3 className="text-sm font-semibold text-stone-700 mb-4">Theme</h3>
      <div className="grid grid-cols-3 gap-3">
        {themes.map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            onClick={() => updateThemeMutation.mutate(value)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
              (user?.theme || 'system') === value
                ? 'border-stone-800 bg-stone-50'
                : 'border-stone-200 hover:border-stone-300'
            }`}
          >
            <Icon className={`w-6 h-6 ${
              (user?.theme || 'system') === value ? 'text-stone-800' : 'text-stone-400'
            }`} />
            <span className={`text-sm font-medium ${
              (user?.theme || 'system') === value ? 'text-stone-800' : 'text-stone-600'
            }`}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}