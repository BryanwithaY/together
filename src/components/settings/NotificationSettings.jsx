import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Bell, Clock, MessageCircle, CheckCircle, FileText } from 'lucide-react';

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
  const [reminderTime, setReminderTime] = useState(user?.notification_daily_reminder_time || '20:00');
  const queryClient = useQueryClient();

  const updateSettingMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  const handleToggle = (key, value) => {
    updateSettingMutation.mutate({ [key]: value });
  };

  const handleTimeChange = (time) => {
    setReminderTime(time);
    updateSettingMutation.mutate({ notification_daily_reminder_time: time });
  };

  return (
    <div className="space-y-1 divide-y divide-stone-200">
      <div className="pb-4">
        <NotificationRow
          icon={Clock}
          title="Daily Reminder"
          description="Get a reminder to log your moments each day"
          checked={user?.notification_daily_reminder || false}
          onChange={(checked) => handleToggle('notification_daily_reminder', checked)}
        />
        {user?.notification_daily_reminder && (
          <div className="ml-14 mt-2">
            <label className="text-xs text-stone-600 mb-1 block">Reminder Time</label>
            <Input
              type="time"
              value={reminderTime}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="w-32"
            />
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