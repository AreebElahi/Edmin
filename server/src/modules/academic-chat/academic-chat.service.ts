import prisma from '../../config/prisma.js';
import { AppError } from '../../utils/AppError.js';
import { AppEvents, eventBus } from '../../core/events/eventBus.js';

const USER_SELECT = {
  userid: true,
  username: true,
  email: true,
  role: true,
} as const;

const USER_SELECT_BASIC = {
  userid: true,
  username: true,
  role: true,
} as const;

export class AcademicChatService {
  /**
   * Retrieves all chat sessions for a specific user.
   */
  static async getSessions(userId: number) {
    const sessions = await prisma.academicchatsession.findMany({
      where: {
        OR: [
          { studentid: userId },
          { facultyid: userId },
        ],
        status: {
          not: 'ARCHIVED',
        },
      },
      include: {
        student: {
          select: USER_SELECT,
        },
        faculty: {
          select: USER_SELECT,
        },
        courseoffering: {
          select: {
            courseofferingid: true,
            course: { select: { code: true, name: true } },
          },
        },
        messages: {
          where: { deletedat: null },
          orderBy: { sentat: 'desc' },
          take: 1, // Get the latest message for the snippet
        },
      },
      orderBy: {
        updatedat: 'desc',
      },
    });

    return sessions;
  }

  /**
   * Gets a specific session with its full message history (paginated).
   */
  static async getSession(sessionId: number, userId: number, limit = 50, offset = 0) {
    const session = await prisma.academicchatsession.findUnique({
      where: { sessionid: sessionId },
      include: {
        student: {
          select: USER_SELECT,
        },
        faculty: {
          select: USER_SELECT,
        },
        courseoffering: {
          select: {
            courseofferingid: true,
            course: { select: { code: true, name: true } },
          },
        },
        messages: {
          orderBy: { sentat: 'desc' }, // Order descending to get latest first for pagination
          take: limit,
          skip: offset,
          include: {
            sender: {
              select: USER_SELECT_BASIC,
            },
          },
        },
      },
    });

    if (!session) {
      throw new AppError(404, 'Chat session not found');
    }

    if (session.studentid !== userId && session.facultyid !== userId) {
      const user = await prisma.user.findUnique({ where: { userid: userId } });
      if (user?.role !== 'ADMIN') {
        throw new AppError(403, 'Not authorized to view this chat');
      }
    }

    // Reverse messages to show oldest first in the UI
    const msgs = [...session.messages].reverse().map((msg: typeof session.messages[number]) => {
      if (msg.deletedat) {
        return { ...msg, message: 'This message was deleted', messagestate: 'SENT' as const };
      }
      return msg;
    });

    return { ...session, messages: msgs };
  }

  /**
   * Initializes a new session or returns the existing one.
   */
  static async createSession(
    initiatorId: number,
    targetUserId: number,
    courseOfferingId?: number
  ) {
    const initiator = await prisma.user.findUnique({ where: { userid: initiatorId } });
    const target = await prisma.user.findUnique({ where: { userid: targetUserId } });

    if (!initiator || !target) {
      throw new AppError(404, 'User not found');
    }

    let studentId: number;
    let facultyId: number;

    // Check if communication is allowed between these two roles based on the matrix
    let isAllowed = false;
    if (initiator.role === 'STUDENT' && target.role === 'FACULTY') isAllowed = true;
    else if (initiator.role === 'ADMIN' && (target.role === 'FACULTY' || target.role === 'HR')) isAllowed = true;
    else if (initiator.role === 'HR' && (target.role === 'FACULTY' || target.role === 'ADMIN')) isAllowed = true;
    else if (initiator.role === 'FACULTY') isAllowed = true; // Faculty can message anyone
    
    if (!isAllowed) {
      throw new AppError(403, 'You do not have permission to start a conversation with this user role');
    }

    // Determine how to map to studentid and facultyid columns
    // If one of them is a STUDENT, they must go into studentid to preserve any legacy assumptions
    if (initiator.role === 'STUDENT' || target.role === 'STUDENT') {
      studentId = initiator.role === 'STUDENT' ? initiatorId : targetUserId;
      facultyId = initiator.role === 'STUDENT' ? targetUserId : initiatorId;
    } else {
      // If neither is a student, we sort by ID to ensure session uniqueness regardless of who initiated
      studentId = Math.min(initiatorId, targetUserId);
      facultyId = Math.max(initiatorId, targetUserId);
    }

    const existingSession = await prisma.academicchatsession.findFirst({
      where: {
        studentid: studentId,
        facultyid: facultyId,
        courseofferingid: courseOfferingId || null,
      },
    });

    if (existingSession) {
      return existingSession;
    }

    return await prisma.academicchatsession.create({
      data: {
        studentid: studentId,
        facultyid: facultyId,
        courseofferingid: courseOfferingId || null,
        conversationtype: 'DIRECT'
      },
    });
  }

