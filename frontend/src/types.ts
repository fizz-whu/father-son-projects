export interface User {
  id: string;
  name: string;
  role: 'qi' | 'domi';
}

export type CommentType = 'feedback' | 'question' | 'general';

export interface Comment {
  id: string;
  projectId: string;
  phaseId?: string;
  authorId: string;
  authorName: string;
  content: string;
  commentType: CommentType;
  parentId?: string;
  createdAt: string;
  isRead?: boolean;
}

export interface Attachment {
  id: string;
  title: string;
  url: string;
  type: 'google-doc' | 'github' | 'link' | 'file';
  addedAt: string;
}

export interface PhaseSubmission {
  id: string;
  phaseId: string;
  content: string;
  attachments: Attachment[];
  submittedAt: string;
  submittedBy: string;
}

export interface Phase {
  id: string;
  projectId: string;
  name: string;
  description: string;
  order: number;
  status: 'pending' | 'in_progress' | 'submitted' | 'completed';
  dueDate?: string;
  submission?: PhaseSubmission;
  comments: Comment[];
}

export interface ProjectSubmission {
  id: string;
  projectId: string;
  content: string;
  attachments: Attachment[];
  submittedAt: string;
  submittedBy: string;
  feedback?: string;
  grade?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: string;
  status: 'active' | 'completed';
  phases: Phase[];
  finalSubmission?: ProjectSubmission;
}

export interface Notification {
  id: string;
  type: 'comment' | 'feedback' | 'submission';
  message: string;
  projectId: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
