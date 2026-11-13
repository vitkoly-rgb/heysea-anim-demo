#!/bin/sh
# Статична збірка демо для GitHub Pages / будь-якого хостингу без PHP.
# docs/index.html — усі секції; docs/<slug>.html — окрема секція.
set -e
cd "$(dirname "$0")"
PHP="${PHP:-$HOME/Library/Application Support/Local/lightning-services/php-8.2.29+0/bin/darwin-arm64/bin/php}"
rm -rf docs && mkdir -p docs
cp -R assets vendor docs/
NOINDEX='<meta name="robots" content="noindex, nofollow">'
render() { "$PHP" -r '$_GET=[]; if ($argv[1] !== "") $_GET["only"]=$argv[1]; chdir(getcwd()); include "index.php";' "$1"; }
render "" | sed "s#<meta charset=\"utf-8\">#<meta charset=\"utf-8\">\n$NOINDEX#" > docs/index.html
for f in partials/*.php; do
  slug=$(basename "$f" .php | sed 's/^[0-9]*-//')
  render "$slug" \
    | sed "s#<meta charset=\"utf-8\">#<meta charset=\"utf-8\">\n$NOINDEX#" \
    | sed -E 's#href="\#([a-z0-9-]+)"#href="\1.html"#g' \
    | sed 's#<strong>HeySea · demos</strong>#<a href="index.html"><strong>HeySea · demos</strong></a>#' > "docs/$slug.html"
done
printf 'User-agent: *\nDisallow: /\n' > docs/robots.txt
touch docs/.nojekyll
echo "built: $(ls docs/*.html | wc -l | tr -d ' ') pages, $(du -sh docs | cut -f1)"
