#!/usr/bin/env bash
set -e
export PATH="/home/alifer/.nvm/versions/node/v20.20.2/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
cd /services/synapse/frontend
./node_modules/.bin/vite build
