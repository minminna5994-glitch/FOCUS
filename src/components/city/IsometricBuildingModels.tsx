import React from 'react';
import { PlacedBuilding, DistrictType, BuildingBlueprint } from '../../types';

interface BuildingRenderProps {
  building: PlacedBuilding;
  isoX: number;
  isoY: number;
  isDarkMode?: boolean;
  isPreview?: boolean;
}

interface BlueprintRenderProps {
  blueprint: BuildingBlueprint;
  isoX: number;
  isoY: number;
  level?: number;
  isDarkMode?: boolean;
  isPreview?: boolean;
  isMystery?: boolean;
}

/**
 * Standard 2:1 Isometric Projection Helper Constants
 */
const TILE_W = 76;
const TILE_H = 38;

/**
 * Helper to shade colors for isometric faces (top: brightest, right: medium, left: shadow)
 */
function getFaceColors(baseHex: string, isDark: boolean, isPreview: boolean) {
  if (isPreview) {
    return isDark
      ? {
          left: '#1e293b',
          right: '#334155',
          top: '#475569',
          accent: '#64748b',
          stroke: '#94a3b8',
          window: 'rgba(255,255,255,0.08)',
          glass: 'rgba(148,163,184,0.15)',
        }
      : {
          left: '#cbd5e1',
          right: '#e2e8f0',
          top: '#f1f5f9',
          accent: '#94a3b8',
          stroke: '#64748b',
          window: 'rgba(100,116,139,0.12)',
          glass: 'rgba(203,213,225,0.3)',
        };
  }

  // Palettes by district
  return {
    windowGlow: isDark ? '#fbbf24' : '#fef08a',
    windowGlass: isDark ? '#1e3a8a' : '#bae6fd',
    metalFin: isDark ? '#94a3b8' : '#64748b',
  };
}

/**
 * Modern Isometric Architectural Model Renderer
 */
export const IsometricBuildingModel: React.FC<BuildingRenderProps> = ({
  building,
  isoX,
  isoY,
  isDarkMode = false,
  isPreview = false,
}) => {
  const level = building.level || 1;
  const stage = building.buildStage || 'complete';
  const blueprintId = building.blueprintId;
  const district = building.district;

  // 1. Foundation Stage
  if (stage === 'foundation' && !isPreview) {
    return renderFoundationStage(isoX, isoY, isDarkMode);
  }

  // 2. Construction Stage
  if (stage === 'construction' && !isPreview) {
    return renderConstructionStage(isoX, isoY, isDarkMode);
  }

  // 3. Landmark Specific Architectural Models
  if (building.isLandmark || blueprintId.startsWith('lm-')) {
    return renderLandmarkModel(blueprintId, isoX, isoY, isDarkMode, isPreview);
  }

  // 4. District-Specific Architectural Models by Level
  switch (district) {
    case 'education':
      return renderEducationDistrictBuilding(blueprintId, level, isoX, isoY, isDarkMode, isPreview);
    case 'technology':
      return renderTechnologyDistrictBuilding(blueprintId, level, isoX, isoY, isDarkMode, isPreview);
    case 'creative':
      return renderCreativeDistrictBuilding(blueprintId, level, isoX, isoY, isDarkMode, isPreview);
    case 'business':
      return renderWorkDistrictBuilding(blueprintId, level, isoX, isoY, isDarkMode, isPreview);
    case 'research':
      return renderKnowledgeDistrictBuilding(blueprintId, level, isoX, isoY, isDarkMode, isPreview);
    case 'civic':
    default:
      return renderCivicBuilding(blueprintId, level, isoX, isoY, isDarkMode, isPreview);
  }
};

/**
 * Blueprint Preview Renderer (used for Locked Buildings, Next Level Preview, and Catalog)
 */
export const BlueprintPreviewModel: React.FC<BlueprintRenderProps> = ({
  blueprint,
  isoX,
  isoY,
  level = 1,
  isDarkMode = false,
  isPreview = true,
  isMystery = false,
}) => {
  if (isMystery) {
    return renderMysterySilhouette(isoX, isoY, isDarkMode);
  }

  const mockBuilding: PlacedBuilding = {
    id: 'preview-' + blueprint.id,
    blueprintId: blueprint.id,
    name: blueprint.name,
    district: blueprint.district,
    level,
    buildStage: 'complete',
    stageProgress: 100,
    focusMinutesSpent: 0,
    x: 0,
    y: 0,
    color: blueprint.baseColor,
    accentColor: blueprint.accentColor,
    icon: blueprint.icon,
    isLandmark: blueprint.isLandmark,
  };

  return (
    <IsometricBuildingModel
      building={mockBuilding}
      isoX={isoX}
      isoY={isoY}
      isDarkMode={isDarkMode}
      isPreview={isPreview}
    />
  );
};

/* =========================================================================
   STAGE 1 & 2: FOUNDATION & CONSTRUCTION
   ========================================================================= */

function renderFoundationStage(x: number, y: number, isDark: boolean) {
  const concreteColor = isDark ? '#334155' : '#cbd5e1';
  const excavationColor = isDark ? '#1e293b' : '#94a3b8';
  const tapeColor = '#f59e0b';

  return (
    <g>
      {/* Ground cut shadow */}
      <ellipse cx={x} cy={y + 3} rx={22} ry={11} fill="rgba(0,0,0,0.14)" />

      {/* Excavation pit */}
      <polygon
        points={`${x - 20},${y} ${x},${y + 10} ${x + 20},${y} ${x},${y - 10}`}
        fill={excavationColor}
      />

      {/* Concrete foundation slab */}
      <polygon
        points={`${x - 14},${y - 2} ${x},${y + 5} ${x + 14},${y - 2} ${x},${y - 9}`}
        fill={concreteColor}
        stroke={isDark ? '#475569' : '#94a3b8'}
        strokeWidth="1"
      />

      {/* Rebar rods */}
      <line x1={x - 8} y1={y + 1} x2={x - 8} y2={y - 8} stroke="#64748b" strokeWidth="1.5" />
      <line x1={x} y1={y + 4} x2={x} y2={y - 5} stroke="#64748b" strokeWidth="1.5" />
      <line x1={x + 8} y1={y + 1} x2={x + 8} y2={y - 8} stroke="#64748b" strokeWidth="1.5" />

      {/* Construction safety survey beacon */}
      <line x1={x - 12} y1={y - 1} x2={x - 12} y2={y - 12} stroke={tapeColor} strokeWidth="1.5" />
      <circle cx={x - 12} cy={y - 13} r="2" fill="#ef4444" />
    </g>
  );
}

