import React from 'react';
import {
  BookOpen,
  Brain,
  Briefcase,
  Laptop,
  Palette,
  Zap,
  Sparkles,
  SlidersHorizontal,
  Landmark,
  Building2,
  Flame,
  Coins,
  Layers,
  Clock,
  Target,
  CheckCircle2,
  Circle,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { ActivityType, DistrictType } from '../types';

export const getActivityIcon = (category: ActivityType, className = 'w-4 h-4') => {
  switch (category) {
    case 'reading':
      return <BookOpen className={className} />;
    case 'memory':
      return <Brain className={className} />;
    case 'work':
      return <Briefcase className={className} />;
    case 'project':
      return <Laptop className={className} />;
    case 'creative':
      return <Palette className={className} />;
    case 'quick':
      return <Zap className={className} />;
    case 'ai':
      return <Sparkles className={className} />;
    case 'custom':
      return <SlidersHorizontal className={className} />;
    default:
      return <Zap className={className} />;
  }
};

export const getDistrictIcon = (district: DistrictType, className = 'w-4 h-4') => {
  switch (district) {
    case 'education':
      return <BookOpen className={className} />;
    case 'research':
      return <Brain className={className} />;
    case 'business':
      return <Briefcase className={className} />;
    case 'technology':
      return <Laptop className={className} />;
    case 'creative':
      return <Palette className={className} />;
    case 'civic':
      return <Landmark className={className} />;
    default:
      return <Building2 className={className} />;
  }
};

export const getActivityLabel = (category: ActivityType): string => {
  switch (category) {
    case 'reading':
      return 'อ่านหนังสือ';
    case 'memory':
      return 'ทบทวน';
    case 'work':
      return 'ทำงาน';
    case 'project':
      return 'โปรเจกต์';
    case 'creative':
      return 'งานสร้างสรรค์';
    case 'quick':
      return 'Quick Focus';
    case 'ai':
      return 'AI Planner';
    case 'custom':
      return 'กำหนดเอง';
    default:
      return 'โฟกัส';
  }
};
