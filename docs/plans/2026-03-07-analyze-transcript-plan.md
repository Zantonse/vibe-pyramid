# Analyze Transcript Skill Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an `/analyze-transcript` skill that takes VTT/TXT call transcripts, identifies speakers, produces SE call debriefs via Claude (Anthropic SDK through LiteLLM proxy), and integrates with existing account-research briefs in Obsidian.

**Architecture:** Single Python script (`analyze_transcript.py`) — preprocess VTT → one Claude API call → write Obsidian debrief → append Call Log to account brief. Uses the Anthropic SDK pointed at the LiteLLM proxy (`https://llm.atko.ai`).

**Tech Stack:** Python 3, `anthropic` SDK, Obsidian markdown.

**Reference files:**
- Design doc: `docs/plans/2026-03-07-analyze-transcript-design.md`
- Pattern to follow: `~/.claude/skills/account-research/scripts/research_account.py`
- LiteLLM env: `~/.claude-litellm.env` (provides `LITELLM_KEY` and `ANTHROPIC_AUTH_TOKEN`)
- Obsidian vault: `~/Documents/ObsidianNotes/Claude-Research/`

**Credential mapping:**
- `ANTHROPIC_AUTH_TOKEN` → Anthropic SDK `api_key`
- `ANTHROPIC_BASE_URL` (`https://llm.atko.ai`) → Anthropic SDK `base_url`
- Both loaded from `~/.claude-litellm.env`

---

## Task 1: Create Skill Directory Structure

**Files:**
- Create: `~/.claude/skills/analyze-transcript/scripts/` (directory)
- Create: `~/.claude/skills/analyze-transcript/references/` (directory)
- Create: `~/Documents/ObsidianNotes/Claude-Research/call-debriefs/` (directory)

**Step 1: Create directories**

```bash
mkdir -p ~/.claude/skills/analyze-transcript/scripts
mkdir -p ~/.claude/skills/analyze-transcript/references
mkdir -p ~/Documents/ObsidianNotes/Claude-Research/call-debriefs
```

**Step 2: Verify structure**

```bash
ls -R ~/.claude/skills/analyze-transcript/
```

Expected:
```
references/
scripts/
```

---

## Task 2: Write the Debrief Prompt

The system prompt controls Claude's analysis output quality. This is the most important file.

**Files:**
- Create: `~/.claude/skills/analyze-transcript/references/debrief-prompt.md`

**Step 1: Write the prompt file**

Write the following to `references/debrief-prompt.md`:

