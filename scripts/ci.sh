#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

PACKAGES=(
  "apps/api"
  "apps/worker"
  "apps/web"
  "apps/blueprint-foundation/frontend"
  "frontend"
  "packages_temp/ai-core"
  "packages_temp/contracts"
  "packages_temp/shared"
  "packages_temp/db"
)

for pkg in "${PACKAGES[@]}"; do
  pkg_dir="${ROOT_DIR}/${pkg}"

  if [[ ! -f "${pkg_dir}/package.json" ]]; then
    echo "Skipping ${pkg} (no package.json)"
    continue
  fi

  echo "==> ${pkg}"

  if [[ -f "${pkg_dir}/package-lock.json" ]] && git -C "${ROOT_DIR}" ls-files --error-unmatch "${pkg}/package-lock.json" >/dev/null 2>&1; then
    (cd "${pkg_dir}" && npm ci)
  else
    (cd "${pkg_dir}" && npm install --no-package-lock)
  fi

  (cd "${pkg_dir}" && npm test)
done
