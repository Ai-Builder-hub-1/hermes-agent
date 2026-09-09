#!/usr/bin/env python3
"""Inline the shared tokens/fixture/helpers into each prototype so every
output file is a single self-contained .html that opens by double-click."""
import pathlib, re, sys

root = pathlib.Path(__file__).parent
out = root / "dist"
out.mkdir(exist_ok=True)

tokens = (root / "tokens.css").read_text()
fixture = (root / "fixture.js").read_text()
common = (root / "common.js").read_text()

FILES = {
    "a.html": "variant-a-tabbed-command-center.html",
    "b.html": "variant-b-dense-grid.html",
    "c.html": "variant-c-split-comparison.html",
    "d.html": "variant-d-event-stream-console.html",
}

BANNER = """<!--
  Trading Intelligence Control Plane — design prototype
  Generated, self-contained, offline. No network calls, no build step.
  Data is a fixture matching the real contract; see docs/design/prototypes/
  trading-intelligence/README.md for what is real and what is mocked.
-->
"""

for src, dst in FILES.items():
    html = (root / "src" / src).read_text()
    for token, value in (("{{TOKENS}}", tokens), ("{{FIXTURE}}", fixture), ("{{COMMON}}", common)):
        if token not in html:
            sys.exit(f"{src}: missing placeholder {token}")
        html = html.replace(token, value)
    left = re.findall(r"\{\{[A-Z_]+\}\}", html)
    if left:
        sys.exit(f"{src}: unsubstituted {left}")
    html = html.replace("<!doctype html>\n", "<!doctype html>\n" + BANNER, 1)
    (out / dst).write_text(html)
    print(f"{dst:46} {len(html):>7,} bytes")
