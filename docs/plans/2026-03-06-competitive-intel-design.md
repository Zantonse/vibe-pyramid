# Competitive Intel Skill Design

**Date:** 2026-03-06
**Status:** Approved
**Pattern:** Single Python script, same architecture as account-research and stock-research

## Purpose

A living competitive intelligence tool for IAM vendors. Two modes: (1) landscape refresh that updates per-vendor battlecards and produces a cross-vendor digest, and (2) quick single-vendor call-prep briefs. Outputs to Obsidian as evergreen battlecard docs plus periodic landscape summaries.

## Architecture: Single Monolithic Script

`research_competitive.py` (~1200-1500 lines) in `~/.claude/skills/competitive-intel/scripts/`.

Same proven pattern:
- ThreadPoolExecutor for parallel scraping
- Gemini synthesis via LiteLLM
- Obsidian output with YAML frontmatter and wiki-links
- Two modes dispatched via CLI flags

## Default Vendors (7 + self)

| Vendor | Category |
|--------|----------|
| Ping Identity | Workforce/CIAM |
| ForgeRock | Workforce/CIAM |
| Microsoft Entra | Workforce/CIAM |
| CyberArk | PAM/Identity Security |
| SailPoint | Identity Governance |
| Lumos | Identity Governance (startup) |
| ConductorOne | Identity Governance (startup) |
| **Self (own product)** | Scraped for context only, no battlecard produced |

Override via `--competitors "Ping,Delinea,BeyondTrust"`.

## Modes

### Landscape Mode (default)

```bash
python3 research_competitive.py
python3 research_competitive.py --competitors "Ping,ForgeRock,Delinea"
```

1. For each vendor, run 10 scrapers in parallel
2. Read existing battlecard from Obsidian (if present)
3. Send per-vendor scrape data + old battlecard to Gemini -> updated battlecard + change summary
4. Write updated per-vendor battlecard files
5. Collect all change summaries -> Gemini landscape synthesis
6. Write landscape summary with feature matrix + cross-vendor digest
7. Print summary to stdout

### Quick Mode

```bash
python3 research_competitive.py --mode quick "Ping"
```

1. Single vendor, run 10 scrapers
2. Read existing battlecard (if present)
3. Gemini produces call-prep brief + updates battlecard as side effect
4. Print concise brief to stdout (30-second summary, recent moves, landmines, differentiation)

## Data Sources (10 per vendor)

### News + Product Announcements

| # | Scraper | Data | Method |
|---|---------|------|--------|
| 1 | Google News RSS | Recent headlines, 30-day window | RSS feed |
| 2 | Vendor Newsroom | Press releases, product announcements | Direct URL scrape |
| 3 | Vendor Blog | Product updates, feature launches | Direct URL scrape |
| 4 | Crunchbase (via Google) | Funding, acquisitions, leadership | Google search |

### Technical + Docs Changes

| # | Scraper | Data | Method |
|---|---------|------|--------|
| 5 | Vendor Changelog | Feature launches, deprecations, integrations | Direct URL scrape |
| 6 | GitHub Activity | OSS contributions, SDK updates | GitHub API/scrape |
| 7 | Developer Blog | API changes, integration announcements | Direct URL scrape |

### Market + Analyst Signals

| # | Scraper | Data | Method |
|---|---------|------|--------|
| 8 | G2/TrustRadius (via Google) | Review scores, sentiment, ratings | Google search |
| 9 | Job Postings (via Google) | Hiring signals, tech, regions | Google search |
| 10 | Industry Analyst Mentions | Gartner, Forrester, KuppingerCole refs | Google News search |

### Concurrency

Landscape mode: 7 vendors x 10 scrapers = 70 requests. ThreadPoolExecutor capped at max_workers=20 to avoid rate limiting. Quick mode: 10 requests for a single vendor, runs fast.

## Vendor Registry

Hardcoded Python dict with per-vendor metadata:

```python
VENDORS = {
    "ping": {
        "name": "Ping Identity",
        "domain": "pingidentity.com",
        "newsroom_url": "https://www.pingidentity.com/en/company/press-releases.html",
        "blog_url": "https://www.pingidentity.com/en/resources/blog.html",
        "changelog_url": None,  # discovered during build
        "github_org": "pingidentity",
        "aliases": ["Ping", "PingOne", "PingFederate"],
    },
    # ... similar entries for all 8 vendors
}
```

