# Account Dashboard Build Agent Design

**Date:** 2026-03-07
**Status:** Approved
**Type:** SKILL.md orchestrator (no Python script — Claude follows the playbook)

## Purpose

An agent skill that automates the full account dashboard workflow: research a company using existing skills, ingest raw materials, build a Next.js account strategy site with adaptive sections, and deploy to Vercel. This workflow was manually orchestrated in 10+ projects (NetApp, MandarinOriental, Five9, Deel, Enablement, etc.) and is the single highest-value automation.

## Architecture: SKILL.md Orchestrator

A single `SKILL.md` file (~150 lines) that instructs Claude step-by-step through four phases. No Python script — Claude itself is the agent, using its existing code-generation capabilities for the site build. The skill chains three existing skills automatically.

## Input (Adaptive)

Accepts either minimal or rich input:
- **Minimal:** Just a company name → "build dashboard for NetApp"
- **Rich:** Company name + file paths → "build dashboard for NetApp /path/to/rfp.pdf /path/to/call.vtt"
- **With context:** Company name + angle → "build dashboard for NetApp, focus on PAM displacement"

## Orchestration Phases

### Phase 1: Research (auto-chained)

1. Run `/account-research {company}` at deep depth → produces Obsidian brief
2. Check Obsidian for existing `/competitive-intel` battlecards for any competitors detected in the research → if none exist, run quick mode for top 2-3 detected competitors
3. Check Obsidian for existing `/analyze-transcript` debriefs for this account → surface call findings
4. If user provided files (PDFs, transcripts, PPTX, DOCX), read and ingest them into context
5. Synthesize all gathered intel into a structured brief for site content

### Phase 2: Plan (adaptive sections)

Based on available data, propose which sections to include:

| Section | Condition | Source |
|---------|-----------|--------|
| Account Overview | Always | account-research brief |
| Competitive Intel | Always | competitive-intel battlecards + account-research |
| Call Strategy | If call data or transcript debriefs exist | analyze-transcript debriefs + research |
| Talk Track | If pain points and competitive signals exist | account-research + competitive-intel |
| Demo Flow | If build guide or demo materials provided | User-provided PDFs/docs |
| Relationship Map | If transcript debriefs exist | analyze-transcript |
| Discovery Insights | If transcript debriefs exist | analyze-transcript |
| Deal Intelligence | If financial or deal data provided | User-provided data |

Present the proposed section list to the user for approval before building.

### Phase 3: Build

1. Create Next.js project: `npx create-next-app@latest {company}-dashboard --typescript --tailwind --app --no-eslint --no-src-dir`
2. Build each approved section as a page or tab component
3. Light mode default with dark mode toggle (per global CLAUDE.md)
4. Recharts for data visualization (charts, comparison tables)
5. Apply `/frontend-design` skill for UI polish
6. Responsive design (desktop + tablet)

### Phase 4: Deploy

1. Deploy to Vercel org `okta-solutions-engineering` (per global CLAUDE.md)
2. URL naming: `{company}-dashboard.vercel.app`
3. Report the live URL to the user
4. Push to GitHub at `github.com/Zantonse/` (per global CLAUDE.md)

## Skills Chained

| Skill | When | Purpose |
|-------|------|---------|
| `/account-research` | Always (Phase 1) | Public signals, pain points, tech stack |
| `/competitive-intel --mode quick` | If competitors detected (Phase 1) | Battlecard data for Competitive Intel section |
| `/analyze-transcript` | Not auto-run; reads existing debriefs | Call insights for Strategy/Relationship sections |
| `/frontend-design` | Phase 3 | UI polish for the built site |

## Standard Section Content Guide

### Account Overview
Company snapshot, business goals, strategic priorities, tech landscape, identity posture. Sourced from account-research brief. Presented as a clean summary with key metrics.

### Competitive Intel
Side-by-side comparison of detected competitors vs. Okta. Feature matrix, strengths/weaknesses, landmines, positioning. Sourced from competitive-intel battlecards.

### Call Strategy
Pre-call preparation: discovery questions to ask, hypotheses to validate, personas to engage, technical proof points to prepare. Adapted to the specific account's pain points.

### Talk Track
Narrative flow for conversations: opening (validate business context), bridge (connect to identity), value (specific Okta capabilities), proof (customer stories), next steps. Tailored to detected pain points and competitive landscape.

### Demo Flow
Step-by-step demo plan tied to the account's specific use cases. References Okta build guides if provided. Includes setup prerequisites and talking points per demo step.

### Relationship Map
Visual or tabular representation of key contacts: champions, blockers, decision makers, influencers. Sourced from transcript debriefs.

### Discovery Insights
Analysis of past calls: what was learned, gaps in discovery, follow-up needed. Sourced from transcript debriefs.

### Deal Intelligence
Pipeline data, timeline, budget signals, competitive dynamics. Sourced from user-provided Salesforce data or deal docs.

## Trigger Phrases

"build account dashboard for [company]", "account dashboard [company]", "prep account site for [company]", "build dashboard for [company]", "create account strategy site", or any request combining a company name with dashboard/site/account prep intent.

## Key Design Decisions

1. **SKILL.md orchestrator over Python script** — Claude's code generation is the core value; a script can't write custom React components. The skill just tells Claude what to build.
2. **Auto-chain research skills** — Eliminates the manual step of running account-research and competitive-intel separately before building. The skill does it automatically.
3. **Adaptive sections** — Not every account needs every section. Propose based on available data, get user approval, then build.
4. **Next.js default** — Consistent with Craig's larger projects. Recharts for data viz. Light mode default per CLAUDE.md.
5. **User stays in the loop** — Section approval step before building ensures the right content is included. User can add/remove sections.
