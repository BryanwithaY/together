import React from 'react';
import { Crown, Shield, User, Eye } from 'lucide-react';
import { ROLE_LABELS } from '@/lib/permissions';

const config = {
  owner:     { icon: Crown,  className: 'text-amber-600 bg-amber-50 border-amber-200' },
  admin:     { icon: Shield, className: 'text-sky-600 bg-sky-50 border-sky-200' },
  member:    { icon: User,   className: 'text-stone-500 bg-stone-50 border-stone-200' },
  read_only: { icon: Eye,    className: 'text-violet-500 bg-violet-50 border-violet-200' },
};

export default function MemberRoleBadge({ role = 'member', size = 'sm' }) {
  const { icon: Icon, className } = config[role] ?? config.member;
  return (
    <span className={`inline-flex items-center gap-1 border rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      <Icon className="w-3 h-3" />
      {ROLE_LABELS[role]}
    </span>
  );
}