import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { Project, Comment, User, Phase, ProjectSubmission, CommentType, Attachment } from './types.js';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const PROJECTS_TABLE = process.env.PROJECTS_TABLE || 'FatherSonProjects';
const COMMENTS_TABLE = process.env.COMMENTS_TABLE || 'FatherSonComments';
const USERS_TABLE = process.env.USERS_TABLE || 'FatherSonUsers';

export async function getUser(username: string): Promise<User | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: USERS_TABLE,
      Key: { id: username },
    })
  );
  return (result.Item as User) || null;
}

export async function getProjects(): Promise<Project[]> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: PROJECTS_TABLE,
    })
  );
  const projects = (result.Items as Project[]) || [];
  // Ensure phases array exists
  return projects
    .map(p => ({ ...p, phases: p.phases || [] }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getProject(id: string): Promise<Project | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: PROJECTS_TABLE,
      Key: { id },
    })
  );
  if (!result.Item) return null;
  const project = result.Item as Project;
  return { ...project, phases: project.phases || [] };
}

export async function createProject(project: Omit<Project, 'phases'> & { phases?: Phase[] }): Promise<Project> {
  const fullProject: Project = {
    ...project,
    phases: project.phases || [],
  };
  await docClient.send(
    new PutCommand({
      TableName: PROJECTS_TABLE,
      Item: fullProject,
    })
  );
  return fullProject;
}

export async function updateProject(
  id: string,
  updates: Partial<Project>
): Promise<Project | null> {
  const updateExpressions: string[] = [];
  const expressionNames: Record<string, string> = {};
  const expressionValues: Record<string, unknown> = {};

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id') {
      updateExpressions.push(`#${key} = :${key}`);
      expressionNames[`#${key}`] = key;
      expressionValues[`:${key}`] = value;
    }
  });

  if (updateExpressions.length === 0) return getProject(id);

  const result = await docClient.send(
    new UpdateCommand({
      TableName: PROJECTS_TABLE,
      Key: { id },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionNames,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: 'ALL_NEW',
    })
  );
  const project = result.Attributes as Project;
  return { ...project, phases: project.phases || [] };
}

// Phase management
export async function addPhase(projectId: string, phase: Phase): Promise<Project | null> {
  const project = await getProject(projectId);
  if (!project) return null;

  const phases = [...project.phases, phase].sort((a, b) => a.order - b.order);
  return updateProject(projectId, { phases });
}

export async function updatePhase(projectId: string, phaseId: string, updates: Partial<Phase>): Promise<Project | null> {
  const project = await getProject(projectId);
  if (!project) return null;

  const phases = project.phases.map(p =>
    p.id === phaseId ? { ...p, ...updates } : p
  );
  return updateProject(projectId, { phases });
}

export async function submitPhase(
  projectId: string,
  phaseId: string,
  submission: { id: string; content: string; attachments: Attachment[]; submittedAt: string; submittedBy: string }
): Promise<Project | null> {
  const project = await getProject(projectId);
  if (!project) return null;

  const phases = project.phases.map(p =>
    p.id === phaseId
      ? {
          ...p,
          status: 'submitted' as const,
          submission: { ...submission, phaseId },
        }
      : p
  );
  return updateProject(projectId, { phases });
}

// Project submission
export async function submitProject(
  projectId: string,
  submission: ProjectSubmission
): Promise<Project | null> {
  return updateProject(projectId, { finalSubmission: submission });
}

export async function addFeedback(
  projectId: string,
  feedback: string,
  grade?: string
): Promise<Project | null> {
  const project = await getProject(projectId);
  if (!project || !project.finalSubmission) return null;

  const updatedSubmission: ProjectSubmission = {
    ...project.finalSubmission,
    feedback,
    grade,
  };
  return updateProject(projectId, {
    finalSubmission: updatedSubmission,
    status: 'completed',
  });
}

// Comments
export async function getComments(projectId: string): Promise<Comment[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: COMMENTS_TABLE,
      KeyConditionExpression: 'projectId = :projectId',
      ExpressionAttributeValues: {
        ':projectId': projectId,
      },
    })
  );
  const comments = (result.Items as Comment[]) || [];
  return comments.sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export async function createComment(comment: Comment): Promise<Comment> {
  await docClient.send(
    new PutCommand({
      TableName: COMMENTS_TABLE,
      Item: comment,
    })
  );
  return comment;
}

export async function markCommentRead(projectId: string, commentId: string): Promise<Comment | null> {
  const result = await docClient.send(
    new UpdateCommand({
      TableName: COMMENTS_TABLE,
      Key: { projectId, id: commentId },
      UpdateExpression: 'SET isRead = :isRead',
      ExpressionAttributeValues: { ':isRead': true },
      ReturnValues: 'ALL_NEW',
    })
  );
  return result.Attributes as Comment;
}