function renderConstructionStage(x: number, y: number, isDark: boolean) {
  const steelFrame = isDark ? '#475569' : '#64748b';
  const yellowCrane = '#f59e0b';

  return (
    <g>
      <ellipse cx={x} cy={y + 4} rx={24} ry={12} fill="rgba(0,0,0,0.16)" />

      {/* Concrete podium */}
      <polygon
        points={`${x - 16},${y} ${x},${y + 8} ${x},${y - 6} ${x - 16},${y - 14}`}
        fill={isDark ? '#1e293b' : '#64748b'}
      />
      <polygon
        points={`${x},${y + 8} ${x + 16},${y} ${x + 16},${y - 14} ${x},${y - 6}`}
        fill={isDark ? '#334155' : '#94a3b8'}
      />
      <polygon
        points={`${x - 16},${y - 14} ${x},${y - 6} ${x + 16},${y - 14} ${x},${y - 22}`}
        fill={isDark ? '#475569' : '#cbd5e1'}
      />

      {/* Steel structural column grid */}
      <line x1={x - 10} y1={y - 11} x2={x - 10} y2={y - 28} stroke={steelFrame} strokeWidth="1.5" strokeDasharray="3,2" />
      <line x1={x} y1={y - 6} x2={x} y2={y - 24} stroke={steelFrame} strokeWidth="1.5" strokeDasharray="3,2" />
      <line x1={x + 10} y1={y - 11} x2={x + 10} y2={y - 28} stroke={steelFrame} strokeWidth="1.5" strokeDasharray="3,2" />

      {/* Modern tower crane */}
      <line x1={x + 4} y1={y - 8} x2={x + 4} y2={y - 42} stroke={yellowCrane} strokeWidth="2.5" />
      {/* Jib arm */}
      <line x1={x - 12} y1={y - 40} x2={x + 22} y2={y - 42} stroke={yellowCrane} strokeWidth="1.8" />
      {/* Counter-jib & ballast */}
      <rect x={x - 12} y={y - 42} width="4" height="4" fill="#334155" rx="0.5" />
      {/* Hoist cable and hook block */}
      <line x1={x + 16} y1={y - 42} x2={x + 16} y2={y - 24} stroke="#475569" strokeWidth="1" />
      <rect x={x + 14.5} y={y - 24} width="3" height="3" fill="#f59e0b" rx="0.5" />
    </g>
  );
}

/* =========================================================================
   EDUCATION DISTRICT: CONTEMPORARY UNIVERSITY & CITY LIBRARY
   - Clean limestone / warm sandstone, glazed reading atriums, louvers
   ========================================================================= */

