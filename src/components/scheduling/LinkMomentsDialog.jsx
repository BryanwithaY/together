import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function LinkMomentsDialog({ relationshipId, isOpen, onOpenChange, onConfirm }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: moments = [] } = useQuery({
    queryKey: ['moments-link', relationshipId],
    queryFn: () => base44.entities.Moment.filter({
      relationship_id: relationshipId,
      is_private: false,
    }, '-date', 100),
    enabled: isOpen && !!relationshipId,
  });

  const filtered = useMemo(() => {
    if (!searchTerm) return moments;
    return moments.filter(m =>
      m.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.what_happened?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [moments, searchTerm]);

  const handleConfirm = () => {
    const selected = moments.filter(m => selectedIds.includes(m.id));
    onConfirm(selected);
    setSelectedIds([]);
    setSearchTerm('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Link Moments to Discuss</DialogTitle>
          <DialogDescription>
            Select moments to include in your connection event description
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          <div className="sticky top-0 -mx-6 px-6 pb-3 bg-white border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                placeholder="Search moments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-stone-500 text-center py-8">
              {moments.length === 0 ? 'No moments yet' : 'No moments match your search'}
            </p>
          ) : (
            <div className="space-y-2">
              {filtered.map(moment => (
                <label
                  key={moment.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-stone-50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={selectedIds.includes(moment.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedIds([...selectedIds, moment.id]);
                      } else {
                        setSelectedIds(selectedIds.filter(id => id !== moment.id));
                      }
                    }}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-stone-800">
                      {moment.type}
                      {moment.subtype && <span className="text-stone-600"> • {moment.subtype}</span>}
                    </p>
                    {moment.what_happened && (
                      <p className="text-xs text-stone-600 mt-1 line-clamp-2">
                        {moment.what_happened}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedIds.length === 0}
            className="flex-1 bg-stone-800 hover:bg-stone-900"
          >
            Confirm ({selectedIds.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}