"""Abstract provider interface — decouples core logic from any specific hosting platform."""

from __future__ import annotations

from abc import ABC, abstractmethod

from cicd_inventory.models import WorkflowRecord


class RepositoryProvider(ABC):
    """Fetch workflow records from a source-control hosting platform."""

    @abstractmethod
    async def fetch_workflows(self, orgs: list[str]) -> list[WorkflowRecord]:
        """Return all workflow records across the given organization names."""
        ...
