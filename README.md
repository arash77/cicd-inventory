# CI/CD Inventory

Automated pipeline that fetches, parses, and documents GitHub Actions CI/CD workflows from the **BioContainers**, **galaxyproject**, and **usegalaxy-eu** organizations into a centralized, searchable static site hosted on GitHub Pages.

## Architecture

```
extractor/   Python 3.14+ package (managed by uv)
             └── Fetches .github/workflows/*.yml via GitHub GraphQL API
             └── Writes structured JSON files for the Astro site

site/        Astro 6 static site
             └── Ingests JSON via Content Collections
             └── Generates static pages: /, /{org}/, /{org}/{repo}/
             └── Deployed to GitHub Pages
```

## Local development

### 1. Python extractor

```bash
cd extractor
uv sync
export GITHUB_TOKEN=ghp_...
uv run cicd-inventory --orgs galaxyproject --output-dir ../site/src/content/workflows
```

Options:
| Flag | Default | Description |
|---|---|---|
| `--orgs` | `BioContainers,galaxyproject,usegalaxy-eu` | Comma-separated org list |
| `--output-dir` | `../site/src/content/workflows` | Where to write JSON files |
| `--token` / `$GITHUB_TOKEN` | *(required)* | GitHub PAT with `read:org` + `public_repo` |
| `--verbose` | off | Enable debug logging |
| `--skip-preflight` | off | Skip token scope verification |

### 2. Astro site

```bash
cd site
pnpm install
pnpm dev          # dev server at http://localhost:4321
pnpm build        # static output in site/dist/
```

## GitHub Actions

The workflow at `.github/workflows/deploy.yml` runs **daily at 06:00 UTC** and on manual dispatch.

Required repository secrets:
- **`GH_PAT`** — Personal Access Token with scopes: `read:org`, `public_repo`

Required repository settings:
- **Pages source**: GitHub Actions (not a branch)

## Data schema

Each workflow is stored as a JSON file matching this shape:

```json
{
  "id": "galaxyproject/galaxy/ci.yml",
  "org": "galaxyproject",
  "repo_name": "galaxy",
  "repo_url": "https://github.com/galaxyproject/galaxy",
  "workflow_file": "ci.yml",
  "workflow_path": ".github/workflows/ci.yml",
  "workflow_name": "Continuous Integration",
  "on_triggers": ["push", "pull_request"],
  "jobs": [
    {
      "job_id": "test",
      "name": "Run Tests",
      "runs_on": "ubuntu-latest",
      "steps_count": 7,
      "actions_used": [
        { "uses": "actions/checkout@v4", "name": "Checkout" }
      ]
    }
  ],
  "status_badge_url": "https://github.com/galaxyproject/galaxy/actions/workflows/ci.yml/badge.svg",
  "last_fetched": "2026-03-24T06:00:00Z",
  "raw_yaml": "name: Continuous Integration\n..."
}
```

## Tech stack

| Layer | Technology |
|---|---|
| Python runtime | Python 3.14+ via `uv` |
| HTTP client | `httpx` (async) |
| Data models | Pydantic v2 |
| GraphQL | Dynamic alias batching (20-25 repos/query) |
| Static site | Astro 6 |
| Styling | Tailwind CSS 4 |
| Deployment | GitHub Actions → GitHub Pages |
