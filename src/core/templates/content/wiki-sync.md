Apply wiki deltas from a change to the main wiki without archiving.

1. Identify the active change (from context or ask).
2. Run delta detection: compare `changes/<name>/wiki/` against `grspec/wiki/`.
3. Show preview of changes (added, modified, removed).
4. On confirmation, merge deltas, update `index.md` and `log.md`.
5. Release any page locks held by this change.
