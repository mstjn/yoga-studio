import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class UserService {
  async getById(id: number) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      const error = new Error('User not found') as Error & { status: number };
      error.status = 404;
      throw error;
    }
    return user;
  }

  async delete(requestingUserId: number, targetUserId: number) {
    if (requestingUserId !== targetUserId) {
      const error = new Error('You can only delete your own account') as Error & { status: number };
      error.status = 403;
      throw error;
    }
    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) {
      const error = new Error('User not found') as Error & { status: number };
      error.status = 404;
      throw error;
    }
    await prisma.user.delete({ where: { id: targetUserId } });
  }

  async promoteSelfToAdmin(userId: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      const error = new Error('User not found') as Error & { status: number };
      error.status = 404;
      throw error;
    }
    if (user.admin) return user;
    return prisma.user.update({ where: { id: userId }, data: { admin: true } });
  }
}
