import { PrismaClient } from '@prisma/client';
import { AppEvents, eventBus, MessageSentPayload, TicketAssignedPayload, TicketCreatedPayload, TicketUpdatedPayload } from '../../core/events/eventBus.js';

const prisma = new PrismaClient();

export class NotificationService {
  /**
   * Fetch notifications for a specific user
   */
  static async getUserNotifications(userId: number, limit = 20) {
    return prisma.notification.findMany({
      where: { userid: userId, isactive: true },
      orderBy: { createdat: 'desc' },
      take: limit,
    });
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(notificationId: number, userId: number) {
    return prisma.notification.updateMany({
      where: { notificationid: notificationId, userid: userId },
      data: { isread: true },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: number) {
    return prisma.notification.updateMany({
      where: { userid: userId, isread: false },
      data: { isread: true },
    });
  }

  /**
   * Setup event listeners for the event-driven architecture
   */
  static initializeEventListeners() {
    eventBus.on(AppEvents.TICKET_CREATED, async (payload: TicketCreatedPayload) => {
      // Find admins to notify
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN', accountStatus: 'ACTIVE' }
      });
      
      const notifications = admins.map(admin => ({
        userid: admin.userid,
        title: 'New Ticket Created',
        message: `A new ticket has been submitted: ${payload.subject}`,
        type: 'TICKET',
        action_url: `/dashboard/shared/complaints?ticket=${payload.ticketId}`
      }));

      if (notifications.length > 0) {
        await prisma.notification.createMany({ data: notifications });
      }
    });

    eventBus.on(AppEvents.TICKET_ASSIGNED, async (payload: TicketAssignedPayload) => {
      await prisma.notification.create({
        data: {
          userid: payload.assigneeId,
          title: 'Ticket Assigned',
          message: `You have been assigned to ticket #${payload.ticketId}`,
          type: 'TICKET',
          action_url: `/dashboard/shared/complaints?ticket=${payload.ticketId}`
        }
      });
    });

    eventBus.on(AppEvents.TICKET_UPDATED, async (payload: TicketUpdatedPayload) => {
      const ticket = await prisma.complaint.findUnique({
        where: { complaintid: payload.ticketId }
      });
      if (ticket && ticket.createdbyid !== payload.userId) {
        await prisma.notification.create({
          data: {
            userid: ticket.createdbyid,
            title: 'Ticket Status Updated',
            message: `Your ticket #${payload.ticketId} status changed to ${payload.newStatus}`,
            type: 'TICKET',
            action_url: `/dashboard/shared/complaints?ticket=${payload.ticketId}`
          }
        });
      }
    });

    eventBus.on(AppEvents.MESSAGE_SENT, async (payload: MessageSentPayload) => {
      const session = await prisma.academicchatsession.findUnique({
        where: { sessionid: payload.sessionId }
      });
      
      if (session) {
        const targetUserId = session.studentid === payload.senderId ? session.facultyid : session.studentid;
        await prisma.notification.create({
          data: {
            userid: targetUserId,
            title: 'New Chat Message',
            message: `You have a new message: ${payload.content.substring(0, 30)}...`,
            type: 'CHAT',
            action_url: `/dashboard/shared/messages?session=${payload.sessionId}`
          }
        });
      }
    });
  }
}
