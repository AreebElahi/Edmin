import { apiGet, apiPost, apiPatch } from '../../api/apiContract';

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
    return await apiGet<Complaint[]>(`/complaints?limit=${limit}&offset=${offset}`);
  }

  static async getComplaintById(id: number): Promise<Complaint> {
    return await apiGet<Complaint>(`/complaints/${id}`);
  }

  static async createComplaint(subject: string, description: string, priority: string = 'MEDIUM'): Promise<Complaint> {
    return await apiPost<Complaint>('/complaints', { subject, description, priority });
  }

  static async updateComplaintStatus(id: number, status: string): Promise<Complaint> {
    return await apiPatch<Complaint>(`/complaints/${id}/status`, { status });
  }

  static async assignComplaint(id: number, assigneeId: number): Promise<Complaint> {
    return await apiPatch<Complaint>(`/complaints/${id}/assign`, { assigneeId });
  }

  static async sendComplaintMessage(id: number, message: string): Promise<ComplaintMessage> {
    return await apiPost<ComplaintMessage>(`/complaints/${id}/messages`, { message });
  }
}
