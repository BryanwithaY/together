import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import EngagementAnalysis from '@/components/analytics/EngagementAnalysis';

export default function Analytics() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="p-4 border-b bg-white dark:bg-slate-800 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <a href={createPageUrl('Settings')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </a>
            <div>
              <h1 className="text-2xl font-bold">Analytics</h1>
              <p className="text-sm text-muted-foreground">
                Understand which moments drive the most engagement
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <EngagementAnalysis />
      </div>
    </div>
  );
}