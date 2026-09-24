import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { FeedbackRating, ActivityType } from '../types';
import { sound } from '../utils/audio';
import {
  CheckCircle2,
  Zap,
  Clock,
  TrendingUp,
  ArrowRight,
  Smile,
  Meh,
  Frown,
} from 'lucide-react';

interface SessionFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: { rating: FeedbackRating; note: string }) => void;
  category: ActivityType;
  taskTitle: string;
  focusMinutes: number;
  earnedCoins: number;
  earnedMaterials: number;
  earnedXp: number;
  soundEnabled?: boolean;
}

export const SessionFeedbackModal: React.FC<SessionFeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  category,
  taskTitle,
  focusMinutes,
  earnedCoins,
  earnedMaterials,
  earnedXp,
  soundEnabled = true,
}) => {
  const [rating, setRating] = useState<FeedbackRating>('just_right');
  const [note, setNote] = useState('');
  const [animatingEnergy, setAnimatingEnergy] = useState(true);

  const cityEnergy = focusMinutes * 4;
  const buildingProgressPct = Math.min(100, Math.round(focusMinutes * 2));

  useEffect(() => {
    if (isOpen) {
      sound.playFocusComplete(soundEnabled);
      try {
        confetti({
          particleCount: 45,
          spread: 55,
          origin: { y: 0.55 },
          colors: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
        });
      } catch (e) {}

      // Short energy transfer animation
      setAnimatingEnergy(true);
      const timer = setTimeout(() => {
        setAnimatingEnergy(false);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playCoinSound(soundEnabled);
    onSubmit({ rating, note });
  };

  const getDistrictName = () => {
    switch (category) {
      case 'reading':
        return 'Education District';
      case 'memory':
        return 'Knowledge District';
      case 'work':
        return 'Work District';
      case 'project':
        return 'Technology District';
      case 'creative':
        return 'Creative District';
      default:
        return 'Focus City';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in zoom-in-95 duration-200">
        
        {/* Celebration Header */}
        <div className="text-center">
          <div className="mx-auto flex h-13 w-13 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h2 className="mt-3 text-lg font-medium text-slate-900 dark:text-zinc-100">
            Focus Complete
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            คุณได้ทุ่มเทสมาธิกับ “<span className="font-semibold text-slate-700 dark:text-slate-300">{taskTitle || 'กิจกรรมที่คุณเลือก'}</span>”
          </p>
        </div>

        {/* 3 Core Reward Metrics (Prompt 5 requirement) */}
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-3 text-center border border-slate-100 dark:bg-slate-800/60 dark:border-slate-800">
          <div className="flex flex-col items-center">
            <span className="flex items-center gap-1 text-sm font-bold text-amber-600 dark:text-amber-400">
              <Clock className="h-3.5 w-3.5" /> +{focusMinutes}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Focus Minutes</span>
          </div>
          <div className="flex flex-col items-center border-x border-slate-200 dark:border-slate-700">
            <span className="flex items-center gap-1 text-sm font-bold text-blue-600 dark:text-blue-400">
              <Zap className="h-3.5 w-3.5 fill-current" /> +{cityEnergy}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">City Energy</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="flex items-center gap-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-3.5 w-3.5" /> +{buildingProgressPct}%
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Building Progress</span>
          </div>
        </div>

        {/* City Energy Beam Animation (Smooth, brief animation) */}
        <div className="mt-3 overflow-hidden rounded-xl border border-amber-200/60 bg-gradient-to-r from-amber-50/70 via-orange-50/50 to-amber-50/70 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-900 dark:text-amber-300">
            <span className="flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 fill-current text-amber-500" />
              <span>ส่งพลังงานเข้าสู่ {getDistrictName()}</span>
            </span>
            <span className="font-mono text-[11px]">+{buildingProgressPct}% สู่ขั้นถัดไป</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-amber-200/50 overflow-hidden dark:bg-amber-900/50">
            <div
              className={`h-full rounded-full bg-amber-500 transition-all duration-1000 ${
                animatingEnergy ? 'w-full animate-pulse' : 'w-4/5'
              }`}
            />
          </div>
          <p className="mt-1.5 text-[10px] text-amber-800/80 dark:text-amber-300/80">
            ความก้าวหน้าแบบเป็นขั้น: Foundation → Construction → Complete → Upgrade
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Quick Feedback Rating */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              รอบนี้เป็นอย่างไรบ้าง?
            </label>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRating('too_long')}
                className={`flex flex-col items-center gap-1 rounded-xl p-2 text-xs font-medium transition-all border ${
                  rating === 'too_long'
                    ? 'border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                <Frown className="h-4 w-4 text-amber-500" />
                <span>นานไป</span>
              </button>

              <button
                type="button"
                onClick={() => setRating('just_right')}
                className={`flex flex-col items-center gap-1 rounded-xl p-2 text-xs font-medium transition-all border ${
                  rating === 'just_right'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                <Smile className="h-4 w-4 text-emerald-500" />
                <span>กำลังดี</span>
              </button>

              <button
                type="button"
                onClick={() => setRating('too_short')}
                className={`flex flex-col items-center gap-1 rounded-xl p-2 text-xs font-medium transition-all border ${
                  rating === 'too_short'
                    ? 'border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-300'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                <Meh className="h-4 w-4 text-blue-500" />
                <span>สั้นไป</span>
              </button>
            </div>
          </div>

          {/* Quick Note Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              บันทึกสิ่งที่ทำสำเร็จ (สั้น ๆ):
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น อ่านบทที่ 3 เข้าใจครบถ้วน, เขียนโครงร่างเสร็จ..."
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 text-xs font-bold text-white shadow-xs transition-all hover:bg-slate-800 active:scale-98 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              <span>ส่งพลังงานและดูการเติบโตของเมือง</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
