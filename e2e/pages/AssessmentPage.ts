/**
 * @file e2e/pages/AssessmentPage.ts
 * @purpose Page object for assessment questionnaire flow
 * @functionality
 * - Navigates through multi-phase assessment wizard
 * - Handles different step types (multiSelect, singleSelect, scale, textarea)
 * - Provides progress tracking
 * - Handles intro and synthesis steps
 * - Supports completing a full assessment with sample data
 * - Validates step completion with error message detection
 * - Detects readonly mode (synthesis-only view)
 * - Verifies view-only badge and disabled inputs
 * @dependencies
 * - BasePage for common functionality
 * - @playwright/test for Page type
 */

import { BasePage } from './BasePage';

/**
 * Page object for the assessment questionnaire.
 *
 * The assessment consists of multiple phases:
 * 1. State Awareness - Energy, mood, motivation patterns
 * 2. Identity Mapping - Current self through behaviors/values
 *
 * Each phase has multiple steps with different input types:
 * - multiSelect: Multiple choice checkboxes
 * - singleSelect: Radio button selection
 * - scale: Slider input (1-5)
 * - textarea: Free text input
 */
export class AssessmentPage extends BasePage {
  // Navigation button selectors
  readonly nextButton = 'button:has-text("Next"), button:has-text("Continue")';
  readonly backButton = 'button:has-text("Back"), button:has-text("Previous")';
  readonly beginButton = 'button:has-text("Begin"), button:has-text("Start")';
  readonly completeButton = '[data-testid="assessment-complete-button"]';

  // Progress indicators
  readonly progressBar = '[role="progressbar"]';
  readonly progressIndicator = '[class*="progress"]';
  readonly phaseTitle = 'h1, h2';

  // Step type selectors - use data-testid for reliable detection
  readonly multiSelectStep = '[data-testid="multi-select-step"]';
  readonly singleSelectStep = '[data-testid="single-select-step"]';
  readonly scaleStep = '[data-testid="scale-step"]';
  readonly textareaStep = '[data-testid="textarea-step"]';
  readonly introStep = '[data-testid="intro-step"]';
  readonly synthesisStep = '[data-testid="synthesis-step"]';

  // Input element selectors
  readonly multiSelectOption = '[data-testid="multi-select-option"]';
  readonly singleSelectOption = '[data-testid="single-select-option"]';
  readonly scaleOption = '[data-testid="scale-option"]';
  readonly textareaInput = '[data-testid="textarea-input"]';

  // Validation error selectors
  readonly validationError = '[data-testid="validation-error"]';

  // Readonly mode selectors
  readonly viewOnlyBadge = '[data-testid="view-only-badge"]';
  readonly progressHeader = '[data-testid="assessment-progress"]';
  readonly pageHeader = '[data-testid="page-header"]';

  // Unified header selectors
  readonly assessmentHeader = '[data-testid="assessment-header"]';
  readonly skipToLastButton = '[data-testid="assessment-btn-skip-to-last"]';
  readonly retakeButton = '[data-testid="assessment-btn-retake"]';
  readonly importButton = '[data-testid="import-btn-assessment"]';
  readonly exportButton = '[data-testid="export-btn-assessment"]';

  // SavePromptModal selectors (shown at synthesis for unauthenticated users)
  readonly savePromptModal = '[data-testid="save-prompt-modal"]';
  readonly savePromptDismiss = '[data-testid="save-prompt-dismiss"]';
  readonly savePromptSignIn = '[data-testid="save-prompt-sign-in"]';
  readonly savePromptCreateAccount = '[data-testid="save-prompt-create-account"]';

  /**
   * Navigate to the assessment page
   */
  async navigate(): Promise<void> {
    await this.goto('/assessment');
  }

  /**
   * Start the assessment from the intro page
   */
  async startAssessment(): Promise<void> {
    // Wait for and click the begin/start button
    const beginBtn = this.page.locator(this.beginButton).first();
    if (await beginBtn.isVisible({ timeout: 5000 })) {
      await beginBtn.click();
      await this.waitForNavigation();
    }
  }

