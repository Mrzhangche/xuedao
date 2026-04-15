#!/usr/bin/env bash

set -euo pipefail

skills=(
  "anthropics/skills@frontend-design"
  "nextlevelbuilder/ui-ux-pro-max-skill@ui-ux-pro-max"
  "vercel-labs/skills@find-skills"
  "browser-use/browser-use@browser-use"
  "othmanadi/planning-with-files@planning-with-files"
  "pleaseprompto/notebooklm-skill@notebooklm"
  "ceeon/best-minds@best-minds"
)

echo "Installing team skills..."

for skill in "${skills[@]}"; do
  echo "-> ${skill}"
  npx -y skills add "${skill}" -g -y
done

cat <<'EOF'

Team skill installation complete.

Next steps:
1. Restart Codex
2. If you plan to use browser automation, run: browser-use doctor
3. If you plan to use NotebookLM, follow that skill's auth/setup instructions

EOF
