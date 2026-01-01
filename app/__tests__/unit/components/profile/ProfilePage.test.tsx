/**
 * @file app/__tests__/unit/components/profile/ProfilePage.test.tsx
 * @purpose Unit tests for ProfilePage component
 * @functionality
 * - Tests tab navigation between profile sections
 * - Tests profile form submission and validation
 * - Tests password change form with validation
 * - Tests assessments and analyses list loading
 * - Tests account deletion flow with confirmation
 * - Tests logout functionality
 * @dependencies
 * - vitest globals
 * - @testing-library/react
 * - ProfilePage under test
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfilePage from '@/components/profile/ProfilePage';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (options) return `${key}:${JSON.stringify(options)}`;
      return key;
    },
    i18n: { language: 'en' },
  }),
}));

// Mock stores
const mockClearAuth = vi.fn();
const mockSetUser = vi.fn();
const mockSetView = vi.fn();
const mockClearResponses = vi.fn();
const mockClearAnalysis = vi.fn();
const mockSetAssessmentsList = vi.fn();
const mockSetAnalysesList = vi.fn();
const mockIsAssessmentsListStale = vi.fn(() => false);
const mockIsAnalysesListStale = vi.fn(() => false);

let mockUser: { id: string; name: string; email: string; birthYear: number; gender: string; emailVerified: boolean } | null = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  birthYear: 1990,
  gender: 'prefer-not-to-say',
  emailVerified: true,
};

let mockAssessmentsList: { id: string; responses: Record<string, unknown>; createdAt: string }[] | null = null;
let mockAnalysesList: { id: string; result: { identitySynthesis: { currentIdentityCore: string } }; createdAt: string }[] | null = null;

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => ({
    clearAuth: mockClearAuth,
    setUser: mockSetUser,
    assessmentsList: mockAssessmentsList,
    analysesList: mockAnalysesList,
    isAssessmentsListStale: mockIsAssessmentsListStale,
    isAnalysesListStale: mockIsAnalysesListStale,
    setAssessmentsList: mockSetAssessmentsList,
    setAnalysesList: mockSetAnalysesList,
  }),
  useCurrentUser: () => mockUser,
}));

vi.mock('@/stores/useUIStore', () => ({
  useUIStore: () => ({
    setView: mockSetView,
  }),
}));

vi.mock('@/stores/useAssessmentStore', () => ({
  useAssessmentStore: () => ({
    clearResponses: mockClearResponses,
  }),
}));

vi.mock('@/stores/useAnalysisStore', () => ({
  useAnalysisStore: () => ({
    clearAnalysis: mockClearAnalysis,
  }),
}));

// Mock authService
const mockLogout = vi.fn();
const mockUpdateProfile = vi.fn();
const mockChangePassword = vi.fn();
const mockDeleteAccount = vi.fn();
const mockGetAssessments = vi.fn();
const mockGetAnalyses = vi.fn();

vi.mock('@/services/api/AuthService', () => ({
  authService: {
    logout: () => mockLogout(),
    updateProfile: (data: unknown) => mockUpdateProfile(data),
    changePassword: (data: unknown) => mockChangePassword(data),
    deleteAccount: () => mockDeleteAccount(),
    getAssessments: () => mockGetAssessments(),
    getAnalyses: () => mockGetAnalyses(),
  },
}));

// Mock logger
vi.mock('@/utils', () => ({
  logger: {
    error: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock components
vi.mock('@/components', () => ({
  FormInput: ({ label, value, onChange, type, ...props }: { label: string; value: string; onChange: (e: { target: { value: string } }) => void; type: string }) => (
    <div>
      <label>{label}</label>
      <input
        data-testid={`input-${label}`}
        type={type}
        value={value}
        onChange={onChange}
        {...props}
      />
    </div>
  ),
  FormButton: ({ children, isLoading }: { children: React.ReactNode; isLoading?: boolean }) => (
    <button type="submit" disabled={isLoading} data-testid="form-button">
      {isLoading ? 'Loading...' : children}
    </button>
  ),
  PageNavigation: ({ onSignOut }: { onSignOut?: () => void }) => (
    <nav data-testid="page-navigation">
      <button onClick={onSignOut} data-testid="logout-button">Logout</button>
    </nav>
  ),
  FooterSection: () => <footer data-testid="footer" />,
  CheckIcon: () => <span data-testid="check-icon" />,
  LoadingSpinnerIcon: () => <span data-testid="loading-spinner" />,
  ErrorCircleIcon: () => <span data-testid="error-icon" />,
  RefreshIcon: () => <span data-testid="refresh-icon" />,
  InkBrushDecoration: () => <div data-testid="ink-decoration" />,
}));

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      birthYear: 1990,
      gender: 'prefer-not-to-say',
      emailVerified: true,
    };
    mockAssessmentsList = null;
    mockAnalysesList = null;
  });

  describe('rendering', () => {
    it('should render the profile page with title', () => {
      render(<ProfilePage />);
      expect(screen.getByText('title')).toBeInTheDocument();
      expect(screen.getByText('subtitle')).toBeInTheDocument();
    });

    it('should render tab navigation', () => {
      render(<ProfilePage />);
      expect(screen.getByText('profile.tabs.profile')).toBeInTheDocument();
      expect(screen.getByText('profile.tabs.password')).toBeInTheDocument();
      expect(screen.getByText('profile.tabs.assessments')).toBeInTheDocument();
      expect(screen.getByText('profile.tabs.analyses')).toBeInTheDocument();
      expect(screen.getByText('profile.tabs.danger')).toBeInTheDocument();
    });

    it('should show profile tab content by default', () => {
      render(<ProfilePage />);
      expect(screen.getByText('profileTab.title')).toBeInTheDocument();
    });
  });

  describe('tab navigation', () => {
    it('should switch to password tab when clicked', async () => {
      const user = userEvent.setup();
      render(<ProfilePage />);

      await user.click(screen.getByText('profile.tabs.password'));

      expect(screen.getByText('passwordTab.title')).toBeInTheDocument();
    });

    it('should switch to assessments tab when clicked', async () => {
      const user = userEvent.setup();
      mockIsAssessmentsListStale.mockReturnValue(true);
      mockGetAssessments.mockResolvedValue([]);

      render(<ProfilePage />);
      await user.click(screen.getByText('profile.tabs.assessments'));

      expect(screen.getByText('assessmentsTab.title')).toBeInTheDocument();
    });

    it('should switch to danger tab when clicked', async () => {
      const user = userEvent.setup();
      render(<ProfilePage />);

      await user.click(screen.getByText('profile.tabs.danger'));

      expect(screen.getByText('dangerTab.title')).toBeInTheDocument();
    });
  });

  describe('profile form', () => {
    it('should display user email', () => {
      render(<ProfilePage />);
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('should show email not verified warning when email is not verified', () => {
      if (mockUser) {
        mockUser = { ...mockUser, emailVerified: false };
      }
      render(<ProfilePage />);
      expect(screen.getByText('profileTab.emailNotVerified')).toBeInTheDocument();
    });

    it('should submit profile form successfully', async () => {
      const user = userEvent.setup();
      mockUpdateProfile.mockResolvedValue({ ...mockUser, name: 'Updated Name' });

      render(<ProfilePage />);

      const nameInput = screen.getByTestId('input-profileTab.name');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');

      await user.click(screen.getByTestId('form-button'));

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith({ name: 'Updated Name' });
      });
    });

    it('should show success message after profile update', async () => {
      const user = userEvent.setup();
      mockUpdateProfile.mockResolvedValue({ ...mockUser, name: 'Updated Name' });

      render(<ProfilePage />);

      const nameInput = screen.getByTestId('input-profileTab.name');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');

      await user.click(screen.getByTestId('form-button'));

      await waitFor(() => {
        expect(screen.getByText('profileTab.updated')).toBeInTheDocument();
      });
    });

    it('should show error message on profile update failure', async () => {
      const user = userEvent.setup();
      mockUpdateProfile.mockRejectedValue(new Error('Update failed'));

      render(<ProfilePage />);

      const nameInput = screen.getByTestId('input-profileTab.name');
      await user.clear(nameInput);
      await user.type(nameInput, 'New Name');

      await user.click(screen.getByTestId('form-button'));

      await waitFor(() => {
        expect(screen.getByText('profileTab.updateFailed')).toBeInTheDocument();
      });
    });
  });

  describe('password form', () => {
    it('should show password mismatch error', async () => {
      const user = userEvent.setup();
      render(<ProfilePage />);

      await user.click(screen.getByText('profile.tabs.password'));

      const currentPwd = screen.getByTestId('input-passwordTab.currentPassword');
      const newPwd = screen.getByTestId('input-passwordTab.newPassword');
      const confirmPwd = screen.getByTestId('input-passwordTab.confirmPassword');

      await user.type(currentPwd, 'oldpassword');
      await user.type(newPwd, 'NewPassword123');
      await user.type(confirmPwd, 'DifferentPassword123');

      await user.click(screen.getByTestId('form-button'));

      expect(screen.getByText('auth:validation.passwordMismatch')).toBeInTheDocument();
    });

    it('should show password too short error', async () => {
      const user = userEvent.setup();
      render(<ProfilePage />);

      await user.click(screen.getByText('profile.tabs.password'));

      const currentPwd = screen.getByTestId('input-passwordTab.currentPassword');
      const newPwd = screen.getByTestId('input-passwordTab.newPassword');
      const confirmPwd = screen.getByTestId('input-passwordTab.confirmPassword');

      await user.type(currentPwd, 'oldpassword');
      await user.type(newPwd, 'Short1');
      await user.type(confirmPwd, 'Short1');

      await user.click(screen.getByTestId('form-button'));

      expect(screen.getByText('auth:validation.passwordTooShort')).toBeInTheDocument();
    });

    it('should show weak password error', async () => {
      const user = userEvent.setup();
      render(<ProfilePage />);

      await user.click(screen.getByText('profile.tabs.password'));

      const currentPwd = screen.getByTestId('input-passwordTab.currentPassword');
      const newPwd = screen.getByTestId('input-passwordTab.newPassword');
      const confirmPwd = screen.getByTestId('input-passwordTab.confirmPassword');

      await user.type(currentPwd, 'oldpassword');
      await user.type(newPwd, 'nouppercase123');
      await user.type(confirmPwd, 'nouppercase123');

      await user.click(screen.getByTestId('form-button'));

      expect(screen.getByText('auth:validation.passwordWeak')).toBeInTheDocument();
    });

    it('should submit password change successfully', async () => {
      const user = userEvent.setup();
      mockChangePassword.mockResolvedValue({});

      render(<ProfilePage />);

      await user.click(screen.getByText('profile.tabs.password'));

      const currentPwd = screen.getByTestId('input-passwordTab.currentPassword');
      const newPwd = screen.getByTestId('input-passwordTab.newPassword');
      const confirmPwd = screen.getByTestId('input-passwordTab.confirmPassword');

      await user.type(currentPwd, 'oldpassword');
      await user.type(newPwd, 'NewPassword123');
      await user.type(confirmPwd, 'NewPassword123');

      await user.click(screen.getByTestId('form-button'));

      await waitFor(() => {
        expect(mockChangePassword).toHaveBeenCalledWith({
          currentPassword: 'oldpassword',
          newPassword: 'NewPassword123',
        });
      });
    });

    it('should show success message after password change', async () => {
      const user = userEvent.setup();
      mockChangePassword.mockResolvedValue({});

      render(<ProfilePage />);

      await user.click(screen.getByText('profile.tabs.password'));

      const currentPwd = screen.getByTestId('input-passwordTab.currentPassword');
      const newPwd = screen.getByTestId('input-passwordTab.newPassword');
      const confirmPwd = screen.getByTestId('input-passwordTab.confirmPassword');

      await user.type(currentPwd, 'oldpassword');
      await user.type(newPwd, 'NewPassword123');
      await user.type(confirmPwd, 'NewPassword123');

      await user.click(screen.getByTestId('form-button'));

      await waitFor(() => {
        expect(screen.getByText('passwordTab.changed')).toBeInTheDocument();
      });
    });
  });

  describe('assessments tab', () => {
    it('should load assessments when tab is clicked', async () => {
      const user = userEvent.setup();
      mockIsAssessmentsListStale.mockReturnValue(true);
      mockGetAssessments.mockResolvedValue([
        { id: 'a1', responses: { q1: 'answer' }, createdAt: '2024-01-01T00:00:00Z' },
      ]);

      render(<ProfilePage />);
      await user.click(screen.getByText('profile.tabs.assessments'));

      await waitFor(() => {
        expect(mockGetAssessments).toHaveBeenCalled();
      });
    });

    it('should display empty message when no assessments', async () => {
      const user = userEvent.setup();
      mockIsAssessmentsListStale.mockReturnValue(true);
      mockGetAssessments.mockResolvedValue([]);

      render(<ProfilePage />);
      await user.click(screen.getByText('profile.tabs.assessments'));

      await waitFor(() => {
        expect(screen.getByText('assessmentsTab.empty')).toBeInTheDocument();
      });
    });

    it('should show error and retry button on load failure', async () => {
      const user = userEvent.setup();
      mockIsAssessmentsListStale.mockReturnValue(true);
      mockGetAssessments.mockRejectedValue(new Error('Load failed'));

      render(<ProfilePage />);
      await user.click(screen.getByText('profile.tabs.assessments'));

      await waitFor(() => {
        expect(screen.getByText('assessmentsTab.loadError')).toBeInTheDocument();
        expect(screen.getByText('assessmentsTab.retry')).toBeInTheDocument();
      });
    });
  });

  describe('account deletion', () => {
    it('should show confirmation when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<ProfilePage />);

      await user.click(screen.getByText('profile.tabs.danger'));
      await user.click(screen.getByText('dangerTab.deleteButton'));

      expect(screen.getByText('dangerTab.confirmPrompt')).toBeInTheDocument();
      expect(screen.getByText('dangerTab.confirmDelete')).toBeInTheDocument();
      expect(screen.getByText('dangerTab.cancel')).toBeInTheDocument();
    });

    it('should cancel deletion when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<ProfilePage />);

      await user.click(screen.getByText('profile.tabs.danger'));
      await user.click(screen.getByText('dangerTab.deleteButton'));
      await user.click(screen.getByText('dangerTab.cancel'));

      expect(screen.queryByText('dangerTab.confirmPrompt')).not.toBeInTheDocument();
    });

    it('should delete account and redirect to landing', async () => {
      const user = userEvent.setup();
      mockDeleteAccount.mockResolvedValue({});

      render(<ProfilePage />);

      await user.click(screen.getByText('profile.tabs.danger'));
      await user.click(screen.getByText('dangerTab.deleteButton'));
      await user.click(screen.getByText('dangerTab.confirmDelete'));

      await waitFor(() => {
        expect(mockDeleteAccount).toHaveBeenCalled();
        expect(mockClearAuth).toHaveBeenCalled();
        expect(mockSetView).toHaveBeenCalledWith('landing');
      });
    });

    it('should show error on deletion failure', async () => {
      const user = userEvent.setup();
      mockDeleteAccount.mockRejectedValue(new Error('Delete failed'));

      render(<ProfilePage />);

      await user.click(screen.getByText('profile.tabs.danger'));
      await user.click(screen.getByText('dangerTab.deleteButton'));
      await user.click(screen.getByText('dangerTab.confirmDelete'));

      await waitFor(() => {
        expect(screen.getByText('dangerTab.deleteFailed')).toBeInTheDocument();
      });
    });
  });

  describe('logout', () => {
    it('should logout and clear stores when logout is clicked', async () => {
      const user = userEvent.setup();
      mockLogout.mockResolvedValue({});

      render(<ProfilePage />);
      await user.click(screen.getByTestId('logout-button'));

      await waitFor(() => {
        expect(mockClearResponses).toHaveBeenCalled();
        expect(mockClearAnalysis).toHaveBeenCalled();
        expect(mockClearAuth).toHaveBeenCalled();
        expect(mockSetView).toHaveBeenCalledWith('landing');
      });
    });
  });

  describe('navigation callbacks', () => {
    it('should call onNavigateToAssessmentById when assessment is clicked', async () => {
      const user = userEvent.setup();
      const onNavigateToAssessmentById = vi.fn();
      // Pre-populate the list so it doesn't need to load
      mockAssessmentsList = [
        { id: 'a1', responses: { q1: 'answer' }, createdAt: '2024-01-01T00:00:00Z' },
      ];
      mockIsAssessmentsListStale.mockReturnValue(false);

      render(<ProfilePage onNavigateToAssessmentById={onNavigateToAssessmentById} />);
      await user.click(screen.getByText('profile.tabs.assessments'));

      // Wait for the list to render, then click
      const assessmentItem = await screen.findByText(/assessmentsTab.fromDate/);
      const listItem = assessmentItem.closest('li');
      if (listItem) {
        fireEvent.click(listItem);
      }

      expect(onNavigateToAssessmentById).toHaveBeenCalledWith('a1');
    });

    it('should call onNavigateToInsightsById when analysis is clicked', async () => {
      const user = userEvent.setup();
      const onNavigateToInsightsById = vi.fn();
      // Pre-populate the list so it doesn't need to load
      mockAnalysesList = [
        {
          id: 'an1',
          result: { identitySynthesis: { currentIdentityCore: 'Test identity' } },
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];
      mockIsAnalysesListStale.mockReturnValue(false);

      render(<ProfilePage onNavigateToInsightsById={onNavigateToInsightsById} />);
      await user.click(screen.getByText('profile.tabs.analyses'));

      // Wait for the list to render, then click
      const analysisItem = await screen.findByText(/analysesTab.fromDate/);
      const listItem = analysisItem.closest('li');
      if (listItem) {
        fireEvent.click(listItem);
      }

      expect(onNavigateToInsightsById).toHaveBeenCalledWith('an1');
    });
  });
});
