export interface User {
  id: string;
  name: string;
  role: 'father' | 'son';
}

export interface Comment {
  id: string;
  projectId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: string;
  status: 'active' | 'completed';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