function renderEducationDistrictBuilding(
  blueprintId: string,
  level: number,
  x: number,
  y: number,
  isDark: boolean,
  isPreview: boolean
) {
  const isAcademy = blueprintId === 'b-academy';
  const baseH = isAcademy ? 28 + level * 10 : 22 + level * 9;
  const w = 34 + (level >= 3 ? 6 : 0);
  const wH = w / 2;
  const dH = 18 / 2;

  // Colors
  const wallLeft = isPreview
    ? isDark ? '#1e293b' : '#cbd5e1'
    : isDark ? '#1e293b' : '#e2e8f0';
  const wallRight = isPreview
    ? isDark ? '#334155' : '#e2e8f0'
    : isDark ? '#283548' : '#f8fafc';
  const roofColor = isPreview
    ? isDark ? '#475569' : '#f1f5f9'
    : isDark ? '#1e3a8a' : '#dbeafe';
  const glassColor = isPreview
    ? 'rgba(148,163,184,0.15)'
    : isDark ? '#fbbf24' : '#93c5fd';
  const woodLouver = isDark ? '#b45309' : '#d97706';

  const strokeStyle = isPreview
    ? { stroke: isDark ? '#64748b' : '#94a3b8', strokeWidth: 1, strokeDasharray: '3,2' }
    : {};

  return (
    <g>
      {/* Soft Ground Shadow */}
      <ellipse cx={x} cy={y + 3} rx={wH + 3} ry={dH + 2} fill="rgba(0,0,0,0.15)" />

      {/* Main Base Volume */}
      {/* Left Wall (Shadow Side) */}
      <polygon
        points={`${x - wH},${y} ${x},${y + dH} ${x},${y + dH - baseH} ${x - wH},${y - baseH}`}
        fill={wallLeft}
        {...strokeStyle}
      />
      {/* Right Wall (Light Side) */}
      <polygon
        points={`${x},${y + dH} ${x + wH},${y} ${x + wH},${y - baseH} ${x},${y + dH - baseH}`}
        fill={wallRight}
        {...strokeStyle}
      />
      {/* Roof */}
      <polygon
        points={`${x - wH},${y - baseH} ${x},${y + dH - baseH} ${x + wH},${y - baseH} ${x},${y - dH - baseH}`}
        fill={roofColor}
        {...strokeStyle}
      />

      {/* Large Contemporary Glazed Reading Window on Right Wall */}
      <polygon
        points={`${x + 4},${y + dH - 5} ${x + wH - 4},${y - 1} ${x + wH - 4},${y - baseH + 6} ${x + 4},${y + dH - baseH + 2}`}
        fill={glassColor}
        opacity={isDark && !isPreview ? 0.95 : 0.65}
      />

      {/* Architectural Louvers / Mullions */}
      {!isPreview && (
        <>
          <line
            x1={x + 10}
            y1={y + dH - 4}
            x2={x + 10}
            y2={y + dH - baseH + 3}
            stroke={isDark ? '#0f172a' : '#ffffff'}
            strokeWidth="1"
            opacity="0.8"
          />
          <line
            x1={x + 16}
            y1={y + dH - 6}
            x2={x + 16}
            y2={y + dH - baseH + 1}
            stroke={isDark ? '#0f172a' : '#ffffff'}
            strokeWidth="1"
            opacity="0.8"
          />
        </>
      )}

      {/* Entrance Door on Left Facade */}
      <polygon
        points={`${x - 11},${y - 2} ${x - 4},${y + 2} ${x - 4},${y - 10} ${x - 11},${y - 14}`}
        fill={isDark ? '#0f172a' : '#334155'}
      />

      {/* Level 2+: Second Floor Cantilever & Reading Balcony */}
      {level >= 2 && (
        <g>
          {/* Timber / Louver Sunscreen Accent */}
          <polygon
            points={`${x - wH + 2},${y - baseH + 8} ${x - 2},${y + dH - baseH + 6} ${x - 2},${y + dH - baseH + 1} ${x - wH + 2},${y - baseH + 3}`}
            fill={woodLouver}
            opacity="0.85"
          />
          {/* Glass Balcony parapet */}
          <line
            x1={x}
            y1={y + dH - baseH}
            x2={x + wH}
            y2={y - baseH}
            stroke={isDark ? '#60a5fa' : '#3b82f6'}
            strokeWidth="1.5"
            opacity="0.7"
          />
        </g>
      )}

      {/* Level 3+: Rooftop Skylight Atrium & Study Terrace */}
      {level >= 3 && (
        <g>
          <polygon
            points={`${x - 8},${y - baseH - 2} ${x},${y + 2 - baseH} ${x + 8},${y - baseH - 2} ${x},${y - 6 - baseH}`}
            fill={isDark ? '#38bdf8' : '#60a5fa'}
            opacity={isDark ? 0.9 : 0.75}
          />
          {/* Rooftop garden greenery accent */}
          {!isPreview && (
            <circle cx={x - 9} cy={y - baseH - 3} r="2.2" fill={isDark ? '#166534' : '#22c55e'} />
          )}
        </g>
      )}

      {/* Level 4 / Max: Campus Spire / Flagship Skylight */}
      {level >= 4 && !isPreview && (
        <g>
          <line x1={x} y1={y - baseH - 6} x2={x} y2={y - baseH - 16} stroke="#3b82f6" strokeWidth="1.5" />
          <circle cx={x} cy={y - baseH - 17} r="1.5" fill="#60a5fa" />
        </g>
      )}
    </g>
  );
}

/* =========================================================================
   TECHNOLOGY DISTRICT: MODERN GEOMETRIC & STRUCTURAL EXPRESSIONISM
   - Clean angled glass curtain walls, solar pergolas, sleek cantilevers
   ========================================================================= */

function renderTechnologyDistrictBuilding(
  blueprintId: string,
  level: number,
  x: number,
  y: number,
  isDark: boolean,
  isPreview: boolean
) {
  const isDataTower = blueprintId === 'b-datacyber';
  const baseH = isDataTower ? 34 + level * 11 : 24 + level * 9;
  const w = 32;
  const wH = w / 2;
  const dH = 17 / 2;

  // Modern slate & cyan/sky glass palette
  const wallLeft = isPreview
    ? isDark ? '#1e293b' : '#cbd5e1'
    : isDark ? '#0f172a' : '#334155';
  const wallRight = isPreview
    ? isDark ? '#334155' : '#e2e8f0'
    : isDark ? '#1e293b' : '#475569';
  const glassCyan = isPreview
    ? 'rgba(148,163,184,0.15)'
    : isDark ? '#06b6d4' : '#67e8f9';
  const roofColor = isPreview
    ? isDark ? '#475569' : '#f1f5f9'
    : isDark ? '#0e7490' : '#cffafe';

  const strokeStyle = isPreview
    ? { stroke: isDark ? '#06b6d4' : '#0891b2', strokeWidth: 1, strokeDasharray: '3,2' }
    : {};

  return (
    <g>
      <ellipse cx={x} cy={y + 3} rx={wH + 3} ry={dH + 2} fill="rgba(0,0,0,0.16)" />

      {/* Main Angular Tech Volume */}
      <polygon
        points={`${x - wH},${y} ${x},${y + dH} ${x},${y + dH - baseH} ${x - wH},${y - baseH}`}
        fill={wallLeft}
        {...strokeStyle}
      />
      <polygon
        points={`${x},${y + dH} ${x + wH},${y} ${x + wH},${y - baseH} ${x},${y + dH - baseH}`}
        fill={wallRight}
        {...strokeStyle}
      />
      <polygon
        points={`${x - wH},${y - baseH} ${x},${y + dH - baseH} ${x + wH},${y - baseH} ${x},${y - dH - baseH}`}
        fill={roofColor}
        {...strokeStyle}
      />

      {/* Geometric Glass Curtain Ribbons */}
      <polygon
        points={`${x + 3},${y + dH - 6} ${x + wH - 3},${y - 1} ${x + wH - 3},${y - 10} ${x + 3},${y + dH - 15}`}
        fill={glassCyan}
        opacity={isDark && !isPreview ? 0.9 : 0.65}
      />
      {level >= 2 && (
        <polygon
          points={`${x + 3},${y + dH - 18} ${x + wH - 3},${y - 13} ${x + wH - 3},${y - 22} ${x + 3},${y + dH - 27}`}
          fill={glassCyan}
          opacity={isDark && !isPreview ? 0.9 : 0.65}
        />
      )}

      {/* Architectural Structural Bracing on Left Face */}
      {!isPreview && (
        <g opacity="0.6">
          <line
            x1={x - wH}
            y1={y}
            x2={x}
            y2={y + dH - baseH}
            stroke={isDark ? '#06b6d4' : '#38bdf8'}
            strokeWidth="0.9"
          />
          <line
            x1={x - wH}
            y1={y - baseH}
            x2={x}
            y2={y + dH}
            stroke={isDark ? '#06b6d4' : '#38bdf8'}
            strokeWidth="0.9"
          />
        </g>
      )}

      {/* Level 2+: Solar Pergola / Rooftop Glass Cantilever */}
      {level >= 2 && (
        <g>
          <polygon
            points={`${x - 8},${y - baseH - 4} ${x + 10},${y - baseH + 3} ${x + 14},${y - baseH - 1} ${x - 4},${y - baseH - 8}`}
            fill={isDark ? '#0891b2' : '#22d3ee'}
            opacity="0.8"
          />
        </g>
      )}

      {/* Level 3+: Communications Spire & Server Core Beacon */}
      {level >= 3 && (
        <g>
          <line
            x1={x}
            y1={y - baseH}
            x2={x}
            y2={y - baseH - 14}
            stroke={isDark ? '#38bdf8' : '#0284c7'}
            strokeWidth="1.8"
          />
          <circle cx={x} cy={y - baseH - 15} r="2" fill={isDark ? '#22d3ee' : '#06b6d4'} />
          {/* Subtle pulse ring in dark mode */}
          {isDark && !isPreview && (
            <circle cx={x} cy={y - baseH - 15} r="4" fill="none" stroke="#22d3ee" strokeWidth="0.8" opacity="0.5" />
          )}
        </g>
      )}

      {/* Level 4: Master Tier Satellite Dish array */}
      {level >= 4 && !isPreview && (
        <g transform={`translate(${x - 8}, ${y - baseH - 6})`}>
          <ellipse cx="0" cy="0" rx="3.5" ry="2" fill="#94a3b8" />
          <line x1="0" y1="0" x2="3" y2="-4" stroke="#64748b" strokeWidth="1" />
        </g>
      )}
    </g>
  );
}

