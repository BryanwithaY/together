import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Plus, Settings, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRelTypeInfo } from '../relationships/relationshipUtils';

export default function RelationshipsPanel({ user }) {
  const navigate = useNavigate();
  const myEmail = user?.email?.toLowerCase();

  const { data: allRels = [], isLoading } = useQuery({
    queryKey: ['relationships', myEmail],
    queryFn: async () => {
      const all = await base44.entities.Relationship.list('-created_date', 200);
      return all.filter(r => (r.member_emails || []).some(e => e.toLowerCase() === myEmail));
    },
    enabled: !!myEmail,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-stone-800">Relationships</h2>
        <Button
          onClick={() => navigate(createPageUrl('CreateRelationship'))}
          size="sm"
          variant="outline"
          className="rounded-xl text-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          New
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map(i => <div key={i} className="h-14 rounded-xl bg-stone-100 animate-pulse" />)}
        </div>
      ) : allRels.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-stone-500 mb-3">No relationships yet.</p>
          <Button
            onClick={() => navigate(createPageUrl('CreateRelationship'))}
            className="bg-stone-800 hover:bg-stone-900 text-white rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create your first
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {allRels.map(rel => {
            const info = getRelTypeInfo(rel.type);
            const Icon = info.icon;
            const isOwner = rel.owner_email === myEmail;
            return (
              <div key={rel.id} className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100">
                <div className={`w-9 h-9 rounded-xl ${info.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${info.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-stone-800 truncate">{rel.name}</p>
                    {isOwner && <Crown className="w-3 h-3 text-amber-500 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-stone-400">{info.label} · {(rel.member_emails || []).length}/{rel.max_members} members</p>
                </div>
                <button
                  onClick={() => navigate(createPageUrl(`RelationshipSettings?id=${rel.id}`))}
                  className="p-2 hover:bg-stone-200 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4 text-stone-400" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}