import { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface AdminPageHeaderProps {
  icon: React.ElementType;
  title: string;
  titleAccent?: string;
  subtitle?: string;
  eyebrow?: {
    icon: React.ElementType;
    label: string;
  };
  backHref?: string;
  actions?: ReactNode;
}

export default function AdminPageHeader({
  icon: Icon,
  title,
  titleAccent,
  subtitle,
  eyebrow,
  backHref,
  actions
}: AdminPageHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-[2px] bg-primary p-6 sm:p-8 text-white shadow-none mb-8">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          {backHref && (
             <div className="mb-4">
                 <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors">
                     <ArrowLeft className="w-4 h-4" /> Back
                 </Link>
             </div>
          )}
          {eyebrow && (
             <div className="flex items-center gap-1.5 mb-3">
               <span className="text-xs font-bold text-primary-light uppercase tracking-widest">{eyebrow.label}</span>
             </div>
          )}
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-semibold leading-tight">
              {title} {titleAccent && <span className="text-blue-300">{titleAccent}</span>}
            </h1>
          </div>
          {subtitle && (
            <p className="text-xs sm:text-base text-slate-300/80 max-w-xl">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
