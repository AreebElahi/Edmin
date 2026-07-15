import React from 'react';
import { Ticket } from '../types';
import Link from 'next/link';
import { FileText, Clock, AlertCircle } from 'lucide-react';

interface Props {
  tickets: Ticket[];
}

export function TicketTable({ tickets }: Props) {
  if (tickets.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-[2px] border border-[#EDEBE9]">
        <FileText className="mx-auto h-12 w-12 text-gray-300" />
        <h3 className="mt-2 text-sm font-semibold text-[#11100F]">No tickets</h3>
        <p className="mt-1 text-sm text-[#605E5C]">You are all caught up.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white ring-1 ring-black ring-opacity-5 sm:rounded-[2px]">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-[#11100F] sm:pl-6">ID</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-[#11100F]">Subject</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-[#11100F]">Status</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-[#11100F]">Priority</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-[#11100F]">Created</th>
            <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
              <span className="sr-only">View</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {tickets.map((ticket) => (
            <tr key={ticket.id} className="hover:bg-[#F3F2F1] transition-colors">
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-[#11100F] sm:pl-6">
                #{ticket.id}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-[#605E5C] truncate max-w-xs">
                {ticket.subject}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm">
                <span className={`inline-flex items-center rounded-[2px] px-2.5 py-0.5 text-xs font-medium
                  ${ticket.status === 'OPEN' ? 'bg-blue-100 text-blue-800' : ''}
                  ${ticket.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' : ''}
                  ${ticket.status === 'RESOLVED' ? 'bg-green-100 text-green-800' : ''}
                  ${ticket.status === 'CLOSED' ? 'bg-gray-100 text-gray-800' : ''}
                `}>
                  {ticket.status}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-[#605E5C] flex items-center gap-1">
                {ticket.priority === 'CRITICAL' && <AlertCircle className="w-4 h-4 text-red-500" />}
                {ticket.priority}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-[#605E5C]">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 opacity-50" />
                  {new Date(ticket.created_at).toLocaleDateString()}
                </div>
              </td>
              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                <Link href={`/dashboard/tickets/${ticket.id}`} className="text-[#0078D4] hover:text-blue-900 font-semibold">
                  View<span className="sr-only">, {ticket.subject}</span>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
