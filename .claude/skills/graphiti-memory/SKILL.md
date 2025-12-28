---
name: graphiti-memory
description: Knowledge graph memory system for the votive-codebase project. Use this skill when working on the Votive project to query architectural knowledge before exploring files, store meaningful discoveries or decisions, and maintain codebase understanding across sessions. Triggers include architecture questions, pattern discovery, component relationships, design decisions, and any work requiring project context.
---

# Graphiti Memory (Votive Codebase)

Knowledge graph for codebase memory. Query before exploring. Store after meaningful changes.

**Group ID**: `votive-codebase` (hardcoded for all operations)

## Core Philosophy

Enterprise-grade reliability: **consistency over speed, accuracy over volume**.

When uncertain about any Graphiti operation—STOP. Use extended thinking to rationale through the decision before proceeding.

## Operations Reference

```typescript
// Search entities (services, types, packages)
mcp__graphiti__search_nodes({
  query: "specific entity name",
  group_ids: ["votive-codebase"],
  max_nodes: 10
})

// Search relationships between components
mcp__graphiti__search_memory_facts({
  query: "component A component B relationship",
  group_ids: ["votive-codebase"],
  max_facts: 10
})

// Get recent episodes for context
mcp__graphiti__get_episodes({
  group_ids: ["votive-codebase"],
  max_episodes: 20
})

// Add new knowledge (ONLY after investigation)
mcp__graphiti__add_memory({
  name: "[Component] - [What]",
  episode_body: "Detailed description with context and rationale",
  group_id: "votive-codebase",
  source: "text",
  source_description: "codebase analysis"
})
```

## When to READ (Advisory)

Query Graphiti before file exploration when:
- Investigating architecture or component structure
- Understanding patterns or conventions
- Exploring relationships between services
- Starting work that requires project context
- Asked about "how things work" or "why" questions

## When to WRITE (After Meaningful Changes)

Add to Graphiti after:
- Adding new service/component
- Changing architecture or dependencies
- Discovering undocumented pattern
- Making design decision with rationale
- Identifying non-obvious convention

**Mandatory pre-write workflow**:
1. Search existing nodes/facts for related content
2. Check recent episodes for duplicates
3. If overlap exists → modify mental model, don't duplicate
4. If truly new → add with full context

## What to Store

✅ **Store**:
- Architectural decisions + rationale ("Chose circuit breaker because...")
- Component relationships ("PromptService depends on AssessmentDomain")
- Patterns ("Backend uses repository pattern with caching decorator")
- Domain concepts ("5-phase framework consists of...")
- Non-obvious conventions ("All domain types live in packages/types/*")
- Key file locations when non-intuitive

## What NOT to Store

❌ **Never store**:
- Code snippets or implementation details
- Temporary debugging notes
- Obvious/trivial information
- Speculative or unverified claims
- Information already well-documented in code comments

## Episode Naming Convention

Format: `[Component/Domain] - [What/Decision]`

Examples:
- `Backend API - Rate Limiting Pattern`
- `Assessment Domain - 5-Phase Framework Structure`
- `Infrastructure - Circuit Breaker Decision Rationale`
- `Monorepo - Package Dependency Rules`

## Anti-Patterns to Avoid

| Anti-Pattern | Correct Approach |
|--------------|------------------|
| Vague queries ("how does it work") | Specific terms ("assessment service validation") |
| Adding without searching first | Always search nodes + facts + episodes first |
| Storing code | Store architectural understanding of what code does |
| Episodes without rationale | Include "why" not just "what" |
| Duplicate episodes | Search, then extend existing knowledge |
| Generic episode names | Use `[Component] - [Specific Topic]` format |

## Uncertainty Protocol

When unsure whether to add/modify knowledge:

1. **STOP** - Do not proceed automatically
2. **THINK** - Use extended thinking mode
3. **RATIONALE** - Work through:
   - Is this truly new information?
   - Does it overlap with existing episodes?
   - Is it architectural knowledge or implementation detail?
   - Will future sessions benefit from this?
4. **DECIDE** - Proceed with confidence or skip

When in doubt: **don't add**. Missing knowledge can be added later; duplicate or incorrect knowledge pollutes the graph.

## Pre-loaded Knowledge

The `votive-codebase` group contains episodes covering:
- Project architecture and monorepo structure
- Domain types (assessment, analysis, prompts)
- 5-phase psychological framework
- Service layer patterns (circuit breaker, caching)
- Security implementation and configuration
- Key file locations and package relationships

Query these before exploring source files.
