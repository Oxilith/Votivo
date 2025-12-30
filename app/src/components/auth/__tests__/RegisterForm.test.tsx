/**
 * @file components/auth/__tests__/RegisterForm.test.tsx
 * @purpose Unit tests for RegisterForm component
 * @functionality
 * - Tests form rendering (title, all inputs, submit button, links)
 * - Tests validation errors (name, email, password strength, password mismatch, birth year)
 * - Tests successful registration flow with auth store update
 * - Tests API error display
 * - Tests navigation callback (switch to login)
 * - Tests loading state during submission
 * @dependencies
 * - vitest
 * - @testing-library/react
 * - @testing-library/user-event
 * - RegisterForm component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterForm from '../forms/RegisterForm';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'register.title': 'Create Account',
        'register.subtitle': 'Start your identity discovery',
        'register.name': 'Name',
        'register.namePlaceholder': 'Your name',
        'register.email': 'Email',
        'register.emailPlaceholder': 'your@email.com',
        'register.password': 'Password',
        'register.passwordPlaceholder': 'Min 8 chars, uppercase, lowercase, number',
        'register.confirmPassword': 'Confirm Password',
        'register.confirmPasswordPlaceholder': 'Confirm your password',
        'register.birthYear': 'Birth Year',
        'register.gender': 'Gender',
        'register.genderOptions.default': 'Prefer not to say',
        'register.genderOptions.male': 'Male',
        'register.genderOptions.female': 'Female',
        'register.genderOptions.other': 'Other',
        'register.submit': 'Create Account',
        'register.hasAccount': 'Already have an account?',
        'register.signIn': 'Sign in',
        'validation.nameRequired': 'Name is required',
        'validation.nameTooLong': 'Name must be 100 characters or less',
        'validation.emailRequired': 'Email is required',
        'validation.emailInvalid': 'Please enter a valid email address',
        'validation.emailTooLong': 'Email must be 254 characters or less',
        'validation.passwordRequired': 'Password is required',
        'validation.passwordTooShort': 'Password must be at least 8 characters',
        'validation.passwordTooLong': 'Password must be 128 characters or less',
        'validation.passwordWeak': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
        'validation.passwordMismatch': 'Passwords do not match',
        'validation.birthYearInvalid': 'Please enter a valid birth year',
        'validation.birthYearRange': `Birth year must be between ${params?.min ?? 1900} and ${params?.max ?? 2011}`,
        'errors.generic': 'An unexpected error occurred. Please try again.',
      };
      return translations[key] ?? key;
    },
  }),
  withTranslation: () => (Component: React.ComponentType) => Component,
}));

// Mock authService
const mockRegister = vi.fn();
vi.mock('@/services/api/AuthService', () => ({
  authService: {
    register: (...args: unknown[]) => mockRegister(...args),
  },
}));

// Mock useAuthStore
const mockSetAuth = vi.fn();
vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => ({
    setAuth: mockSetAuth,
  }),
}));

// Mock shared validation constants
vi.mock('shared', () => ({
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
}));

describe('RegisterForm', () => {
  const defaultProps = {
    onSwitchToLogin: vi.fn(),
    onSuccess: vi.fn(),
  };

  // Calculate valid birth year (must be at least 13 years old)
  const currentYear = new Date().getFullYear();
  const validBirthYear = (currentYear - 25).toString();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render title and subtitle', () => {
      render(<RegisterForm {...defaultProps} />);

      // Use getByRole to target the heading specifically
      expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
      expect(screen.getByText('Start your identity discovery')).toBeInTheDocument();
    });

    it('should render name input field', () => {
      render(<RegisterForm {...defaultProps} />);

      expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument();
    });

    it('should render email input field', () => {
      render(<RegisterForm {...defaultProps} />);

      expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
    });

    it('should render password input fields', () => {
      render(<RegisterForm {...defaultProps} />);

      expect(screen.getByPlaceholderText('Min 8 chars, uppercase, lowercase, number')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Confirm your password')).toBeInTheDocument();
    });

    it('should render birth year input', () => {
      render(<RegisterForm {...defaultProps} />);

      expect(screen.getByLabelText(/birth year/i)).toBeInTheDocument();
    });

    it('should render gender select with options', () => {
      render(<RegisterForm {...defaultProps} />);

      const genderSelect = screen.getByLabelText(/gender/i);
      expect(genderSelect).toBeInTheDocument();
      expect(screen.getByText('Prefer not to say')).toBeInTheDocument();
      expect(screen.getByText('Male')).toBeInTheDocument();
      expect(screen.getByText('Female')).toBeInTheDocument();
      expect(screen.getByText('Other')).toBeInTheDocument();
    });

    it('should render submit button', () => {
      render(<RegisterForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
    });

    it('should render sign in link', () => {
      render(<RegisterForm {...defaultProps} />);

      expect(screen.getByText('Already have an account?')).toBeInTheDocument();
      expect(screen.getByText('Sign in')).toBeInTheDocument();
    });
  });

  describe('validation', () => {
    it('should show name required error when submitting with empty name', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: 'Create Account' }));

      expect(await screen.findByText('Name is required')).toBeInTheDocument();
    });

    it('should show email required error when submitting with empty email', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);

      await user.type(screen.getByPlaceholderText('Your name'), 'Test User');
      await user.click(screen.getByRole('button', { name: 'Create Account' }));

      expect(await screen.findByText('Email is required')).toBeInTheDocument();
    });

    it('should show password required error when submitting with empty password', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);

      await user.type(screen.getByPlaceholderText('Your name'), 'Test User');
      await user.type(screen.getByPlaceholderText('your@email.com'), 'test@example.com');
      await user.click(screen.getByRole('button', { name: 'Create Account' }));

      expect(await screen.findByText('Password is required')).toBeInTheDocument();
    });

    it('should show password too short error', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);

      await user.type(screen.getByPlaceholderText('Your name'), 'Test User');
      await user.type(screen.getByPlaceholderText('your@email.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Min 8 chars, uppercase, lowercase, number'), 'Short1');
      await user.click(screen.getByRole('button', { name: 'Create Account' }));

      expect(await screen.findByText('Password must be at least 8 characters')).toBeInTheDocument();
    });

    it('should show password weak error when missing requirements', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);

      await user.type(screen.getByPlaceholderText('Your name'), 'Test User');
      await user.type(screen.getByPlaceholderText('your@email.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Min 8 chars, uppercase, lowercase, number'), 'alllowercase');
      await user.click(screen.getByRole('button', { name: 'Create Account' }));

      expect(await screen.findByText('Password must contain at least one uppercase letter, one lowercase letter, and one number')).toBeInTheDocument();
    });

    it('should show password mismatch error', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);

      await user.type(screen.getByPlaceholderText('Your name'), 'Test User');
      await user.type(screen.getByPlaceholderText('your@email.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Min 8 chars, uppercase, lowercase, number'), 'ValidPass1');
      await user.type(screen.getByPlaceholderText('Confirm your password'), 'DifferentPass1');
      await user.click(screen.getByRole('button', { name: 'Create Account' }));

      expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
    });

    it('should show birth year invalid error when empty', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);

      await user.type(screen.getByPlaceholderText('Your name'), 'Test User');
      await user.type(screen.getByPlaceholderText('your@email.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Min 8 chars, uppercase, lowercase, number'), 'ValidPass1');
      await user.type(screen.getByPlaceholderText('Confirm your password'), 'ValidPass1');
      await user.click(screen.getByRole('button', { name: 'Create Account' }));

      expect(await screen.findByText('Please enter a valid birth year')).toBeInTheDocument();
    });

    it('should not call register when validation fails', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: 'Create Account' }));

      expect(mockRegister).not.toHaveBeenCalled();
    });
  });

  describe('submission', () => {
    const fillValidForm = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.type(screen.getByPlaceholderText('Your name'), 'Test User');
      await user.type(screen.getByPlaceholderText('your@email.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Min 8 chars, uppercase, lowercase, number'), 'ValidPass1');
      await user.type(screen.getByPlaceholderText('Confirm your password'), 'ValidPass1');
      await user.type(screen.getByLabelText(/birth year/i), validBirthYear);
    };

    it('should call register with form data on valid submission', async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValue({
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        accessToken: 'test-token',
      });

      render(<RegisterForm {...defaultProps} />);
      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: 'Create Account' }));

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          name: 'Test User',
          email: 'test@example.com',
          password: 'ValidPass1',
          birthYear: parseInt(validBirthYear, 10),
          gender: 'prefer-not-to-say',
        });
      });
    });

    it('should call register with selected gender', async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValue({
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        accessToken: 'test-token',
      });

      render(<RegisterForm {...defaultProps} />);
      await fillValidForm(user);
      await user.selectOptions(screen.getByLabelText(/gender/i), 'female');
      await user.click(screen.getByRole('button', { name: 'Create Account' }));

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith(
          expect.objectContaining({ gender: 'female' })
        );
      });
    });

    it('should call setAuth with user, token, and csrfToken on successful registration', async () => {
      const user = userEvent.setup();
      const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };
      const mockToken = 'test-access-token';
      const mockCsrfToken = 'test-csrf-token';
      mockRegister.mockResolvedValue({
        user: mockUser,
        accessToken: mockToken,
        csrfToken: mockCsrfToken,
      });

      render(<RegisterForm {...defaultProps} />);
      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: 'Create Account' }));

      await waitFor(() => {
        expect(mockSetAuth).toHaveBeenCalledWith(mockUser, mockToken, mockCsrfToken);
      });
    });

    it('should call onSuccess callback after successful registration', async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValue({
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        accessToken: 'test-token',
      });

      render(<RegisterForm {...defaultProps} />);
      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: 'Create Account' }));

      await waitFor(() => {
        expect(defaultProps.onSuccess).toHaveBeenCalled();
      });
    });

    it('should disable submit button while loading', async () => {
      const user = userEvent.setup();
      let resolveRegister: (value: unknown) => void = () => {};
      mockRegister.mockImplementation(
        () => new Promise((resolve) => { resolveRegister = resolve; })
      );

      render(<RegisterForm {...defaultProps} />);
      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: 'Create Account' }));

      expect(screen.getByRole('button', { name: 'Create Account' })).toBeDisabled();

      resolveRegister({
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        accessToken: 'test-token',
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Create Account' })).not.toBeDisabled();
      });
    });
  });

  describe('error handling', () => {
    const fillValidForm = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.type(screen.getByPlaceholderText('Your name'), 'Test User');
      await user.type(screen.getByPlaceholderText('your@email.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Min 8 chars, uppercase, lowercase, number'), 'ValidPass1');
      await user.type(screen.getByPlaceholderText('Confirm your password'), 'ValidPass1');
      const currentYear = new Date().getFullYear();
      await user.type(screen.getByLabelText(/birth year/i), (currentYear - 25).toString());
    };

    it('should display API error message when registration fails', async () => {
      const user = userEvent.setup();
      mockRegister.mockRejectedValue(new Error('Email already registered'));

      render(<RegisterForm {...defaultProps} />);
      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: 'Create Account' }));

      expect(await screen.findByText('Email already registered')).toBeInTheDocument();
    });

    it('should display generic error for non-Error rejections', async () => {
      const user = userEvent.setup();
      mockRegister.mockRejectedValue('Unknown error');

      render(<RegisterForm {...defaultProps} />);
      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: 'Create Account' }));

      expect(await screen.findByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
    });

    it('should not call onSuccess when registration fails', async () => {
      const user = userEvent.setup();
      mockRegister.mockRejectedValue(new Error('Email already registered'));

      render(<RegisterForm {...defaultProps} />);
      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: 'Create Account' }));

      await screen.findByText('Email already registered');
      expect(defaultProps.onSuccess).not.toHaveBeenCalled();
    });
  });

  describe('navigation callbacks', () => {
    it('should call onSwitchToLogin when sign in link is clicked', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);

      await user.click(screen.getByText('Sign in'));

      expect(defaultProps.onSwitchToLogin).toHaveBeenCalled();
    });
  });
});
