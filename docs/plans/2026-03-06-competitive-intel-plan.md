# Competitive Intel Skill Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a `/competitive-intel` skill that tracks IAM competitor moves across 7 vendors, maintains living battlecard docs in Obsidian, and provides quick call-prep briefs — using the same parallel-scrape + Gemini synthesis architecture as account-research and stock-research.

**Architecture:** Single Python script (`research_competitive.py`) with two modes: `landscape` (all vendors, feature matrix + battlecards + "what changed" digest) and `quick` (single vendor call-prep brief). 10 scrapers per vendor running via ThreadPoolExecutor, Gemini synthesis via LiteLLM, Obsidian-formatted output. Hybrid change detection — Gemini compares old battlecard against fresh scrape data to identify substantive changes.

**Tech Stack:** Python 3, `requests`, `beautifulsoup4`, `openai` (LiteLLM client), Gemini 3.1 Pro Preview, Obsidian markdown.

**Reference files:**
- Design doc: `docs/plans/2026-03-06-competitive-intel-design.md`
- Pattern to follow: `~/.claude/skills/account-research/scripts/research_account.py`
- Pattern to follow: `~/.claude/skills/stock-research/scripts/research_stock.py`
- LiteLLM env: `~/.claude-litellm.env`
- Obsidian output: `~/Documents/ObsidianNotes/Claude-Research/competitive-intel/`

---

## Task 1: Create Skill Directory Structure

**Files:**
- Create: `~/.claude/skills/competitive-intel/scripts/` (directory)
- Create: `~/.claude/skills/competitive-intel/references/` (directory)

**Step 1: Create directories**

```bash
mkdir -p ~/.claude/skills/competitive-intel/scripts
mkdir -p ~/.claude/skills/competitive-intel/references
```

**Step 2: Create Obsidian output directory**

```bash
mkdir -p ~/Documents/ObsidianNotes/Claude-Research/competitive-intel
```

**Step 3: Verify structure**

```bash
ls -R ~/.claude/skills/competitive-intel/
```

Expected:
```
references/
scripts/
```

No commit yet — empty directories.

---

## Task 2: Write the Gemini Prompts Reference File

Three distinct prompts that control all synthesis output. This is the most important file — it determines output quality for all three modes.

**Files:**
- Create: `~/.claude/skills/competitive-intel/references/competitive-intel-prompt.md`

**Step 1: Write the prompts file**

Write the following to `references/competitive-intel-prompt.md`:

````markdown
# Competitive Intelligence Prompts

Three prompts used by `research_competitive.py`. The script loads this file and extracts prompts by section header.

---

## PROMPT_BATTLECARD_UPDATE

You are a senior Sales Engineer maintaining competitive intelligence on IAM vendors. Given fresh scraped data about a competitor, produce or update a comprehensive battlecard.

### Guidelines

- Be specific with data points — "launched passwordless MFA Q1 2026" not "has MFA capabilities"
- Timestamp recent moves — include dates from news articles and press releases
- Landmines should be genuinely useful in deals — questions that expose real gaps, not generic softball
- Our Advantages must cite specific capability differences, not vague claims
- When an existing battlecard is provided, identify what has SUBSTANTIVELY changed. Ignore cosmetic rewording or minor date shifts. Focus on: new product launches, pricing changes, acquisitions, leadership moves, new partnerships, capability additions/deprecations.
- Preserve the `## My Notes` section EXACTLY as-is (this contains manual annotations)
- Feature matrix entries should use: Strong, Partial, Weak, Absent, Unknown — with a brief note explaining the rating
- Keep language direct and analytical — this is internal SE prep, not customer-facing

### Self-Product Context

When data about our own product is included (tagged as `[SELF]`), use it to:
- Generate accurate "Our Advantages" comparisons
- Craft landmines that exploit gaps our product fills
- Identify areas where the competitor genuinely beats us (intellectual honesty helps in deals)

### Report Structure

```
# {Vendor Name} — Competitive Battlecard

> Last updated: {date} | Sources: {count successful}/{count total}

## Company Snapshot
What they do, target market, positioning, HQ, employee count, funding/market cap. 2-3 sentences.

## Feature Matrix

| Capability | Rating | Notes |
|-----------|--------|-------|
| SSO / Federation | Strong/Partial/Weak/Absent/Unknown | Brief explanation |
| MFA / Passwordless | | |
| Lifecycle Management | | |
| Privileged Access (PAM) | | |
| Identity Governance (IGA) | | |
| API Security | | |
| Device Trust | | |
| Directory Services | | |
| CIAM | | |
| Identity Threat Detection | | |

## Battlecard

### Strengths
- Bullet points with specific evidence

### Weaknesses
- Bullet points with specific evidence

### Landmine Questions
Questions to ask in deals that expose this vendor's gaps:
1. "How does [vendor] handle X?" — because they can't / do it poorly because [reason]
2. ...

### Our Advantages
- Specific capability differences with evidence

### Known Wins/Losses
- Recent competitive deal outcomes if publicly known or inferrable

### Pricing Model
- Pricing structure, tiers, known gotchas (overage charges, per-feature licensing, etc.)

## Recent Moves
Timestamped list of significant events (newest first):
- {YYYY-MM-DD}: Event description (source)
- ...

## Technical Direction
Where they're heading based on blog posts, hiring patterns, changelog signals. 2-3 paragraphs.

## My Notes
<!-- Preserved across updates. Add your manual annotations below. -->

```

### Change Summary Output

In addition to the updated battlecard, output a `CHANGES:` section at the very end (after a `---` separator) listing only substantive changes since the previous version. Format:

```
---
CHANGES:
- [product] Launched passwordless MFA for workforce (2026-02-15)
- [leadership] New CTO hired from AWS (2026-02-01)
- [pricing] Removed free tier for developer accounts
- [partnership] Announced integration with ServiceNow
```

If no previous battlecard was provided, output `CHANGES: INITIAL` instead.

---

## PROMPT_LANDSCAPE_SYNTHESIS

You are a senior Sales Engineer synthesizing competitive intelligence across multiple IAM vendors. Given per-vendor change summaries and battlecard data, produce a cross-vendor landscape analysis.

### Guidelines

- The feature matrix should enable quick visual comparison — use consistent symbols
- "What Changed" should be grouped by theme, not by vendor — e.g., "Multiple vendors launched CIAM features" is more useful than listing each vendor's changes separately
- Market Trends should identify patterns — if 3+ vendors are doing the same thing, that's a trend worth calling out
- Be opinionated about positioning — don't just list facts, state who's gaining and losing ground
- Reference specific evidence for trend claims

### Report Structure

