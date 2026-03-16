#!/bin/bash
#
# Quick Status Checker for Climate Data Fetching
#
# Run this in a separate terminal to check if the script is running

echo "=============================================="
echo "Climate Data Fetch Status Check"
echo "=============================================="
echo ""

# Check if Python process is running
echo "1. Checking for running processes..."
RUNNING=$(ps aux | grep -E "(run_mini_batch|fetch_climate_data)" | grep -v grep | grep python)
if [ -n "$RUNNING" ]; then
    echo "   ✓ Script IS RUNNING:"
    echo "$RUNNING" | awk '{print "     PID:", $2, "| Command:", $11, $12, $13}'
else
    echo "   ✗ No script currently running"
fi
echo ""

# Check recent file updates
echo "2. Recent file updates (last modified)..."
DATA_DIR="$(dirname "$0")/.."
if ls "$DATA_DIR"/climate_*.csv >/dev/null 2>&1; then
    LATEST=$(ls -t "$DATA_DIR"/climate_*.csv 2>/dev/null | head -1)
    if [ -n "$LATEST" ]; then
        MODIFIED=$(stat -c '%y' "$LATEST" 2>/dev/null || stat -f '%Sm' "$LATEST" 2>/dev/null)
        echo "   Latest CSV: $(basename "$LATEST")"
        echo "   Modified: $MODIFIED"
    fi
else
    echo "   No output files found yet"
fi
echo ""

# Check progress from index
echo "3. Progress summary..."
INDEX_FILE="$DATA_DIR/city_index_worldcities_top500.json"
if [ -f "$INDEX_FILE" ]; then
    python3 "$(dirname "$0")/run_mini_batch.py" --status 2>/dev/null
else
    echo "   No index file found yet (run the script first)"
fi

echo ""
echo "=============================================="
echo "To monitor continuously, run:"
echo "  watch -n 5 ./check_status.sh"
echo "=============================================="
