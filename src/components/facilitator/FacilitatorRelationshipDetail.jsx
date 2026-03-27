import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Analytics } from '../lib/analytics';
import { useRelationship } from '../relationship/RelationshipContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, AlertTriangle, MessageSquare, FileText, Send, Eye, EyeOff, Users, Download } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import FacilitatorExportPanel from './FacilitatorExportPanel';

export default function FacilitatorRelationshipDetail({ facRelId, onBack }) {
  const { currentUser } = useRelationship();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [noteContent, setNoteContent] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [messageTarget, setMessageTarget] = useState('relationship');
  const [messageTargetEmail, setMessageTargetEmail] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [noteError, setNoteError] = useState(null);
  const [messageError, setMessageError] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['facilitatorDetail', facRelId],
    queryFn: async () => {
      const res = await base44.functions.invoke('getFacilitatorData', {
        relationship_id: facRelId,
        action: 'get_detail'
      });
      return res.data;
    }
  });

  const handleSaveNote = async () => {
    if (!noteContent.trim()) return;
    setSavingNote(true);
    setNoteError(null);
    try {
      await base44.entities.FacilitatorNote.create({
        facilitator_email: currentUser?.email,
        relationship_id: facRelId,
        content: noteContent.trim(),
        session_date: new Date().toISOString(),
        is_private: true
      });
      Analytics.facilitatorNoteCreated();
      setNoteContent('');
      queryClient.invalidateQueries({ queryKey: ['facilitatorDetail', facRelId] });
    } catch (err) {
      setNoteError(err?.message || 'Failed to save note. Please try again.');
    } finally {
      setSavingNote(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim()) return;
    setSendingMessage(true);
    setMessageError(null);
    try {
      await base44.entities.FacilitatorMessage.create({
        facilitator_email: currentUser?.email,
        relationship_id: facRelId,
        content: messageContent.trim(),
        target_type: messageTarget,
        target_email: messageTarget === 'member' ? messageTargetEmail : null,
        read_by: []
      });
      Analytics.facilitatorMessageSent(messageTarget);
      setMessageContent('');
      queryClient.invalidateQueries({ queryKey: ['facilitatorDetail', facRelId] });
    } catch (err) {
      setMessageError(err?.message || 'Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800" />
    </div>
  );

  const { moments = [], members = [], stats = {}, concerns = [], notes = [], facilitator_relationship, consent_summary } = data || {};
  const consentWarning = !!(consent_summary?.warning_code);

  const TABS = [
    { id: 'overview', label: 'Overview', icon: Users },
    { id: 'moments', label: 'Moments', icon: Eye },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'export', label: 'Export', icon: Download },
  ];

  const momentTypeColors = {
    ego_aside: 'bg-amber-50 border-amber-200 text-amber-800',
    gratitude: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    self_reflection: 'bg-violet-50 border-violet-200 text-violet-800'
  };

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-stone-600" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-stone-800">{facilitator_relationship?.relationship_name || 'Relationship'}</h2>
          <p className="text-xs text-stone-400">
            {stats.total_moments} moments · {members.length} members
          </p>
        </div>
      </div>

      {/* Concerns banner */}
      {concerns.length > 0 && (
        <div className="mb-4 space-y-2">
          {concerns.map((c, i) => (
            <div key={i} className={`flex items-start gap-2.5 rounded-xl p-3 border ${
              c.severity === 'high' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
            }`}>
              <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${c.severity === 'high' ? 'text-red-500' : 'text-amber-500'}`} />
              <p className={`text-xs ${c.severity === 'high' ? 'text-red-700' : 'text-amber-700'}`}>{c.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-stone-200 mb-4 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-stone-800 text-stone-800'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Trend card — computed from visible moments only */}
          {(() => {
            const now = Date.now();
            const week = 7 * 24 * 60 * 60 * 1000;
            const thisWeek = moments.filter(m => now - new Date(m.date).getTime() < week).length;
            const lastWeek = moments.filter(m => {
              const age = now - new Date(m.date).getTime();
              return age >= week && age < 2 * week;
            }).length;
            const hasEnough = moments.length >= 3;
            const trend = !hasEnough ? null : thisWeek > lastWeek ? 'more_active' : thisWeek < lastWeek ? 'quieter' : 'steady';
            const trendLabel = { more_active: '↑ More active', quieter: '↓ Quieter', steady: '→ Steady' };
            const trendColor = { more_active: 'text-emerald-600 bg-emerald-50 border-emerald-200', quieter: 'text-amber-600 bg-amber-50 border-amber-200', steady: 'text-sky-600 bg-sky-50 border-sky-200' };
            return (
              <div className="flex items-stretch gap-2 mb-1">
                <div className="flex-1 bg-white border border-stone-200 rounded-xl p-3 text-center">
                  <p className="text-xs text-stone-400 mb-1">This week</p>
                  <p className="text-lg font-bold text-stone-800">{thisWeek}</p>
                </div>
                <div className="flex-1 bg-white border border-stone-200 rounded-xl p-3 text-center">
                  <p className="text-xs text-stone-400 mb-1">Last week</p>
                  <p className="text-lg font-bold text-stone-500">{lastWeek}</p>
                </div>
                <div className={`flex-1 rounded-xl p-3 text-center border flex flex-col items-center justify-center ${
                  trend ? trendColor[trend] : 'bg-stone-50 border-stone-200'
                }`}>
                  {trend
                    ? <p className="text-xs font-semibold">{trendLabel[trend]}</p>
                    : <p className="text-xs text-stone-400 leading-tight">Not enough data yet</p>
                  }
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Moments', value: stats.total_moments || 0, color: 'text-stone-800' },
              { label: 'This Week', value: stats.recent_count_7d || 0, color: 'text-blue-700' },
              { label: 'Concerns', value: concerns.length, color: concerns.length > 0 ? 'text-red-600' : 'text-emerald-600' }
            ].map(s => (
              <div key={s.label} className="bg-white border border-stone-200 rounded-xl p-3 text-center">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-stone-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-amber-800">{stats.ego_aside_count || 0}</p>
              <p className="text-xs text-amber-600 mt-0.5">Ego Aside</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-emerald-800">{stats.gratitude_count || 0}</p>
              <p className="text-xs text-emerald-600 mt-0.5">Gratitude</p>
            </div>
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-violet-800">{stats.self_reflection_count || 0}</p>
              <p className="text-xs text-violet-600 mt-0.5">Reflections</p>
            </div>
          </div>

          {/* Member breakdown */}
          <div className="bg-white border border-stone-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Member Activity</p>
            <div className="space-y-3">
              {members.map(member => {
                const activity = stats.member_activity?.[member.user_email] || {};
                return (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-600 flex-shrink-0">
                      {(member.display_name || member.user_email || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-700 truncate">{member.display_name || member.user_email}</p>
                      <p className="text-xs text-stone-400">
                        {activity.total || 0} total · {activity.recent_7d || 0} this week
                        {activity.last_activity && ` · last ${formatDistanceToNow(new Date(activity.last_activity), { addSuffix: true })}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MOMENTS */}
      {activeTab === 'moments' && (
        <div className="space-y-3">
          {moments.length === 0 && (
            <div className="text-center py-10 space-y-2">
              <p className="text-sm font-medium text-stone-500">
                {consentWarning ? 'No visible moments' : 'No moments yet'}
              </p>
              <p className="text-xs text-stone-400 max-w-xs mx-auto">
                {consentWarning
                  ? 'Some content may be unavailable due to current privacy or access settings.'
                  : 'Moments will appear here once the relationship members start logging activity.'}
              </p>
            </div>
          )}
          {moments.map(moment => (
            <div key={moment.id} className={`rounded-xl border p-3 ${momentTypeColors[moment.type] || 'bg-stone-50 border-stone-200'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold capitalize">{moment.type?.replace('_', ' ')}</span>
                    {moment.subtype && moment.subtype !== 'general' && (
                      <span className="text-xs opacity-70 capitalize">{moment.subtype?.replace('_', ' ')}</span>
                    )}
                  </div>
                  {moment.what_happened && (
                    <p className="text-sm mt-1 line-clamp-3">{moment.what_happened}</p>
                  )}
                </div>
                <p className="text-xs opacity-60 flex-shrink-0">
                  {moment.date ? format(new Date(moment.date), 'MMM d') : ''}
                </p>
              </div>
              <p className="text-xs opacity-60 mt-1.5">by {moment.created_by}</p>
            </div>
          ))}
        </div>
      )}

      {/* NOTES */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="bg-violet-50 border border-violet-200 rounded-xl p-3">
            <div className="flex items-start gap-2">
              <EyeOff className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-violet-700">Session notes are <strong>private to you only</strong>. Relationship members cannot see them.</p>
            </div>
          </div>
          <div className="space-y-2">
            <Textarea
              value={noteContent}
              onChange={e => setNoteContent(e.target.value)}
              placeholder="Write a session note... (only visible to you)"
              className="resize-none min-h-[120px]"
            />
            {noteError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{noteError}</p>}
            <Button
              onClick={handleSaveNote}
              disabled={savingNote || !noteContent.trim()}
              className="w-full bg-stone-800 hover:bg-stone-900"
            >
              <FileText className="w-4 h-4 mr-2" />
              {savingNote ? 'Saving...' : 'Save Note'}
            </Button>
          </div>

          {notes.length === 0 && !noteContent && (
            <div className="flex items-start gap-3 bg-stone-50 border border-stone-200 rounded-xl p-3 mb-1">
              <FileText className="w-4 h-4 text-stone-300 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-stone-600">No notes yet</p>
                <p className="text-xs text-stone-400 mt-0.5">Write your first session note above — only you can see it.</p>
              </div>
            </div>
          )}

          {notes.length > 0 && (
            <div className="space-y-3 mt-4">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Previous Notes</p>
              {notes.map(note => (
                <div key={note.id} className="bg-white border border-stone-200 rounded-xl p-4">
                  <p className="text-sm text-stone-700 whitespace-pre-wrap">{note.content}</p>
                  <p className="text-xs text-stone-400 mt-2">
                    {note.session_date ? format(new Date(note.session_date), 'MMM d, yyyy · h:mm a') : 'No date'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* EXPORT */}
      {activeTab === 'export' && (
        <FacilitatorExportPanel
          relationshipId={facRelId}
          relationshipName={facilitator_relationship?.relationship_name}
          facilitatorRelationship={facilitator_relationship}
        />
      )}

      {/* MESSAGES */}
      {activeTab === 'messages' && (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Send to</p>
            <div className="flex gap-2">
              <button
                onClick={() => setMessageTarget('relationship')}
                className={`flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                  messageTarget === 'relationship' ? 'border-stone-800 bg-stone-800 text-white' : 'border-stone-200 text-stone-600'
                }`}
              >
                Entire Relationship
              </button>
              <button
                onClick={() => setMessageTarget('member')}
                className={`flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                  messageTarget === 'member' ? 'border-stone-800 bg-stone-800 text-white' : 'border-stone-200 text-stone-600'
                }`}
              >
                Specific Member
              </button>
            </div>
          </div>

          {messageTarget === 'member' && (
            <select
              value={messageTargetEmail}
              onChange={e => setMessageTargetEmail(e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-700 bg-white"
            >
              <option value="">Select a member...</option>
              {members.map(m => (
                <option key={m.id} value={m.user_email}>{m.display_name || m.user_email}</option>
              ))}
            </select>
          )}

          {!messageContent && (
            <div className="flex items-start gap-3 bg-stone-50 border border-stone-200 rounded-xl p-3">
              <MessageSquare className="w-4 h-4 text-stone-300 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-stone-600">No messages sent yet</p>
                <p className="text-xs text-stone-400 mt-0.5">Send a supportive note to check in with the relationship members.</p>
              </div>
            </div>
          )}
          <Textarea
            value={messageContent}
            onChange={e => setMessageContent(e.target.value)}
            placeholder="Write a message to the relationship or a member..."
            className="resize-none min-h-[120px]"
          />
          {messageError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{messageError}</p>}
          <Button
            onClick={handleSendMessage}
            disabled={sendingMessage || !messageContent.trim() || (messageTarget === 'member' && !messageTargetEmail)}
            className="w-full bg-stone-800 hover:bg-stone-900"
          >
            <Send className="w-4 h-4 mr-2" />
            {sendingMessage ? 'Sending...' : 'Send Message'}
          </Button>
        </div>
      )}
    </div>
  );
}