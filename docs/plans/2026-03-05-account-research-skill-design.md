# Account Research Skill Design

**Date:** 2026-03-05
**Status:** Approved
**Approach:** Python Script Orchestrator (mirrors stock-research pattern)

## Problem

Craig is an SE in IAM. Account research today is manual and inconsistent — web searching, reading job postings, piecing together tech stack signals. The `/deep-research` skill has an account mode but lacks structured scraping, Okta-specific intelligence, and a consistent SE-ready output template. Research briefs should evolve with opportunities from first call through proposal.

## Input Interface

```
/account-research Acme Corp — evaluating workforce identity
/account-research "Collibra" --depth deep
/account-research Snowflake --depth quick
/account-research Snowflake, Collibra, Datadog   # parallel multi-account
```

**Required:** Company name
**Optional:** Angle/context (free text after `—`), `--depth` flag

| Depth | Purpose | Sources Hit | Output |
|-------|---------|-------------|--------|
| `quick` | First call prep | 5 core sources | ~1-2 pages |
| `deep` (default) | Full SE prep | All 8-10 sources | ~3-5 pages |
| `full` | Proposal/RFP support | All sources + SEC + deeper analysis | ~5-8 pages |

## Data Sources

Dispatched via `ThreadPoolExecutor(max_workers=8)`. Each scraper returns a structured dict. Failed scrapers log to stderr but don't block the report.

| # | Source | Data Collected | Depth |
|---|--------|---------------|-------|
| 1 | Company website (about, careers) | Mission, size, products, hiring signals | all |
| 2 | Google News (RSS + search) | Recent headlines, M&A, funding, layoffs | all |
| 3 | Crunchbase (or similar) | Funding, investors, leadership, employee count | all |
| 4 | Job postings (Indeed/LinkedIn) | Tech stack signals from requirements | all |
| 5 | BuiltWith / HackerTarget | Tech stack detection from public web properties | all |
| 6 | G2 / TrustRadius | Identity/security tools they review or use | deep+ |
| 7 | SEC EDGAR | 10-K risk factors, IT/security spend mentions | deep+ |
| 8 | Glassdoor | Culture, IT team size signals, tech mentions | deep+ |
| 9 | Industry news (vertical-specific) | Regulatory/compliance pressures for identity | full |
| 10 | Competitor references | Public case studies mentioning company + identity vendors | full |

## Output Template

**File path:** `~/Documents/ObsidianNotes/Claude-Research/accounts/{company-slug}-{YYYY-MM}.md`

**Frontmatter:**
```yaml
---
date: 2026-03-05
tags:
  - account-research
  - {company-slug}
  - {industry}
source: claude-code
project: se-accounts
depth: deep
---
```

**Report sections:**

1. **Company Snapshot** — what they do, size, funding stage, key leadership
2. **Business Goals & Strategic Priorities** — derived from hiring patterns, news, earnings, leadership quotes. What they're trying to accomplish as a business.
3. **Technology Landscape** — known stack, infrastructure signals, identity/security tools detected
4. **Identity & Security Posture** — current IAM vendor signals, SSO/MFA mentions in job postings, compliance frameworks referenced
5. **Pain Point Hypotheses** — educated guesses about identity challenges based on all signals, tied back to business goals
6. **Competitive Landscape** — identity/security vendors they're evaluating or using, displacement opportunities
7. **Opportunity Angle** — how Okta specifically fits their situation, mapped to their business goals
8. **Discovery Questions** — 8-10 questions to validate hypotheses, ordered broad-business to specific-technical
9. **Talk Track** — suggested narrative flow for the technical conversation
10. **Source Log** — which scrapers succeeded/failed, data freshness

## Architecture

```
~/.claude/skills/account-research/
├── SKILL.md                          # Skill definition + trigger rules
├── scripts/
│   └── research_account.py           # Main orchestrator
└── references/
    └── account-research-prompt.md    # Gemini system prompt / report template
```

**Invocation flow:**

1. SKILL.md parses company name + angle + depth
2. Dispatches `python3 research_account.py "Company" --angle "..." --depth deep`
3. Script resolves company (validate name, find domain)
4. ThreadPoolExecutor dispatches scrapers in parallel
5. Collects results, logs failures to stderr
6. Sends context to Gemini via LiteLLM with structured system prompt
7. Wraps response in Obsidian frontmatter + wiki-links
8. Writes to Obsidian vault
9. Claude reports path + summary

**Multi-account:** `/account-research A, B, C` dispatches one Task tool subagent per company in parallel.

## Evolving Brief

When revisiting at deeper level (`/account-research Snowflake --depth full`):

- Script checks for existing brief
- Reads existing content for context
- Appends new sections / deepens existing ones
- Updates `depth` frontmatter field
- Preserves manual notes (detected by `## My Notes` section marker)

## Key Design Decisions

- **Gemini for synthesis** (not Claude) — matches stock-research pattern, uses large context window for all scraped data
- **Business goals as core section** — not just listing facts but deriving strategic priorities from signals
- **Graceful scraper failure** — individual source failures don't block the report
- **Obsidian-native output** — frontmatter, wiki-links, lives alongside existing account research notes
