import React, { useState } from 'react';
import { Ticket } from '../types';
import { useResolveTicket } from '../hooks/useResolveTicket';

interface Props {
  ticket: Ticket;
  isOpen: boolean;
  onClose: () => void;
}

export function ResolveTicketModal({ ticket, isOpen, onClose }: Props) {
  const [resolutionText, setResolutionText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync: resolveTicket, isPending } = useResolveTicket();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (resolutionText.trim().length < 10) {
      setError('Resolution text must be at least 10 characters.');
      return;
    }

    try {
      await resolveTicket({
        id: ticket.id,
        payload: {
          resolutionText,
          version: ticket.version // Optimistic Concurrency Control
        }
      });
      onClose();
    } catch (err: any) {
      // Handles 409 Conflict elegantly
      setError(err.message || 'Failed to resolve ticket. Another admin may have updated it.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity">
      <div className="w-full max-w-lg bg-white rounded-[2px] overflow-hidden ring-1 ring-black/5">
        <div className="px-6 py-4 border-b border-[#EDEBE9] bg-[#F3F2F1] flex justify-between items-center">
          <h3 className="text-lg font-semibold text-[#11100F]">Resolve Ticket #{ticket.id}</h3>
          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-[2px] font-medium">Closes Ticket</span>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 rounded-[2px] border border-red-100">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-[#323130] mb-2">Resolution Summary</label>
            <textarea
              rows={4}
              value={resolutionText}
              onChange={(e) => setResolutionText(e.target.value)}
              className="w-full rounded-[2px] border-gray-300 focus:border-green-500 focus:ring-green-500 sm:text-sm p-3 border resize-none"
              placeholder="Detail exactly how this ticket was resolved..."
              disabled={isPending}
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-[#323130] bg-white border border-gray-300 rounded-[2px] hover:bg-[#F3F2F1] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || resolutionText.length < 10}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-[2px] hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {isPending ? 'Resolving...' : 'Confirm Resolution'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
