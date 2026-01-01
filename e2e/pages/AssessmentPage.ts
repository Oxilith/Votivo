/**
 * @file e2e/pages/AssessmentPage.ts
 * @purpose Page object for assessment questionnaire flow
 * @functionality
 * - Navigates through multi-phase assessment wizard
 * - Handles different step types (multiSelect, singleSelect, scale, textarea)
 * - Provides progress tracking
 * - Handles intro and synthesis steps
 * - Supports completing a full assessment with sample data
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
  readonly completeButton = 'button:has-text("Complete"), button:has-text("Finish")';

  // Progress indicators
  readonly progressBar = '[role="progressbar"]';
  readonly progressIndicator = '[class*="progress"]';
  readonly phaseTitle = 'h1, h2';

  // Step type selectors
  readonly multiSelectOption = 'button[role="checkbox"], [role="checkbox"]';
  readonly singleSelectOption = 'button[role="radio"], [role="radio"]';
  readonly scaleSlider = 'input[type="range"]';
  readonly textareaInput = 'textarea';

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
   * Set slider value for scale steps
   *
   * @param value - Scale value (typically 1-5)
   */
  async setSliderValue(value: number): Promise<void> {
    const slider = this.page.locator(this.scaleSlider);
    if (await slider.isVisible()) {
      await slider.fill(String(value));
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
   * Get the current step type based on visible input elements
   *
   * @returns The step type or 'unknown'
   */
  async getCurrentStepType(): Promise<'multiSelect' | 'singleSelect' | 'scale' | 'textarea' | 'unknown'> {
    if (await this.page.locator(this.multiSelectOption).first().isVisible({ timeout: 1000 }).catch(() => false)) {
      return 'multiSelect';
    }
    if (await this.page.locator(this.singleSelectOption).first().isVisible({ timeout: 1000 }).catch(() => false)) {
      return 'singleSelect';
    }
    if (await this.page.locator(this.scaleSlider).isVisible({ timeout: 1000 }).catch(() => false)) {
      return 'scale';
    }
    if (await this.page.locator(this.textareaInput).isVisible({ timeout: 1000 }).catch(() => false)) {
      return 'textarea';
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
    await this.setSliderValue(3);
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
    await this.setSliderValue(4);
    await this.clickNext();

    // Step 8: Willpower pattern (singleSelect)
    await this.selectSingleOption(1);
    await this.clickNext();

    // Phase 2 intro - just continue
    const stepType = await this.getCurrentStepType();
    if (stepType === 'unknown') {
      // Likely an intro/transition screen
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
    await this.setSliderValue(4);
    await this.clickNext();

    // Synthesis step - complete the assessment
    await this.clickComplete();
  }
}
