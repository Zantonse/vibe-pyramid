# Account Research Skill Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a `/account-research` skill that scrapes 10 public data sources in parallel, synthesizes an SE-ready account brief via Gemini, and writes to the Obsidian vault — mirroring the proven `stock-research` architecture.

**Architecture:** Python script orchestrator (`research_account.py`) with `ThreadPoolExecutor` for parallel scraping, Gemini synthesis via LiteLLM proxy, and Obsidian-formatted output. Skill definition (`SKILL.md`) handles trigger routing and multi-account parallel dispatch via Task tool subagents.

**Tech Stack:** Python 3, `requests`, `beautifulsoup4`, `openai` (LiteLLM client), Gemini 3.1 Pro Preview, Obsidian markdown.

**Reference files:**
- Design doc: `docs/plans/2026-03-05-account-research-skill-design.md`
- Pattern to follow: `/Users/craigverzosa/.claude/skills/stock-research/scripts/research_stock.py`
- LiteLLM env: `~/.claude-litellm.env`
- Obsidian vault: `~/Documents/ObsidianNotes/Claude-Research/accounts/`

---

## Task 1: Create Skill Directory Structure

**Files:**
- Create: `~/.claude/skills/account-research/SKILL.md`
- Create: `~/.claude/skills/account-research/scripts/research_account.py`
- Create: `~/.claude/skills/account-research/references/account-research-prompt.md`

**Step 1: Create directories**

```bash
mkdir -p ~/.claude/skills/account-research/scripts
mkdir -p ~/.claude/skills/account-research/references
```

**Step 2: Verify structure**

```bash
ls -R ~/.claude/skills/account-research/
```

Expected:
```
references/
scripts/
```

**Step 3: Commit**

```bash
cd ~/.claude/skills/account-research
git init
git add -A
git commit -m "chore: scaffold account-research skill directory"
```

Note: This is a standalone skill repo, not part of the Pyramid project. If Craig prefers no git here, skip this commit step.

---

## Task 2: Write the Gemini System Prompt

The system prompt defines the report template Gemini will follow. This is the most important file — it controls output quality.

**Files:**
- Create: `~/.claude/skills/account-research/references/account-research-prompt.md`

**Step 1: Write the prompt file**

Write the following content to `references/account-research-prompt.md`:

```markdown
You are a senior Sales Engineer researching a prospect account in the Identity & Access Management space. Given scraped data about a company, produce a comprehensive account research brief that helps an SE prepare for technical conversations.

## Guidelines

- Derive business goals from signals — don't just list facts. If they're hiring cloud engineers + raised Series D + CEO mentions "digital transformation" → business goal is rapid cloud migration with likely identity consolidation need.
- Be specific with data points — don't say "large company," say "2,400 employees, Series D, $180M raised"
- Flag data gaps explicitly — if a source was unavailable, note what's missing and what it means for confidence
- Connect every pain point hypothesis back to a business goal
- Discovery questions should validate hypotheses, not just gather generic info
- Keep language direct and analytical — this is internal SE prep, not customer-facing
- Use markdown formatting with tables where appropriate
- When identity/security vendor signals are detected, explain the displacement or expansion opportunity

## Depth Modes

The `depth` parameter controls how much detail to produce:

- **quick**: Company snapshot, top 3 pain points, 5 discovery questions. 1-2 pages. For first-call prep when time is short.
- **deep**: All sections below with moderate detail. 3-5 pages. Standard pre-call research.
- **full**: All sections with maximum detail, extended competitive analysis, and detailed talk track. 5-8 pages. For proposal/RFP preparation.

## Report Structure

# {Company Name} — Account Research Brief

> Generated: {date} | Depth: {depth} | Angle: {angle or "general"}

## Company Snapshot
What they do, when founded, HQ, employee count, funding stage or public market cap, key leadership (CEO, CTO, CISO if known), recent significant events. 2-3 paragraphs.

## Business Goals & Strategic Priorities
**This is the most important section.** Derive 3-5 strategic priorities from all available signals:
- Hiring patterns (what roles are they filling? cloud migration, security, compliance?)
- News and press releases (product launches, partnerships, M&A, expansion)
- Earnings/investor communications if public (stated priorities, guidance)
- Job posting language (technologies mentioned, team growth areas)
- Industry context (regulatory pressures, competitive dynamics)

For each priority, cite the specific signals that support it.

## Technology Landscape
| Category | Detected Tools/Platforms | Confidence | Source |
|----------|------------------------|------------|--------|
| Cloud/Infra | | High/Med/Low | |
| Identity/IAM | | | |
| Security | | | |
| Dev/Engineering | | | |
| Business Apps | | | |

Narrative summary of their tech maturity and modernization trajectory.

## Identity & Security Posture
Current IAM vendor signals from job postings, tech stack detection, and public references:
- SSO/MFA provider (detected or inferred)
- Directory services (AD, Azure AD, LDAP signals)
- Compliance frameworks mentioned (SOC 2, ISO 27001, FedRAMP, HIPAA, etc.)
- Security team size and maturity signals
- Recent security incidents or breaches if publicly known

If no clear IAM signals are detected, say so — that itself is useful information (greenfield opportunity vs. hidden stack).

## Pain Point Hypotheses
For each hypothesis:
- **Pain point:** What the challenge likely is
- **Evidence:** Specific signals from the data that support this
- **Business goal link:** Which strategic priority this connects to
- **Okta relevance:** How this maps to an Okta capability

Rank hypotheses by confidence (strong/moderate/speculative).

## Competitive Landscape
Identity/security vendors detected or inferred in their environment:
- Current vendor relationships (from job postings, tech detection, case studies)
- Vendors they may be evaluating (from G2 reviews, analyst inquiries)
- Displacement opportunities and likely objections
- Expansion opportunities if they're already an Okta customer

## Opportunity Angle
How Okta specifically fits this account's situation:
- Primary use case to lead with (tied to their #1 business goal)
- Secondary use cases for expansion
- Why now — what's the trigger or urgency?
- Potential blockers or concerns to prepare for

## Discovery Questions
8-10 questions ordered from broad business context to specific technical details:
1-3: Business priorities and transformation initiatives
4-6: Current identity/security architecture and pain points
7-8: Evaluation criteria and decision process
9-10: Technical deep-dive questions specific to their detected stack

Each question should include a brief note on WHY you're asking it (what hypothesis it validates).

## Talk Track
Suggested narrative flow for the technical conversation:
1. Opening: Validate business context (show you've done homework)
2. Discovery: Key questions to ask first
3. Bridge: How their priorities connect to identity
4. Value: Specific Okta capabilities mapped to their needs
5. Proof: Relevant customer stories or technical demos to reference
6. Next steps: What to propose as follow-up

## Source Log
| Source | Status | Data Quality | Notes |
|--------|--------|-------------|-------|
| Company website | ✓/✗ | High/Med/Low | |
| Google News | ✓/✗ | | |
| Crunchbase | ✓/✗ | | |
| Job postings | ✓/✗ | | |
| BuiltWith | ✓/✗ | | |
| G2/TrustRadius | ✓/✗ | | |
| SEC EDGAR | ✓/✗ | | |
| Glassdoor | ✓/✗ | | |
| Industry news | ✓/✗ | | |
| Competitor refs | ✓/✗ | | |
```

