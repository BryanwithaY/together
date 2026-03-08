import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Download, Calendar, FileText, FileJson, Mail, Repeat } from 'lucide-react';
import { format } from 'date-fns';

function defaultStartDate() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().split('T')[0];
}

export default function FacilitatorExportPanel({ relationshipId, relationshipName, facilitatorRelationship }) {
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [exportFormat, setExportFormat] = useState('csv');
  const [loading, setLoading] = useState(false);
  const [reportSchedule, setReportSchedule] = useState(facilitatorRelationship?.report_schedule || 'none');
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleSaved, setScheduleSaved] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    const res = await base44.functions.invoke('exportFacilitatorReport', {
      relationship_id: relationshipId,
      start_date: startDate,
      end_date: endDate
    });
    const data = res.data;
    const filename = `together-${(relationshipName || 'report').replace(/\s+/g, '-')}-${startDate}-to-${endDate}`;
    if (exportFormat === 'json') {
      downloadJSON(data, filename + '.json');
    } else {
      downloadCSV(data, filename + '.csv');
    }
    setLoading(false);
  };

  const downloadJSON = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    triggerDownload(blob, filename);
  };

  const downloadCSV = (data, filename) => {
    const { moments = [], stats = {}, members = [], notes = [], period } = data;
    const lines = [];

    lines.push(`# Together Facilitator Report`);
    lines.push(`# Relationship: ${relationshipName || 'Unknown'}`);
    lines.push(`# Period: ${period?.start_date} to ${period?.end_date}`);
    lines.push(`# Generated: ${new Date().toLocaleDateString()}`);
    lines.push('');

    lines.push('## SUMMARY');
    lines.push(`Total Moments,${stats.total_moments || 0}`);
    lines.push(`Ego Aside,${stats.ego_aside_count || 0}`);
    lines.push(`Gratitude,${stats.gratitude_count || 0}`);
    lines.push(`Self Reflection,${stats.self_reflection_count || 0}`);
    lines.push(`Conflict Moments,${stats.conflict_count || 0}`);
    lines.push('');

    lines.push('## MEMBER ACTIVITY');
    lines.push('Member,Total Moments,Last Activity');
    members.forEach(m => {
      const act = stats.member_activity?.[m.user_email] || {};
      const lastAct = act.last_activity ? format(new Date(act.last_activity), 'MMM d yyyy') : 'None';
      lines.push(`"${act.display_name || m.user_email}",${act.total || 0},"${lastAct}"`);
    });
    lines.push('');

    lines.push('## MOMENTS');
    lines.push('Date,Member,Type,Subtype,What Happened,How It Felt,Could Have Done Better,Show Up Next Time');
    moments.forEach(m => {
      const name = stats.member_activity?.[m.created_by]?.display_name || m.created_by;
      const row = [
        m.date ? format(new Date(m.date), 'yyyy-MM-dd') : '',
        `"${name}"`,
        m.type?.replace(/_/g, ' ') || '',
        m.subtype?.replace(/_/g, ' ') || '',
        `"${(m.what_happened || '').replace(/"/g, '""')}"`,
        `"${(m.how_it_felt || '').replace(/"/g, '""')}"`,
        `"${(m.could_have_done_better || '').replace(/"/g, '""')}"`,
        `"${(m.show_up_next_time || '').replace(/"/g, '""')}"`,
      ].join(',');
      lines.push(row);
    });

    if (notes.length > 0) {
      lines.push('');
      lines.push('## SESSION NOTES (PRIVATE — DO NOT SHARE)');
      lines.push('Date,Notes,Tags');
      notes.forEach(n => {
        lines.push([
          n.session_date ? format(new Date(n.session_date), 'yyyy-MM-dd') : '',
          `"${(n.content || '').replace(/"/g, '""')}"`,
          `"${(n.tags || []).join(', ')}"`,
        ].join(','));
      });
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, filename);
  };

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveSchedule = async () => {
    if (!facilitatorRelationship?.id) return;
    setSavingSchedule(true);
    await base44.entities.FacilitatorRelationship.update(facilitatorRelationship.id, {
      report_schedule: reportSchedule
    });
    setSavingSchedule(false);
    setScheduleSaved(true);
    setTimeout(() => setScheduleSaved(false), 2500);
  };

  return (
    <div className="space-y-5">
      {/* On-demand export */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-4">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" /> Report Period
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-stone-500 mb-1 block">From</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-stone-500 mb-1 block">To</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <p className="text-xs text-stone-500 mb-2">Export Format</p>
          <div className="flex gap-2">
            <button
              onClick={() => setExportFormat('csv')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border text-xs font-medium transition-colors ${
                exportFormat === 'csv' ? 'border-stone-800 bg-stone-800 text-white' : 'border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> CSV / Spreadsheet
            </button>
            <button
              onClick={() => setExportFormat('json')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border text-xs font-medium transition-colors ${
                exportFormat === 'json' ? 'border-stone-800 bg-stone-800 text-white' : 'border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              <FileJson className="w-3.5 h-3.5" /> JSON / API
            </button>
          </div>
          <p className="text-xs text-stone-400 mt-2">
            {exportFormat === 'csv'
              ? 'Compatible with Excel, Google Sheets, and most practice management software'
              : 'Best for EHR systems, custom integrations, or developer workflows'}
          </p>
        </div>

        <Button
          onClick={handleExport}
          disabled={loading || !startDate || !endDate}
          className="w-full bg-stone-800 hover:bg-stone-900"
        >
          <Download className="w-4 h-4 mr-2" />
          {loading ? 'Generating Report...' : 'Download Report'}
        </Button>

        <p className="text-xs text-stone-400 text-center">
          Includes: moments, member activity, pattern stats, and your private session notes.
        </p>
      </div>

      {/* Scheduled digest */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
          <Repeat className="w-3.5 h-3.5" /> Automated Digest Email
        </p>
        <p className="text-xs text-stone-400 leading-relaxed">
          Receive a pattern summary for this relationship delivered to your email automatically. Pro & Professional tier only.
        </p>
        <div className="flex gap-2">
          {['none', 'weekly', 'monthly'].map(opt => (
            <button
              key={opt}
              onClick={() => setReportSchedule(opt)}
              className={`flex-1 py-2 rounded-lg border text-xs font-medium capitalize transition-colors ${
                reportSchedule === opt
                  ? 'border-violet-600 bg-violet-50 text-violet-700'
                  : 'border-stone-200 text-stone-500 hover:bg-stone-50'
              }`}
            >
              {opt === 'none' ? 'Off' : opt}
            </button>
          ))}
        </div>
        <Button
          onClick={handleSaveSchedule}
          disabled={savingSchedule || !facilitatorRelationship?.id}
          variant="outline"
          className="w-full"
        >
          <Mail className="w-4 h-4 mr-2" />
          {scheduleSaved ? 'Saved!' : savingSchedule ? 'Saving...' : 'Save Digest Preference'}
        </Button>
      </div>
    </div>
  );
}