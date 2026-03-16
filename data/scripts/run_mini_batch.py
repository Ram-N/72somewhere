#!/usr/bin/env python3
"""
Mini-Batch Climate Data Fetcher

Processes cities in small batches of 10 with an index tracker.
Tracks which cities are done, which are in progress, and which are next.

Usage:
    python run_mini_batch.py                    # Process next 10 cities
    python run_mini_batch.py --batch-size 5     # Process next 5 cities
    python run_mini_batch.py --status           # Show progress status
    python run_mini_batch.py --reset            # Reset index and start over
"""

import argparse
import csv
import json
import subprocess
import sys
from pathlib import Path
from datetime import datetime


class CityIndexTracker:
    """Manages the index of cities and their processing status."""

    def __init__(self, index_file: Path, cities_file: Path):
        self.index_file = index_file
        self.cities_file = cities_file
        self.index_data = self._load_or_create_index()

    def _load_or_create_index(self) -> dict:
        """Load existing index or create new one."""
        if self.index_file.exists():
            with open(self.index_file, 'r') as f:
                return json.load(f)

        # Create new index
        cities = self._load_cities()
        return {
            'created': datetime.now().isoformat(),
            'last_updated': datetime.now().isoformat(),
            'total_cities': len(cities),
            'completed_count': 0,
            'failed_count': 0,
            'cities': [
                {
                    'index': i,
                    'city_id': city['id'],
                    'city_name': city['city_ascii'],
                    'country': city['country'],
                    'status': 'pending',  # pending, processing, completed, failed
                    'completed_at': None,
                    'attempt_count': 0
                }
                for i, city in enumerate(cities)
            ]
        }

    def _load_cities(self) -> list:
        """Load cities from CSV."""
        cities = []
        with open(self.cities_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                cities.append(row)
        return cities

    def save(self):
        """Save index to file."""
        self.index_data['last_updated'] = datetime.now().isoformat()
        with open(self.index_file, 'w') as f:
            json.dump(self.index_data, f, indent=2)

    def get_next_batch(self, batch_size: int) -> list:
        """Get next batch of pending cities."""
        pending = [c for c in self.index_data['cities'] if c['status'] == 'pending']
        return pending[:batch_size]

    def mark_processing(self, indices: list):
        """Mark cities as currently processing."""
        for idx in indices:
            self.index_data['cities'][idx]['status'] = 'processing'
            self.index_data['cities'][idx]['attempt_count'] += 1
        self.save()

    def mark_completed(self, indices: list):
        """Mark cities as completed."""
        for idx in indices:
            self.index_data['cities'][idx]['status'] = 'completed'
            self.index_data['cities'][idx]['completed_at'] = datetime.now().isoformat()
        self.index_data['completed_count'] = len([c for c in self.index_data['cities'] if c['status'] == 'completed'])
        self.save()

    def mark_failed(self, indices: list):
        """Mark cities as failed."""
        for idx in indices:
            self.index_data['cities'][idx]['status'] = 'failed'
        self.index_data['failed_count'] = len([c for c in self.index_data['cities'] if c['status'] == 'failed'])
        self.save()

    def print_status(self):
        """Print current status summary."""
        total = self.index_data['total_cities']
        completed = self.index_data['completed_count']
        failed = self.index_data['failed_count']
        pending = len([c for c in self.index_data['cities'] if c['status'] == 'pending'])
        processing = len([c for c in self.index_data['cities'] if c['status'] == 'processing'])

        print("=" * 60)
        print("CITY INDEX STATUS")
        print("=" * 60)
        print(f"Total cities: {total}")
        print(f"Completed: {completed} ({completed/total*100:.1f}%)")
        print(f"Failed: {failed}")
        print(f"Processing: {processing}")
        print(f"Pending: {pending}")
        print(f"Last updated: {self.index_data['last_updated']}")
        print()

        # Show recently completed
        recently_completed = [c for c in self.index_data['cities'] if c['status'] == 'completed'][-5:]
        if recently_completed:
            print("Recently completed:")
            for city in recently_completed:
                print(f"  ✓ {city['city_name']}, {city['country']}")
            print()

        # Show next pending
        next_pending = [c for c in self.index_data['cities'] if c['status'] == 'pending'][:10]
        if next_pending:
            print("Next up (pending):")
            for city in next_pending[:5]:
                print(f"  • {city['city_name']}, {city['country']}")
            if len(next_pending) > 5:
                print(f"  ... and {len(next_pending) - 5} more")
        else:
            print("All cities processed!")

        print("=" * 60)


def run_fetch_script(cities_file: Path, start_row: int, end_row: int, batch_size: int) -> bool:
    """Run the fetch_climate_data.py script for a batch."""
    script_path = Path(__file__).parent / "fetch_climate_data.py"

    cmd = [
        sys.executable,
        str(script_path),
        str(cities_file.name),
        "--start-row", str(start_row),
        "--end-row", str(end_row),
        "--batch-name", f"mini_batch_{start_row}_{end_row}"
    ]

    print(f"\nRunning: {' '.join(cmd)}\n")
    print("💡 TIP: To check if still running, open another terminal and run:")
    print(f"   ps aux | grep run_mini_batch")
    print(f"   # or check: ls -lht {cities_file.parent}/climate_*.csv")
    print()

    # Estimate completion time
    estimated_minutes = batch_size * 80 / 60
    estimated_completion = datetime.now().timestamp() + (batch_size * 80)
    completion_time = datetime.fromtimestamp(estimated_completion).strftime('%I:%M %p')

    print(f"⏱️  Estimated completion: ~{completion_time} (in {estimated_minutes:.0f} minutes)")
    print(f"📊 Progress updates will appear below...")
    print("=" * 60)
    print()

    try:
        result = subprocess.run(cmd, cwd=cities_file.parent, check=True)
        return result.returncode == 0
    except subprocess.CalledProcessError as e:
        print(f"Error running fetch script: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description='Mini-batch climate data fetcher with index tracking')
    parser.add_argument('--batch-size', type=int, default=10,
                        help='Number of cities to process in this batch (default: 10)')
    parser.add_argument('--status', action='store_true',
                        help='Show current status and exit')
    parser.add_argument('--reset', action='store_true',
                        help='Reset index and start over (CAUTION: loses progress tracking)')
    parser.add_argument('--cities-file', type=str, default='worldcities_top500.csv',
                        help='Input cities file (default: worldcities_top500.csv)')

    args = parser.parse_args()

    # Set up paths
    script_dir = Path(__file__).parent
    data_dir = script_dir.parent
    cities_file = data_dir / args.cities_file
    index_file = data_dir / f"city_index_{args.cities_file.replace('.csv', '')}.json"

    if not cities_file.exists():
        print(f"Error: Cities file not found: {cities_file}")
        return 1

    # Reset if requested
    if args.reset:
        if index_file.exists():
            confirm = input("Are you sure you want to reset the index? This will lose progress tracking. (yes/no): ")
            if confirm.lower() == 'yes':
                index_file.unlink()
                print("Index reset.")
            else:
                print("Reset cancelled.")
                return 0
        else:
            print("No index file found. Nothing to reset.")
            return 0

    # Initialize tracker
    tracker = CityIndexTracker(index_file, cities_file)

    # Show status if requested
    if args.status:
        tracker.print_status()
        return 0

    # Get next batch
    batch = tracker.get_next_batch(args.batch_size)

    if not batch:
        print("\n🎉 All cities have been processed!")
        tracker.print_status()
        return 0

    # Display batch info
    print("=" * 60)
    print(f"MINI-BATCH: Processing {len(batch)} cities")
    print("=" * 60)
    print(f"Cities {batch[0]['index']} to {batch[-1]['index']}:")
    for city in batch:
        print(f"  {city['index']:3d}. {city['city_name']}, {city['country']}")
    print()
    print(f"Estimated time: ~{len(batch) * 80 / 60:.1f} minutes")
    print(f"API calls: ~{len(batch) * 78}")
    print("=" * 60)

    # Mark as processing
    indices = [c['index'] for c in batch]
    tracker.mark_processing(indices)

    # Run the fetch script
    start_row = batch[0]['index']
    end_row = batch[-1]['index']

    success = run_fetch_script(cities_file, start_row, end_row, len(batch))

    # Update status
    if success:
        tracker.mark_completed(indices)
        print("\n✓ Batch completed successfully!")
    else:
        tracker.mark_failed(indices)
        print("\n✗ Batch failed. Cities marked as failed in index.")

    # Show updated status
    print()
    tracker.print_status()

    return 0 if success else 1


if __name__ == "__main__":
    exit(main())