**Step 2: Verify file was written**

```bash
wc -l ~/.claude/skills/account-research/references/account-research-prompt.md
```

Expected: ~130-140 lines.

**Step 3: Commit**

```bash
cd ~/.claude/skills/account-research
git add references/account-research-prompt.md
git commit -m "feat: add Gemini system prompt for account research reports"
```

---

## Task 3: Write the Script Foundation

Build the skeleton of `research_account.py` with env loading, dependency management, argument parsing, and the main entrypoint — everything except the scrapers and Gemini call.

**Files:**
- Create: `~/.claude/skills/account-research/scripts/research_account.py`

**Step 1: Write the script foundation**

Write `scripts/research_account.py` with the following structure. Follow the exact patterns from `stock-research/scripts/research_stock.py`:

```python
#!/usr/bin/env python3
"""Account research for Sales Engineering — parallel scraping + Gemini synthesis.

Usage:
    python3 research_account.py "Snowflake"
    python3 research_account.py "Snowflake" --angle "evaluating workforce identity"
    python3 research_account.py "Snowflake" --depth quick
    python3 research_account.py "Snowflake" --depth full --angle "competitive displacement from Ping"
    python3 research_account.py "Snowflake" --output /custom/path.md
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

def _load_env_file():
    """Load credentials from ~/.claude-litellm.env."""
    if os.environ.get("LITELLM_API_KEY"):
        return
    env_file = os.path.expanduser("~/.claude-litellm.env")
    if os.path.exists(env_file):
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if line.startswith("export ") and "=" in line:
                    line = line[7:]
                    key, _, value = line.partition("=")
                    key = key.strip()
                    value = value.strip().strip("'\"")
                    if value.startswith("$"):
                        ref_var = value[1:]
                        value = os.environ.get(ref_var, "")
                    if key and value:
                        os.environ[key] = value

def _ensure_packages():
    """Auto-install missing Python packages."""
    required = ["requests", "beautifulsoup4", "openai"]
    for pkg in required:
        import_name = pkg.replace("-", "")
        if pkg == "beautifulsoup4":
            import_name = "bs4"
        try:
            __import__(import_name)
        except ImportError:
            print(f"Installing {pkg}...", file=sys.stderr)
            subprocess.check_call(
                [sys.executable, "-m", "pip", "install", pkg, "-q"],
                stdout=subprocess.DEVNULL, stderr=subprocess.PIPE
            )

_load_env_file()
_ensure_packages()

import requests
from bs4 import BeautifulSoup

# --- Constants ---

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SKILL_DIR = os.path.dirname(SCRIPT_DIR)
PROMPT_FILE = os.path.join(SKILL_DIR, "references", "account-research-prompt.md")
OBSIDIAN_BASE = os.path.expanduser(
    "~/Documents/ObsidianNotes/Claude-Research/accounts"
)
DEFAULT_MODEL = "gemini-3.1-pro-preview"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    )
}

# Depth -> which scrapers to run
DEPTH_SOURCES = {
    "quick": ["website", "google_news", "crunchbase", "job_postings", "builtwith"],
    "deep": [
        "website", "google_news", "crunchbase", "job_postings", "builtwith",
        "g2_trustradius", "sec_edgar", "glassdoor",
    ],
    "full": [
        "website", "google_news", "crunchbase", "job_postings", "builtwith",
        "g2_trustradius", "sec_edgar", "glassdoor",
        "industry_news", "competitor_refs",
    ],
}
```

