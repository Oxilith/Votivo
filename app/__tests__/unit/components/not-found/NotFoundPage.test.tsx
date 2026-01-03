/**
 * @file app/__tests__/unit/components/not-found/NotFoundPage.test.tsx
 * @purpose Unit tests for NotFoundPage component
 * @functionality
 * - Tests 404 page rendering with translated content
 * - Tests navigation to landing page when button clicked
 * @dependencies
 * - vitest globals
 * - @testing-library/react
 * - NotFoundPage under test
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotFoundPage from '@/components/not-found/NotFoundPage';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        code: '404',
        title: 'Page Not Found',
        description: 'The page you are looking for does not exist.',
        goHome: 'Go Home',
      };
      return translations[key] ?? key;
    },
  }),
}));

// Mock useRouting hook
const mockNavigate = vi.fn();
vi.mock('@/hooks', () => ({
  useRouting: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock InkBrushDecoration
vi.mock('@/components', () => ({
  InkBrushDecoration: () => <div data-testid="ink-decoration" />,
}));

describe('NotFoundPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render 404 code', () => {
    render(<NotFoundPage />);
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('should render error title', () => {
    render(<NotFoundPage />);
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
  });

  it('should render error description', () => {
    render(<NotFoundPage />);
    expect(screen.getByText('The page you are looking for does not exist.')).toBeInTheDocument();
  });

  it('should render go home button', () => {
    render(<NotFoundPage />);
    expect(screen.getByRole('button', { name: 'Go Home' })).toBeInTheDocument();
  });

  it('should navigate to landing when go home button is clicked', async () => {
    const user = userEvent.setup();
    render(<NotFoundPage />);

    await user.click(screen.getByRole('button', { name: 'Go Home' }));

    expect(mockNavigate).toHaveBeenCalledWith('landing');
  });

  it('should render ink brush decoration', () => {
    render(<NotFoundPage />);
    expect(screen.getByTestId('ink-decoration')).toBeInTheDocument();
  });
});
