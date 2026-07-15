import { Request, Response } from 'express';
import { sendSuccess, sendError, ApiResponse } from '../../contracts/api.contracts.js';
import prisma from '../../config/prisma.js';
import { parseOptionalString, parseNumber } from '../../utils/queryParser.js';
import { approveLeaveRequest, rejectLeaveRequest } from '../../services/workflows/leaveWorkflow.service.js';
import { approveEnrollmentRequest, rejectEnrollmentRequest } from '../../services/enrollment.service.js';
import { approveTeachingLoad, rejectTeachingLoad } from '../../services/workflows/teachingLoadWorkflow.service.js';
import { approveActivityReport, rejectActivityReport } from '../../services/workflows/activityReportWorkflow.service.js';

export const getEventsHandler = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const page = parseNumber(req.query.page, 1);
    const limit = parseNumber(req.query.limit, 20);
    const skip = (page - 1) * limit;

    const status = parseOptionalString(req.query.status) as 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | undefined;
    const eventType = parseOptionalString(req.query.eventType);
    const aggregateType = parseOptionalString(req.query.aggregateType);
    const aggregateId = parseNumber(req.query.aggregateId, 0);

    const where: any = {};
    if (status) where.status = status;
    if (eventType) where.event_type = eventType;
    if (aggregateType) where.aggregate_type = aggregateType;
    if (aggregateId) where.aggregate_id = aggregateId;

    const [events, total] = await Promise.all([
      prisma.outboxEvent.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.outboxEvent.count({ where })
    ]);

    return sendSuccess(res, {
      events,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('getEventsHandler Error:', error);
    return sendError(res, error.message || 'Failed to fetch events');
  }
};

export const replayEventHandler = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const eventId = parseInt(req.params.id as string, 10);
    if (isNaN(eventId)) {
      return sendError(res, 'Invalid event ID', 'INVALID_INPUT', 400);
    }

    const event = await prisma.outboxEvent.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return sendError(res, 'Event not found', 'NOT_FOUND', 404);
    }

    if (event.status !== 'FAILED') {
      return sendError(res, 'Only FAILED events can be replayed', 'INVALID_STATE', 400);
    }

    const updated = await prisma.outboxEvent.update({
      where: { id: eventId },
      data: {
        status: 'PENDING',
        attempt_count: 0,
        last_error: null
      }
    });

    return sendSuccess(res, updated);
  } catch (error: any) {
    console.error('replayEventHandler Error:', error);
    return sendError(res, error.message || 'Failed to replay event');
  }
};

export const forceRetryEventHandler = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const eventId = parseInt(req.params.id as string, 10);
    if (isNaN(eventId)) {
      return sendError(res, 'Invalid event ID', 'INVALID_INPUT', 400);
    }

    const event = await prisma.outboxEvent.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return sendError(res, 'Event not found', 'NOT_FOUND', 404);
    }

    const updated = await prisma.outboxEvent.update({
      where: { id: eventId },
      data: {
        status: 'PENDING',
        attempt_count: 0,
        last_error: null
      }
    });

    return sendSuccess(res, updated);
  } catch (error: any) {
    console.error('forceRetryEventHandler Error:', error);
    return sendError(res, error.message || 'Failed to force retry event');
  }
};

export const resolveEventHandler = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const eventId = parseInt(req.params.id as string, 10);
    if (isNaN(eventId)) {
      return sendError(res, 'Invalid event ID', 'INVALID_INPUT', 400);
    }

    const event = await prisma.outboxEvent.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return sendError(res, 'Event not found', 'NOT_FOUND', 404);
    }

    const updated = await prisma.outboxEvent.update({
      where: { id: eventId },
      data: {
        status: 'COMPLETED',
        processed_at: new Date(),
        last_error: null
      }
    });

    return sendSuccess(res, updated);
  } catch (error: any) {
    console.error('resolveEventHandler Error:', error);
    return sendError(res, error.message || 'Failed to resolve event');
  }
};

export const injectEventHandler = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { event_type, aggregate_type, aggregate_id, payload } = req.body;

    if (!event_type || !aggregate_type || typeof aggregate_id !== 'number' || !payload) {
      return sendError(res, 'Missing or invalid parameters', 'INVALID_INPUT', 400);
    }

    const newEvent = await prisma.outboxEvent.create({
      data: {
        event_type,
        aggregate_type,
        aggregate_id,
        payload,
        status: 'PENDING',
        attempt_count: 0
      }
    });

    return sendSuccess(res, newEvent);
  } catch (error: any) {
    console.error('injectEventHandler Error:', error);
    return sendError(res, error.message || 'Failed to inject manual event');
  }
};