This is the first ~100 lines. Continue with:

```python
# --- Company Resolution ---

def resolve_company(query: str) -> dict:
    """Resolve company name to domain and metadata.

    Returns dict with keys: name, domain, query (original input).
    Uses Google search or direct domain inference.
    """
    # Try direct domain: "Snowflake" -> snowflake.com
    slug = re.sub(r'[^a-z0-9]', '', query.lower())
    domain_guess = f"{slug}.com"

    # Validate with a HEAD request
    try:
        resp = requests.head(
            f"https://{domain_guess}",
            headers=HEADERS, timeout=5, allow_redirects=True
        )
        if resp.status_code < 400:
            return {"name": query, "domain": domain_guess, "query": query}
    except requests.RequestException:
        pass

    # Fallback: Google search for company domain
    try:
        search_url = f"https://www.google.com/search?q={requests.utils.quote(query)}+company+website"
        resp = requests.get(search_url, headers=HEADERS, timeout=10)
        # Extract first result domain (rough heuristic)
        soup = BeautifulSoup(resp.text, "html.parser")
        for cite in soup.find_all("cite"):
            text = cite.get_text()
            if "." in text and "/" in text:
                domain = text.split("/")[0].replace("https://", "").replace("http://", "")
                if "." in domain:
                    return {"name": query, "domain": domain, "query": query}
    except Exception:
        pass

    return {"name": query, "domain": domain_guess, "query": query}


# --- Scrapers ---
# Each scraper function takes (company: dict) and returns (source_name: str, data: str | None)
# Follows stock-research pattern: return None on failure, log to stderr

# SCRAPER FUNCTIONS WILL BE ADDED IN TASKS 4-6

# --- Scraper Registry ---

SCRAPER_REGISTRY = {
    # Populated in Tasks 4-6
}


# --- Gemini Synthesis ---

def load_system_prompt() -> str:
    """Load the account research system prompt."""
    if os.path.exists(PROMPT_FILE):
        with open(PROMPT_FILE) as f:
            return f.read()
    return "You are a Sales Engineer researching a prospect account. Produce a comprehensive account overview."


def synthesize_with_gemini(
    company: dict,
    scraped_data: dict,
    angle: str,
    depth: str,
    model: str = DEFAULT_MODEL,
    existing_brief: Optional[str] = None,
) -> str:
    """Send all scraped data to Gemini for synthesis."""
    from openai import OpenAI

    api_key = os.environ.get("LITELLM_API_KEY")
    base_url = os.environ.get("LITELLM_BASE_URL", "").rstrip("/")
    if not api_key or not base_url:
        print("Error: LITELLM_API_KEY and LITELLM_BASE_URL required.", file=sys.stderr)
        sys.exit(1)
    if not base_url.endswith("/v1"):
        base_url += "/v1"

    client = OpenAI(api_key=api_key, base_url=base_url)
    system_prompt = load_system_prompt()

    # Build context from scraped data
    context_parts = []
    for source_name, data in scraped_data.items():
        if data:
            context_parts.append(f"### Source: {source_name}\n\n{data}")

    context = "\n\n---\n\n".join(context_parts)

    user_msg = f"""## Company: {company['name']}
## Domain: {company['domain']}
## Research Angle: {angle or 'General account research'}
## Depth: {depth}

---

## Scraped Data

{context}"""

    if existing_brief:
        user_msg += f"\n\n---\n\n## Previous Research Brief (to deepen, not repeat)\n\n{existing_brief}"

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_msg},
    ]

    print(f"Synthesizing with {model}...", file=sys.stderr)
    try:
        response = client.chat.completions.create(
            model=model, messages=messages,
            max_tokens=16000, temperature=0.3,
        )
    except Exception as e:
        print(f"Gemini API error: {e}", file=sys.stderr)
        sys.exit(1)

    result = response.choices[0].message.content or ""
    usage = getattr(response, "usage", None)
    if usage:
        print(
            f"Tokens — prompt: {usage.prompt_tokens:,}, "
            f"completion: {usage.completion_tokens:,}, "
            f"total: {usage.total_tokens:,}",
            file=sys.stderr,
        )
    return result


# --- Output Formatting ---

def slugify(name: str) -> str:
    """Convert company name to URL-friendly slug."""
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')


def format_obsidian_output(
    company: dict, content: str, depth: str, angle: str
) -> str:
    """Wrap Gemini output with Obsidian YAML frontmatter."""
    date_str = datetime.now().strftime("%Y-%m-%d")
    slug = slugify(company["name"])
    frontmatter = f"""---
date: {date_str}
tags:
  - account-research
  - {slug}
source: claude-code
project: se-accounts
depth: {depth}
angle: "{angle or 'general'}"
---

> Related: [[account-research-index]] [[se-playbook]]

"""
    return frontmatter + content


def output_filename(company: dict) -> str:
    """Generate output filename: {slug}-{YYYY-MM}.md"""
    slug = slugify(company["name"])
    month = datetime.now().strftime("%Y-%m")
    return f"{slug}-{month}.md"


def find_existing_brief(company: dict) -> Optional[str]:
    """Check if a previous brief exists for this company."""
    slug = slugify(company["name"])
    if not os.path.isdir(OBSIDIAN_BASE):
        return None
    for fname in os.listdir(OBSIDIAN_BASE):
        if fname.startswith(slug) and fname.endswith(".md"):
            path = os.path.join(OBSIDIAN_BASE, fname)
            with open(path) as f:
                return f.read()
    return None


# --- Main ---

def main():
    parser = argparse.ArgumentParser(
        description="Account research: parallel scraping + Gemini synthesis"
    )
    parser.add_argument("company", help="Company name to research")
    parser.add_argument("--angle", "-a", default="", help="Research angle or context")
    parser.add_argument(
        "--depth", "-d", choices=["quick", "deep", "full"],
        default="deep", help="Research depth (default: deep)"
    )
    parser.add_argument("--output", "-o", default=None, help="Custom output path")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="LLM model")
    args = parser.parse_args()

    # 1. Resolve company
    print(f"Resolving company: {args.company}...", file=sys.stderr)
    company = resolve_company(args.company)
    print(f"  → {company['name']} ({company['domain']})", file=sys.stderr)

    # 2. Select scrapers for depth level
    source_keys = DEPTH_SOURCES[args.depth]
    scrapers = [(key, SCRAPER_REGISTRY[key]) for key in source_keys if key in SCRAPER_REGISTRY]

    # 3. Check for existing brief (evolving brief feature)
    existing_brief = find_existing_brief(company)
    if existing_brief:
        print("  → Found existing brief, will deepen rather than regenerate", file=sys.stderr)

    # 4. Run scrapers in parallel
    print(f"Scraping {len(scrapers)} sources ({args.depth} depth)...", file=sys.stderr)
    scraped_data = {}
    with ThreadPoolExecutor(max_workers=min(len(scrapers), 8)) as executor:
        futures = {
            executor.submit(fn, company): name
            for name, fn in scrapers
        }
        for future in as_completed(futures):
            name = futures[future]
            try:
                source_name, data = future.result()
                scraped_data[source_name] = data
                status = "✓" if data else "✗ (no data)"
                print(f"  [{status}] {source_name}", file=sys.stderr)
            except Exception as e:
                print(f"  [✗ ERROR] {name}: {e}", file=sys.stderr)
                scraped_data[name] = None

    # 5. Synthesize with Gemini
    result = synthesize_with_gemini(
        company, scraped_data, args.angle, args.depth,
        model=args.model, existing_brief=existing_brief,
    )

    # 6. Format output
    output = format_obsidian_output(company, result, args.depth, args.angle)

    # 7. Write file
    out_path = args.output or os.path.join(OBSIDIAN_BASE, output_filename(company))
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w") as f:
        f.write(output)

    print(f"\nSaved to: {out_path}", file=sys.stderr)
    # Print path to stdout for the calling skill to capture
    print(out_path)


if __name__ == "__main__":
    main()
```