```
# IAM Competitive Landscape — {Month YYYY}

> Generated: {date} | Vendors tracked: {count}

## Cross-Vendor Feature Matrix

| Capability | Vendor1 | Vendor2 | ... |
|-----------|---------|---------|-----|
| SSO / Federation | ✓ | ~ | |
| MFA / Passwordless | | | |
| Lifecycle Management | | | |
| Privileged Access (PAM) | | | |
| Identity Governance (IGA) | | | |
| API Security | | | |
| Device Trust | | | |
| Directory Services | | | |
| CIAM | | | |
| Identity Threat Detection | | | |

Legend: ✓ Strong | ~ Partial | ✗ Absent | ? Unknown

## What Changed This Period

### Product Launches & Features
- ...

### M&A and Partnerships
- ...

### Market Positioning & Messaging
- ...

### Hiring & Expansion Signals
- ...

## Market Trends
Patterns visible across multiple vendors. 3-5 bullet points with evidence.

## Competitive Positioning Map
Narrative on who's gaining ground, who's losing, and what it means for our positioning. 2-3 paragraphs.

## Vendor Links
- [[ping-identity]] | [[forgerock]] | [[microsoft-entra]] | [[cyberark]] | [[sailpoint]] | [[lumos]] | [[conductorone]]
```

---

## PROMPT_QUICK_BRIEF

You are a senior Sales Engineer preparing for a competitive deal. Given fresh scraped data and an existing battlecard about a competitor, produce a concise call-prep brief.

### Guidelines

- This is a 2-minute read, not a deep dive — brevity over completeness
- Landmines are the most valuable section — make them specific and usable
- Recent Moves should focus on the last 30 days — what might the prospect bring up?
- Our Differentiation should be the top 3 points, not an exhaustive list
- "Watch Out For" is critical — knowing their strongest arguments helps us prepare responses

### Report Structure

```
# Quick Brief: {Vendor Name}

> Prepared: {date} | For: call prep

## 30-Second Summary
Who they are, what they're good at, where they're weak. 3-4 sentences max.

## Recent Moves (Last 30 Days)
- Anything the prospect might reference or ask about
- If nothing notable: "No significant moves in the last 30 days"

## Landmine Questions
3-5 questions that expose this vendor's gaps:
1. "How does [vendor] handle X?" — because [gap explanation]
2. ...

## Our Differentiation
Top 3 points where we win against this vendor:
1. ...
2. ...
3. ...

## Watch Out For
Their strongest talking points the prospect might raise:
- ...

## Recommended Talk Track
Brief suggested flow for the conversation: opening, bridge, value prop, proof point.
```
````

**Step 2: Verify file was written**

```bash
wc -l ~/.claude/skills/competitive-intel/references/competitive-intel-prompt.md
```

Expected: ~180-200 lines.

**Step 3: Commit**

Not git-tracked (lives in ~/.claude/skills/).

---

## Task 3: Write Script Foundation — Env, CLI, Vendor Registry

Build the skeleton of `research_competitive.py`: environment loading, dependency management, argument parsing, vendor registry, and the main entrypoint. Everything except scrapers and Gemini calls.

**Files:**
- Create: `~/.claude/skills/competitive-intel/scripts/research_competitive.py`

**Step 1: Write the script foundation**

Follow the exact patterns from `account-research/scripts/research_account.py` for env loading and dependency management. The script must include:

```python
#!/usr/bin/env python3
"""Competitive intelligence for IAM vendors — parallel scraping + Gemini synthesis.

Usage:
    python3 research_competitive.py                              # landscape mode, all defaults
    python3 research_competitive.py --mode quick "Ping"          # call-prep brief for Ping
    python3 research_competitive.py --competitors "Ping,Delinea" # override vendor list
"""

import argparse
import os
import re
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from typing import Optional

# --- Environment & Dependencies ---
# Copy _load_env_file() and _ensure_packages() exactly from account-research/scripts/research_account.py
# They are identical — load ~/.claude-litellm.env and auto-install requests/beautifulsoup4/openai.

# After env/deps:
import requests
from bs4 import BeautifulSoup

# --- Constants ---

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SKILL_DIR = os.path.dirname(SCRIPT_DIR)
PROMPT_FILE = os.path.join(SKILL_DIR, "references", "competitive-intel-prompt.md")
OBSIDIAN_BASE = os.path.expanduser(
    "~/Documents/ObsidianNotes/Claude-Research/competitive-intel"
)
DEFAULT_MODEL = "gemini-3.1-pro-preview"
MAX_WORKERS = 20  # Cap concurrent requests (landscape: 7 vendors × 10 scrapers = 70)
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    )
}
```

**Step 2: Write the vendor registry**

This is the key differentiator from account-research — hardcoded vendor metadata with direct URLs:

```python
# --- Vendor Registry ---
# Each vendor has direct URLs for reliable scraping (no Google discovery needed for known vendors).
# The "self" entry is scraped for context but never gets a battlecard written.

VENDORS = {
    "ping": {
        "name": "Ping Identity",
        "domain": "pingidentity.com",
        "newsroom_url": "https://www.pingidentity.com/en/company/press-releases-folder.html",
        "blog_url": "https://www.pingidentity.com/en/resources/blog.html",
        "changelog_url": None,
        "github_org": "pingidentity",
        "aliases": ["Ping", "PingOne", "PingFederate", "PingAccess"],
        "is_self": False,
    },
    "forgerock": {
        "name": "ForgeRock",
        "domain": "forgerock.com",
        "newsroom_url": "https://www.forgerock.com/blog",
        "blog_url": "https://www.forgerock.com/blog",
        "changelog_url": None,
        "github_org": "ForgeRock",
        "aliases": ["ForgeRock", "PingOne Advanced Identity Cloud"],
        "is_self": False,
    },
    "entra": {
        "name": "Microsoft Entra",
        "domain": "microsoft.com",
        "newsroom_url": "https://www.microsoft.com/en-us/security/blog/",
        "blog_url": "https://techcommunity.microsoft.com/category/microsoft-entra/blog/identity",
        "changelog_url": "https://learn.microsoft.com/en-us/entra/fundamentals/whats-new",
        "github_org": "AzureAD",
        "aliases": ["Entra ID", "Azure AD", "Azure Active Directory", "Microsoft Entra ID"],
        "is_self": False,
    },
    "cyberark": {
        "name": "CyberArk",
        "domain": "cyberark.com",
        "newsroom_url": "https://www.cyberark.com/press/",
        "blog_url": "https://www.cyberark.com/blog/",
        "changelog_url": None,
        "github_org": "cyberark",
        "aliases": ["CyberArk", "CyberArk Identity", "CyberArk PAM"],
        "is_self": False,
    },
    "sailpoint": {
        "name": "SailPoint",
        "domain": "sailpoint.com",
        "newsroom_url": "https://www.sailpoint.com/press-releases/",
        "blog_url": "https://www.sailpoint.com/blog/",
        "changelog_url": None,
        "github_org": "sailpoint-oss",
        "aliases": ["SailPoint", "SailPoint IdentityNow", "SailPoint ISC"],
        "is_self": False,
    },
    "lumos": {
        "name": "Lumos",
        "domain": "lumos.com",
        "newsroom_url": None,
        "blog_url": "https://www.lumos.com/blog",
        "changelog_url": None,
        "github_org": None,
        "aliases": ["Lumos", "Lumos Identity"],
        "is_self": False,
    },
    "conductorone": {
        "name": "ConductorOne",
        "domain": "conductorone.com",
        "newsroom_url": None,
        "blog_url": "https://www.conductorone.com/blog/",
        "changelog_url": None,
        "github_org": "ConductorOne",
        "aliases": ["ConductorOne", "Conductor One", "C1"],
        "is_self": False,
    },
    "self": {
        "name": "Okta",
        "domain": "okta.com",
        "newsroom_url": "https://www.okta.com/press-room/",
        "blog_url": "https://www.okta.com/blog/",
        "changelog_url": "https://help.okta.com/en-us/content/topics/releasenotes/production.htm",
        "github_org": "okta",
        "aliases": ["Okta", "Auth0", "Okta Workforce Identity", "Okta CIC"],
        "is_self": True,
    },
}

DEFAULT_COMPETITORS = ["ping", "forgerock", "entra", "cyberark", "sailpoint", "lumos", "conductorone"]
```

