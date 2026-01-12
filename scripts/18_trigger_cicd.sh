#!/bin/bash
set -euo pipefail

curl -X POST -H "Authorization: Bearer $DEPLOY_TOKEN" https://ci.example.com/job/build-and-deploy
