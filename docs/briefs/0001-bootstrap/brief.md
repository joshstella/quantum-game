# Bootstrap: claude-process-automation install

**Serial:** #0001 · **Created:** 2026-07-21T21:15:43Z · **Author:** josh.stella@gmail.com · **Depends on:** —

## Overview

This brief records the actions taken by `install.sh` to bring this repository into
conformance with the claude-process-automation workflow.

## Settled decisions

- Skills are installed per-project (`.claude/skills/`), not globally, to enable
  per-project tuning.
- `cost-profiling` excluded from core install (requires Docker/OpenTelemetry sidecar).
- Existing files are never overwritten; the installer is idempotent.

## Open decisions

- None.

## Phases

This brief has no phases — the install is a single atomic action documented in the ledger.
