#!/bin/sh
# Uploads to the `brand` bucket (a Garage website bucket, https://brand.metapatrol.local).
#
#   scripts/deploy.sh site               the brand site at /, the shell preview at /shell/
#   scripts/deploy.sh assets <version>   the assets at /assets/<version>/ and /assets/latest/
#
# Expects the build output (make build; npm run build:static -w
# @metapatrol/example-angular-tailwind) and S3_ENDPOINT, AWS_ACCESS_KEY_ID,
# AWS_SECRET_ACCESS_KEY in the environment. Run by main.yml (site, on every push
# to main) and release.yml (both, for a tag).
set -eu

case "${1:-}" in
  site | assets) ;;
  *) echo "usage: deploy.sh site | assets <version>"; exit 2 ;;
esac

BUCKET="${BUCKET:-brand}"
: "${S3_ENDPOINT:?unset variable: S3_ENDPOINT}"
[ -n "${AWS_ACCESS_KEY_ID:-}" ] || { echo "ERROR: unset secret: S3_ACCESS_KEY"; exit 1; }
[ -n "${AWS_SECRET_ACCESS_KEY:-}" ] || { echo "ERROR: unset secret: S3_SECRET_KEY"; exit 1; }
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-garage}"
command -v aws >/dev/null || (apt-get update -qq && apt-get install -y -qq awscli)
s3() { aws s3 "$@" --endpoint-url "$S3_ENDPOINT" --no-verify-ssl; }

SITE=apps/preview/dist/preview/browser
SHELL_PREVIEW=examples/angular-tailwind/dist/static/browser

site() {
  [ -f "$SITE/index.html" ] || { echo "ERROR: no $SITE; run make build"; exit 1; }
  [ -f "$SHELL_PREVIEW/index.html" ] || { echo "ERROR: no $SHELL_PREVIEW; run npm run build:static -w @metapatrol/example-angular-tailwind"; exit 1; }
  # The site at the root. --delete keeps it exact; the excludes keep the asset
  # tree and the shell preview out of that. Short cache: it changes with main.
  s3 sync "$SITE/" "s3://$BUCKET/" \
    --delete --exclude "assets/*" --exclude "shell/*" \
    --cache-control "public, max-age=300"
  s3 sync "$SHELL_PREVIEW/" "s3://$BUCKET/shell/" \
    --delete --cache-control "public, max-age=300"
  echo "deployed the site and the shell preview"
}

assets() {
  VERSION="${1:?usage: deploy.sh assets <version>}"
  # Assets of a version never change once uploaded: a version that is already
  # there is left alone, so a rerun cannot alter what others use.
  if [ -n "$(s3 ls "s3://$BUCKET/assets/$VERSION/" 2>/dev/null)" ]; then
    echo "assets/$VERSION/ exists; left unchanged"
  else
    for dir in mark wordmark lockup app construction; do
      s3 sync "packages/brand/$dir/" "s3://$BUCKET/assets/$VERSION/$dir/" \
        --cache-control "public, max-age=31536000, immutable"
    done
    s3 cp packages/brand/LICENSE.md "s3://$BUCKET/assets/$VERSION/LICENSE.md"
  fi
  # latest follows every release; for places that should update themselves.
  for dir in mark wordmark lockup app construction; do
    s3 sync "packages/brand/$dir/" "s3://$BUCKET/assets/latest/$dir/" \
      --delete --cache-control "public, max-age=300"
  done
  s3 cp packages/brand/LICENSE.md "s3://$BUCKET/assets/latest/LICENSE.md"
  echo "deployed assets $VERSION"
}

case "${1:-}" in
  site) site ;;
  assets) shift; assets "$@" ;;
  *) echo "usage: deploy.sh site | assets <version>"; exit 2 ;;
esac
