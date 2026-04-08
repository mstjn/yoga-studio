import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt.util';

const prisma = new PrismaClient();

export class AuthService {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const error = new Error('Invalid credentials') as Error & { status: number };
      error.status = 401;
      throw error;
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      const error = new Error('Invalid credentials') as Error & { status: number };
      error.status = 401;
      throw error;
    }
    const token = generateToken(user.id);
    return { ...user, token };
  }

  async register(email: string, password: string, firstName: string, lastName: string) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const error = new Error('Email already exists') as Error & { status: number };
      error.status = 400;
      throw error;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, firstName, lastName, admin: false },
    });
    const token = generateToken(user.id);
    return { ...user, token };
  }
}