```markdown
You are a senior Sales Engineer reviewing a call transcript. Produce a structured debrief that helps the SE (and their team) understand what happened, what was learned, and what to do next.

## Guidelines

- Identify speakers by name and infer their roles from context (title mentions, who asks vs. answers, technical depth, authority signals)
- Be specific with quotes — use exact words from the transcript, not paraphrases
- Pain points should be tied to business impact, not just technical complaints
- Discovery quality assessment should be honest and constructive — this is for self-improvement
- Action items must be specific, assignable, and time-bound where possible
- Competitive signals include any vendor mention, comparison, or existing tool reference
- For the talk/listen balance, note patterns: did the SE monologue? Did discovery questions get cut short? Were follow-up questions asked?
- Keep language direct and actionable — this is internal SE documentation

## Speaker Identification

Analyze the transcript for speaker labels. Common patterns:
- VTT format: "Speaker Name: text" at line beginnings
- Implied roles: whoever says "let me show you" or "from an Okta perspective" is likely the SE
- Title mentions: "as our CISO", "I manage the identity team", "from a product standpoint"
- If you cannot identify a speaker, use "Unknown Speaker 1", "Unknown Speaker 2", etc.

## Report Structure

Produce the following sections in order. Every section is required even if data is sparse — note "No signals detected" rather than omitting the section.

# {Account} — Call Debrief

> Date: {date} | Duration: ~{estimate from transcript length} | Participants: {comma-separated speaker list}

## Executive Summary
3-4 sentences: what was the call about, what was the outcome, what are the immediate next steps. Write this as if briefing a sales leader who has 30 seconds.

## Participants & Roles
| Speaker | Inferred Role | Key Signals |
|---------|--------------|-------------|
| Name | Role | One-line observation about their stance, authority, or concerns |

## Discovery Findings

### Pain Points Uncovered
For each pain point:
- **{Pain point title}** — Raised by {speaker}. "{exact quote}". Business impact: {inferred impact}.

### Business Goals Identified
- {Goal} — Evidence: {what was said that indicates this goal}

### Technical Environment Signals
- Tools, vendors, cloud providers, frameworks mentioned
- Current identity/security stack signals (SSO provider, MFA method, directory, governance tools)
- Modernization indicators (migrating from X to Y, evaluating Z)

## Competitive Signals
- Vendor names mentioned (positive or negative)
- Existing relationships ("we use X today", "we evaluated Y")
- Displacement opportunities or risks
- If no competitive signals detected: "No explicit competitor mentions in this call."

## Relationship Map
- **Champions:** Who is advocating for change? Evidence.
- **Blockers:** Who pushed back? On what? Why?
- **Decision makers:** Who has budget/authority signals?
- **Influencers:** Who shapes technical opinions?

## Action Items & Next Steps
Specific, assignable follow-ups:
- [ ] {Action} — Owner: {who} — Timeline: {when}
- [ ] {Action} — Owner: {who} — Timeline: {when}

## Discovery Quality Assessment
- **Strong questions asked:** List the best discovery questions from the call
- **Gaps — questions that should have been asked:** What was missed? What would have uncovered more?
- **Talk/listen balance:** Did the SE listen well or dominate the conversation? Specific examples.
- **Overall score:** {1-10} — {one-sentence rationale}

## Key Quotes
Verbatim quotes worth saving for proposals, follow-up emails, or internal alignment:
- "{quote}" — {Speaker}, on {topic}
```

**Step 2: Verify file**

```bash
wc -l ~/.claude/skills/analyze-transcript/references/debrief-prompt.md
```

Expected: ~75-85 lines.

---

## Task 3: Write the Script

Build the complete `analyze_transcript.py` in one task. This is a ~400-line script with:
- Env loading (copy pattern from account-research)
- Auto-install `anthropic` package
- VTT parser with speaker identification
- CLI argument parsing
- Claude API call via Anthropic SDK (through LiteLLM proxy)
- Obsidian output formatting
- Account brief integration (append Call Log)

**Files:**
- Create: `~/.claude/skills/analyze-transcript/scripts/analyze_transcript.py`

**Step 1: Write the complete script**

The script must include these components in order:

### Component 1: Env loading + dependency management

Copy `_load_env_file()` exactly from `~/.claude/skills/account-research/scripts/research_account.py`. It loads `~/.claude-litellm.env`.

For `_ensure_packages()`, install `anthropic` instead of `openai`:
```python
def _ensure_packages():
    for pkg, import_name in [("anthropic", "anthropic")]:
        try:
            __import__(import_name)
        except ImportError:
            print(f"Installing {pkg}...", file=sys.stderr)
            subprocess.check_call(
                [sys.executable, "-m", "pip", "install", pkg, "-q"],
                stdout=subprocess.DEVNULL, stderr=subprocess.PIPE,
            )
```

### Component 2: Constants

```python
SCRIPT_DIR = Path(__file__).parent.resolve()
SKILL_DIR = SCRIPT_DIR.parent
PROMPT_FILE = SKILL_DIR / "references" / "debrief-prompt.md"
OBSIDIAN_DEBRIEFS = Path.home() / "Documents" / "ObsidianNotes" / "Claude-Research" / "call-debriefs"
OBSIDIAN_ACCOUNTS = Path.home() / "Documents" / "ObsidianNotes" / "Claude-Research" / "accounts"
DEFAULT_MODEL = "claude-sonnet-4-5-20250514"
```