export const getEscalationsHandler = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const escalations = await prisma.escalation.findMany({
      where: {
        status: 'OPEN'
      },
      include: {
        user: true
      },
      orderBy: {
        createdat: 'desc'
      }
    });

    const richEscalations: any[] = [];
    
    // Process standard db escalations
    for (const esc of escalations) {
      let relatedDetails: any = null;
      let owner = 'N/A';
      let currentAuthority = 'N/A';
      
      try {
        if (esc.relatedtype === 'LEAVE') {
          relatedDetails = await prisma.leaverequest.findUnique({
            where: { leaverequestid: esc.relatedid },
            include: { user: { include: { faculty: true } } }
          });
          owner = relatedDetails?.user?.faculty?.[0]?.fullname || relatedDetails?.user?.username || 'N/A';
          currentAuthority = relatedDetails?.status === 'PENDING_HR' ? 'HR' : 'Supervisor/HOD';
        } else if (esc.relatedtype === 'ENROLLMENT') {
          relatedDetails = await prisma.enrollmentrequest.findUnique({
            where: { enrollmentrequestid: esc.relatedid },
            include: {
              student: { include: { user: true } },
              courseoffering: { include: { course: true } }
            }
          });
          owner = relatedDetails?.student?.fullname || relatedDetails?.student?.user?.username || 'N/A';
          currentAuthority = 'Supervisor/HOD';
        } else if (esc.relatedtype === 'TEACHING_LOAD') {
          relatedDetails = await prisma.teachingload.findUnique({
            where: { teachingloadid: esc.relatedid },
            include: {
              faculty: { include: { user: true } },
              semester: true,
              teachingassignment: { include: { courseoffering: { include: { course: true } } } },
              teachingloadapproval: true
            }
          });
          owner = relatedDetails?.faculty?.fullname || relatedDetails?.faculty?.user?.username || 'N/A';
          
          // Determine if supervisor or HOD needs to approve
          const approvals = relatedDetails?.teachingloadapproval || [];
          const hasSupervisor = approvals.some((a: any) => a.action === 'SUPERVISOR_APPROVE');
          const hasHOD = approvals.some((a: any) => a.action === 'HOD_APPROVE');
          
          if (!hasSupervisor) {
            currentAuthority = 'Supervisor';
          } else if (!hasHOD) {
            currentAuthority = 'HOD';
          } else {
            currentAuthority = 'Admin';
          }
        } else if (esc.relatedtype === 'REPORT') {
          relatedDetails = await prisma.dailyactivityreport.findUnique({
            where: { dailyactivityreportid: esc.relatedid },
            include: {
              faculty: { include: { user: true } },
              department: true,
              dailyreportactivity: true
            }
          });
          owner = relatedDetails?.faculty?.fullname || relatedDetails?.faculty?.user?.username || 'N/A';
          currentAuthority = 'HOD';
        }
      } catch (err) {
        console.error(`Failed to fetch related details for escalation ${esc.escalationid}:`, err);
      }
      
      const createdTime = new Date(esc.createdat).getTime();
      const daysOverdue = Math.max(0, Math.floor((Date.now() - createdTime) / (1000 * 60 * 60 * 24)));
      
      let escalationLevel = 'Level 1 - Low';
      if (daysOverdue >= 5) {
        escalationLevel = 'Level 3 - Critical';
      } else if (daysOverdue >= 2) {
        escalationLevel = 'Level 2 - Medium';
      }

      richEscalations.push({
        escalationid: esc.escalationid.toString(),
        relatedid: esc.relatedid,
        relatedtype: esc.relatedtype,
        status: esc.status,
        target: esc.target,
        userid: esc.userid,
        createdat: esc.createdat,
        owner,
        currentAuthority,
        daysOverdue,
        escalationLevel,
        relatedDetails
      });
    }

    // Process overdue tickets (tickets open for more than 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const overdueTickets = await prisma.ticket.findMany({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        created_at: { lt: oneDayAgo }
      },
      include: {
        requester: true,
        assignee: true
      }
    });

    for (const ticket of overdueTickets) {
      const createdTime = new Date(ticket.created_at).getTime();
      const daysOverdue = Math.max(0, Math.floor((Date.now() - createdTime) / (1000 * 60 * 60 * 24)));
      
      let escalationLevel = 'Level 1 - Low';
      if (daysOverdue >= 5 || ticket.priority === 'HIGH' || ticket.priority === 'CRITICAL') {
        escalationLevel = 'Level 3 - Critical';
      } else if (daysOverdue >= 2) {
        escalationLevel = 'Level 2 - Medium';
      }

      richEscalations.push({
        escalationid: `ticket-${ticket.id}`,
        relatedid: ticket.id,
        relatedtype: 'TICKET',
        status: 'OPEN',
        target: 'ADMIN_OVERRIDE',
        userid: ticket.requester_id,
        createdat: ticket.created_at,
        owner: ticket.requester?.username || ticket.requester?.email || 'Student',
        currentAuthority: ticket.assignee?.username || 'Support Queue',
        daysOverdue,
        escalationLevel,
        relatedDetails: ticket
      });
    }

    // Sort by days overdue descending
    richEscalations.sort((a, b) => b.daysOverdue - a.daysOverdue);

    return sendSuccess(res, richEscalations);
  } catch (error: any) {
    console.error('getEscalationsHandler Error:', error);
    return sendError(res, error.message || 'Failed to fetch escalations');
  }
};