**Step 3: Write CLI argument parsing**

```python
# --- CLI ---

def parse_args():
    parser = argparse.ArgumentParser(
        description="Competitive intelligence: parallel scraping + Gemini synthesis"
    )
    parser.add_argument(
        "vendor", nargs="?", default=None,
        help="Vendor name for quick mode (e.g., 'Ping')"
    )
    parser.add_argument(
        "--mode", "-m", choices=["landscape", "quick"],
        default="landscape", help="Mode: landscape (all vendors) or quick (single vendor call prep)"
    )
    parser.add_argument(
        "--competitors", "-c", default=None,
        help="Comma-separated vendor slugs to override defaults (e.g., 'ping,delinea,beyondtrust')"
    )
    parser.add_argument("--model", default=DEFAULT_MODEL, help="LLM model for synthesis")
    args = parser.parse_args()

    # Validate: quick mode requires a vendor argument
    if args.mode == "quick" and not args.vendor:
        parser.error("Quick mode requires a vendor name: --mode quick 'Ping'")

    return args
```

**Step 4: Write helper functions**

```python
# --- Helpers ---

def slugify(name: str) -> str:
    """Convert vendor name to URL-friendly slug."""
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')


def resolve_vendor(query: str) -> dict:
    """Resolve a vendor name/alias to a registry entry. Falls back to ad-hoc entry."""
    q = query.lower().strip()
    # Check exact slug match
    if q in VENDORS:
        return VENDORS[q]
    # Check aliases
    for slug, vendor in VENDORS.items():
        for alias in vendor.get("aliases", []):
            if alias.lower() == q:
                return vendor
    # Ad-hoc vendor not in registry
    domain_guess = re.sub(r'[^a-z0-9]', '', q) + ".com"
    return {
        "name": query,
        "domain": domain_guess,
        "newsroom_url": None,
        "blog_url": None,
        "changelog_url": None,
        "github_org": None,
        "aliases": [query],
        "is_self": False,
    }


def load_prompts() -> dict:
    """Load the three Gemini prompts from the reference file, keyed by section header."""
    prompts = {}
    if not os.path.exists(PROMPT_FILE):
        return prompts
    with open(PROMPT_FILE) as f:
        content = f.read()
    # Split on ## PROMPT_ headers
    sections = re.split(r'^## (PROMPT_\w+)', content, flags=re.MULTILINE)
    for i in range(1, len(sections), 2):
        key = sections[i].strip()
        body = sections[i + 1].strip() if i + 1 < len(sections) else ""
        prompts[key] = body
    return prompts


def battlecard_path(vendor: dict) -> str:
    """Path for a vendor's evergreen battlecard."""
    slug = slugify(vendor["name"])
    return os.path.join(OBSIDIAN_BASE, f"{slug}.md")


def landscape_path() -> str:
    """Path for the periodic landscape summary."""
    month = datetime.now().strftime("%Y-%m")
    return os.path.join(OBSIDIAN_BASE, f"landscape-{month}.md")


def read_existing_doc(path: str) -> Optional[str]:
    """Read an existing Obsidian doc, or return None if it doesn't exist."""
    if os.path.isfile(path):
        with open(path) as f:
            return f.read()
    return None


def extract_my_notes(doc: str) -> Optional[str]:
    """Extract the ## My Notes section from an existing battlecard."""
    match = re.search(r'(## My Notes.*)', doc, re.DOTALL)
    return match.group(1) if match else None


def extract_changes(gemini_output: str) -> str:
    """Extract the CHANGES: section from Gemini's battlecard output."""
    match = re.search(r'---\s*\nCHANGES:\s*\n(.*)', gemini_output, re.DOTALL)
    return match.group(1).strip() if match else "No changes detected."


def strip_changes_section(gemini_output: str) -> str:
    """Remove the CHANGES: section from Gemini output (it's metadata, not for the doc)."""
    return re.sub(r'\n---\s*\nCHANGES:.*', '', gemini_output, flags=re.DOTALL).strip()


def format_frontmatter(vendor: dict, doc_type: str = "battlecard") -> str:
    """Generate Obsidian YAML frontmatter."""
    date_str = datetime.now().strftime("%Y-%m-%d")
    slug = slugify(vendor["name"])
    if doc_type == "landscape":
        return f"""---
date: {date_str}
tags:
  - competitive-intel
  - landscape
source: claude-code
project: se-competitive
---

> Related: [[competitive-intel-index]]

"""
    return f"""---
date: {date_str}
tags:
  - competitive-intel
  - {slug}
source: claude-code
project: se-competitive
last-updated: {date_str}
---

> Related: [[competitive-intel-index]] [[landscape-{datetime.now().strftime('%Y-%m')}]]

"""
```

**Step 5: Write the main() entrypoint skeleton**

```python
# --- Main ---

def main():
    args = parse_args()

    if args.mode == "quick":
        run_quick_mode(args)
    else:
        run_landscape_mode(args)


def run_landscape_mode(args):
    """Full landscape refresh across all tracked vendors."""
    # Determine vendor list
    if args.competitors:
        vendor_slugs = [s.strip().lower() for s in args.competitors.split(",")]
    else:
        vendor_slugs = DEFAULT_COMPETITORS

    vendors = [resolve_vendor(slug) for slug in vendor_slugs]
    self_vendor = VENDORS["self"]

    print(f"Landscape mode: {len(vendors)} vendors + self", file=sys.stderr)

    # 1. Scrape all vendors + self in parallel
    # 2. Synthesize per-vendor battlecards
    # 3. Collect change summaries
    # 4. Synthesize landscape summary
    # 5. Write all files

    # TODO: Implemented in Task 5
    print("Landscape mode not yet implemented.", file=sys.stderr)


def run_quick_mode(args):
    """Quick call-prep brief for a single vendor."""
    vendor = resolve_vendor(args.vendor)
    self_vendor = VENDORS["self"]

    print(f"Quick mode: {vendor['name']}", file=sys.stderr)

    # 1. Scrape this vendor + self
    # 2. Read existing battlecard
    # 3. Synthesize quick brief + update battlecard
    # 4. Print brief to stdout

    # TODO: Implemented in Task 5
    print("Quick mode not yet implemented.", file=sys.stderr)


if __name__ == "__main__":
    main()
```

**Step 2: Verify script is syntactically valid**

```bash
python3 -c "
import ast, os
with open(os.path.expanduser('~/.claude/skills/competitive-intel/scripts/research_competitive.py')) as f:
    ast.parse(f.read())
print('Syntax OK')
"
```

