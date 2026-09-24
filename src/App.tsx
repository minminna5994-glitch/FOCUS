import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ActivityType,
  CityState,
  CompletedSession,
  CustomPreset,
  FeedbackRating,
  NavTab,
  PlacedBuilding,
  Task,
  UserSettings,
} from './types';
import { CITY_STAGES, BUILDING_BLUEPRINTS, LANDMARK_BLUEPRINTS } from './data/cityData';
import { sound } from './utils/audio';
import { getActivityIcon, getActivityLabel } from './utils/categoryIcons';
import { FocusCityViewer } from './components/FocusCityViewer';
import { FocusTimer } from './components/FocusTimer';
import { PresetSelectorModal } from './components/PresetSelectorModal';
import { AIFocusPlannerModal } from './components/AIFocusPlannerModal';
import { SessionFeedbackModal } from './components/SessionFeedbackModal';
import { TaskList } from './components/TaskList';
import { ProgressStats } from './components/ProgressStats';
import { LandmarksShowcase } from './components/LandmarksShowcase';
import { SettingsModal } from './components/SettingsModal';
import {
  Home,
  CheckSquare,
  Clock,
  Building2,
  BarChart2,
  Sparkles,
  Settings,
  Flame,
  Coins,
  Layers,
  ChevronRight,
  Zap,
  SlidersHorizontal,
  ArrowRight,
  X,
} from 'lucide-react';

const STORAGE_KEY = 'focus_city_app_data_v3';
const TIMER_STORAGE_KEY = 'focus_city_active_timer_v3';