export const overrideEscalationHandler = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const escalationIdStr = req.params.id as string;
    const { action, comment } = req.body;
    const adminUserId = (req as any).user.userId;

    if (action !== 'APPROVE' && action !== 'REJECT') {
      return sendError(res, 'Action must be APPROVE or REJECT', 'INVALID_INPUT', 400);
    }

    // Handle virtual Ticket escalations
    if (escalationIdStr.startsWith('ticket-')) {
      const ticketId = parseInt(escalationIdStr.split('-')[1], 10);
      if (isNaN(ticketId)) {
        return sendError(res, 'Invalid ticket ID', 'INVALID_INPUT', 400);
      }

      const nextStatus = action === 'APPROVE' ? 'RESOLVED' : 'CLOSED';
      
      const updatedTicket = await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: nextStatus }
      });

      await prisma.ticketMessage.create({
        data: {
          ticket_id: ticketId,
          sender_id: adminUserId,
          content: `[Admin Absolute Override] Status forced to ${nextStatus}. Reason: ${comment || 'No comment provided.'}`
        }
      });

      return sendSuccess(res, { message: `Ticket status successfully overridden to ${nextStatus}`, updatedTicket });
    }

    const escalationId = parseInt(escalationIdStr, 10);
    if (isNaN(escalationId)) {
      return sendError(res, 'Invalid escalation ID', 'INVALID_INPUT', 400);
    }

    const escalation = await prisma.escalation.findUnique({
      where: { escalationid: escalationId }
    });

    if (!escalation) {
      return sendError(res, 'Escalation not found', 'NOT_FOUND', 404);
    }

    if (escalation.status === 'RESOLVED') {
      return sendError(res, 'Escalation is already resolved', 'INVALID_STATE', 400);
    }

    // Execute override depending on relatedtype
    if (escalation.relatedtype === 'LEAVE') {
      if (action === 'APPROVE') {
        await approveLeaveRequest(escalation.relatedid, adminUserId, comment || 'Approved by Admin Override');
      } else {
        await rejectLeaveRequest(escalation.relatedid, adminUserId, comment || 'Rejected by Admin Override');
      }
    } else if (escalation.relatedtype === 'ENROLLMENT') {
      if (action === 'APPROVE') {
        await approveEnrollmentRequest(escalation.relatedid, adminUserId, comment || 'Approved by Admin Override');
      } else {
        await rejectEnrollmentRequest(escalation.relatedid, adminUserId, comment || 'Rejected by Admin Override');
      }
    } else if (escalation.relatedtype === 'TEACHING_LOAD') {
      if (action === 'APPROVE') {
        await approveTeachingLoad(escalation.relatedid, adminUserId, 'ADMIN', comment || 'Approved by Admin Override');
      } else {
        await rejectTeachingLoad(escalation.relatedid, adminUserId, 'ADMIN', comment || 'Rejected by Admin Override');
      }
    } else if (escalation.relatedtype === 'REPORT') {
      if (action === 'APPROVE') {
        await approveActivityReport(escalation.relatedid, adminUserId, 'ADMIN', comment || 'Approved by Admin Override');
      } else {
        await rejectActivityReport(escalation.relatedid, adminUserId, 'ADMIN', comment || 'Rejected by Admin Override');
      }
    } else {
      return sendError(res, 'Unsupported escalation type', 'INVALID_STATE', 400);
    }

    const updated = await prisma.escalation.update({
      where: { escalationid: escalationId },
      data: { status: 'RESOLVED' }
    });

    return sendSuccess(res, updated);
  } catch (error: any) {
    console.error('overrideEscalationHandler Error:', error);
    return sendError(res, error.message || 'Failed to override escalation');
  }
};

