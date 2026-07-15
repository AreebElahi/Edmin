import React from 'react';
import { Ticket } from '../types';

interface Props {
  ticket: Ticket;
}

export function TicketDetails({ ticket }: Props) {
  return (
    <div className="bg-white ring-1 ring-gray-900/5 sm:rounded-[2px] md:col-span-2">
      <div className="px-4 py-6 sm:p-8">
        <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
          <div className="sm:col-span-6">
            <h2 className="text-base font-semibold leading-7 text-[#11100F]">Ticket Details</h2>
            <p className="mt-1 text-sm leading-6 text-[#323130]">Overview of the reported issue.</p>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-sm font-medium leading-6 text-[#11100F]">Requester ID</label>
            <div className="mt-2 text-sm text-[#323130]">{ticket.requester_id}</div>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-sm font-medium leading-6 text-[#11100F]">Assignee ID</label>
            <div className="mt-2 text-sm text-[#323130]">
              {ticket.assignee_id ? ticket.assignee_id : <span className="text-[#A19F9D] italic">Unassigned</span>}
            </div>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-sm font-medium leading-6 text-[#11100F]">Source Type</label>
            <div className="mt-2 text-sm text-[#323130]">{ticket.source_type}</div>
          </div>

          <div className="sm:col-span-3">
             <label className="block text-sm font-medium leading-6 text-[#11100F]">Entity Link</label>
             <div className="mt-2 text-sm text-[#323130]">
                {ticket.entity_type ? `${ticket.entity_type} (#${ticket.entity_id})` : 'N/A'}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
