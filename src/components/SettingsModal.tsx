import React, { useState } from 'react';
import { UserSettings, CityState, CustomPreset, Task } from '../types';
import { sound } from '../utils/audio';
import {
  X,
  Moon,
  Sun,
  Monitor,
  Volume2,
  VolumeX,
  Target,
  SlidersHorizontal,
  CheckSquare,
  RotateCcw,
  ShieldCheck,
  Building2,
  AlertCircle,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  cityState: CityState;
  onRenameCity: (newName: string) => void;
  tasks: Task[];
  onClearCompletedTasks: () => void;
  onResetGoals: () => void;
  onResetData: () => void;
  onOpenManagePresets?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  cityState,
  onRenameCity,
  tasks,
  onClearCompletedTasks,
  onResetGoals,
  onResetData,
  onOpenManagePresets,
}) => {
  const [showConfirmResetData, setShowConfirmResetData] = useState(false);
  const [showConfirmResetGoals, setShowConfirmResetGoals] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-medium text-slate-900 dark:text-zinc-100">
              การตั้งค่า
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              ปรับแต่งธีม ระบบเวลา และจัดการข้อมูล
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Section: Appearance */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 tracking-wider uppercase dark:text-zinc-400">
              โหมดการแสดงผล (Appearance)
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: 'light' })}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-colors ${
                  settings.theme === 'light'
                    ? 'border-slate-400 bg-slate-50 text-slate-900 dark:border-zinc-500 dark:bg-zinc-800 dark:text-zinc-100'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/40'
                }`}
              >
                <Sun className="h-4 w-4" />
                <span>Light</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: 'dark' })}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-colors ${
                  settings.theme === 'dark'
                    ? 'border-slate-400 bg-slate-50 text-slate-900 dark:border-zinc-500 dark:bg-zinc-800 dark:text-zinc-100'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/40'
                }`}
              >
                <Moon className="h-4 w-4" />
                <span>Dark</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: 'system' })}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-colors ${
                  settings.theme === 'system'
                    ? 'border-slate-400 bg-slate-50 text-slate-900 dark:border-zinc-500 dark:bg-zinc-800 dark:text-zinc-100'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/40'
                }`}
              >
                <Monitor className="h-4 w-4" />
                <span>System</span>
              </button>
            </div>
          </div>

          {/* Section: Focus Goals */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-500 tracking-wider uppercase dark:text-zinc-400">
                เป้าหมายการโฟกัส (Goals)
              </h4>
              <button
                type="button"
                onClick={() => setShowConfirmResetGoals(true)}
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset เป้าหมาย</span>
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3 dark:border-zinc-800 dark:bg-zinc-900">
              <div>
                <div className="flex justify-between text-xs text-slate-700 dark:text-zinc-300">
                  <span>เป้าหมายรายวัน:</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-zinc-100">
                    {settings.dailyGoalMinutes} นาที ({(settings.dailyGoalMinutes / 60).toFixed(1)} ชม.)
                  </span>
                </div>
                <div className="mt-2 flex gap-1.5">
                  {[60, 90, 120, 180, 240].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => onUpdateSettings({ dailyGoalMinutes: mins })}
                      className={`flex-1 rounded-lg border py-1 font-mono text-xs transition-colors ${
                        settings.dailyGoalMinutes === mins
                          ? 'border-slate-400 bg-slate-100 font-medium text-slate-900 dark:border-zinc-500 dark:bg-zinc-800 dark:text-zinc-100'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
                      }`}
                    >
                      {mins}น.
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 dark:border-zinc-800">
                <div className="flex justify-between text-xs text-slate-700 dark:text-zinc-300">
                  <span>เป้าหมายรายสัปดาห์:</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-zinc-100">
                    {settings.weeklyGoalMinutes} นาที ({(settings.weeklyGoalMinutes / 60).toFixed(1)} ชม.)
                  </span>
                </div>
                <div className="mt-2 flex gap-1.5">
                  {[350, 500, 700, 1000].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => onUpdateSettings({ weeklyGoalMinutes: mins })}
                      className={`flex-1 rounded-lg border py-1 font-mono text-xs transition-colors ${
                        settings.weeklyGoalMinutes === mins
                          ? 'border-slate-400 bg-slate-100 font-medium text-slate-900 dark:border-zinc-500 dark:bg-zinc-800 dark:text-zinc-100'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
                      }`}
                    >
                      {mins}น.
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Sound & Focus Preferences */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 tracking-wider uppercase dark:text-zinc-400">
              การโฟกัสและเสียง (Focus & Sound)
            </h4>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3 dark:border-zinc-800 dark:bg-zinc-900">
              {/* Default Focus Mode */}
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-medium text-slate-700 dark:text-zinc-300 block">
                    โหมดเริ่มต้น (Default Mode)
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                    ระดับความเข้มข้นที่เปิดให้เลือกแรกเริ่ม
                  </span>
                </div>
                <select
                  value={settings.defaultFocusMode || 'standard'}
                  onChange={(e) =>
                    onUpdateSettings({ defaultFocusMode: e.target.value as any })
                  }
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  <option value="light">Light Focus (20น.)</option>
                  <option value="standard">Standard Focus (40น.)</option>
                  <option value="deep">Deep Focus (50น.)</option>
                </select>
              </div>

              {/* Sound Toggle */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-zinc-800">
                <div>
                  <span className="font-medium text-slate-700 dark:text-zinc-300 block">
                    เสียงแจ้งเตือน (Notifications)
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                    เสียงกระดิ่งเมื่อหมดเวลา และเสียงคลิก
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
                  className={`rounded-lg px-3 py-1 font-medium transition-colors ${
                    settings.soundEnabled
                      ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                      : 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}
                >
                  {settings.soundEnabled ? 'เปิด' : 'ปิด'}
                </button>
              </div>

              {/* City Name */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-zinc-800">
                <span className="font-medium text-slate-700 dark:text-zinc-300">
                  ชื่อเมืองของคุณ:
                </span>
                <input
                  type="text"
                  value={cityState.name}
                  onChange={(e) => onRenameCity(e.target.value)}
                  className="w-40 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
            </div>
          </div>

          {/* Section: Data Management */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 tracking-wider uppercase dark:text-zinc-400">
              การจัดการข้อมูล (Data)
            </h4>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3 dark:border-zinc-800 dark:bg-zinc-900 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-700 dark:text-zinc-300 block">
                    จัดการ Presets
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                    ปรับแต่งและสร้างรูปแบบเวลาที่คุณใช้ประจำ
                  </span>
                </div>
                {onOpenManagePresets && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenManagePresets();
                    }}
                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    เปิด Presets
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-zinc-800">
                <div>
                  <span className="font-medium text-slate-700 dark:text-zinc-300 block">
                    ล้างงานที่เสร็จแล้ว (Clear completed tasks)
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                    งานเสร็จแล้ว {tasks.filter((t) => t.completed).length} รายการ
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onClearCompletedTasks}
                  disabled={tasks.filter((t) => t.completed).length === 0}
                  className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  ล้างรายการเสร็จ
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-zinc-800">
                <div>
                  <span className="font-medium text-rose-600 dark:text-rose-400 block">
                    รีเซ็ตข้อมูลทั้งหมด (Reset App Data)
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                    ล้างประวัติ งาน และความคืบหน้าของเมืองกลับสู่ค่าเริ่มต้น
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfirmResetData(true)}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-400"
                >
                  รีเซ็ต
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Reset Goals */}
      {showConfirmResetGoals && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <h4 className="text-sm font-medium text-slate-900 dark:text-zinc-100">
              รีเซ็ตเป้าหมายกลับเป็นค่าเริ่มต้น?
            </h4>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              เป้าหมายรายวันจะถูกปรับเป็น 120 นาที และรายสัปดาห์ 700 นาที
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmResetGoals(false)}
                className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetGoals();
                  setShowConfirmResetGoals(false);
                }}
                className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Reset Data */}
      {showConfirmResetData && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-900 dark:text-zinc-100">
                  ต้องการรีเซ็ตข้อมูลทั้งหมดหรือไม่?
                </h4>
                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                  ประวัติการโฟกัส อาคารทั้งหมดในเมือง และรายการงานจะกลับสู่ค่าเริ่มต้น
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmResetData(false)}
                className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmResetData(false);
                  onResetData();
                  onClose();
                }}
                className="rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-rose-700"
              >
                รีเซ็ตข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
