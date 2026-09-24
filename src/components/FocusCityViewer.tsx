import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  PlacedBuilding,
  CityStage,
  DistrictType,
  BuildingBlueprint,
  CompletedSession,
  ActivityType,
} from '../types';
import {
  DISTRICT_INFO,
  BUILDING_BLUEPRINTS,
  LANDMARK_BLUEPRINTS,
  CITY_STAGES,
} from '../data/cityData';
import { sound } from '../utils/audio';
import { getDistrictIcon, getActivityIcon } from '../utils/categoryIcons';
import {
  IsometricBuildingModel,
  BlueprintPreviewModel,
} from './city/IsometricBuildingModels';
import {
  IsometricTree,
  IsometricStreetLamp,
  IsometricBench,
  IsometricBikeRack,
  IsometricZebraCrossing,
  MinimalLockBadge,
} from './city/CityEnvironmentDecorations';
import {
  Building2,
  Sparkles,
  X,
  Clock,
  Layers,
  Zap,
  Info,
  Trophy,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  CheckCircle2,
  Lock,
  Compass,
  ArrowUpRight,
  ChevronRight,
  MapPin,
} from 'lucide-react';

interface FocusCityViewerProps {
  buildings: PlacedBuilding[];
  stage: CityStage;
  coins: number;
  materials: number;
  sessions?: CompletedSession[];
  totalFocusMinutes?: number;
  onUpgradeBuilding?: (buildingId: string) => void;
  onPlaceBuilding?: (blueprintId: string, x: number, y: number) => void;
  onStartFocusCategory?: (category: ActivityType) => void;
  soundEnabled?: boolean;
  compact?: boolean;
  unlockedLandmarks?: string[];
  justEarnedEnergy?: number;
}

// Preset designated prospective plots on the 5x5 grid for Locked Building Previews
interface ProspectivePlot {
  x: number;
  y: number;
  blueprintId: string;
  district: DistrictType;
  requiredMinutes: number;
  category: ActivityType;
}

const PROSPECTIVE_PLOTS: ProspectivePlot[] = [
  { x: 1, y: 1, blueprintId: 'b-lib', district: 'education', requiredMinutes: 25, category: 'reading' },
  { x: 3, y: 1, blueprintId: 'b-techhub', district: 'technology', requiredMinutes: 25, category: 'project' },
  { x: 1, y: 3, blueprintId: 'b-studio', district: 'creative', requiredMinutes: 25, category: 'creative' },
  { x: 3, y: 3, blueprintId: 'b-lab', district: 'research', requiredMinutes: 25, category: 'memory' },
  { x: 2, y: 3, blueprintId: 'b-office', district: 'business', requiredMinutes: 25, category: 'work' },
  { x: 2, y: 0, blueprintId: 'lm-clocktower', district: 'civic', requiredMinutes: 300, category: 'custom' },
];

