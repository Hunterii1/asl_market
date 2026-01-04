#!/bin/bash

echo "========================================"
echo "Seeding Sliders from Assets Folder"
echo "========================================"
echo ""

cd "$(dirname "$0")/.."

go run scripts/seed_sliders_from_assets.go

echo ""
echo "========================================"
echo "Done!"
echo "========================================"
