## Instructions — Publishing the VS Code Extension to the VS Code Marketplace

This document describes how to get the extension into the official **VS Code Marketplace** (Microsoft).

---

## Prerequisites

### Accounts and permissions
- **Microsoft account** for Marketplace publisher management.
- **Azure DevOps organization** (required by the Marketplace flow).
- Permission to create a **Publisher** and generate a **Personal Access Token (PAT)** for publishing.

### Required project assets (minimum)
- **Extension icon** (commonly 128×128 PNG) referenced by `package.json`
- **README** (Marketplace listing content)
- **CHANGELOG** (recommended)
- **LICENSE**
- Clean metadata in `package.json`:
  - `name`, `displayName`, `description`, `version`
  - `publisher` (must match created publisher)
  - `engines.vscode`
  - `repository` (recommended)
  - `categories`, `keywords` (recommended)

---

## Step-by-step publishing workflow

## 1) Create a Publisher
1. Go to the Visual Studio Marketplace publisher management page (search: “Visual Studio Marketplace manage publishers”).
2. Create a **Publisher** (pick an ID you’ll keep permanently).
3. Note the publisher ID; it must match `package.json` `publisher`.

---

## 2) Create an Azure DevOps PAT (for `vsce publish`)
1. In Azure DevOps, generate a **Personal Access Token** with the Marketplace publishing scope:
   - Typical scope: **Marketplace (Publish)** (exact naming may differ in the UI)
2. Copy the token and store it securely.

---

## 3) Install the VS Code Extension publishing tool
Microsoft’s standard tool is `vsce`.

Recommended install:
- As a dev dependency:
  - `@vscode/vsce`
- Or global install (less reproducible; not recommended for CI).

---

## 4) Package the extension locally (`.vsix`)
From the extension root:
1. Build:
   - Ensure `dist/` outputs are generated (extension host + webview bundle).
2. Package:
   - Run `vsce package`
3. Test install the `.vsix`:
   - In VS Code: Extensions → “…” menu → “Install from VSIX…”

Checklist before packaging:
- No missing files referenced in `package.json` (main entry, webview assets)
- Activation events work
- Custom editor opens `.md` and saving persists correctly

---

## 5) Publish to Marketplace
### Option A: Publish via `vsce publish`
1. Login token (one-time):
   - `vsce login <publisher>`
   - Paste PAT when prompted
2. Publish:
   - `vsce publish`

### Option B: CI publish
Use the PAT as a CI secret and run:
- `vsce publish -p $VSCE_PAT`

---

## Versioning rules
- Marketplace publishing generally requires **monotonic version increments**.
- Recommended:
  - Follow semver: `major.minor.patch`
  - Update `CHANGELOG.md` for each release

---

## Common Marketplace rejection issues (avoid these)
- Missing icon / broken README formatting
- Broken activation (extension never activates)
- Declared commands/contributions missing implementations
- Security concerns (unsafe webview CSP, remote script loads)
- Licenses missing or unclear

---

## Open VSX (optional)
If you also want the extension available for VS Code forks (e.g., VSCodium), consider publishing to **Open VSX** as well.
- Tooling often uses `ovsx` rather than `vsce`.