**Step 2: Verify script is syntactically valid**

```bash
python3 -c "import ast; ast.parse(open(os.path.expanduser('~/.claude/skills/account-research/scripts/research_account.py')).read()); print('Syntax OK')" 2>&1 || python3 -m py_compile ~/.claude/skills/account-research/scripts/research_account.py
```

**Step 3: Commit**

```bash
cd ~/.claude/skills/account-research
git add scripts/research_account.py
git commit -m "feat: add script foundation with env loading, arg parsing, Gemini synthesis, and output formatting"
```

---

## Task 4: Implement Core Scrapers (Quick Depth)

These 5 scrapers run at all depth levels and form the minimum viable research.

**Files:**
- Modify: `~/.claude/skills/account-research/scripts/research_account.py`

**Step 1: Implement `scrape_website`**

Add this function after the `resolve_company` function. It scrapes the company's about page and careers page for mission, products, and hiring signals.

```python
def scrape_website(company: dict) -> tuple:
    """Scrape company website for about page and careers."""
    name = "Company Website"
    domain = company["domain"]
    parts = []

    # About page
    for path in ["/about", "/about-us", "/company", ""]:
        try:
            resp = requests.get(
                f"https://{domain}{path}",
                headers=HEADERS, timeout=10, allow_redirects=True
            )
            if resp.status_code == 200 and len(resp.text) > 500:
                soup = BeautifulSoup(resp.text, "html.parser")
                # Remove nav, footer, script, style
                for tag in soup(["nav", "footer", "script", "style", "header"]):
                    tag.decompose()
                text = soup.get_text(separator="\n", strip=True)
                # Truncate to first 3000 chars
                parts.append(f"**About page ({path or '/'}):**\n{text[:3000]}")
                break
        except Exception:
            continue

    # Careers page
    for path in ["/careers", "/jobs", "/about/careers"]:
        try:
            resp = requests.get(
                f"https://{domain}{path}",
                headers=HEADERS, timeout=10, allow_redirects=True
            )
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "html.parser")
                for tag in soup(["nav", "footer", "script", "style"]):
                    tag.decompose()
                text = soup.get_text(separator="\n", strip=True)
                parts.append(f"**Careers page ({path}):**\n{text[:2000]}")
                break
        except Exception:
            continue

    return (name, "\n\n".join(parts) if parts else None)
```

