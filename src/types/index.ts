export type ActivityType =
  | 'reading'
  | 'memory'
  | 'work'
  | 'project'
  | 'creative'
  | 'quick'
  | 'ai'
  | 'custom';

export type FocusIntensity = 'light' | 'standard' | 'deep' | 'custom';

export type DistrictType =
  | 'education'
  | 'research'
  | 'business'
  | 'technology'
  | 'creative'
  | 'civic';

export type BuildingStage = 'foundation' | 'construction' | 'complete' | 'upgraded';

export interface Task {
  id: string;
  title: string;
  category: ActivityType;
  completed: boolean;
  createdAt: string;
  focusMinutesSpent: number;
  notes?: string;
}

export type FeedbackRating = 'too_long' | 'just_right' | 'too_short';

export interface CompletedSession {
  id: string;
  taskId?: string;
  taskTitle: string;
  category: ActivityType;
  focusMinutes: number;
  breakMinutes: number;
  completedAt: string;
  feedbackRating: FeedbackRating;
  achievedNote: string;
  coinsEarned: number;
  materialsEarned: number;
  xpEarned: number;
  cityEnergyEarned?: number;
}

export interface PlacedBuilding {
  id: string;
  blueprintId: string;
  name: string;
  district: DistrictType;
  level: number;
  buildStage: BuildingStage;
  stageProgress: number; // 0..100
  focusMinutesSpent: number;
  x: number; // grid coordinate 0..4
  y: number; // grid coordinate 0..4
  color: string;
  accentColor: string;
  icon: string;
  isLandmark?: boolean;
}

export interface BuildingBlueprint {
  id: string;
  name: string;
  district: DistrictType;
  categoryTrigger: ActivityType | 'all' | 'landmark';
  description: string;
  costCoins: number;
  costMaterials: number;
  baseColor: string;
  accentColor: string;
  icon: string;
  maxLevel: number;
  requiredCityStage?: CityStage;
  isLandmark?: boolean;
  requiredMinutes?: number;
}

export type CityStage =
  | 'small_town'
  | 'growing_city'
  | 'modern_city'
  | 'smart_city'
  | 'future_city';

export interface CityState {
  name: string;
  stage: CityStage;
  coins: number;
  materials: number;
  xp: number;
  buildings: PlacedBuilding[];
  unlockedLandmarkIds: string[];
}

export interface CustomPreset {
  id: string;
  name: string;
  focusMinutes: number;
  breakMinutes: number;
  rounds: number;
  longBreakMinutes: number;
  longBreakEvery: number;
}

export interface QuickFocusOption {
  label: string;
  totalMinutes: number;
  plan: {
    focusMinutes: number;
    breakMinutes: number;
    rounds: number;
    description: string;
  };
}

export interface UserSettings {
  dailyGoalMinutes: number;
  weeklyGoalMinutes: number;
  soundEnabled: boolean;
  ambientSound: 'none' | 'whitenoise' | 'clock' | 'rain';
  theme: 'light' | 'dark' | 'system';
  smartRecommendationsEnabled: boolean;
  defaultFocusMode?: 'light' | 'standard' | 'deep';
}

export type NavTab = 'home' | 'tasks' | 'focus' | 'city' | 'progress';

export interface AISessionItem {
  order: number;
  name: string;
  focusMinutes: number;
  breakMinutes: number;
  topic: string;
  tips?: string;
}

export interface AIPlanResult {
  planTitle: string;
  reasoning: string;
  totalEstimatedMinutes: number;
  sessions: AISessionItem[];
}
