import { Baby, Moon, Coffee, Droplets, Bath, UtensilsCrossed } from 'lucide-react';
import type { LogType } from '../../types/database';

interface QuickActionsProps {
  onAction: (type: LogType) => void;
}

const actions = [
  { type: 'feeding' as LogType, icon: Baby, label: '授乳', color: 'from-pink-500 to-rose-500' },
  { type: 'sleep' as LogType, icon: Moon, label: '寝る', color: 'from-indigo-500 to-purple-500' },
  { type: 'diaper' as LogType, icon: Baby, label: 'おむつ', color: 'from-yellow-500 to-amber-500' },
  { type: 'poop' as LogType, icon: Coffee, label: 'うんち', color: 'from-amber-500 to-orange-500' },
  { type: 'pee' as LogType, icon: Droplets, label: 'しっこ', color: 'from-blue-500 to-cyan-500' },
  { type: 'bath' as LogType, icon: Bath, label: 'お風呂', color: 'from-cyan-500 to-teal-500' },
  { type: 'baby_food' as LogType, icon: UtensilsCrossed, label: '離乳食', color: 'from-orange-500 to-red-500' },
];

export const QuickActions = ({ onAction }: QuickActionsProps) => {
  return (
    <div className="grid grid-cols-3 gap-3">
      {actions.map(({ type, icon: Icon, label, color }) => (
        <button
          key={type}
          onClick={() => onAction(type)}
          className={`
            bg-gradient-to-br ${color}
            rounded-2xl shadow-lg p-4
            flex flex-col items-center justify-center gap-2
            transition-all duration-200
            hover:shadow-xl hover:scale-105
            active:scale-95
          `}
        >
          <Icon className="w-7 h-7 text-white" />
          <span className="text-sm font-bold text-white">{label}</span>
        </button>
      ))}
    </div>
  );
};
