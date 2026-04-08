import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { TeacherService } from '../services/teacher.service';

const teacherService = new TeacherService();

export class TeacherController {
  async getAll(req: AuthRequest, res: Response) {
    const teachers = await teacherService.getAll();
    return res.status(200).json(teachers);
  }

  async getById(req: AuthRequest, res: Response) {
    const { id } = req.params as { id: string };
    const teacherId = parseInt(id);
    if (isNaN(teacherId)) return res.status(400).json({ message: 'Invalid teacher ID' });

    const teacher = await teacherService.getById(teacherId);
    return res.status(200).json(teacher);
  }
}
