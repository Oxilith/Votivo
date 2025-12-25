/**
 * Docker Buildx Bake configuration for Votive
 *
 * Builds multi-architecture images for linux/amd64 and linux/arm64.
 *
 * Usage:
 *   docker buildx bake --push           # Build and push all targets
 *   docker buildx bake --push backend   # Build and push single target
 *   docker buildx bake --no-cache       # Force rebuild without cache
 */

group "default" {
  targets = ["backend", "frontend", "prompt-service"]
}

target "backend" {
  context    = "."
  dockerfile = "backend/Dockerfile"
  tags       = ["oxilith/votive-backend:latest"]
  platforms  = ["linux/amd64", "linux/arm64"]
}

target "frontend" {
  context    = "."
  dockerfile = "app/Dockerfile"
  tags       = ["oxilith/votive-frontend:latest"]
  platforms  = ["linux/amd64", "linux/arm64"]
}

target "prompt-service" {
  context    = "."
  dockerfile = "prompt-service/Dockerfile"
  tags       = ["oxilith/votive-prompt-service:latest"]
  platforms  = ["linux/amd64", "linux/arm64"]
}
