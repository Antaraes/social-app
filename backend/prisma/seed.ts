import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create sample users
  const hashedPassword = await bcrypt.hash('password123', 12);

  const user1 = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      password: hashedPassword,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: hashedPassword,
    },
  });

  // Create sample posts
  const post1 = await prisma.post.create({
    data: {
      title: 'Welcome to Social Media API',
      content: 'This is the first post on our platform!',
      userId: user1.id,
    },
  });

  const post2 = await prisma.post.create({
    data: {
      title: 'Another Great Post',
      content: 'Here is some amazing content to share with everyone.',
      userId: user2.id,
    },
  });

  // Create sample comments
  await prisma.comment.create({
    data: {
      content: 'Great post!',
      postId: post1.id,
      userId: user2.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Thanks for sharing!',
      postId: post2.id,
      userId: user1.id,
    },
  });

  // Create sample reactions
  await prisma.reaction.create({
    data: {
      type: 'LIKE',
      postId: post1.id,
      userId: user2.id,
    },
  });

  await prisma.reaction.create({
    data: {
      type: 'LOVE',
      postId: post2.id,
      userId: user1.id,
    },
  });

  console.log('Database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
