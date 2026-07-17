import { apiClient } from '../../api/apiClient';

export interface ComplaintUser {
  userid: number;
  username: string;
  role: string;
}

export interface ComplaintMessage {
  complaintmessageid: number;
  complaintid: number;
  senderid: number;
  message: string;
  sentat: string;
  sender: ComplaintUser;
}

export interface ComplaintAuditLog {
  id: number;
  action: string;
  oldvalue?: string;
  newvalue?: string;
  createdat: string;
  user: {
    username: string;
    role: string;
  }
}

export interface Complaint {
  complaintid: number;
  tokenid: string;
  createdbyid: number;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  sladuedate?: string;
  createdat: string;
  updatedat: string;
  createdby: ComplaintUser;
  assignedto?: ComplaintUser;
  messages?: ComplaintMessage[];
  audit_logs?: ComplaintAuditLog[];
}

export class ComplaintService {
  static async getComplaints(limit = 50, offset = 0): Promise<Complaint[]> {
    const response = await apiClient.get(`/complaints?limit=${limit}&offset=${offset}`);
    return response.data;
  }

  static async getComplaintById(id: number): Promise<Complaint> {
    const response = await apiClient.get(`/complaints/${id}`);
    return response.data;
  }

  static async createComplaint(subject: string, description: string, priority: string = 'MEDIUM'): Promise<Complaint> {
    const response = await apiClient.post('/complaints', { subject, description, priority });
    return response.data;
  }

  static async updateComplaintStatus(id: number, status: string): Promise<Complaint> {
    const response = await apiClient.patch(`/complaints/${id}/status`, { status });
    return response.data;
  }

  static async assignComplaint(id: number, assigneeId: number): Promise<Complaint> {
    const response = await apiClient.patch(`/complaints/${id}/assign`, { assigneeId });
    return response.data;
  }

  static async sendComplaintMessage(id: number, message: string): Promise<ComplaintMessage> {
    const response = await apiClient.post(`/complaints/${id}/messages`, { message });
    return response.data;
  }
}
