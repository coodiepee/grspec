.PHONY: all install build clean lint typecheck test test-watch test-coverage \
       pack link unlink publish publish-dry version-patch version-minor version-major \
       release release-patch release-minor release-major \
       dev dev-cli help

PACKAGE_NAME := $(shell node -p "require('./package.json').name")
PACKAGE_VERSION := $(shell node -p "require('./package.json').version")
# pnpm pack converts scoped names: @scope/pkg -> scope-pkg-version.tgz
TARBALL := $(shell node -p "require('./package.json').name.replace('@','').replace('/','-')")-$(PACKAGE_VERSION).tgz

all: install build test

# ─── Dependencies ────────────────────────────────────────────────────────────

install:
	pnpm install

install-frozen:
	pnpm install --frozen-lockfile

# ─── Build ───────────────────────────────────────────────────────────────────

build:
	pnpm run build

clean:
	rm -rf dist *.tgz

rebuild: clean build

# ─── Quality ─────────────────────────────────────────────────────────────────

lint:
	pnpm lint

typecheck:
	pnpm exec tsc --noEmit

check: lint typecheck

# ─── Test ────────────────────────────────────────────────────────────────────

test:
	pnpm test

test-watch:
	pnpm run test:watch

test-coverage:
	pnpm run test:coverage

# ─── Package (Local) ─────────────────────────────────────────────────────────

pack: build
	pnpm pack
	@echo "✅ Packed: $(TARBALL)"

link: build
	pnpm link --global
	@echo "✅ Linked globally: $(PACKAGE_NAME)@$(PACKAGE_VERSION)"

unlink:
	pnpm uninstall --global $(PACKAGE_NAME)
	@echo "✅ Unlinked: $(PACKAGE_NAME)"

install-local: pack
	npm install --global ./$(TARBALL)
	@echo "✅ Installed locally from tarball: $(PACKAGE_NAME)@$(PACKAGE_VERSION)"

# ─── Publish (Remote) ────────────────────────────────────────────────────────

publish-dry: build
	pnpm publish --dry-run
	@echo "✅ Dry run complete — review output above"

publish: check test build
	pnpm run check:pack-version
	npm publish --access public
	@echo "✅ Published $(PACKAGE_NAME)@$(PACKAGE_VERSION) to npm"

# ─── Versioning (via changesets) ─────────────────────────────────────────────

changeset:
	pnpm exec changeset

version:
	pnpm exec changeset version

version-patch:
	pnpm exec changeset version --bump patch

version-minor:
	pnpm exec changeset version --bump minor

version-major:
	pnpm exec changeset version --bump major

# ─── Release (bump + verify + pack) ──────────────────────────────────────────

define bump_and_pack
	@echo ""
	@echo "📦 Release flow: $(1) bump"
	@echo "─────────────────────────────────────"
	@CURRENT=$$(node -p "require('./package.json').version"); \
	echo "  Current version: $$CURRENT"
	npm version $(1) --no-git-tag-version
	@NEW=$$(node -p "require('./package.json').version"); \
	echo "  New version:     $$NEW"
	@echo ""
	@echo "🔍 Running quality checks..."
	$(MAKE) check
	@echo ""
	@echo "🧪 Running tests..."
	$(MAKE) test
	@echo ""
	@echo "🔨 Building..."
	$(MAKE) rebuild
	@echo ""
	@echo "📦 Packing tarball..."
	pnpm pack
	@NEW=$$(node -p "require('./package.json').version"); \
	TARBALL=$$(node -p "require('./package.json').name.replace('@','').replace('/','-')")"-$$NEW.tgz"; \
	echo ""; \
	echo "✅ Release ready: $$TARBALL"; \
	echo ""; \
	echo "  Next steps:"; \
	echo "    git add -A && git commit -m \"release: v$$NEW\""; \
	echo "    git tag v$$NEW"; \
	echo "    npm publish --access public"
endef

release: release-patch

release-patch:
	$(call bump_and_pack,patch)

release-minor:
	$(call bump_and_pack,minor)

release-major:
	$(call bump_and_pack,major)

# ─── Development ─────────────────────────────────────────────────────────────

dev:
	pnpm run dev

dev-cli:
	pnpm run dev:cli

# ─── Help ────────────────────────────────────────────────────────────────────

help:
	@echo ""
	@echo "  $(PACKAGE_NAME) v$(PACKAGE_VERSION) — Makefile targets"
	@echo ""
	@echo "  Dependencies:"
	@echo "    install          Install dependencies"
	@echo "    install-frozen   Install with lockfile (CI)"
	@echo ""
	@echo "  Build:"
	@echo "    build            Compile TypeScript"
	@echo "    clean            Remove dist/ and tarballs"
	@echo "    rebuild          Clean + build"
	@echo ""
	@echo "  Quality:"
	@echo "    lint             Run ESLint"
	@echo "    typecheck        Run tsc --noEmit"
	@echo "    check            lint + typecheck"
	@echo ""
	@echo "  Test:"
	@echo "    test             Run tests once"
	@echo "    test-watch       Run tests in watch mode"
	@echo "    test-coverage    Run tests with coverage"
	@echo ""
	@echo "  Local Publish:"
	@echo "    pack             Build and create .tgz tarball"
	@echo "    link             Build and pnpm link --global"
	@echo "    unlink           Remove global link"
	@echo "    install-local    Pack and install globally from tarball"
	@echo ""
	@echo "  Remote Publish:"
	@echo "    publish-dry      Dry-run publish (preview)"
	@echo "    publish          Run checks, test, build, and publish to npm"
	@echo ""
	@echo "  Versioning:"
	@echo "    changeset        Create a new changeset"
	@echo "    version          Apply pending changesets to bump version"
	@echo ""
	@echo "  Release (bump + check + test + build + pack):"
	@echo "    release          Alias for release-patch"
	@echo "    release-patch    Bump patch version and pack"
	@echo "    release-minor    Bump minor version and pack"
	@echo "    release-major    Bump major version and pack"
	@echo ""
	@echo "  Development:"
	@echo "    dev              Watch mode (tsc --watch)"
	@echo "    dev-cli          Build and run CLI"
	@echo ""
