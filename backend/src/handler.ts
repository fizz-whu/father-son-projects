import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { randomUUID } from 'crypto';
import * as db from './db.js';
import { createToken, verifyToken, verifyPassword } from './auth.js';
import { JwtPayload } from './types.js';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

function response(statusCode: number, body: unknown): APIGatewayProxyResult {
  return { statusCode, headers, body: JSON.stringify(body) };
}

function getUser(event: APIGatewayProxyEvent): JwtPayload | null {
  const auth = event.headers.Authorization || event.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  return verifyToken(auth.slice(7));
}

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const { httpMethod, path, pathParameters } = event;

  if (httpMethod === 'OPTIONS') {
    return response(200, {});
  }

  try {
    // Auth routes
    if (path === '/api/auth/login' && httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { username, password } = body;

      if (!username || !password) {
        return response(400, { message: 'Username and password required' });
      }

      const user = await db.getUser(username);
      if (!user || !verifyPassword(password, user.passwordHash)) {
        return response(401, { message: 'Invalid credentials' });
      }

      const token = createToken({
        userId: user.id,
        name: user.name,
        role: user.role,
      });

      return response(200, {
        user: { id: user.id, name: user.name, role: user.role },
        token,
      });
    }

    // Protected routes
    const user = getUser(event);
    if (!user) {
      return response(401, { message: 'Unauthorized' });
    }

    // Projects
    if (path === '/api/projects' && httpMethod === 'GET') {
      const projects = await db.getProjects();
      return response(200, projects);
    }

    if (path === '/api/projects' && httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const project = await db.createProject({
        id: randomUUID(),
        title: body.title,
        description: body.description,
        createdBy: user.userId,
        createdAt: new Date().toISOString(),
        status: 'active',
      });
      return response(201, project);
    }

    const projectId = pathParameters?.id;

    if (path.match(/^\/api\/projects\/[^/]+$/) && httpMethod === 'GET') {
      const project = await db.getProject(projectId!);
      if (!project) return response(404, { message: 'Project not found' });
      return response(200, project);
    }

    if (path.match(/^\/api\/projects\/[^/]+$/) && httpMethod === 'PUT') {
      const body = JSON.parse(event.body || '{}');
      const project = await db.updateProject(projectId!, body);
      if (!project) return response(404, { message: 'Project not found' });
      return response(200, project);
    }

    // Comments
    if (path.match(/^\/api\/projects\/[^/]+\/comments$/) && httpMethod === 'GET') {
      const comments = await db.getComments(projectId!);
      return response(200, comments);
    }

    if (path.match(/^\/api\/projects\/[^/]+\/comments$/) && httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const comment = await db.createComment({
        id: randomUUID(),
        projectId: projectId!,
        authorId: user.userId,
        authorName: user.name,
        content: body.content,
        createdAt: new Date().toISOString(),
      });
      return response(201, comment);
    }

    return response(404, { message: 'Not found' });
  } catch (error) {
    console.error('Error:', error);
    return response(500, { message: 'Internal server error' });
  }
}
