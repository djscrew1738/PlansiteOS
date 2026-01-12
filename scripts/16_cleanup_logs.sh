#!/bin/bash
set -euo pipefail

find /var/log/plansiteos -type f -mtime +30 -delete
find /tmp/plansiteos -type f -mtime +7 -delete