Direct URLs make scraping more reliable than Google-proxied discovery (lesson from account-research).

## Change Detection

Hybrid approach: no separate state file. When an existing battlecard exists:

1. Read the full text of the previous Obsidian doc
2. Pass both old doc + new scrape data to Gemini
3. Gemini prompt instructs: "Identify substantive changes (product launches, pricing changes, acquisitions, leadership moves). Ignore cosmetic rewording. Preserve the `## My Notes` section exactly."
4. Gemini returns both the updated battlecard and a structured change summary
5. Change summaries feed into the landscape synthesis prompt

## Output Structure

### Per-Vendor Battlecard (evergreen)

Path: `~/Documents/ObsidianNotes/Claude-Research/competitive-intel/{vendor-slug}.md`

Sections:
- **Company Snapshot** - What they do, target market, positioning
- **Feature Matrix** - Capabilities: SSO, MFA, Lifecycle Mgmt, PAM, Governance, API Security, Device Trust, Directory
- **Battlecard** - Strengths, Weaknesses, Landmines, Our Advantages, Known Wins/Losses, Pricing Model
- **Recent Moves** - Timestamped product launches, acquisitions, partnerships, leadership, funding
- **Technical Direction** - Inferred from blog, hiring, changelog patterns
- **My Notes** - Preserved across updates for manual annotations

### Landscape Summary (periodic)

Path: `~/Documents/ObsidianNotes/Claude-Research/competitive-intel/landscape-{YYYY-MM}.md`

Sections:
- **Cross-Vendor Feature Matrix** - Markdown table, vendors as columns, capability rows. Symbols: checkmark (strong), ~ (partial), X (absent), ? (unclear)
- **What Changed This Period** - Changes grouped by theme (product, M&A, positioning, hiring)
- **Market Trends** - Patterns across multiple vendors
- **Competitive Positioning Map** - Narrative on who's gaining/losing ground
- Wiki-links to each vendor battlecard

### Quick Brief (stdout only)

Not persisted separately. Updates the battlecard file as side effect. Stdout output:
- 30-Second Summary
- Recent Moves (last 30 days)
- Landmine Questions (3-5)
- Our Differentiation (top 3 points)
- Watch Out For (their strongest talking points)

## Self-Scrape

Own product is in the vendor registry as a special entry. Scraped with the same 10 sources but:
- No battlecard written for self
- Data passed as context to every other vendor's Gemini synthesis
- Enables accurate "Our Advantages" and "Our Differentiation" sections

## Gemini Prompts (3 distinct)

Stored in `references/competitive-intel-prompt.md`:

1. **Per-Vendor Battlecard Update** - Produces updated battlecard + change summary. When previous doc exists, compares old vs new and preserves My Notes.
2. **Landscape Synthesis** - Takes all vendor change summaries + previous landscape doc, produces cross-vendor feature matrix and digest.
3. **Quick Call-Prep Brief** - Takes scrape data + existing battlecard, produces concise call-prep output.

## SKILL.md Dispatch Pattern

Same as account-research: Claude parses user request to extract mode + vendor, dispatches Bash subagent via Task tool.

Trigger phrases: "competitive intel", "competitor update", "what's new with [vendor]", "prep for competitive deal", "update battlecards", "landscape update", "competitive brief on [vendor]".

## Dependencies

- Python 3 with `requests`, `beautifulsoup4`, `openai` (auto-installed if missing)
- LiteLLM credentials in `~/.claude-litellm.env`
- Obsidian vault at `~/Documents/ObsidianNotes/`

## Key Design Decisions

1. **Single script over multiple** - Follows proven pattern from stock-research and account-research
2. **Evergreen battlecards, periodic landscapes** - Vendor docs accumulate, landscapes are snapshots
3. **Hybrid change detection** - Gemini judges old doc vs new scrape, no state files
4. **Self-scraping** - Auto-updates own product context, no manual maintenance
5. **Hardcoded vendor registry with CLI override** - 7 defaults + self, extensible for ad-hoc research
6. **Direct URLs over Google discovery** - More reliable for known vendors
