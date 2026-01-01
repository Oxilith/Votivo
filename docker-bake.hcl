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
  targets = ["backend", "app", "prompt-service", "worker"]
}

variable "VERSION" {
      validation {
        condition = VERSION != ""
        error_message = "The variable 'VERSION' must not be empty."
      }
    }

target "backend" {
  context    = "."
  dockerfile = "backend/Dockerfile"
  tags       = [
    "oxilith/votive-backend:latest",
    "oxilith/votive-backend:${VERSION}"  
  ]
  platforms  = ["linux/amd64", "linux/arm64"]
}

target "app" {
  context    = "."
  dockerfile = "app/Dockerfile"
  tags       = [
    "oxilith/votive-app:latest",
    "oxilith/votive-app:${VERSION}"  
  ]
  platforms  = ["linux/amd64", "linux/arm64"]
}

target "prompt-service" {
  context    = "."
  dockerfile = "prompt-service/Dockerfile"
  tags       = [
    "oxilith/votive-prompt-service:latest",
    "oxilith/votive-prompt-service:${VERSION}"  
  ]
  platforms  = ["linux/amd64", "linux/arm64"]
}

target "worker" {
  context    = "."
  dockerfile = "worker/Dockerfile"
  tags       = [
    "oxilith/votive-worker:latest",
    "oxilith/votive-worker:${VERSION}"  
  ]
  platforms  = ["linux/amd64", "linux/arm64"]
}