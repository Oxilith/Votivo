/**
 * @file controllers/health.controller.ts
 * @purpose Controller for health check endpoints
 * @functionality
 * - Provides liveness check (basic health)
 * - Provides readiness check (with dependency verification)
 * - Returns service status and version information
 * @dependencies
 * - express (Request, Response)
 * - http-status-codes
 */

import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
}

interface ReadinessResponse extends HealthResponse {
  checks: {
    anthropic: 'ok' | 'error';
  };
}

const VERSION = process.env['npm_package_version'] ?? '1.0.0';

export function liveness(_req: Request, res: Response<HealthResponse>): void {
  res.status(StatusCodes.OK).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: VERSION,
    uptime: process.uptime(),
  });
}

export function readiness(
  _req: Request,
  res: Response<ReadinessResponse>
): void {
  // For now, we just check that the API key is configured
  // In a real app, you might ping the Anthropic API or check other dependencies
  const anthropicCheck = process.env['ANTHROPIC_API_KEY'] ? 'ok' : 'error';

  const isHealthy = anthropicCheck === 'ok';

  res.status(isHealthy ? StatusCodes.OK : StatusCodes.SERVICE_UNAVAILABLE).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version: VERSION,
    uptime: process.uptime(),
    checks: {
      anthropic: anthropicCheck,
    },
  });
}
