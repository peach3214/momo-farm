import { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

interface QuickActionButtonProps {
  icon: LucideIcon;
  label: string;
  color: string;
  onClick: () => void;
}

export const QuickActionButton = ({
  icon: Icon,
  label,
  color,
  onClick,
}: QuickActionButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center gap-2',
        'min-h-[80px] rounded-2xl p-4',
        'transition-all duration-200',
        'active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        color
      )}
    >
      <Icon className="w-8 h-8" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
};