export const FocusCityViewer: React.FC<FocusCityViewerProps> = ({
  buildings,
  stage,
  coins,
  materials,
  sessions = [],
  totalFocusMinutes = 0,
  onUpgradeBuilding,
  onPlaceBuilding,
  onStartFocusCategory,
  soundEnabled = true,
  compact = false,
  unlockedLandmarks = [],
  justEarnedEnergy = 0,
}) => {
  // Selection states
  const [selectedSlot, setSelectedSlot] = useState<{ x: number; y: number } | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<PlacedBuilding | null>(null);
  const [selectedLockedPlot, setSelectedLockedPlot] = useState<ProspectivePlot | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictType | null>(null);
  const [selectedMysteryLandmark, setSelectedMysteryLandmark] = useState<BuildingBlueprint | null>(null);

  // Upgrade preview toggle (for inspecting next level evolution)
  const [showNextLevelPreview, setShowNextLevelPreview] = useState(false);

  // Modals
  const [showBuildModal, setShowBuildModal] = useState(false);
  const [energyPulseActive, setEnergyPulseActive] = useState(false);

  // Filter mode: 'all' | 'built' | 'preview'
  const [viewFilter, setViewFilter] = useState<'all' | 'built' | 'preview'>('all');

  // Zoom & Pan state for responsive canvas
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Dark mode detection
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

  // Energy pulse effect
  useEffect(() => {
    if (justEarnedEnergy > 0) {
      setEnergyPulseActive(true);
      const t = setTimeout(() => setEnergyPulseActive(false), 2400);
      return () => clearTimeout(t);
    }
  }, [justEarnedEnergy]);

  // Reset upgrade preview tab when selecting a different building
  useEffect(() => {
    setShowNextLevelPreview(false);
  }, [selectedBuilding?.id]);

  // Calculate actual category minutes from sessions
  const categoryStats = useMemo(() => {
    const stats: Record<ActivityType, number> = {
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
      if (stats[s.category] !== undefined) {
        stats[s.category] += s.focusMinutes;
      }
    });
    return stats;
  }, [sessions]);

  // District status calculations
  const districtProgress = useMemo(() => {
    const getProgress = (cat: ActivityType, target = 25) => {
      const mins = categoryStats[cat] || 0;
      return {
        minutes: mins,
        target,
        percent: Math.min(100, Math.round((mins / target) * 100)),
        unlocked: mins >= target || buildings.some((b) => {
          if (cat === 'reading') return b.district === 'education';
          if (cat === 'project') return b.district === 'technology';
          if (cat === 'creative') return b.district === 'creative';
          if (cat === 'work') return b.district === 'business';
          if (cat === 'memory') return b.district === 'research';
          return false;
        }),
      };
    };

    return {
      education: { ...getProgress('reading', 25), unlocked: true }, // Starter district is accessible
      technology: getProgress('project', 25),
      creative: getProgress('creative', 25),
      business: getProgress('work', 25),
      research: getProgress('memory', 25),
      civic: {
        minutes: totalFocusMinutes,
        target: 300,
        percent: Math.min(100, Math.round((totalFocusMinutes / 300) * 100)),
        unlocked: totalFocusMinutes >= 300 || buildings.some((b) => b.district === 'civic'),
      },
    };
  }, [categoryStats, buildings, totalFocusMinutes]);

  // Overall City Development Progress (0% to 100%)
  const cityDevelopmentPercent = useMemo(() => {
    let score = 0;
    // Each building built: 10%
    score += buildings.length * 10;
    // Each upgraded level beyond 1: 5%
    buildings.forEach((b) => {
      score += Math.max(0, (b.level - 1) * 5);
    });
    // Each unlocked peripheral district: 6%
    if (districtProgress.technology.unlocked) score += 6;
    if (districtProgress.creative.unlocked) score += 6;
    if (districtProgress.business.unlocked) score += 6;
    if (districtProgress.research.unlocked) score += 6;
    if (districtProgress.civic.unlocked) score += 6;

    // Stage bonus
    if (stage === 'growing_city') score += 5;
    if (stage === 'modern_city') score += 10;
    if (stage === 'smart_city') score += 15;
    if (stage === 'future_city') score += 20;

    return Math.min(100, score);
  }, [buildings, districtProgress, stage]);

  // Grid coordinates
  const GRID_SIZE = 5;
  const tileWidth = 76;
  const tileHeight = 38;
  const originX = compact ? 260 : 340;
  const originY = compact ? 84 : 110;

  const toIso = (x: number, y: number) => {
    const isoX = originX + (x - y) * (tileWidth / 2);
    const isoY = originY + (x + y) * (tileHeight / 2);
    return { isoX, isoY };
  };

  const getBuildingAt = (x: number, y: number) => {
    return buildings.find((b) => b.x === x && b.y === y);
  };

  const getProspectiveAt = (x: number, y: number) => {
    return PROSPECTIVE_PLOTS.find((p) => p.x === x && p.y === y);
  };

  const handleTileClick = (x: number, y: number) => {
    sound.playTapSound(soundEnabled);
    const b = getBuildingAt(x, y);

    if (b) {
      // Clicked on a built building
      setSelectedBuilding(b);
      setSelectedLockedPlot(null);
      setSelectedSlot(null);
      setSelectedDistrict(null);
      setSelectedMysteryLandmark(null);
      setShowBuildModal(false);
      return;
    }

    const prospective = getProspectiveAt(x, y);
    if (prospective && viewFilter !== 'built') {
      // Clicked on a locked prospective building preview plot
      setSelectedLockedPlot(prospective);
      setSelectedBuilding(null);
      setSelectedSlot(null);
      setSelectedDistrict(null);
      setSelectedMysteryLandmark(null);
      setShowBuildModal(false);
      return;
    }

    // Clicked on an open slot
    setSelectedSlot({ x, y });
    setSelectedBuilding(null);
    setSelectedLockedPlot(null);
    setSelectedDistrict(null);
    setSelectedMysteryLandmark(null);

    if (!compact && onPlaceBuilding) {
      setShowBuildModal(true);
    }
  };

  const handleDistrictClick = (district: DistrictType) => {
    sound.playTapSound(soundEnabled);
    setSelectedDistrict(district);
    setSelectedBuilding(null);
    setSelectedLockedPlot(null);
    setSelectedSlot(null);
    setSelectedMysteryLandmark(null);
  };

  const handleMysteryClick = (landmark: BuildingBlueprint) => {
    sound.playTapSound(soundEnabled);
    setSelectedMysteryLandmark(landmark);
    setSelectedBuilding(null);
    setSelectedLockedPlot(null);
    setSelectedSlot(null);
    setSelectedDistrict(null);
  };

  // Depth sorting for 5x5 grid
  const gridCoords: { x: number; y: number }[] = [];
  for (let sum = 0; sum <= (GRID_SIZE - 1) * 2; sum++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const y = sum - x;
      if (y >= 0 && y < GRID_SIZE) {
        gridCoords.push({ x, y });
      }
    }
  }

  // Peripheral Districts configuration around the central grid
  const peripheralDistricts: {
    id: DistrictType;
    label: string;
    sublabel: string;
    anchorX: number;
    anchorY: number;
    color: string;
    sampleBlueprintId: string;
  }[] = [
    {
      id: 'education',
      label: 'Education Campus',
      sublabel: 'ย่านการศึกษา & หอสมุด',
      anchorX: compact ? 70 : 80,
      anchorY: compact ? 95 : 120,
      color: '#3B82F6',
      sampleBlueprintId: 'b-lib',
    },
    {
      id: 'technology',
      label: 'Technology Park',
      sublabel: 'ย่านเทคโนโลยี & โค้ดดิ้ง',
      anchorX: compact ? 440 : 590,
      anchorY: compact ? 95 : 120,
      color: '#06B6D4',
      sampleBlueprintId: 'b-techhub',
    },
    {
      id: 'creative',
      label: 'Creative Quarter',
      sublabel: 'ย่านศิลปะ & สตูดิโอ',
      anchorX: compact ? 70 : 80,
      anchorY: compact ? 260 : 350,
      color: '#EC4899',
      sampleBlueprintId: 'b-studio',
    },
    {
      id: 'research',
      label: 'Knowledge Hill',
      sublabel: 'ย่านคลังความรู้ & หอดูดาว',
      anchorX: compact ? 440 : 590,
      anchorY: compact ? 260 : 350,
      color: '#8B5CF6',
      sampleBlueprintId: 'b-lab',
    },
    {
      id: 'business',
      label: 'Work District',
      sublabel: 'ย่านธุรกิจ & โคเวิร์กกิ้ง',
      anchorX: compact ? 260 : 340,
      anchorY: compact ? 310 : 425,
      color: '#10B981',
      sampleBlueprintId: 'b-office',
    },
  ];

  const formatHoursMinutes = (totalMins: number) => {
    if (!totalMins || totalMins < 60) return `${totalMins || 0} นาที`;
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return m > 0 ? `${h} ชม. ${m} นาที` : `${h} ชม.`;
  };

  return (
    <div
      className={`relative w-full overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-b from-slate-50 via-sky-50/30 to-slate-100/70 shadow-xs transition-colors duration-300 dark:border-zinc-800 dark:from-slate-950 dark:via-zinc-900 dark:to-slate-950 ${
        compact ? 'h-64 sm:h-72' : 'min-h-[500px] h-[560px] lg:h-[620px]'
      }`}
    >
      {/* ================================================================= */}
      {/* TOP HEADER CONTROLS & CITY PROGRESS BAR                           */}
      {/* ================================================================= */}
      <div className="absolute top-3.5 left-3.5 right-3.5 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: City Development Status Badge */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-xs backdrop-blur-md dark:border-zinc-700/80 dark:bg-zinc-900/90 dark:text-zinc-200">
            <Building2 className="h-3.5 w-3.5 text-amber-500" />
            <span>City Development — {cityDevelopmentPercent}%</span>
            <div className="h-1.5 w-14 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${cityDevelopmentPercent}%` }}
              />
            </div>
          </div>

          {!compact && (
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/70 bg-white/80 px-2.5 py-1.5 text-[11px] text-slate-600 shadow-xs backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>สร้างแล้ว {buildings.length} อาคาร</span>
            </span>
          )}

          {/* Energy pulse banner on session completion */}
          {energyPulseActive && (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow-md animate-in fade-in zoom-in duration-300">
              <Zap className="h-3.5 w-3.5 fill-current" />
              <span>พลังงานเข้าสู่เมือง +{justEarnedEnergy || 100} City Energy</span>
            </span>
          )}
        </div>

        {/* Right: View Filters & Zoom controls */}
        {!compact && (
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {/* Filter Toggle */}
            <div className="flex items-center rounded-xl border border-slate-200/80 bg-white/90 p-0.5 shadow-xs backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/90">
              <button
                onClick={() => setViewFilter('all')}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  viewFilter === 'all'
                    ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                ผังรวม
              </button>
              <button
                onClick={() => setViewFilter('built')}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  viewFilter === 'built'
                    ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                สร้างแล้ว
              </button>
              <button
                onClick={() => setViewFilter('preview')}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  viewFilter === 'preview'
                    ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                ผังอนาคต
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center rounded-xl border border-slate-200/80 bg-white/90 p-0.5 shadow-xs backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/90">
              <button
                onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.15))}
                title="ขยาย"
                className="rounded-lg p-1 text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.15))}
                title="ย่อ"
                className="rounded-lg p-1 text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  setZoomLevel(1);
                  setPanOffset({ x: 0, y: 0 });
                }}
                title="รีเซ็ตมุมมอง"
                className="rounded-lg p-1 text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* SVG ISOMETRIC ARCHITECTURAL CANVAS                                */}
      {/* ================================================================= */}
      <div
        className="flex h-full w-full items-center justify-center cursor-grab active:cursor-grabbing select-none"
        onMouseDown={(e) => {
          if (compact) return;
          isDragging.current = true;
          dragStart.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
        }}
        onMouseMove={(e) => {
          if (!isDragging.current || compact) return;
          setPanOffset({
            x: e.clientX - dragStart.current.x,
            y: e.clientY - dragStart.current.y,
          });
        }}
        onMouseUp={() => {
          isDragging.current = false;
        }}
        onMouseLeave={() => {
          isDragging.current = false;
        }}
      >
        <svg
          viewBox={compact ? '0 0 520 340' : '0 0 680 460'}
          className="h-full w-full select-none transition-transform duration-200"
          preserveAspectRatio="xMidYMid meet"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center center',
          }}
        >
          <defs>
            <filter id="buildingShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="5" stdDeviation="3" floodOpacity={isDarkMode ? '0.35' : '0.14'} />
            </filter>
            <radialGradient id="lampGlowGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fde047" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
            <pattern id="roadHatch" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M 0 0 L 8 8 M 8 0 L 0 8" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
            </pattern>
          </defs>

          {/* ============================================================= */}
          {/* PERIPHERAL DISTRICT PREVIEW ZONES (LOCKED DISTRICTS)          */}
          {/* ============================================================= */}
          {!compact &&
            peripheralDistricts.map((pDist) => {
              const info = districtProgress[pDist.id];
              const isUnlocked = info.unlocked;
              const isSelected = selectedDistrict === pDist.id;
              const bp = BUILDING_BLUEPRINTS.find((b) => b.id === pDist.sampleBlueprintId) || BUILDING_BLUEPRINTS[0];

              return (
                <g
                  key={pDist.id}
                  className="cursor-pointer transition-all duration-200"
                  onClick={() => handleDistrictClick(pDist.id)}
                >
                  {/* Subtle connecting road line towards central city */}
                  <line
                    x1={pDist.anchorX}
                    y1={pDist.anchorY}
                    x2={originX}
                    y2={originY + 70}
                    stroke={isDarkMode ? '#334155' : '#cbd5e1'}
                    strokeWidth="1.2"
                    strokeDasharray="4,3"
                    opacity={isUnlocked ? 0.8 : 0.4}
                  />

                  {/* District Ground Podium Plinth */}
                  <ellipse
                    cx={pDist.anchorX}
                    cy={pDist.anchorY + 12}
                    rx={46}
                    ry={24}
                    fill={isDarkMode ? (isUnlocked ? '#1e293b' : '#0f172a') : (isUnlocked ? '#e2e8f0' : '#f1f5f9')}
                    stroke={isSelected ? '#f59e0b' : isUnlocked ? pDist.color : isDarkMode ? '#334155' : '#cbd5e1'}
                    strokeWidth={isSelected ? 2 : 1}
                    strokeDasharray={isUnlocked ? undefined : '4,3'}
                    opacity={isUnlocked ? 0.9 : 0.65}
                  />

                  {/* Architectural Silhouette / Preview Model */}
                  <g
                    transform={`translate(${pDist.anchorX}, ${pDist.anchorY})`}
                    opacity={isUnlocked ? 1 : 0.6}
                  >
                    <BlueprintPreviewModel
                      blueprint={bp}
                      isoX={0}
                      isoY={0}
                      level={1}
                      isDarkMode={isDarkMode}
                      isPreview={!isUnlocked}
                    />
                  </g>

                  {/* Minimal Lock Badge if locked */}
                  {!isUnlocked && (
                    <MinimalLockBadge x={pDist.anchorX} y={pDist.anchorY - 26} size={18} isDark={isDarkMode} />
                  )}

                  {/* District Floating Pill Label */}
                  <g transform={`translate(${pDist.anchorX}, ${pDist.anchorY + 28})`}>
                    <rect
                      x="-54"
                      y="-9"
                      width="108"
                      height="18"
                      rx="9"
                      fill={isDarkMode ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.92)'}
                      stroke={isSelected ? '#f59e0b' : isDarkMode ? 'rgba(51, 65, 85, 0.8)' : 'rgba(203, 213, 225, 0.8)'}
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="3.5"
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="600"
                      fill={isDarkMode ? '#e2e8f0' : '#1e293b'}
                    >
                      {pDist.label}
                    </text>
                  </g>
                </g>
              );
            })}

          {/* ============================================================= */}
          {/* CENTRAL 5x5 ISOMETRIC GRID TILES & BUILDINGS                  */}
          {/* ============================================================= */}
          {gridCoords.map(({ x, y }) => {
            const { isoX, isoY } = toIso(x, y);
            const building = getBuildingAt(x, y);
            const prospective = getProspectiveAt(x, y);

            const isSelected =
              (selectedSlot && selectedSlot.x === x && selectedSlot.y === y) ||
              (selectedBuilding && selectedBuilding.x === x && selectedBuilding.y === y) ||
              (selectedLockedPlot && selectedLockedPlot.x === x && selectedLockedPlot.y === y);

            const isRoad = x === 2 || y === 2;
            const isCenterPlaza = x === 2 && y === 2;

            const top = `${isoX},${isoY - tileHeight / 2}`;
            const right = `${isoX + tileWidth / 2},${isoY}`;
            const bottom = `${isoX},${isoY + tileHeight / 2}`;
            const left = `${isoX - tileWidth / 2},${isoY}`;
            const tilePoints = `${top} ${right} ${bottom} ${left}`;

            // Should show prospective preview on this empty slot?
            const showProspective =
              !building && prospective && viewFilter !== 'built';
            const prospectiveBp = showProspective
              ? BUILDING_BLUEPRINTS.find((b) => b.id === prospective.blueprintId) ||
                LANDMARK_BLUEPRINTS.find((b) => b.id === prospective.blueprintId)
              : null;

            // Mystery landmark condition: if requirement > 200 min and user has < 30%
            const isMystery =
              showProspective &&
              prospectiveBp?.isLandmark &&
              totalFocusMinutes < (prospectiveBp.requiredMinutes || 300) * 0.3;

            return (
              <g
                key={`${x}-${y}`}
                className="cursor-pointer transition-all duration-200"
                onClick={() => handleTileClick(x, y)}
              >
                {/* Tile Base Polygon */}
                <polygon
                  points={tilePoints}
                  className={`transition-colors duration-200 ${
                    isSelected
                      ? 'fill-amber-200 stroke-amber-500 stroke-2 dark:fill-amber-950/80 dark:stroke-amber-400'
                      : isCenterPlaza
                      ? 'fill-slate-100 stroke-slate-300 dark:fill-zinc-800 dark:stroke-zinc-700'
                      : isRoad
                      ? 'fill-slate-200/90 stroke-slate-300/80 dark:fill-slate-800/80 dark:stroke-slate-700/80'
                      : showProspective
                      ? 'fill-slate-100/70 stroke-slate-200/60 dark:fill-zinc-900/60 dark:stroke-zinc-800/50'
                      : 'fill-emerald-50/80 stroke-emerald-200/60 dark:fill-slate-900/50 dark:stroke-slate-800/40'
                  }`}
                />

                {/* Center Plaza Pavers */}
                {isCenterPlaza && !building && (
                  <g opacity="0.6">
                    <circle cx={isoX} cy={isoY} r={8} fill="none" stroke={isDarkMode ? '#64748b' : '#94a3b8'} strokeWidth="0.8" />
                    <circle cx={isoX} cy={isoY} r={3} fill={isDarkMode ? '#fbbf24' : '#f59e0b'} />
                  </g>
                )}

                {/* Road Crosswalk Markings */}
                {isRoad && !building && !isCenterPlaza && (
                  <IsometricZebraCrossing isoX={isoX} isoY={isoY} isDarkMode={isDarkMode} />
                )}

                {/* Streetlamps along main avenues */}
                {isRoad && !building && (x === 0 || x === 4 || y === 0 || y === 4) && (
                  <g transform={`translate(${isoX + (x === 2 ? 14 : -14)}, ${isoY})`}>
                    <IsometricStreetLamp x={0} y={0} isDarkMode={isDarkMode} />
                  </g>
                )}

                {/* Environment Trees on peaceful green open tiles */}
                {!building && !isRoad && !showProspective && (
                  <g transform={`translate(${isoX}, ${isoY})`}>
                    <IsometricTree x={-10} y={-2} size="sm" isDarkMode={isDarkMode} />
                    <IsometricTree x={8} y={3} size="md" variant="cypress" isDarkMode={isDarkMode} />
                    <IsometricBench x={-2} y={5} isDarkMode={isDarkMode} />
                  </g>
                )}

                {/* Selection Marker for open slot */}
                {!building && !showProspective && isSelected && (
                  <g transform={`translate(${isoX - 8}, ${isoY - 8})`}>
                    <circle cx="8" cy="8" r="8" className="fill-amber-500 shadow-md" />
                    <line x1="8" y1="4" x2="8" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    <line x1="4" y1="8" x2="12" y2="8" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </g>
                )}

                {/* ===================================================== */}
                {/* 1. ACTUAL PLACED ACTIVE BUILDING                      */}
                {/* ===================================================== */}
                {building && (
                  <g
                    className="transition-transform duration-200 hover:-translate-y-1"
                    filter="url(#buildingShadow)"
                  >
                    <IsometricBuildingModel
                      building={building}
                      isoX={isoX}
                      isoY={isoY}
                      isDarkMode={isDarkMode}
                      isPreview={false}
                    />

                    {/* Level Indicator Badge */}
                    <g transform={`translate(${isoX}, ${isoY + 14})`}>
                      <rect
                        x="-14"
                        y="-6"
                        width="28"
                        height="12"
                        rx="6"
                        fill={isDarkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)'}
                        stroke={isDarkMode ? '#475569' : '#cbd5e1'}
                        strokeWidth="0.8"
                      />
                      <text
                        x="0"
                        y="2.5"
                        textAnchor="middle"
                        fontSize="7.5"
                        fontWeight="700"
                        fill={isDarkMode ? '#e2e8f0' : '#1e293b'}
                      >
                        Lv.{building.level}
                      </text>
                    </g>
                  </g>
                )}

                {/* ===================================================== */}
                {/* 2. LOCKED CITY PREVIEW: SILHOUETTE OF PROSPECTIVE     */}
                {/* ===================================================== */}
                {showProspective && prospectiveBp && (
                  <g
                    className="transition-transform duration-200 hover:-translate-y-0.5"
                    opacity={isSelected ? 0.85 : 0.65}
                  >
                    <BlueprintPreviewModel
                      blueprint={prospectiveBp}
                      isoX={isoX}
                      isoY={isoY}
                      level={1}
                      isDarkMode={isDarkMode}
                      isPreview={true}
                      isMystery={isMystery}
                    />

                    {/* Minimal Stroke Lock Badge */}
                    <MinimalLockBadge x={isoX} y={isoY - 26} size={16} isDark={isDarkMode} />
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* ================================================================= */}
      {/* PANEL 1: BUILT BUILDING INSPECTION & NEXT LEVEL PREVIEW           */}
      {/* ================================================================= */}
      {selectedBuilding && (
        <div className="absolute bottom-3 left-3 right-3 z-30 mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {getDistrictIcon(selectedBuilding.district, 'h-5 w-5')}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                    {selectedBuilding.name} — Level {selectedBuilding.level}
                  </h4>
                  {selectedBuilding.isLandmark && (
                    <span className="rounded-md bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                      Landmark
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {DISTRICT_INFO[selectedBuilding.district]?.name || 'ย่านพัฒนา'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedBuilding(null)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Details Row: Focus Time Spent & Next Upgrade Progress */}
          <div className="mt-3.5 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-2.5 dark:bg-zinc-800/60">
            <div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                Focus Time สะสม:
              </span>
              <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                {formatHoursMinutes(selectedBuilding.focusMinutesSpent || 0)}
              </p>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                ความก้าวหน้า Level ถัดไป:
              </span>
              <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                {selectedBuilding.level >= 3 ? 'Max Level' : `${selectedBuilding.stageProgress || 0}%`}
              </p>
            </div>
          </div>

          {/* Upgrade Progress Bar */}
          <div className="mt-2.5">
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-zinc-800">
              <div
                className="h-full bg-slate-800 dark:bg-zinc-200 rounded-full transition-all duration-500"
                style={{ width: `${selectedBuilding.level >= 3 ? 100 : selectedBuilding.stageProgress || 0}%` }}
              />
            </div>
          </div>

          {/* Next Level Architectural Evolution Preview Box */}
          {selectedBuilding.level < 3 && !selectedBuilding.isLandmark && (
            <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 dark:border-zinc-800 dark:bg-zinc-850">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                  พรีวิว Level {selectedBuilding.level + 1}
                </span>
                <button
                  onClick={() => setShowNextLevelPreview(!showNextLevelPreview)}
                  className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <Eye className="h-3 w-3" />
                  <span>{showNextLevelPreview ? 'ซ่อนพรีวิว' : 'ดูรูปทรง Level ถัดไป'}</span>
                </button>
              </div>

              {showNextLevelPreview && (
                <div className="mt-2 flex items-center justify-center p-3 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700">
                  <svg viewBox="0 0 100 80" className="h-20 w-28">
                    {(() => {
                      const bp =
                        BUILDING_BLUEPRINTS.find((b) => b.id === selectedBuilding.blueprintId) ||
                        BUILDING_BLUEPRINTS[0];
                      return (
                        <BlueprintPreviewModel
                          blueprint={bp}
                          isoX={50}
                          isoY={45}
                          level={selectedBuilding.level + 1}
                          isDarkMode={isDarkMode}
                          isPreview={false}
                        />
                      );
                    })()}
                  </svg>
                </div>
              )}
            </div>
          )}

          {/* Simple Upgrade Action Button */}
          {onUpgradeBuilding && !selectedBuilding.isLandmark && selectedBuilding.level < 3 && (
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 dark:border-zinc-800">
              <span className="text-xs text-slate-500 dark:text-zinc-400">
                อัปเกรดเป็น Level {selectedBuilding.level + 1}
              </span>
              <button
                onClick={() => {
                  onUpgradeBuilding(selectedBuilding.id);
                  sound.playLevelUp(soundEnabled);
                }}
                className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-slate-800 active:scale-95 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                อัปเกรดอาคาร
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* PANEL 2: LOCKED BUILDING PREVIEW PANEL (SILHOUETTE & REQUIREMENTS) */}
      {/* ================================================================= */}
      {selectedLockedPlot && (
        <div className="absolute bottom-3 left-3 right-3 z-30 mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {(() => {
            const bp =
              BUILDING_BLUEPRINTS.find((b) => b.id === selectedLockedPlot.blueprintId) ||
              LANDMARK_BLUEPRINTS.find((b) => b.id === selectedLockedPlot.blueprintId);
            if (!bp) return null;

            const isMystery =
              bp.isLandmark && totalFocusMinutes < (bp.requiredMinutes || 300) * 0.3;

            const currentMinutes = bp.isLandmark
              ? totalFocusMinutes
              : categoryStats[selectedLockedPlot.category] || 0;
            const requiredMinutes = bp.isLandmark
              ? bp.requiredMinutes || 300
              : selectedLockedPlot.requiredMinutes;
            const percent = Math.min(100, Math.round((currentMinutes / requiredMinutes) * 100));
            const remainingMinutes = Math.max(0, requiredMinutes - currentMinutes);

            return (
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      <Lock className="h-4 w-4 text-slate-600 dark:text-zinc-400" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                          {isMystery ? 'สิ่งก่อสร้างลึกลับ (Unknown Landmark)' : bp.name}
                        </h4>
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
                          Locked
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        {isMystery
                          ? 'สะสมสมาธิเพิ่มเพื่อค้นพบความลับนี้'
                          : DISTRICT_INFO[bp.district]?.name}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedLockedPlot(null)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Silhouette Architectural Preview Render */}
                <div className="mt-3 flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-2 dark:border-zinc-800 dark:bg-zinc-850/50">
                  <svg viewBox="0 0 100 80" className="h-20 w-28">
                    <BlueprintPreviewModel
                      blueprint={bp}
                      isoX={50}
                      isoY={45}
                      level={1}
                      isDarkMode={isDarkMode}
                      isPreview={true}
                      isMystery={isMystery}
                    />
                  </svg>
                </div>

                {/* Unlock Requirement & Progress */}
                <div className="mt-3 rounded-xl bg-slate-50 p-3 dark:bg-zinc-800/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600 dark:text-zinc-300">
                      เงื่อนไขปลดล็อก:
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-zinc-100">
                      {remainingMinutes > 0
                        ? `Focus อีก ${remainingMinutes} นาทีเพื่อปลดล็อก`
                        : 'พร้อมปลดล็อกแล้ว!'}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
                    <span>
                      {currentMinutes} / {requiredMinutes} นาที
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-zinc-200">
                      {percent}% Complete
                    </span>
                  </div>

                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-200/80 dark:bg-zinc-700 overflow-hidden">
                    <div
                      className="h-full bg-slate-800 dark:bg-zinc-200 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Action button: Start focus in this category */}
                {onStartFocusCategory && (
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 dark:border-zinc-800">
                    <span className="text-xs text-slate-500 dark:text-zinc-400">
                      โหมด: {selectedLockedPlot.category}
                    </span>
                    <button
                      onClick={() => {
                        onStartFocusCategory(selectedLockedPlot.category);
                        setSelectedLockedPlot(null);
                      }}
                      className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-slate-800 active:scale-95 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                    >
                      <span>เริ่มโฟกัสโหมดนี้</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ================================================================= */}
      {/* PANEL 3: LOCKED DISTRICT PREVIEW PANEL                            */}
      {/* ================================================================= */}
      {selectedDistrict && (
        <div className="absolute bottom-3 left-3 right-3 z-30 mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {(() => {
            const dInfo = DISTRICT_INFO[selectedDistrict];
            const pInfo = districtProgress[selectedDistrict];
            const sampleBp =
              BUILDING_BLUEPRINTS.find((b) => b.district === selectedDistrict) ||
              BUILDING_BLUEPRINTS[0];

            return (
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {pInfo.unlocked ? (
                        getDistrictIcon(selectedDistrict, 'h-5 w-5')
                      ) : (
                        <Lock className="h-4 w-4 text-slate-600 dark:text-zinc-400" />
                      )}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                          {dInfo.name}
                        </h4>
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                            pInfo.unlocked
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}
                        >
                          {pInfo.unlocked ? 'Unlocked' : `${pInfo.percent}%`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        {dInfo.description}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedDistrict(null)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Architectural Preview of this District */}
                <div className="mt-3 flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-2 dark:border-zinc-800 dark:bg-zinc-850/50">
                  <svg viewBox="0 0 100 80" className="h-20 w-28">
                    <BlueprintPreviewModel
                      blueprint={sampleBp}
                      isoX={50}
                      isoY={45}
                      level={1}
                      isDarkMode={isDarkMode}
                      isPreview={!pInfo.unlocked}
                    />
                  </svg>
                </div>

                {/* Progress Details */}
                <div className="mt-3 rounded-xl bg-slate-50 p-3 dark:bg-zinc-800/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600 dark:text-zinc-300">
                      เงื่อนไขการเปิดพื้นที่:
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-zinc-100">
                      {pInfo.unlocked
                        ? 'ย่านเปิดใช้งานแล้ว'
                        : `สะสมสมาธิในย่านนี้อีก ${Math.max(0, pInfo.target - pInfo.minutes)} นาที`}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
                    <span>
                      {pInfo.minutes} / {pInfo.target} นาที
                    </span>
                    <span>{pInfo.percent}%</span>
                  </div>

                  <div className="mt-1 h-1.5 w-full rounded-full bg-slate-200/80 dark:bg-zinc-700 overflow-hidden">
                    <div
                      className="h-full bg-slate-800 dark:bg-zinc-200 rounded-full transition-all duration-500"
                      style={{ width: `${pInfo.percent}%` }}
                    />
                  </div>
                </div>

                {/* Action button: Start focus for this district */}
                {!pInfo.unlocked && onStartFocusCategory && (
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 dark:border-zinc-800">
                    <span className="text-xs text-slate-500 dark:text-zinc-400">
                      โฟกัสเพื่อขยายพื้นที่ย่านนี้
                    </span>
                    <button
                      onClick={() => {
                        const catMap: Record<DistrictType, ActivityType> = {
                          education: 'reading',
                          technology: 'project',
                          creative: 'creative',
                          business: 'work',
                          research: 'memory',
                          civic: 'quick',
                        };
                        onStartFocusCategory(catMap[selectedDistrict]);
                        setSelectedDistrict(null);
                      }}
                      className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-slate-800 active:scale-95 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                    >
                      <span>เริ่มโฟกัส</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: PLACE BUILDING ON EMPTY SLOT                               */}
      {/* ================================================================= */}
      {showBuildModal && selectedSlot && onPlaceBuilding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="max-h-[85vh] w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-800">
              <div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-zinc-100">
                  สร้างอาคารใหม่
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  พิกัด ({selectedSlot.x}, {selectedSlot.y}) · มี {coins} เหรียญ · {materials} วัสดุ
                </p>
              </div>
              <button
                onClick={() => {
                  setShowBuildModal(false);
                  setSelectedSlot(null);
                }}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 max-h-[60vh] space-y-2 overflow-y-auto pr-1">
              {BUILDING_BLUEPRINTS.map((bp) => {
                const canAfford = coins >= bp.costCoins && materials >= bp.costMaterials;
                return (
                  <div
                    key={bp.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 p-3 transition-colors hover:border-slate-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {getDistrictIcon(bp.district, 'h-4 w-4')}
                      </span>
                      <div>
                        <h5 className="text-xs font-medium text-slate-900 dark:text-zinc-100">
                          {bp.name}
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-1">
                          {bp.description}
                        </p>
                        <div className="mt-0.5 flex gap-2 text-[10px] font-mono text-slate-500 dark:text-zinc-400">
                          <span>{bp.costCoins} เหรียญ</span>
                          <span>·</span>
                          <span>{bp.costMaterials} วัสดุ</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onPlaceBuilding(bp.id, selectedSlot.x, selectedSlot.y);
                        setShowBuildModal(false);
                        setSelectedSlot(null);
                        sound.playCoinSound(soundEnabled);
                      }}
                      disabled={!canAfford}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        canAfford
                          ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-500'
                      }`}
                    >
                      สร้าง
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
