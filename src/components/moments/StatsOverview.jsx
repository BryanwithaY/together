import React, { useRef } from 'react';
import { Heart, HandHeart, Sparkles, TrendingUp, Share2, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

function StatCard({ icon: Icon, label, value, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm"
    >
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full opacity-[0.07] ${color}`} />
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${color} bg-opacity-10`}>
          <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
        </div>
        <div>
          <p className="text-2xl font-semibold text-stone-800 tracking-tight">{value}</p>
          <p className="text-xs text-stone-500 font-medium uppercase tracking-wider mt-0.5">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function StatsOverview({ moments, privateReflections = [] }) {
  const egoAside = moments.filter(m => m.type === 'ego_aside').length;
  const gratitude = moments.filter(m => m.type === 'gratitude').length;
  const reflections = [...moments.filter(m => m.type === 'self_reflection'), ...privateReflections].length;
  const total = moments.length + privateReflections.length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  let checkDate = new Date(today);
  while (true) {
    const dayStr = checkDate.toISOString().split('T')[0];
    const hasMoment = moments.some(m => new Date(m.date).toISOString().split('T')[0] === dayStr);
    if (hasMoment) { streak++; checkDate.setDate(checkDate.getDate() - 1); }
    else break;
  }

  const handleShare = async () => {
    const text = `Together App Stats 💑\n✨ ${total} moments logged\n🤝 ${egoAside} ego aside\n💛 ${gratitude} gratitude\n🔥 ${streak} day streak`;
    if (navigator.share) {
      await navigator.share({ title: 'My Together Stats', text });
    } else {
      await navigator.clipboard.writeText(text);
      alert('Stats copied to clipboard!');
    }
  };

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Heart} label="Total Moments" value={total} color="bg-rose-400" delay={0} />
        <StatCard icon={HandHeart} label="Ego Aside" value={egoAside} color="bg-amber-500" delay={0.1} />
        <StatCard icon={Sparkles} label="Gratitude" value={gratitude} color="bg-emerald-500" delay={0.2} />
        <StatCard icon={TrendingUp} label="Day Streak" value={streak} color="bg-violet-500" delay={0.3} />
      </div>
      <div className="mt-2 flex justify-end">
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          Share my stats
        </button>
      </div>
    </div>
  );
}