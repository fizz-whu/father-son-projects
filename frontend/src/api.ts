import type { Project, Comment, User, Phase, PhaseSubmission, ProjectSubmission, Notification, CommentType, Attachment } from './types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }
  return res.json();
}

export async function login(username: string, password: string): Promise<{ user: User; token: string }> {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function getProjects(): Promise<Project[]> {
  return request('/projects');
}

export async function getProject(id: string): Promise<Project> {
  return request(`/projects/${id}`);
}

export async function createProject(title: string, description: string, phases?: Partial<Phase>[]): Promise<Project> {
  return request('/projects', {
    method: 'POST',
    body: JSON.stringify({ title, description, phases }),
  });
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project> {
  return request(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function getComments(projectId: string): Promise<Comment[]> {
  return request(`/projects/${projectId}/comments`);
}

export async function createComment(
  projectId: string,
  content: string,
  commentType: CommentType = 'general',
  parentId?: string,
  phaseId?: string
): Promise<Comment> {
  return request(`/projects/${projectId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content, commentType, parentId, phaseId }),
  });
}

// Phase APIs
export async function createPhase(projectId: string, phase: Partial<Phase>): Promise<Phase> {
  return request(`/projects/${projectId}/phases`, {
    method: 'POST',
    body: JSON.stringify(phase),
  });
}

export async function updatePhase(projectId: string, phaseId: string, updates: Partial<Phase>): Promise<Phase> {
  return request(`/projects/${projectId}/phases/${phaseId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function submitPhase(
  projectId: string,
  phaseId: string,
  submission: { content: string; attachments: Attachment[] }
): Promise<PhaseSubmission> {
  return request(`/projects/${projectId}/phases/${phaseId}/submit`, {
    method: 'POST',
    body: JSON.stringify(submission),
  });
}

// Final submission APIs
export async function submitProject(
  projectId: string,
  submission: { content: string; attachments: Attachment[] }
): Promise<ProjectSubmission> {
  return request(`/projects/${projectId}/submit`, {
    method: 'POST',
    body: JSON.stringify(submission),
  });
}

export async function addFeedback(
  projectId: string,
  feedback: { content: string; grade?: string }
): Promise<ProjectSubmission> {
  return request(`/projects/${projectId}/feedback`, {
    method: 'POST',
    body: JSON.stringify(feedback),
  });
}

// Notification APIs
export async function getNotifications(): Promise<Notification[]> {
  return request('/notifications');
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  return request(`/notifications/${notificationId}/read`, {
    method: 'PUT',
  });
}

export async function markAllNotificationsRead(): Promise<void> {
  return request('/notifications/read-all', {
    method: 'PUT',
  });
}

// Comment read status
export async function markCommentRead(commentId: string): Promise<void> {
  return request(`/comments/${commentId}/read`, {
    method: 'PUT',
  });
}
