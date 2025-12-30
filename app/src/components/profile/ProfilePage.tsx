/**
 * @file src/components/profile/ProfilePage.tsx
 * @purpose User profile management page with account settings
 * @functionality
 * - Displays user profile information (name, email, birthYear, gender)
 * - Allows editing profile fields
 * - Provides password change functionality
 * - Shows list of past assessments and analyses with navigation
 * - Allows account deletion with confirmation and error display
 * - Uses shared PageNavigation component for consistent navigation
 * - Includes logout option via navigation avatar dropdown
 * - Includes decorative ink brush SVG and footer
 * - Full internationalization support (English/Polish)
 * @dependencies
 * - React (useState, useEffect, useCallback)
 * - react-i18next (useTranslation)
 * - @/components (FormInput, FormButton, PageNavigation, FooterSection, icons, InkBrushDecoration)
 * - @/stores (useAuthStore, useCurrentUser, useUIStore, useAssessmentStore, useAnalysisStore)
 * - @/services (authService)
 * - @/types (Gender, ProfileUpdateRequest, PasswordChangeRequest)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FormInput,
  FormButton,
  PageNavigation,
  FooterSection,
  CheckIcon,
  LoadingSpinnerIcon,
  ErrorCircleIcon,
  RefreshIcon,
  InkBrushDecoration,
} from '@/components';
import { useAuthStore, useCurrentUser, useUIStore, useAssessmentStore, useAnalysisStore } from '@/stores';
import { authService } from '@/services';
import type { Gender, ProfileUpdateRequest, PasswordChangeRequest } from '@/types';
import { PASSWORD_REGEX, PASSWORD_MIN_LENGTH } from 'shared';

/**
 * Profile tab type
 */
type ProfileTab = 'profile' | 'password' | 'assessments' | 'analyses' | 'danger';

const currentYear = new Date().getFullYear();
const minYear = 1900;
const maxYear = currentYear - 13;

/**
 * ProfilePage props
 */
interface ProfilePageProps {
  onNavigateToAssessmentById?: (id: string) => void;
  onNavigateToInsightsById?: (id: string) => void;
}

/**
 * ProfilePage - User profile and settings management
 */
