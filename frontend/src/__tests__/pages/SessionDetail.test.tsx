import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, describe, it, beforeEach } from 'vitest';
import SessionDetail from '../../pages/SessionDetail';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
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

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const fakeUser = { id: 1, email: 'user@test.com', firstName: 'Test', lastName: 'User', admin: false };
const adminUser = { id: 1, email: 'admin@test.com', firstName: 'Admin', lastName: 'User', admin: true };

const fakeSession = {
  id: 1,
  name: 'Morning Yoga',
  date: '2026-04-11T08:00:00.000Z',
  description: 'A relaxing morning session',
  teacher: { id: 1, firstName: 'John', lastName: 'Doe' },
  users: [],
};

const renderWithId = (id: string) =>
  render(
    <MemoryRouter initialEntries={[`/sessions/${id}`]}>
      <Routes>
        <Route path="/sessions/:id" element={<SessionDetail />} />
      </Routes>
    </MemoryRouter>
  );

describe('SessionDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.getToken).mockReturnValue('fake-token');
  });

  describe('chargement', () => {
    it('affiche "Loading session..." pendant le chargement', () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(fakeUser);
      vi.mocked(api.get).mockReturnValue(new Promise(() => {}));

      renderWithId('1');

      expect(screen.getByText('Loading session...')).toBeInTheDocument();
    });

    it('affiche les informations de la session après chargement', async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(fakeUser);
      vi.mocked(api.get).mockResolvedValueOnce({ data: fakeSession });

      renderWithId('1');

      await waitFor(() => {
        expect(screen.getByText('Morning Yoga')).toBeInTheDocument();
        expect(screen.getByText('A relaxing morning session')).toBeInTheDocument();
      });
    });

    it('affiche une erreur si le chargement échoue', async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(fakeUser);
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Network error'));

      renderWithId('1');

      await waitFor(() => {
        expect(screen.getByText('Failed to load session details')).toBeInTheDocument();
      });
    });
  });

  describe('utilisateur non admin', () => {
    it("n'affiche pas les boutons Edit et Delete", async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(fakeUser);
      vi.mocked(api.get).mockResolvedValueOnce({ data: fakeSession });

      renderWithId('1');

      await waitFor(() => {
        expect(screen.getByText('Morning Yoga')).toBeInTheDocument();
      });

      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });

    it('affiche le bouton Join Session si non participant', async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(fakeUser);
      vi.mocked(api.get).mockResolvedValueOnce({ data: { ...fakeSession, users: [] } });

      renderWithId('1');

      await waitFor(() => {
        expect(screen.getByText('Join Session')).toBeInTheDocument();
      });
    });

    it('affiche le bouton Leave Session si déjà participant', async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(fakeUser);
      vi.mocked(api.get).mockResolvedValueOnce({ data: { ...fakeSession, users: [fakeUser.id] } });

      renderWithId('1');

      await waitFor(() => {
        expect(screen.getByText('Leave Session')).toBeInTheDocument();
      });
    });
  });

  describe('utilisateur admin', () => {
    it('affiche les boutons Edit et Delete', async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(adminUser);
      vi.mocked(api.get).mockResolvedValueOnce({ data: fakeSession });

      renderWithId('1');

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });
    });

    it("n'affiche pas les boutons Join/Leave", async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(adminUser);
      vi.mocked(api.get).mockResolvedValueOnce({ data: fakeSession });

      renderWithId('1');

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });

      expect(screen.queryByText('Join Session')).not.toBeInTheDocument();
      expect(screen.queryByText('Leave Session')).not.toBeInTheDocument();
    });
  });

  describe('participation', () => {
    it('appelle api.post au clic sur Join Session', async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(fakeUser);
      vi.mocked(api.get).mockResolvedValue({ data: { ...fakeSession, users: [] } });
      vi.mocked(api.post).mockResolvedValueOnce({});

      renderWithId('1');

      await waitFor(() => {
        expect(screen.getByText('Join Session')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Join Session'));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          `/session/1/participate/${fakeUser.id}`,
          {},
          expect.any(Object)
        );
      });
    });

    it('appelle api.delete au clic sur Leave Session', async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(fakeUser);
      vi.mocked(api.get).mockResolvedValue({ data: { ...fakeSession, users: [fakeUser.id] } });
      vi.mocked(api.delete).mockResolvedValueOnce({});

      renderWithId('1');

      await waitFor(() => {
        expect(screen.getByText('Leave Session')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Leave Session'));

      await waitFor(() => {
        expect(api.delete).toHaveBeenCalledWith(
          `/session/1/participate/${fakeUser.id}`,
          expect.any(Object)
        );
      });
    });
  });

  describe('participation - erreurs', () => {
    it('affiche une alerte si Join Session échoue', async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(fakeUser);
      vi.mocked(api.get).mockResolvedValue({ data: { ...fakeSession, users: [] } });
      vi.mocked(api.post).mockRejectedValueOnce(new Error('Server error'));
      vi.spyOn(window, 'alert').mockImplementation(() => {});

      renderWithId('1');

      await waitFor(() => {
        expect(screen.getByText('Join Session')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Join Session'));

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Failed to join session');
      });
    });

    it('affiche une alerte si Leave Session échoue', async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(fakeUser);
      vi.mocked(api.get).mockResolvedValue({ data: { ...fakeSession, users: [fakeUser.id] } });
      vi.mocked(api.delete).mockRejectedValueOnce(new Error('Server error'));
      vi.spyOn(window, 'alert').mockImplementation(() => {});

      renderWithId('1');

      await waitFor(() => {
        expect(screen.getByText('Leave Session')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Leave Session'));

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Failed to leave session');
      });
    });
  });

  describe('suppression', () => {
    it('affiche une alerte si la suppression échoue', async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(adminUser);
      vi.mocked(api.get).mockResolvedValueOnce({ data: fakeSession });
      vi.mocked(api.delete).mockRejectedValueOnce(new Error('Server error'));
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      vi.spyOn(window, 'alert').mockImplementation(() => {});

      renderWithId('1');

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Failed to delete session');
      });
    });

    it('supprime la session et redirige vers /sessions', async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(adminUser);
      vi.mocked(api.get).mockResolvedValueOnce({ data: fakeSession });
      vi.mocked(api.delete).mockResolvedValueOnce({});
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      renderWithId('1');

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/sessions');
      });
    });
  });
});
