"""GraphQL query templates for the GitHub API."""

from __future__ import annotations

from dataclasses import dataclass


# ---------------------------------------------------------------------------
# Repo discovery — paginated list of non-fork repositories in an org
# ---------------------------------------------------------------------------

REPO_DISCOVERY_QUERY = """
query($org: String!, $cursor: String) {
  organization(login: $org) {
    repositories(first: 100, after: $cursor, isFork: false, orderBy: {field: NAME, direction: ASC}) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        name
        nameWithOwner
        isArchived
        url
        defaultBranchRef {
          name
        }
      }
    }
  }
  rateLimit {
    cost
    remaining
    resetAt
  }
}
"""


# ---------------------------------------------------------------------------
# Workflow batch fetching — aliased multi-repo query
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class RepoRef:
    owner: str
    name: str


def build_workflow_batch_query(repos: list[RepoRef]) -> str:
    """Build a single GraphQL query that fetches .github/workflows for up to 25 repos.

    Each repo is addressed via a unique field alias (``repo_0``, ``repo_1``, …)
    so the entire batch resolves in one HTTP round-trip.
    """
    fragments = []
    for i, repo in enumerate(repos):
        fragments.append(
            f"""
  repo_{i}: repository(owner: {_gql_str(repo.owner)}, name: {_gql_str(repo.name)}) {{
    nameWithOwner
    object(expression: "HEAD:.github/workflows") {{
      ... on Tree {{
        entries {{
          name
          type
          object {{
            ... on Blob {{
              text
              byteSize
            }}
          }}
        }}
      }}
    }}
  }}"""
        )

    body = "\n".join(fragments)
    return f"""
query {{
  rateLimit {{
    cost
    remaining
    resetAt
  }}
{body}
}}
"""


def _gql_str(value: str) -> str:
    """Escape a Python string for safe embedding in a GraphQL query literal."""
    escaped = value.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{escaped}"'
