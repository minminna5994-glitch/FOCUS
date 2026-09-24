import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { LANDMARK_BLUEPRINTS } from '../data/cityData';
import { PlacedBuilding } from '../types';
import { sound } from '../utils/audio';
import { BlueprintPreviewModel } from './city/IsometricBuildingModels';
import {
  Trophy,
  Lock,
  CheckCircle2,
  Sparkles,
  MapPin,
  Clock,
  Compass,
  Box,
  Leaf,
  Layers,
} from 'lucide-react';

interface LandmarksShowcaseProps {
  totalFocusMinutes: number;
  placedBuildings: PlacedBuilding[];
  onPlaceLandmark?: (landmarkId: string) => void;
  soundEnabled?: boolean;
}

const getLandmarkIcon = (id: string, className = 'h-5 w-5') => {
  switch (id) {
    case 'lm-clock':
      return <Clock className={className} />;
    case 'lm-zen':
      return <Leaf className={className} />;
    case 'lm-tower':
      return <Layers className={className} />;
    case 'lm-tech':
      return <Box className={className} />;
    case 'lm-globe':
    default:
      return <Compass className={className} />;
  }
};

export const LandmarksShowcase: React.FC<LandmarksShowcaseProps> = ({
  totalFocusMinutes,
  placedBuildings,
  onPlaceLandmark,
  soundEnabled = true,
}) => {
  const [celebratingLandmark, setCelebratingLandmark] = useState<typeof LANDMARK_BLUEPRINTS[0] | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const checkDark = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkDark();

    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const handlePlace = (lm: typeof LANDMARK_BLUEPRINTS[0]) => {
    sound.playLevelUp(soundEnabled);
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#6366F1', '#10B981', '#38BDF8'],
      });
    } catch (e) {}

    setCelebratingLandmark(lm);
  };

  const handleConfirmPlace = () => {
    if (celebratingLandmark && onPlaceLandmark) {
      onPlaceLandmark(celebratingLandmark.id);
    }
    setCelebratingLandmark(null);
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            <Trophy className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-medium text-slate-900 dark:text-zinc-100">
              หอเกียรติยศแลนด์มาร์ก (Landmarks)
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              สัญลักษณ์แห่งวินัย ปลดล็อกด้วยชั่วโมงโฟกัสที่คุณสั่งสมอย่างแท้จริง
            </p>
          </div>
        </div>
      </div>

      {/* 5 Landmark Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {LANDMARK_BLUEPRINTS.map((lm) => {
          const reqMinutes = lm.requiredMinutes || 300;
          const reqHours = (reqMinutes / 60).toFixed(0);
          const isUnlocked = totalFocusMinutes >= reqMinutes;
          const isPlaced = placedBuildings.some((b) => b.blueprintId === lm.id);
          const progressPercent = Math.min(100, Math.round((totalFocusMinutes / reqMinutes) * 100));
          const isMystery = !isUnlocked && totalFocusMinutes < reqMinutes * 0.3;

          return (
            <div
              key={lm.id}
              className={`relative overflow-hidden rounded-2xl border p-4.5 transition-colors ${
                isUnlocked
                  ? 'border-slate-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900'
                  : 'border-slate-200/70 bg-slate-50/50 opacity-80 dark:border-zinc-800/80 dark:bg-zinc-900/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {getLandmarkIcon(lm.id, 'h-5 w-5')}
                  </span>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <span>{isMystery ? 'สิ่งก่อสร้างลึกลับ (Unknown Landmark)' : lm.name}</span>
                      {isUnlocked && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </h4>
                    <span className="font-mono text-[11px] text-slate-500 dark:text-zinc-400">
                      สะสม {reqHours} ชม. ({reqMinutes} นาที)
                    </span>
                  </div>
                </div>

                {!isUnlocked && (
                  <span className="rounded-lg border border-slate-200 bg-white p-1 text-slate-400 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-500">
                    <Lock className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>

              {/* Architectural Preview Miniature */}
              <div className="my-2.5 flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/50 p-2 dark:border-zinc-800 dark:bg-zinc-900/50">
                <svg viewBox="0 0 100 80" className="h-20 w-28">
                  <BlueprintPreviewModel
                    blueprint={lm}
                    isoX={50}
                    isoY={45}
                    level={1}
                    isDarkMode={isDarkMode}
                    isPreview={!isUnlocked}
                    isMystery={isMystery}
                  />
                </svg>
              </div>

              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                {isMystery ? 'สถาปัตยกรรมระดับมหานครยังไม่เปิดเผยรูปร่าง สะสมสมาธิเพิ่มเพื่อค้นพบ' : lm.description}
              </p>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-500 dark:text-zinc-400">
                    ความก้าวหน้า
                  </span>
                  <span className="font-mono text-slate-700 dark:text-zinc-300">
                    {totalFocusMinutes} / {reqMinutes} นาที ({progressPercent}%)
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-zinc-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isUnlocked ? 'bg-slate-900 dark:bg-zinc-100' : 'bg-slate-400 dark:bg-zinc-500'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-zinc-800">
                {isPlaced ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <MapPin className="h-3.5 w-3.5" /> วางใน Focus City แล้ว
                  </span>
                ) : isUnlocked ? (
                  <button
                    onClick={() => handlePlace(lm)}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 transition-colors shadow-xs active:scale-95 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>นำไปวางในเมือง</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                    ต้องการเวลาอีก {reqMinutes - totalFocusMinutes} นาที
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Landmark Celebration Modal */}
      {celebratingLandmark && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {getLandmarkIcon(celebratingLandmark.id, 'h-7 w-7')}
            </div>

            <div className="mt-3 text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Landmark Unlocked
            </div>

            <h3 className="mt-1 text-base font-medium text-slate-900 dark:text-zinc-100">
              {celebratingLandmark.name}
            </h3>

            <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              {celebratingLandmark.description}
            </p>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setCelebratingLandmark(null)}
                className="flex-1 rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                ปิด
              </button>
              <button
                onClick={handleConfirmPlace}
                className="flex-1 rounded-lg bg-slate-900 py-2 text-xs font-medium text-white shadow-xs hover:bg-slate-800 active:scale-95 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                วางในเมืองทันที
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
