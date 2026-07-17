interface AdminActionIconButtonProps {
  icon: React.ElementType;
  onClick: (e: React.MouseEvent) => void;
  variant: 'success' | 'error' | 'warning' | 'primary' | 'default';
  disabled?: boolean;
  title?: string;
}

export default function AdminActionIconButton({
  icon: Icon,
  onClick,
  variant,
  disabled,
  title
}: AdminActionIconButtonProps) {
  const variantStyles = {
    success: 'text-success-text border-emerald-200 hover:bg-background',
    error: 'text-error-text border-error-bg hover:bg-error-bg',
    warning: 'text-amber-600 border-amber-200 hover:bg-amber-50',
    primary: 'text-primary border-indigo-200 hover:bg-primary-light',
    default: 'text-text-secondary border-border hover:bg-surface-hover hover:text-text-primary'
  };

  const actualVariant = variantStyles[variant] || variantStyles.default;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-[2px] border transition-colors ${actualVariant} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}
