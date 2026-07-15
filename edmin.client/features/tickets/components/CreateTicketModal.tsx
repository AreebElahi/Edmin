import React, { useState } from 'react';
import { useCreateTicket } from '../hooks/useCreateTicket';
import { TicketPriority } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateTicketModal({ isOpen, onClose }: Props) {
  const [subject, setSubject] = useState<string>('');
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync: createTicket, isPending } = useCreateTicket();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (subject.trim().length < 5) {
      setError('Subject must be at least 5 characters long');
      return;
    }

    try {
      await createTicket({
        subject,
        priority,
        source_type: 'MANUAL'
      });
      setSubject('');
      setPriority('MEDIUM');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create ticket.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity">
      <div className="w-full max-w-md bg-white rounded-[2px] overflow-hidden ring-1 ring-black/5">
        <div className="px-6 py-4 border-b border-[#EDEBE9] bg-gray-50">
          <h3 className="text-lg font-semibold text-[#11100F]">New Ticket</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 rounded-[2px] border border-red-100">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-[#323130] mb-2">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-[2px] border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border"
              placeholder="e.g. System down"
              disabled={isPending}
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-[#323130] mb-2">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TicketPriority)}
              className="w-full rounded-[2px] border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border"
              disabled={isPending}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
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
              disabled={isPending || subject.trim().length < 5}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-[2px] hover:bg-[#005A9E] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
