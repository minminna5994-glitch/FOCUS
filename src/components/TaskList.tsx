import React, { useState } from 'react';
import { Task, ActivityType } from '../types';
import { sound } from '../utils/audio';
import { getActivityIcon, getActivityLabel } from '../utils/categoryIcons';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Edit3,
  Play,
  CheckCircle2,
  Clock,
  X,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  activeTaskId?: string;
  onAddTask: (title: string, category: ActivityType, notes?: string) => void;
  onUpdateTask: (id: string, updates: Partial<Pick<Task, 'title' | 'category' | 'notes' | 'completed'>>) => void;
  onDeleteTask: (task: Task) => void;
  onSelectActiveTask: (id: string) => void;
  onStartTaskSession: (task: Task) => void;
  soundEnabled?: boolean;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  activeTaskId,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onSelectActiveTask,
  onStartTaskSession,
  soundEnabled = true,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [isAdding, setIsAdding] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [confirmDeleteTask, setConfirmDeleteTask] = useState<Task | null>(null);

  // Form states
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState<ActivityType>('reading');
  const [taskNotes, setTaskNotes] = useState('');

  const handleOpenAdd = () => {
    setTaskTitle('');
    setTaskCategory('reading');
    setTaskNotes('');
    setIsAdding(true);
    setEditingTask(null);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskCategory(task.category);
    setTaskNotes(task.notes || '');
    setIsAdding(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    sound.playTapSound(soundEnabled);

    if (editingTask) {
      onUpdateTask(editingTask.id, {
        title: taskTitle.trim(),
        category: taskCategory,
        notes: taskNotes.trim() || undefined,
      });
      setEditingTask(null);
    } else {
      onAddTask(taskTitle.trim(), taskCategory, taskNotes.trim() || undefined);
      setIsAdding(false);
    }

    setTaskTitle('');
    setTaskNotes('');
  };

  const handleToggle = (task: Task) => {
    sound.playCoinSound(soundEnabled);
    onUpdateTask(task.id, { completed: !task.completed });
  };

  const handleConfirmDelete = () => {
    if (!confirmDeleteTask) return;
    onDeleteTask(confirmDeleteTask);
    setConfirmDeleteTask(null);
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-colors dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-medium text-slate-900 dark:text-zinc-100">
              สิ่งที่ต้องทำ
            </h3>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-xs text-slate-600 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-400">
              {tasks.filter((t) => !t.completed).length}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
            จัดการงานและเลือกสิ่งที่ต้องการโฟกัส
          </p>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-zinc-800 dark:bg-zinc-950">
          <button
            onClick={() => setFilter('pending')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100'
                : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            กำลังทำ
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              filter === 'completed'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100'
                : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            เสร็จแล้ว
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100'
                : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            ทั้งหมด
          </button>
        </div>
      </div>

      {/* Add / Edit Task Form or Trigger */}
      <div className="mt-4">
        {!isAdding && !editingTask ? (
          <button
            onClick={handleOpenAdd}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3 text-xs font-medium text-slate-600 transition-colors hover:border-slate-400 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/50"
          >
            <Plus className="h-4 w-4" />
            <span>เพิ่มงานใหม่</span>
          </button>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition-colors dark:border-zinc-800 dark:bg-zinc-950/60"
          >
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                {editingTask ? 'แก้ไขงาน' : 'สร้างงานใหม่'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingTask(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <input
              type="text"
              autoFocus
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="ชื่องาน เช่น สรุปบทที่ 3, เขียนรายงานวิจัย, ออกแบบสถาปัตยกรรม..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-slate-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500"
            />

            <div className="mt-2.5">
              <input
                type="text"
                value={taskNotes}
                onChange={(e) => setTaskNotes(e.target.value)}
                placeholder="รายละเอียดเพิ่มเติมหรือโน้ต (ไม่จำเป็น)..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-slate-400 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:focus:border-zinc-500"
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-zinc-400">หมวดหมู่:</span>
                <select
                  value={taskCategory}
                  onChange={(e) => setTaskCategory(e.target.value as ActivityType)}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                >
                  <option value="reading">อ่านหนังสือ</option>
                  <option value="memory">ทบทวน</option>
                  <option value="work">ทำงาน</option>
                  <option value="project">โปรเจกต์</option>
                  <option value="creative">งานสร้างสรรค์</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingTask(null);
                  }}
                  className="rounded-lg px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200/60 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                >
                  {editingTask ? 'บันทึกการแก้ไข' : 'เพิ่มงาน'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Task List */}
      <div className="mt-4 space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400 dark:text-zinc-500">
            ไม่มีงานในหมวดนี้
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isActive = activeTaskId === task.id;
            return (
              <div
                key={task.id}
                className={`group flex items-start justify-between rounded-xl border p-3 text-xs transition-colors ${
                  isActive
                    ? 'border-slate-400 bg-slate-50/80 shadow-xs dark:border-zinc-600 dark:bg-zinc-800/50'
                    : task.completed
                    ? 'border-slate-100 bg-slate-50/40 text-slate-400 dark:border-zinc-800/60 dark:bg-zinc-950/40 dark:text-zinc-500'
                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700'
                }`}
              >
                {/* Toggle & Content */}
                <div className="flex flex-1 items-start gap-3 pr-2">
                  <button
                    type="button"
                    onClick={() => handleToggle(task)}
                    className="mt-0.5 text-slate-400 hover:text-slate-700 transition-colors dark:text-zinc-500 dark:hover:text-zinc-300"
                    title={task.completed ? 'ทำเครื่องหมายว่ายังไม่เสร็จ' : 'ทำเครื่องหมายว่าเสร็จแล้ว'}
                  >
                    {task.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-300 hover:text-slate-400 dark:text-zinc-600 dark:hover:text-zinc-400" />
                    )}
                  </button>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 dark:text-zinc-400">
                        {getActivityIcon(task.category, 'h-3.5 w-3.5')}
                      </span>
                      <span
                        className={`font-medium ${
                          task.completed
                            ? 'line-through text-slate-400 dark:text-zinc-500'
                            : 'text-slate-900 dark:text-zinc-100'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>

                    {task.notes && (
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2">
                        {task.notes}
                      </p>
                    )}

                    <div className="mt-1.5 flex items-center gap-3 text-[10px] text-slate-400 dark:text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>โฟกัสแล้ว {task.focusMinutesSpent} นาที</span>
                      </span>
                      <span className="rounded-sm bg-slate-100 px-1.5 py-0.5 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {getActivityLabel(task.category)}
                      </span>
                      {isActive && (
                        <span className="font-medium text-slate-700 dark:text-zinc-300">
                          · งานปัจจุบันใน Timer
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {!task.completed && (
                    <button
                      onClick={() => onStartTaskSession(task)}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                      title="เริ่มโฟกัสกับงานนี้"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      <span>โฟกัส</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenEdit(task)}
                    className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 transition-colors dark:text-zinc-500 dark:hover:text-zinc-300"
                    title="แก้ไขงาน"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => setConfirmDeleteTask(task)}
                    className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 transition-colors dark:text-zinc-500 dark:hover:text-rose-400"
                    title="ลบงานนี้"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDeleteTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-900 dark:text-zinc-100">
                  ต้องการลบงานนี้หรือไม่?
                </h4>
                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                  “{confirmDeleteTask.title}” จะถูกนำออกจากรายการ (สามารถกู้คืนได้ชั่วคราว)
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteTask(null)}
                className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
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