### Component 3: VTT Parser

```python
def parse_vtt(content: str) -> str:
    """Parse VTT transcript into clean Speaker: text format."""
    lines = content.splitlines()
    result = []
    current_speaker = None
    current_text = []

    for line in lines:
        line = line.strip()
        # Skip VTT header, empty lines, timestamps, and NOTE blocks
        if not line or line == "WEBVTT" or line.startswith("NOTE"):
            continue
        if re.match(r'\d{2}:\d{2}', line) and '-->' in line:
            continue
        # Skip numeric cue identifiers
        if re.match(r'^\d+$', line):
            continue

        # Extract speaker from <v Name> format
        v_match = re.match(r'<v\s+([^>]+)>(.*?)(?:</v>)?$', line)
        if v_match:
            speaker = v_match.group(1).strip()
            text = v_match.group(2).strip()
        else:
            # Try "Speaker Name: text" format
            colon_match = re.match(r'^([A-Z][^:]{1,40}):\s+(.+)', line)
            if colon_match:
                speaker = colon_match.group(1).strip()
                text = colon_match.group(2).strip()
            else:
                # Continuation line — same speaker
                speaker = current_speaker
                text = line

        # Collapse consecutive lines from same speaker
        if speaker == current_speaker:
            current_text.append(text)
        else:
            if current_speaker and current_text:
                result.append(f"{current_speaker}: {' '.join(current_text)}")
            current_speaker = speaker
            current_text = [text] if text else []

    # Flush last speaker
    if current_speaker and current_text:
        result.append(f"{current_speaker}: {' '.join(current_text)}")

    return "\n\n".join(result)
```

### Component 4: Claude API call

```python
def analyze_with_claude(transcript: str, account: str, date: str, model: str) -> str:
    """Send transcript to Claude for debrief analysis."""
    from anthropic import Anthropic

    # Load credentials from env (set by _load_env_file from ~/.claude-litellm.env)
    api_key = os.environ.get("ANTHROPIC_AUTH_TOKEN") or os.environ.get("LITELLM_KEY")
    base_url = os.environ.get("ANTHROPIC_BASE_URL", "https://llm.atko.ai")

    if not api_key:
        print("Error: ANTHROPIC_AUTH_TOKEN or LITELLM_KEY required.", file=sys.stderr)
        sys.exit(1)

    client = Anthropic(api_key=api_key, base_url=base_url)

    # Load system prompt
    system_prompt = ""
    if PROMPT_FILE.exists():
        system_prompt = PROMPT_FILE.read_text()
    else:
        system_prompt = "You are a Sales Engineer analyzing a call transcript. Produce a structured debrief."

    user_msg = f"""## Account: {account}
## Call Date: {date}

---

## Transcript

{transcript}"""

    print(f"Analyzing with {model}...", file=sys.stderr)
    response = client.messages.create(
        model=model,
        max_tokens=8000,
        system=system_prompt,
        messages=[{"role": "user", "content": user_msg}],
    )

    result = response.content[0].text
    usage = response.usage
    print(
        f"Tokens — input: {usage.input_tokens:,}, output: {usage.output_tokens:,}",
        file=sys.stderr,
    )
    return result
```

### Component 5: Obsidian output + account brief integration

