# Release notes

**Status:** No production release.  
**Related:** [ADR 0007](../architecture/adr/0007-hosting-platform.md), [deployment guide](../deployment.md), [CI evidence](ci-evidence.md)

This file is the place for a release. It is not a release. No tag has been deployed to Render, and no production URL exists. Do not add a fake version here to satisfy the handover checklist.

## When a release is real

A release note may be added only after all of these are true:

1. Git tag exists, and the tag name is recorded below.
2. GHCR has `brewlite-web` and `brewlite-api` images whose tag is that commit SHA.
3. Render is running those images.
4. `GET /api/v1/health` on the public API URL returns `200` with `{ "status": "ok", "version": "v1" }`.
5. The README URLs are the same URLs that were just checked.

## Unreleased

Nothing is listed. The next note should use this shape:

```text
## <tag> — <date>

- Commit SHA:
- Web image:
- API image:
- Web URL:
- API URL:
- Health URL:
- Migration: succeeded or failed
- Rollback tag, if this release was rolled back:
- What changed:
```

## Rollback

Rollback is not a second release note that pretends the bad release did not happen. Record the SHA that was redeployed, who did it, and whether the database migration was backward compatible. A migration that already ran is not undone by deploying an older image. See [deployment.md](../deployment.md) §12.
