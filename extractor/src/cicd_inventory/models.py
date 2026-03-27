"""Pydantic v2 data models — the shared contract between extractor and Astro site."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class ActionReference(BaseModel):
    """A reusable GitHub Action referenced inside a workflow step."""

    uses: str
    name: str | None = None


class JobInfo(BaseModel):
    """Metadata for a single job within a workflow."""

    job_id: str
    name: str | None = None
    runs_on: str | list[str]
    steps_count: int
    actions_used: list[ActionReference] = []


class WorkflowRecord(BaseModel):
    """Canonical representation of a single GitHub Actions workflow file.

    ``id`` is a composite key of the form ``org/repo/filename`` and serves as
    the Astro Content Collection entry identifier.
    """

    id: str
    org: str
    repo_name: str
    repo_url: str
    workflow_file: str
    workflow_path: str
    workflow_name: str
    on_triggers: list[str]
    jobs: list[JobInfo] = []
    status_badge_url: str
    last_run_status: str | None = None
    last_fetched: datetime
    raw_yaml: str


class IndexSummary(BaseModel):
    """Aggregate stats written to ``_index.json`` alongside the workflow files."""

    orgs: list[str]
    total_repos: int
    total_workflows: int
    parse_errors: list[str] = []
    last_updated: datetime