  /**
   * Select multiple options in a multiSelect step
   *
   * @param indices - Array of option indices to select (0-based)
   */
  async selectMultipleOptions(indices: number[]): Promise<void> {
    const options = await this.page.locator(this.multiSelectOption).all();
    for (const index of indices) {
      if (options[index]) {
        await options[index].click();
        // Small delay between clicks for stability
        await this.page.waitForTimeout(100);
      }
    }
  }

  /**
   * Select a single option in a singleSelect step
   *
   * @param index - Option index to select (0-based)
   */
  async selectSingleOption(index: number): Promise<void> {
    const options = await this.page.locator(this.singleSelectOption).all();
    if (options[index]) {
      await options[index].click();
    }
  }

  /**
   * Set scale value by clicking the corresponding button (1-5)
   *
   * @param value - Scale value (1-5)
   */
  async setScaleValue(value: number): Promise<void> {
    // Scale options are buttons 1-5, click the one matching the value
    const options = await this.page.locator(this.scaleOption).all();
    const index = value - 1; // value 1 = index 0
    if (options[index]) {
      await options[index].click();
    }
  }

  /**
   * Fill textarea for free text steps
   *
   * @param text - Text to enter
   */
  async fillTextarea(text: string): Promise<void> {
    const textarea = this.page.locator(this.textareaInput);
    if (await textarea.isVisible()) {
      await textarea.fill(text);
    }
  }

  /**
   * Click the next/continue button
   */
  async clickNext(): Promise<void> {
    await this.page.click(this.nextButton);
    // Wait for animation/transition
    await this.page.waitForTimeout(300);
  }

  /**
   * Click the back/previous button
   */
  async clickBack(): Promise<void> {
    await this.page.click(this.backButton);
    await this.page.waitForTimeout(300);
  }

  /**
   * Complete the assessment at the synthesis step
   */
  async clickComplete(): Promise<void> {
    // Wait for complete button to be visible before clicking
    await this.page.waitForSelector(this.completeButton, { state: 'visible', timeout: 10000 });
    await this.page.click(this.completeButton);
    await this.waitForNavigation();
  }

  /**
   * Get the current phase title
   *
   * @returns The phase title text
   */
  async getCurrentPhaseTitle(): Promise<string> {
    const title = this.page.locator(this.phaseTitle).first();
    return (await title.textContent()) ?? '';
  }

  /**
   * Check if the next button is enabled
   *
   * @returns True if next button is enabled
   */
  async isNextEnabled(): Promise<boolean> {
    const nextBtn = this.page.locator(this.nextButton).first();
    return !(await nextBtn.isDisabled());
  }

  /**
   * Check if the back button is visible
   *
   * @returns True if back button is visible
   */
  async isBackVisible(): Promise<boolean> {
    return await this.page.locator(this.backButton).isVisible();
  }

  /**
   * Get the current step type based on visible step containers
   *
   * @returns The step type or 'unknown'
   */
  async getCurrentStepType(): Promise<'intro' | 'multiSelect' | 'singleSelect' | 'scale' | 'textarea' | 'synthesis' | 'unknown'> {
    if (await this.page.locator(this.introStep).isVisible({ timeout: 1000 }).catch(() => false)) {
      return 'intro';
    }
    if (await this.page.locator(this.multiSelectStep).isVisible({ timeout: 1000 }).catch(() => false)) {
      return 'multiSelect';
    }
    if (await this.page.locator(this.singleSelectStep).isVisible({ timeout: 1000 }).catch(() => false)) {
      return 'singleSelect';
    }
    if (await this.page.locator(this.scaleStep).isVisible({ timeout: 1000 }).catch(() => false)) {
      return 'scale';
    }
    if (await this.page.locator(this.textareaStep).isVisible({ timeout: 1000 }).catch(() => false)) {
      return 'textarea';
    }
    if (await this.page.locator(this.synthesisStep).isVisible({ timeout: 1000 }).catch(() => false)) {
      return 'synthesis';
    }
    return 'unknown';
  }

