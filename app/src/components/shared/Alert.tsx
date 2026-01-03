/**
 * @file app/src/components/shared/Alert.tsx
 * @purpose Unified alert component for displaying error, warning, info, and success messages
 * @functionality
 * - Provides four severity variants (error, warning, info, success) with distinct styling
 * - Supports compound component pattern with Alert.Actions and Alert.Action
 * - Offers convenience wrappers (Alert.Error, Alert.Warning, Alert.Info, Alert.Success)
 * - Handles auto-focus for error variant (blocking alerts)
 * - Provides onDismiss for optional close button
 * - Responsive layout (stacks on mobile, horizontal on tablet+)
 * - Full accessibility support with ARIA attributes
 * - Enter animations using Tailwind utilities
 * @dependencies
 * - React (forwardRef, useEffect, useRef, useContext, createContext, useCallback, useMemo)
 * - react-i18next (useTranslation)
 * - Ink & Stone design system CSS variables
 */

import {
  forwardRef,
  useEffect,
  useRef,
  useContext,
  createContext,
  useCallback,
  useMemo,
  type FC,
  type ReactNode,
  type RefObject,
} from 'react';
import { useTranslation } from 'react-i18next';

// ============================================================================
// Types
// ============================================================================

type AlertVariant = 'error' | 'warning' | 'info' | 'success';

interface AlertProps {
  /** Alert severity variant */
  variant: AlertVariant;
  /** Alert title (bold heading) */
  title: string;
  /** Optional description text */
  description?: string;
  /** Optional additional note (smaller text) */
  note?: string;
  /** Optional dismiss handler - shows close button when provided */
  onDismiss?: () => void;
  /** Children for action buttons */
  children?: ReactNode;
  /** Additional CSS classes for layout control */
  className?: string;
  /** Optional data-testid */
  'data-testid'?: string;
}

interface AlertActionProps {
  /** Button click handler */
  onClick: () => void;
  /** Button label */
  children: ReactNode;
  /** Disable button (e.g., during loading) */
  disabled?: boolean;
  /** Show loading spinner */
  loading?: boolean;
  /** Button style variant */
  variant?: 'primary' | 'secondary';
  /** Optional data-testid */
  'data-testid'?: string;
}

interface AlertActionsProps {
  /** Action buttons */
  children: ReactNode;
  /** Optional data-testid */
  'data-testid'?: string;
}

// ============================================================================
// Icons
// ============================================================================

interface IconProps {
  className?: string;
}

const ErrorIcon: FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const WarningIcon: FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const InfoIcon: FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const SuccessIcon: FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const CloseIcon: FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SpinnerIcon: FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`animate-spin ${className ?? ''}`}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

// ============================================================================
// Variant Configuration
// ============================================================================

interface VariantConfig {
  icon: FC<IconProps>;
  colors: string;
  iconColor: string;
  titleColor: string;
  ariaLive: 'assertive' | 'polite';
  autoFocus: boolean;
}

const variantConfig: Record<AlertVariant, VariantConfig> = {
  error: {
    icon: ErrorIcon,
    colors: 'border-red-500/30 bg-red-500/5',
    iconColor: 'text-red-500',
    titleColor: 'text-red-600 dark:text-red-400',
    ariaLive: 'assertive',
    autoFocus: true,
  },
  warning: {
    icon: WarningIcon,
    colors: 'border-[var(--accent)]/30 bg-[var(--accent)]/5',
    iconColor: 'text-[var(--accent)]',
    titleColor: 'text-[var(--text-primary)]',
    ariaLive: 'polite',
    autoFocus: false,
  },
  info: {
    icon: InfoIcon,
    colors: 'border-blue-500/30 bg-blue-500/5',
    iconColor: 'text-blue-500',
    titleColor: 'text-blue-600 dark:text-blue-400',
    ariaLive: 'polite',
    autoFocus: false,
  },
  success: {
    icon: SuccessIcon,
    colors: 'border-green-500/30 bg-green-500/5',
    iconColor: 'text-green-500',
    titleColor: 'text-green-600 dark:text-green-400',
    ariaLive: 'polite',
    autoFocus: false,
  },
};

// ============================================================================
// Context for Focus Management
// ============================================================================

interface AlertContextValue {
  primaryActionRef: RefObject<HTMLButtonElement | null> | null;
  claimFirstAction: () => boolean;
  variant: AlertVariant;
}

const AlertContext = createContext<AlertContextValue>({
  primaryActionRef: null,
  claimFirstAction: () => false,
  variant: 'info',
});

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Container for action buttons within an Alert
 */
const AlertActions: FC<AlertActionsProps> = ({ children, 'data-testid': testId }) => (
  <div
    className="flex items-center gap-2 flex-shrink-0"
    data-testid={testId}
  >
    {children}
  </div>
);
AlertActions.displayName = 'Alert.Actions';

/**
 * Action button within an Alert
 */
