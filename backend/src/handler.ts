import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { randomUUID } from 'crypto';
import * as db from './db.js';
import { createToken, verifyToken, verifyPassword } from './auth.js';
import { JwtPayload, Phase, CommentType } from './types.js';

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
      const phases: Phase[] = (body.phases || []).map((p: Partial<Phase>, index: number) => ({
        id: randomUUID(),
        projectId: '', // Will be set after project creation
        name: p.name || `Phase ${index + 1}`,
        description: p.description || '',
        order: p.order ?? index,
        status: p.status || 'pending',
        dueDate: p.dueDate,
      }));

      const projectId = randomUUID();
      const phasesWithProjectId = phases.map(p => ({ ...p, projectId }));

      const project = await db.createProject({
        id: projectId,
        title: body.title,
        description: body.description,
        createdBy: user.userId,
        createdAt: new Date().toISOString(),
        status: 'active',
        phases: phasesWithProjectId,
      });
      return response(201, project);
    }

    const projectId = pathParameters?.id;
    const phaseId = pathParameters?.phaseId;

    // Single project
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

    // Phase routes
    if (path.match(/^\/api\/projects\/[^/]+\/phases$/) && httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const project = await db.getProject(projectId!);
      if (!project) return response(404, { message: 'Project not found' });

      const newPhase: Phase = {
        id: randomUUID(),
        projectId: projectId!,
        name: body.name,
        description: body.description || '',
        order: body.order ?? project.phases.length,
        status: 'pending',
        dueDate: body.dueDate,
      };

      const updated = await db.addPhase(projectId!, newPhase);
      if (!updated) return response(404, { message: 'Project not found' });
      return response(201, newPhase);
    }

    if (path.match(/^\/api\/projects\/[^/]+\/phases\/[^/]+$/) && httpMethod === 'PUT') {
      const body = JSON.parse(event.body || '{}');
      const updated = await db.updatePhase(projectId!, phaseId!, body);
      if (!updated) return response(404, { message: 'Project or phase not found' });
      const updatedPhase = updated.phases.find(p => p.id === phaseId);
      return response(200, updatedPhase);
    }

    if (path.match(/^\/api\/projects\/[^/]+\/phases\/[^/]+\/submit$/) && httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const updated = await db.submitPhase(projectId!, phaseId!, {
        id: randomUUID(),
        content: body.content,
        attachments: body.attachments || [],
        submittedAt: new Date().toISOString(),
        submittedBy: user.userId,
      });
      if (!updated) return response(404, { message: 'Project or phase not found' });
      const updatedPhase = updated.phases.find(p => p.id === phaseId);
      return response(200, updatedPhase?.submission);
    }

    // Project submission
    if (path.match(/^\/api\/projects\/[^/]+\/submit$/) && httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const submission = {
        id: randomUUID(),
        projectId: projectId!,
        content: body.content,
        attachments: body.attachments || [],
        submittedAt: new Date().toISOString(),
        submittedBy: user.userId,
      };
      const updated = await db.submitProject(projectId!, submission);
      if (!updated) return response(404, { message: 'Project not found' });
      return response(200, updated.finalSubmission);
    }

    // Feedback
    if (path.match(/^\/api\/projects\/[^/]+\/feedback$/) && httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const updated = await db.addFeedback(projectId!, body.content, body.grade);
      if (!updated) return response(404, { message: 'Project or submission not found' });
      return response(200, updated.finalSubmission);
    }

    // Comments
    if (path.match(/^\/api\/projects\/[^/]+\/comments$/) && httpMethod === 'GET') {
      const comments = await db.getComments(projectId!);
      return response(200, comments);
    }

    if (path.match(/^\/api\/projects\/[^/]+\/comments$/) && httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const commentType: CommentType = body.commentType || 'general';
      const comment = await db.createComment({
        id: randomUUID(),
        projectId: projectId!,
        phaseId: body.phaseId,
        authorId: user.userId,
        authorName: user.name,
        content: body.content,
        commentType,
        parentId: body.parentId,
        createdAt: new Date().toISOString(),
        isRead: false,
      });
      return response(201, comment);
    }

    // Mark comment as read
    if (path.match(/^\/api\/comments\/[^/]+\/read$/) && httpMethod === 'PUT') {
      const commentId = pathParameters?.id;
      // Note: This needs projectId to work properly with DynamoDB
      // For now, return success - the frontend tracks read status locally
      return response(200, { success: true });
    }

    return response(404, { message: 'Not found' });
  } catch (error) {
    console.error('Error:', error);
    return response(500, { message: 'Internal server error' });
  }
}
