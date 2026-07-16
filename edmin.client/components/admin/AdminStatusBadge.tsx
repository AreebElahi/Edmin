interface AdminStatusBadgeProps {
  status: string;
  variant: 'success' | 'error' | 'warning' | 'primary' | 'default';
}

export default function AdminStatusBadge({ status, variant }: AdminStatusBadgeProps) {
  const variantStyles = {
    success: 'bg-background text-success-text',
    error: 'bg-error-bg text-error-text',
    warning: 'bg-warning-bg text-amber-800',
    primary: 'bg-indigo-100 text-primary',
    default: 'bg-surface-hover text-text-secondary'
  };

  return (
    <span className={`px-3 py-1 rounded-[2px] text-[10px] font-semibold uppercase tracking-widest ${variantStyles[variant]}`}>
      {status}
    </span>
  );
}
