import React, { useState } from 'react';
import { ActivityType } from '../types';
import { getActivityIcon, getActivityLabel } from '../utils/categoryIcons';
import {
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  RotateCcw,
  Headphones,
  CheckCircle2,
  Coffee,
  AlertCircle,
} from 'lucide-react';

interface FocusTimerProps {
  phase: 'focus' | 'break';
  timeLeft: number;
  isRunning: boolean;
  initialFocusMinutes: number;
  initialBreakMinutes: number;
  totalRounds: number;
  currentRound: number;
  taskTitle: string;
  category: ActivityType;
  modeName?: string;
  ambientSound: 'none' | 'clock' | 'rain' | 'whitenoise';
  soundEnabled: boolean;
  onTogglePlayPause: () => void;
  onStop: (action: 'save' | 'discard') => void;
  onSkipPhase: () => void;
  onChangeAmbientSound: (sound: 'none' | 'clock' | 'rain' | 'whitenoise') => void;
  onToggleSound: () => void;
}

export const FocusTimer: React.FC<FocusTimerProps> = ({
  phase,
  timeLeft,
  isRunning,
  initialFocusMinutes,
  initialBreakMinutes,
  totalRounds,
  currentRound,
  taskTitle,
  category,
  modeName,
  ambientSound,
  soundEnabled,
  onTogglePlayPause,
  onStop,
  onSkipPhase,
  onChangeAmbientSound,
  onToggleSound,
}) => {
  const [showStopConfirm, setShowStopConfirm] = useState(false);

  const initialSeconds = (phase === 'focus' ? initialFocusMinutes : initialBreakMinutes) * 60;
  const progressPercent = Math.min(
    100,
    Math.max(0, ((initialSeconds - timeLeft) / (initialSeconds || 1)) * 100)
  );

  const elapsedFocusSeconds =
    phase === 'focus' ? Math.max(0, initialFocusMinutes * 60 - timeLeft) : 0;
  const elapsedMins = Math.floor(elapsedFocusSeconds / 60);
  const elapsedSecsRemainder = elapsedFocusSeconds % 60;

  const formatTime = (secs: number) => {
    const safeSecs = Math.max(0, Math.floor(secs));
    const mins = Math.floor(safeSecs / 60);
    const s = safeSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center p-4">
      {/* Minimal Timer Card */}
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs transition-colors dark:border-zinc-800 dark:bg-zinc-900 sm:p-12">
        {/* Phase Header */}
        <div className="flex items-center justify-center gap-2">
          <span className="font-mono text-xs font-semibold tracking-widest text-slate-500 uppercase dark:text-zinc-400">
            {phase === 'focus' ? 'FOCUS' : 'BREAK'}
          </span>
          <span className="text-slate-300 dark:text-zinc-700">·</span>
          <span className="text-xs text-slate-500 dark:text-zinc-400">
            Session {currentRound} of {totalRounds}
          </span>
        </div>

        {/* Giant Minimal Digits - Visual Priority #1 */}
        <div className="my-8">
          <div className="font-mono text-7xl font-light tracking-tight text-slate-900 tabular-nums sm:text-8xl dark:text-zinc-100">
            {formatTime(timeLeft)}
          </div>

          {/* Thin Minimal Progress Bar */}
          <div className="mx-auto mt-4 h-1 w-48 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
            <div
              className={`h-full transition-all duration-1000 ease-linear ${
                phase === 'focus' ? 'bg-slate-900 dark:bg-zinc-100' : 'bg-emerald-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Task Details */}
        <div className="mx-auto max-w-md">
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
            {getActivityIcon(category, 'h-3.5 w-3.5')}
            <span>{getActivityLabel(category)}</span>
            {modeName && (
              <>
                <span>·</span>
                <span>{modeName}</span>
              </>
            )}
          </div>
          <h2 className="mt-1 text-base font-medium text-slate-900 dark:text-zinc-100">
            {taskTitle || 'โฟกัสตามเป้าหมาย'}
          </h2>
          <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">
            {isRunning ? 'กำลังจับเวลา...' : 'หยุดเวลาชั่วคราว'}
          </p>
        </div>

        {/* Primary & Secondary Actions */}
        <div className="mt-8 flex items-center justify-center gap-3">
          {/* Stop / Finish button */}
          <button
            onClick={() => setShowStopConfirm(true)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
            title="หยุดรอบนี้"
          >
            <Square className="h-4 w-4" />
          </button>

          {/* Primary Pause / Resume Button */}
          <button
            onClick={onTogglePlayPause}
            className="flex h-11 min-w-[140px] items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-xs font-medium text-white shadow-xs transition-colors hover:bg-slate-800 active:scale-98 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            {isRunning ? (
              <>
                <Pause className="h-3.5 w-3.5 fill-current" />
                <span>พักชั่วคราว</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>ทำต่อ</span>
              </>
            )}
          </button>

          {/* Skip phase button */}
          <button
            onClick={onSkipPhase}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
            title={phase === 'focus' ? 'ข้ามไปช่วงพัก' : 'ข้ามไปช่วงโฟกัส'}
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* Ambient & Sound Controls */}
        <div className="mt-8 flex items-center justify-center gap-4 border-t border-slate-100 pt-4 dark:border-zinc-800/80">
          <div className="flex items-center gap-2">
            <Headphones className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
            <select
              value={ambientSound}
              onChange={(e) => onChangeAmbientSound(e.target.value as any)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              <option value="none">ปิดเสียงพื้นหลัง</option>
              <option value="rain">เสียงฝนตกเบา</option>
              <option value="clock">เสียงเข็มนาฬิกา</option>
              <option value="whitenoise">เสียงคลื่น White Noise</option>
            </select>
          </div>

          <button
            onClick={onToggleSound}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            title={soundEnabled ? 'ปิดเสียงแจ้งเตือน' : 'เปิดเสียงแจ้งเตือน'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Stop Confirmation Dialog */}
      {showStopConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-900 dark:text-zinc-100">
                  หยุด Session ก่อนกำหนด
                </h4>
                <div className="mt-1 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                  {phase === 'focus' ? (
                    elapsedMins >= 1 ? (
                      <p>
                        โฟกัสไปแล้ว <span className="font-semibold text-slate-800 dark:text-zinc-200">{elapsedMins} นาที</span>{elapsedSecsRemainder > 0 ? ` (${elapsedSecsRemainder} วินาที)` : ''} ต้องการบันทึกเวลาที่ทำจริง หรือยกเลิก Session นี้?
                      </p>
                    ) : (
                      <p>
                        โฟกัสไปเพียง <span className="font-semibold text-slate-800 dark:text-zinc-200">{elapsedFocusSeconds} วินาที</span> (ยังไม่ถึง 1 นาที จึงไม่สามารถบันทึกเป็น Focus Time ได้)
                      </p>
                    )
                  ) : (
                    <p>ขณะนี้อยู่ในช่วงพัก หากหยุดจะออกจาก Session นี้โดยไม่นับเวลาช่วงพัก</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowStopConfirm(false)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {phase === 'focus' ? 'โฟกัสต่อ' : 'พักต่อ'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowStopConfirm(false);
                  onStop('discard');
                }}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                ยกเลิกไม่บันทึก
              </button>
              {phase === 'focus' && elapsedMins >= 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowStopConfirm(false);
                    onStop('save');
                  }}
                  className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                >
                  บันทึก {elapsedMins} นาที
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
