#!/bin/bash
set -euo pipefail

sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential python3 python3-venv nodejs npm git
