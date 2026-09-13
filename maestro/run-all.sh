#!/usr/bin/env bash
# Default: non-destructive release smoke. Legacy flows must be selected explicitly.
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
MAESTRO_BIN="${MAESTRO_BIN:-${HOME}/.maestro/bin/maestro}"
DEVICE_ID="${MAESTRO_DEVICE_ID:-}"
OUTPUT_DIR="${MAESTRO_OUTPUT_DIR:-}"
FLOWS=()

usage() {
  cat <<'HELP'
Usage: ./maestro/run-all.sh --device ID [--output-dir PATH] [FLOW.yaml ...]

Without flow arguments, only release/01-public-navigation.yaml runs.
An installed Release app, signed-out test device and runnable Maestro/Java
are required. This script never clears app state or starts a device.

Environment: MAESTRO_BIN, MAESTRO_DEVICE_ID, MAESTRO_OUTPUT_DIR, JAVA_HOME.
Legacy flows under maestro/flows include publishing and demo data. Select
them explicitly only on an isolated test environment.
HELP
}

fail() { printf 'ERROR: %s\n' "$*" >&2; exit 2; }

while (( $# )); do
  case "$1" in
    --device)
      (( $# >= 2 )) || fail '--device requires an ID.'
      DEVICE_ID="$2"; shift 2 ;;
    --output-dir)
      (( $# >= 2 )) || fail '--output-dir requires a path.'
      OUTPUT_DIR="$2"; shift 2 ;;
    --help|-h) usage; exit 0 ;;
    --) shift; FLOWS+=("$@"); break ;;
    -*) fail "Unknown option: $1" ;;
    *) FLOWS+=("$1"); shift ;;
  esac
done

[[ -n "$DEVICE_ID" ]] || fail 'Specify --device or MAESTRO_DEVICE_ID; interactive device selection is disabled.'
if (( ${#FLOWS[@]} == 0 )); then
  FLOWS=("$SCRIPT_DIR/release/01-public-navigation.yaml")
fi
for i in "${!FLOWS[@]}"; do
  flow="${FLOWS[$i]}"
  [[ -f "$flow" ]] || fail "Flow not found: $flow"
  FLOWS[$i]="$(cd -- "$(dirname -- "$flow")" && pwd)/$(basename -- "$flow")"
done

if [[ "$MAESTRO_BIN" != */* ]]; then
  MAESTRO_BIN="$(command -v "$MAESTRO_BIN")" || fail 'Maestro is not on PATH.'
fi
[[ -x "$MAESTRO_BIN" ]] || fail "Maestro executable not found: $MAESTRO_BIN"
MAESTRO_BIN="$(cd -- "$(dirname -- "$MAESTRO_BIN")" && pwd)/$(basename -- "$MAESTRO_BIN")"
if [[ -n "${JAVA_HOME:-}" ]]; then
  JAVA_CMD="$JAVA_HOME/bin/java"
else
  JAVA_CMD="$(command -v java)" || fail 'Java is not on PATH; configure JAVA_HOME.'
fi
[[ -x "$JAVA_CMD" ]] || fail 'JAVA_HOME does not point to an executable Java runtime.'
"$JAVA_CMD" -version || fail 'Java could not start.'
"$MAESTRO_BIN" --version || fail 'Maestro could not start; see its error above.'

if [[ -z "$OUTPUT_DIR" ]]; then
  OUTPUT_DIR="$(mktemp -d "${TMPDIR:-/tmp}/patio-maestro.XXXXXX")"
else
  mkdir -p -- "$OUTPUT_DIR"
  # Each invocation gets its own directory, including when CI reuses a base path.
  OUTPUT_DIR="$(mktemp -d "$OUTPUT_DIR/run.XXXXXX")"
fi
OUTPUT_DIR="$(cd -- "$OUTPUT_DIR" && pwd)"
SUMMARY="$OUTPUT_DIR/summary.tsv"
printf 'flow\tstatus\texit_code\treport\n' > "$SUMMARY"
PASSED=0
FAILED=0

for i in "${!FLOWS[@]}"; do
  flow="${FLOWS[$i]}"
  name="$(basename -- "$flow")"
  name="${name%.*}"
  case_dir="$OUTPUT_DIR/$((i + 1))-$name"
  mkdir -p -- "$case_dir/artifacts" "$case_dir/maestro/screenshots"
  report="$case_dir/report.xml"
  printf '\nRunning %s on %s\n' "$name" "$DEVICE_ID"
  # Relative screenshots from legacy flows stay inside this invocation.
  # pipefail preserves Maestro/tee errors for CI.
  if (
    cd -- "$case_dir"
    "$MAESTRO_BIN" --device "$DEVICE_ID" test "$flow" \
      --format junit --output "$report" \
      --test-output-dir "$case_dir/artifacts" --debug-output "$case_dir/artifacts" \
      -e "MAESTRO_SCREENSHOT_DIR=$case_dir/artifacts"
  ) 2>&1 | tee "$case_dir/run.log"; then
    PASSED=$((PASSED + 1))
    printf '%s\tPASS\t0\t%s\n' "$flow" "$report" >> "$SUMMARY"
  else
    status=$?
    FAILED=$((FAILED + 1))
    printf '%s\tFAIL\t%s\t%s\n' "$flow" "$status" "$report" >> "$SUMMARY"
  fi
done

printf '\nFlows passed: %s; failed: %s\nReports and logs: %s\n' "$PASSED" "$FAILED" "$OUTPUT_DIR"
(( FAILED == 0 )) || exit 1