Expected: `Syntax OK`

**Step 3: Verify --help works**

```bash
python3 ~/.claude/skills/competitive-intel/scripts/research_competitive.py --help
```

Expected: Shows usage with `--mode`, `--competitors`, and positional `vendor` argument.

---

## Task 4: Implement All 10 Scrapers

Add all 10 scraper functions. Each takes a vendor dict and returns `(source_name: str, data: str | None)`. Group them by category.

**Files:**
- Modify: `~/.claude/skills/competitive-intel/scripts/research_competitive.py`

**Step 1: Implement News + Product Announcement scrapers (4)**

Add after the helper functions, before `main()`:

```python
# --- Scrapers ---
# Each scraper takes (vendor: dict) and returns (source_name: str, data: str | None).
# Return None on failure. Log to stderr.

def scrape_google_news(vendor: dict) -> tuple:
    """Scrape Google News RSS for recent vendor headlines."""
    name = "Google News"
    search_terms = " OR ".join(f'"{a}"' for a in vendor["aliases"][:3])
    query = requests.utils.quote(search_terms)
    url = f"https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10)
        if resp.status_code != 200:
            return (name, None)
        soup = BeautifulSoup(resp.text, "xml")
        items = soup.find_all("item")[:15]
        if not items:
            return (name, None)
        lines = []
        for item in items:
            title = item.find("title")
            pub_date = item.find("pubDate")
            source = item.find("source")
            line = f"- {title.text if title else 'N/A'}"
            if source:
                line += f" ({source.text})"
            if pub_date:
                line += f" — {pub_date.text}"
            lines.append(line)
        return (name, "\n".join(lines))
    except Exception as e:
        print(f"  [{vendor['name']}] Google News error: {e}", file=sys.stderr)
        return (name, None)


def scrape_newsroom(vendor: dict) -> tuple:
    """Scrape vendor's press releases / newsroom page."""
    name = "Vendor Newsroom"
    url = vendor.get("newsroom_url")
    if not url:
        # Fallback: try common paths
        domain = vendor["domain"]
        for path in ["/press", "/press-releases", "/newsroom", "/news"]:
            try:
                resp = requests.get(
                    f"https://www.{domain}{path}",
                    headers=HEADERS, timeout=10, allow_redirects=True
                )
                if resp.status_code == 200 and len(resp.text) > 500:
                    url = f"https://www.{domain}{path}"
                    break
            except Exception:
                continue
    if not url:
        return (name, None)
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10, allow_redirects=True)
        if resp.status_code != 200:
            return (name, None)
        soup = BeautifulSoup(resp.text, "html.parser")
        for tag in soup(["nav", "footer", "script", "style", "header"]):
            tag.decompose()
        text = soup.get_text(separator="\n", strip=True)
        return (name, text[:4000])
    except Exception as e:
        print(f"  [{vendor['name']}] Newsroom error: {e}", file=sys.stderr)
        return (name, None)


def scrape_blog(vendor: dict) -> tuple:
    """Scrape vendor's blog for product updates and thought leadership."""
    name = "Vendor Blog"
    url = vendor.get("blog_url")
    if not url:
        domain = vendor["domain"]
        url = f"https://www.{domain}/blog"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10, allow_redirects=True)
        if resp.status_code != 200:
            return (name, None)
        soup = BeautifulSoup(resp.text, "html.parser")
        for tag in soup(["nav", "footer", "script", "style", "header"]):
            tag.decompose()
        text = soup.get_text(separator="\n", strip=True)
        return (name, text[:4000])
    except Exception as e:
        print(f"  [{vendor['name']}] Blog error: {e}", file=sys.stderr)
        return (name, None)


def scrape_crunchbase(vendor: dict) -> tuple:
    """Search for Crunchbase/funding data via Google."""
    name = "Crunchbase / Funding"
    query = requests.utils.quote(
        f"{vendor['name']} crunchbase funding revenue employees acquisition"
    )
    try:
        resp = requests.get(
            f"https://www.google.com/search?q={query}",
            headers=HEADERS, timeout=10
        )
        if resp.status_code != 200:
            return (name, None)
        soup = BeautifulSoup(resp.text, "html.parser")
        snippets = []
        for div in soup.find_all("div", class_=True):
            text = div.get_text(strip=True)
            if any(kw in text.lower() for kw in [
                "funding", "revenue", "employees", "founded", "acquisition",
                "series", "valuation", "raised", "headquarter", "ipo"
            ]):
                if len(text) > 30 and text not in snippets:
                    snippets.append(text[:500])
                    if len(snippets) >= 8:
                        break
        return (name, "\n".join(snippets) if snippets else None)
    except Exception as e:
        print(f"  [{vendor['name']}] Crunchbase error: {e}", file=sys.stderr)
        return (name, None)
```

**Step 2: Implement Technical + Docs scrapers (3)**

```python
def scrape_changelog(vendor: dict) -> tuple:
    """Scrape vendor's changelog or release notes page."""
    name = "Changelog / Release Notes"
    url = vendor.get("changelog_url")
    if not url:
        # Try common paths
        domain = vendor["domain"]
        for path in ["/changelog", "/release-notes", "/whats-new", "/updates"]:
            try:
                resp = requests.get(
                    f"https://www.{domain}{path}",
                    headers=HEADERS, timeout=8, allow_redirects=True
                )
                if resp.status_code == 200 and len(resp.text) > 500:
                    url = f"https://www.{domain}{path}"
                    break
            except Exception:
                continue
        # Also try docs subdomain
        if not url:
            for path in ["/changelog", "/release-notes", "/whats-new"]:
                try:
                    resp = requests.get(
                        f"https://docs.{domain}{path}",
                        headers=HEADERS, timeout=8, allow_redirects=True
                    )
                    if resp.status_code == 200 and len(resp.text) > 500:
                        url = f"https://docs.{domain}{path}"
                        break
                except Exception:
                    continue
    if not url:
        return (name, None)
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10, allow_redirects=True)
        if resp.status_code != 200:
            return (name, None)
        soup = BeautifulSoup(resp.text, "html.parser")
        for tag in soup(["nav", "footer", "script", "style", "header"]):
            tag.decompose()
        text = soup.get_text(separator="\n", strip=True)
        return (name, text[:5000])
    except Exception as e:
        print(f"  [{vendor['name']}] Changelog error: {e}", file=sys.stderr)
        return (name, None)


def scrape_github(vendor: dict) -> tuple:
    """Check vendor's GitHub org for recent activity."""
    name = "GitHub Activity"
    org = vendor.get("github_org")
    if not org:
        return (name, None)
    try:
        # GitHub API: list recent repos and events
        resp = requests.get(
            f"https://api.github.com/orgs/{org}/repos?sort=updated&per_page=10",
            headers={"Accept": "application/vnd.github.v3+json"},
            timeout=10
        )
        if resp.status_code != 200:
            return (name, None)
        repos = resp.json()
        if not repos:
            return (name, None)
        lines = [f"**GitHub org: {org} — {len(repos)} most recently updated repos:**"]
        for repo in repos[:10]:
            updated = repo.get("updated_at", "")[:10]
            stars = repo.get("stargazers_count", 0)
            desc = repo.get("description", "No description")
            lang = repo.get("language", "N/A")
            lines.append(
                f"- **{repo['name']}** ({lang}, ★{stars}) — {desc} [updated {updated}]"
            )
        return (name, "\n".join(lines))
    except Exception as e:
        print(f"  [{vendor['name']}] GitHub error: {e}", file=sys.stderr)
        return (name, None)


def scrape_dev_blog(vendor: dict) -> tuple:
    """Search for vendor's developer blog or technical announcements."""
    name = "Developer Blog"
    search_terms = f"{vendor['name']} developer blog API integration announcement"
    query = requests.utils.quote(search_terms)
    try:
        resp = requests.get(
            f"https://www.google.com/search?q={query}&num=8",
            headers=HEADERS, timeout=10
        )
        if resp.status_code != 200:
            return (name, None)
        soup = BeautifulSoup(resp.text, "html.parser")
        snippets = []
        for div in soup.find_all("div"):
            text = div.get_text(strip=True)
            if any(kw in text.lower() for kw in [
                "developer", "api", "sdk", "integration", "oauth",
                "saml", "scim", "openid", "webhook", "terraform",
            ]) and len(text) > 40:
                snippets.append(text[:500])
                if len(snippets) >= 6:
                    break
        return (name, "\n\n".join(snippets) if snippets else None)
    except Exception as e:
        print(f"  [{vendor['name']}] Dev blog error: {e}", file=sys.stderr)
        return (name, None)
```

