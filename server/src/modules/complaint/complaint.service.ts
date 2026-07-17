import prisma from '../../config/prisma.js';
import { complaint_status, complaint_priority } from '@prisma/client';
import crypto from 'crypto';
import { AppEvents, eventBus } from '../../core/events/eventBus.js';

const generateTokenId = () => {
  const year = new Date().getFullYear();
  const randomChars = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
  return `TKT-${year}-${randomChars}`;
};

export const createComplaint = async (creatorId: number, subject: string, description: string, priority: complaint_priority = 'MEDIUM') => {
  const tokenid = generateTokenId();
  
  // Calculate SLA based on priority (e.g. HIGH = 24h, MEDIUM = 48h)
  const slaHours = priority === 'URGENT' ? 12 : priority === 'HIGH' ? 24 : priority === 'MEDIUM' ? 48 : 72;
  const sladuedate = new Date(Date.now() + slaHours * 60 * 60 * 1000);

  const ticket = await prisma.complaint.create({
    data: {
      tokenid,
      createdbyid: creatorId,
      subject,
      description,
      status: complaint_status.OPEN,
      priority,
      sladuedate
    },
    include: {
      createdby: {
        select: { userid: true, username: true, role: true }
      }
    }
  });

  // Log creation
  await prisma.complaintauditlog.create({
    data: {
      complaintid: ticket.complaintid,
      userid: creatorId,
      action: 'TICKET_CREATED',
      newvalue: 'OPEN'
    }
  });

  // Emit Event
  eventBus.emit(AppEvents.TICKET_CREATED, {
    ticketId: ticket.complaintid,
    requesterId: creatorId,
    subject: ticket.subject
  });

  return ticket;
};

export const getComplaints = async (userId: number, userRole: string, limit = 50, offset = 0) => {
  const whereClause: any = {};
  
  // Strict RBAC filtering
  if (userRole === 'STUDENT' || userRole === 'FACULTY') {
    whereClause.createdbyid = userId;
  } else {
    // Admin/HR can see all tickets, or filter by assigned to them
    // whereClause.OR = [{ assignedtoid: userId }, { assignedtoid: null }];
  }

  return prisma.complaint.findMany({
    where: whereClause,
    include: {
      createdby: {
        select: { userid: true, username: true, role: true }
      },
      assignedto: {
        select: { userid: true, username: true, role: true }
      }
    },
    orderBy: {
      updatedat: 'desc'
    },
    take: limit,
    skip: offset
  });
};

export const getComplaintById = async (complaintId: number, userId: number, userRole: string) => {
  const complaint = await prisma.complaint.findUnique({
    where: { complaintid: complaintId },
    include: {
      createdby: {
        select: { userid: true, username: true, role: true }
      },
      assignedto: {
        select: { userid: true, username: true, role: true }
      },
      messages: {
        orderBy: { sentat: 'asc' },
        include: {
          sender: {
            select: { userid: true, username: true, role: true }
          }
        }
      },
      audit_logs: {
        orderBy: { createdat: 'asc' },
        include: {
          user: { select: { username: true, role: true } }
        }
      }
    }
  });

  if (!complaint) {
    throw new Error('NOT_FOUND');
  }

  // RBAC verification
  if ((userRole === 'STUDENT' || userRole === 'FACULTY') && complaint.createdbyid !== userId) {
    throw new Error('NOT_AUTHORIZED');
  }

  return complaint;
};

export const updateComplaintStatus = async (complaintId: number, status: complaint_status, userId: number, userRole: string) => {
  if (userRole === 'STUDENT' || userRole === 'FACULTY') {
    throw new Error('NOT_AUTHORIZED'); 
  }

  const oldTicket = await prisma.complaint.findUnique({ where: { complaintid: complaintId } });
  if (!oldTicket) throw new Error('NOT_FOUND');

  const updatedTicket = await prisma.complaint.update({
    where: { complaintid: complaintId },
    data: { status, updatedat: new Date() }
  });

  await prisma.complaintauditlog.create({
    data: {
      complaintid: complaintId,
      userid: userId,
      action: 'STATUS_CHANGED',
      oldvalue: oldTicket.status,
      newvalue: status
    }
  });

  eventBus.emit(AppEvents.TICKET_UPDATED, {
    ticketId: complaintId,
    userId,
    oldStatus: oldTicket.status,
    newStatus: status
  });

  return updatedTicket;
};

export const assignComplaint = async (complaintId: number, assigneeId: number, userId: number, userRole: string) => {
  if (userRole !== 'ADMIN' && userRole !== 'HR') {
    throw new Error('NOT_AUTHORIZED'); 
  }

  const oldTicket = await prisma.complaint.findUnique({ where: { complaintid: complaintId } });
  if (!oldTicket) throw new Error('NOT_FOUND');

  const updatedTicket = await prisma.complaint.update({
    where: { complaintid: complaintId },
    data: { assignedtoid: assigneeId, updatedat: new Date() }
  });

  await prisma.complaintauditlog.create({
    data: {
      complaintid: complaintId,
      userid: userId,
      action: 'TICKET_ASSIGNED',
      oldvalue: oldTicket.assignedtoid?.toString() || 'UNASSIGNED',
      newvalue: assigneeId.toString()
    }
  });

  eventBus.emit(AppEvents.TICKET_ASSIGNED, {
    ticketId: complaintId,
    assigneeId,
    assignedById: userId
  });

  return updatedTicket;
};

export const sendComplaintMessage = async (complaintId: number, senderId: number, userRole: string, message: string) => {
  const complaint = await prisma.complaint.findUnique({
    where: { complaintid: complaintId }
  });

  if (!complaint) {
    throw new Error('NOT_FOUND');
  }

  if ((userRole === 'STUDENT' || userRole === 'FACULTY') && complaint.createdbyid !== senderId) {
    throw new Error('NOT_AUTHORIZED');
  }

  if (userRole === 'ADMIN' || userRole === 'HR') {
    if (complaint.assignedtoid === null) {
      await assignComplaint(complaintId, senderId, senderId, userRole);
    } else if (complaint.assignedtoid !== senderId) {
      throw new Error('CONFLICT: This ticket is currently being handled by another support agent.');
    }
  }

  const newMessage = await prisma.complaintmessage.create({
    data: {
      complaintid: complaintId,
      senderid: senderId,
      message
    },
    include: {
      sender: {
        select: { userid: true, username: true, role: true }
      }
    }
  });

  await prisma.complaint.update({
    where: { complaintid: complaintId },
    data: { updatedat: new Date() }
  });

  // Emit event if the sender is not the creator, to notify the creator.
  // Or notify assignee if creator sends message.
  // Currently handled by TICKET_UPDATED or we could use MESSAGE_SENT.

  return newMessage;
};
