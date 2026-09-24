import React, { useState } from 'react';
import { ActivityType, CustomPreset, Task } from '../types';
import { sound } from '../utils/audio';
import { getActivityIcon, getActivityLabel } from '../utils/categoryIcons';
import {
  X,
  Zap,
  SlidersHorizontal,
  Play,
  Clock,
  Plus,
  Trash2,
  Edit3,
  Bookmark,
  Coffee,
  RotateCcw,
  Check,
  AlertCircle,
} from 'lucide-react';

interface PresetSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: ActivityType;
  tasks: Task[];
  onStartSession: (config: {
    focusMinutes: number;
    breakMinutes: number;
    totalRounds: number;
    taskId?: string;
    taskTitle: string;
    category: ActivityType;
    modeName?: string;
  }) => void;
  savedPresets: CustomPreset[];
  onSaveCustomPreset: (preset: CustomPreset) => void;
  onDeleteCustomPreset: (preset: CustomPreset) => void;
  soundEnabled?: boolean;
}

export const PresetSelectorModal: React.FC<PresetSelectorModalProps> = ({
  isOpen,
  onClose,
  category,
  tasks,
  onStartSession,
  savedPresets,
  onSaveCustomPreset,
  onDeleteCustomPreset,
  soundEnabled = true,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [customTaskTitle, setCustomTaskTitle] = useState<string>('');
  const [tuningPreset, setTuningPreset] = useState<'light' | 'standard' | 'deep' | null>(null);

  // Fine-tuning values
  const [customFocus, setCustomFocus] = useState<number>(25);
  const [customBreak, setCustomBreak] = useState<number>(5);
  const [customRounds, setCustomRounds] = useState<number>(1);
  const [customLongBreak, setCustomLongBreak] = useState<number>(15);

  // Tab: 'presets' | 'quick' | 'saved'
  const [activeTab, setActiveTab] = useState<'presets' | 'quick' | 'saved'>('presets');

  // Custom Preset Create/Edit states
  const [isEditingPreset, setIsEditingPreset] = useState<CustomPreset | null>(null);
  const [showPresetForm, setShowPresetForm] = useState(false);
  const [presetFormName, setPresetFormName] = useState('');
  const [presetFormFocus, setPresetFormFocus] = useState(25);
  const [presetFormBreak, setPresetFormBreak] = useState(5);
  const [presetFormRounds, setPresetFormRounds] = useState(2);
  const [presetFormLongBreak, setPresetFormLongBreak] = useState(15);

  // Confirm delete preset
  const [confirmDeletePreset, setConfirmDeletePreset] = useState<CustomPreset | null>(null);

  if (!isOpen) return null;

  const getCategoryDefaults = () => {
    switch (category) {
      case 'reading':
        return {
          title: 'อ่านหนังสือ',
          light: { focus: 20, break: 5, desc: 'ช่วงสั้น เหมาะกับการเริ่มต้น' },
          standard: { focus: 40, break: 10, desc: 'โฟกัสต่อเนื่องในระดับปกติ' },
          deep: { focus: 50, break: 10, desc: 'สำหรับช่วงที่ต้องการสมาธิต่อเนื่อง' },
        };
      case 'memory':
        return {
          title: 'ท่องจำ / ทบทวน',
          light: { focus: 15, break: 5, desc: 'ช่วงสั้น เหมาะกับการเริ่มต้น' },
          standard: { focus: 30, break: 5, desc: 'โฟกัสต่อเนื่องในระดับปกติ' },
          deep: { focus: 45, break: 10, desc: 'สำหรับช่วงที่ต้องการสมาธิต่อเนื่อง' },
        };
      case 'work':
        return {
          title: 'ทำงาน / การบ้าน',
          light: { focus: 25, break: 5, desc: 'ช่วงสั้น เหมาะกับการเริ่มต้น' },
          standard: { focus: 45, break: 10, desc: 'โฟกัสต่อเนื่องในระดับปกติ' },
          deep: { focus: 60, break: 15, desc: 'สำหรับช่วงที่ต้องการสมาธิต่อเนื่อง' },
        };
      case 'project':
        return {
          title: 'ทำโปรเจกต์',
          light: { focus: 30, break: 5, desc: 'ช่วงสั้น เหมาะกับการเริ่มต้น' },
          standard: { focus: 50, break: 10, desc: 'โฟกัสต่อเนื่องในระดับปกติ' },
          deep: { focus: 75, break: 15, desc: 'สำหรับช่วงที่ต้องการสมาธิต่อเนื่อง' },
        };
      case 'creative':
        return {
          title: 'งานสร้างสรรค์',
          light: { focus: 25, break: 5, desc: 'ช่วงสั้น เหมาะกับการเริ่มต้น' },
          standard: { focus: 45, break: 10, desc: 'โฟกัสต่อเนื่องในระดับปกติ' },
          deep: { focus: 60, break: 15, desc: 'สำหรับช่วงที่ต้องการสมาธิต่อเนื่อง' },
        };
      default:
        return {
          title: 'โฟกัสทั่วไป',
          light: { focus: 20, break: 5, desc: 'ช่วงสั้น เหมาะกับการเริ่มต้น' },
          standard: { focus: 40, break: 10, desc: 'โฟกัสต่อเนื่องในระดับปกติ' },
          deep: { focus: 50, break: 10, desc: 'สำหรับช่วงที่ต้องการสมาธิต่อเนื่อง' },
        };
    }
  };

  const defs = getCategoryDefaults();

  const presetsConfig = [
    {
      id: 'light' as const,
      name: 'Light Focus',
      description: defs.light.desc,
      focus: defs.light.focus,
      breakTime: defs.light.break,
    },
    {
      id: 'standard' as const,
      name: 'Standard Focus',
      description: defs.standard.desc,
      focus: defs.standard.focus,
      breakTime: defs.standard.break,
    },
    {
      id: 'deep' as const,
      name: 'Deep Focus',
      description: defs.deep.desc,
      focus: defs.deep.focus,
      breakTime: defs.deep.break,
    },
  ];

  const getTaskTitle = () => {
    const selectedTask = tasks.find((t) => t.id === selectedTaskId);
    return selectedTask ? selectedTask.title : customTaskTitle || defs.title;
  };

  const handleStartPreset = (focus: number, breakTime: number, modeName: string, rounds = 1) => {
    sound.playTapSound(soundEnabled);
    onStartSession({
      focusMinutes: focus,
      breakMinutes: breakTime,
      totalRounds: rounds,
      taskId: selectedTaskId || undefined,
      taskTitle: getTaskTitle(),
      category,
      modeName,
    });
    onClose();
  };

  const handleOpenTune = (presetId: 'light' | 'standard' | 'deep') => {
    const target = presetsConfig.find((p) => p.id === presetId)!;
    setTuningPreset(presetId);
    setCustomFocus(target.focus);
    setCustomBreak(target.breakTime);
    setCustomRounds(1);
    setCustomLongBreak(15);
  };

  const handleOpenCreatePreset = () => {
    setIsEditingPreset(null);
    setPresetFormName('');
    setPresetFormFocus(25);
    setPresetFormBreak(5);
    setPresetFormRounds(2);
    setPresetFormLongBreak(15);
    setShowPresetForm(true);
  };

  const handleOpenEditPreset = (p: CustomPreset) => {
    setIsEditingPreset(p);
    setPresetFormName(p.name);
    setPresetFormFocus(p.focusMinutes);
    setPresetFormBreak(p.breakMinutes);
    setPresetFormRounds(p.rounds);
    setPresetFormLongBreak(p.longBreakMinutes || 15);
    setShowPresetForm(true);
  };

  const handleSavePresetForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetFormName.trim()) return;

    sound.playTapSound(soundEnabled);
    const newPreset: CustomPreset = {
      id: isEditingPreset ? isEditingPreset.id : 'cp-' + Date.now(),
      name: presetFormName.trim(),
      focusMinutes: presetFormFocus,
      breakMinutes: presetFormBreak,
      rounds: presetFormRounds,
      longBreakMinutes: presetFormLongBreak,
      longBreakEvery: 4,
    };

    onSaveCustomPreset(newPreset);
    setShowPresetForm(false);
    setIsEditingPreset(null);
  };

  const handleConfirmDeletePreset = () => {
    if (!confirmDeletePreset) return;
    onDeleteCustomPreset(confirmDeletePreset);
    setConfirmDeletePreset(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <span className="text-slate-500 dark:text-zinc-400">
              {getActivityIcon(category, 'h-4 w-4')}
            </span>
            <div>
              <h2 className="text-sm font-medium text-slate-900 dark:text-zinc-100">
                กำหนดเวลาโฟกัส ({defs.title})
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                เลือกรูปแบบความเข้มข้นหรือตั้งค่าตามต้องการ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Linked Task Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
              ชื่องานสำหรับรอบนี้:
            </label>
            <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
              {tasks.length > 0 && (
                <select
                  value={selectedTaskId}
                  onChange={(e) => {
                    setSelectedTaskId(e.target.value);
                    if (e.target.value) setCustomTaskTitle('');
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 sm:w-1/2"
                >
                  <option value="">เลือกจากรายการงาน</option>
                  {tasks
                    .filter((t) => !t.completed)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                </select>
              )}
              <input
                type="text"
                placeholder={selectedTaskId ? 'ชื่องานที่เลือกไว้' : 'หรือพิมพ์ชื่องานเฉพาะรอบนี้...'}
                value={customTaskTitle}
                disabled={!!selectedTaskId}
                onChange={(e) => setCustomTaskTitle(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:outline-hidden disabled:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:disabled:bg-zinc-800/50"
              />
            </div>
          </div>

          {/* Preset Tabs */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-zinc-800 dark:bg-zinc-950">
            <button
              onClick={() => setActiveTab('presets')}
              className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                activeTab === 'presets'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100'
                  : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              ระดับสมาธิ
            </button>
            <button
              onClick={() => setActiveTab('quick')}
              className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                activeTab === 'quick'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100'
                  : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              Quick Focus
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                activeTab === 'saved'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100'
                  : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              My Presets ({savedPresets.length})
            </button>
          </div>

          {/* TAB 1: Recommended Modes */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              {presetsConfig.map((p) => {
                const isTuningThis = tuningPreset === p.id;
                return (
                  <div
                    key={p.id}
                    className={`rounded-xl border p-4 transition-colors ${
                      isTuningThis
                        ? 'border-slate-400 bg-slate-50/60 dark:border-zinc-600 dark:bg-zinc-800/40'
                        : 'border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
                    }`}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-medium text-slate-900 dark:text-zinc-100">
                            {p.name}
                          </h4>
                          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-mono text-slate-600 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-400">
                            โฟกัส {p.focus} นาที · พัก {p.breakTime} นาที
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                          {p.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                        <button
                          onClick={() => handleOpenTune(p.id)}
                          className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                            isTuningThis
                              ? 'border-slate-400 bg-white text-slate-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
                          }`}
                        >
                          <SlidersHorizontal className="inline mr-1 h-3 w-3" />
                          ปรับเวลา
                        </button>

                        <button
                          onClick={() => handleStartPreset(p.focus, p.breakTime, p.name)}
                          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                        >
                          <Play className="inline mr-1 h-3 w-3 fill-current" />
                          ใช้เวลานี้
                        </button>
                      </div>
                    </div>

                    {/* Fine tuning drawer */}
                    {isTuningThis && (
                      <div className="mt-4 border-t border-slate-200 pt-3 dark:border-zinc-800 space-y-3">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div>
                            <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-zinc-400">
                              <span>เวลาโฟกัส</span>
                              <span className="font-mono text-slate-900 dark:text-zinc-100">
                                {customFocus} นาที
                              </span>
                            </div>
                            <input
                              type="range"
                              min="5"
                              max="120"
                              step="5"
                              value={customFocus}
                              onChange={(e) => setCustomFocus(Number(e.target.value))}
                              className="mt-1.5 w-full accent-slate-900 dark:accent-zinc-100"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-zinc-400">
                              <span>เวลาพัก</span>
                              <span className="font-mono text-slate-900 dark:text-zinc-100">
                                {customBreak} นาที
                              </span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="30"
                              step="1"
                              value={customBreak}
                              onChange={(e) => setCustomBreak(Number(e.target.value))}
                              className="mt-1.5 w-full accent-slate-900 dark:accent-zinc-100"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-zinc-400">
                              <span>จำนวนรอบ</span>
                              <span className="font-mono text-slate-900 dark:text-zinc-100">
                                {customRounds} รอบ
                              </span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="6"
                              step="1"
                              value={customRounds}
                              onChange={(e) => setCustomRounds(Number(e.target.value))}
                              className="mt-1.5 w-full accent-slate-900 dark:accent-zinc-100"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              onSaveCustomPreset({
                                id: 'cp-' + Date.now(),
                                name: `${defs.title} (${customFocus}/${customBreak}m)`,
                                focusMinutes: customFocus,
                                breakMinutes: customBreak,
                                rounds: customRounds,
                                longBreakMinutes: customLongBreak,
                                longBreakEvery: 4,
                              });
                            }}
                            className="text-xs text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 flex items-center gap-1"
                          >
                            <Bookmark className="h-3 w-3" />
                            <span>บันทึกเป็น Preset</span>
                          </button>

                          <button
                            onClick={() =>
                              handleStartPreset(
                                customFocus,
                                customBreak,
                                `${p.name} (กำหนดเอง)`,
                                customRounds
                              )
                            }
                            className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                          >
                            เริ่มโฟกัส ({customFocus}น. x {customRounds} รอบ)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: Quick Focus */}
          {activeTab === 'quick' && (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {[
                { label: '10 นาที', f: 10, b: 2, r: 1, desc: '10น. + พัก 2น.' },
                { label: '15 นาที', f: 12, b: 3, r: 1, desc: '12น. + พัก 3น.' },
                { label: '25 นาที', f: 25, b: 5, r: 1, desc: 'Pomodoro มาตรฐาน' },
                { label: '45 นาที', f: 45, b: 10, r: 1, desc: '45น. + พัก 10น.' },
                { label: '1 ชั่วโมง', f: 25, b: 5, r: 2, desc: '25น. x 2 รอบ' },
                { label: '2 ชั่วโมง', f: 50, b: 10, r: 2, desc: '50น. x 2 รอบ' },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() =>
                    handleStartPreset(opt.f, opt.b, `Quick Focus (${opt.label})`, opt.r)
                  }
                  className="flex flex-col items-start rounded-xl border border-slate-200 bg-white p-3.5 text-left transition-colors hover:border-slate-400 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/60"
                >
                  <span className="font-mono text-sm font-medium text-slate-900 dark:text-zinc-100">
                    {opt.label}
                  </span>
                  <span className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400">
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* TAB 3: Saved My Presets (CRUD) */}
          {activeTab === 'saved' && (
            <div className="space-y-3">
              {/* Add Preset Button */}
              {!showPresetForm && (
                <button
                  onClick={handleOpenCreatePreset}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-2.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-400 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>สร้าง Preset ใหม่</span>
                </button>
              )}

              {/* Form for Creating or Editing Preset */}
              {showPresetForm && (
                <form
                  onSubmit={handleSavePresetForm}
                  className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 transition-colors dark:border-zinc-800 dark:bg-zinc-950/60 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-zinc-800">
                    <span className="text-xs font-medium text-slate-800 dark:text-zinc-200">
                      {isEditingPreset ? 'แก้ไข Preset' : 'สร้าง Preset ใหม่'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPresetForm(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 dark:text-zinc-400">
                      ชื่อ Preset:
                    </label>
                    <input
                      type="text"
                      autoFocus
                      required
                      value={presetFormName}
                      onChange={(e) => setPresetFormName(e.target.value)}
                      placeholder="เช่น อ่านหนังสือก่อนนอน, เขียนโค้ดเข้มข้น..."
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-slate-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-zinc-400">
                        โฟกัส (นาที)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="180"
                        value={presetFormFocus}
                        onChange={(e) => setPresetFormFocus(Number(e.target.value))}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-zinc-400">
                        พัก (นาที)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={presetFormBreak}
                        onChange={(e) => setPresetFormBreak(Number(e.target.value))}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-zinc-400">
                        จำนวนรอบ
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={presetFormRounds}
                        onChange={(e) => setPresetFormRounds(Number(e.target.value))}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-zinc-400">
                        Long Break
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="60"
                        value={presetFormLongBreak}
                        onChange={(e) => setPresetFormLongBreak(Number(e.target.value))}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowPresetForm(false)}
                      className="rounded-lg px-3 py-1 text-xs text-slate-500 hover:bg-slate-200/60 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-slate-900 px-3.5 py-1 text-xs font-medium text-white hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                    >
                      {isEditingPreset ? 'บันทึกการแก้ไข' : 'บันทึก Preset'}
                    </button>
                  </div>
                </form>
              )}

              {/* Saved Presets List */}
              {savedPresets.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500">
                  ยังไม่มี My Preset ที่บันทึกไว้
                </div>
              ) : (
                savedPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div>
                      <h4 className="text-xs font-medium text-slate-900 dark:text-zinc-100">
                        {preset.name}
                      </h4>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                        โฟกัส {preset.focusMinutes}น. · พัก {preset.breakMinutes}น. · {preset.rounds} รอบ · พักยาว {preset.longBreakMinutes || 15}น.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          handleStartPreset(
                            preset.focusMinutes,
                            preset.breakMinutes,
                            preset.name,
                            preset.rounds
                          )
                        }
                        className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                      >
                        ใช้เวลานี้
                      </button>

                      <button
                        onClick={() => handleOpenEditPreset(preset)}
                        className="rounded-lg p-1 text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-300"
                        title="แก้ไข"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => setConfirmDeletePreset(preset)}
                        className="rounded-lg p-1 text-slate-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400"
                        title="ลบ"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal for Preset */}
      {confirmDeletePreset && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-900 dark:text-zinc-100">
                  ต้องการลบ Preset นี้หรือไม่?
                </h4>
                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                  “{confirmDeletePreset.name}” จะถูกลบออก (สามารถกู้คืนได้ชั่วคราว)
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeletePreset(null)}
                className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePreset}
                className="rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500"
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