**Step 3: Implement Market + Analyst Signal scrapers (3)**

```python
def scrape_g2_trustradius(vendor: dict) -> tuple:
    """Search G2/TrustRadius for reviews and ratings."""
    name = "G2 / TrustRadius"
    query = requests.utils.quote(
        f"{vendor['name']} site:g2.com OR site:trustradius.com identity SSO"
    )
    try:
        resp = requests.get(
            f"https://www.google.com/search?q={query}&num=10",
            headers=HEADERS, timeout=10
        )
        if resp.status_code != 200:
            return (name, None)
        soup = BeautifulSoup(resp.text, "html.parser")
        snippets = []
        for div in soup.find_all("div"):
            text = div.get_text(strip=True)
            if any(kw in text.lower() for kw in [
                "review", "rating", "alternative", "compare",
                "identity", "sso", "authentication", "mfa",
            ]) and len(text) > 40:
                snippets.append(text[:500])
                if len(snippets) >= 6:
                    break
        return (name, "\n\n".join(snippets) if snippets else None)
    except Exception as e:
        print(f"  [{vendor['name']}] G2/TrustRadius error: {e}", file=sys.stderr)
        return (name, None)


def scrape_job_postings(vendor: dict) -> tuple:
    """Search for job postings to detect hiring signals and tech stack."""
    name = "Job Postings"
    query = requests.utils.quote(
        f"{vendor['name']} jobs site:linkedin.com/jobs OR site:indeed.com"
    )
    try:
        resp = requests.get(
            f"https://www.google.com/search?q={query}&num=10",
            headers=HEADERS, timeout=10
        )
        if resp.status_code != 200:
            return (name, None)
        soup = BeautifulSoup(resp.text, "html.parser")
        snippets = []
        for div in soup.find_all("div"):
            text = div.get_text(strip=True)
            if any(kw in text.lower() for kw in [
                "engineer", "product", "sales", "security", "identity",
                "cloud", "director", "manager", "remote", "hiring",
            ]) and len(text) > 50:
                if text[:100] not in [s[:100] for s in snippets]:
                    snippets.append(text[:600])
                    if len(snippets) >= 10:
                        break
        return (name, "\n\n".join(snippets) if snippets else None)
    except Exception as e:
        print(f"  [{vendor['name']}] Job postings error: {e}", file=sys.stderr)
        return (name, None)


def scrape_analyst_mentions(vendor: dict) -> tuple:
    """Search for Gartner, Forrester, KuppingerCole mentions."""
    name = "Analyst Mentions"
    query = requests.utils.quote(
        f"{vendor['name']} Gartner OR Forrester OR KuppingerCole "
        f"identity access management 2025 2026"
    )
    try:
        resp = requests.get(
            f"https://news.google.com/rss/search?q={requests.utils.quote(query)}&hl=en-US&gl=US&ceid=US:en",
            headers=HEADERS, timeout=10
        )
        if resp.status_code != 200:
            # Fallback to Google search
            resp = requests.get(
                f"https://www.google.com/search?q={query}&num=8",
                headers=HEADERS, timeout=10
            )
            if resp.status_code != 200:
                return (name, None)
            soup = BeautifulSoup(resp.text, "html.parser")
            snippets = []
            for div in soup.find_all("div"):
                text = div.get_text(strip=True)
                if any(kw in text.lower() for kw in [
                    "gartner", "forrester", "kuppingercole", "magic quadrant",
                    "wave", "leadership compass", "leader", "challenger",
                ]) and len(text) > 40:
                    snippets.append(text[:500])
                    if len(snippets) >= 6:
                        break
            return (name, "\n\n".join(snippets) if snippets else None)

        # Parse RSS
        soup = BeautifulSoup(resp.text, "xml")
        items = soup.find_all("item")[:10]
        if not items:
            return (name, None)
        lines = []
        for item in items:
            title = item.find("title")
            pub_date = item.find("pubDate")
            source = item.find("source")
            line = f"- {title.text if title else 'N/A'}"
            if source:
                line += f" ({source.text})"
            if pub_date:
                line += f" — {pub_date.text}"
            lines.append(line)
        return (name, "\n".join(lines))
    except Exception as e:
        print(f"  [{vendor['name']}] Analyst mentions error: {e}", file=sys.stderr)
        return (name, None)
```

**Step 4: Create the scraper registry**

```python
# --- Scraper Registry ---

SCRAPER_REGISTRY = {
    "google_news": scrape_google_news,
    "newsroom": scrape_newsroom,
    "blog": scrape_blog,
    "crunchbase": scrape_crunchbase,
    "changelog": scrape_changelog,
    "github": scrape_github,
    "dev_blog": scrape_dev_blog,
    "g2_trustradius": scrape_g2_trustradius,
    "job_postings": scrape_job_postings,
    "analyst_mentions": scrape_analyst_mentions,
}
```

**Step 5: Verify syntax**

```bash
python3 -c "
import ast, os
with open(os.path.expanduser('~/.claude/skills/competitive-intel/scripts/research_competitive.py')) as f:
    ast.parse(f.read())
print('Syntax OK')
"
```

Expected: `Syntax OK`

---

## Task 5: Implement Orchestration — Landscape and Quick Modes

Wire together the scrapers, Gemini synthesis, change detection, and file output.

**Files:**
- Modify: `~/.claude/skills/competitive-intel/scripts/research_competitive.py`

**Step 1: Implement the scrape-all-vendors function**

Replace the TODO stubs in the mode functions. Add this function before `run_landscape_mode`:

