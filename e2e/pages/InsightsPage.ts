/**
 * @file e2e/pages/InsightsPage.ts
 * @purpose Page object for AI insights display
 * @functionality
 * - Displays analysis results in tabbed interface
 * - Handles loading and error states
 * - Provides tab navigation for different insight categories
 * - Shows identity synthesis section
 * - Detects incomplete assessment warning alert
 * - Handles pending changes alert visibility
 * @dependencies
 * - BasePage for common functionality
 * - @playwright/test for Page type
 */

import { BasePage } from './BasePage';
import { E2E_TIMEOUTS } from '../fixtures/mock-data';

/**
 * Insight tab types corresponding to analysis categories
 */
export type InsightTab = 'patterns' | 'contradictions' | 'blindSpots' | 'leverage' | 'risks';

/**
 * Page object for the insights/analysis results page.
 *
 * The insights page displays AI analysis results in a tabbed interface:
 * - Patterns: Behavioral patterns identified
 * - Contradictions: Conflicting behaviors or values
 * - Blind Spots: Areas of limited self-awareness
 * - Leverage Points: High-impact areas for change
 * - Risks: Potential obstacles to change
 * - Identity Synthesis: Integrated identity narrative
 */
export class InsightsPage extends BasePage {
  // Action buttons (using data-testid for reliability)
  readonly analyzeButton = '[data-testid="insights-btn-analyze"]';

  // Loading and error states
  readonly loadingIndicator = '[data-testid="ink-loader"]';
  readonly errorMessage = '[data-testid="insights-error"]';

  // Tab navigation (using data-testid for reliability)
  readonly tabList = '[data-testid="insights-tabs"]';
  readonly patternsTab = '[data-testid="insights-tab-patterns"]';
  readonly contradictionsTab = '[data-testid="insights-tab-contradictions"]';
  readonly blindSpotsTab = '[data-testid="insights-tab-blindSpots"]';
  readonly leverageTab = '[data-testid="insights-tab-leverage"]';
  readonly risksTab = '[data-testid="insights-tab-risks"]';

  // Content sections (using data-testid for reliability)
  readonly insightCard = '[data-testid="insight-card"]';
  readonly synthesisSection = '[data-testid="insights-tabpanel-synthesis"]';
  readonly noAssessmentMessage = '[data-testid="insights-no-assessment"]';

  // Incomplete assessment state selectors
  readonly incompleteWarning = '[data-testid="insights-incomplete-warning"]';
  readonly pendingChangesAlert = '[data-testid="pending-changes-alert"]';
  readonly reanalyzeIncompleteWarning = '[data-testid="insights-reanalyze-incomplete-warning"]';
  readonly readyState = '[data-testid="insights-ready"]';
  readonly noAssessmentState = '[data-testid="insights-no-assessment"]';
  readonly insightsPage = '[data-testid="insights-page"]';
  readonly insightsTabs = '[data-testid="insights-tabs"]';
  readonly analyzeTestId = '[data-testid="insights-btn-analyze"]';
  readonly reanalyzeTestId = '[data-testid="insights-btn-reanalyze"]';

  /**
   * Navigate to the insights page
   */
  async navigate(): Promise<void> {
    await this.goto('/insights');
  }

  /**
   * Wait for page to be ready (any content state visible)
   * Use this before checking specific states like isReadyState(), isNoAssessmentState()
   *
   * @param timeout - Maximum wait time (default 10 seconds)
   */
  async waitForPageReady(timeout = E2E_TIMEOUTS.navigation): Promise<void> {
    // Wait for any of the possible content states to be visible
    await this.page.waitForSelector(
      `${this.readyState}, ${this.noAssessmentState}, ${this.insightsTabs}, ${this.pendingChangesAlert}`,
      { state: 'visible', timeout }
    );
  }

  /**
   * Wait for analysis to complete
   *
   * @param timeout - Maximum wait time (default 2 minutes for AI analysis)
   */
  async waitForAnalysis(timeout = E2E_TIMEOUTS.analysis): Promise<void> {
    // Wait for loading to disappear and content to appear
    try {
      await this.page.waitForSelector(this.loadingIndicator, { state: 'hidden', timeout });
    } catch (error) {
      // Loading indicator might not be visible
      if (error instanceof Error && !error.message.includes('Timeout')) {
        console.debug('Analysis loading indicator wait failed:', error.message);
      }
    }

    // Wait for insight cards to appear
    await this.page.waitForSelector(this.insightCard, { timeout });
  }

  /**
   * Check if analysis is currently loading
   *
   * @returns True if loading indicator is visible
   */
  async isLoading(): Promise<boolean> {
    try {
      return await this.page.locator(this.loadingIndicator).isVisible({ timeout: E2E_TIMEOUTS.elementQuick });
    } catch (error) {
      if (error instanceof Error && !error.message.includes('Timeout')) {
        console.debug('Loading indicator check failed:', error.message);
      }
      return false;
    }
  }

  /**
   * Check if an error is displayed
   *
   * @returns True if error message is visible
   */
  async hasError(): Promise<boolean> {
    try {
      return await this.page.locator(this.errorMessage).isVisible({ timeout: E2E_TIMEOUTS.elementQuick });
    } catch (error) {
      if (error instanceof Error && !error.message.includes('Timeout')) {
        console.debug('Error message check failed:', error.message);
      }
      return false;
    }
  }

