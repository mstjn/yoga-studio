import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, beforeEach } from 'vitest';
import Register from '../../pages/Register';

vi.mock('../../services/auth.service', () => ({
  authService: {
    register: vi.fn(),
  },
}));

import { authService } from '../../services/auth.service';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('Register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendu', () => {
    it('affiche le formulaire d\'inscription', () => {
      render(<MemoryRouter><Register /></MemoryRouter>);
      expect(screen.getByText('Register for Yoga Studio')).toBeInTheDocument();
    });

    it('affiche les champs firstName, lastName, email, password', () => {
      render(<MemoryRouter><Register /></MemoryRouter>);
      expect(screen.getByText('First Name')).toBeInTheDocument();
      expect(screen.getByText('Last Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Password')).toBeInTheDocument();
    });

    it('affiche le lien vers Login', () => {
      render(<MemoryRouter><Register /></MemoryRouter>);
      expect(screen.getByText('Login here')).toBeInTheDocument();
    });
  });

  describe('soumission réussie', () => {
    it('appelle authService.register avec les bonnes valeurs', async () => {
      vi.mocked(authService.register).mockResolvedValueOnce({ id: 1, email: 'user@test.com', firstName: 'Test', lastName: 'User', admin: false, token: 'fake-token' });

      const { container } = render(<MemoryRouter><Register /></MemoryRouter>);

      fireEvent.change(container.querySelector('input[name="firstName"]')!, { target: { value: 'Test' } });
      fireEvent.change(container.querySelector('input[name="lastName"]')!, { target: { value: 'User' } });
      fireEvent.change(container.querySelector('input[name="email"]')!, { target: { value: 'user@test.com' } });
      fireEvent.change(container.querySelector('input[name="password"]')!, { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() => {
        expect(authService.register).toHaveBeenCalledWith({ firstName: 'Test', lastName: 'User', email: 'user@test.com', password: 'password123' });
      });
    });

    it('redirige vers /sessions après inscription réussie', async () => {
      vi.mocked(authService.register).mockResolvedValueOnce({ id: 1, email: 'user@test.com', firstName: 'Test', lastName: 'User', admin: false, token: 'fake-token' });

      const { container } = render(<MemoryRouter><Register /></MemoryRouter>);

      fireEvent.change(container.querySelector('input[name="firstName"]')!, { target: { value: 'Test' } });
      fireEvent.change(container.querySelector('input[name="lastName"]')!, { target: { value: 'User' } });
      fireEvent.change(container.querySelector('input[name="email"]')!, { target: { value: 'user@test.com' } });
      fireEvent.change(container.querySelector('input[name="password"]')!, { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/sessions');
      });
    });
  });

  describe('erreurs', () => {
    it('affiche un message erreur si l\'inscription échoue', async () => {
      vi.mocked(authService.register).mockRejectedValueOnce({ response: { data: { message: 'Email already exists' } } });

      const { container } = render(<MemoryRouter><Register /></MemoryRouter>);

      fireEvent.change(container.querySelector('input[name="firstName"]')!, { target: { value: 'Test' } });
      fireEvent.change(container.querySelector('input[name="lastName"]')!, { target: { value: 'User' } });
      fireEvent.change(container.querySelector('input[name="email"]')!, { target: { value: 'user@test.com' } });
      fireEvent.change(container.querySelector('input[name="password"]')!, { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument();
      });
    });
  });
});
