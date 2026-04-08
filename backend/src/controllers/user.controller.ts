import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { UserService } from '../services/user.service';

const userService = new UserService();

export class UserController {
  async getById(req: AuthRequest, res: Response) {
    const { id } = req.params as { id: string };
    const userId = parseInt(id);
    if (isNaN(userId)) return res.status(400).json({ message: 'Invalid user ID' });

    const user = await userService.getById(userId);
    return res.status(200).json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      admin: user.admin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  async delete(req: AuthRequest, res: Response) {
    const { id } = req.params as { id: string };
    const userId = parseInt(id);
    if (isNaN(userId)) return res.status(400).json({ message: 'Invalid user ID' });

    await userService.delete(req.userId!, userId);
    return res.status(200).json({ message: 'User deleted successfully' });
  }

  async promoteSelfToAdmin(req: AuthRequest, res: Response) {
    const isDev = (process.env.NODE_ENV || 'development') === 'development';
    if (!isDev) return res.status(403).json({ message: 'Admin self-promotion is only available in development' });

    const user = await userService.promoteSelfToAdmin(req.userId!);
    return res.status(200).json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      admin: user.admin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }
}
