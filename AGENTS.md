# Working on @brignano/design

Read `DESIGN.md` (the rules) and `DECISIONS.md` (why) before changing a token.
Before every commit: `npm run check`.

## How to release

Only when Anthony says "publish X" explicitly. An npm version can never be
reused.

1. Write `releases/v<version>.md` and merge it to `main`. Its contents become
   the GitHub release body verbatim.
2. Run the **Release** workflow (`.github/workflows/release.yml`) with
   `version` (no leading `v`) and `prerelease` (publishes to the `next` npm
   tag). It checks the tag, release and npm version don't exist, creates the
   release, and dispatches `publish.yml`.
3. Verify the Publish run and `npm view @brignano/design version`.

`publish.yml` must keep its filename: npm trusted publishing is configured for
it by name. Pushing a `v*` tag by hand still publishes, as before; a dispatched
publish takes the version from the tag, so no version-bump commit is needed.
