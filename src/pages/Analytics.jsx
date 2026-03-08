import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import EngagementAnalysis from '@/components/analytics/EngagementAnalysis';
import { usePageLoading } from '@/components/PageLoadingContext';
import { Analytics as track } from '@/components/lib/analytics';

export default function Analytics() {
  const { setPageReady } = usePageLoading();
  useEffect(() => { setPageReady(); track.pageViewed('analytics'); }, []);

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-stone-200/60 sticky top-0 z-30">
          <div className="px-4 py-3 flex items-center gap-3">
            <a href={createPageUrl('Settings')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5 text-stone-600" />
              </Button>
            </a>
            <div>
              <h1 className="text-lg font-bold text-stone-800">Engagement Analytics</h1>
              <p className="text-xs text-stone-500">Which moment types drive the most engagement</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-4">
          <EngagementAnalysis />
        </div>
      </div>
    </div>
  );
}