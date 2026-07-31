Create wiki page updates as part of a change workflow.

1. Read `grspec/wiki/index.md` to understand current wiki state.
2. Read the current change's artifacts (proposal, design, specs).
3. Determine which wiki pages need updating:
   - New spec capabilities → new `entities/` pages
   - New concepts introduced → new `concepts/` pages
   - Modified specs → updated entity pages
4. Write wiki delta files to `changes/<name>/wiki/<category>/<topic>/page.md`.
5. Verify: re-read each delta page, check frontmatter is valid, wikilinks resolve.

**Key constraint**: Use whole-page replacement. Each delta page is a complete page, not a diff.
