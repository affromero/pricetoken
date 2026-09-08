"""Retain recent successful deployments and all failed or protected releases."""

import json
import math
from pathlib import Path
import re
import shutil
import sys
import time


def complete_and_retain(root, current, release, revision, previous_image, current_image):
    root = Path(root).resolve(strict=True)
    backups = root / '.backups'
    current = Path(current).resolve(strict=True)
    release = Path(release).resolve(strict=True)
    if current.parent != backups or not re.fullmatch(r'[a-f0-9]{40}-[A-Za-z0-9]{8}', current.name):
        raise ValueError('Unexpected backup directory')
    if not re.fullmatch(r'[a-f0-9]{40}', revision) or current.name[:40] != revision:
        raise ValueError('Unexpected release revision')
    if any(not re.fullmatch(r'sha256:[a-f0-9]{64}', image) for image in (previous_image, current_image)):
        raise ValueError('Expected immutable image IDs')
    timestamp = time.time()
    metadata = {'completed_at': timestamp, 'revision': revision, 'image': current_image,
                'release': str(release), 'status': 'success'}
    temporary = current / '.completed.json.tmp'
    temporary.write_text(json.dumps(metadata))
    temporary.replace(current / 'completed.json')
    completed = []
    for directory in backups.iterdir():
        if directory.is_symlink() or not directory.is_dir() or not re.fullmatch(r'[a-f0-9]{40}-[A-Za-z0-9]{8}', directory.name):
            continue
        marker = directory / 'completed.json'
        try:
            if marker.is_symlink():
                continue
            record = json.loads(marker.read_text())
            if not isinstance(record, dict):
                continue
            at = record['completed_at']
            if record.get('status') != 'success' or isinstance(at, bool) or not isinstance(at, (int, float)) or not math.isfinite(at):
                continue
            if record.get('revision') != directory.name[:40]:
                continue
            if not isinstance(record.get('release'), str) or not Path(record['release']).is_absolute():
                continue
            if not isinstance(record.get('image'), str) or not re.fullmatch(r'sha256:[a-f0-9]{64}', record['image']):
                continue
        except (OSError, ValueError, KeyError, TypeError, OverflowError):
            continue
        completed.append((at, directory, record))
    completed.sort(key=lambda entry: entry[0], reverse=True)
    retired_releases = set()
    for at, directory, record in completed[10:]:
        if directory == current or timestamp - at < 30 * 86400 or record.get('image') in (previous_image, current_image):
            continue
        candidate = Path(record.get('release', ''))
        if candidate.is_symlink():
            continue
        candidate = candidate.resolve()
        if candidate.parent == root / '.releases' and candidate.name == record['revision']:
            retired_releases.add(candidate)
        shutil.rmtree(directory)
    # Failed and incomplete deployments also retain their matching source assets.
    remaining_revisions = {directory.name[:40] for directory in backups.iterdir()}
    for candidate in retired_releases:
        if candidate == release or candidate.name in remaining_revisions or candidate.is_symlink():
            continue
        if candidate.is_dir():
            shutil.rmtree(candidate)


if __name__ == '__main__':
    if len(sys.argv) != 7:
        raise SystemExit('Expected root, backup, release, revision and previous/current image IDs')
    complete_and_retain(*sys.argv[1:])
