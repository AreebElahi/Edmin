import React, { useState, useEffect } from 'react';
import { Ticket } from '../types';
import { useAssignTicket } from '../hooks/useAssignTicket';
import { useStaff } from '../hooks/useStaff';

interface Props {
  ticket: Ticket;
  isOpen: boolean;
  onClose: () => void;
}

export function AssignTicketModal({ ticket, isOpen, onClose }: Props) {
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync: assignTicket, isPending } = useAssignTicket();
  
  const { data: staffList, isLoading: isStaffLoading, error: staffError } = useStaff();

  // Reset assigneeId when modal opens
  useEffect(() => {
    if (isOpen) {
      setAssigneeId('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!assigneeId) {
      setError('Please select an Assignee');
      return;
    }

    try {
      await assignTicket({
        id: ticket.id,
        payload: {
          assignee_id: parseInt(assigneeId, 10),
          version: ticket.version
        }
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to assign ticket.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity">
      <div className="w-full max-w-md bg-white rounded-[2px] overflow-hidden ring-1 ring-black/5">
        <div className="px-6 py-4 border-b border-[#EDEBE9] bg-gray-50">
          <h3 className="text-lg font-semibold text-[#11100F]">Assign Ticket #{ticket.id}</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 rounded-[2px] border border-red-100">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-[#323130] mb-2">Assignee</label>
            {isStaffLoading ? (
              <p className="text-sm text-[#605E5C]">Loading staff members...</p>
            ) : staffError ? (
              <p className="text-sm text-red-500">Failed to load staff members.</p>
            ) : (
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full rounded-[2px] border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border"
                disabled={isPending}
              >
                <option value="" disabled>Select a staff member...</option>
                {staffList?.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.departmentRole} - {staff.name} (ID: {staff.id})
                  </option>
                ))}
              </select>
            )}
            <p className="mt-2 text-xs text-[#605E5C]">
              Select a staff member to assign this ticket to.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-[#323130] bg-white border border-gray-300 rounded-[2px] hover:bg-[#F3F2F1] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !assigneeId || isStaffLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-[2px] hover:bg-[#005A9E] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isPending ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
