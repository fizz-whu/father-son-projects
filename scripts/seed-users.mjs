import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { createHmac } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'first-principle-secret-key-change-in-prod';

function hashPassword(password) {
  return createHmac('sha256', JWT_SECRET).update(password).digest('hex');
}

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const users = [
  {
    id: 'qi',
    name: 'Qi',
    role: 'qi',
    passwordHash: hashPassword('qi123'),
  },
  {
    id: 'domi',
    name: 'Domi',
    role: 'domi',
    passwordHash: hashPassword('domi123'),
  },
];

async function seed() {
  console.log('Seeding users...');
  for (const user of users) {
    await docClient.send(
      new PutCommand({
        TableName: 'FatherSonUsers',
        Item: user,
      })
    );
    console.log(`Created user: ${user.id}`);
  }
  console.log('Done!');
  console.log('\nLogin credentials:');
  console.log('  Qi: username=qi, password=qi123');
  console.log('  Domi: username=domi, password=domi123');
}

seed().catch(console.error);
