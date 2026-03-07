import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import SchedulingGuide from './SchedulingGuide';

export default function SchedulingGuideLink({ variant = 'button', className = '' }) {
  const [open, setOpen] = useState(false);

  if (variant === 'button') {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className={`gap-2 ${className}`}>
            <Calendar className="w-4 h-4" />
            How It Works
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Calendar Integration Guide
            </SheetTitle>
          </SheetHeader>
          <SchedulingGuide />
        </SheetContent>
      </Sheet>
    );
  }

  return <SchedulingGuide className={className} />;
}