**Step 2: Implement `scrape_google_news`**

```python
def scrape_google_news(company: dict) -> tuple:
    """Scrape Google News RSS for recent company headlines."""
    name = "Google News"
    query = requests.utils.quote(f"{company['name']} company")
    url = f"https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10)
        if resp.status_code != 200:
            return (name, None)
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
        print(f"  Google News error: {e}", file=sys.stderr)
        return (name, None)
```

**Step 3: Implement `scrape_crunchbase`**

Crunchbase blocks scraping, so use a Google search for Crunchbase data as a proxy:

```python
def scrape_crunchbase(company: dict) -> tuple:
    """Search for Crunchbase/funding data via Google."""
    name = "Crunchbase / Funding"
    query = requests.utils.quote(
        f"{company['name']} company crunchbase funding revenue employees"
    )
    try:
        resp = requests.get(
            f"https://www.google.com/search?q={query}",
            headers=HEADERS, timeout=10
        )
        if resp.status_code != 200:
            return (name, None)
        soup = BeautifulSoup(resp.text, "html.parser")
        # Extract text from search results
        snippets = []
        for div in soup.find_all("div", class_=True):
            text = div.get_text(strip=True)
            if any(kw in text.lower() for kw in [
                "funding", "revenue", "employees", "founded",
                "series", "valuation", "raised", "headquarter"
            ]):
                if len(text) > 30 and text not in snippets:
                    snippets.append(text[:500])
                    if len(snippets) >= 8:
                        break
        return (name, "\n".join(snippets) if snippets else None)
    except Exception as e:
        print(f"  Crunchbase error: {e}", file=sys.stderr)
        return (name, None)
```

**Step 4: Implement `scrape_job_postings`**

```python
def scrape_job_postings(company: dict) -> tuple:
    """Search Indeed/Google for job postings to detect tech stack."""
    name = "Job Postings"
    query = requests.utils.quote(
        f"{company['name']} jobs site:indeed.com OR site:linkedin.com/jobs"
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
            # Look for tech keywords in job snippets
            if any(kw in text.lower() for kw in [
                "okta", "azure ad", "entra", "ping", "forgerock",
                "saml", "oidc", "sso", "mfa", "scim", "ldap",
                "aws", "azure", "gcp", "kubernetes", "terraform",
                "python", "java", "react", "node", "golang",
                "soc 2", "iso 27001", "fedramp", "hipaa", "gdpr",
                "security engineer", "identity", "iam",
            ]):
                if len(text) > 50 and text[:100] not in [s[:100] for s in snippets]:
                    snippets.append(text[:600])
                    if len(snippets) >= 10:
                        break
        return (name, "\n\n".join(snippets) if snippets else None)
    except Exception as e:
        print(f"  Job postings error: {e}", file=sys.stderr)
        return (name, None)
```

**Step 5: Implement `scrape_builtwith`**

```python
def scrape_builtwith(company: dict) -> tuple:
    """Use BuiltWith or HackerTarget to detect tech stack."""
    name = "Tech Stack Detection"
    domain = company["domain"]
    parts = []

    # Try HackerTarget HTTP headers
    try:
        resp = requests.get(
            f"https://api.hackertarget.com/httpheaders/?q={domain}",
            timeout=10
        )
        if resp.status_code == 200 and "error" not in resp.text.lower():
            parts.append(f"**HTTP Headers:**\n{resp.text[:1500]}")
    except Exception:
        pass

    # Try BuiltWith free lookup via Google
    try:
        query = requests.utils.quote(f"site:builtwith.com {domain}")
        resp = requests.get(
            f"https://www.google.com/search?q={query}",
            headers=HEADERS, timeout=10
        )
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, "html.parser")
            for div in soup.find_all("div"):
                text = div.get_text(strip=True)
                if any(kw in text.lower() for kw in [
                    "technology", "analytics", "framework", "cdn",
                    "hosting", "javascript", "cms", "ssl"
                ]) and len(text) > 30:
                    parts.append(text[:500])
                    if len(parts) >= 5:
                        break
    except Exception:
        pass

    return (name, "\n\n".join(parts) if parts else None)
```

