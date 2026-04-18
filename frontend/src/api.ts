import type { Project, Comment, User } from './types';

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

export async function createProject(title: string, description: string): Promise<Project> {
  return request('/projects', {
    method: 'POST',
    body: JSON.stringify({ title, description }),
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

export async function createComment(projectId: string, content: string): Promise<Comment> {
  return request(`/projects/${projectId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}
