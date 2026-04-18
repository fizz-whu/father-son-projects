import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { createHmac } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-production-please';

function hashPassword(password) {
  return createHmac('sha256', JWT_SECRET).update(password).digest('hex');
}

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const users = [
  {
    id: 'father',
    name: 'Dad',
    role: 'father',
    passwordHash: hashPassword('father123'),
  },
  {
    id: 'son',
    name: 'Son',
    role: 'son',
    passwordHash: hashPassword('son123'),
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
  console.log('  Father: username=father, password=father123');
  console.log('  Son: username=son, password=son123');
}

seed().catch(console.error);