const ProfilePage: React.FC<ProfilePageProps> = ({
  onNavigateToAssessmentById,
  onNavigateToInsightsById,
}) => {
  const { t, i18n } = useTranslation(['profile', 'auth']);
  const user = useCurrentUser();
  const { clearAuth, setUser } = useAuthStore();
  const { setView } = useUIStore();
  const { clearResponses } = useAssessmentStore();
  const { clearAnalysis } = useAnalysisStore();

  // Tab state
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile');

  // Profile form state
  const [name, setName] = useState(user?.name ?? '');
  const [birthYear, setBirthYear] = useState(user?.birthYear?.toString() ?? '');
  const [gender, setGender] = useState<Gender | ''>(user?.gender ?? '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Use cached lists from auth store
  const {
    assessmentsList,
    analysesList,
    isAssessmentsListStale,
    isAnalysesListStale,
    setAssessmentsList,
    setAnalysesList,
  } = useAuthStore();

  // Loading and error states (local)
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);
  const [analysesLoading, setAnalysesLoading] = useState(false);
  const [assessmentsError, setAssessmentsError] = useState<string | null>(null);
  const [analysesError, setAnalysesError] = useState<string | null>(null);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Sync form state when user changes
  useEffect(() => {
    if (user) {
      setName(user.name);
      setBirthYear(user.birthYear?.toString() ?? '');
      setGender(user.gender ?? '');
    }
  }, [user]);

  // Load functions wrapped in useCallback
  const loadAssessments = useCallback(async () => {
    setAssessmentsLoading(true);
    setAssessmentsError(null);
    try {
      const data = await authService.getAssessments();
      setAssessmentsList(data);
    } catch (error) {
      console.error('Failed to load assessments:', error);
      setAssessmentsError(t('assessmentsTab.loadError'));
      setAssessmentsList([]);
    } finally {
      setAssessmentsLoading(false);
    }
  }, [setAssessmentsList, t]);

  const loadAnalyses = useCallback(async () => {
    setAnalysesLoading(true);
    setAnalysesError(null);
    try {
      const data = await authService.getAnalyses();
      setAnalysesList(data);
    } catch (error) {
      console.error('Failed to load analyses:', error);
      setAnalysesError(t('analysesTab.loadError'));
      setAnalysesList([]);
    } finally {
      setAnalysesLoading(false);
    }
  }, [setAnalysesList, t]);

  // Load assessments when tab changes (only if cache is stale or empty)
  useEffect(() => {
    if (activeTab === 'assessments' && (assessmentsList === null || isAssessmentsListStale())) {
      loadAssessments();
    }
  }, [activeTab, assessmentsList, isAssessmentsListStale, loadAssessments]);

  // Load analyses when tab changes (only if cache is stale or empty)
  useEffect(() => {
    if (activeTab === 'analyses' && (analysesList === null || isAnalysesListStale())) {
      loadAnalyses();
    }
  }, [activeTab, analysesList, isAnalysesListStale, loadAnalyses]);

  const handleNavigateToLanding = useCallback(() => {
    setView('landing');
  }, [setView]);

  const handleNavigateToAssessment = useCallback(() => {
    setView('assessment');
  }, [setView]);

  const handleNavigateToInsights = useCallback(() => {
    setView('insights');
  }, [setView]);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore logout errors
    } finally {
      // Clear all user data from stores
      clearResponses();
      clearAnalysis();
      clearAuth();
      setView('landing');
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    setProfileLoading(true);

    try {
      const updates: ProfileUpdateRequest = {};
      if (name !== user?.name) updates.name = name;
      if (birthYear !== user?.birthYear?.toString()) updates.birthYear = parseInt(birthYear, 10);
      if (gender !== (user?.gender ?? '')) updates.gender = gender || undefined;

      if (Object.keys(updates).length === 0) {
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
        setProfileLoading(false);
        return;
      }

      const updatedUser = await authService.updateProfile(updates);
      setUser(updatedUser);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError(t('auth:validation.passwordMismatch'));
      return;
    }

    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      setPasswordError(t('auth:validation.passwordTooShort'));
      return;
    }

    if (!PASSWORD_REGEX.test(newPassword)) {
      setPasswordError(t('auth:validation.passwordWeak'));
      return;
    }

    setPasswordLoading(true);

    try {
      const data: PasswordChangeRequest = {
        currentPassword,
        newPassword,
      };
      await authService.changePassword(data);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await authService.deleteAccount();
      clearAuth();
      setView('landing');
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : t('dangerTab.deleteFailed'));
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatDate = (dateString: string) => {
    const locale = i18n.language === 'pl' ? 'pl-PL' : 'en-US';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const tabs: { id: ProfileTab; labelKey: string }[] = [
    { id: 'profile', labelKey: 'profile.tabs.profile' },
    { id: 'password', labelKey: 'profile.tabs.password' },
    { id: 'assessments', labelKey: 'profile.tabs.assessments' },
    { id: 'analyses', labelKey: 'profile.tabs.analyses' },
    { id: 'danger', labelKey: 'profile.tabs.danger' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      {/* Fixed Ink Brush Decoration - Right side */}
      <InkBrushDecoration />

      {/* Page Navigation */}
      <PageNavigation
        currentPage="profile"
        onNavigateToLanding={handleNavigateToLanding}
        onNavigateToAssessment={handleNavigateToAssessment}
        onNavigateToInsights={handleNavigateToInsights}
        onNavigateToAuth={() => {}} // Already authenticated on profile page
        onNavigateToProfile={() => {}} // Already on profile
        onSignOut={handleLogout}
      />

      {/* Main content - with top padding for floating nav */}
      <main className="flex-1 max-w-4xl mx-auto px-6 pt-24 lg:pt-28 pb-12 w-full">
        {/* Page title */}
        <div className="mb-10">
          <h1 className="font-display text-3xl text-[var(--text-primary)] mb-2">
            {t('title')}
          </h1>
          <p className="font-body text-[var(--text-secondary)]">
            {t('subtitle')}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar tabs */}
          <nav className="md:w-48 flex-shrink-0">
            <ul className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
              {tabs.map((tab) => (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      w-full text-left px-4 py-2 font-body text-sm rounded-sm transition-colors whitespace-nowrap
                      ${activeTab === tab.id
                        ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] font-medium'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                      }
                      ${tab.id === 'danger' ? 'text-red-600 dark:text-red-400' : ''}
                    `}
                  >
                    {t(tab.labelKey)}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Tab content */}
          <div className="flex-1">
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-sm p-6">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <h2 className="font-display text-xl text-[var(--text-primary)] mb-6">
                    {t('profileTab.title')}
                  </h2>

                  <div className="space-y-1.5">
                    <label className="block font-mono text-xs uppercase tracking-wider text-[var(--text-secondary)]">
                      {t('profileTab.email')}
                    </label>
                    <p className="font-body text-[var(--text-primary)]">
                      {user?.email}
                    </p>
                    {!user?.emailVerified && (
                      <p className="font-body text-xs text-yellow-600 dark:text-yellow-400">
                        {t('profileTab.emailNotVerified')}
                      </p>
                    )}
                  </div>

                  <FormInput
                    label={t('profileTab.name')}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />

                  <FormInput
                    label={t('profileTab.birthYear')}
                    type="number"
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    min={minYear}
                    max={maxYear}
                    required
                  />

                  <div className="space-y-1.5">
                    <label
                      htmlFor="gender"
                      className="block font-mono text-xs uppercase tracking-wider text-[var(--text-secondary)]"
                    >
                      {t('profileTab.gender')}
                    </label>
                    <select
                      id="gender"
                      value={gender}
                      onChange={(e) => setGender(e.target.value as Gender | '')}
                      className={`
                        w-full p-3 font-body text-base
                        bg-[var(--bg-primary)] text-[var(--text-primary)]
                        border border-[var(--border)]
                        transition-colors duration-200
                        focus:outline-none focus:border-[var(--accent)]
                      `}
                    >
                      <option value="">{t('profileTab.genderOptions.default')}</option>
                      <option value="male">{t('profileTab.genderOptions.male')}</option>
                      <option value="female">{t('profileTab.genderOptions.female')}</option>
                      <option value="other">{t('profileTab.genderOptions.other')}</option>
                    </select>
                  </div>

                  {profileError && (
                    <p className="font-body text-sm text-red-600 dark:text-red-400">
                      {profileError}
                    </p>
                  )}

                  {profileSuccess && (
                    <p className="font-body text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                      <CheckIcon size="sm" />
                      {t('profileTab.updated')}
                    </p>
                  )}

                  <FormButton isLoading={profileLoading}>
                    {t('profileTab.saveChanges')}
                  </FormButton>
                </form>
              )}

              {/* Password Tab */}
              {activeTab === 'password' && (
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <h2 className="font-display text-xl text-[var(--text-primary)] mb-6">
                    {t('passwordTab.title')}
                  </h2>

                  <FormInput
                    label={t('passwordTab.currentPassword')}
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />

                  <FormInput
                    label={t('passwordTab.newPassword')}
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder={t('passwordTab.newPasswordPlaceholder')}
                  />

                  <FormInput
                    label={t('passwordTab.confirmPassword')}
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />

                  {passwordError && (
                    <p className="font-body text-sm text-red-600 dark:text-red-400">
                      {passwordError}
                    </p>
                  )}

                  {passwordSuccess && (
                    <p className="font-body text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                      <CheckIcon size="sm" />
                      {t('passwordTab.changed')}
                    </p>
                  )}

                  <FormButton isLoading={passwordLoading}>
                    {t('passwordTab.changePassword')}
                  </FormButton>
                </form>
              )}

              {/* Assessments Tab */}
              {activeTab === 'assessments' && (
                <div>
                  <h2 className="font-display text-xl text-[var(--text-primary)] mb-6">
                    {t('assessmentsTab.title')}
                  </h2>

                  {assessmentsLoading ? (
                    <div className="text-center py-12">
                      <LoadingSpinnerIcon size="lg" className="text-[var(--accent)] mx-auto mb-4" />
                      <p className="font-body text-[var(--text-secondary)]">{t('assessmentsTab.loading')}</p>
                    </div>
                  ) : assessmentsError ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-12">
                      <ErrorCircleIcon size="lg" className="text-red-500 dark:text-red-400" />
                      <p className="font-body text-red-600 dark:text-red-400">{assessmentsError}</p>
                      <button
                        onClick={loadAssessments}
                        className="flex items-center gap-2 font-body text-sm text-[var(--accent)] hover:underline"
                      >
                        <RefreshIcon size="sm" />
                        {t('assessmentsTab.retry')}
                      </button>
                    </div>
                  ) : !assessmentsList || assessmentsList.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="font-body text-[var(--text-secondary)]">
                        {t('assessmentsTab.empty')}
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {assessmentsList.map((assessment) => (
                        <li
                          key={assessment.id}
                          onClick={() => onNavigateToAssessmentById?.(assessment.id)}
                          className="p-4 border border-[var(--border)] rounded-sm hover:border-[var(--accent)] transition-colors cursor-pointer"
                        >
                          <p className="font-body text-[var(--text-primary)]">
                            {t('assessmentsTab.fromDate', { date: formatDate(assessment.createdAt) })}
                          </p>
                          <p className="font-body text-sm text-[var(--text-secondary)] mt-1">
                            {t('assessmentsTab.responses', { count: Object.keys(assessment.responses).length })}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Analyses Tab */}
              {activeTab === 'analyses' && (
                <div>
                  <h2 className="font-display text-xl text-[var(--text-primary)] mb-6">
                    {t('analysesTab.title')}
                  </h2>

                  {analysesLoading ? (
                    <div className="text-center py-12">
                      <LoadingSpinnerIcon size="lg" className="text-[var(--accent)] mx-auto mb-4" />
                      <p className="font-body text-[var(--text-secondary)]">{t('analysesTab.loading')}</p>
                    </div>
                  ) : analysesError ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-12">
                      <ErrorCircleIcon size="lg" className="text-red-500 dark:text-red-400" />
                      <p className="font-body text-red-600 dark:text-red-400">{analysesError}</p>
                      <button
                        onClick={loadAnalyses}
                        className="flex items-center gap-2 font-body text-sm text-[var(--accent)] hover:underline"
                      >
                        <RefreshIcon size="sm" />
                        {t('analysesTab.retry')}
                      </button>
                    </div>
                  ) : !analysesList || analysesList.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="font-body text-[var(--text-secondary)]">
                        {t('analysesTab.empty')}
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {analysesList.map((analysis) => (
                        <li
                          key={analysis.id}
                          onClick={() => onNavigateToInsightsById?.(analysis.id)}
                          className="p-4 border border-[var(--border)] rounded-sm hover:border-[var(--accent)] transition-colors cursor-pointer"
                        >
                          <p className="font-body text-[var(--text-primary)]">
                            {t('analysesTab.fromDate', { date: formatDate(analysis.createdAt) })}
                          </p>
                          {analysis.result.identitySynthesis && (
                            <p className="font-body text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">
                              {analysis.result.identitySynthesis.currentIdentityCore}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Danger Zone Tab */}
              {activeTab === 'danger' && (
                <div>
                  <h2 className="font-display text-xl text-red-600 dark:text-red-400 mb-6">
                    {t('dangerTab.title')}
                  </h2>

                  {deleteError && (
                    <div className="mb-4 p-4 border border-red-200 dark:border-red-800 rounded-sm bg-red-50 dark:bg-red-900/20">
                      <p className="font-body text-sm text-red-600 dark:text-red-400">
                        {deleteError}
                      </p>
                    </div>
                  )}

                  <div className="p-4 border border-red-200 dark:border-red-800 rounded-sm bg-red-50 dark:bg-red-900/20">
                    <h3 className="font-body font-medium text-red-700 dark:text-red-300 mb-2">
                      {t('dangerTab.deleteTitle')}
                    </h3>
                    <p className="font-body text-sm text-red-600 dark:text-red-400 mb-4">
                      {t('dangerTab.deleteWarning')}
                    </p>

                    {!showDeleteConfirm ? (
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-4 py-2 font-body text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-sm transition-colors"
                      >
                        {t('dangerTab.deleteButton')}
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <p className="font-body text-sm text-red-700 dark:text-red-300 font-medium">
                          {t('dangerTab.confirmPrompt')}
                        </p>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={handleDeleteAccount}
                            disabled={deleteLoading}
                            className="px-4 py-2 font-body text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-sm transition-colors disabled:opacity-50"
                          >
                            {deleteLoading ? t('dangerTab.deleting') : t('dangerTab.confirmDelete')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(false)}
                            className="px-4 py-2 font-body text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                          >
                            {t('dangerTab.cancel')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <FooterSection />
    </div>
  );
};

export default ProfilePage;
