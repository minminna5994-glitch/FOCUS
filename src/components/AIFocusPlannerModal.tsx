import React, { useState } from 'react';
import { AIPlanResult, AISessionItem, ActivityType } from '../types';
import { sound } from '../utils/audio';
import { getActivityIcon, getActivityLabel } from '../utils/categoryIcons';
import {
  Sparkles,
  X,
  Loader2,
  Clock,
  Coffee,
  CheckCircle2,
  Edit3,
  Plus,
  Trash2,
  Play,
  ArrowUp,
  ArrowDown,
  Info,
} from 'lucide-react';

interface AIFocusPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPlan: (plan: AIPlanResult, addAsTasks: boolean) => void;
  soundEnabled?: boolean;
}

export const AIFocusPlannerModal: React.FC<AIFocusPlannerModalProps> = ({
  isOpen,
  onClose,
  onApplyPlan,
  soundEnabled = true,
}) => {
  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState<ActivityType>('reading');
  const [isLoading, setIsLoading] = useState(false);
  const [planResult, setPlanResult] = useState<AIPlanResult | null>(null);
  const [addTasks, setAddTasks] = useState(true);

  if (!isOpen) return null;

  const quickPrompts = [
    'มีเวลาอ่านหนังสือสอบ 2 ชั่วโมง',
    'ต้องอ่านหนังสือ 4 บทในเวลา 3 ชั่วโมง',
    'เขียนรายงานและค้นคว้า 10 หน้า ในบ่ายนี้',
    'ทำโปรเจกต์เขียนเว็บ 4 ชั่วโมง',
  ];

  const handleGenerate = async (queryText?: string) => {
    const textToUse = queryText || prompt;
    if (!textToUse.trim()) return;

    sound.playTapSound(soundEnabled);
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: textToUse.trim(),
          category,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate plan');
      }

      const data: AIPlanResult = await res.json();
      setPlanResult(data);
      sound.playLevelUp(soundEnabled);
    } catch (err) {
      console.warn('API error or fallback mode:', err);
      // Fallback structured plan
      setPlanResult({
        planTitle: `แผนโฟกัส: ${textToUse.slice(0, 35)}`,
        reasoning:
          'แบ่งเนื้อหาออกเป็นช่วงสั้นเพื่อรักษาการจดจำและพลังงานสมองในระดับสูง พร้อมช่วงพักเพื่อคลายความล้า',
        totalEstimatedMinutes: 90,
        sessions: [
          {
            order: 1,
            name: 'ช่วงที่ 1: โครงสร้างหลักและประเด็นสำคัญ',
            focusMinutes: 25,
            breakMinutes: 5,
            topic: 'ทำความเข้าใจภาพรวมและจัดระเบียบหัวข้อ',
            tips: 'จดบันทึกคำสำคัญสั้น ๆ',
          },
          {
            order: 2,
            name: 'ช่วงที่ 2: เจาะลึกเนื้อหาและแก้โจทย์',
            focusMinutes: 35,
            breakMinutes: 10,
            topic: 'ลงมือทำส่วนที่ยากที่สุดขณะที่สมองพร้อม',
            tips: 'หลีกเลี่ยงการเปิดหลายแท็บพร้อมกัน',
          },
          {
            order: 3,
            name: 'ช่วงที่ 3: ทบทวนและทดสอบความเข้าใจ',
            focusMinutes: 20,
            breakMinutes: 5,
            topic: 'สรุปผลและทดสอบความจำ (Active Recall)',
            tips: 'อธิบายสรุปสั้น ๆ ด้วยสำนวนตัวเอง',
          },
        ],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSession = (index: number, field: keyof AISessionItem, value: any) => {
    if (!planResult) return;
    const updated = [...planResult.sessions];
    updated[index] = { ...updated[index], [field]: value };
    const totalMinutes = updated.reduce((sum, s) => sum + s.focusMinutes + s.breakMinutes, 0);
    setPlanResult({
      ...planResult,
      totalEstimatedMinutes: totalMinutes,
      sessions: updated,
    });
  };

  const handleDeleteSession = (index: number) => {
    if (!planResult) return;
    const updated = planResult.sessions
      .filter((_, i) => i !== index)
      .map((s, idx) => ({ ...s, order: idx + 1 }));
    const totalMinutes = updated.reduce((sum, s) => sum + s.focusMinutes + s.breakMinutes, 0);
    setPlanResult({
      ...planResult,
      totalEstimatedMinutes: totalMinutes,
      sessions: updated,
    });
  };

  const handleMoveSession = (index: number, direction: 'up' | 'down') => {
    if (!planResult) return;
    const sessions = [...planResult.sessions];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sessions.length) return;

    const temp = sessions[index];
    sessions[index] = sessions[targetIdx];
    sessions[targetIdx] = temp;

    // Re-index orders
    const reordered = sessions.map((s, idx) => ({ ...s, order: idx + 1 }));
    setPlanResult({
      ...planResult,
      sessions: reordered,
    });
  };

  const handleAddSession = () => {
    if (!planResult) return;
    const nextOrder = planResult.sessions.length + 1;
    const newSession: AISessionItem = {
      order: nextOrder,
      name: `ช่วงที่ ${nextOrder}: ทบทวนและสรุปผล`,
      focusMinutes: 25,
      breakMinutes: 5,
      topic: 'จัดระเบียบเนื้อหาและตรวจสอบความเรียบร้อย',
      tips: 'รักษาความสงบและสมาธิ',
    };
    const updated = [...planResult.sessions, newSession];
    const totalMinutes = updated.reduce((sum, s) => sum + s.focusMinutes + s.breakMinutes, 0);
    setPlanResult({
      ...planResult,
      totalEstimatedMinutes: totalMinutes,
      sessions: updated,
    });
  };

  const handleApply = () => {
    if (!planResult || planResult.sessions.length === 0) return;
    sound.playCoinSound(soundEnabled);
    onApplyPlan(planResult, addTasks);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-slate-700 dark:text-zinc-300" />
            <div>
              <h2 className="text-sm font-medium text-slate-900 dark:text-zinc-100">
                AI Focus Planner
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                วางแผนแบ่งช่วงโฟกัสและพักผ่อนตามเป้าหมาย
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {!planResult ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                  บอกเป้าหมายหรือเวลาที่คุณมี:
                </label>
                <textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="เช่น ต้องการอ่านหนังสือชีววิทยา 3 บท มีเวลาประมาณ 2 ชั่วโมง..."
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 focus:border-slate-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                  หมวดหมู่หลัก:
                </label>
                <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {(['reading', 'memory', 'work', 'project', 'creative'] as ActivityType[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs transition-colors ${
                        category === cat
                          ? 'border-slate-400 bg-slate-50 text-slate-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/40'
                      }`}
                    >
                      {getActivityIcon(cat, 'h-3.5 w-3.5')}
                      <span>{getActivityLabel(cat)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-[11px] text-slate-500 dark:text-zinc-400">
                  ตัวอย่างคำค้นที่พบบ่อย:
                </span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {quickPrompts.map((qp) => (
                    <button
                      key={qp}
                      type="button"
                      onClick={() => {
                        setPrompt(qp);
                        handleGenerate(qp);
                      }}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 hover:border-slate-300 hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      {qp}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  disabled={isLoading || !prompt.trim()}
                  onClick={() => handleGenerate()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>กำลังประมวลผลแผน...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>สร้างแผนโฟกัสอัจฉริยะ</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Plan Result - Editable & Unlocked */
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/60">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={planResult.planTitle}
                    onChange={(e) =>
                      setPlanResult({ ...planResult, planTitle: e.target.value })
                    }
                    className="flex-1 font-medium text-sm text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-500 focus:outline-hidden dark:text-zinc-100"
                  />
                  <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
                    รวม {planResult.totalEstimatedMinutes} นาที
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                  {planResult.reasoning}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                  รายการช่วงเวลา (สามารถปรับเปลี่ยน ลบ หรือสลับลำดับได้):
                </span>
                <button
                  type="button"
                  onClick={handleAddSession}
                  className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>เพิ่มช่วง</span>
                </button>
              </div>

              {/* Sessions list */}
              <div className="space-y-2.5">
                {planResult.sessions.map((s, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-1 items-center gap-2">
                        <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-600 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-400">
                          #{s.order}
                        </span>
                        <input
                          type="text"
                          value={s.name}
                          onChange={(e) => handleUpdateSession(index, 'name', e.target.value)}
                          className="flex-1 text-xs font-medium text-slate-900 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-slate-400 focus:outline-hidden dark:text-zinc-100"
                        />
                      </div>

                      {/* Reorder and Delete controls */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveSession(index, 'up')}
                          className="rounded p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 dark:hover:text-zinc-200"
                          title="เลื่อนขึ้น"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === planResult.sessions.length - 1}
                          onClick={() => handleMoveSession(index, 'down')}
                          className="rounded p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 dark:hover:text-zinc-200"
                          title="เลื่อนลง"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSession(index)}
                          className="rounded p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                          title="ลบช่วงนี้"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 dark:text-zinc-400">โฟกัส:</span>
                        <input
                          type="number"
                          min="5"
                          max="120"
                          value={s.focusMinutes}
                          onChange={(e) =>
                            handleUpdateSession(index, 'focusMinutes', Number(e.target.value))
                          }
                          className="w-16 rounded-md border border-slate-200 bg-white px-2 py-0.5 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                        />
                        <span className="text-[11px] text-slate-500">น.</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 dark:text-zinc-400">พัก:</span>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={s.breakMinutes}
                          onChange={(e) =>
                            handleUpdateSession(index, 'breakMinutes', Number(e.target.value))
                          }
                          className="w-16 rounded-md border border-slate-200 bg-white px-2 py-0.5 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                        />
                        <span className="text-[11px] text-slate-500">น.</span>
                      </div>
                    </div>

                    <div className="mt-2">
                      <input
                        type="text"
                        value={s.topic}
                        onChange={(e) => handleUpdateSession(index, 'topic', e.target.value)}
                        placeholder="รายละเอียดเป้าหมาย..."
                        className="w-full text-[11px] text-slate-500 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-slate-400 focus:outline-hidden dark:text-zinc-400"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Add tasks checkbox */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="addTasksCheckbox"
                  checked={addTasks}
                  onChange={(e) => setAddTasks(e.target.checked)}
                  className="rounded border-slate-300 dark:border-zinc-700"
                />
                <label
                  htmlFor="addTasksCheckbox"
                  className="text-xs text-slate-600 dark:text-zinc-400 cursor-pointer"
                >
                  บันทึกช่วงทั้งหมดลงในรายการสิ่งที่ต้องทำ (Tasks) ด้วย
                </label>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setPlanResult(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  ย้อนกลับ / ตั้งค่าใหม่
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    ปิด
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                  >
                    บันทึกและเริ่มใช้แผน
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
