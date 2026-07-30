#!/usr/bin/env bash
#
# html-guard.sh — PostToolUse guard for NSArticles.
#
# Enforces two hard site rules from CLAUDE.md / memory:
#   1. No em dash (U+2014) in article content or any user-facing text.
#   2. No emojis anywhere in HTML content.
#
# It inspects ONLY the text the tool just wrote (Write content / Edit
# new_string), never the whole file. The repo predates both rules and still
# carries ~180 legacy em dashes; scanning whole files would fire on every
# edit and train everyone to ignore the hook.
#
# Exit 2 feeds the report back to Claude as actionable feedback.

set -uo pipefail

payload=$(cat)

file=$(printf '%s' "$payload" | jq -r '.tool_input.file_path // .tool_response.filePath // empty' 2>/dev/null)
case "$file" in
  *.html) ;;
  *) exit 0 ;;
esac

# Concatenate every "newly written" field the tool may carry.
added=$(printf '%s' "$payload" | jq -r '
  [ .tool_input.content?,
    .tool_input.new_string?,
    ( .tool_input.edits? // [] | .[].new_string? )
  ]
  | map(select(. != null and . != ""))
  | join("\n")
' 2>/dev/null)

[ -n "$added" ] || exit 0

report=$(printf '%s' "$added" | perl -CSD -e '
  # Emoji ranges, written on one line on purpose: under /x Perl still treats
  # whitespace inside a character class as matchable, so a pretty-printed
  # class would match every space in the file.
  # Deliberately excludes the symbols this site uses as typography: arrows
  # (2190-21FF), the middot, box drawing, and the check/cross dingbats
  # (2713-271A).
  my $EMOJI = qr/[\x{1F000}-\x{1FAFF}\x{2600}-\x{26FF}\x{2700}-\x{2712}\x{271B}-\x{27BF}\x{23E9}-\x{23FA}\x{2B1B}\x{2B1C}\x{2B50}\x{2B55}\x{FE0F}\x{20E3}]/;

  my (@dash, @emoji);
  while (my $line = <STDIN>) {
    chomp $line;
    while ($line =~ /(.{0,32})\x{2014}(.{0,32})/g) {
      push @dash, "$1<<\x{2014}>>$2" if @dash < 10;
    }
    while ($line =~ /(.{0,24})($EMOJI)(.{0,24})/g) {
      push @emoji, sprintf("U+%04X %s  in: %s[%s]%s", ord($2), $2, $1, $2, $3)
        if @emoji < 10;
    }
  }

  if (@dash) {
    print "EM DASH \x{2014} is banned in user-facing text.\n";
    print "  $_\n" for @dash;
    print "  Fix: restructure the sentence, or use a comma or a period.\n";
  }
  if (@emoji) {
    print "EMOJI is banned in HTML content.\n";
    print "  $_\n" for @emoji;
    print "  Fix: remove it. Use an SVG icon if a visual marker is needed.\n";
  }
')

if [ -n "$report" ]; then
  printf 'html-guard blocked a site-rule violation in %s\n%s' "$file" "$report" >&2
  exit 2
fi

exit 0