```python
def scrape_vendor(vendor: dict) -> dict:
    """Run all 10 scrapers for a single vendor. Returns {source_name: data}."""
    scraped = {}
    # Run scrapers sequentially per vendor (parallelism is across vendors)
    for scraper_name, scraper_fn in SCRAPER_REGISTRY.items():
        try:
            source_name, data = scraper_fn(vendor)
            scraped[source_name] = data
            status = "✓" if data else "✗"
            print(f"  [{vendor['name']}] [{status}] {source_name}", file=sys.stderr)
        except Exception as e:
            print(f"  [{vendor['name']}] [✗ ERROR] {scraper_name}: {e}", file=sys.stderr)
            scraped[scraper_name] = None
    return scraped


def synthesize_battlecard(
    vendor: dict,
    scraped_data: dict,
    self_data: dict,
    prompts: dict,
    model: str,
    existing_doc: Optional[str] = None,
) -> str:
    """Send vendor scrape data + self data to Gemini for battlecard synthesis."""
    from openai import OpenAI

    api_key = os.environ.get("LITELLM_API_KEY")
    base_url = os.environ.get("LITELLM_BASE_URL", "").rstrip("/")
    if not api_key or not base_url:
        print("Error: LITELLM_API_KEY and LITELLM_BASE_URL required.", file=sys.stderr)
        sys.exit(1)
    if not base_url.endswith("/v1"):
        base_url += "/v1"

    client = OpenAI(api_key=api_key, base_url=base_url)
    system_prompt = prompts.get("PROMPT_BATTLECARD_UPDATE", "Produce a competitive battlecard.")

    # Build context
    context_parts = []
    for source_name, data in scraped_data.items():
        if data:
            context_parts.append(f"### Source: {source_name}\n\n{data}")

    # Add self-product context
    self_parts = []
    for source_name, data in self_data.items():
        if data:
            self_parts.append(f"### [SELF] {source_name}\n\n{data}")

    user_msg = f"""## Competitor: {vendor['name']}
## Domain: {vendor.get('domain', 'N/A')}
## Date: {datetime.now().strftime('%Y-%m-%d')}

---

## Scraped Competitor Data

{chr(10).join(context_parts)}

---

## Our Product Data (for comparison)

{chr(10).join(self_parts) if self_parts else 'No self-product data available.'}"""

    if existing_doc:
        my_notes = extract_my_notes(existing_doc)
        user_msg += f"\n\n---\n\n## Previous Battlecard (identify what changed)\n\n{existing_doc}"
        if my_notes:
            user_msg += f"\n\n---\n\n## PRESERVE THIS SECTION EXACTLY:\n\n{my_notes}"

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_msg},
    ]

    print(f"  [{vendor['name']}] Synthesizing with {model}...", file=sys.stderr)
    try:
        response = client.chat.completions.create(
            model=model, messages=messages,
            max_tokens=8000, temperature=0.3,
        )
    except Exception as e:
        print(f"  [{vendor['name']}] Gemini API error: {e}", file=sys.stderr)
        return f"# {vendor['name']} — Battlecard\n\n*Synthesis failed: {e}*"

    result = response.choices[0].message.content or ""
    usage = getattr(response, "usage", None)
    if usage:
        print(
            f"  [{vendor['name']}] Tokens — prompt: {usage.prompt_tokens:,}, "
            f"completion: {usage.completion_tokens:,}",
            file=sys.stderr,
        )
    return result


def synthesize_landscape(
    change_summaries: dict,
    prompts: dict,
    model: str,
    existing_doc: Optional[str] = None,
) -> str:
    """Synthesize cross-vendor landscape summary from change summaries."""
    from openai import OpenAI

    api_key = os.environ.get("LITELLM_API_KEY")
    base_url = os.environ.get("LITELLM_BASE_URL", "").rstrip("/")
    if not api_key or not base_url:
        print("Error: LITELLM_API_KEY and LITELLM_BASE_URL required.", file=sys.stderr)
        sys.exit(1)
    if not base_url.endswith("/v1"):
        base_url += "/v1"

    client = OpenAI(api_key=api_key, base_url=base_url)
    system_prompt = prompts.get("PROMPT_LANDSCAPE_SYNTHESIS", "Produce a competitive landscape summary.")

    context_parts = []
    for vendor_name, changes in change_summaries.items():
        context_parts.append(f"### {vendor_name}\n\n{changes}")

    user_msg = f"""## Landscape Synthesis Date: {datetime.now().strftime('%Y-%m-%d')}
## Vendors Tracked: {len(change_summaries)}

---

## Per-Vendor Change Summaries

{chr(10).join(context_parts)}"""

    if existing_doc:
        user_msg += f"\n\n---\n\n## Previous Landscape Summary\n\n{existing_doc}"

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_msg},
    ]

    print(f"Synthesizing landscape summary...", file=sys.stderr)
    try:
        response = client.chat.completions.create(
            model=model, messages=messages,
            max_tokens=10000, temperature=0.3,
        )
    except Exception as e:
        print(f"Landscape synthesis error: {e}", file=sys.stderr)
        return f"# IAM Competitive Landscape\n\n*Synthesis failed: {e}*"

    result = response.choices[0].message.content or ""
    usage = getattr(response, "usage", None)
    if usage:
        print(
            f"Landscape tokens — prompt: {usage.prompt_tokens:,}, "
            f"completion: {usage.completion_tokens:,}",
            file=sys.stderr,
        )
    return result


def synthesize_quick_brief(
    vendor: dict,
    scraped_data: dict,
    self_data: dict,
    prompts: dict,
    model: str,
    existing_doc: Optional[str] = None,
) -> str:
    """Produce a concise call-prep brief."""
    from openai import OpenAI

    api_key = os.environ.get("LITELLM_API_KEY")
    base_url = os.environ.get("LITELLM_BASE_URL", "").rstrip("/")
    if not api_key or not base_url:
        print("Error: LITELLM_API_KEY and LITELLM_BASE_URL required.", file=sys.stderr)
        sys.exit(1)
    if not base_url.endswith("/v1"):
        base_url += "/v1"

    client = OpenAI(api_key=api_key, base_url=base_url)
    system_prompt = prompts.get("PROMPT_QUICK_BRIEF", "Produce a competitive call-prep brief.")

    context_parts = []
    for source_name, data in scraped_data.items():
        if data:
            context_parts.append(f"### Source: {source_name}\n\n{data}")

    self_parts = []
    for source_name, data in self_data.items():
        if data:
            self_parts.append(f"### [SELF] {source_name}\n\n{data}")

    user_msg = f"""## Competitor: {vendor['name']}
## Date: {datetime.now().strftime('%Y-%m-%d')}

---

## Fresh Scraped Data

{chr(10).join(context_parts)}

---

## Our Product Data

{chr(10).join(self_parts) if self_parts else 'No self-product data available.'}"""

    if existing_doc:
        user_msg += f"\n\n---\n\n## Existing Battlecard\n\n{existing_doc}"

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_msg},
    ]

    print(f"  [{vendor['name']}] Synthesizing quick brief...", file=sys.stderr)
    try:
        response = client.chat.completions.create(
            model=model, messages=messages,
            max_tokens=4000, temperature=0.3,
        )
    except Exception as e:
        print(f"  [{vendor['name']}] Quick brief error: {e}", file=sys.stderr)
        return f"# Quick Brief: {vendor['name']}\n\n*Synthesis failed: {e}*"

    return response.choices[0].message.content or ""
```