**Step 6: Register all 5 scrapers in SCRAPER_REGISTRY**

Update the `SCRAPER_REGISTRY` dict:

```python
SCRAPER_REGISTRY = {
    "website": scrape_website,
    "google_news": scrape_google_news,
    "crunchbase": scrape_crunchbase,
    "job_postings": scrape_job_postings,
    "builtwith": scrape_builtwith,
}
```

**Step 7: Test with a quick-depth dry run**

```bash
python3 ~/.claude/skills/account-research/scripts/research_account.py "Snowflake" --depth quick 2>&1 | head -5
```

Expected: stderr shows scraper progress, stdout shows the output file path. Verify each scraper reports ✓ or ✗.

**Step 8: Commit**

```bash
cd ~/.claude/skills/account-research
git add scripts/research_account.py
git commit -m "feat: implement 5 core scrapers (website, news, crunchbase, jobs, builtwith)"
```

---

## Task 5: Implement Deep Scrapers

Add the 3 scrapers that activate at `deep` depth.

**Files:**
- Modify: `~/.claude/skills/account-research/scripts/research_account.py`

**Step 1: Implement `scrape_g2_trustradius`**

```python
def scrape_g2_trustradius(company: dict) -> tuple:
    """Search G2/TrustRadius for identity/security tool usage."""
    name = "G2 / TrustRadius"
    query = requests.utils.quote(
        f"{company['name']} site:g2.com OR site:trustradius.com identity security SSO"
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
                "identity", "sso", "authentication", "okta", "ping",
            ]) and len(text) > 40:
                snippets.append(text[:500])
                if len(snippets) >= 6:
                    break
        return (name, "\n\n".join(snippets) if snippets else None)
    except Exception as e:
        print(f"  G2/TrustRadius error: {e}", file=sys.stderr)
        return (name, None)
```

**Step 2: Implement `scrape_sec_edgar`**

Follow the pattern from `stock-research/scripts/research_stock.py` `scrape_sec_edgar`:

```python
def scrape_sec_edgar(company: dict) -> tuple:
    """Search SEC EDGAR for 10-K filings (public companies only)."""
    name = "SEC EDGAR"
    query = requests.utils.quote(company["name"])
    try:
        resp = requests.get(
            f"https://efts.sec.gov/LATEST/search-index?q={query}&dateRange=custom"
            f"&startdt=2024-01-01&forms=10-K",
            headers={"User-Agent": "AccountResearch/1.0 research@example.com"},
            timeout=10,
        )
        if resp.status_code != 200:
            # Try EDGAR full-text search
            resp = requests.get(
                f"https://efts.sec.gov/LATEST/search-index?q=%22{query}%22&forms=10-K",
                headers={"User-Agent": "AccountResearch/1.0 research@example.com"},
                timeout=10,
            )
            if resp.status_code != 200:
                return (name, None)
        text = resp.text[:3000]
        if "filing" in text.lower() or "10-K" in text:
            return (name, f"**SEC EDGAR search results for {company['name']}:**\n{text}")
        return (name, None)
    except Exception as e:
        print(f"  SEC EDGAR error: {e}", file=sys.stderr)
        return (name, None)
```

**Step 3: Implement `scrape_glassdoor`**

```python
def scrape_glassdoor(company: dict) -> tuple:
    """Search for Glassdoor signals (tech mentions, team size, culture)."""
    name = "Glassdoor"
    query = requests.utils.quote(
        f"{company['name']} glassdoor engineering technology team"
    )
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
                "glassdoor", "engineering", "technology", "culture",
                "interview", "tech stack", "work-life",
            ]) and len(text) > 40:
                snippets.append(text[:500])
                if len(snippets) >= 6:
                    break
        return (name, "\n\n".join(snippets) if snippets else None)
    except Exception as e:
        print(f"  Glassdoor error: {e}", file=sys.stderr)
        return (name, None)
```

**Step 4: Register in SCRAPER_REGISTRY**

Add to the existing dict:

```python
    "g2_trustradius": scrape_g2_trustradius,
    "sec_edgar": scrape_sec_edgar,
    "glassdoor": scrape_glassdoor,
```

**Step 5: Test with deep depth**

```bash
python3 ~/.claude/skills/account-research/scripts/research_account.py "Datadog" --depth deep 2>&1 | tail -20
```

Expected: 8 scrapers show ✓/✗ in stderr. Output file created in Obsidian accounts folder.

**Step 6: Commit**

```bash
cd ~/.claude/skills/account-research
git add scripts/research_account.py
git commit -m "feat: add deep-depth scrapers (G2, SEC EDGAR, Glassdoor)"
```

---

## Task 6: Implement Full Scrapers

Add the 2 scrapers that activate only at `full` depth.

**Files:**
- Modify: `~/.claude/skills/account-research/scripts/research_account.py`

**Step 1: Implement `scrape_industry_news`**