/* =========================================================================
   CREATIVE DISTRICT: CONTEMPORARY ART GALLERY & DESIGN STUDIO
   - Sculptural cubic volumes, sawtooth skylights, cantilevered terraces
   ========================================================================= */

function renderCreativeDistrictBuilding(
  blueprintId: string,
  level: number,
  x: number,
  y: number,
  isDark: boolean,
  isPreview: boolean
) {
  const isGallery = blueprintId === 'b-gallery';
  const baseH = isGallery ? 26 + level * 9 : 20 + level * 8;
  const w = 34;
  const wH = w / 2;
  const dH = 18 / 2;

  // Terracotta / warm rose & concrete palette
  const wallLeft = isPreview
    ? isDark ? '#1e293b' : '#cbd5e1'
    : isDark ? '#3b0764' : '#db2777';
  const wallRight = isPreview
    ? isDark ? '#334155' : '#e2e8f0'
    : isDark ? '#581c87' : '#f472b6';
  const roofColor = isPreview
    ? isDark ? '#475569' : '#f1f5f9'
    : isDark ? '#701a75' : '#fbcfe8';

  const strokeStyle = isPreview
    ? { stroke: isDark ? '#ec4899' : '#f43f5e', strokeWidth: 1, strokeDasharray: '3,2' }
    : {};

  return (
    <g>
      <ellipse cx={x} cy={y + 3} rx={wH + 3} ry={dH + 2} fill="rgba(0,0,0,0.15)" />

      {/* Main Sculptural Cube Volume */}
      <polygon
        points={`${x - wH},${y} ${x},${y + dH} ${x},${y + dH - baseH} ${x - wH},${y - baseH}`}
        fill={wallLeft}
        {...strokeStyle}
      />
      <polygon
        points={`${x},${y + dH} ${x + wH},${y} ${x + wH},${y - baseH} ${x},${y + dH - baseH}`}
        fill={wallRight}
        {...strokeStyle}
      />
      <polygon
        points={`${x - wH},${y - baseH} ${x},${y + dH - baseH} ${x + wH},${y - baseH} ${x},${y - dH - baseH}`}
        fill={roofColor}
        {...strokeStyle}
      />

      {/* Corner Glass Display Window (Exhibition Cube) */}
      <polygon
        points={`${x - 4},${y + dH - 3} ${x + 10},${y + 4} ${x + 10},${y - baseH + 10} ${x - 4},${y + dH - baseH + 3}`}
        fill={isDark && !isPreview ? '#fde047' : '#ffffff'}
        opacity={isDark && !isPreview ? 0.9 : 0.75}
      />

      {/* Level 2+: Staggered Cantilevered Studio Wing */}
      {level >= 2 && (
        <g>
          {/* Overhanging studio box */}
          <polygon
            points={`${x - wH - 4},${y - baseH + 6} ${x - 4},${y + dH - baseH + 8} ${x - 4},${y + dH - baseH - 4} ${x - wH - 4},${y - baseH - 6}`}
            fill={isDark ? '#831843' : '#f43f5e'}
            opacity="0.9"
          />
          <polygon
            points={`${x - 4},${y + dH - baseH + 8} ${x + 8},${y - baseH + 2} ${x + 8},${y - baseH - 10} ${x - 4},${y + dH - baseH - 4}`}
            fill={isDark ? '#9d174d' : '#fb7185'}
            opacity="0.9"
          />
        </g>
      )}

      {/* Level 3+: Sawtooth Industrial Skylights (Artists North Light) */}
      {level >= 3 && (
        <g>
          {/* Sawtooth tooth 1 */}
          <polygon
            points={`${x - 6},${y - baseH - 2} ${x - 2},${y - baseH + 1} ${x - 2},${y - baseH - 6}`}
            fill={isDark ? '#fef08a' : '#ffffff'}
            opacity="0.85"
          />
          {/* Sawtooth tooth 2 */}
          <polygon
            points={`${x + 2},${y - baseH - 2} ${x + 6},${y - baseH + 1} ${x + 6},${y - baseH - 6}`}
            fill={isDark ? '#fef08a' : '#ffffff'}
            opacity="0.85"
          />
        </g>
      )}

      {/* Level 4+: Sculpture Plinth on Outdoor Plaza */}
      {level >= 4 && !isPreview && (
        <g transform={`translate(${x + 12}, ${y + 5})`}>
          <rect x="-2" y="-4" width="4" height="4" fill="#64748b" />
          <circle cx="0" cy="-6" r="2.5" fill="#f59e0b" />
        </g>
      )}
    </g>
  );
}

