import { cn } from '../../lib/utils';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

interface StatusBadgeProps {
  status: 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED' | 'COMPLETED';
}

const config = {
  PENDING: { label: 'Pending', icon: Clock, className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  PROCESSING: { label: 'Processing', icon: Loader2, className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', spin: true },
  PROCESSED: { label: 'Processed', icon: CheckCircle, className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  COMPLETED: { label: 'Completed', icon: CheckCircle, className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  FAILED: { label: 'Failed', icon: XCircle, className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, icon: Icon, className, spin } = config[status] || config.PENDING;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', className)}>
      <Icon className={cn('w-3 h-3', spin && 'animate-spin')} />
      {label}
    </span>
  );
}
