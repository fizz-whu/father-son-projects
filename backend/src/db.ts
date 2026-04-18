import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { Project, Comment, User } from './types.js';

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
  return projects.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getProject(id: string): Promise<Project | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: PROJECTS_TABLE,
      Key: { id },
    })
  );
  return (result.Item as Project) || null;
}

export async function createProject(project: Project): Promise<Project> {
  await docClient.send(
    new PutCommand({
      TableName: PROJECTS_TABLE,
      Item: project,
    })
  );
  return project;
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
  return result.Attributes as Project;
}

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