```python
def scrape_industry_news(company: dict) -> tuple:
    """Search for industry-specific news (regulatory, compliance pressures)."""
    name = "Industry News"
    query = requests.utils.quote(
        f"{company['name']} regulation compliance identity security "
        f"breach data privacy 2025 2026"
    )
    try:
        resp = requests.get(
            f"https://www.google.com/search?q={query}&tbm=nws&num=10",
            headers=HEADERS, timeout=10
        )
        if resp.status_code != 200:
            return (name, None)
        soup = BeautifulSoup(resp.text, "html.parser")
        snippets = []
        for div in soup.find_all("div"):
            text = div.get_text(strip=True)
            if len(text) > 60 and any(kw in text.lower() for kw in [
                "compliance", "regulation", "breach", "security",
                "privacy", "identity", "audit", "risk",
            ]):
                snippets.append(text[:500])
                if len(snippets) >= 8:
                    break
        return (name, "\n\n".join(snippets) if snippets else None)
    except Exception as e:
        print(f"  Industry news error: {e}", file=sys.stderr)
        return (name, None)
```

**Step 2: Implement `scrape_competitor_refs`**

```python
def scrape_competitor_refs(company: dict) -> tuple:
    """Search for public references to this company + identity vendors."""
    name = "Competitor References"
    vendors = ["Okta", "Azure AD", "Entra ID", "Ping Identity", "ForgeRock",
               "CyberArk", "SailPoint", "OneLogin", "JumpCloud", "Auth0"]
    vendor_str = " OR ".join(f'"{v}"' for v in vendors[:5])
    query = requests.utils.quote(
        f'"{company["name"]}" ({vendor_str}) case study OR partnership OR deployment'
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
            if any(v.lower() in text.lower() for v in vendors) and len(text) > 40:
                snippets.append(text[:500])
                if len(snippets) >= 8:
                    break
        return (name, "\n\n".join(snippets) if snippets else None)
    except Exception as e:
        print(f"  Competitor refs error: {e}", file=sys.stderr)
        return (name, None)
```

**Step 3: Register in SCRAPER_REGISTRY**

Add to the existing dict:

```python
    "industry_news": scrape_industry_news,
    "competitor_refs": scrape_competitor_refs,
```

**Step 4: Test full depth end-to-end**

```bash
python3 ~/.claude/skills/account-research/scripts/research_account.py "Collibra" --depth full --angle "data governance, evaluating identity consolidation" 2>&1
```

Expected: All 10 scrapers attempt, Gemini synthesis runs, output file appears in Obsidian.

**Step 5: Verify output format**

```bash
head -20 ~/Documents/ObsidianNotes/Claude-Research/accounts/collibra-*.md
```

Expected: YAML frontmatter with date, tags, depth, angle fields.

**Step 6: Commit**

```bash
cd ~/.claude/skills/account-research
git add scripts/research_account.py
git commit -m "feat: add full-depth scrapers (industry news, competitor references)"
```

---

## Task 7: Write the SKILL.md

This is the trigger and routing layer that tells Claude Code when to activate and how to dispatch.

**Files:**
- Create: `~/.claude/skills/account-research/SKILL.md`

**Step 1: Write SKILL.md**

```markdown
---
name: account-research
description: "Structured account research for Sales Engineering prep. Scrapes 10 public data sources in parallel, synthesizes with Gemini into an SE-ready brief, and writes to the Obsidian vault. Derives business goals from signals, detects identity/security stack, and generates discovery questions and talk tracks. Use when the user asks to research a company, prep for a call, build an account overview, or do prospect research. Triggers on: 'account research', 'research [company]', 'prep for [company]', 'account overview', 'prospect research', 'who is [company]', 'what does [company] do', 'research account', or any request combining a company name with sales, SE, or account prep intent. Also trigger when the user mentions preparing for a customer call or needs a company brief."
---

# Account Research

Perform structured account research for Sales Engineering and write SE-ready briefs to the Obsidian vault.

## How It Works

The skill uses `scripts/research_account.py` to:
1. Resolve the company name to a domain
2. Scrape 5-10 public data sources concurrently (company website, news, funding, job postings, tech stack, reviews, SEC filings, Glassdoor, industry news, competitor references)
3. Send all scraped context to Gemini (via LiteLLM) with an SE-focused system prompt
4. Format the output with Obsidian YAML frontmatter and wiki-links
5. Save to `~/Documents/ObsidianNotes/Claude-Research/accounts/`

All scrapers run in parallel via ThreadPoolExecutor.

## Usage

```bash
python3 <skill-path>/scripts/research_account.py "Snowflake"
python3 <skill-path>/scripts/research_account.py "Snowflake" --angle "evaluating workforce identity"
python3 <skill-path>/scripts/research_account.py "Snowflake" --depth quick
python3 <skill-path>/scripts/research_account.py "Collibra" --depth full --angle "competitive displacement from Ping"
```

Replace `<skill-path>` with: `/Users/craigverzosa/.claude/skills/account-research`

## Depth Levels

| Depth | Purpose | Sources | Output |
|-------|---------|---------|--------|
| `quick` | First call prep | 5 core | ~1-2 pages |
| `deep` (default) | Full SE prep | 8 sources | ~3-5 pages |
| `full` | Proposal/RFP | All 10 | ~5-8 pages |

## Invocation

Parse the user's request to extract:
1. **Company name** (required)
2. **Angle** (optional — any context about the opportunity, e.g., "competitive displacement", "evaluating workforce identity")
3. **Depth** (optional — quick/deep/full, default deep)

Then dispatch:

```
Task tool (Bash subagent, model: "sonnet"):
  prompt: |
    Run: python3 /Users/craigverzosa/.claude/skills/account-research/scripts/research_account.py "{COMPANY}" --angle "{ANGLE}" --depth {DEPTH}
    Report the output path from stdout and any source failures from stderr.