/* =========================================================================
   WORK DISTRICT: CONTEMPORARY MULTI-TIER COMMERCIAL & CO-WORK TOWER
   - Landscaped sky terraces, vertical fins, entrance double-height lobby
   ========================================================================= */

function renderWorkDistrictBuilding(
  blueprintId: string,
  level: number,
  x: number,
  y: number,
  isDark: boolean,
  isPreview: boolean
) {
  const isSkyscraper = blueprintId === 'b-skyscrapers';
  const baseH = isSkyscraper ? 32 + level * 12 : 24 + level * 9;
  const w = 32;
  const wH = w / 2;
  const dH = 17 / 2;

  // Sage / Emerald & sleek graphite
  const wallLeft = isPreview
    ? isDark ? '#1e293b' : '#cbd5e1'
    : isDark ? '#064e3b' : '#047857';
  const wallRight = isPreview
    ? isDark ? '#334155' : '#e2e8f0'
    : isDark ? '#065f46' : '#10b981';
  const roofColor = isPreview
    ? isDark ? '#475569' : '#f1f5f9'
    : isDark ? '#047857' : '#a7f3d0';

  const strokeStyle = isPreview
    ? { stroke: isDark ? '#10b981' : '#059669', strokeWidth: 1, strokeDasharray: '3,2' }
    : {};

  return (
    <g>
      <ellipse cx={x} cy={y + 3} rx={wH + 3} ry={dH + 2} fill="rgba(0,0,0,0.15)" />

      {/* Main Base Office Block */}
      <polygon
        points={`${x - wH},${y} ${x},${y + dH} ${x},${y + dH - baseH} ${x - wH},${y - baseH}`}
        fill={wallLeft}
        {...strokeStyle}
      />
      <polygon
        points={`${x},${y + dH} ${x + wH},${y} ${x + wH},${y - baseH} ${x},${y + dH - baseH}`}
        fill={wallRight}
        {...strokeStyle}
      />
      <polygon
        points={`${x - wH},${y - baseH} ${x},${y + dH - baseH} ${x + wH},${y - baseH} ${x},${y - dH - baseH}`}
        fill={roofColor}
        {...strokeStyle}
      />

      {/* Grid of Office Windows with Warm Lights */}
      <g opacity={isDark && !isPreview ? 0.95 : 0.7}>
        {/* Tier 1 windows */}
        <polygon
          points={`${x + 3},${y + dH - 6} ${x + 9},${y + 4} ${x + 9},${y - 1} ${x + 3},${y + dH - 11}`}
          fill={isDark ? '#fef08a' : '#d1fae5'}
        />
        <polygon
          points={`${x + 11},${y + 3} ${x + wH - 2},${y} ${x + wH - 2},${y - 5} ${x + 11},${y - 2}`}
          fill={isDark ? '#fde047' : '#d1fae5'}
        />
        {/* Tier 2 windows */}
        {baseH > 28 && (
          <>
            <polygon
              points={`${x + 3},${y + dH - 16} ${x + 9},${y - 6} ${x + 9},${y - 11} ${x + 3},${y + dH - 21}`}
              fill={isDark ? '#fef08a' : '#d1fae5'}
            />
            <polygon
              points={`${x + 11},${y - 7} ${x + wH - 2},${y - 10} ${x + wH - 2},${y - 15} ${x + 11},${y - 12}`}
              fill={isDark ? '#fde047' : '#d1fae5'}
            />
          </>
        )}
      </g>

      {/* Entrance Glass Atrium */}
      <polygon
        points={`${x - 12},${y - 1} ${x - 3},${y + 4} ${x - 3},${y - 8} ${x - 12},${y - 13}`}
        fill={isDark && !isPreview ? '#6ee7b7' : '#34d399'}
        opacity="0.8"
      />

      {/* Level 2+: Landscaped Rooftop Terrace */}
      {level >= 2 && (
        <g>
          {/* Planter boxes and trees */}
          <polygon
            points={`${x - 8},${y - baseH} ${x},${y + 4 - baseH} ${x + 8},${y - baseH} ${x},${y - 4 - baseH}`}
            fill={isDark ? '#064e3b' : '#34d399'}
          />
          {!isPreview && (
            <>
              <circle cx={x - 4} cy={y - baseH - 2} r="2" fill="#22c55e" />
              <circle cx={x + 3} cy={y - baseH} r="2.2" fill="#16a34a" />
            </>
          )}
        </g>
      )}

      {/* Level 3+: Upper Stepped Executive Penthouse */}
      {level >= 3 && (
        <g>
          <polygon
            points={`${x - 8},${y - baseH - 2} ${x},${y + 2 - baseH} ${x},${y - 8 - baseH} ${x - 8},${y - 12 - baseH}`}
            fill={isDark ? '#047857' : '#059669'}
          />
          <polygon
            points={`${x},${y + 2 - baseH} ${x + 8},${y - baseH - 2} ${x + 8},${y - 12 - baseH} ${x},${y - 8 - baseH}`}
            fill={isDark ? '#059669' : '#10b981'}
          />
          <polygon
            points={`${x - 8},${y - 12 - baseH} ${x},${y - 8 - baseH} ${x + 8},${y - 12 - baseH} ${x},${y - 16 - baseH}`}
            fill={isDark ? '#10b981' : '#6ee7b7'}
          />
        </g>
      )}

      {/* Level 4+: Corporate Crown Heli-pad / Architectural Louvers */}
      {level >= 4 && !isPreview && (
        <g transform={`translate(${x}, ${y - baseH - 16})`}>
          <ellipse cx="0" cy="0" rx="7" ry="3.5" fill="#334155" stroke="#f59e0b" strokeWidth="0.8" />
          <text x="0" y="2" textAnchor="middle" fill="#f59e0b" fontSize="4" fontWeight="bold">H</text>
        </g>
      )}
    </g>
  );
}

