import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Demo user
  const passwordHash = await bcrypt.hash('Demo@1234', 12);
  const user = await prisma.user.upsert({
    where: { email: 'demo@resumeiq.com' },
    update: {},
    create: {
      name: 'Demo Recruiter',
      email: 'demo@resumeiq.com',
      passwordHash,
      role: 'RECRUITER',
    },
  });

  console.log(`✅ Created user: ${user.email}`);

  // Sample job description
  const jd = await prisma.jobDescription.create({
    data: {
      userId: user.id,
      title: 'Senior Full Stack Engineer',
      company: 'TechCorp Inc.',
      description: `We are looking for a Senior Full Stack Engineer to join our growing team.

Responsibilities:
- Design and implement scalable web applications using React and Node.js
- Work with PostgreSQL and Redis for data storage and caching
- Build and maintain RESTful APIs and GraphQL endpoints
- Collaborate with product managers and designers
- Mentor junior engineers and conduct code reviews
- Participate in system design discussions

Requirements:
- 5+ years of experience in full-stack development
- Proficiency in React, TypeScript, Node.js, and PostgreSQL
- Experience with cloud platforms (AWS/GCP/Azure)
- Strong understanding of system design and architecture
- Experience with Docker, Kubernetes, and CI/CD pipelines
- Excellent communication and problem-solving skills

Nice to have:
- Experience with GraphQL and microservices
- Knowledge of machine learning or AI/ML pipelines
- Open source contributions`,
      skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Redis', 'Docker', 'AWS', 'GraphQL'],
    },
  });

  console.log(`✅ Created job description: ${jd.title}`);
  console.log('\n📋 Demo credentials:');
  console.log('   Email: demo@resumeiq.com');
  console.log('   Password: Demo@1234');
  console.log('\n✨ Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
