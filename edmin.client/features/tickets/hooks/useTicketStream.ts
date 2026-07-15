import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../providers/AuthProvider';

export const useTicketStream = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined') return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    
    // EventSource doesn't support custom headers, so we pass the JWT in the query string
    const eventSource = new EventSource(`${apiUrl}/admin/tickets/stream?token=${token}`);

    eventSource.onopen = () => {
      console.log('SSE: Connected to ticket stream.');
      setIsConnected(true);
    };

    // Generic fallback for nameless events
    eventSource.onmessage = (event) => {
      console.log('SSE: Unhandled Message:', event.data);
    };

    // Specific Domain Events pushed by Redis
    eventSource.addEventListener('TicketResolvedEvent', (event) => {
      const data = JSON.parse(event.data);
      console.log('SSE: Ticket Resolved', data);
      
      // Invalidate the specific ticket so the detail page refreshes instantly
      queryClient.invalidateQueries({ queryKey: ['tickets', data.ticketId] });
      // Invalidate the lists
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    });

    eventSource.addEventListener('TicketAssignedEvent', (event) => {
      const data = JSON.parse(event.data);
      console.log('SSE: Ticket Assigned', data);
      queryClient.invalidateQueries({ queryKey: ['tickets', data.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    });

    eventSource.addEventListener('TicketMessageEvent', (event) => {
      const data = JSON.parse(event.data);
      console.log('SSE: New Ticket Message', data);
      // Invalidate the specific ticket to fetch the new message thread
      queryClient.invalidateQueries({ queryKey: ['tickets', data.ticketId] });
    });

    eventSource.onerror = (err) => {
      console.error('SSE: Connection Error.', err);
      setIsConnected(false);
      eventSource.close();
      
      // Attempt to reconnect after 5 seconds
      // Note: EventSource normally auto-reconnects, but if it's a hard failure we close it
    };

    return () => {
      console.log('SSE: Disconnecting from ticket stream.');
      setIsConnected(false);
      eventSource.close();
    };
  }, [isAuthenticated, queryClient]);

  return { isConnected };
};
