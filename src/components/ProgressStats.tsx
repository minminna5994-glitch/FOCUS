import React from 'react';
import { CompletedSession, CityState, ActivityType, UserSettings } from '../types';
import { getActivityIcon, getActivityLabel } from '../utils/categoryIcons';
import {
  Clock,
  CheckCircle2,
  Calendar,
  BarChart3,
  Layers,
  ArrowUpRight,
  Flame,
  Lightbulb,
} from 'lucide-react';

interface ProgressStatsProps {
  sessions: CompletedSession[];
  cityState: CityState;
  streakDays: number;
  tasksCompletedCount: number;
  settings: UserSettings;
  onUpdateDailyGoal?: (mins: number) => void;
  onNavigateToCity?: () => void;
  onStartFocus?: () => void;
}

export const ProgressStats: React.FC<ProgressStatsProps> = ({
  sessions,
  streakDays,
  tasksCompletedCount,
  settings,
  onNavigateToCity,
  onStartFocus,
}) => {
  // 1. Calculate This Week stats
  const now = new Date();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(now.getDate() - 7);

  const weekSessions = sessions.filter((s) => new Date(s.completedAt) >= oneWeekAgo);
  const weekTotalMinutes = weekSessions.reduce((sum, s) => sum + s.focusMinutes, 0);
  const weekTotalHours = (weekTotalMinutes / 60).toFixed(1);
  const weekCompletedSessionsCount = weekSessions.length;

  // 2. Daily Focus Time Graph (Last 7 Days)
  const daysOfWeek = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
  const dailyData: { label: string; dateStr: string; minutes: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayLabel = daysOfWeek[d.getDay()];

    const mins = sessions
      .filter((s) => s.completedAt.slice(0, 10) === dateStr)
      .reduce((sum, s) => sum + s.focusMinutes, 0);

    dailyData.push({ label: dayLabel, dateStr, minutes: mins });
  }

  const maxDailyMinutes = Math.max(60, ...dailyData.map((d) => d.minutes));

  // 3. Your Focus Pattern
  const categoryTime: Record<ActivityType, number> = {
    reading: 0,
    memory: 0,
    work: 0,
    project: 0,
    creative: 0,
    quick: 0,
    ai: 0,
    custom: 0,
  };

  sessions.forEach((s) => {
    if (categoryTime[s.category] !== undefined) {
      categoryTime[s.category] += s.focusMinutes;
    }
  });

  const totalAllTimeMinutes = Math.max(
    1,
    sessions.reduce((sum, s) => sum + s.focusMinutes, 0)
  );

  const patternCategories: {
    type: ActivityType;
    name: string;
    districtName: string;
    color: string;
  }[] = [
    {
      type: 'reading',
      name: 'อ่านหนังสือ',
      districtName: 'Education District',
      color: '#3B82F6',
    },
    {
      type: 'project',
      name: 'โปรเจกต์',
      districtName: 'Technology District',
      color: '#06B6D4',
    },
    {
      type: 'work',
      name: 'ทำงาน',
      districtName: 'Work District',
      color: '#10B981',
    },
    {
      type: 'creative',
      name: 'งานสร้างสรรค์',
      districtName: 'Creative District',
      color: '#EC4899',
    },
    {
      type: 'memory',
      name: 'ทบทวน',
      districtName: 'Knowledge District',
      color: '#8B5CF6',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Overview Section */}
      <div>
        <div className="flex items-center justify-between pb-3">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-zinc-400">
              ภาพรวม
            </span>
            <h2 className="text-base font-medium text-slate-900 dark:text-zinc-100">
              สรุปสัปดาห์นี้ (This Week)
            </h2>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-400">
            <Flame className="h-3.5 w-3.5 text-amber-500" />
            <span>ต่อเนื่อง {streakDays} วัน</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Focus Time */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
              <span className="text-xs font-medium">Focus Time</span>
              <Clock className="h-4 w-4" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-light text-slate-900 tabular-nums dark:text-zinc-100">
                {weekTotalHours}
              </span>
              <span className="text-xs text-slate-500 dark:text-zinc-400">
                ชม. ({weekTotalMinutes} นาที)
              </span>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 dark:text-zinc-400">
              เป้าหมายสัปดาห์: {(settings.weeklyGoalMinutes / 60).toFixed(0)} ชม.
            </p>
          </div>

          {/* Completed Sessions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
              <span className="text-xs font-medium">Completed Sessions</span>
              <Calendar className="h-4 w-4" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-light text-slate-900 tabular-nums dark:text-zinc-100">
                {weekCompletedSessionsCount}
              </span>
              <span className="text-xs text-slate-500 dark:text-zinc-400">รอบที่โฟกัสสำเร็จ</span>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 dark:text-zinc-400">
              เฉลี่ย {weekCompletedSessionsCount ? Math.round(weekTotalMinutes / weekCompletedSessionsCount) : 0} นาที/รอบ
            </p>
          </div>

          {/* Completed Tasks */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
              <span className="text-xs font-medium">Completed Tasks</span>
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-light text-slate-900 tabular-nums dark:text-zinc-100">
                {tasksCompletedCount}
              </span>
              <span className="text-xs text-slate-500 dark:text-zinc-400">ภารกิจที่ทำสำเร็จ</span>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 dark:text-zinc-400">
              สถิติงานทั้งหมด
            </p>
          </div>
        </div>
      </div>

      {/* 2. Daily Focus Time Graph */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-800">
          <div>
            <h3 className="text-xs font-medium text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>กราฟ Focus Time รายวัน (7 วันล่าสุด)</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              บันทึกเวลาสมาธิตามวัน
            </p>
          </div>
          <span className="text-xs font-mono text-slate-600 dark:text-zinc-400">
            เป้าหมาย {settings.dailyGoalMinutes} น./วัน
          </span>
        </div>

        {/* 7-Day Bar Chart */}
        <div className="mt-6 flex h-36 items-end justify-between gap-2 px-2 sm:px-6">
          {dailyData.map((d, index) => {
            const heightPct =
              d.minutes > 0
                ? Math.min(100, Math.max(8, Math.round((d.minutes / maxDailyMinutes) * 100)))
                : 0;
            const isToday = index === dailyData.length - 1;

            return (
              <div key={d.dateStr} className="flex flex-1 flex-col items-center gap-2">
                <span className="font-mono text-[10px] text-slate-400 tabular-nums dark:text-zinc-500">
                  {d.minutes > 0 ? `${d.minutes}m` : '-'}
                </span>

                <div className="flex h-24 w-full max-w-[32px] items-end justify-center rounded-lg bg-slate-100 p-0.5 dark:bg-zinc-800">
                  <div
                    className={`w-full rounded-md transition-all duration-500 ${
                      isToday
                        ? 'bg-slate-900 dark:bg-zinc-100'
                        : d.minutes >= settings.dailyGoalMinutes
                        ? 'bg-emerald-600'
                        : d.minutes > 0
                        ? 'bg-slate-400 dark:bg-zinc-500'
                        : 'bg-transparent'
                    }`}
                    style={{ height: `${heightPct}%` }}
                    title={`${d.label}: ${d.minutes} นาที`}
                  />
                </div>

                <span
                  className={`text-xs ${
                    isToday
                      ? 'font-medium text-slate-900 dark:text-zinc-100'
                      : 'text-slate-500 dark:text-zinc-400'
                  }`}
                >
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Focus Pattern */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-800">
          <div>
            <h3 className="text-xs font-medium text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <span>สัดส่วนประเภทการโฟกัส (Focus Pattern)</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              เชื่อมโยงกับย่านต่าง ๆ ใน Focus City
            </p>
          </div>
          {onNavigateToCity && (
            <button
              onClick={onNavigateToCity}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <span>ดูเมือง Focus City</span>
              <ArrowUpRight className="h-3 w-3" />
            </button>
          )}
        </div>

        {sessions.length === 0 ? (
          <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-10 px-4 text-center dark:border-zinc-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
              <Clock className="h-5 w-5" />
            </div>
            <h4 className="mt-3 text-xs font-medium text-slate-900 dark:text-zinc-100">
              ยังไม่มีข้อมูลการโฟกัส
            </h4>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 max-w-xs">
              เริ่ม Focus Session แรกเพื่อดูความก้าวหน้าของคุณ
            </p>
            {onStartFocus && (
              <button
                onClick={onStartFocus}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-xs hover:bg-slate-800 transition-colors active:scale-95 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                <span>เริ่มโฟกัส</span>
              </button>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {patternCategories.map((cat) => {
              const mins = categoryTime[cat.type] || 0;
              const pct = totalAllTimeMinutes > 0 ? Math.round((mins / totalAllTimeMinutes) * 100) : 0;

              return (
                <div key={cat.type} className="text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 dark:text-zinc-400">
                        {getActivityIcon(cat.type, 'h-3.5 w-3.5')}
                      </span>
                      <span className="font-medium text-slate-800 dark:text-zinc-200">
                        {cat.name} ({pct}%)
                      </span>
                      <span className="text-slate-400 dark:text-zinc-500">→</span>
                      <span className="text-slate-500 dark:text-zinc-400">
                        {cat.districtName}
                      </span>
                    </div>
                    <span className="font-mono text-slate-500 tabular-nums dark:text-zinc-400">
                      {mins} นาที
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-5 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-zinc-800/40 dark:text-zinc-400 border border-slate-200/60 dark:border-zinc-800">
          <Lightbulb className="h-4 w-4 shrink-0 text-slate-500 mt-0.5" />
          <p>
            <span className="font-medium text-slate-700 dark:text-zinc-300">City Reflection:</span> ยิ่งคุณใช้เวลากับกิจกรรมประเภทใด ย่าน (District) ที่เกี่ยวข้องจะเติบโตและสะท้อนวินัยที่แท้จริงของคุณ
          </p>
        </div>
      </div>
    </div>
  );
};
