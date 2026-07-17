import { apiClient } from '../../api/apiClient';

export interface AcademicChatUser {
  userid: number;
  username: string;
  email: string;
  role: string;
  avatar: string | null;
}

export interface AcademicChatMessage {
  messageid: number;
  sessionid: number;
  senderid: number;
  message: string;
  isread: boolean;
  messagestate: 'SENT' | 'DELIVERED' | 'SEEN';
  sentat: string;
  sender: AcademicChatUser;
  deletedat?: string;
}

export interface AcademicChatSession {
  sessionid: number;
  studentid: number;
  facultyid: number;
  courseofferingid: number | null;
  status: string;
  conversationtype: 'DIRECT' | 'GROUP' | 'TICKET_LINKED';
  createdat: string;
  updatedat: string;
  student: AcademicChatUser;
  faculty: AcademicChatUser;
  courseoffering: {
    courseofferingid: number;
    course: { code: string; name: string };
  } | null;
  messages?: AcademicChatMessage[];
}

export interface ChatableUser {
  userid: number;
  username: string;
  email: string;
  role: string;
}

export class AcademicChatService {
  /**
   * Retrieves all chat sessions for the logged-in user.
   */
  static async getSessions(): Promise<AcademicChatSession[]> {
    const response = await apiClient.get('/academic-chat/sessions');
    return response.data;
  }

  /**
   * Searches for users the current user can chat with.
   */
  static async searchUsers(query: string): Promise<ChatableUser[]> {
    const response = await apiClient.get(`/academic-chat/users/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }

  /**
   * Retrieves a specific chat session with its full message history.
   */
  static async getSession(sessionId: number, limit = 50, offset = 0): Promise<AcademicChatSession> {
    const response = await apiClient.get(`/academic-chat/sessions/${sessionId}?limit=${limit}&offset=${offset}`);
    return response.data;
  }

  /**
   * Initializes a new session or returns an existing one.
   */
  static async createSession(targetUserId: number, courseOfferingId?: number): Promise<AcademicChatSession> {
    const response = await apiClient.post('/academic-chat/sessions', {
      targetUserId,
      courseOfferingId,
    });
    return response.data;
  }

  /**
   * Sends a message in a session.
   */
  static async sendMessage(sessionId: number, message: string): Promise<AcademicChatMessage> {
    const response = await apiClient.post(`/academic-chat/sessions/${sessionId}/messages`, {
      message,
    });
    return response.data;
  }

  /**
   * Marks unread messages as read in a session.
   */
  static async markAsRead(sessionId: number): Promise<{ success: boolean }> {
    const response = await apiClient.patch(`/academic-chat/sessions/${sessionId}/read`);
    return response.data;
  }

  /**
   * Soft deletes a message
   */
  static async deleteMessage(messageId: number): Promise<{ success: boolean }> {
    const response = await apiClient.delete(`/academic-chat/messages/${messageId}`);
    return response.data;
  }
}