```python
def slugify(name: str) -> str:
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')


def write_debrief(account: str, date: str, content: str) -> Path:
    """Write debrief to Obsidian call-debriefs folder."""
    slug = slugify(account)
    OBSIDIAN_DEBRIEFS.mkdir(parents=True, exist_ok=True)
    out_path = OBSIDIAN_DEBRIEFS / f"{slug}-{date}.md"

    frontmatter = f"""---
date: {date}
tags:
  - call-debrief
  - {slug}
source: claude-code
project: se-accounts
account: {account}
---

> Related: [[accounts/{slug}]] [[call-debrief-index]]

"""
    out_path.write_text(frontmatter + content)
    return out_path


def integrate_with_account_brief(account: str, date: str, content: str):
    """Append a Call Log entry to the existing account-research brief."""
    slug = slugify(account)

    # Find existing account brief
    if not OBSIDIAN_ACCOUNTS.is_dir():
        print("  No accounts directory found, skipping integration.", file=sys.stderr)
        return

    brief_path = None
    for f in sorted(OBSIDIAN_ACCOUNTS.iterdir(), reverse=True):
        if f.name.startswith(slug) and f.suffix == ".md":
            brief_path = f
            break

    if not brief_path:
        print(f"  No existing brief for {account}, skipping integration.", file=sys.stderr)
        return

    brief_text = brief_path.read_text()

    # Extract a short summary from the debrief (first few lines of Executive Summary)
    exec_match = re.search(r'## Executive Summary\s*\n(.+?)(?=\n##|\Z)', content, re.DOTALL)
    summary = exec_match.group(1).strip()[:200] if exec_match else "See full debrief."

    # Extract participants
    participants_match = re.search(r'Participants:\s*(.+)', content)
    participants = participants_match.group(1).strip() if participants_match else "See debrief"

    # Extract action items (first 3)
    actions = re.findall(r'- \[[ x]\] (.+?)(?:\n|$)', content)
    next_steps = "; ".join(actions[:3]) if actions else "See debrief"

    # Build the Call Log entry
    entry = f"""
### {date} — Call Debrief
- **Participants:** {participants}
- **Key findings:** {summary}
- **Next steps:** {next_steps}
- **Debrief:** [[call-debriefs/{slug}-{date}]]
"""

    # Append to existing Call Log section, or create one
    if "## Call Log" in brief_text:
        # Insert after the ## Call Log header
        brief_text = brief_text.replace("## Call Log", f"## Call Log\n{entry}", 1)
    else:
        # Append new section at the end
        brief_text = brief_text.rstrip() + f"\n\n## Call Log\n{entry}"

    brief_path.write_text(brief_text)
    print(f"  → Integrated with: {brief_path}", file=sys.stderr)
```

### Component 6: CLI + main

```python
def parse_args():
    parser = argparse.ArgumentParser(
        description="SE call transcript analysis → structured debrief"
    )
    parser.add_argument("transcript", help="Path to VTT or TXT transcript file")
    parser.add_argument("--account", "-a", required=True, help="Account name")
    parser.add_argument("--date", "-d", default=None, help="Call date (YYYY-MM-DD, default today)")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="Claude model")
    args = parser.parse_args()
    if not args.date:
        args.date = datetime.now().strftime("%Y-%m-%d")
    return args


def main():
    args = parse_args()

    # 1. Read transcript
    transcript_path = Path(args.transcript).expanduser().resolve()
    if not transcript_path.exists():
        print(f"Error: File not found: {transcript_path}", file=sys.stderr)
        sys.exit(1)

    print(f"Reading: {transcript_path}", file=sys.stderr)
    raw = transcript_path.read_text()

    # 2. Parse VTT if applicable
    if transcript_path.suffix.lower() == ".vtt":
        print("Parsing VTT format...", file=sys.stderr)
        transcript = parse_vtt(raw)
        print(f"  → {len(transcript.splitlines())} speaker segments", file=sys.stderr)
    else:
        transcript = raw

    # 3. Analyze with Claude
    debrief = analyze_with_claude(transcript, args.account, args.date, args.model)

    # 4. Write debrief to Obsidian
    out_path = write_debrief(args.account, args.date, debrief)
    print(f"\nDebrief saved: {out_path}", file=sys.stderr)

    # 5. Integrate with account brief
    integrate_with_account_brief(args.account, args.date, debrief)

    # 6. Print path to stdout (for skill dispatch to capture)
    print(str(out_path))


if __name__ == "__main__":
    main()
```

**Step 2: Verify syntax**

```bash
python3 -c "
import ast, os
with open(os.path.expanduser('~/.claude/skills/analyze-transcript/scripts/analyze_transcript.py')) as f:
    ast.parse(f.read())
print('Syntax OK')
"
```