```

## Multi-Company: Parallel Dispatch

When the user asks to research multiple companies, dispatch one subagent per company using the Task tool. All subagents run concurrently.

Example: user says "research Snowflake, Collibra, and Datadog" → dispatch 3 Bash subagents simultaneously.

## Evolving Briefs

If a previous brief exists for the company, the script automatically reads it and deepens the analysis rather than regenerating from scratch. Manual notes in a `## My Notes` section are preserved.

## After Running

1. Report the output file path(s) to the user
2. Summarize key findings conversationally: company snapshot, top business goals, main pain point hypotheses, and recommended discovery questions
3. Mention any data sources that failed (from stderr)
4. For multi-company runs, provide a brief comparison
5. The user can open the report(s) in Obsidian for the full detailed view

## Output Location

`~/Documents/ObsidianNotes/Claude-Research/accounts/{company-slug}-{YYYY-MM}.md`

## Dependencies

- Python 3 with `requests`, `beautifulsoup4`, `openai` (auto-installed if missing)
- LiteLLM credentials in `~/.claude-litellm.env`
- Obsidian vault at `~/Documents/ObsidianNotes/`
```

**Step 2: Commit**

```bash
cd ~/.claude/skills/account-research
git add SKILL.md
git commit -m "feat: add SKILL.md with trigger rules, dispatch pattern, and usage docs"
```

---

## Task 8: Register Skill and End-to-End Test

**Step 1: Verify skill directory is in the right place**

Claude Code auto-discovers skills in `~/.claude/skills/`. Verify:

```bash
ls ~/.claude/skills/account-research/SKILL.md
ls ~/.claude/skills/account-research/scripts/research_account.py
ls ~/.claude/skills/account-research/references/account-research-prompt.md
```

All three should exist.

**Step 2: Run a full end-to-end test**

```bash
python3 ~/.claude/skills/account-research/scripts/research_account.py "Datadog" --angle "expanding identity coverage" --depth deep 2>&1
```

**Expected output (stderr):**
```
Resolving company: Datadog...
  → Datadog (datadog.com)
Scraping 8 sources (deep depth)...
  [✓] Company Website
  [✓] Google News
  [✓] Crunchbase / Funding
  [✓] Job Postings
  [✓] Tech Stack Detection
  [✓] G2 / TrustRadius
  [✗ (no data)] SEC EDGAR        ← may or may not find filings
  [✓] Glassdoor
Synthesizing with gemini-3.1-pro-preview...
Tokens — prompt: X, completion: Y, total: Z

Saved to: /Users/craigverzosa/Documents/ObsidianNotes/Claude-Research/accounts/datadog-2026-03.md
```

**Step 3: Verify output content**

```bash
head -15 ~/Documents/ObsidianNotes/Claude-Research/accounts/datadog-*.md
```

Expected: YAML frontmatter with correct tags, depth, angle.

```bash
grep -c "##" ~/Documents/ObsidianNotes/Claude-Research/accounts/datadog-*.md
```

Expected: ~10+ section headers matching the template.

**Step 4: Test evolving brief**

```bash
python3 ~/.claude/skills/account-research/scripts/research_account.py "Datadog" --depth full --angle "expanding identity coverage, competitive with CrowdStrike" 2>&1
```

Expected: stderr shows "Found existing brief, will deepen rather than regenerate"

**Step 5: Test quick depth**

```bash
python3 ~/.claude/skills/account-research/scripts/research_account.py "Stripe" --depth quick 2>&1
```

Expected: Only 5 scrapers run. Shorter output.

**Step 6: Final commit**

```bash
cd ~/.claude/skills/account-research
git add -A
git commit -m "feat: account-research skill complete — 10 scrapers, 3 depth levels, evolving briefs"
```

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | Directory scaffold | Create 3 dirs |
| 2 | Gemini system prompt | `references/account-research-prompt.md` |
| 3 | Script foundation | `scripts/research_account.py` (skeleton) |
| 4 | Core scrapers (5) | Modify `research_account.py` |
| 5 | Deep scrapers (3) | Modify `research_account.py` |
| 6 | Full scrapers (2) | Modify `research_account.py` |
| 7 | SKILL.md | Create `SKILL.md` |
| 8 | Register + E2E test | Verify + test |

Each task has a commit. Total: 8 commits building up the skill incrementally.
