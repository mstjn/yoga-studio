import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, describe, it, beforeEach } from 'vitest';
import SessionForm from '../../pages/SessionForm';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
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

const adminUser = { id: 1, email: 'admin@test.com', firstName: 'Admin', lastName: 'User', admin: true };
const fakeUser = { id: 2, email: 'user@test.com', firstName: 'Test', lastName: 'User', admin: false };

const fakeTeachers = [
  { id: 1, firstName: 'John', lastName: 'Doe' },
];

const fakeSession = {
  id: 1,
  name: 'Morning Yoga',
  date: '2026-04-11T08:00:00.000Z',
  description: 'A relaxing morning session',
  teacher: { id: 1, firstName: 'John', lastName: 'Doe' },
  users: [],
};

const renderCreateMode = () =>
  render(
    <MemoryRouter initialEntries={['/sessions/create']}>
      <Routes>
        <Route path="/sessions/create" element={<SessionForm />} />
      </Routes>
    </MemoryRouter>
  );

const renderEditMode = (id: string) =>
  render(
    <MemoryRouter initialEntries={[`/sessions/edit/${id}`]}>
      <Routes>
        <Route path="/sessions/edit/:id" element={<SessionForm />} />
      </Routes>
    </MemoryRouter>
  );

describe('SessionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.getToken).mockReturnValue('fake-token');
  });

  describe('mode création', () => {
    it('affiche le titre "Create New Session"', async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(adminUser);
      vi.mocked(api.get).mockResolvedValueOnce({ data: fakeTeachers });

      renderCreateMode();

      expect(screen.getByText('Create New Session')).toBeInTheDocument();
    });

    it('affiche les champs name, date, teacher, description', async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(adminUser);
      vi.mocked(api.get).mockResolvedValueOnce({ data: fakeTeachers });

      renderCreateMode();

      expect(screen.getByText('Session Name')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Teacher')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('crée une session et redirige vers /sessions', async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(adminUser);
      vi.mocked(api.get).mockResolvedValueOnce({ data: fakeTeachers });
      vi.mocked(api.post).mockResolvedValueOnce({ data: fakeSession });

      const { container } = renderCreateMode();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.change(container.querySelector('input[name="name"]')!, { target: { value: 'Morning Yoga' } });
      fireEvent.change(container.querySelector('input[name="date"]')!, { target: { value: '2026-04-11' } });
      fireEvent.change(container.querySelector('select[name="teacherId"]')!, { target: { value: '1' } });
      fireEvent.change(container.querySelector('textarea[name="description"]')!, { target: { value: 'A relaxing morning session' } });
      fireEvent.click(screen.getByRole('button', { name: /create session/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/sessions');
      });
    });

    it('affiche une erreur si la création échoue', async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(adminUser);
      vi.mocked(api.get).mockResolvedValueOnce({ data: fakeTeachers });
      vi.mocked(api.post).mockRejectedValueOnce({ response: { data: { message: 'Failed to create session' } } });

      const { container } = renderCreateMode();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.change(container.querySelector('input[name="name"]')!, { target: { value: 'Morning Yoga' } });
      fireEvent.change(container.querySelector('input[name="date"]')!, { target: { value: '2026-04-11' } });
      fireEvent.change(container.querySelector('select[name="teacherId"]')!, { target: { value: '1' } });
      fireEvent.change(container.querySelector('textarea[name="description"]')!, { target: { value: 'A relaxing morning session' } });
      fireEvent.click(screen.getByRole('button', { name: /create session/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed to create session')).toBeInTheDocument();
      });
    });
  });

  describe('mode édition', () => {
    it('affiche le titre "Edit Session"', async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(adminUser);
      vi.mocked(api.get).mockResolvedValueOnce({ data: fakeTeachers });
      vi.mocked(api.get).mockResolvedValueOnce({ data: fakeSession });

      renderEditMode('1');

      expect(screen.getByText('Edit Session')).toBeInTheDocument();
    });

    it('pré-remplit les champs avec les données existantes', async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(adminUser);
      vi.mocked(api.get).mockResolvedValueOnce({ data: fakeTeachers });
      vi.mocked(api.get).mockResolvedValueOnce({ data: fakeSession });

      const { container } = renderEditMode('1');

      await waitFor(() => {
        expect((container.querySelector('input[name="name"]') as HTMLInputElement).value).toBe('Morning Yoga');
      });

      expect((container.querySelector('textarea[name="description"]') as HTMLTextAreaElement).value).toBe('A relaxing morning session');
    });

    it('modifie la session et redirige vers /sessions', async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(adminUser);
      vi.mocked(api.get).mockResolvedValueOnce({ data: fakeTeachers });
      vi.mocked(api.get).mockResolvedValueOnce({ data: fakeSession });
      vi.mocked(api.put).mockResolvedValueOnce({ data: fakeSession });

      const { container } = renderEditMode('1');

      await waitFor(() => {
        expect((container.querySelector('input[name="name"]') as HTMLInputElement).value).toBe('Morning Yoga');
      });

      fireEvent.click(screen.getByRole('button', { name: /update session/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/sessions');
      });
    });

    it('affiche une erreur si la modification échoue', async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(adminUser);
      vi.mocked(api.get).mockResolvedValueOnce({ data: fakeTeachers });
      vi.mocked(api.get).mockResolvedValueOnce({ data: fakeSession });
      vi.mocked(api.put).mockRejectedValueOnce({ response: { data: { message: 'Failed to update session' } } });

      const { container } = renderEditMode('1');

      await waitFor(() => {
        expect((container.querySelector('input[name="name"]') as HTMLInputElement).value).toBe('Morning Yoga');
      });

      fireEvent.click(screen.getByRole('button', { name: /update session/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed to update session')).toBeInTheDocument();
      });
    });
  });

  describe('redirection non admin', () => {
    it('redirige vers /sessions si l\'utilisateur n\'est pas admin', async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(fakeUser);
      vi.mocked(api.get).mockResolvedValueOnce({ data: [] });

      renderCreateMode();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/sessions');
      });
    });
  });
});