/* =========================================================================
   KNOWLEDGE DISTRICT: RESEARCH CENTER & MEMORY ARCHIVE
   - Contemplative research pavilions, anodized purple/bronze, dome skylight
   ========================================================================= */

function renderKnowledgeDistrictBuilding(
  blueprintId: string,
  level: number,
  x: number,
  y: number,
  isDark: boolean,
  isPreview: boolean
) {
  const isArchive = blueprintId === 'b-archive';
  const baseH = isArchive ? 28 + level * 10 : 22 + level * 9;
  const w = 34;
  const wH = w / 2;
  const dH = 18 / 2;

  // Deep indigo / purple slate palette
  const wallLeft = isPreview
    ? isDark ? '#1e293b' : '#cbd5e1'
    : isDark ? '#31104b' : '#6d28d9';
  const wallRight = isPreview
    ? isDark ? '#334155' : '#e2e8f0'
    : isDark ? '#4c1d95' : '#8b5cf6';
  const roofColor = isPreview
    ? isDark ? '#475569' : '#f1f5f9'
    : isDark ? '#5b21b6' : '#c4b5fd';

  const strokeStyle = isPreview
    ? { stroke: isDark ? '#a78bfa' : '#7c3aed', strokeWidth: 1, strokeDasharray: '3,2' }
    : {};

  return (
    <g>
      <ellipse cx={x} cy={y + 3} rx={wH + 3} ry={dH + 2} fill="rgba(0,0,0,0.15)" />

      {/* Main Base Volume */}
      <polygon
        points={`${x - wH},${y} ${x},${y + dH} ${x},${y + dH - baseH} ${x - wH},${y - baseH}`}
        fill={wallLeft}
        {...strokeStyle}
      />
      <polygon
        points={`${x},${y + dH} ${x + wH},${y} ${x + wH},${y - baseH} ${x},${y + dH - baseH}`}
        fill={wallRight}
        {...strokeStyle}
      />
      <polygon
        points={`${x - wH},${y - baseH} ${x},${y + dH - baseH} ${x + wH},${y - baseH} ${x},${y - dH - baseH}`}
        fill={roofColor}
        {...strokeStyle}
      />

      {/* Research Pod Skylight / Clean Hemisphere Dome */}
      <ellipse
        cx={x}
        cy={y - baseH - 2}
        rx={9}
        ry={6}
        fill={isDark ? '#c084fc' : '#a855f7'}
        opacity={isDark && !isPreview ? 0.95 : 0.8}
      />
      <ellipse
        cx={x}
        cy={y - baseH - 4}
        rx={4}
        ry={2.5}
        fill={isDark ? '#f3e8ff' : '#ffffff'}
        opacity="0.6"
      />

      {/* Horizontal Ribbon Data Windows */}
      <polygon
        points={`${x + 4},${y + dH - 6} ${x + wH - 4},${y - 2} ${x + wH - 4},${y - 8} ${x + 4},${y + dH - 12}`}
        fill={isDark && !isPreview ? '#e9d5ff' : '#ffffff'}
        opacity="0.8"
      />

      {/* Level 2+: Elevated Glass Skybridge Wing */}
      {level >= 2 && (
        <g>
          <polygon
            points={`${x - wH - 4},${y - baseH + 6} ${x - wH + 4},${y - baseH + 10} ${x - wH + 4},${y - baseH} ${x - wH - 4},${y - baseH - 4}`}
            fill={isDark ? '#4c1d95' : '#7c3aed'}
          />
        </g>
      )}

      {/* Level 3+: Astronomical Mini-Dome / Laser Observation Post */}
      {level >= 3 && (
        <g>
          <circle cx={x + 8} cy={y - baseH - 4} r="3" fill="#a855f7" />
          <line
            x1={x + 8}
            y1={y - baseH - 4}
            x2={x + 14}
            y2={y - baseH - 10}
            stroke="#e9d5ff"
            strokeWidth="1.5"
          />
        </g>
      )}

      {/* Level 4+: Beacon of Wisdom Spire */}
      {level >= 4 && !isPreview && (
        <g>
          <line x1={x} y1={y - baseH - 8} x2={x} y2={y - baseH - 20} stroke="#a855f7" strokeWidth="1.5" />
          <circle cx={x} cy={y - baseH - 21} r="2" fill="#c084fc" />
        </g>
      )}
    </g>
  );
}

/* =========================================================================
   CIVIC / CENTRAL GREEN (PARK)
   - Modern reflecting pool, zen stepping stones, wooden deck, pergola
   ========================================================================= */

