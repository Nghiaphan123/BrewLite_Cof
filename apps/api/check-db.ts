import { PrismaClient } from './src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

async function main() {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: 'postgresql://brewlite:change-me-local@localhost:5432/brewlite' }) });
  const users = await prisma.user.findMany();
  console.log('USERS IN DB:', users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role })));
  await prisma.$disconnect();
}
main().catch(console.error);

