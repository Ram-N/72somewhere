#!/bin/bash
#
# Batch Climate Data Fetcher
#
# This script helps run the climate data fetching in 5 batches of 100 cities each
# to stay within Open-Meteo API rate limits (10,000 calls/day).
#
# Usage:
#   ./run_batch_fetch.sh [batch_number]
#
# Example:
#   ./run_batch_fetch.sh 1    # Run batch 1 (cities 0-99)
#   ./run_batch_fetch.sh 2    # Run batch 2 (cities 100-199)
#   ... and so on
#
# Each batch takes approximately 2+ hours and stays within daily rate limits.
# Run one batch per day for 5 days to process all 500 cities.

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INPUT_FILE="${INPUT_FILE:-worldcities_top500.csv}"

# Batch configuration: [start_row, end_row, batch_name]
declare -A BATCHES=(
    [1]="0 99 batch1"
    [2]="100 199 batch2"
    [3]="200 299 batch3"
    [4]="300 399 batch4"
    [5]="400 499 batch5"
)

# Print usage
usage() {
    echo "Usage: $0 [batch_number]"
    echo ""
    echo "Available batches:"
    echo "  1: Cities 0-99 (100 cities)"
    echo "  2: Cities 100-199 (100 cities)"
    echo "  3: Cities 200-299 (100 cities)"
    echo "  4: Cities 300-399 (100 cities)"
    echo "  5: Cities 400-499 (100 cities)"
    echo ""
    echo "Each batch takes ~2+ hours and uses ~7,800 API calls."
    echo "Run one batch per day to stay within rate limits."
    exit 1
}

# Check arguments
if [ $# -eq 0 ]; then
    usage
fi

BATCH_NUM=$1

# Validate batch number
if [[ ! $BATCH_NUM =~ ^[1-5]$ ]]; then
    echo "Error: Invalid batch number. Must be 1-5."
    usage
fi

# Get batch configuration
BATCH_CONFIG=${BATCHES[$BATCH_NUM]}
read -r START_ROW END_ROW BATCH_NAME <<< "$BATCH_CONFIG"

# Display info
echo "=========================================="
echo "Climate Data Fetch - Batch $BATCH_NUM"
echo "=========================================="
echo "Input file: $INPUT_FILE"
echo "Cities: $START_ROW to $END_ROW ($(($END_ROW - $START_ROW + 1)) cities)"
echo "Batch name: $BATCH_NAME"
echo "Estimated time: ~2+ hours"
echo "API calls: ~$(( ($END_ROW - $START_ROW + 1) * 78 ))"
echo ""
echo "Press Ctrl+C within 5 seconds to cancel..."
sleep 5

# Run the fetch script
cd "$SCRIPT_DIR"
python3 fetch_climate_data.py "$INPUT_FILE" \
    --start-row "$START_ROW" \
    --end-row "$END_ROW" \
    --batch-name "$BATCH_NAME"

# Success message
echo ""
echo "=========================================="
echo "Batch $BATCH_NUM complete!"
echo "=========================================="
echo "Output file: ../climate_data_top500_${BATCH_NAME}.csv"
echo "Progress file: ../climate_fetch_progress_worldcities_top500_${BATCH_NAME}.json"
echo ""
echo "Next steps:"
if [ "$BATCH_NUM" -lt 5 ]; then
    echo "  - Run batch $(($BATCH_NUM + 1)) tomorrow: ./run_batch_fetch.sh $(($BATCH_NUM + 1))"
else
    echo "  - All batches complete! Merge output files if needed."
fi