  /**
   * Complete a full assessment flow with sample data.
   * This navigates through all phases and steps with realistic test data.
   */
  async completeFullAssessment(): Promise<void> {
    await this.startAssessment();

    // Phase 1: State Awareness (8 steps)
    // Step 1: Peak energy times (multiSelect)
    await this.selectMultipleOptions([0, 2]);
    await this.clickNext();

    // Step 2: Low energy times (multiSelect)
    await this.selectMultipleOptions([3, 4]);
    await this.clickNext();

    // Step 3: Energy consistency (scale)
    await this.setScaleValue(3);
    await this.clickNext();

    // Step 4: Energy drains (textarea)
    await this.fillTextarea('Long meetings and unclear expectations drain my energy');
    await this.clickNext();

    // Step 5: Energy restores (textarea)
    await this.fillTextarea('Morning walks and focused work time restore my energy');
    await this.clickNext();

    // Step 6: Mood triggers (multiSelect)
    await this.selectMultipleOptions([0, 2, 4]);
    await this.clickNext();

    // Step 7: Motivation reliability (scale)
    await this.setScaleValue(4);
    await this.clickNext();

    // Step 8: Willpower pattern (singleSelect)
    await this.selectSingleOption(1);
    await this.clickNext();

    // Phase 2 intro - just continue
    const stepType = await this.getCurrentStepType();
    if (stepType === 'intro') {
      // Phase 2 intro screen - click next to proceed
      await this.clickNext();
    }

    // Phase 2: Identity Mapping (8 steps)
    // Step 1: Identity statements (textarea)
    await this.fillTextarea('I am someone who values learning and continuous growth');
    await this.clickNext();

    // Step 2: Others describe (textarea)
    await this.fillTextarea('Thoughtful, analytical, always looking to improve');
    await this.clickNext();

    // Step 3: Automatic behaviors (textarea)
    await this.fillTextarea('I check email first thing in the morning; I take notes in every meeting');
    await this.clickNext();

    // Step 4: Keystone behaviors (textarea)
    await this.fillTextarea('My morning planning session sets the tone for my entire day');
    await this.clickNext();

    // Step 5: Core values (multiSelect)
    await this.selectMultipleOptions([0, 2, 4]);
    await this.clickNext();

    // Step 6: Natural strengths (textarea)
    await this.fillTextarea('Problem solving, connecting disparate ideas, deep focus');
    await this.clickNext();

    // Step 7: Resistance patterns (textarea)
    await this.fillTextarea('I procrastinate on ambiguous tasks and avoid confrontation');
    await this.clickNext();

    // Step 8: Identity clarity (scale)
    await this.setScaleValue(4);
    await this.clickNext();

    // Synthesis step - complete the assessment
    await this.clickComplete();
  }

  /**
   * Check if validation error is visible
   *
   * @returns True if validation error is visible
   */
  async isValidationErrorVisible(): Promise<boolean> {
    return await this.page.locator(this.validationError).isVisible({ timeout: 1000 }).catch(() => false);
  }

  /**
   * Get the validation error text
   *
   * @returns The validation error text or empty string
   */
  async getValidationErrorText(): Promise<string> {
    const errorElement = this.page.locator(this.validationError);
    if (await errorElement.isVisible({ timeout: 1000 }).catch(() => false)) {
      return (await errorElement.textContent()) ?? '';
    }
    return '';
  }

  /**
   * Attempt to click next without filling the step (for validation testing)
   * Does not wait for navigation since validation should prevent it
   */
  async tryClickNextWithoutWait(): Promise<void> {
    await this.page.click(this.nextButton);
    // Small delay to allow validation error to appear
    await this.page.waitForTimeout(200);
  }