**Step 2: Implement `run_landscape_mode`**

Replace the TODO stub:

```python
def run_landscape_mode(args):
    """Full landscape refresh across all tracked vendors."""
    if args.competitors:
        vendor_slugs = [s.strip().lower() for s in args.competitors.split(",")]
    else:
        vendor_slugs = DEFAULT_COMPETITORS

    vendors = [resolve_vendor(slug) for slug in vendor_slugs]
    self_vendor = VENDORS["self"]
    prompts = load_prompts()

    print(f"Landscape mode: {len(vendors)} vendors + self", file=sys.stderr)

    # 1. Scrape self first (needed as context for all battlecards)
    print(f"\nScraping self ({self_vendor['name']})...", file=sys.stderr)
    self_data = scrape_vendor(self_vendor)

    # 2. Scrape all competitors in parallel (each vendor runs its 10 scrapers sequentially)
    print(f"\nScraping {len(vendors)} competitors...", file=sys.stderr)
    vendor_scraped = {}
    with ThreadPoolExecutor(max_workers=min(len(vendors), 4)) as executor:
        futures = {
            executor.submit(scrape_vendor, v): v for v in vendors
        }
        for future in as_completed(futures):
            v = futures[future]
            try:
                vendor_scraped[v["name"]] = future.result()
            except Exception as e:
                print(f"  [{v['name']}] Scrape failed: {e}", file=sys.stderr)
                vendor_scraped[v["name"]] = {}

    # 3. Synthesize per-vendor battlecards + collect change summaries
    print(f"\nSynthesizing battlecards...", file=sys.stderr)
    change_summaries = {}
    os.makedirs(OBSIDIAN_BASE, exist_ok=True)

    for vendor in vendors:
        existing = read_existing_doc(battlecard_path(vendor))
        raw_output = synthesize_battlecard(
            vendor, vendor_scraped.get(vendor["name"], {}),
            self_data, prompts, args.model, existing
        )

        # Extract changes before stripping
        changes = extract_changes(raw_output)
        change_summaries[vendor["name"]] = changes

        # Write battlecard (without CHANGES section)
        clean_output = strip_changes_section(raw_output)
        frontmatter = format_frontmatter(vendor, "battlecard")
        bc_path = battlecard_path(vendor)
        with open(bc_path, "w") as f:
            f.write(frontmatter + clean_output)
        print(f"  → {bc_path}", file=sys.stderr)

    # 4. Synthesize landscape summary
    existing_landscape = read_existing_doc(landscape_path())
    landscape_output = synthesize_landscape(
        change_summaries, prompts, args.model, existing_landscape
    )
    frontmatter = format_frontmatter(self_vendor, "landscape")
    ls_path = landscape_path()
    with open(ls_path, "w") as f:
        f.write(frontmatter + landscape_output)
    print(f"  → {ls_path}", file=sys.stderr)

    # 5. Summary to stdout
    print(f"\n{'='*60}", file=sys.stderr)
    print(f"Landscape update complete.", file=sys.stderr)
    print(f"  Battlecards: {len(vendors)} updated", file=sys.stderr)
    print(f"  Landscape:   {ls_path}", file=sys.stderr)
    print(f"{'='*60}\n", file=sys.stderr)

    # Print file paths to stdout for skill to capture
    for vendor in vendors:
        print(battlecard_path(vendor))
    print(ls_path)
```

**Step 3: Implement `run_quick_mode`**

Replace the TODO stub:

```python
def run_quick_mode(args):
    """Quick call-prep brief for a single vendor."""
    vendor = resolve_vendor(args.vendor)
    self_vendor = VENDORS["self"]
    prompts = load_prompts()

    print(f"Quick mode: {vendor['name']}", file=sys.stderr)

    # 1. Scrape vendor + self in parallel
    print(f"\nScraping {vendor['name']} + self...", file=sys.stderr)
    with ThreadPoolExecutor(max_workers=2) as executor:
        vendor_future = executor.submit(scrape_vendor, vendor)
        self_future = executor.submit(scrape_vendor, self_vendor)
        vendor_data = vendor_future.result()
        self_data = self_future.result()

    # 2. Read existing battlecard
    existing = read_existing_doc(battlecard_path(vendor))
    if existing:
        print("  → Found existing battlecard", file=sys.stderr)

    # 3. Synthesize quick brief
    brief = synthesize_quick_brief(
        vendor, vendor_data, self_data, prompts, args.model, existing
    )

    # 4. Also update the battlecard as a side effect
    raw_battlecard = synthesize_battlecard(
        vendor, vendor_data, self_data, prompts, args.model, existing
    )
    clean_output = strip_changes_section(raw_battlecard)
    frontmatter = format_frontmatter(vendor, "battlecard")
    os.makedirs(OBSIDIAN_BASE, exist_ok=True)
    bc_path = battlecard_path(vendor)
    with open(bc_path, "w") as f:
        f.write(frontmatter + clean_output)
    print(f"  → Battlecard updated: {bc_path}", file=sys.stderr)

    # 5. Print brief to stdout (for the Claude conversation)
    print(brief)
```

**Step 4: Verify syntax**

```bash
python3 -c "
import ast, os
with open(os.path.expanduser('~/.claude/skills/competitive-intel/scripts/research_competitive.py')) as f:
    ast.parse(f.read())
print('Syntax OK')
"
```

**Step 5: Verify --help still works**

```bash
python3 ~/.claude/skills/competitive-intel/scripts/research_competitive.py --help
```

---

## Task 6: Write the SKILL.md

The trigger and routing layer that tells Claude Code when to activate and how to dispatch.

**Files:**
- Create: `~/.claude/skills/competitive-intel/SKILL.md`

**Step 1: Write SKILL.md**

```markdown
---
name: competitive-intel
description: "Living competitive intelligence tracker for IAM vendors. Maintains evergreen battlecard docs and periodic landscape summaries in Obsidian. Two modes: (1) landscape — refreshes all tracked vendors with feature matrix, battlecards, and 'what changed' digest, (2) quick — single-vendor call-prep brief with landmines and differentiation points. Scrapes 10 sources per vendor in parallel, synthesizes with Gemini. Default vendors: Ping, ForgeRock, Entra, CyberArk, SailPoint, Lumos, ConductorOne. Use when the user asks about competitors, wants competitive updates, needs call prep for a competitive deal, asks 'what's new with [vendor]', wants battlecard updates, or requests a landscape refresh. Triggers on: 'competitive intel', 'competitor update', 'battlecard', 'landscape update', 'what's new with [vendor]', 'prep for competitive deal', 'competitive brief on [vendor]', or any request combining a competitor name with competitive or battlecard intent."
---

# Competitive Intelligence

Maintain living competitive battlecards and landscape summaries for IAM vendors.

## How It Works

The skill uses `scripts/research_competitive.py` to:
1. Scrape 10 data sources per vendor in parallel (news, blog, newsroom, changelog, GitHub, dev blog, Crunchbase, G2, job postings, analyst mentions)
2. Compare fresh data against existing battlecards (hybrid change detection via Gemini)
3. Synthesize updated battlecards and landscape summaries via Gemini (LiteLLM)
4. Write to `~/Documents/ObsidianNotes/Claude-Research/competitive-intel/`

## Usage

```bash
# Landscape mode (default) — all 7 vendors
python3 <skill-path>/scripts/research_competitive.py

