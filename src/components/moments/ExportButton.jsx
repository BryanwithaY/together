import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

function escapeCsv(value) {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowToCsv(row) {
  return row.map(escapeCsv).join(',');
}

export default function ExportButton({ moments, privateReflections, relationshipName }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    setExporting(true);

    const all = [...moments, ...privateReflections].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    const headers = [
      'Date',
      'Type',
      'Subtype',
      'What Happened',
      'How It Felt',
      'Could Have Done Better',
      'Show Up Next Time',
      'Visibility',
      'Created By',
      'Is Private',
      'Tagged Users',
    ];

    const rows = all.map(m => [
      m.date ? format(new Date(m.date), 'yyyy-MM-dd HH:mm') : '',
      m.type || '',
      m.subtype || '',
      m.what_happened || '',
      m.how_it_felt || '',
      m.could_have_done_better || '',
      m.show_up_next_time || '',
      m.visibility || '',
      m.created_by || '',
      m.is_private ? 'Yes' : 'No',
      (m.tagged_users || []).join('; '),
    ]);

    const csvContent = [headers, ...rows].map(rowToCsv).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${relationshipName || 'moments'}-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExporting(false);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={exporting || (moments.length === 0 && privateReflections.length === 0)}
      className="flex items-center gap-1.5 text-stone-600 border-stone-200 hover:bg-stone-50"
    >
      <Download className="w-3.5 h-3.5" />
      Export CSV
    </Button>
  );
}