  /**
   * Sends a message in a session.
   */
  static async sendMessage(sessionId: number, senderId: number, messageText: string) {
    const session = await prisma.academicchatsession.findUnique({
      where: { sessionid: sessionId },
    });

    if (!session) {
      throw new AppError(404, 'Chat session not found');
    }

    if (session.studentid !== senderId && session.facultyid !== senderId) {
      throw new AppError(403, 'Not authorized to send messages in this session');
    }

    if (session.status !== 'ACTIVE') {
      throw new AppError(400, 'Cannot send messages to an inactive session');
    }

    const message = await prisma.academicchatmessage.create({
      data: {
        sessionid: sessionId,
        senderid: senderId,
        message: messageText,
        messagestate: 'SENT'
      },
      include: {
        sender: {
          select: USER_SELECT_BASIC,
        },
      },
    });

    await prisma.academicchatsession.update({
      where: { sessionid: sessionId },
      data: { updatedat: new Date() },
    });

    // Fire Message Sent Event
    eventBus.emit(AppEvents.MESSAGE_SENT, {
      messageId: message.messageid,
      sessionId: session.sessionid,
      senderId: senderId,
      content: messageText,
      conversationType: session.conversationtype
    });

    return message;
  }

  /**
   * Marks unread messages as read (SEEN).
   */
  static async markAsRead(sessionId: number, userId: number) {
    const session = await prisma.academicchatsession.findUnique({
      where: { sessionid: sessionId },
    });

    if (!session) throw new AppError(404, 'Chat session not found');

    if (session.studentid !== userId && session.facultyid !== userId) {
      throw new AppError(403, 'Not authorized');
    }

    await prisma.academicchatmessage.updateMany({
      where: {
        sessionid: sessionId,
        senderid: { not: userId },
        isread: false,
      },
      data: {
        isread: true,
        messagestate: 'SEEN'
      },
    });

    return { success: true };
  }

  /**
   * Soft deletes a message
   */
  static async deleteMessage(messageId: number, userId: number) {
    const message = await prisma.academicchatmessage.findUnique({
      where: { messageid: messageId }
    });

    if (!message) throw new AppError(404, 'Message not found');
    if (message.senderid !== userId) throw new AppError(403, 'Not authorized to delete this message');

    return await prisma.academicchatmessage.update({
      where: { messageid: messageId },
      data: { deletedat: new Date() }
    });
  }

  /**
   * Returns users that the requester can start a chat with.
   * Students → faculty/admin | Faculty → students | Admin → everyone
   */
  static async searchChatableUsers(requesterId: number, requesterRole: string, query: string) {
    let roleFilter: string[];
    if (requesterRole === 'STUDENT') {
      roleFilter = ['FACULTY'];
    } else if (requesterRole === 'ADMIN') {
      roleFilter = ['FACULTY', 'HR'];
    } else if (requesterRole === 'HR') {
      roleFilter = ['FACULTY', 'ADMIN'];
    } else if (requesterRole === 'FACULTY') {
      roleFilter = ['STUDENT', 'FACULTY', 'ADMIN', 'HR'];
    } else {
      roleFilter = [];
    }

    const users = await prisma.user.findMany({
      where: {
        userid: { not: requesterId },
        role: { in: roleFilter as any },
        accountStatus: 'ACTIVE',
        ...(query ? {
          OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ]
        } : {})
      },
      select: {
        userid: true,
        username: true,
        email: true,
        role: true,
      },
      take: 20,
      orderBy: { username: 'asc' },
    });

    return users;
  }
}
