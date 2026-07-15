'use client';

import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertTriangle, User, MessageSquare, Calendar } from 'lucide-react';

export interface TimelineStep {
  label: string;
  actor: string;
  status: 'pending' | 'current' | 'completed' | 'rejected' | 'escalated';
  date?: string;
  comment?: string;
}

interface WorkflowTimelineProps {
  steps: TimelineStep[];
  title?: string;
}

export default function WorkflowTimeline({ steps, title = 'Approval Lifecycle History' }: WorkflowTimelineProps) {
  const getIcon = (status: TimelineStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-success-text" strokeWidth={1.5} />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-error-text" strokeWidth={1.5} />;
      case 'escalated':
        return <AlertTriangle className="w-4 h-4 text-warning-text" strokeWidth={1.5} />;
      case 'current':
        return <Clock className="w-4 h-4 text-primary" strokeWidth={1.5} />;
      default:
        return <div className="w-2 h-2 bg-text-muted" />;
    }
  };

  const getStepStyle = (status: TimelineStep['status']) => {
    switch (status) {
      case 'completed':
        return { border: 'border-success-text', bg: 'bg-success-bg', text: 'text-success-text', dot: 'bg-success-text' };
      case 'rejected':
        return { border: 'border-error-text', bg: 'bg-error-bg', text: 'text-error-text', dot: 'bg-error-text' };
      case 'escalated':
        return { border: 'border-warning-text', bg: 'bg-warning-bg', text: 'text-warning-text', dot: 'bg-warning-text' };
      case 'current':
        return { border: 'border-primary', bg: 'bg-primary-light', text: 'text-primary', dot: 'bg-primary' };
      default:
        return { border: 'border-border', bg: 'bg-surface-hover', text: 'text-text-muted', dot: 'bg-[#C8C6C4]' };
    }
  };

  return (
    <div className="bg-surface border border-border">
      {/* Header */}
      <div className="px-5 py-3 border-b border-border bg-surface-hover flex items-center gap-2">
        <Clock className="w-4 h-4 text-primary" strokeWidth={1.5} />
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      </div>

      <div className="p-5">
        <div className="relative pl-5 border-l-2 border-border ml-2 space-y-4">
          {steps.map((step, idx) => {
            const style = getStepStyle(step.status);
            return (
              <div key={idx} className="relative">
                {/* Timeline Dot */}
                <div
                  className={`absolute -left-[22px] top-2 w-5 h-5 border-2 ${style.border} ${style.bg} flex items-center justify-center bg-surface`}
                >
                  {getIcon(step.status)}
                </div>

                {/* Step Card */}
                <div className={`border ${style.border} ${style.bg} p-3`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className={`font-semibold text-xs ${style.text} leading-tight`}>
                        {step.label}
                      </h4>
                      <div className="flex items-center gap-1 text-[10px] text-text-secondary mt-0.5">
                        <User className="w-3 h-3" strokeWidth={1.5} />
                        <span>{step.actor}</span>
                      </div>
                    </div>

                    {step.date && (
                      <div className="flex items-center gap-1 text-[10px] text-text-muted font-medium">
                        <Calendar className="w-3 h-3" strokeWidth={1.5} />
                        <span>{step.date}</span>
                      </div>
                    )}
                  </div>

                  {step.comment && (
                    <div className="mt-2 p-2 bg-surface border border-border text-[11px] text-text-secondary italic flex gap-2 items-start">
                      <MessageSquare className="w-3 h-3 text-text-muted shrink-0 mt-0.5" strokeWidth={1.5} />
                      <span>&ldquo;{step.comment}&rdquo;</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
