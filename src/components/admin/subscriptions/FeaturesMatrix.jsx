import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Check, X, Pencil, CheckSquare, Square } from 'lucide-react';

function FeatureForm({ feature, onSave, onCancel }) {
  const [form, setForm] = useState(feature || { key: '', label: '', description: '', category: 'other', is_active: true });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="bg-stone-50 rounded-xl p-3 space-y-2 border border-stone-200">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium text-stone-500">Key (code)</label>
          <input className="w-full mt-1 px-2 py-1.5 rounded-lg border border-stone-200 text-xs font-mono" value={form.key} onChange={e => set('key', e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-stone-500">Label</label>
          <input className="w-full mt-1 px-2 py-1.5 rounded-lg border border-stone-200 text-xs" value={form.label} onChange={e => set('label', e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-stone-500">Category</label>
          <select className="w-full mt-1 px-2 py-1.5 rounded-lg border border-stone-200 text-xs" value={form.category} onChange={e => set('category', e.target.value)}>
            {['moments','relationships','analytics','export','media','partner','other'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-stone-500">Description</label>
          <input className="w-full mt-1 px-2 py-1.5 rounded-lg border border-stone-200 text-xs" value={form.description || ''} onChange={e => set('description', e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={() => onSave(form)}><Check className="w-3 h-3" /> Save</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}><X className="w-3 h-3" /> Cancel</Button>
      </div>
    </div>
  );
}

export default function FeaturesMatrix() {
  const qc = useQueryClient();
  const [addingFeature, setAddingFeature] = useState(false);
  const [editingFeature, setEditingFeature] = useState(null);

  const { data: plans = [] } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: () => base44.entities.SubscriptionPlan.list('sort_order')
  });

  const { data: features = [] } = useQuery({
    queryKey: ['admin-features'],
    queryFn: () => base44.entities.SubscriptionFeature.list()
  });

  const { data: tierFeatures = [] } = useQuery({
    queryKey: ['admin-tier-features'],
    queryFn: () => base44.entities.SubscriptionTierFeature.list()
  });

  const saveFeat = useMutation({
    mutationFn: (f) => f.id ? base44.entities.SubscriptionFeature.update(f.id, f) : base44.entities.SubscriptionFeature.create(f),
    onSuccess: () => { qc.invalidateQueries(['admin-features']); setAddingFeature(false); setEditingFeature(null); }
  });

  const toggleTier = useMutation({
    mutationFn: async ({ plan_slug, feature_key, currentEnabled }) => {
      const existing = tierFeatures.find(tf => tf.plan_slug === plan_slug && tf.feature_key === feature_key);
      if (existing) {
        return base44.entities.SubscriptionTierFeature.update(existing.id, { enabled: !currentEnabled });
      } else {
        return base44.entities.SubscriptionTierFeature.create({ plan_slug, feature_key, enabled: true });
      }
    },
    onSuccess: () => qc.invalidateQueries(['admin-tier-features'])
  });

  const isEnabled = (plan_slug, feature_key) => {
    const tf = tierFeatures.find(t => t.plan_slug === plan_slug && t.feature_key === feature_key);
    return tf ? tf.enabled : false;
  };

  const CATEGORIES = ['moments','relationships','analytics','export','media','partner','other'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-stone-800">Feature Matrix</h3>
        <Button size="sm" onClick={() => setAddingFeature(true)}><Plus className="w-3.5 h-3.5" /> Add Feature</Button>
      </div>

      {addingFeature && (
        <FeatureForm onSave={f => saveFeat.mutate(f)} onCancel={() => setAddingFeature(false)} />
      )}

      {/* Matrix Table */}
      <div className="overflow-x-auto rounded-xl border border-stone-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-200">
              <th className="text-left px-4 py-2.5 font-medium text-stone-600 w-48">Feature</th>
              {plans.map(p => (
                <th key={p.id} className="px-3 py-2.5 font-medium text-stone-600 text-center min-w-[80px]">
                  <div>{p.name}</div>
                  <div className="text-xs font-normal text-stone-400">{p.price_usd > 0 ? `$${p.price_usd}` : 'Free'}</div>
                </th>
              ))}
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map(cat => {
              const catFeatures = features.filter(f => f.category === cat);
              if (catFeatures.length === 0) return null;
              return (
                <React.Fragment key={cat}>
                  <tr className="bg-stone-50/50">
                    <td colSpan={plans.length + 2} className="px-4 py-1 text-xs font-semibold text-stone-400 uppercase tracking-wider">{cat}</td>
                  </tr>
                  {catFeatures.map(feat => (
                    <tr key={feat.id} className="border-t border-stone-100 hover:bg-stone-50/50">
                      <td className="px-4 py-2">
                        {editingFeature?.id === feat.id ? (
                          <FeatureForm feature={feat} onSave={f => saveFeat.mutate({ ...f, id: feat.id })} onCancel={() => setEditingFeature(null)} />
                        ) : (
                          <div>
                            <div className="font-medium text-stone-700">{feat.label}</div>
                            <div className="font-mono text-xs text-stone-400">{feat.key}</div>
                          </div>
                        )}
                      </td>
                      {plans.map(plan => {
                        const enabled = isEnabled(plan.slug, feat.key);
                        return (
                          <td key={plan.id} className="px-3 py-2 text-center">
                            <button
                              onClick={() => toggleTier.mutate({ plan_slug: plan.slug, feature_key: feat.key, currentEnabled: enabled })}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto transition-colors ${enabled ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'bg-stone-100 text-stone-300 hover:bg-stone-200'}`}
                            >
                              {enabled ? <Check className="w-3.5 h-3.5" /> : <X className="w-3 h-3" />}
                            </button>
                          </td>
                        );
                      })}
                      <td className="px-2">
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setEditingFeature(feat)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}