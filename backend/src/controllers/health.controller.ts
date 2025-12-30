/**
 * @file controllers/health.controller.ts
 * @purpose Controller for health check endpoints
 * @functionality
 * - Provides liveness check (basic server running check)
 * - Provides readiness check with actual dependency verification
 * - Returns detailed health status with latency information
 * @dependencies
 * - express (Request, Response)
 * - http-status-codes
 * - @/health (healthService, HealthCheckResult)
 */

import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { healthService, type HealthCheckResult } from '@/health';

interface LivenessResponse {
  status: 'healthy';
  timestamp: string;
  version: string;
  uptime: number;
}

const VERSION = process.env['npm_package_version'] ?? '1.0.0';
const startTime = Date.now();

export function liveness(_req: Request, res: Response<LivenessResponse>): void {
  res.status(StatusCodes.OK).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: VERSION,
    uptime: Math.floor((Date.now() - startTime) / 1000),
  });
}

export async function readiness(
  _req: Request,
  res: Response<HealthCheckResult>
): Promise<void> {
  const result = await healthService.evaluate();

  const statusCode =
    result.status === 'healthy'
      ? StatusCodes.OK
      : result.status === 'degraded'
        ? StatusCodes.OK
        : StatusCodes.SERVICE_UNAVAILABLE;

  res.status(statusCode).json(result);
}
