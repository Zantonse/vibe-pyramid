# Analyze Transcript Skill Design

**Date:** 2026-03-07
**Status:** Approved
**Pattern:** Single Python script, Claude via Anthropic SDK, Obsidian output + account brief integration

## Purpose

An SE call debrief skill that takes a VTT or TXT transcript, identifies speakers, analyzes the conversation with Claude, and produces a structured debrief document in Obsidian. Integrates with existing account-research briefs by appending a Call Log entry with key findings and wiki-links.

## Architecture: Single-Pass Script

`analyze_transcript.py` (~400-500 lines) in `~/.claude/skills/analyze-transcript/scripts/`.

Single-pass: preprocess VTT → send full transcript to Claude in one API call → write Obsidian output → integrate with account brief.

## CLI Interface

```bash
python3 analyze_transcript.py /path/to/call.vtt --account "NetApp"
python3 analyze_transcript.py /path/to/call.txt --account "Deel" --date 2026-03-05
python3 analyze_transcript.py ~/Downloads/zoom.vtt --account "Five9" --model claude-sonnet-4-5-20250514
```

| Flag | Required | Default | Purpose |
|------|----------|---------|---------|
| positional | yes | — | Path to VTT or TXT transcript file |
| `--account` / `-a` | yes | — | Account name (for output naming + brief integration) |
| `--date` / `-d` | no | today | Call date (YYYY-MM-DD) |
| `--model` | no | claude-sonnet-4-5-20250514 | Claude model for analysis |

## Input Handling

### VTT Preprocessing

If the file is `.vtt`:
1. Strip the `WEBVTT` header and metadata lines
2. Strip timestamp lines (`00:00:00.000 --> 00:00:05.000`)
3. Parse speaker labels — support both formats:
   - W3C format: `<v Speaker Name>text</v>`
   - Common format: `Speaker Name: text`
4. Collapse consecutive lines from the same speaker into paragraphs
5. Output clean `Speaker Name: text` format

### TXT Handling

If `.txt`, send as-is — assumed to be readable conversation text.

## LLM: Claude via Anthropic SDK

```python
from anthropic import Anthropic
client = Anthropic()  # reads ANTHROPIC_API_KEY from env
```

**Credential loading order:**
1. Check `ANTHROPIC_API_KEY` in environment
2. Fall back to `~/.claude-litellm.env` (parse for ANTHROPIC_API_KEY)
3. Error if neither found

**Model:** `claude-sonnet-4-5-20250514` (default). Good quality/cost balance for transcript analysis. Overridable via `--model`.

**Auto-install:** `anthropic` package auto-installed if missing (same pattern as other skills).

## Debrief Output Structure

Written to: `~/Documents/ObsidianNotes/Claude-Research/call-debriefs/{account-slug}-{YYYY-MM-DD}.md`

```markdown
---
date: {date}
tags:
  - call-debrief
  - {account-slug}
source: claude-code
project: se-accounts
account: {account-name}
---

> Related: [[accounts/{account-slug}-*]] [[call-debrief-index]]

# {Account} — Call Debrief

> Date: {date} | Duration: ~{estimated} | Participants: {speaker list}

## Executive Summary
3-4 sentences: what the call was about, outcome, next steps.

## Participants & Roles
| Speaker | Inferred Role | Key Signals |
|---------|--------------|-------------|
| John Smith | CISO | Decision maker, concerned about compliance |
| Craig Verzosa | SE (Okta) | Led technical discussion |

## Discovery Findings

### Pain Points Uncovered
- **Pain point** — who raised it, exact quote, business impact

### Business Goals Identified
- Goals inferred from conversation with supporting evidence

### Technical Environment Signals
- Tools, vendors, infrastructure mentioned
- Current IAM/security stack signals

## Competitive Signals
- Competitor mentions, comparisons, existing vendor relationships
- Displacement opportunities or risks

## Relationship Map
- Champion signals (who's advocating)
- Blocker signals (who pushed back, on what)
- Decision-maker signals (who has authority)

## Action Items & Next Steps
- [ ] Specific follow-ups with owners and deadlines
- [ ] Technical proof points to send
- [ ] Internal actions (update Salesforce, loop in specialists)

## Discovery Quality Assessment
- **Questions asked:** Key discovery questions that were asked
- **Gaps:** Questions that should have been asked but weren't
- **Talk/listen balance:** Was the SE talking too much or listening well?
- **Score:** 1-10 with rationale

## Key Quotes
Verbatim quotes worth remembering for proposals, follow-ups, or internal alignment.
```

## Account Brief Integration

After writing the debrief, the script checks for an existing account-research brief at:
`~/Documents/ObsidianNotes/Claude-Research/accounts/{account-slug}-*.md`

If found, appends to `## Call Log` section (creates if missing):

```markdown
## Call Log

### {YYYY-MM-DD} — {call type inferred from content}
- **Participants:** {speaker list with roles}
- **Key findings:** {2-3 sentence summary}
- **Next steps:** {top action items}
- **Debrief:** [[call-debriefs/{account-slug}-{date}]]
```

Previous Call Log entries are preserved. If no account brief exists, the standalone debrief is still written — no error.

## SKILL.md Dispatch

**Trigger phrases:** "analyze this transcript", "debrief this call", "analyze call with [account]", "what happened in this call", any request combining a file path (.vtt/.txt) with analysis/debrief intent.

Parse user request for:
1. **File path** (required)
2. **Account name** (required — infer from conversation context)
3. **Date** (optional)

Dispatch via Bash subagent:
```
python3 /Users/craigverzosa/.claude/skills/analyze-transcript/scripts/analyze_transcript.py "{FILE_PATH}" --account "{ACCOUNT}" [--date "{DATE}"]
```

## Prompt Reference File

`references/debrief-prompt.md` — system prompt for Claude with the debrief template, SE-specific analysis guidelines, speaker identification instructions.

## Output Locations

- Debriefs: `~/Documents/ObsidianNotes/Claude-Research/call-debriefs/{account-slug}-{YYYY-MM-DD}.md`
- Account brief integration: `~/Documents/ObsidianNotes/Claude-Research/accounts/{account-slug}-*.md` (append Call Log entry)

## Dependencies

- Python 3 with `anthropic` (auto-installed if missing)
- `ANTHROPIC_API_KEY` in env or `~/.claude-litellm.env`
- Obsidian vault at `~/Documents/ObsidianNotes/`

## Key Design Decisions

1. **Claude over Gemini** — better structured analysis quality on long-form conversation text; Anthropic SDK's prompt caching helps with cost
2. **Single-pass over chunked** — Claude's 200K context handles even long transcripts. No chunking complexity needed.
3. **Speaker identification** — parse VTT labels, essential for relationship mapping and attribution
4. **Account brief integration** — Call Log section with wiki-links connects debriefs to account research. Builds institutional memory.
5. **Standalone debrief file** — not embedded in the account brief. Keeps debriefs as first-class documents you can reference independently.
