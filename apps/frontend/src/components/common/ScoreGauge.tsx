import { cn, getScoreColor, getScoreLabel } from '../../lib/utils';

interface ScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
  animate?: boolean;
}

const sizes = {
  sm: { r: 28, svg: 70, stroke: 5, fontSize: 'text-sm font-semibold' },
  md: { r: 40, svg: 100, stroke: 7, fontSize: 'text-lg font-bold' },
  lg: { r: 54, svg: 130, stroke: 9, fontSize: 'text-2xl font-bold' },
};

export function ScoreGauge({ score, size = 'md', label, className, animate = true }: ScoreGaugeProps) {
  const { r, svg, stroke, fontSize } = sizes[size];
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const center = svg / 2;

  const strokeColor =
    score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div className="relative">
        <svg width={svg} height={svg} viewBox={`0 0 ${svg} ${svg}`}>
          {/* Background ring */}
          <circle
            cx={center}
            cy={center}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-muted/40"
          />
          {/* Score ring */}
          <circle
            cx={center}
            cy={center}
            r={r}
            fill="none"
            stroke={strokeColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn('score-ring', animate && 'transition-all duration-1000')}
            style={{ filter: `drop-shadow(0 0 4px ${strokeColor}40)` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(fontSize, getScoreColor(score))}>{score}</span>
        </div>
      </div>
      {label && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xs font-medium" style={{ color: strokeColor }}>
            {getScoreLabel(score)}
          </p>
        </div>
      )}
    </div>
  );
}