const AlertAction = forwardRef<HTMLButtonElement, AlertActionProps>(
  (
    {
      onClick,
      children,
      disabled = false,
      loading = false,
      variant = 'primary',
      'data-testid': testId,
    },
    externalRef
  ) => {
    const { primaryActionRef, claimFirstAction, variant: alertVariant } = useContext(AlertContext);
    const internalRef = useRef<HTMLButtonElement>(null);

    // Claim first action for auto-focus
    const isFirst = useMemo(() => claimFirstAction(), [claimFirstAction]);

    // Use primary ref for first action if auto-focus is enabled, otherwise use external ref
    const config = variantConfig[alertVariant];
    const shouldUsePrimaryRef = isFirst && config.autoFocus && primaryActionRef;

    // Determine which ref to use
    const buttonRef = shouldUsePrimaryRef
      ? primaryActionRef
      : externalRef ?? internalRef;

    // Button styling based on variant and alert variant
    const baseStyles =
      'px-4 py-2 text-sm font-medium rounded-sm transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2';

    const variantStyles =
      variant === 'primary'
        ? alertVariant === 'error'
          ? 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500/50'
          : 'bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 focus:ring-[var(--accent)]/50'
        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus:ring-[var(--accent)]/50';

    return (
      <button
        ref={buttonRef as RefObject<HTMLButtonElement>}
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        data-testid={testId}
        className={`${baseStyles} ${variantStyles}`}
      >
        {loading && <SpinnerIcon className="w-4 h-4" />}
        {children}
      </button>
    );
  }
);
AlertAction.displayName = 'Alert.Action';

// ============================================================================
// Main Component
// ============================================================================

const AlertBase = forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      variant,
      title,
      description,
      note,
      onDismiss,
      children,
      className = '',
      'data-testid': testId = 'alert',
    },
    ref
  ) => {
    const { t } = useTranslation('common');
    const config = variantConfig[variant];
    const Icon = config.icon;

    // Refs for focus management
    const primaryActionRef = useRef<HTMLButtonElement>(null);
    const firstActionClaimed = useRef(false);

    // Reset claim on variant or children change
    // Children change when action buttons are added/removed
    useEffect(() => {
      firstActionClaimed.current = false;
    }, [variant, children]);

    const claimFirstAction = useCallback(() => {
      if (!firstActionClaimed.current) {
        firstActionClaimed.current = true;
        return true;
      }
      return false;
    }, []);

    // Auto-focus primary action for error variant
    useEffect(() => {
      if (config.autoFocus && primaryActionRef.current) {
        // Small delay to ensure DOM is ready
        const timer = setTimeout(() => {
          primaryActionRef.current?.focus();
        }, 100);
        return () => {
          clearTimeout(timer);
        };
      }
      return undefined;
    }, [config.autoFocus]);

    // Context value for children
    const contextValue = useMemo<AlertContextValue>(
      () => ({
        primaryActionRef,
        claimFirstAction,
        variant,
      }),
      [claimFirstAction, variant]
    );

    // IDs for ARIA
    const titleId = `${testId}-title`;
    const descriptionId = description ? `${testId}-description` : undefined;

    return (
      <AlertContext.Provider value={contextValue}>
        <div
          ref={ref}
          role="alert"
          aria-live={config.ariaLive}
          aria-atomic="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          data-testid={testId}
          className={`
            flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-sm border
            animate-in fade-in slide-in-from-top-2 duration-200
            ${config.colors}
            ${className}
          `.trim()}
        >
          {/* Icon and text content */}
          <div className="flex items-start gap-3 flex-1 max-w-prose">
            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
            <div className="flex flex-col gap-1">
              <p
                id={titleId}
                className={`text-sm font-medium ${config.titleColor}`}
                data-testid={`${testId}-title`}
              >
                {title}
              </p>
              {description && (
                <p
                  id={descriptionId}
                  className="text-sm text-[var(--text-secondary)]"
                  data-testid={`${testId}-description`}
                >
                  {description}
                </p>
              )}
              {note && (
                <p
                  className="text-xs text-[var(--text-secondary)]/70 mt-1"
                  data-testid={`${testId}-note`}
                >
                  {note}
                </p>
              )}
            </div>
          </div>

          {/* Close button if onDismiss provided */}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label={t('alert.actions.close', 'Close')}
              data-testid={`${testId}-close`}
              className="flex-shrink-0 p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 rounded-sm sm:order-last"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          )}

          {/* Action buttons */}
          {children}
        </div>
      </AlertContext.Provider>
    );
  }
);
AlertBase.displayName = 'Alert';

// ============================================================================
// Compound Component Types
// ============================================================================

type VariantProps = Omit<AlertProps, 'variant'>;

type AlertComponent = typeof AlertBase & {
  Actions: typeof AlertActions;
  Action: typeof AlertAction;
  Error: React.ForwardRefExoticComponent<VariantProps & React.RefAttributes<HTMLDivElement>>;
  Warning: React.ForwardRefExoticComponent<VariantProps & React.RefAttributes<HTMLDivElement>>;
  Info: React.ForwardRefExoticComponent<VariantProps & React.RefAttributes<HTMLDivElement>>;
  Success: React.ForwardRefExoticComponent<VariantProps & React.RefAttributes<HTMLDivElement>>;
};

// ============================================================================
// Compound Component Assembly
// ============================================================================

const Alert = AlertBase as AlertComponent;
Alert.Actions = AlertActions;
Alert.Action = AlertAction;

// Convenience wrappers with explicit typing
Alert.Error = forwardRef<HTMLDivElement, VariantProps>((props, ref) => (
  <AlertBase ref={ref} {...props} variant="error" />
));
Alert.Error.displayName = 'Alert.Error';

Alert.Warning = forwardRef<HTMLDivElement, VariantProps>((props, ref) => (
  <AlertBase ref={ref} {...props} variant="warning" />
));
Alert.Warning.displayName = 'Alert.Warning';

Alert.Info = forwardRef<HTMLDivElement, VariantProps>((props, ref) => (
  <AlertBase ref={ref} {...props} variant="info" />
));
Alert.Info.displayName = 'Alert.Info';

Alert.Success = forwardRef<HTMLDivElement, VariantProps>((props, ref) => (
  <AlertBase ref={ref} {...props} variant="success" />
));
Alert.Success.displayName = 'Alert.Success';

export default Alert;
