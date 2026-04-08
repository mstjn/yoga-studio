import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { SessionService } from '../services/session.service';

const sessionService = new SessionService();

const formatSession = (session: any) => ({
  id: session.id,
  name: session.name,
  date: session.date,
  description: session.description,
  teacher: {
    id: session.teacher.id,
    firstName: session.teacher.firstName,
    lastName: session.teacher.lastName,
  },
  users: session.participants.map((p: any) => p.user.id),
  createdAt: session.createdAt,
  updatedAt: session.updatedAt,
});

export class SessionController {
  async getAll(req: AuthRequest, res: Response) {
    const sessions = await sessionService.getAll();
    return res.status(200).json(sessions.map(formatSession));
  }

  async getById(req: AuthRequest, res: Response) {
    const { id } = req.params as { id: string };
    const sessionId = parseInt(id);
    if (isNaN(sessionId)) return res.status(400).json({ message: 'Invalid session ID' });

    const session = await sessionService.getById(sessionId);
    return res.status(200).json(formatSession(session));
  }

  async create(req: AuthRequest, res: Response) {
    const { name, date, description, teacherId } = req.body;

    if (!name) return res.status(400).json({ message: 'Name is required' });
    if (!date) return res.status(400).json({ message: 'Date is required' });
    if (!description) return res.status(400).json({ message: 'Description is required' });
    if (!teacherId) return res.status(400).json({ message: 'Teacher ID is required' });

    const session = await sessionService.create({ name, date, description, teacherId }, req.userId!);
    return res.status(201).json(formatSession(session));
  }

  async update(req: AuthRequest, res: Response) {
    const { id } = req.params as { id: string };
    const sessionId = parseInt(id);
    if (isNaN(sessionId)) return res.status(400).json({ message: 'Invalid session ID' });

    const { name, date, description, teacherId } = req.body;
    const session = await sessionService.update(sessionId, { name, date, description, teacherId }, req.userId!);
    return res.status(200).json(formatSession(session));
  }

  async delete(req: AuthRequest, res: Response) {
    const { id } = req.params as { id: string };
    const sessionId = parseInt(id);
    if (isNaN(sessionId)) return res.status(400).json({ message: 'Invalid session ID' });

    await sessionService.delete(sessionId, req.userId!);
    return res.status(200).json({ message: 'Session deleted successfully' });
  }

  async participate(req: AuthRequest, res: Response) {
    const { id, userId } = req.params as { id: string; userId: string };
    const sessionId = parseInt(id);
    const participantId = parseInt(userId);

    if (isNaN(sessionId)) return res.status(400).json({ message: 'Invalid session ID' });
    if (isNaN(participantId)) return res.status(400).json({ message: 'Invalid user ID' });

    await sessionService.participate(sessionId, participantId);
    return res.status(200).json({ message: 'Successfully joined the session' });
  }

  async unparticipate(req: AuthRequest, res: Response) {
    const { id, userId } = req.params as { id: string; userId: string };
    const sessionId = parseInt(id);
    const participantId = parseInt(userId);

    if (isNaN(sessionId)) return res.status(400).json({ message: 'Invalid session ID' });
    if (isNaN(participantId)) return res.status(400).json({ message: 'Invalid user ID' });

    await sessionService.unparticipate(sessionId, participantId);
    return res.status(200).json({ message: 'Successfully left the session' });
  }
}
