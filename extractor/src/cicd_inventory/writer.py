"""Write extracted workflow records as JSON files for Astro Content Collections."""

from __future__ import annotations

import json
import logging
import re
from datetime import UTC, datetime
from pathlib import Path

from cicd_inventory.models import IndexSummary, WorkflowRecord

log = logging.getLogger(__name__)

_SAFE_CHAR = re.compile(r"[^A-Za-z0-9._-]")


def _safe_filename(part: str) -> str:
    """Replace characters unsafe in filenames with underscores."""
    return _SAFE_CHAR.sub("_", part)


def write_collections(
    records: list[WorkflowRecord],
    output_dir: Path,
    parse_errors: list[str] | None = None,
) -> None:
    """Write one JSON file per workflow record plus a summary ``_index.json``."""
    output_dir.mkdir(parents=True, exist_ok=True)

    written = 0
    seen_repos: set[str] = set()

    for record in records:
        filename = (
            f"{_safe_filename(record.org)}__{_safe_filename(record.repo_name)}"
            f"__{_safe_filename(record.workflow_file)}.json"
        )
        out_path = output_dir / filename
        out_path.write_text(
            json.dumps(record.model_dump(mode="json"), indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
        seen_repos.add(f"{record.org}/{record.repo_name}")
        written += 1

    log.info("Wrote %d workflow JSON files to %s", written, output_dir)

    # Summary index
    orgs = sorted({r.org for r in records})
    summary = IndexSummary(
        orgs=orgs,
        total_repos=len(seen_repos),
        total_workflows=written,
        parse_errors=parse_errors or [],
        last_updated=datetime.now(UTC),
    )
    index_path = output_dir / "_index.json"
    index_path.write_text(
        json.dumps(summary.model_dump(mode="json"), indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    log.info("Wrote summary index to %s", index_path)
