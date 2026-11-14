import React from 'react';
import {
  Home,
  Wifi,
  Utensils,
  Car,
  Flame,
  Gamepad2,
  Footprints,
  Coffee,
  Bus,
  Wallet,
  Users,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Sparkles,
  Compass,
  Check,
  X,
  Bed,
  Tv,
  Bath,
  HelpCircle
} from 'lucide-react';

const ICON_MAP = {
  Home,
  Wifi,
  Utensils,
  Car,
  Flame,
  Gamepad2,
  Footprints,
  Coffee,
  Bus,
  Wallet,
  Users,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Sparkles,
  Compass,
  Check,
  X,
  Bed,
  Tv,
  Bath
};

export const InclusionIcon = ({ name, className = 'w-4 h-4', isExclude = false }) => {
  const IconComponent = ICON_MAP[name];
  if (IconComponent) {
    return <IconComponent className={className} />;
  }
  return isExclude ? <X className={className} /> : <Check className={className} />;
};

export const AVAILABLE_ICONS = [
  'Home',
  'Wifi',
  'Utensils',
  'Car',
  'Flame',
  'Gamepad2',
  'Footprints',
  'Coffee',
  'Bus',
  'Wallet',
  'Users',
  'CheckCircle2',
  'XCircle',
  'ShieldCheck',
  'Sparkles',
  'Compass',
  'Bed',
  'Tv'
];

