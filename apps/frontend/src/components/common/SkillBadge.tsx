import { cn } from '../../lib/utils';

interface SkillBadgeProps {
  skill: string;
  variant?: 'matched' | 'missing' | 'neutral';
  size?: 'sm' | 'md';
}

const variants = {
  matched: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
  missing: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
  neutral: 'bg-secondary text-secondary-foreground border-border',
};

export function SkillBadge({ skill, variant = 'neutral', size = 'md' }: SkillBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center border rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        variants[variant]
      )}
    >
      {variant === 'matched' && <span className="mr-1">✓</span>}
      {variant === 'missing' && <span className="mr-1">✗</span>}
      {skill}
    </span>
  );
}
