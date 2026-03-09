import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Plus, Send, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import MessageBubble from './MessageBubble';

export default function CoachChatView({ user }) {
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadLatestConversation();
  }, []);

  useEffect(() => {
    if (!activeConversation?.id) return;
    const unsubscribe = base44.agents.subscribeToConversation(activeConversation.id, (data) => {
      setMessages(data.messages || []);
      setSending(false);
    });
    return unsubscribe;
  }, [activeConversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadLatestConversation = async () => {
    const convs = await base44.agents.listConversations({ agent_name: 'relationship_coach' });
    if (convs?.length > 0) {
      const full = await base44.agents.getConversation(convs[0].id);
      setActiveConversation(full);
      setMessages(full.messages || []);
    } else {
      await startNewConversation();
    }
    setLoading(false);
  };

  const startNewConversation = async () => {
    const conv = await base44.agents.createConversation({
      agent_name: 'relationship_coach',
      metadata: { name: `Session ${new Date().toLocaleDateString()}` },
    });
    setActiveConversation(conv);
    setMessages([]);
  };

  const sendMessage = async () => {
    if (!input.trim() || sending || !activeConversation) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    await base44.agents.addMessage(activeConversation, { role: 'user', content: text });
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <motion.div key={i} className="w-2 h-2 rounded-full bg-stone-300" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 56px - max(env(safe-area-inset-bottom), 12px))' }}>
      {/* Header */}
      <div className="bg-white border-b border-stone-200/60 flex-shrink-0">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-stone-800 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-stone-800 text-sm leading-tight">AI Relationship Coach</h1>
            <p className="text-xs text-stone-400">Growth through honest reflection</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={startNewConversation}
            className="rounded-xl text-stone-500"
            title="New conversation"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-2xl mx-auto w-full">
          {messages.length === 0 && !sending ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-16">
              <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-stone-400" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-700 mb-1.5">Ready to coach</h3>
                <p className="text-sm text-stone-400 max-w-xs leading-relaxed">
                  Share what's on your mind. The coach will help you see it clearly and find a path forward.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pb-2">
              {messages.map((msg, i) => (
                <MessageBubble key={i} message={msg} />
              ))}
              {sending && (
                <div className="flex gap-3 justify-start">
                  <div className="h-7 w-7 rounded-lg bg-stone-800 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="bg-white border border-stone-200 rounded-2xl px-4 py-3">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map(i => (
                        <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-stone-400" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 bg-white border-t border-stone-200/60">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-end gap-2.5">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share what's on your mind..."
            rows={1}
            className="flex-1 resize-none rounded-xl border-2 border-stone-200 focus:border-stone-400 focus:outline-none px-4 py-3 text-sm placeholder-stone-400 max-h-32 overflow-y-auto"
            style={{ minHeight: '44px' }}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            size="icon"
            className="rounded-xl bg-stone-800 hover:bg-stone-700 h-11 w-11 flex-shrink-0 disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}