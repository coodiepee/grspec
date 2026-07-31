Check and synchronize upstream UI knowledge base data (styles, rules, CSV datasets).

**Use when** UI search/reference results seem stale or after upgrading grspec.

---

## CLI

```bash
grspec ui sync --check
grspec ui sync
```

## Agent workflow

1. Always run `--check` first; show local vs upstream version.
2. Confirm with user before full sync (overwrites local data files).
3. After sync, suggest `/grsx-ui-status` to verify.

## Related

- `/grsx-ui-search` — uses synced datasets