  /**
   * Check if the assessment is in readonly mode (synthesis-only)
   *
   * @returns True if in readonly mode
   */
  async isReadOnlyMode(): Promise<boolean> {
    // In readonly mode, synthesis step is shown and progress header is hidden
    const hasSynthesis = await this.page
      .locator(this.synthesisStep)
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    const hasProgressHeader = await this.page
      .locator(this.progressHeader)
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    // Readonly mode = synthesis visible, progress header hidden
    return hasSynthesis && !hasProgressHeader;
  }

  /**
   * Check if the view-only badge is visible
   *
   * @returns True if view-only badge is visible
   */
  async hasViewOnlyBadge(): Promise<boolean> {
    return await this.page
      .locator(this.viewOnlyBadge)
      .isVisible({ timeout: 3000 })
      .catch(() => false);
  }

  /**
   * Check if page header is visible (now using unified assessment header)
   *
   * @returns True if assessment header is visible
   */
  async hasPageHeader(): Promise<boolean> {
    return await this.page
      .locator(this.assessmentHeader)
      .isVisible({ timeout: 3000 })
      .catch(() => false);
  }

  /**
   * Check if progress header is visible (hidden in readonly mode)
   *
   * @returns True if progress header is visible
   */
  async hasProgressHeader(): Promise<boolean> {
    return await this.page
      .locator(this.progressHeader)
      .isVisible({ timeout: 3000 })
      .catch(() => false);
  }

  /**
   * Navigate to a specific saved assessment (readonly view)
   *
   * @param assessmentId - The ID of the assessment to view
   */
  async viewAssessment(assessmentId: string): Promise<void> {
    await this.goto(`/assessment/${assessmentId}`);
  }

  /**
   * Click the Skip to Last button in the header
   */
  async clickSkipToLast(): Promise<void> {
    await this.page.click(this.skipToLastButton);
    await this.page.waitForTimeout(300);
  }

  /**
   * Click the Retake button in the header (only visible for readonly assessments)
   */
  async clickRetake(): Promise<void> {
    await this.page.click(this.retakeButton);
    await this.page.waitForTimeout(300);
  }

  /**
   * Check if the Skip to Last button is enabled
   *
   * @returns True if button is enabled
   */
  async isSkipToLastEnabled(): Promise<boolean> {
    return !(await this.page.locator(this.skipToLastButton).isDisabled());
  }

  /**
   * Check if the unified assessment header is visible
   *
   * @returns True if header is visible
   */
  async hasAssessmentHeader(): Promise<boolean> {
    return await this.page
      .locator(this.assessmentHeader)
      .isVisible({ timeout: 3000 })
      .catch(() => false);
  }

  /**
   * Check if the Retake button is visible
   *
   * @returns True if button is visible
   */
  async isRetakeButtonVisible(): Promise<boolean> {
    return await this.page
      .locator(this.retakeButton)
      .isVisible({ timeout: 3000 })
      .catch(() => false);
  }

  /**
   * Check if the Import button is visible
   *
   * @returns True if button is visible
   */
  async isImportButtonVisible(): Promise<boolean> {
    return await this.page
      .locator(this.importButton)
      .isVisible({ timeout: 3000 })
      .catch(() => false);
  }

  /**
   * Check if the SavePromptModal is visible
   *
   * @returns True if modal is visible
   */
  async isSavePromptModalVisible(): Promise<boolean> {
    return await this.page
      .locator(this.savePromptModal)
      .isVisible({ timeout: 2000 })
      .catch(() => false);
  }

  /**
   * Dismiss the SavePromptModal if visible
   */
  async dismissSavePromptModal(): Promise<void> {
    const modal = this.page.locator(this.savePromptModal);
    if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.page.click(this.savePromptDismiss);
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Click "Sign In" button on SavePromptModal
   */
  async clickSavePromptSignIn(): Promise<void> {
    await this.page.click(this.savePromptSignIn);
    await this.waitForNavigation();
  }

  /**
   * Click "Create Account" button on SavePromptModal
   */
  async clickSavePromptCreateAccount(): Promise<void> {
    await this.page.click(this.savePromptCreateAccount);
    await this.waitForNavigation();
  }
}
