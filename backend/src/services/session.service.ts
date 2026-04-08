import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sessionInclude = {
  teacher: true,
  participants: { include: { user: true } },
};

export class SessionService {
  async getAll() {
    return prisma.session.findMany({ include: sessionInclude });
  }

  async getById(id: number) {
    const session = await prisma.session.findUnique({ where: { id }, include: sessionInclude });
    if (!session) {
      const error = new Error('Session not found') as Error & { status: number };
      error.status = 404;
      throw error;
    }
    return session;
  }

  async create(data: { name: string; date: string; description: string; teacherId: number }, requestingUserId: number) {
    const user = await prisma.user.findUnique({ where: { id: requestingUserId } });
    if (!user || !user.admin) {
      const error = new Error('Admin access required') as Error & { status: number };
      error.status = 403;
      throw error;
    }
    const teacher = await prisma.teacher.findUnique({ where: { id: data.teacherId } });
    if (!teacher) {
      const error = new Error('Teacher not found') as Error & { status: number };
      error.status = 404;
      throw error;
    }
    return prisma.session.create({
      data: { ...data, date: new Date(data.date) },
      include: sessionInclude,
    });
  }

  async update(id: number, data: Partial<{ name: string; date: string; description: string; teacherId: number }>, requestingUserId: number) {
    const user = await prisma.user.findUnique({ where: { id: requestingUserId } });
    if (!user || !user.admin) {
      const error = new Error('Admin access required') as Error & { status: number };
      error.status = 403;
      throw error;
    }
    const session = await prisma.session.findUnique({ where: { id } });
    if (!session) {
      const error = new Error('Session not found') as Error & { status: number };
      error.status = 404;
      throw error;
    }
    if (data.teacherId) {
      const teacher = await prisma.teacher.findUnique({ where: { id: data.teacherId } });
      if (!teacher) {
        const error = new Error('Teacher not found') as Error & { status: number };
        error.status = 404;
        throw error;
      }
    }
    const updateData: any = { ...data, ...(data.date && { date: new Date(data.date) }) };
    return prisma.session.update({ where: { id }, data: updateData, include: sessionInclude });
  }

  async delete(id: number, requestingUserId: number) {
    const user = await prisma.user.findUnique({ where: { id: requestingUserId } });
    if (!user || !user.admin) {
      const error = new Error('Admin access required') as Error & { status: number };
      error.status = 403;
      throw error;
    }
    const session = await prisma.session.findUnique({ where: { id } });
    if (!session) {
      const error = new Error('Session not found') as Error & { status: number };
      error.status = 404;
      throw error;
    }
    await prisma.session.delete({ where: { id } });
  }

  async participate(sessionId: number, userId: number) {
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) {
      const error = new Error('Session not found') as Error & { status: number };
      error.status = 404;
      throw error;
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      const error = new Error('User not found') as Error & { status: number };
      error.status = 404;
      throw error;
    }
    const existing = await prisma.sessionParticipation.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
    });
    if (existing) {
      const error = new Error('User already participating in this session') as Error & { status: number };
      error.status = 400;
      throw error;
    }
    await prisma.sessionParticipation.create({ data: { sessionId, userId } });
  }

  async unparticipate(sessionId: number, userId: number) {
    const participation = await prisma.sessionParticipation.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
    });
    if (!participation) {
      const error = new Error('Participation not found') as Error & { status: number };
      error.status = 404;
      throw error;
    }
    await prisma.sessionParticipation.delete({
      where: { sessionId_userId: { sessionId, userId } },
    });
  }
}
