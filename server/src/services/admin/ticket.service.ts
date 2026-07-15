import prisma from '../../config/prisma.js';
import { CreateTicketSchema, ResolveTicketSchema } from '../../contracts/ticket.contracts.js';


export const getAssignableStaff = async () => {
  const users = await prisma.user.findMany({
    where: {
      role: { not: 'STUDENT' }
    },
    select: {
      userid: true,
      username: true,
      role: true,
      departmentmember: {
        include: {
          department: {
            select: { name: true }
          }
        }
      }
    }
  });

  return users.map(u => {
    const dept = u.departmentmember[0]?.department?.name;
    const roleOrDept = dept ? `${dept} ${u.role}` : u.role;
    return {
      id: u.userid,
      name: u.username,
      departmentRole: roleOrDept
    };
  });
};

export const createTicket = async (requesterId: number, data: any) => {
  const parsed = CreateTicketSchema.parse(data);

  return await prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.create({
      data: {
        subject: parsed.subject,
        priority: parsed.priority,
        source_type: parsed.source_type,
        entity_type: parsed.entity_type,
        entity_id: parsed.entity_id,
        requester_id: requesterId
      }
    });

    await tx.outboxEvent.create({
      data: {
        aggregate_type: 'TICKET',
        aggregate_id: ticket.id,
        event_type: 'TICKET_CREATED',
        payload: { ticketId: ticket.id, status: ticket.status }
      }
    });

    return ticket;
  });
};

export const resolveTicket = async (ticketId: number, adminId: number, data: any) => {
  const parsed = ResolveTicketSchema.parse(data);

  return await prisma.$transaction(async (tx) => {
    // 1. Optimistic Concurrency Control Check
    const updated = await tx.ticket.updateMany({
      where: { id: ticketId, version: parsed.version },
      data: { status: 'RESOLVED', assignee_id: adminId, version: { increment: 1 } }
    });

    if (updated.count === 0) {
      throw new Error("Conflict: Ticket was modified by another user or does not exist.");
    }

    // 2. Insert Final Message
    await tx.ticketMessage.create({
      data: { ticket_id: ticketId, sender_id: adminId, content: parsed.resolutionText, is_internal: false }
    });

    // 3. Write to Outbox
    await tx.outboxEvent.create({
      data: {
        aggregate_type: 'TICKET',
        aggregate_id: ticketId,
        event_type: 'TICKET_RESOLVED',
        payload: { ticketId, status: 'RESOLVED', resolvedBy: adminId }
      }
    });

    return { success: true, ticketId };
  });
};

export const assignTicket = async (ticketId: number, adminId: number, version: number) => {
  return await prisma.$transaction(async (tx) => {
    const updated = await tx.ticket.updateMany({
      where: { id: ticketId, version },
      data: { assignee_id: adminId, status: 'IN_PROGRESS', version: { increment: 1 } }
    });

    if (updated.count === 0) throw new Error("Conflict: Ticket was modified by another user.");

    return { success: true, ticketId };
  });
};

export const getTickets = async (params: any = {}) => {
  const { status, limit = 20, cursor } = params;
  
  const query: any = {};
  if (status) query.status = status;

  const tickets = await prisma.ticket.findMany({
    where: query,
    take: limit ? Number(limit) : 20,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: Number(cursor) } : undefined,
    orderBy: { created_at: 'desc' },
    include: {
      requester: { select: { userid: true, username: true, email: true } },
      assignee: { select: { userid: true, username: true, email: true } }
    }
  });

  const nextCursor = tickets.length === Number(limit) ? tickets[tickets.length - 1].id : null;

  return {
    tickets,
    nextCursor
  };
};

export const getTicketById = async (id: number) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      requester: { select: { userid: true, username: true, email: true } },
      assignee: { select: { userid: true, username: true, email: true } },
      messages: {
        orderBy: { created_at: 'asc' },
        include: {
          sender: { select: { userid: true, username: true, role: true } }
        }
      }
    }
  });

  if (!ticket) throw new Error("Ticket not found");
  return ticket;
};

export const createMessage = async (ticketId: number, adminId: number, data: any) => {
  return await prisma.$transaction(async (tx) => {
    const message = await tx.ticketMessage.create({
      data: {
        ticket_id: ticketId,
        sender_id: adminId,
        content: data.content,
        is_internal: data.isInternal || false
      }
    });

    await tx.outboxEvent.create({
      data: {
        aggregate_type: 'TICKET',
        aggregate_id: ticketId,
        event_type: 'TICKET_MESSAGE_ADDED',
        payload: { ticketId, messageId: message.id }
      }
    });

    return message;
  });
};