**Step 3: Verify --help**

```bash
python3 ~/.claude/skills/analyze-transcript/scripts/analyze_transcript.py --help
```

Expected: Shows usage with `transcript` positional, `--account`, `--date`, `--model` flags.

---

## Task 4: Write the SKILL.md

**Files:**
- Create: `~/.claude/skills/analyze-transcript/SKILL.md`

**Step 1: Write SKILL.md**

```markdown
---
name: analyze-transcript
description: "SE call debrief from VTT/TXT transcripts. Identifies speakers, produces structured debriefs with discovery findings, competitive signals, relationship mapping, action items, and discovery quality scoring. Integrates with existing account-research briefs by appending Call Log entries. Use when the user asks to analyze a transcript, debrief a call, review a meeting recording, or extract insights from a conversation. Triggers on: 'analyze transcript', 'debrief this call', 'analyze call', 'what happened in this call', 'review this meeting', or any request combining a file path (.vtt/.txt) with analysis, debrief, or call review intent."
---

# Analyze Transcript

Produce SE call debriefs from VTT/TXT transcripts and integrate with account-research briefs.

## How It Works

The skill uses `scripts/analyze_transcript.py` to:
1. Read and preprocess the transcript (VTT speaker label parsing, timestamp stripping)
2. Send the full transcript to Claude (via Anthropic SDK through LiteLLM proxy)
3. Produce a structured debrief with discovery findings, competitive signals, relationship map, action items
4. Write to `~/Documents/ObsidianNotes/Claude-Research/call-debriefs/`
5. Append a Call Log entry to the existing account-research brief (if one exists)

## Usage

python3 <skill-path>/scripts/analyze_transcript.py /path/to/call.vtt --account "NetApp"
python3 <skill-path>/scripts/analyze_transcript.py /path/to/call.txt --account "Deel" --date 2026-03-05

Replace `<skill-path>` with: `/Users/craigverzosa/.claude/skills/analyze-transcript`

## Invocation

Parse the user's request to extract:
1. **File path** (required — the VTT or TXT transcript)
2. **Account name** (required — infer from context if user says "analyze this Deel call")
3. **Date** (optional — defaults to today)

Then dispatch:

Task tool (Bash subagent, model: "sonnet"):
  prompt: |
    Run: python3 /Users/craigverzosa/.claude/skills/analyze-transcript/scripts/analyze_transcript.py "{FILE_PATH}" --account "{ACCOUNT}" [--date "{DATE}"]
    Report the output path from stdout and any errors from stderr.

## After Running

1. Report the debrief file path
2. Summarize key findings conversationally: executive summary, top pain points, competitive signals, action items
3. Mention if the Call Log was integrated into an existing account brief
4. Note the discovery quality score
5. User can open the full debrief in Obsidian

## Output Location

- Debriefs: `~/Documents/ObsidianNotes/Claude-Research/call-debriefs/{account-slug}-{YYYY-MM-DD}.md`
- Account integration: Appends `## Call Log` entry to existing account brief

## Dependencies

- Python 3 with `anthropic` (auto-installed if missing)
- Credentials in `~/.claude-litellm.env` (ANTHROPIC_AUTH_TOKEN + ANTHROPIC_BASE_URL)
- Obsidian vault at `~/Documents/ObsidianNotes/`
```

---

## Task 5: E2E Test

Test with a sample VTT file. Create a small test transcript and verify the full pipeline.

**Files:** None (testing only)

**Step 1: Create a test VTT file**

```bash
cat > /tmp/test-call.vtt << 'ENDVTT'
WEBVTT

00:00:01.000 --> 00:00:05.000
Craig Verzosa: Hey John, thanks for joining. I wanted to follow up on our last conversation about your identity stack.

00:00:06.000 --> 00:00:12.000
John Smith: Sure Craig. So we've been looking at this more seriously since our audit finding last quarter. Our CISO is asking for a full access review.

