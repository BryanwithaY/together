import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Grid3x3, AlertTriangle, Map, ClipboardCheck } from 'lucide-react';
import { useRelationship } from '@/components/relationship/RelationshipContext';
import MarkdownSection from '@/components/admin/stewardship/MarkdownSection';
import { doctrineMarkdown } from '@/components/admin/stewardship/doctrineMarkdown';
import { matrixMarkdown } from '@/components/admin/stewardship/matrixMarkdown';
import { gapAnalysisMarkdown } from '@/components/admin/stewardship/gapAnalysisMarkdown';
import { roadmapMarkdown } from '@/components/admin/stewardship/roadmapMarkdown';
import { auditMarkdown } from '@/components/admin/stewardship/auditMarkdown';

// Same admin gate used by the Admin dashboard — platform admins only.
const SYSTEM_ADMIN_EMAILS = ['bryan.atkins@gmail.com'];

const TABS = [
  { id: 'doctrine', label: 'Doctrine', icon: BookOpen, content: doctrineMarkdown },
  { id: 'matrix', label: 'Data Matrix', icon: Grid3x3, content: matrixMarkdown },
  { id: 'gaps', label: 'Gap Analysis', icon: AlertTriangle, content: gapAnalysisMarkdown },
  { id: 'roadmap', label: 'Roadmap', icon: Map, content: roadmapMarkdown },
  { id: 'audit', label: 'Package Audit', icon: ClipboardCheck, content: auditMarkdown },
];

export default function StewardshipDoctrine() {
  const { currentUser } = useRelationship();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('doctrine');

  const isAdmin = currentUser && SYSTEM_ADMIN_EMAILS.includes(currentUser.email);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-500 font-medium">Admin access only</p>
        </div>
      </div>
    );
  }

  const active = TABS.find(t => t.id === activeTab);

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-white border-b border-stone-200/60 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-stone-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-stone-800">Stewardship Doctrine</h1>
            <p className="text-xs text-stone-400">Internal — platform admin only</p>
          </div>
        </div>
        <div className="max-w-2xl mx-auto overflow-x-auto">
          <div className="flex gap-1 px-4 min-w-max">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === t.id
                    ? 'border-stone-800 text-stone-800'
                    : 'border-transparent text-stone-400 hover:text-stone-600'
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl border border-stone-200/60 p-5">
          <MarkdownSection content={active.content} />
        </div>
      </div>
    </div>
  );
}