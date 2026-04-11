import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, beforeEach } from 'vitest';
import Profile from '../../pages/Profile';

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
    logout: vi.fn(),
    updateCurrentUser: vi.fn(),
  },
}));

import api from '../../services/api';
import { authService } from '../../services/auth.service';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const fakeUser = { id: 1, email: 'user@test.com', firstName: 'Test', lastName: 'Smith', admin: false };
const adminUser = { id: 1, email: 'admin@test.com', firstName: 'Admin', lastName: 'Smith', admin: true };

const fakeUserInfo = {
  id: 1,
  email: 'user@test.com',
  firstName: 'Test',
  lastName: 'Smith',
  admin: false,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const adminUserInfo = { ...fakeUserInfo, admin: true };

describe('Profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.getToken).mockReturnValue('fake-token');
  });

  describe('chargement', () => {
    it('affiche "Loading profile..." pendant le chargement', () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(fakeUser);
      vi.mocked(api.get).mockReturnValue(new Promise(() => {}));

      render(<MemoryRouter><Profile /></MemoryRouter>);

      expect(screen.getByText('Loading profile...')).toBeInTheDocument();
    });

    it('affiche les informations de l\'utilisateur après chargement', async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(fakeUser);
      vi.mocked(api.get).mockResolvedValueOnce({ data: fakeUserInfo });

      render(<MemoryRouter><Profile /></MemoryRouter>);

      await waitFor(() => {
        expect(screen.getByText('Test')).toBeInTheDocument();
        expect(screen.getByText('Smith')).toBeInTheDocument();
        expect(screen.getByText('user@test.com')).toBeInTheDocument();
      });
    });

    it('affiche une erreur si le chargement échoue', async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(fakeUser);
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Network error'));

      render(<MemoryRouter><Profile /></MemoryRouter>);

      await waitFor(() => {
        expect(screen.getByText('Failed to load user information')).toBeInTheDocument();
      });
    });
  });

  describe('affichage des informations', () => {
    it('affiche le prénom, nom, email et type de compte', async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(fakeUser);
      vi.mocked(api.get).mockResolvedValueOnce({ data: fakeUserInfo });

      render(<MemoryRouter><Profile /></MemoryRouter>);

      await waitFor(() => {
        expect(screen.getByText('Test')).toBeInTheDocument();
        expect(screen.getByText('Smith')).toBeInTheDocument();
        expect(screen.getByText('user@test.com')).toBeInTheDocument();
        expect(screen.getByText('User', { selector: 'span' })).toBeInTheDocument();
      });
    });

    it('affiche "Administrator" si l\'utilisateur est admin', async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(adminUser);
      vi.mocked(api.get).mockResolvedValueOnce({ data: adminUserInfo });

      render(<MemoryRouter><Profile /></MemoryRouter>);

      await waitFor(() => {
        expect(screen.getByText('Administrator')).toBeInTheDocument();
      });
    });

    it('affiche "User" si l\'utilisateur n\'est pas admin', async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(fakeUser);
      vi.mocked(api.get).mockResolvedValueOnce({ data: fakeUserInfo });

      render(<MemoryRouter><Profile /></MemoryRouter>);

      await waitFor(() => {
        expect(screen.getByText('User', { selector: 'span' })).toBeInTheDocument();
      });
    });
  });

  describe('suppression de compte', () => {
    it('supprime le compte, logout et redirige vers /login', async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(fakeUser);
      vi.mocked(api.get).mockResolvedValueOnce({ data: fakeUserInfo });
      vi.mocked(api.delete).mockResolvedValueOnce({});
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<MemoryRouter><Profile /></MemoryRouter>);

      await waitFor(() => {
        expect(screen.getByText('Delete Account')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Delete Account'));

      await waitFor(() => {
        expect(api.delete).toHaveBeenCalledWith(`/user/${fakeUser.id}`, expect.any(Object));
        expect(authService.logout).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('ne supprime pas le compte si l\'utilisateur annule le confirm', async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(fakeUser);
      vi.mocked(api.get).mockResolvedValueOnce({ data: fakeUserInfo });
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(<MemoryRouter><Profile /></MemoryRouter>);

      await waitFor(() => {
        expect(screen.getByText('Delete Account')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Delete Account'));

      expect(api.delete).not.toHaveBeenCalled();
    });
  });

  describe('promote admin', () => {
    it('promeut l\'utilisateur en admin', async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(fakeUser);
      vi.mocked(api.get).mockResolvedValueOnce({ data: fakeUserInfo });
      vi.mocked(api.post).mockResolvedValueOnce({ data: { ...fakeUserInfo, admin: true } });

      render(<MemoryRouter><Profile /></MemoryRouter>);

      await waitFor(() => {
        expect(screen.getByText('Promote to Admin (Dev)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Promote to Admin (Dev)'));

      await waitFor(() => {
        expect(authService.updateCurrentUser).toHaveBeenCalledWith({ admin: true });
      });
    });

    it('affiche une erreur si la promotion échoue', async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(fakeUser);
      vi.mocked(api.get).mockResolvedValueOnce({ data: fakeUserInfo });
      vi.mocked(api.post).mockRejectedValueOnce(new Error('Server error'));

      render(<MemoryRouter><Profile /></MemoryRouter>);

      await waitFor(() => {
        expect(screen.getByText('Promote to Admin (Dev)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Promote to Admin (Dev)'));

      await waitFor(() => {
        expect(screen.getByText('Failed to promote to admin')).toBeInTheDocument();
      });
    });
  });

  describe('suppression de compte - erreur', () => {
    it('affiche une alerte si la suppression échoue', async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(fakeUser);
      vi.mocked(api.get).mockResolvedValueOnce({ data: fakeUserInfo });
      vi.mocked(api.delete).mockRejectedValueOnce(new Error('Server error'));
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<MemoryRouter><Profile /></MemoryRouter>);

      await waitFor(() => {
        expect(screen.getByText('Delete Account')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Delete Account'));

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Failed to delete account');
      });
    });
  });

  describe('navigation', () => {
    it('redirige vers /sessions au clic sur Back to Sessions', async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(fakeUser);
      vi.mocked(api.get).mockResolvedValueOnce({ data: fakeUserInfo });

      render(<MemoryRouter><Profile /></MemoryRouter>);

      await waitFor(() => {
        expect(screen.getByText('Back to Sessions')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Back to Sessions'));

      expect(mockNavigate).toHaveBeenCalledWith('/sessions');
    });
  });
});
