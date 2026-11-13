#!/bin/sh
# Демо: http://localhost:8790  (PHP з Local by Flywheel, бо системний php зламаний)
PHP="$HOME/Library/Application Support/Local/lightning-services/php-8.2.29+0/bin/darwin-arm64/bin/php"
cd "$(dirname "$0")" && exec "$PHP" -S localhost:8790
