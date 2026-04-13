import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, beforeEach } from 'vitest';
import Sessions from '../../pages/Sessions';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../services/auth.service', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    getToken: vi.fn(),
  },
}));

import api from '../../services/api';
import { authService } from '../../services/auth.service';

const fakeUser = { id: 1, email: 'user@test.com', firstName: 'Test', lastName: 'User', admin: false };
const adminUser = { id: 1, email: 'admin@test.com', firstName: 'Admin', lastName: 'User', admin: true };

const fakeSessions = [
  {
    id: 1,
    name: 'Morning Yoga',
    date: '2026-04-11T08:00:00.000Z',
    description: 'A relaxing morning session',
    teacher: { id: 1, firstName: 'John', lastName: 'Doe' },
    users: [],
  },
];

describe('Sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.getToken).mockReturnValue('fake-token');
  });

  describe('chargement', () => {
    it('affiche "Loading sessions..." pendant le chargement', () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(fakeUser);
      vi.mocked(api.get).mockReturnValue(new Promise(() => {}));

      render(<MemoryRouter><Sessions /></MemoryRouter>);

      expect(screen.getByText('Loading sessions...')).toBeInTheDocument();
    });

    it('affiche la liste des sessions après chargement', async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(fakeUser);
      vi.mocked(api.get).mockResolvedValueOnce({ data: fakeSessions });

      render(<MemoryRouter><Sessions /></MemoryRouter>);

      await waitFor(() => {
        expect(screen.getByText('Morning Yoga')).toBeInTheDocument();
      });
    });

    it('affiche "No sessions available" si la liste est vide', async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(fakeUser);
      vi.mocked(api.get).mockResolvedValueOnce({ data: [] });

      render(<MemoryRouter><Sessions /></MemoryRouter>);

      await waitFor(() => {
        expect(screen.getByText('No sessions available')).toBeInTheDocument();
      });
    });

    it('affiche une erreur si le chargement échoue', async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(fakeUser);
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Network error'));

      render(<MemoryRouter><Sessions /></MemoryRouter>);

      await waitFor(() => {
        expect(screen.getByText('Failed to load sessions')).toBeInTheDocument();
      });
    });
  });

  describe('utilisateur non admin', () => {
    it("n'affiche pas le bouton Create Session", async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(fakeUser);
      vi.mocked(api.get).mockResolvedValueOnce({ data: fakeSessions });

      render(<MemoryRouter><Sessions /></MemoryRouter>);

      await waitFor(() => {
        expect(screen.getByText('Morning Yoga')).toBeInTheDocument();
      });

      expect(screen.queryByText('Create Session')).not.toBeInTheDocument();
    });

    it("n'affiche pas le bouton Delete sur les sessions", async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(fakeUser);
      vi.mocked(api.get).mockResolvedValueOnce({ data: fakeSessions });

      render(<MemoryRouter><Sessions /></MemoryRouter>);

      await waitFor(() => {
        expect(screen.getByText('Morning Yoga')).toBeInTheDocument();
      });

      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });
  });

  describe('utilisateur admin', () => {
    it('affiche le bouton Create Session', async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(adminUser);
      vi.mocked(api.get).mockResolvedValueOnce({ data: fakeSessions });

      render(<MemoryRouter><Sessions /></MemoryRouter>);

      await waitFor(() => {
        expect(screen.getByText('Create Session')).toBeInTheDocument();
      });
    });

    it('affiche le bouton Delete sur chaque session', async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(adminUser);
      vi.mocked(api.get).mockResolvedValueOnce({ data: fakeSessions });

      render(<MemoryRouter><Sessions /></MemoryRouter>);

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });
    });
  });

  describe('suppression', () => {
    it('supprime une session après confirmation', async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(adminUser);
      vi.mocked(api.get).mockResolvedValue({ data: fakeSessions });
      vi.mocked(api.delete).mockResolvedValueOnce({});
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<MemoryRouter><Sessions /></MemoryRouter>);

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(api.delete).toHaveBeenCalledWith('/session/1', expect.any(Object));
      });
    });

    it('affiche une alerte si la suppression échoue', async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(adminUser);
      vi.mocked(api.get).mockResolvedValue({ data: fakeSessions });
      vi.mocked(api.delete).mockRejectedValueOnce(new Error('Delete failed'));
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<MemoryRouter><Sessions /></MemoryRouter>);

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to delete session');
      });
    });

    it('ne charge pas les sessions si l\'erreur est une CanceledError', async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(fakeUser);
      const canceledError = Object.assign(new Error('canceled'), { name: 'CanceledError' });
      vi.mocked(api.get).mockRejectedValueOnce(canceledError);

      render(<MemoryRouter><Sessions /></MemoryRouter>);

      await waitFor(() => {
        expect(screen.queryByText('Failed to load sessions')).not.toBeInTheDocument();
      });
    });
  });
});