  /**
   * Get the error message text
   *
   * @returns Error message or null
   */
  async getErrorMessage(): Promise<string | null> {
    try {
      const error = this.page.locator(this.errorMessage);
      if (await error.isVisible()) {
        return await error.textContent();
      }
    } catch (error) {
      // Timeout expected when no error displayed
      if (error instanceof Error && !error.message.includes('Timeout')) {
        console.debug('Error message retrieval failed:', error.message);
      }
    }
    return null;
  }

  /**
   * Click a specific insight tab
   *
   * @param tab - Tab to click
   */
  async clickTab(tab: InsightTab): Promise<void> {
    const tabSelectors: Record<InsightTab, string> = {
      patterns: this.patternsTab,
      contradictions: this.contradictionsTab,
      blindSpots: this.blindSpotsTab,
      leverage: this.leverageTab,
      risks: this.risksTab,
    };

    await this.page.click(tabSelectors[tab]);
    // Wait for tab panel to be visible
    await this.page.locator(`[data-testid="insights-tabpanel-${tab}"]`).waitFor({ state: 'visible', timeout: E2E_TIMEOUTS.elementVisible });
  }

  /**
   * Get the number of insight cards visible
   *
   * @returns Count of visible insight cards
   */
  async getInsightCardCount(): Promise<number> {
    return await this.page.locator(this.insightCard).count();
  }

  /**
   * Check if insights are displayed
   *
   * @returns True if at least one insight card is visible
   */
  async hasInsights(): Promise<boolean> {
    return (await this.getInsightCardCount()) > 0;
  }

  /**
   * Get the synthesis section content
   *
   * @returns Synthesis text or null if not visible
   */
  async getSynthesisContent(): Promise<string | null> {
    try {
      const synthesis = this.page.locator(this.synthesisSection);
      if (await synthesis.isVisible()) {
        return await synthesis.textContent();
      }
    } catch (error) {
      // Timeout expected when synthesis not visible
      if (error instanceof Error && !error.message.includes('Timeout')) {
        console.debug('Synthesis content retrieval failed:', error.message);
      }
    }
    return null;
  }

  /**
   * Check if the "no assessment" message is displayed
   *
   * @returns True if no assessment message is visible
   */
  async hasNoAssessmentMessage(): Promise<boolean> {
    try {
      return await this.page.locator(this.noAssessmentMessage).isVisible({ timeout: E2E_TIMEOUTS.elementQuick });
    } catch (error) {
      if (error instanceof Error && !error.message.includes('Timeout')) {
        console.debug('No assessment message check failed:', error.message);
      }
      return false;
    }
  }

  /**
   * Click the analyze button to start analysis
   */
  async clickAnalyze(): Promise<void> {
    await this.page.click(this.analyzeButton);
  }

  /**
   * Check if the analyze button is visible
   *
   * @returns True if analyze button is visible
   */
  async isAnalyzeButtonVisible(): Promise<boolean> {
    try {
      return await this.page.locator(this.analyzeButton).isVisible({ timeout: E2E_TIMEOUTS.elementQuick });
    } catch (error) {
      if (error instanceof Error && !error.message.includes('Timeout')) {
        console.debug('Analyze button visibility check failed:', error.message);
      }
      return false;
    }
  }

  /**
   * Check if the incomplete assessment warning is visible
   *
   * @returns True if incomplete warning is visible
   */
  async hasIncompleteWarning(): Promise<boolean> {
    return await this.page
      .locator(this.incompleteWarning)
      .isVisible({ timeout: E2E_TIMEOUTS.elementMedium })
      .catch(() => false);
  }

  /**
   * Check if the pending changes alert is visible
   *
   * @returns True if pending changes alert is visible
   */
  async hasPendingChangesAlert(): Promise<boolean> {
    return await this.page
      .locator(this.pendingChangesAlert)
      .isVisible({ timeout: E2E_TIMEOUTS.elementMedium })
      .catch(() => false);
  }

  /**
   * Check if the reanalyze incomplete warning is visible
   *
   * @returns True if reanalyze incomplete warning is visible
   */
  async hasReanalyzeIncompleteWarning(): Promise<boolean> {
    return await this.page
      .locator(this.reanalyzeIncompleteWarning)
      .isVisible({ timeout: E2E_TIMEOUTS.elementMedium })
      .catch(() => false);
  }

  /**
   * Check if the ready state is shown (has assessment, no analysis)
   *
   * @returns True if ready state is visible
   */
  async isReadyState(): Promise<boolean> {
    return await this.page
      .locator(this.readyState)
      .isVisible({ timeout: E2E_TIMEOUTS.elementMedium })
      .catch(() => false);
  }

  /**
   * Check if the no assessment state is shown
   *
   * @returns True if no assessment state is visible
   */
  async isNoAssessmentState(): Promise<boolean> {
    return await this.page
      .locator(this.noAssessmentState)
      .isVisible({ timeout: E2E_TIMEOUTS.elementMedium })
      .catch(() => false);
  }

  /**
   * Check if the insights tabs are visible (has analysis results)
   *
   * @returns True if insights tabs are visible
   */
  async hasAnalysisResults(): Promise<boolean> {
    return await this.page
      .locator(this.insightsTabs)
      .isVisible({ timeout: E2E_TIMEOUTS.elementMedium })
      .catch(() => false);
  }

  /**
   * Navigate to a specific analysis by ID
   *
   * @param analysisId - The ID of the analysis to view
   */
  async viewAnalysis(analysisId: string): Promise<void> {
    await this.goto(`/insights/${analysisId}`);
  }
}
