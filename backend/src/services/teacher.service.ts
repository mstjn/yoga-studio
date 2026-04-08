import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class TeacherService {
  async getAll() {
    return prisma.teacher.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: number) {
    const teacher = await prisma.teacher.findUnique({ where: { id } });
    if (!teacher) {
      const error = new Error('Teacher not found') as Error & { status: number };
      error.status = 404;
      throw error;
    }
    return teacher;
  }
}
