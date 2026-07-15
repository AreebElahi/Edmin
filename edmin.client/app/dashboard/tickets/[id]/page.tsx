'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useTicket } from '@/features/tickets/hooks/useTicket';
import { TicketDetails } from '@/features/tickets/components/TicketDetails';
import { TicketMessages } from '@/features/tickets/components/TicketMessages';
import { AssignTicketModal } from '@/features/tickets/components/AssignTicketModal';
import { ResolveTicketModal } from '@/features/tickets/components/ResolveTicketModal';
import { Can } from '@/providers/RBACProvider';
import { useTicketStream } from '@/features/tickets/hooks/useTicketStream';
import { ArrowLeft } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { useCurrentProfile } from '@/features/profile/hooks/useProfile';

export default function TicketDetailPage() {
  useTicketStream(); // Mounts the SSE connection while this page is active
  const params = useParams();
  const router = useRouter();
  const ticketId = parseInt(params.id as string, 10);

  const { data: profile, isLoading: isProfileLoading } = useCurrentProfile();
  const { data: ticket, isLoading, error } = useTicket(ticketId);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);

  if (isLoading || isProfileLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-[2px] animate-spin"></div>
      </div>
    );
  }

  const userRole = profile?.role as UserRole || UserRole.STUDENT;
  const displayName = profile?.fullName || profile?.username || 'User';

  if (error || !ticket) {
    return (
      <ProtectedRoute>
        <DashboardLayout
          userRole={userRole}
          userName={displayName}
          notifications={[]}
          currentPath="/dashboard/tickets"
        >
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="bg-error-bg border-l-4 border-red-400 p-4">
              <p className="text-sm text-red-700">Ticket not found or access denied.</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout
        userRole={userRole}
        userName={displayName}
        notifications={[]}
        currentPath="/dashboard/tickets"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Navigation & Header */}
          <div className="mb-6">
            <button 
              onClick={() => router.back()}
              className="flex items-center text-sm font-medium text-text-secondary hover:text-text-primary mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Inbox
            </button>
            
            <div className="md:flex md:items-center md:justify-between">
              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-bold leading-7 text-text-primary sm:truncate sm:text-3xl sm:tracking-tight">
                  {ticket.subject}
                </h2>
                <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
                  <div className="mt-2 flex items-center text-sm text-text-secondary">
                    Ticket #{ticket.id}
                  </div>
                  <div className="mt-2 flex items-center text-sm text-text-secondary">
                    Status: <span className="font-semibold ml-1">{ticket.status}</span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons guarded by RBAC */}
              <div className="mt-4 flex md:ml-4 md:mt-0 gap-3">
                <Can I="UPDATE" a="TICKETS">
                  {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
                    <>
                      <button
                        onClick={() => setIsAssignModalOpen(true)}
                        className="inline-flex items-center rounded-[2px] bg-surface px-3 py-2 text-sm font-semibold text-text-primary  ring-1 ring-inset ring-gray-300 hover:bg-background"
                      >
                        Assign
                      </button>
                      <button
                        onClick={() => setIsResolveModalOpen(true)}
                        className="inline-flex items-center rounded-[2px] bg-success-text px-3 py-2 text-sm font-semibold text-white  hover:bg-success-bg0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#107C10]"
                      >
                        Resolve
                      </button>
                    </>
                  )}
                </Can>
              </div>
            </div>
          </div>

          {/* Content Layout */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Main Content Area (Messages) */}
            <div className="lg:col-span-2 space-y-6">
              <TicketMessages ticket={ticket} />
            </div>

            {/* Sidebar Area (Metadata) */}
            <div className="lg:col-span-1 space-y-6">
               <TicketDetails ticket={ticket} />
            </div>
          </div>

        </div>

        {/* Modals */}
        <AssignTicketModal 
          ticket={ticket} 
          isOpen={isAssignModalOpen} 
          onClose={() => setIsAssignModalOpen(false)} 
        />
        <ResolveTicketModal 
          ticket={ticket} 
          isOpen={isResolveModalOpen} 
          onClose={() => setIsResolveModalOpen(false)} 
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
