import React from 'react';
import { Ticket } from '../types';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

interface Props {
  ticket: Ticket;
}

export function TicketCard({ ticket }: Props) {
  return (
    <div className="bg-white rounded-[2px] border border-[#EDEBE9] p-5 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-lg text-[#11100F] line-clamp-1">{ticket.subject}</h3>
          <p className="text-xs text-[#605E5C] mt-1">Ticket #{ticket.id} • Opened {new Date(ticket.created_at).toLocaleDateString()}</p>
        </div>
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset
          ${ticket.status === 'OPEN' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' : ''}
          ${ticket.status === 'IN_PROGRESS' ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' : ''}
          ${ticket.status === 'RESOLVED' ? 'bg-green-50 text-green-700 ring-green-600/20' : ''}
          ${ticket.status === 'CLOSED' ? 'bg-[#F3F2F1] text-[#323130] ring-gray-500/20' : ''}
        `}>
          {ticket.status}
        </span>
      </div>

      <div className="flex items-center justify-between text-sm mt-6">
        <div className="flex items-center gap-4 text-[#323130]">
           <span className="flex items-center gap-1">
             {ticket.priority === 'CRITICAL' && <AlertCircle className="w-4 h-4 text-red-500" />}
             Priority: <span className="font-medium text-[#11100F]">{ticket.priority}</span>
           </span>
        </div>
        <Link 
          href={`/dashboard/tickets/${ticket.id}`} 
          className="text-[#0078D4] hover:text-blue-800 font-semibold text-sm transition-colors"
        >
          View Details →
        </Link>
      </div>
    </div>
  );
}
