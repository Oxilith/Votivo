/**
 * @file e2e/pages/InsightsPage.ts
 * @purpose Page object for AI insights display
 * @functionality
 * - Displays analysis results in tabbed interface
 * - Handles loading and error states
 * - Provides tab navigation for different insight categories
 * - Shows identity synthesis section
 * @dependencies
 * - BasePage for common functionality
 * - @playwright/test for Page type
 */

import { BasePage } from './BasePage';

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
  // Action buttons
  readonly analyzeButton = 'button:has-text("Analyze"), button:has-text("Get Insights")';

  // Loading and error states
  readonly loadingIndicator = '[data-testid="loading"], [class*="loading"], [class*="spinner"]';
  readonly errorMessage = '[role="alert"], [class*="error"]';

  // Tab navigation
  readonly tabList = '[role="tablist"]';
  readonly patternsTab = 'button:has-text("Patterns"), [role="tab"]:has-text("Patterns")';
  readonly contradictionsTab = 'button:has-text("Contradictions"), [role="tab"]:has-text("Contradictions")';
  readonly blindSpotsTab = 'button:has-text("Blind Spots"), [role="tab"]:has-text("Blind")';
  readonly leverageTab = 'button:has-text("Leverage"), [role="tab"]:has-text("Leverage")';
  readonly risksTab = 'button:has-text("Risks"), [role="tab"]:has-text("Risks")';

  // Content sections
  readonly insightCard = '[data-testid="insight-card"], [class*="card"], article';
  readonly synthesisSection = '[data-testid="synthesis"], [class*="synthesis"]';
  readonly noAssessmentMessage = '[class*="no-assessment"], p:has-text("no assessment")';

  /**
   * Navigate to the insights page
   */
  async navigate(): Promise<void> {
    await this.goto('/insights');
  }

  /**
   * Wait for analysis to complete
   *
   * @param timeout - Maximum wait time (default 2 minutes for AI analysis)
   */
  async waitForAnalysis(timeout = 120000): Promise<void> {
    // Wait for loading to disappear and content to appear
    try {
      await this.page.waitForSelector(this.loadingIndicator, { state: 'hidden', timeout });
    } catch {
      // Loading indicator might not be visible
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
    return await this.page.locator(this.loadingIndicator).isVisible({ timeout: 1000 }).catch(() => false);
  }

  /**
   * Check if an error is displayed
   *
   * @returns True if error message is visible
   */
  async hasError(): Promise<boolean> {
    return await this.page.locator(this.errorMessage).isVisible({ timeout: 2000 }).catch(() => false);
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
    } catch {
      // No error
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
    await this.page.waitForTimeout(300);
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
    } catch {
      // Synthesis not visible
    }
    return null;
  }

  /**
   * Check if the "no assessment" message is displayed
   *
   * @returns True if no assessment message is visible
   */
  async hasNoAssessmentMessage(): Promise<boolean> {
    return await this.page.locator(this.noAssessmentMessage).isVisible({ timeout: 2000 }).catch(() => false);
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
    return await this.page.locator(this.analyzeButton).isVisible({ timeout: 2000 }).catch(() => false);
  }
}
