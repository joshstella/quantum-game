#!/usr/bin/env bash
# chronicle/scripts/gather.sh [SINCE_DATE]
# Extract the structured timeline the chronicle is written from.
# Run from the repository root. Emits a markdown digest to stdout.
#
# Optional arg SINCE_DATE (ISO date, e.g. 2026-06-23): when supplied, emits only
# briefs that have at least one commit after that date and limits the commits
# section to the same window. Used by the closed-date incremental-run mechanism.
set -euo pipefail

BRIEFS_DIR="docs/briefs"
SINCE="${1:-}"
# A bare YYYY-MM-DD with no time component is unreliable with `git log --since`
# in some environments (it can silently match zero commits instead of
# defaulting to that date's midnight) — pin it explicitly.
if [ -n "$SINCE" ] && [[ "$SINCE" != *" "* ]]; then
  SINCE="$SINCE 00:00:00"
fi

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "Not inside a git repo." >&2; exit 1; }
[ -d "$BRIEFS_DIR" ] || { echo "No $BRIEFS_DIR — run from the repo root of a brief-workflow project." >&2; exit 1; }

echo "# Chronicle source digest"
echo
echo "Repo origin: $(git log --format='%aI · %h · %s' 2>/dev/null | tail -1)"
echo "Repo head:   $(git log -1 --format='%aI · %h · %s' 2>/dev/null)"
echo "Total commits: $(git rev-list --count HEAD 2>/dev/null || echo '?')"
if [ -n "$SINCE" ]; then
  echo "Incremental since: $SINCE  (prior eras already narrated)"
fi
echo

echo "## Briefs — ordered by git first-commit date (authoritative chronology)"
echo
tmp=$(mktemp)
for d in "$BRIEFS_DIR"/[0-9][0-9][0-9][0-9]-*/ ; do
  [ -d "$d" ] || continue
  fcd=$(git log --format='%aI' -- "$d" 2>/dev/null | tail -1)
  # In incremental mode, skip briefs with no commits after the cutoff date.
  # `-1` is git's own result limit (no external `head`) — piping a
  # potentially-multi-line producer into `head -1` under `pipefail` can make
  # the whole pipeline's exit status the producer's SIGPIPE (141) instead of
  # head's, which kills the script under `set -e`.
  if [ -n "$SINCE" ]; then
    recent=$(git log -1 --since="$SINCE" --format='%aI' -- "$d" 2>/dev/null)
    [ -n "$recent" ] || continue
  fi
  printf '%s\t%s\n' "${fcd:-0000-uncommitted}" "$d" >> "$tmp"
done
if [ -s "$tmp" ]; then
  sort "$tmp" | while IFS=$'\t' read -r fcd d; do
    slug=$(basename "$d")
    lcd=$(git log -1 --format='%aI' -- "$d" 2>/dev/null)
    cnt=$(git log --oneline -- "$d" 2>/dev/null | wc -l | tr -d ' ')
    ledger="planned"; [ -f "${d}ledger.md" ] && ledger="executed"
    dep=$(grep -m1 -oE 'Depends on:[^<]*' "${d}brief.md" 2>/dev/null \
          | sed 's/Depends on://; s/\*//g; s/^[[:space:]]*//; s/[[:space:]]*$//')
    echo "- ${slug}"
    echo "    first ${fcd}  ·  last ${lcd}  ·  ${cnt} commits  ·  ${ledger}  ·  depends-on: ${dep:-—}"
    if [ -f "${d}ledger.md" ]; then
      awk '/^## [Bb]ig decisions/{f=1;next} /^## /{f=0} f&&/^### /{sub(/^### /,"");print "    fork · "$0}' "${d}ledger.md"
    fi
  done
else
  echo "- (no new briefs since $SINCE)"
fi
rm -f "$tmp"
echo

echo "## Parked / considered — docs/briefs/_drafts"
if [ -d "$BRIEFS_DIR/_drafts" ]; then
  found=no
  for f in "$BRIEFS_DIR/_drafts"/*.md ; do
    [ -e "$f" ] || continue
    base=$(basename "$f"); [ "$base" = "README.md" ] && continue
    # In incremental mode, only surface drafts touched after the cutoff.
    if [ -n "$SINCE" ]; then
      recent=$(git log -1 --since="$SINCE" --format='%aI' -- "$f" 2>/dev/null)
      [ -n "$recent" ] || continue
    fi
    echo "- ${base}: $(grep -m1 '^# ' "$f" 2>/dev/null | sed 's/^# //')"
    found=yes
  done
  [ "$found" = no ] && echo "- (none since ${SINCE:-ever})"
else
  echo "- (no _drafts directory)"
fi
echo

echo "## Commits referencing a brief serial"
# An array, not a plain string + unquoted expansion — SINCE now contains a
# space ("YYYY-MM-DD 00:00:00"), and word-splitting that string would hand
# git a bogus second argument.
since_args=()
[ -n "$SINCE" ] && since_args=(--since="$SINCE")
# `|| true` on the grep stage keeps `head -60` truncating a large match set
# from being misread as "no matches" under pipefail (see the fcd/recent fix
# above for the same class of bug).
matches=$(git log "${since_args[@]}" --format='%aI · %h · %s' 2>/dev/null | { grep -E '#[0-9]{3,4}' || true; } | head -60)
if [ -n "$matches" ]; then echo "$matches"; else echo "(none found)"; fi
