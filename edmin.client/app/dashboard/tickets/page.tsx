'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useInfiniteTickets } from '@/features/tickets/hooks/useInfiniteTickets';
import { TicketTable } from '@/features/tickets/components/TicketTable';
import { CreateTicketModal } from '@/features/tickets/components/CreateTicketModal';
import { Can } from '@/providers/RBACProvider';
import { useTicketStream } from '@/features/tickets/hooks/useTicketStream';
import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { useCurrentProfile } from '@/features/profile/hooks/useProfile';

export default function TicketInboxPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  useTicketStream(); // Mounts the SSE connection while this page is active
  
  const { data: profile, isLoading: isProfileLoading } = useCurrentProfile();
  
  const { 
    data, 
    error, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    status 
  } = useInfiniteTickets({ limit: 20, status: 'OPEN' });

  // Flatten the pages array into a single array of tickets
  const tickets = data?.pages.flatMap((page) => page.tickets) || [];

  if (isProfileLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-[2px] animate-spin"></div>
      </div>
    );
  }

  const userRole = profile?.role as UserRole || UserRole.STUDENT;
  const displayName = profile?.fullName || profile?.username || 'User';

  return (
    <ProtectedRoute>
      <DashboardLayout
        userRole={userRole}
        userName={displayName}
        notifications={[]}
        currentPath="/dashboard/tickets"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Header Section */}
          <div className="sm:flex sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold leading-7 text-text-primary sm:truncate sm:text-3xl sm:">
                Ticket Inbox
              </h1>
              <p className="mt-2 text-sm text-text-secondary">
                Manage and resolve outstanding system tickets and escalations.
              </p>
            </div>
            
            <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
              <Can I="CREATE" a="TICKETS">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="block rounded-[2px] bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-none hover:bg-primary-light0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  New Ticket
                </button>
              </Can>
            </div>
          </div>

          {/* Content Section */}
          {status === 'pending' ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-[2px] h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : status === 'error' ? (
            <div className="bg-error-bg border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    Error loading tickets: {error?.message}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <TicketTable tickets={tickets} />
              
              {/* Infinite Scroll / Load More Trigger */}
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={!hasNextPage || isFetchingNextPage}
                  className="rounded-[2px] bg-surface px-3.5 py-2.5 text-sm font-semibold text-text-primary shadow-none ring-1 ring-inset ring-gray-300 hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isFetchingNextPage
                    ? 'Loading more...'
                    : hasNextPage
                    ? 'Load More'
                    : 'No more tickets'}
                </button>
              </div>
            </div>
          )}

          <CreateTicketModal 
            isOpen={isCreateModalOpen} 
            onClose={() => setIsCreateModalOpen(false)} 
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
