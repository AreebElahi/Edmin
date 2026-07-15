import React, { useState } from 'react';
import { Ticket } from '../types';
import { useCreateMessage } from '../hooks/useCreateMessage';
import { Can } from '../../../providers/RBACProvider';

interface Props {
  ticket: Ticket;
}

export function TicketMessages({ ticket }: Props) {
  const [content, setContent] = useState('');
  const { mutateAsync: createMsg, isPending } = useCreateMessage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      await createMsg({
        id: ticket.id,
        payload: { content, is_internal: false }
      });
      setContent('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white ring-1 ring-gray-900/5 sm:rounded-[2px] flex flex-col">
      <div className="px-4 py-5 border-b border-[#EDEBE9] sm:px-6">
        <h3 className="text-base font-semibold leading-6 text-[#11100F]">Conversation</h3>
      </div>
      
      {/* Messages Thread */}
      <div className="p-4 sm:p-6 flex-1 max-h-96 overflow-y-auto space-y-4 bg-gray-50">
        {ticket.messages && ticket.messages.length > 0 ? (
          ticket.messages.map((msg) => (
            <div key={msg.id} className="bg-white border border-[#EDEBE9] p-4 rounded-[2px]">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xs font-bold text-[#11100F]">User {msg.sender_id}</span>
                <span className="text-xs text-[#605E5C]">{new Date(msg.created_at).toLocaleString()}</span>
              </div>
              <p className="text-sm text-[#323130] whitespace-pre-wrap">{msg.content}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-[#605E5C] text-center italic py-4">No messages yet.</p>
        )}
      </div>

      {/* Reply Box guarded by RBAC */}
      <Can I="UPDATE" a="TICKETS">
        <div className="px-4 py-4 sm:px-6 border-t border-[#EDEBE9]">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <textarea
              className="block w-full rounded-md border-0 py-1.5 text-[#11100F] ring-1 ring-inset ring-gray-300 placeholder:text-[#A19F9D] focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 resize-none"
              rows={2}
              placeholder="Add a reply..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isPending || ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'}
            />
            <button
              type="submit"
              disabled={isPending || !content.trim() || ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
            >
              {isPending ? 'Sending...' : 'Reply'}
            </button>
          </form>
        </div>
      </Can>
    </div>
  );
}