function renderCivicBuilding(
  blueprintId: string,
  level: number,
  x: number,
  y: number,
  isDark: boolean,
  isPreview: boolean
) {
  const w = 34;
  const wH = w / 2;
  const dH = 18 / 2;

  return (
    <g>
      <ellipse cx={x} cy={y + 3} rx={wH + 3} ry={dH + 2} fill="rgba(0,0,0,0.12)" />

      {/* Park stone terrace base */}
      <polygon
        points={`${x - wH},${y} ${x},${y + dH} ${x + wH},${y} ${x},${y - dH}`}
        fill={isDark ? '#14532d' : '#86efac'}
        stroke={isDark ? '#166534' : '#bbf7d0'}
        strokeWidth="1"
      />

      {/* Reflecting Pool (Water Feature) */}
      <polygon
        points={`${x - 8},${y} ${x},${y + 4} ${x + 8},${y} ${x},${y - 4}`}
        fill={isDark ? '#0284c7' : '#38bdf8'}
        opacity="0.85"
      />
      {/* Gentle water shimmer */}
      <line
        x1={x - 4}
        y1={y}
        x2={x + 4}
        y2={y}
        stroke="#ffffff"
        strokeWidth="0.8"
        opacity="0.6"
      />

      {/* Modern timber deck & pergola */}
      <polygon
        points={`${x - 14},${y - 2} ${x - 6},${y + 2} ${x - 6},${y - 2} ${x - 14},${y - 6}`}
        fill={isDark ? '#78350f' : '#d97706'}
      />

      {/* Cozy Stylized Trees */}
      <circle cx={x + 10} cy={y - 3} r="4" fill={isDark ? '#166534' : '#22c55e'} />
      <circle cx={x + 10} cy={y - 5} r="3" fill={isDark ? '#15803d' : '#4ade80'} />
      <circle cx={x - 11} cy={y + 1} r="3.5" fill={isDark ? '#14532d' : '#16a34a'} />

      {/* Level 2+: Central sculpture / modern fountain jet */}
      {level >= 2 && (
        <circle cx={x} cy={y} r="1.5" fill="#f8fafc" />
      )}
    </g>
  );
}

/* =========================================================================
   LANDMARKS: ICONIC ARCHITECTURAL STATURES
   - Clock Tower, Grand University, Central Station, Observatory, Innovation Tower
   ========================================================================= */

