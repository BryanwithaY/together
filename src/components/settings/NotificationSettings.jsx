import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Clock, MessageCircle, CheckCircle, FileText, Plus, X, Bell, Mail } from 'lucide-react';

const FREQ_OPTIONS = [
  { value: 'hourly', label: 'Hourly', timeLabel: 'At minute' },
  { value: 'daily',  label: 'Daily',  timeLabel: 'At time' },
  { value: 'weekly', label: 'Weekly', timeLabel: 'Day & time' },
];

const DAY_OPTIONS = [
  { value: '1', label: 'Mon' }, { value: '2', label: 'Tue' },
  { value: '3', label: 'Wed' }, { value: '4', label: 'Thu' },
  { value: '5', label: 'Fri' }, { value: '6', label: 'Sat' },
  { value: '0', label: 'Sun' },
];

function ReminderItem({ reminder, onChange, onRemove }) {
  return (
    <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-2">
      <div className="flex items-center gap-2">
        {FREQ_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange({ ...reminder, frequency: opt.value, time: opt.value === 'hourly' ? '30' : '20:00', day: '1' })}
            className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
              reminder.frequency === opt.value
                ? 'bg-stone-800 text-white'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
            }`}
          >
            {opt.label}
          </button>
        ))}
        <button onClick={onRemove} className="ml-auto text-stone-300 hover:text-red-400 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {reminder.frequency === 'hourly' && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-stone-500 w-20">At minute</label>
          <Input
            type="number"
            min="0" max="59"
            value={reminder.time || '0'}
            onChange={e => onChange({ ...reminder, time: e.target.value })}
            className="w-20 h-8 text-sm"
          />
          <span className="text-xs text-stone-400">of each hour</span>
        </div>
      )}

      {reminder.frequency === 'daily' && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-stone-500 w-20">At time</label>
          <Input
            type="time"
            value={reminder.time || '20:00'}
            onChange={e => onChange({ ...reminder, time: e.target.value })}
            className="w-32 h-8 text-sm"
          />
        </div>
      )}

      {reminder.frequency === 'weekly' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-stone-500 w-20">At time</label>
            <Input
              type="time"
              value={reminder.time || '20:00'}
              onChange={e => onChange({ ...reminder, time: e.target.value })}
              className="w-32 h-8 text-sm"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <label className="text-xs text-stone-500 w-20">On day</label>
            {DAY_OPTIONS.map(d => (
              <button
                key={d.value}
                onClick={() => onChange({ ...reminder, day: d.value })}
                className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${
                  reminder.day === d.value
                    ? 'bg-stone-800 text-white'
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Delivery channels */}
      <div className="flex items-center gap-2 pt-1">
        <span className="text-xs text-stone-500 w-20">Notify via</span>
        <button
          onClick={() => onChange({ ...reminder, via_inapp: !(reminder.via_inapp ?? true) })}
          className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium border transition-colors ${
            (reminder.via_inapp ?? true)
              ? 'bg-stone-800 text-white border-stone-800'
              : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50'
          }`}
        >
          <Bell className="w-3 h-3" /> In-app
        </button>
        <button
          onClick={() => onChange({ ...reminder, via_email: !(reminder.via_email ?? false) })}
          className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium border transition-colors ${
            reminder.via_email
              ? 'bg-stone-800 text-white border-stone-800'
              : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50'
          }`}
        >
          <Mail className="w-3 h-3" /> Email
        </button>
      </div>
    </div>
  );
}

function NotificationRow({ icon: Icon, title, description, checked, onChange }) {
  return (
    <div className="flex items-start gap-4 py-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center mt-0.5">
        <Icon className="w-5 h-5 text-stone-600" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-stone-800">{title}</h4>
        <p className="text-xs text-stone-500 mt-0.5">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export default function NotificationSettings({ user }) {
  const defaultReminders = user?.notification_reminders?.length
    ? user.notification_reminders
    : [{ frequency: 'daily', time: '20:00', day: '1' }];

  const [reminders, setReminders] = useState(defaultReminders);
  const queryClient = useQueryClient();

  const updateSettingMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['currentUser'] }),
  });

  const handleToggle = (key, value) => {
    updateSettingMutation.mutate({ [key]: value });
  };

  const saveReminders = (updated) => {
    setReminders(updated);
    updateSettingMutation.mutate({ notification_reminders: updated });
  };

  const handleAddReminder = () => {
    saveReminders([...reminders, { frequency: 'daily', time: '20:00', day: '1' }]);
  };

  const handleUpdateReminder = (index, updated) => {
    const next = reminders.map((r, i) => i === index ? updated : r);
    saveReminders(next);
  };

  const handleRemoveReminder = (index) => {
    const next = reminders.filter((_, i) => i !== index);
    saveReminders(next);
    if (next.length === 0) handleToggle('notification_daily_reminder', false);
  };

  return (
    <div className="space-y-1 divide-y divide-stone-200">
      <div className="pb-4">
        <NotificationRow
          icon={Clock}
          title="Reminders"
          description="Get reminded to log your moments on your schedule"
          checked={user?.notification_daily_reminder || false}
          onChange={(checked) => {
            handleToggle('notification_daily_reminder', checked);
            if (checked && reminders.length === 0) {
              saveReminders([{ frequency: 'daily', time: '20:00', day: '1' }]);
            }
          }}
        />
        {user?.notification_daily_reminder && (
          <div className="ml-14 mt-2 space-y-2">
            {reminders.map((r, i) => (
              <ReminderItem
                key={i}
                reminder={r}
                onChange={(updated) => handleUpdateReminder(i, updated)}
                onRemove={() => handleRemoveReminder(i)}
              />
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddReminder}
              className="w-full text-stone-500 border-dashed border-stone-300 hover:bg-stone-50 text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add another reminder
            </Button>
          </div>
        )}
      </div>

      <NotificationRow
        icon={FileText}
        title="Partner Logs Entry"
        description="Get notified when your partner records a new moment"
        checked={user?.notification_partner_logs ?? true}
        onChange={(checked) => handleToggle('notification_partner_logs', checked)}
      />

      <NotificationRow
        icon={MessageCircle}
        title="Partner Comments"
        description="Get notified when your partner leaves a comment"
        checked={user?.notification_partner_comments ?? true}
        onChange={(checked) => handleToggle('notification_partner_comments', checked)}
      />

      <NotificationRow
        icon={CheckCircle}
        title="Partner Reviews"
        description="Get notified when your partner marks an entry as reviewed"
        checked={user?.notification_partner_reviews ?? true}
        onChange={(checked) => handleToggle('notification_partner_reviews', checked)}
      />
    </div>
  );
}