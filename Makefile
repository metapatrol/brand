# metapatrol brand — every command this repository has.
#
# The targets wrap the npm workspace scripts, so `make ci` here and the CI
# workflows (which call the same targets) cannot drift apart. `make` alone
# lists them.

# Angular 22 (examples, preview) needs one of these; the libraries alone would
# run on older Node, but a partial toolchain is not worth supporting.
NODE_RANGE := ^22.22.3 || ^24.15.0 || >=26.0.0

# Tool versions, the one place CI and local runs read them from.
GITLEAKS_VERSION ?= v8.30.1

WORKSPACES_LIB := @metapatrol/tokens @metapatrol/style @metapatrol/brand-kit @metapatrol/brand @metapatrol/ng
PREVIEW_OUT := apps/preview/dist/preview/browser

.DEFAULT_GOAL := help
.PHONY: help node-check install check build build-packages assets assets-check preview start-preview \
        examples shell-preview start-angular start-react test ci parity tokens-preview set-version \
        secret-scan secret-scan-history clean distclean

help: ## List the targets
	@awk 'BEGIN { FS = ":.*## " } /^[a-zA-Z_-]+:.*## / { printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

node-check: ## Fail early when Node.js is too old for Angular 22
	@node -e 'const [a,b,c]=process.versions.node.split(".").map(Number); const ok=(a===22&&(b>22||(b===22&&c>=3)))||(a===24&&b>=15)||a>=26; if(!ok){console.error("Node.js "+process.version+" is too old: need $(NODE_RANGE) (nvm use reads .nvmrc)");process.exit(1)}'

install: node-check ## Install all workspaces from the lockfile (npm ci)
	npm ci

check: ## Resolve the tokens and check every contrast rule
	npm run check

build: node-check ## Build everything: packages, assets, examples, preview
	npm run build

build-packages: ## Build only the five published packages (and regenerate the assets)
	@for w in $(WORKSPACES_LIB); do npm run build -w $$w || exit 1; done

assets: ## Regenerate packages/brand from the construction and the tokens
	npm run build -w @metapatrol/tokens
	npm run build -w @metapatrol/brand-kit
	npm run build -w @metapatrol/brand

# The assets are committed so they can be reviewed; the build is
# byte-reproducible, so any difference means they were not regenerated.
assets-check: ## Fail if packages/brand differs from what the generator writes
	@if [ -n "$$(git status --porcelain -- packages/brand)" ]; then \
	  git status --short -- packages/brand; \
	  echo "packages/brand is out of date: run 'make assets' and commit the result"; \
	  exit 1; \
	fi

preview: node-check ## Build the brand site into apps/preview/dist/preview/browser
	npm run build -w @metapatrol/preview
	@echo "static site: $(PREVIEW_OUT)"

start-preview: node-check ## Serve the brand site with live reload
	npm start -w @metapatrol/preview

examples: node-check ## Build both integration examples
	npm run build -w @metapatrol/example-angular-tailwind
	npm run build -w @metapatrol/example-react-tailwind

shell-preview: node-check ## The Angular example as a static site (hash routing, relative base) for /shell/
	npm run build:static -w @metapatrol/example-angular-tailwind
	@echo "static shell preview: examples/angular-tailwind/dist/static/browser"

start-angular: node-check ## Serve the Angular + Tailwind example
	npm start -w @metapatrol/example-angular-tailwind

start-react: ## Serve the React + Vite + Tailwind example
	npm start -w @metapatrol/example-react-tailwind

test: ## Run the tests of every workspace (needs a build first)
	npm test

ci: secret-scan install check build assets-check test ## Everything CI runs, in the same order

parity: ## Compare the generated assets with a reference tree: make parity REF=dir
	@test -n "$(REF)" || (echo "usage: make parity REF=<asset directory>" && exit 1)
	npm run parity -w @metapatrol/brand-kit -- $(abspath $(REF))

tokens-preview: ## Regenerate packages/tokens/preview/tokens.css (open index.html next to it)
	npm run preview -w @metapatrol/tokens

# Versions come from semantic-release on main (.releaserc.json); this is what
# it runs, exposed for a dry run on a scratch copy.
set-version: ## Set one version on all published packages: make set-version VERSION=x.y.z
	@test -n "$(VERSION)" || (echo "usage: make set-version VERSION=<semver>" && exit 1)
	node scripts/set-version.mjs $(VERSION)

bin/gitleaks:
	@mkdir -p bin
	curl -sSfL "https://github.com/gitleaks/gitleaks/releases/download/$(GITLEAKS_VERSION)/gitleaks_$(GITLEAKS_VERSION:v%=%)_linux_x64.tar.gz" \
	  | tar xz -C bin gitleaks

secret-scan: bin/gitleaks ## Scan the working tree for committed credentials (what CI runs)
	bin/gitleaks dir . --no-banner --redact

# The whole history, for an audit. Deliberately not in CI: a leak in an old
# commit would turn every run red until the history is rewritten.
secret-scan-history: bin/gitleaks ## Scan the whole git history
	bin/gitleaks git . --no-banner --redact

clean: ## Remove build output and copied assets (keeps node_modules)
	rm -rf packages/*/dist examples/*/dist apps/*/dist \
	       examples/*/.angular apps/*/.angular \
	       examples/*/public/brand apps/*/public/brand

distclean: clean ## clean, and node_modules too
	rm -rf node_modules packages/*/node_modules examples/*/node_modules apps/*/node_modules