function renderLandmarkModel(
  blueprintId: string,
  x: number,
  y: number,
  isDark: boolean,
  isPreview: boolean
) {
  const strokeStyle = isPreview
    ? { stroke: isDark ? '#cbd5e1' : '#64748b', strokeWidth: 1, strokeDasharray: '3,2' }
    : {};

  // 1. Clock Tower (lm-clocktower)
  if (blueprintId === 'lm-clocktower') {
    const h = 58;
    return (
      <g>
        <ellipse cx={x} cy={y + 3} rx={18} ry={9} fill="rgba(0,0,0,0.18)" />

        {/* Stone Tower Shaft */}
        <polygon
          points={`${x - 12},${y} ${x},${y + 6} ${x},${y + 6 - h} ${x - 12},${y - h}`}
          fill={isPreview ? (isDark ? '#1e293b' : '#cbd5e1') : (isDark ? '#78350f' : '#b45309')}
          {...strokeStyle}
        />
        <polygon
          points={`${x},${y + 6} ${x + 12},${y} ${x + 12},${y - h} ${x},${y + 6 - h}`}
          fill={isPreview ? (isDark ? '#334155' : '#e2e8f0') : (isDark ? '#92400e' : '#d97706')}
          {...strokeStyle}
        />

        {/* Clock Dial with warm illumination */}
        <circle
          cx={x + 5}
          cy={y - h + 18}
          r={4}
          fill={isDark && !isPreview ? '#fef08a' : '#fef3c7'}
          stroke="#78350f"
          strokeWidth="0.8"
        />
        <line x1={x + 5} y1={y - h + 18} x2={x + 5} y2={y - h + 16} stroke="#78350f" strokeWidth="0.8" />
        <line x1={x + 5} y1={y - h + 18} x2={x + 7} y2={y - h + 18} stroke="#78350f" strokeWidth="0.8" />

        {/* Pyramidal Spire */}
        <polygon
          points={`${x - 12},${y - h} ${x},${y + 6 - h} ${x},${y - h - 22}`}
          fill={isPreview ? (isDark ? '#475569' : '#f1f5f9') : (isDark ? '#713f12' : '#92400e')}
          {...strokeStyle}
        />
        <polygon
          points={`${x},${y + 6 - h} ${x + 12},${y - h} ${x},${y - h - 22}`}
          fill={isPreview ? (isDark ? '#64748b' : '#e2e8f0') : (isDark ? '#a16207' : '#f59e0b')}
          {...strokeStyle}
        />
        {/* Golden Finial */}
        <circle cx={x} cy={y - h - 23} r="1.8" fill="#fde047" />
      </g>
    );
  }

  // 2. Grand University (lm-university)
  if (blueprintId === 'lm-university') {
    return (
      <g>
        <ellipse cx={x} cy={y + 4} rx={26} ry={13} fill="rgba(0,0,0,0.2)" />

        {/* Left Wing */}
        <polygon
          points={`${x - 22},${y} ${x},${y + 9} ${x},${y - 28} ${x - 22},${y - 37}`}
          fill={isPreview ? (isDark ? '#1e293b' : '#cbd5e1') : (isDark ? '#1e1b4b' : '#312e81')}
          {...strokeStyle}
        />
        {/* Right Wing */}
        <polygon
          points={`${x},${y + 9} ${x + 22},${y} ${x + 22},${y - 37} ${x},${y - 28}`}
          fill={isPreview ? (isDark ? '#334155' : '#e2e8f0') : (isDark ? '#312e81' : '#4338ca')}
          {...strokeStyle}
        />

        {/* Neoclassical Colonnade Pillars */}
        <line x1={x - 9} y1={y + 4} x2={x - 9} y2={y - 18} stroke="#c7d2fe" strokeWidth="2" />
        <line x1={x} y1={y + 8} x2={x} y2={y - 14} stroke="#c7d2fe" strokeWidth="2" />
        <line x1={x + 9} y1={y + 4} x2={x + 9} y2={y - 18} stroke="#c7d2fe" strokeWidth="2" />

        {/* Grand Glass University Dome */}
        <ellipse
          cx={x}
          cy={y - 32}
          rx={12}
          ry={8}
          fill={isPreview ? (isDark ? '#475569' : '#f1f5f9') : (isDark ? '#4f46e5' : '#6366f1')}
        />
        <ellipse
          cx={x}
          cy={y - 35}
          rx={7}
          ry={4.5}
          fill={isDark && !isPreview ? '#a5b4fc' : '#c7d2fe'}
          opacity="0.8"
        />
      </g>
    );
  }

  // 3. Grand Central Station (lm-centralstation)
  if (blueprintId === 'lm-centralstation') {
    return (
      <g>
        <ellipse cx={x} cy={y + 4} rx={24} ry={12} fill="rgba(0,0,0,0.2)" />

        {/* Main Concourse Body */}
        <polygon
          points={`${x - 20},${y} ${x},${y + 9} ${x},${y - 24} ${x - 20},${y - 33}`}
          fill={isPreview ? (isDark ? '#1e293b' : '#cbd5e1') : (isDark ? '#78350f' : '#b45309')}
          {...strokeStyle}
        />
        <polygon
          points={`${x},${y + 9} ${x + 20},${y} ${x + 20},${y - 33} ${x},${y - 24}`}
          fill={isPreview ? (isDark ? '#334155' : '#e2e8f0') : (isDark ? '#92400e' : '#f59e0b')}
          {...strokeStyle}
        />

        {/* Grand Barrel-Vaulted Glass Arch */}
        <path
          d={`M ${x - 17} ${y - 30} Q ${x} ${y - 45} ${x + 17} ${y - 30}`}
          stroke={isDark && !isPreview ? '#fde047' : '#fef08a'}
          strokeWidth="3.5"
          fill="none"
        />
        <circle cx={x} cy={y - 20} r="3.5" fill="#fef3c7" stroke="#78350f" strokeWidth="1" />
      </g>
    );
  }

  // 4. Observatory (lm-observatory)
  if (blueprintId === 'lm-observatory') {
    return (
      <g>
        <ellipse cx={x} cy={y + 3} rx={22} ry={11} fill="rgba(0,0,0,0.18)" />

        {/* Stepped Granite Podium */}
        <polygon
          points={`${x - 16},${y} ${x},${y + 8} ${x},${y - 22} ${x - 16},${y - 30}`}
          fill={isPreview ? (isDark ? '#1e293b' : '#cbd5e1') : (isDark ? '#3b0764' : '#581c87')}
          {...strokeStyle}
        />
        <polygon
          points={`${x},${y + 8} ${x + 16},${y} ${x + 16},${y - 30} ${x},${y - 22}`}
          fill={isPreview ? (isDark ? '#334155' : '#e2e8f0') : (isDark ? '#581c87' : '#7e22ce')}
          {...strokeStyle}
        />

        {/* Rotating Hemispherical Observatory Dome */}
        <ellipse
          cx={x}
          cy={y - 26}
          rx={13}
          ry={10}
          fill={isPreview ? (isDark ? '#475569' : '#f1f5f9') : (isDark ? '#6b21a8' : '#9333ea')}
        />
        {/* Slit opening and brass telescope pointing toward stars */}
        <line
          x1={x - 2}
          y1={y - 28}
          x2={x + 12}
          y2={y - 42}
          stroke={isDark && !isPreview ? '#fde047' : '#fbbf24'}
          strokeWidth="3"
        />
      </g>
    );
  }

  // 5. Innovation Tower (lm-innovationtower)
  if (blueprintId === 'lm-innovationtower') {
    const th = 72;
    return (
      <g>
        <ellipse cx={x} cy={y + 3} rx={18} ry={9} fill="rgba(0,0,0,0.2)" />

        {/* Twisting Crystalline Glass Facade */}
        <polygon
          points={`${x - 12},${y} ${x},${y + 6} ${x + 3},${y - th} ${x - 10},${y - th - 5}`}
          fill={isPreview ? (isDark ? '#1e293b' : '#cbd5e1') : (isDark ? '#0c4a6e' : '#0284c7')}
          {...strokeStyle}
        />
        <polygon
          points={`${x},${y + 6} ${x + 12},${y} ${x + 10},${y - th - 5} ${x + 3},${y - th}`}
          fill={isPreview ? (isDark ? '#334155' : '#e2e8f0') : (isDark ? '#0284c7' : '#38bdf8')}
          {...strokeStyle}
        />

        {/* Diagonal Crystal Facet Lines */}
        {!isPreview && (
          <line
            x1={x - 12}
            y1={y}
            x2={x + 10}
            y2={y - th - 5}
            stroke="#ffffff"
            strokeWidth="0.8"
            opacity="0.5"
          />
        )}

        {/* Illuminated Spire & Beacon */}
        <line
          x1={x}
          y1={y - th - 4}
          x2={x}
          y2={y - th - 20}
          stroke={isDark && !isPreview ? '#38bdf8' : '#0284c7'}
          strokeWidth="1.8"
        />
        <circle cx={x} cy={y - th - 21} r="2" fill={isDark && !isPreview ? '#22d3ee' : '#38bdf8'} />
      </g>
    );
  }

  return null;
}

/* =========================================================================
   MYSTERY LANDMARK SILHOUETTE (DISCOVERY)
   ========================================================================= */

function renderMysterySilhouette(x: number, y: number, isDark: boolean) {
  const fillColor = isDark ? '#1e293b' : '#e2e8f0';
  const strokeColor = isDark ? '#475569' : '#94a3b8';

  return (
    <g opacity="0.75">
      <ellipse cx={x} cy={y + 3} rx={18} ry={9} fill="rgba(0,0,0,0.12)" />

      {/* Enigmatic Stepped Monolith Silhouette */}
      <polygon
        points={`${x - 14},${y} ${x},${y + 7} ${x},${y - 36} ${x - 14},${y - 43}`}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="1"
        strokeDasharray="3,2"
      />
      <polygon
        points={`${x},${y + 7} ${x + 14},${y} ${x + 14},${y - 43} ${x},${y - 36}`}
        fill={isDark ? '#334155' : '#f1f5f9'}
        stroke={strokeColor}
        strokeWidth="1"
        strokeDasharray="3,2"
      />

      {/* Subtle "?" or Discovery Sparkle at the apex */}
      <circle cx={x} cy={y - 48} r="2.5" fill={isDark ? '#fbbf24' : '#f59e0b'} opacity="0.8" />
    </g>
  );
}