00:00:13.000 --> 00:00:20.000
Craig Verzosa: That makes sense. Can you walk me through what you're using today for identity management?

00:00:21.000 --> 00:00:30.000
John Smith: We're primarily on Azure AD for SSO, but we have a lot of legacy apps that are still on direct LDAP. Our governance is basically manual spreadsheets.

00:00:31.000 --> 00:00:38.000
Craig Verzosa: Manual spreadsheets for access reviews? How large is your user population?

00:00:39.000 --> 00:00:45.000
John Smith: About 8,000 employees globally. And another 3,000 contractors. The contractors are the biggest headache honestly.

00:00:46.000 --> 00:00:55.000
Craig Verzosa: I hear that a lot. The contractor lifecycle is where most organizations have gaps. When a contractor project ends, how quickly does access get revoked?

00:00:56.000 --> 00:01:05.000
John Smith: Honestly? Sometimes weeks. Our HR system doesn't track contractor end dates well, so IT has to chase down managers manually.

00:01:06.000 --> 00:01:15.000
Lisa Chen: If I can jump in — I'm Lisa, I manage the IT operations team. The contractor offboarding is my team's number one pain point. We had an incident last month where a terminated contractor still had VPN access for three weeks.

00:01:16.000 --> 00:01:25.000
Craig Verzosa: That's exactly the kind of risk that identity governance solves. Have you looked at any IGA solutions yet?

00:01:26.000 --> 00:01:35.000
John Smith: We evaluated SailPoint about a year ago but it was too complex for our timeline. We need something we can deploy faster.

00:01:36.000 --> 00:01:42.000
Craig Verzosa: Understood. Let me show you how Okta Identity Governance handles this — it's designed for faster time to value than traditional IGA.
ENDVTT
```

**Step 2: Run the analyzer**

```bash
python3 ~/.claude/skills/analyze-transcript/scripts/analyze_transcript.py /tmp/test-call.vtt --account "TestCorp" --date 2026-03-07 2>&1
```

**Expected stderr:**
```
Reading: /tmp/test-call.vtt
Parsing VTT format...
  → N speaker segments
Analyzing with claude-sonnet-4-5-20250514...
Tokens — input: X, output: Y

Debrief saved: .../call-debriefs/testcorp-2026-03-07.md
  No existing brief for TestCorp, skipping integration.
```

**Expected stdout:** Path to the debrief file.

**Step 3: Verify output structure**

```bash
head -30 ~/Documents/ObsidianNotes/Claude-Research/call-debriefs/testcorp-2026-03-07.md
```

Expected: YAML frontmatter + Executive Summary + Participants table.

**Step 4: Verify section headers**

```bash
grep "^## " ~/Documents/ObsidianNotes/Claude-Research/call-debriefs/testcorp-2026-03-07.md
```

Expected: Executive Summary, Participants & Roles, Discovery Findings, Competitive Signals, Relationship Map, Action Items, Discovery Quality Assessment, Key Quotes.

**Step 5: Test account integration (with existing Deel brief)**

```bash
python3 ~/.claude/skills/analyze-transcript/scripts/analyze_transcript.py /tmp/test-call.vtt --account "Deel" --date 2026-03-07 2>&1
```

Expected stderr includes: `→ Integrated with: .../accounts/deel-2026-03.md`

Then verify:
```bash
grep -A 5 "## Call Log" ~/Documents/ObsidianNotes/Claude-Research/accounts/deel-2026-03.md
```

Expected: A new `## Call Log` section with the debrief entry and wiki-link.

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | Directory scaffold | Create dirs |
| 2 | Debrief prompt | `references/debrief-prompt.md` |
| 3 | Complete script | `scripts/analyze_transcript.py` (~400 lines) |
| 4 | SKILL.md | `SKILL.md` |
| 5 | E2E test | Create test VTT, verify full pipeline |

The skill lives in `~/.claude/skills/analyze-transcript/` (not in the Pyramid repo). No git tracking for the skill itself.
