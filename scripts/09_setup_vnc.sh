#!/bin/bash
set -euo pipefail

sudo apt update
sudo apt install -y remmina remmina-plugin-vnc
sudo apt install -y tigervnc-standalone-server

echo "Configure VNC password and xstartup in ~/.vnc/xstartup"