function calculateStreak(sessionsList: CompletedSession[]): number {
  if (!sessionsList || sessionsList.length === 0) return 0;

  const dateSet = new Set(sessionsList.map((s) => s.completedAt.slice(0, 10)));
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  // If user hasn't focused today or yesterday, streak is 0
  if (!dateSet.has(todayKey) && !dateSet.has(yesterdayKey)) {
    return 0;
  }

  let streak = 0;
  const checkDate = new Date(dateSet.has(todayKey) ? today : yesterday);

  while (true) {
    const key = checkDate.toISOString().slice(0, 10);
    if (dateSet.has(key)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [citySubTab, setCitySubTab] = useState<'canvas' | 'landmarks'>('canvas');

  // User Settings
  const [settings, setSettings] = useState<UserSettings>(() => ({
    dailyGoalMinutes: 120,
    weeklyGoalMinutes: 700,
    soundEnabled: true,
    ambientSound: 'none',
    theme: 'light',
    smartRecommendationsEnabled: true,
  }));

  // City State with stages - starts clean (0 resources, 0 buildings, small_town)
  const [cityState, setCityState] = useState<CityState>(() => ({
    name: 'Focus City',
    stage: 'small_town',
    coins: 0,
    materials: 0,
    xp: 0,
    buildings: [],
    unlockedLandmarkIds: [],
  }));

  // Tasks - starter tasks start with completed: false and 0 focusMinutesSpent
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 't-1',
      title: 'อ่านสรุปบทที่ 3 วิชาชีววิทยา',
      category: 'reading',
      completed: false,
      createdAt: new Date().toISOString(),
      focusMinutesSpent: 0,
    },
    {
      id: 't-2',
      title: 'ออกแบบหน้าจอ Focus City Prototype',
      category: 'project',
      completed: false,
      createdAt: new Date().toISOString(),
      focusMinutesSpent: 0,
    },
    {
      id: 't-3',
      title: 'ทบทวนคำศัพท์ภาษาอังกฤษชุดที่ 4',
      category: 'memory',
      completed: false,
      createdAt: new Date().toISOString(),
      focusMinutesSpent: 0,
    },
  ]);

  // Session History - starts empty
  const [sessions, setSessions] = useState<CompletedSession[]>([]);

  // Saved Presets
  const [savedPresets, setSavedPresets] = useState<CustomPreset[]>([
    {
      id: 'cp-default-1',
      name: 'อ่านแบบสบายใจ',
      focusMinutes: 25,
      breakMinutes: 5,
      rounds: 2,
      longBreakMinutes: 15,
      longBreakEvery: 4,
    },
  ]);

  // Undo Toast Notification System
  const [undoToast, setUndoToast] = useState<{
    id: string;
    message: string;
    action: () => void;
  } | null>(null);

  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerUndoToast = (message: string, undoAction: () => void) => {
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    setUndoToast({
      id: String(Date.now()),
      message,
      action: () => {
        undoAction();
        setUndoToast(null);
      },
    });
    undoTimeoutRef.current = setTimeout(() => {
      setUndoToast(null);
    }, 6000);
  };

  // Persistent Timer State
  const [timerState, setTimerState] = useState<{
    active: boolean;
    isRunning: boolean;
    phase: 'focus' | 'break';
    timeLeft: number;
    targetEndTime: number | null;
    initialFocusMinutes: number;
    initialBreakMinutes: number;
    totalRounds: number;
    currentRound: number;
    taskTitle: string;
    category: ActivityType;
    modeName?: string;
    taskId?: string;
  }>({
    active: false,
    isRunning: false,
    phase: 'focus',
    timeLeft: 25 * 60,
    targetEndTime: null,
    initialFocusMinutes: 25,
    initialBreakMinutes: 5,
    totalRounds: 1,
    currentRound: 1,
    taskTitle: 'โฟกัสตามเป้าหมาย',
    category: 'reading',
  });

  const timerStateRef = useRef(timerState);
  timerStateRef.current = timerState;

  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isTransitioningPhaseRef = useRef<boolean>(false);
  const currentCompletedSessionIdRef = useRef<string | null>(null);

  // Energy transfer effect trigger for Focus City
  const [justEarnedEnergy, setJustEarnedEnergy] = useState<number>(0);

  // Modals
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityType>('reading');
  const [aiPlannerOpen, setAiPlannerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackSessionData, setFeedbackSessionData] = useState<{
    completedMinutes: number;
    coins: number;
    materials: number;
    xp: number;
    taskTitle: string;
    category: ActivityType;
    taskId?: string;
  } | null>(null);

  // Load from LocalStorage on mount with sanitization of old mock data
  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(STORAGE_KEY) ||
        localStorage.getItem('focus_city_app_data_v2') ||
        localStorage.getItem('focus_city_app_data_v1');

      if (saved) {
        const parsed = JSON.parse(saved);

        // Filter out legacy mock sessions
        const realSessions: CompletedSession[] = Array.isArray(parsed.sessions)
          ? parsed.sessions.filter(
              (s: CompletedSession) => !s.id?.startsWith('s-init-') && s.focusMinutes > 0
            )
          : [];

        // Filter out legacy mock starter buildings
        const realBuildings: PlacedBuilding[] = Array.isArray(parsed.cityState?.buildings)
          ? parsed.cityState.buildings.filter(
              (b: PlacedBuilding) => !b.id?.startsWith('b-start-')
            )
          : [];

        if (realSessions.length === 0) {
          // Zero real sessions = fresh clean slate
          setSessions([]);
          setCityState({
            name: parsed.cityState?.name || 'Focus City',
            stage: 'small_town',
            coins: 0,
            materials: 0,
            xp: 0,
            buildings: [],
            unlockedLandmarkIds: [],
          });
          if (Array.isArray(parsed.tasks)) {
            setTasks(
              parsed.tasks.map((t: Task) => ({
                ...t,
                completed: false,
                focusMinutesSpent: 0,
              }))
            );
          }
        } else {
          setSessions(realSessions);
          if (parsed.cityState) {
            setCityState({
              ...parsed.cityState,
              stage: parsed.cityState.stage || 'small_town',
              buildings: realBuildings,
            });
          }
          if (Array.isArray(parsed.tasks)) {
            setTasks(parsed.tasks);
          }
        }

        if (parsed.settings) setSettings(parsed.settings);
        if (parsed.savedPresets) setSavedPresets(parsed.savedPresets);
      }
    } catch (e) {
      console.warn('Could not parse local storage data:', e);
    }
  }, []);

  // Save to LocalStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          cityState,
          tasks,
          sessions,
          settings,
          savedPresets,
        })
      );
    } catch (e) {}
  }, [cityState, tasks, sessions, settings, savedPresets]);

  // Restore ongoing timer state from LocalStorage on mount (without fabricating fake sessions)
  useEffect(() => {
    try {
      const savedTimerStr = localStorage.getItem(TIMER_STORAGE_KEY);
      if (savedTimerStr) {
        const savedTimer = JSON.parse(savedTimerStr);
        if (savedTimer && savedTimer.active) {
          if (savedTimer.isRunning && savedTimer.targetEndTime) {
            const now = Date.now();
            const rem = Math.max(0, Math.ceil((savedTimer.targetEndTime - now) / 1000));
            if (rem > 0) {
              setTimerState({
                ...savedTimer,
                timeLeft: rem,
              });
            } else {
              localStorage.removeItem(TIMER_STORAGE_KEY);
            }
          } else if (!savedTimer.isRunning) {
            setTimerState({
              ...savedTimer,
              targetEndTime: null,
            });
          }
        }
      }
    } catch (e) {}
  }, []);

  // Save active timer state to LocalStorage
  useEffect(() => {
    try {
      if (timerState.active) {
        localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timerState));
      } else {
        localStorage.removeItem(TIMER_STORAGE_KEY);
      }
    } catch (e) {}
  }, [timerState]);

  // Theme synchronization with DOM and system preference
  useEffect(() => {
    const applyTheme = (theme: 'light' | 'dark' | 'system') => {
      const isDark =
        theme === 'dark' ||
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme(settings.theme);

    if (settings.theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme('system');
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [settings.theme]);

  // Dynamic City Stage Progression based on total focus minutes
  const totalAllTimeMinutes = sessions.reduce((sum, s) => sum + s.focusMinutes, 0);

  useEffect(() => {
    let newStage: CityState['stage'] = 'small_town';
    if (totalAllTimeMinutes >= 2400) {
      newStage = 'future_city';
    } else if (totalAllTimeMinutes >= 900) {
      newStage = 'smart_city';
    } else if (totalAllTimeMinutes >= 300) {
      newStage = 'modern_city';
    } else if (totalAllTimeMinutes >= 60) {
      newStage = 'growing_city';
    }

    if (newStage !== cityState.stage) {
      setCityState((prev) => ({
        ...prev,
        stage: newStage,
      }));
    }
  }, [totalAllTimeMinutes, cityState.stage]);

  // Ambient sound management
  useEffect(() => {
    if (timerState.active && timerState.isRunning && settings.ambientSound !== 'none') {
      sound.startAmbient(settings.ambientSound, settings.soundEnabled);
    } else {
      sound.stopAmbient();
    }
    return () => {
      sound.stopAmbient();
    };
  }, [timerState.active, timerState.isRunning, settings.ambientSound, settings.soundEnabled]);

  // Core function to safely record a completed focus session exactly once
  const recordCompletedFocusSession = useCallback(
    (
      completedMins: number,
      taskTitle: string,
      category: ActivityType,
      taskId?: string,
      breakMinutes: number = 5,
      initialRating: FeedbackRating = 'just_right',
      initialNote: string = ''
    ) => {
      const earnedCoins = completedMins;
      const earnedMaterials = Math.max(1, Math.round(completedMins / 12));
      const earnedXp = completedMins;
      const newEnergy = completedMins * 4;
      setJustEarnedEnergy(newEnergy);

      const sessionId = 'sess-' + Date.now();
      currentCompletedSessionIdRef.current = sessionId;

      const newSession: CompletedSession = {
        id: sessionId,
        taskId,
        taskTitle: taskTitle || 'โฟกัสตามเป้าหมาย',
        category,
        focusMinutes: completedMins,
        breakMinutes,
        completedAt: new Date().toISOString(),
        feedbackRating: initialRating,
        achievedNote: initialNote,
        coinsEarned: earnedCoins,
        materialsEarned: earnedMaterials,
        xpEarned: earnedXp,
        cityEnergyEarned: newEnergy,
      };

      setSessions((prev) => [newSession, ...prev]);

      setCityState((prev) => {
        const targetDistrict =
          category === 'reading'
            ? 'education'
            : category === 'memory'
            ? 'research'
            : category === 'project'
            ? 'technology'
            : category === 'creative'
            ? 'creative'
            : 'business';

        let updatedBuildings = [...prev.buildings];
        const matchIndex = updatedBuildings.findIndex((b) => b.district === targetDistrict);

        if (matchIndex >= 0) {
          const b = updatedBuildings[matchIndex];
          const newProgress =
            (b.stageProgress || 0) + Math.min(100, Math.round(completedMins * 2));
          let nextStage = b.buildStage;
          let nextLevel = b.level;
          let finalProgress = newProgress;

          if (newProgress >= 100) {
            finalProgress = newProgress - 100;
            if (b.buildStage === 'foundation') {
              nextStage = 'construction';
            } else if (b.buildStage === 'construction') {
              nextStage = 'complete';
            } else if (b.buildStage === 'complete' && b.level < 3) {
              nextStage = 'upgraded';
              nextLevel = b.level + 1;
            }
          }

          updatedBuildings[matchIndex] = {
            ...b,
            buildStage: nextStage,
            level: nextLevel,
            stageProgress: finalProgress,
            focusMinutesSpent: (b.focusMinutesSpent || 0) + completedMins,
          };
        } else {
          // District doesn't have a building yet - place a new foundation building in first available slot
          const occupied = new Set(updatedBuildings.map((b) => `${b.x},${b.y}`));
          const prioritySlots = [
            { x: 2, y: 2 },
            { x: 1, y: 1 },
            { x: 3, y: 1 },
            { x: 1, y: 3 },
            { x: 3, y: 3 },
            { x: 2, y: 1 },
            { x: 1, y: 2 },
            { x: 3, y: 2 },
            { x: 2, y: 3 },
            { x: 0, y: 2 },
            { x: 4, y: 2 },
          ];
          let foundSlot = prioritySlots.find((s) => !occupied.has(`${s.x},${s.y}`));
          if (!foundSlot) {
            for (let x = 0; x < 5; x++) {
              for (let y = 0; y < 5; y++) {
                if (!occupied.has(`${x},${y}`)) {
                  foundSlot = { x, y };
                  break;
                }
              }
              if (foundSlot) break;
            }
          }

          if (foundSlot) {
            const bp =
              BUILDING_BLUEPRINTS.find((p) => p.district === targetDistrict) ||
              BUILDING_BLUEPRINTS[0];
            updatedBuildings.push({
              id: 'b-' + Date.now(),
              blueprintId: bp.id,
              name: bp.name,
              district: targetDistrict,
              level: 1,
              buildStage: completedMins >= 25 ? 'construction' : 'foundation',
              stageProgress: Math.min(100, Math.round(completedMins * 2)),
              focusMinutesSpent: completedMins,
              x: foundSlot.x,
              y: foundSlot.y,
              color: bp.baseColor,
              accentColor: bp.accentColor,
              icon: bp.icon,
            });
          }
        }

        return {
          ...prev,
          coins: prev.coins + earnedCoins,
          materials: prev.materials + earnedMaterials,
          xp: prev.xp + earnedXp,
          buildings: updatedBuildings,
        };
      });

      if (taskId) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, focusMinutesSpent: t.focusMinutesSpent + completedMins }
              : t
          )
        );
      }

      setFeedbackSessionData({
        completedMinutes: completedMins,
        coins: earnedCoins,
        materials: earnedMaterials,
        xp: earnedXp,
        taskTitle: taskTitle || 'โฟกัสตามเป้าหมาย',
        category,
        taskId,
      });
      setFeedbackModalOpen(true);
    },
    []
  );

  // Transition handler when timer countdown hits 00:00
  const handlePhaseCompletion = useCallback(() => {
    const current = timerStateRef.current;
    if (!current.active) {
      isTransitioningPhaseRef.current = false;
      return;
    }

    if (current.phase === 'focus') {
      sound.playFocusComplete(settings.soundEnabled);

      // 1. Record session strictly once
      const completedMins = current.initialFocusMinutes;
      recordCompletedFocusSession(
        completedMins,
        current.taskTitle,
        current.category,
        current.taskId,
        current.initialBreakMinutes
      );

      // 2. Transition to Break or Finish session
      const now = Date.now();
      if (current.initialBreakMinutes > 0) {
        const breakSecs = current.initialBreakMinutes * 60;
        setTimerState((prev) => ({
          ...prev,
          phase: 'break',
          timeLeft: breakSecs,
          targetEndTime: now + breakSecs * 1000,
          isRunning: true,
        }));
      } else if (current.currentRound < current.totalRounds) {
        const focusSecs = current.initialFocusMinutes * 60;
        setTimerState((prev) => ({
          ...prev,
          phase: 'focus',
          currentRound: prev.currentRound + 1,
          timeLeft: focusSecs,
          targetEndTime: now + focusSecs * 1000,
          isRunning: true,
        }));
      } else {
        setTimerState((prev) => ({
          ...prev,
          active: false,
          isRunning: false,
          phase: 'focus',
          timeLeft: prev.initialFocusMinutes * 60,
          targetEndTime: null,
        }));
      }

      setTimeout(() => {
        isTransitioningPhaseRef.current = false;
      }, 300);
    } else {
      // Phase is 'break' -> Break finished!
      sound.playBreakComplete(settings.soundEnabled);
      // Note: Break time is NEVER counted as Focus Time!

      const now = Date.now();
      if (current.currentRound < current.totalRounds) {
        const nextRound = current.currentRound + 1;
        const focusSecs = current.initialFocusMinutes * 60;
        setTimerState((prev) => ({
          ...prev,
          phase: 'focus',
          currentRound: nextRound,
          timeLeft: focusSecs,
          targetEndTime: now + focusSecs * 1000,
          isRunning: true,
        }));
      } else {
        setTimerState((prev) => ({
          ...prev,
          active: false,
          isRunning: false,
          phase: 'focus',
          timeLeft: prev.initialFocusMinutes * 60,
          targetEndTime: null,
        }));
      }

      setTimeout(() => {
        isTransitioningPhaseRef.current = false;
      }, 300);
    }
  }, [recordCompletedFocusSession, settings.soundEnabled]);

  // Master Background Countdown Interval with real-time target timestamp accuracy
  useEffect(() => {
    if (!timerState.active || !timerState.isRunning || !timerState.targetEndTime) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    const syncTick = () => {
      const current = timerStateRef.current;
      if (!current.active || !current.isRunning || !current.targetEndTime) {
        return;
      }

      const now = Date.now();
      const diffMs = current.targetEndTime - now;
      const remainingSeconds = Math.max(0, Math.ceil(diffMs / 1000));

      if (remainingSeconds <= 0) {
        if (isTransitioningPhaseRef.current) return;
        isTransitioningPhaseRef.current = true;
        handlePhaseCompletion();
        return;
      }

      if (remainingSeconds !== current.timeLeft) {
        setTimerState((prev) => {
          if (!prev.active || !prev.isRunning) return prev;
          return {
            ...prev,
            timeLeft: remainingSeconds,
          };
        });
      }
    };

    // Run tick immediately on effect start
    syncTick();

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    timerIntervalRef.current = setInterval(syncTick, 250);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [
    timerState.active,
    timerState.isRunning,
    timerState.phase,
    timerState.targetEndTime,
    handlePhaseCompletion,
  ]);

  // Handle tab visibility change / inactive tab / lock screen sync
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const current = timerStateRef.current;
        if (current.active && current.isRunning && current.targetEndTime) {
          const now = Date.now();
          const diffMs = current.targetEndTime - now;
          const remainingSeconds = Math.max(0, Math.ceil(diffMs / 1000));
          if (remainingSeconds <= 0) {
            if (!isTransitioningPhaseRef.current) {
              isTransitioningPhaseRef.current = true;
              handlePhaseCompletion();
            }
          } else {
            setTimerState((prev) => {
              if (!prev.active || !prev.isRunning) return prev;
              return { ...prev, timeLeft: remainingSeconds };
            });
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [handlePhaseCompletion]);

  // Today Focus Minutes
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayMinutes = sessions
    .filter((s) => s.completedAt.slice(0, 10) === todayStr)
    .reduce((sum, s) => sum + s.focusMinutes, 0);

  const streakDays = calculateStreak(sessions);

  // Timer Control Handlers
  const handleTogglePlayPause = () => {
    sound.playTapSound(settings.soundEnabled);
    const current = timerStateRef.current;

    // If timer was not activated yet (e.g. user clicked Play on the default screen)
    if (!current.active) {
      const totalSecs =
        current.timeLeft > 0 ? current.timeLeft : current.initialFocusMinutes * 60;
      const now = Date.now();
      isTransitioningPhaseRef.current = false;
      setTimerState((prev) => ({
        ...prev,
        active: true,
        isRunning: true,
        timeLeft: totalSecs,
        targetEndTime: now + totalSecs * 1000,
      }));
      return;
    }

    if (current.isRunning) {
      // PAUSE:
      // Stop timer immediately, preserve exact remaining seconds, clear targetEndTime
      const now = Date.now();
      const remainingSeconds = current.targetEndTime
        ? Math.max(0, Math.ceil((current.targetEndTime - now) / 1000))
        : current.timeLeft;

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      setTimerState((prev) => ({
        ...prev,
        isRunning: false,
        timeLeft: remainingSeconds,
        targetEndTime: null,
      }));
    } else {
      // RESUME:
      // Create new target end timestamp from exact remaining seconds
      const remainingSeconds = current.timeLeft;
      if (remainingSeconds <= 0) return;
      const now = Date.now();
      isTransitioningPhaseRef.current = false;

      setTimerState((prev) => ({
        ...prev,
        isRunning: true,
        targetEndTime: now + remainingSeconds * 1000,
      }));
    }
  };

  const handleStopTimer = (action: 'save' | 'discard' = 'discard') => {
    sound.playTapSound(settings.soundEnabled);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    isTransitioningPhaseRef.current = false;

    const current = timerStateRef.current;
    const currentRemainingSecs =
      current.targetEndTime && current.isRunning
        ? Math.max(0, Math.ceil((current.targetEndTime - Date.now()) / 1000))
        : current.timeLeft;

    const elapsedSeconds =
      current.phase === 'focus'
        ? Math.max(0, current.initialFocusMinutes * 60 - currentRemainingSecs)
        : 0;
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);

    if (action === 'save' && elapsedMinutes >= 1) {
      recordCompletedFocusSession(
        elapsedMinutes,
        current.taskTitle,
        current.category,
        current.taskId,
        current.initialBreakMinutes
      );
    }

    try {
      localStorage.removeItem(TIMER_STORAGE_KEY);
    } catch (e) {}

    setTimerState((prev) => ({
      ...prev,
      active: false,
      isRunning: false,
      phase: 'focus',
      timeLeft: prev.initialFocusMinutes * 60,
      targetEndTime: null,
    }));
    setActiveTab('home');
  };

  const handleSkipPhase = () => {
    sound.playTapSound(settings.soundEnabled);
    isTransitioningPhaseRef.current = false;
    const now = Date.now();

    setTimerState((prev) => {
      if (prev.phase === 'focus') {
        const breakSecs = prev.initialBreakMinutes * 60;
        return {
          ...prev,
          phase: 'break',
          timeLeft: breakSecs,
          targetEndTime: prev.isRunning ? now + breakSecs * 1000 : null,
        };
      } else {
        if (prev.currentRound < prev.totalRounds) {
          const focusSecs = prev.initialFocusMinutes * 60;
          return {
            ...prev,
            phase: 'focus',
            currentRound: prev.currentRound + 1,
            timeLeft: focusSecs,
            targetEndTime: prev.isRunning ? now + focusSecs * 1000 : null,
          };
        } else {
          return {
            ...prev,
            active: false,
            isRunning: false,
            phase: 'focus',
            timeLeft: prev.initialFocusMinutes * 60,
            targetEndTime: null,
          };
        }
      }
    });
  };

  const handleStartSession = (config: {
    focusMinutes: number;
    breakMinutes: number;
    totalRounds: number;
    taskId?: string;
    taskTitle: string;
    category: ActivityType;
    modeName?: string;
  }) => {
    sound.playTapSound(settings.soundEnabled);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    isTransitioningPhaseRef.current = false;
    const totalSecs = config.focusMinutes * 60;
    const now = Date.now();

    setTimerState({
      active: true,
      isRunning: true,
      phase: 'focus',
      timeLeft: totalSecs,
      targetEndTime: now + totalSecs * 1000,
      initialFocusMinutes: config.focusMinutes,
      initialBreakMinutes: config.breakMinutes,
      totalRounds: config.totalRounds,
      currentRound: 1,
      taskTitle: config.taskTitle,
      category: config.category,
      taskId: config.taskId,
      modeName: config.modeName,
    });
    setActiveTab('focus');
  };

  // Feedback Submission: updates existing recorded session with note and rating
  const handleFeedbackSubmit = (feedback: { rating: FeedbackRating; note: string }) => {
    if (currentCompletedSessionIdRef.current) {
      const sId = currentCompletedSessionIdRef.current;
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sId
            ? { ...s, feedbackRating: feedback.rating, achievedNote: feedback.note }
            : s
        )
      );
    }
    setFeedbackModalOpen(false);
    setFeedbackSessionData(null);
    setActiveTab('city');
  };

  // Task CRUD with Undo
  const handleAddTask = (title: string, category: ActivityType) => {
    const newTask: Task = {
      id: 't-' + Date.now(),
      title,
      category,
      completed: false,
      createdAt: new Date().toISOString(),
      focusMinutesSpent: 0,
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleUpdateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const handleDeleteTask = (taskToDelete: Task) => {
    const taskIndex = tasks.findIndex((t) => t.id === taskToDelete.id);
    setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
    triggerUndoToast(`ลบงาน "${taskToDelete.title}" แล้ว`, () => {
      setTasks((prev) => {
        const copy = [...prev];
        copy.splice(taskIndex, 0, taskToDelete);
        return copy;
      });
    });
  };

  // Preset CRUD with Undo
  const handleSaveCustomPreset = (preset: CustomPreset) => {
    setSavedPresets((prev) => {
      const idx = prev.findIndex((p) => p.id === preset.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = preset;
        return copy;
      }
      return [preset, ...prev];
    });
  };

  const handleDeleteCustomPreset = (presetToDelete: CustomPreset) => {
    const presetIndex = savedPresets.findIndex((p) => p.id === presetToDelete.id);
    setSavedPresets((prev) => prev.filter((p) => p.id !== presetToDelete.id));
    triggerUndoToast(`ลบโหมด "${presetToDelete.name}" แล้ว`, () => {
      setSavedPresets((prev) => {
        const copy = [...prev];
        copy.splice(presetIndex, 0, presetToDelete);
        return copy;
      });
    });
  };

  // Activity Card Definitions (Clean, No Emojis)
  const activityCards: {
    type: ActivityType;
    title: string;
    subtitle: string;
    tag: string;
  }[] = [
    {
      type: 'reading',
      title: 'อ่านหนังสือ',
      subtitle: 'สะสมความรู้ พัฒนาคลังปัญญา',
      tag: 'Education',
    },
    {
      type: 'memory',
      title: 'ท่องจำ / ทบทวน',
      subtitle: 'ทบทวนบทเรียน สรุปเนื้อหาสำคัญ',
      tag: 'Knowledge',
    },
    {
      type: 'work',
      title: 'ทำงาน / การบ้าน',
      subtitle: 'เคลียร์ภารกิจ จัดการงานตามเป้า',
      tag: 'Work',
    },
    {
      type: 'project',
      title: 'ทำโปรเจกต์',
      subtitle: 'พัฒนานวัตกรรม ออกแบบและเขียนโค้ด',
      tag: 'Technology',
    },
    {
      type: 'creative',
      title: 'งานสร้างสรรค์',
      subtitle: 'วาดภาพ งานออกแบบ งานศิลปะ',
      tag: 'Creative',
    },
  ];

  const formatTime = (secs: number) => {
    const safeSecs = Math.max(0, Math.floor(secs));
    const m = Math.floor(safeSecs / 60);
    const s = safeSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800 antialiased dark:bg-zinc-950 dark:text-zinc-100">
      {/* 1. Desktop Sidebar Navigation */}
      <aside className="hidden lg:flex w-64 xl:w-72 flex-col justify-between border-r border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shrink-0">
        <div className="space-y-6">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
              <Building2 className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 leading-tight">
                Focus City
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-tight">
                เวลาที่คุณโฟกัส กำลังสร้างเมือง
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium transition-colors ${
                activeTab === 'home'
                  ? 'bg-slate-100 text-slate-900 dark:bg-zinc-800 dark:text-zinc-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>หน้าแรก (Home)</span>
            </button>

            <button
              onClick={() => setActiveTab('focus')}
              className={`relative flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-colors ${
                activeTab === 'focus'
                  ? 'bg-slate-100 text-slate-900 dark:bg-zinc-800 dark:text-zinc-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4" />
                <span>โฟกัส (Timer)</span>
              </div>
              {timerState.active && (
                <span className="flex h-2 w-2 rounded-full bg-slate-900 animate-pulse dark:bg-zinc-100" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('city')}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium transition-colors ${
                activeTab === 'city'
                  ? 'bg-slate-100 text-slate-900 dark:bg-zinc-800 dark:text-zinc-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200'
              }`}
            >
              <Building2 className="h-4 w-4" />
              <span>เมือง (Focus City)</span>
            </button>

            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-colors ${
                activeTab === 'tasks'
                  ? 'bg-slate-100 text-slate-900 dark:bg-zinc-800 dark:text-zinc-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <CheckSquare className="h-4 w-4" />
                <span>งาน (Tasks)</span>
              </div>
              <span className="font-mono text-[11px] text-slate-400 dark:text-zinc-500">
                {tasks.filter((t) => !t.completed).length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('progress')}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium transition-colors ${
                activeTab === 'progress'
                  ? 'bg-slate-100 text-slate-900 dark:bg-zinc-800 dark:text-zinc-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200'
              }`}
            >
              <BarChart2 className="h-4 w-4" />
              <span>ความก้าวหน้า (Progress)</span>
            </button>
          </nav>

          {/* City Status Card on Sidebar */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="flex items-center justify-between text-xs font-medium text-slate-800 dark:text-zinc-200">
              <span className="truncate">{CITY_STAGES[cityState.stage].label}</span>
              <span className="font-mono text-[11px] text-slate-500 dark:text-zinc-400">
                {cityState.buildings.length} อาคาร
              </span>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-zinc-400">
              <span className="flex items-center gap-1">
                <Coins className="h-3 w-3 text-amber-500" /> {cityState.coins}
              </span>
              <span className="flex items-center gap-1">
                <Layers className="h-3 w-3 text-blue-500" /> {cityState.materials}
              </span>
              <span className="flex items-center gap-1">
                <Flame className="h-3 w-3 text-rose-500" /> {streakDays}d
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Sidebar Settings */}
        <div className="border-t border-slate-100 pt-3 dark:border-zinc-800">
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <Settings className="h-4 w-4" />
            <span>ตั้งค่า (Settings)</span>
          </button>
        </div>
      </aside>

      {/* Main App Content Area */}
      <div className="flex flex-1 flex-col pb-20 lg:pb-6">
        {/* Persistent Mini-Timer Banner */}
        {timerState.active && activeTab !== 'focus' && (
          <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-2 text-slate-900 shadow-xs backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95 dark:text-zinc-100">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <div className="truncate text-xs">
                <span className="font-medium text-slate-600 dark:text-zinc-400">
                  {timerState.phase === 'focus' ? 'กำลังโฟกัส' : 'ช่วงพัก'}:
                </span>{' '}
                <span className="font-medium">{timerState.taskTitle}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="font-mono text-xs tabular-nums text-slate-700 dark:text-zinc-300">
                {formatTime(timerState.timeLeft)}
              </span>
              <button
                onClick={() => setActiveTab('focus')}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                ดูตัวจับเวลา →
              </button>
            </div>
          </div>
        )}

        {/* Top Header on Mobile / Tablet */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900 lg:hidden">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-slate-900 dark:text-zinc-100" />
            <span className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              Focus City
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-mono text-xs text-slate-600 dark:text-zinc-400">
              <Coins className="h-3.5 w-3.5 text-amber-500" /> {cityState.coins}
            </span>
            <button
              onClick={() => setSettingsOpen(true)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6 lg:p-8">
          {/* ======================================================== */}
          {/* TAB 1: HOME PAGE                                         */}
          {/* ======================================================== */}
          {activeTab === 'home' && (
            <div className="space-y-6">
              {/* Top Greeting & Question */}
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Focus Haven
                </span>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100 sm:text-3xl">
                  วันนี้อยากโฟกัสอะไร?
                </h1>
                <p className="text-xs text-slate-500 dark:text-zinc-400 sm:text-sm">
                  เลือกกิจกรรมเพื่อเริ่มสร้างเมือง หรือให้ระบบช่วยจัดสรรรอบสมาธิ
                </p>
              </div>

              {/* 2-Column Responsive Layout */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Left Column: 5 Activities & Secondary Actions */}
                <div className="space-y-4 lg:col-span-7">
                  {/* 5 Main Activity Cards */}
                  <div className="space-y-2">
                    {activityCards.map((act) => (
                      <button
                        key={act.type}
                        onClick={() => {
                          setSelectedActivity(act.type);
                          setPresetModalOpen(true);
                        }}
                        className="group flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-3.5 text-left shadow-xs transition-colors hover:border-slate-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                            {getActivityIcon(act.type, 'h-5 w-5')}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                                {act.title}
                              </h3>
                              <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                                {act.tag}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                              {act.subtitle}
                            </p>
                          </div>
                        </div>

                        <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    ))}
                  </div>

                  {/* Secondary Options Bar: Quick Focus, AI Planner, Custom */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                    <span className="block text-[11px] font-medium text-slate-400 dark:text-zinc-500 mb-2 px-1">
                      ตัวเลือกเพิ่มเติม
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => {
                          setSelectedActivity('quick');
                          setPresetModalOpen(true);
                        }}
                        className="flex flex-col items-center justify-center gap-1 rounded-xl border border-slate-100 bg-slate-50 p-3 text-center transition-colors hover:border-slate-300 dark:border-zinc-800 dark:bg-zinc-800/50 dark:hover:border-zinc-700"
                      >
                        <Zap className="h-4 w-4 text-slate-700 dark:text-zinc-300" />
                        <span className="text-xs font-medium text-slate-800 dark:text-zinc-200">
                          Quick Focus
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500">เริ่มทันที</span>
                      </button>

                      <button
                        onClick={() => setAiPlannerOpen(true)}
                        className="flex flex-col items-center justify-center gap-1 rounded-xl border border-slate-100 bg-slate-50 p-3 text-center transition-colors hover:border-slate-300 dark:border-zinc-800 dark:bg-zinc-800/50 dark:hover:border-zinc-700"
                      >
                        <Sparkles className="h-4 w-4 text-slate-700 dark:text-zinc-300" />
                        <span className="text-xs font-medium text-slate-800 dark:text-zinc-200">
                          AI วางแผน
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500">จัดสรรรอบ</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedActivity('custom');
                          setPresetModalOpen(true);
                        }}
                        className="flex flex-col items-center justify-center gap-1 rounded-xl border border-slate-100 bg-slate-50 p-3 text-center transition-colors hover:border-slate-300 dark:border-zinc-800 dark:bg-zinc-800/50 dark:hover:border-zinc-700"
                      >
                        <SlidersHorizontal className="h-4 w-4 text-slate-700 dark:text-zinc-300" />
                        <span className="text-xs font-medium text-slate-800 dark:text-zinc-200">
                          กำหนดเอง
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500">ปรับเวลาอิสระ</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Daily Focus Progress & City Preview */}
                <div className="space-y-4 lg:col-span-5">
                  {/* Daily Focus Progress Card */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
                      <span className="font-medium">เป้าหมายประจำวัน (Daily Progress)</span>
                      <Flame className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
                    </div>

                    <div className="mt-3 flex items-baseline justify-between">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-mono text-3xl font-light text-slate-900 tabular-nums dark:text-zinc-100">
                          {todayMinutes}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-zinc-500">
                          / {settings.dailyGoalMinutes} นาที
                        </span>
                      </div>
                      <span className="font-mono text-xs font-medium text-slate-600 dark:text-zinc-400">
                        {Math.min(100, Math.round((todayMinutes / settings.dailyGoalMinutes) * 100))}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-zinc-800">
                      <div
                        className="h-full bg-slate-900 rounded-full transition-all duration-500 dark:bg-zinc-100"
                        style={{
                          width: `${Math.min(100, Math.round((todayMinutes / settings.dailyGoalMinutes) * 100))}%`,
                        }}
                      />
                    </div>

                    <p className="mt-3 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                      {todayMinutes >= settings.dailyGoalMinutes
                        ? 'บรรลุเป้าหมายรายวันแล้ว เมืองของคุณกำลังเติบโตอย่างมั่นคง'
                        : todayMinutes > 0
                        ? `อีก ${settings.dailyGoalMinutes - todayMinutes} นาทีจะบรรลุเป้าหมายของวันนี้`
                        : `เริ่ม Focus Session แรกเพื่อเริ่มสะสมเวลา (เป้าหมาย ${settings.dailyGoalMinutes} นาที)`}
                    </p>
                  </div>

                  {/* Focus City Preview */}
                  <div
                    onClick={() => setActiveTab('city')}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-colors hover:border-slate-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-800">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-slate-700 dark:text-zinc-300" />
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                          ผังเมือง (City Preview)
                        </h4>
                      </div>
                      <span className="flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-zinc-300 group-hover:translate-x-0.5 transition-transform">
                        <span>สำรวจเมือง</span>
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>

                    {/* Miniature City Canvas Preview */}
                    <div className="mt-3">
                      <FocusCityViewer
                        buildings={cityState.buildings}
                        stage={cityState.stage}
                        coins={cityState.coins}
                        materials={cityState.materials}
                        sessions={sessions}
                        totalFocusMinutes={totalAllTimeMinutes}
                        compact={true}
                        soundEnabled={false}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
                      <span>{CITY_STAGES[cityState.stage].label}</span>
                      <span className="font-mono">{cityState.buildings.length} อาคาร</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: FOCUS TIMER                                       */}
          {/* ======================================================== */}
          {activeTab === 'focus' && (
            <div className="flex min-h-[calc(100vh-170px)] flex-col items-center justify-center">
              <FocusTimer
                phase={timerState.phase}
                timeLeft={timerState.timeLeft}
                isRunning={timerState.isRunning}
                initialFocusMinutes={timerState.initialFocusMinutes}
                initialBreakMinutes={timerState.initialBreakMinutes}
                totalRounds={timerState.totalRounds}
                currentRound={timerState.currentRound}
                taskTitle={timerState.taskTitle}
                category={timerState.category}
                modeName={timerState.modeName}
                ambientSound={settings.ambientSound}
                soundEnabled={settings.soundEnabled}
                onTogglePlayPause={handleTogglePlayPause}
                onStop={handleStopTimer}
                onSkipPhase={handleSkipPhase}
                onChangeAmbientSound={(snd) => setSettings((s) => ({ ...s, ambientSound: snd }))}
                onToggleSound={() => setSettings((s) => ({ ...s, soundEnabled: !s.soundEnabled }))}
              />
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: FOCUS CITY & LANDMARKS                            */}
          {/* ======================================================== */}
          {activeTab === 'city' && (
            <div className="space-y-4">
              {/* City Top Bar */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    Isometric City
                  </span>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">
                    {cityState.name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    {CITY_STAGES[cityState.stage].label} · {CITY_STAGES[cityState.stage].description}
                  </p>
                </div>

                {/* Subtab Toggle: City Viewer vs Landmarks */}
                <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                  <button
                    onClick={() => setCitySubTab('canvas')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      citySubTab === 'canvas'
                        ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                    }`}
                  >
                    ผังเมือง (City View)
                  </button>
                  <button
                    onClick={() => setCitySubTab('landmarks')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      citySubTab === 'landmarks'
                        ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                    }`}
                  >
                    แลนด์มาร์ก (Landmarks)
                  </button>
                </div>
              </div>

              {/* Subtab 1: City Canvas */}
              {citySubTab === 'canvas' && (
                <div className="space-y-4">
                  <FocusCityViewer
                    buildings={cityState.buildings}
                    stage={cityState.stage}
                    coins={cityState.coins}
                    materials={cityState.materials}
                    sessions={sessions}
                    totalFocusMinutes={totalAllTimeMinutes}
                    justEarnedEnergy={justEarnedEnergy}
                    onStartFocusCategory={(cat) => {
                      setTimerState((prev) => ({
                        ...prev,
                        category: cat,
                      }));
                      setActiveTab('focus');
                    }}
                    onUpgradeBuilding={(bId) => {
                      setCityState((prev) => ({
                        ...prev,
                        buildings: prev.buildings.map((b) =>
                          b.id === bId ? { ...b, level: Math.min(3, b.level + 1) } : b
                        ),
                      }));
                    }}
                    onPlaceBuilding={(bpId, x, y) => {
                      const bp =
                        BUILDING_BLUEPRINTS.find((b) => b.id === bpId) ||
                        LANDMARK_BLUEPRINTS.find((b) => b.id === bpId);
                      if (!bp) return;

                      const newB: PlacedBuilding = {
                        id: 'b-' + Date.now(),
                        blueprintId: bp.id,
                        name: bp.name,
                        district: bp.district,
                        level: 1,
                        buildStage: 'foundation',
                        stageProgress: 15,
                        focusMinutesSpent: 0,
                        x,
                        y,
                        color: bp.baseColor,
                        accentColor: bp.accentColor,
                        icon: bp.district,
                        isLandmark: bp.isLandmark,
                      };

                      setCityState((prev) => ({
                        ...prev,
                        coins: Math.max(0, prev.coins - bp.costCoins),
                        materials: Math.max(0, prev.materials - bp.costMaterials),
                        buildings: [...prev.buildings, newB],
                      }));
                    }}
                    soundEnabled={settings.soundEnabled}
                  />

                  {/* 5 Distinct Districts Guide */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-3">
                      ย่านในเมืองของคุณ (Districts)
                    </h4>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                      {[
                        { type: 'reading' as ActivityType, label: 'Education District', desc: 'อ่านหนังสือ' },
                        { type: 'project' as ActivityType, label: 'Technology District', desc: 'ทำโปรเจกต์' },
                        { type: 'creative' as ActivityType, label: 'Creative District', desc: 'งานสร้างสรรค์' },
                        { type: 'work' as ActivityType, label: 'Work District', desc: 'ทำงาน/การบ้าน' },
                        { type: 'memory' as ActivityType, label: 'Knowledge District', desc: 'ท่องจำ/ทบทวน' },
                      ].map((dist) => (
                        <div
                          key={dist.label}
                          className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center dark:border-zinc-800 dark:bg-zinc-850"
                        >
                          <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                            {getActivityIcon(dist.type, 'h-4 w-4')}
                          </div>
                          <span className="block text-xs font-medium text-slate-800 dark:text-zinc-200">
                            {dist.label}
                          </span>
                          <span className="block text-[11px] text-slate-500 dark:text-zinc-400">
                            {dist.desc}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Subtab 2: Landmarks */}
              {citySubTab === 'landmarks' && (
                <LandmarksShowcase
                  totalFocusMinutes={totalAllTimeMinutes}
                  placedBuildings={cityState.buildings}
                  onPlaceLandmark={(lmId) => {
                    const bp = LANDMARK_BLUEPRINTS.find((l) => l.id === lmId);
                    if (!bp) return;

                    for (let x = 0; x < 5; x++) {
                      for (let y = 0; y < 5; y++) {
                        const occupied = cityState.buildings.some((b) => b.x === x && b.y === y);
                        if (!occupied) {
                          const newB: PlacedBuilding = {
                            id: 'lm-inst-' + Date.now(),
                            blueprintId: bp.id,
                            name: bp.name,
                            district: bp.district,
                            level: 1,
                            buildStage: 'complete',
                            stageProgress: 100,
                            focusMinutesSpent: bp.requiredMinutes || 300,
                            x,
                            y,
                            color: bp.baseColor,
                            accentColor: bp.accentColor,
                            icon: bp.district,
                            isLandmark: true,
                          };
                          setCityState((prev) => ({
                            ...prev,
                            buildings: [...prev.buildings, newB],
                          }));
                          setCitySubTab('canvas');
                          return;
                        }
                      }
                    }
                  }}
                  soundEnabled={settings.soundEnabled}
                />
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: TASKS                                             */}
          {/* ======================================================== */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <TaskList
                tasks={tasks}
                activeTaskId={timerState.taskId}
                onAddTask={handleAddTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onSelectActiveTask={(id) => {
                  const t = tasks.find((item) => item.id === id);
                  if (t) {
                    setSelectedActivity(t.category);
                    setPresetModalOpen(true);
                  }
                }}
                onStartTaskSession={(t) => {
                  setSelectedActivity(t.category);
                  setPresetModalOpen(true);
                }}
                soundEnabled={settings.soundEnabled}
              />
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: PROGRESS STATS                                    */}
          {/* ======================================================== */}
          {activeTab === 'progress' && (
            <ProgressStats
              sessions={sessions}
              cityState={cityState}
              streakDays={streakDays}
              tasksCompletedCount={tasks.filter((t) => t.completed).length}
              settings={settings}
              onNavigateToCity={() => setActiveTab('city')}
              onStartFocus={() => setActiveTab('focus')}
            />
          )}
        </main>
      </div>

      {/* 2. Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95 lg:hidden">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 p-1 text-[11px] font-medium transition-colors ${
            activeTab === 'home'
              ? 'text-slate-900 dark:text-zinc-100'
              : 'text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300'
          }`}
        >
          <Home className="h-5 w-5" />
          <span>หน้าแรก</span>
        </button>

        <button
          onClick={() => setActiveTab('focus')}
          className={`relative flex flex-col items-center gap-1 p-1 text-[11px] font-medium transition-colors ${
            activeTab === 'focus'
              ? 'text-slate-900 dark:text-zinc-100'
              : 'text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300'
          }`}
        >
          <Clock className="h-5 w-5" />
          <span>โฟกัส</span>
          {timerState.active && (
            <span className="absolute top-1 right-2 h-2 w-2 rounded-full bg-slate-900 animate-pulse dark:bg-zinc-100" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('city')}
          className={`flex flex-col items-center gap-1 p-1 text-[11px] font-medium transition-colors ${
            activeTab === 'city'
              ? 'text-slate-900 dark:text-zinc-100'
              : 'text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300'
          }`}
        >
          <Building2 className="h-5 w-5" />
          <span>เมือง</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex flex-col items-center gap-1 p-1 text-[11px] font-medium transition-colors ${
            activeTab === 'tasks'
              ? 'text-slate-900 dark:text-zinc-100'
              : 'text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300'
          }`}
        >
          <CheckSquare className="h-5 w-5" />
          <span>งาน</span>
        </button>

        <button
          onClick={() => setActiveTab('progress')}
          className={`flex flex-col items-center gap-1 p-1 text-[11px] font-medium transition-colors ${
            activeTab === 'progress'
              ? 'text-slate-900 dark:text-zinc-100'
              : 'text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300'
          }`}
        >
          <BarChart2 className="h-5 w-5" />
          <span>สถิติ</span>
        </button>
      </nav>

      {/* Undo Toast Notification */}
      {undoToast && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 left-4 sm:left-auto sm:right-6 z-50 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-900 px-4 py-3 text-xs text-white shadow-xl dark:border-zinc-700 dark:bg-zinc-800 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <span className="truncate max-w-[220px] sm:max-w-xs">{undoToast.message}</span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={undoToast.action}
              className="rounded-lg bg-white/20 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/30 transition-colors"
            >
              เลิกทำ (Undo)
            </button>
            <button
              onClick={() => setUndoToast(null)}
              className="rounded-lg p-1 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* MODALS */}
      {/* 1. Preset Selector Modal */}
      <PresetSelectorModal
        isOpen={presetModalOpen}
        onClose={() => setPresetModalOpen(false)}
        category={selectedActivity}
        tasks={tasks}
        onStartSession={handleStartSession}
        savedPresets={savedPresets}
        onSaveCustomPreset={handleSaveCustomPreset}
        onDeleteCustomPreset={handleDeleteCustomPreset}
        soundEnabled={settings.soundEnabled}
      />

      {/* 2. AI Planner Modal */}
      <AIFocusPlannerModal
        isOpen={aiPlannerOpen}
        onClose={() => setAiPlannerOpen(false)}
        onApplyPlan={(plan, addTasks) => {
          if (addTasks) {
            const newTasks: Task[] = plan.sessions.map((s, idx) => ({
              id: 't-ai-' + Date.now() + '-' + idx,
              title: s.name + ': ' + s.topic,
              category: selectedActivity,
              completed: false,
              createdAt: new Date().toISOString(),
              focusMinutesSpent: 0,
            }));
            setTasks((prev) => [...newTasks, ...prev]);
          }

          if (plan.sessions.length > 0) {
            const first = plan.sessions[0];
            handleStartSession({
              focusMinutes: first.focusMinutes,
              breakMinutes: first.breakMinutes,
              totalRounds: plan.sessions.length,
              taskTitle: first.name,
              category: selectedActivity,
              modeName: 'AI Focus Plan',
            });
          }
          setAiPlannerOpen(false);
        }}
        soundEnabled={settings.soundEnabled}
      />

      {/* 3. Session Feedback & City Growth Modal */}
      {feedbackSessionData && (
        <SessionFeedbackModal
          isOpen={feedbackModalOpen}
          onClose={() => {
            setFeedbackModalOpen(false);
            setFeedbackSessionData(null);
          }}
          onSubmit={handleFeedbackSubmit}
          category={feedbackSessionData.category}
          taskTitle={feedbackSessionData.taskTitle}
          focusMinutes={feedbackSessionData.completedMinutes}
          earnedCoins={feedbackSessionData.coins}
          earnedMaterials={feedbackSessionData.materials}
          earnedXp={feedbackSessionData.xp}
          soundEnabled={settings.soundEnabled}
        />
      )}

      {/* 4. Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newSettings) => setSettings((s) => ({ ...s, ...newSettings }))}
        cityState={cityState}
        onRenameCity={(newName) => setCityState((c) => ({ ...c, name: newName }))}
        tasks={tasks}
        onResetGoals={() =>
          setSettings((s) => ({ ...s, dailyGoalMinutes: 120, weeklyGoalMinutes: 700 }))
        }
        onClearCompletedTasks={() =>
          setTasks((prev) => prev.filter((t) => !t.completed))
        }
        onResetData={() => {
          localStorage.removeItem(STORAGE_KEY);
          window.location.reload();
        }}
      />
    </div>
  );
}