# Quick mode — single vendor call prep
python3 <skill-path>/scripts/research_competitive.py --mode quick "Ping"

# Override vendor list
python3 <skill-path>/scripts/research_competitive.py --competitors "Ping,Delinea,BeyondTrust"

# Quick mode for non-default vendor
python3 <skill-path>/scripts/research_competitive.py --mode quick "Delinea"
```

Replace `<skill-path>` with: `/Users/craigverzosa/.claude/skills/competitive-intel`

## Modes

| Mode | What it does | Output |
|------|-------------|--------|
| `landscape` (default) | Scrapes all vendors, updates battlecards, produces landscape summary | Per-vendor battlecard files + `landscape-{YYYY-MM}.md` |
| `quick` | Scrapes one vendor, produces call-prep brief, updates battlecard | Brief to stdout + battlecard file updated |

## Default Vendors

Ping Identity, ForgeRock, Microsoft Entra, CyberArk, SailPoint, Lumos, ConductorOne

Override with `--competitors "slug1,slug2,..."`. Non-registry vendors are supported (scraping uses Google discovery fallback).

## Invocation

Parse the user's request to determine mode and vendor:

**Landscape triggers:** "update battlecards", "competitive landscape", "competitor update", "what's new in IAM"
**Quick triggers:** "prep for [vendor] deal", "what's new with [vendor]", "competitive brief on [vendor]"

Then dispatch:

```
Task tool (Bash subagent, model: "sonnet"):
  prompt: |
    Run: python3 /Users/craigverzosa/.claude/skills/competitive-intel/scripts/research_competitive.py [--mode quick "VENDOR"] [--competitors "OVERRIDES"]
    Report the output paths from stdout and any scraper failures from stderr.
```

## After Running

1. Report output file paths
2. In landscape mode: summarize the most notable changes across vendors, highlight market trends
3. In quick mode: present the call-prep brief directly (it's on stdout)
4. Mention any scraper failures from stderr
5. User can open reports in Obsidian for full view

## Output Location

- Battlecards: `~/Documents/ObsidianNotes/Claude-Research/competitive-intel/{vendor-slug}.md`
- Landscape: `~/Documents/ObsidianNotes/Claude-Research/competitive-intel/landscape-{YYYY-MM}.md`

## Dependencies

- Python 3 with `requests`, `beautifulsoup4`, `openai` (auto-installed if missing)
- LiteLLM credentials in `~/.claude-litellm.env`
- Obsidian vault at `~/Documents/ObsidianNotes/`
```

---

## Task 7: E2E Test — Quick Mode

Run a real test with a single vendor in quick mode. This is the simplest end-to-end path.

**Files:** None (testing only)

**Step 1: Run quick mode for ConductorOne**

Choose a smaller vendor to minimize scrape noise:

```bash
python3 ~/.claude/skills/competitive-intel/scripts/research_competitive.py --mode quick "ConductorOne" 2>&1
```

**Expected stderr:**
```
Quick mode: ConductorOne

Scraping ConductorOne + self...
  [ConductorOne] [✓] Google News
  [ConductorOne] [✓] Vendor Newsroom
  ...
  [Okta] [✓] Google News
  ...
  → Found existing battlecard (or not, on first run)
  [ConductorOne] Synthesizing quick brief...
  [ConductorOne] Synthesizing with gemini-3.1-pro-preview...
  → Battlecard updated: .../competitive-intel/conductorone.md
```

**Expected stdout:** A formatted quick brief with 30-Second Summary, Landmines, Our Differentiation, etc.

**Step 2: Verify battlecard was written**

```bash
head -20 ~/Documents/ObsidianNotes/Claude-Research/competitive-intel/conductorone.md
```

Expected: YAML frontmatter with `competitive-intel` tag and `last-updated` field.

**Step 3: Verify battlecard content structure**

```bash
grep "^## " ~/Documents/ObsidianNotes/Claude-Research/competitive-intel/conductorone.md
```

Expected: Section headers matching the prompt template (Company Snapshot, Feature Matrix, Battlecard, Recent Moves, etc.).

---

## Task 8: E2E Test — Landscape Mode (Reduced Set)

Test landscape mode with 2-3 vendors to validate the full pipeline without burning excessive API tokens.

**Files:** None (testing only)

**Step 1: Run landscape mode with 3 vendors**

```bash
python3 ~/.claude/skills/competitive-intel/scripts/research_competitive.py --competitors "conductorone,lumos,sailpoint" 2>&1
```

**Expected stderr:**
```
Landscape mode: 3 vendors + self

Scraping self (Okta)...
  [Okta] [✓] Google News
  ...

Scraping 3 competitors...
  [ConductorOne] [✓] Google News
  [Lumos] [✓] Google News
  [SailPoint] [✓] Google News
  ...

Synthesizing battlecards...
  [ConductorOne] Synthesizing with gemini-3.1-pro-preview...
  → .../competitive-intel/conductorone.md
  [Lumos] Synthesizing with gemini-3.1-pro-preview...
  → .../competitive-intel/lumos.md
  [SailPoint] Synthesizing with gemini-3.1-pro-preview...
  → .../competitive-intel/sailpoint.md

Synthesizing landscape summary...
  → .../competitive-intel/landscape-2026-03.md

============================================================
Landscape update complete.
  Battlecards: 3 updated
  Landscape:   .../competitive-intel/landscape-2026-03.md
============================================================
```

**Step 2: Verify landscape summary**

```bash
head -30 ~/Documents/ObsidianNotes/Claude-Research/competitive-intel/landscape-2026-03.md
```

Expected: YAML frontmatter + Cross-Vendor Feature Matrix.

**Step 3: Verify all output files exist**

```bash
ls -la ~/Documents/ObsidianNotes/Claude-Research/competitive-intel/
```

Expected: `conductorone.md`, `lumos.md`, `sailpoint.md`, `landscape-2026-03.md`

**Step 4: Test evolving brief (re-run quick mode)**

```bash
python3 ~/.claude/skills/competitive-intel/scripts/research_competitive.py --mode quick "ConductorOne" 2>&1 | head -5
```

Expected stderr includes: `→ Found existing battlecard`

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | Directory scaffold | Create dirs |
| 2 | Gemini prompts (3) | `references/competitive-intel-prompt.md` |
| 3 | Script foundation (env, CLI, registry, helpers) | `scripts/research_competitive.py` (skeleton) |
| 4 | All 10 scrapers | Modify `research_competitive.py` |
| 5 | Orchestration (landscape + quick modes, Gemini calls) | Modify `research_competitive.py` |
| 6 | SKILL.md | Create `SKILL.md` |
| 7 | E2E test — quick mode | Testing only |
| 8 | E2E test — landscape mode | Testing only |

The skill lives in `~/.claude/skills/competitive-intel/` (not in the Pyramid repo). No git tracking needed for the skill itself — it's auto-discovered by Claude Code.
