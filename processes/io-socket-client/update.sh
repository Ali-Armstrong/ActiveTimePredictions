#!/usr/bin/env bash
echo "Updating Client Module...."

if node updater.js
then
    echo "updating node_modules...."
    npm i
    echo "node_modules updated"
fi

date