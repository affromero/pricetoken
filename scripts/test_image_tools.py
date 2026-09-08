import gzip
import io
import importlib.util
import json
from pathlib import Path
import tarfile
import tempfile
import time
import unittest
from unittest.mock import patch

def load_module(name):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(name + '.py'))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


measurement = load_module('measure-image')
retention = load_module('retain-deployments')


def tar_member(archive, name, data):
    member = tarfile.TarInfo(name)
    member.size = len(data)
    archive.addfile(member, io.BytesIO(data))


class ImageToolsTests(unittest.TestCase):
    def test_measures_expanded_gzip_layers_without_extracting_files(self):
        with tempfile.TemporaryDirectory() as directory:
            layer_data = io.BytesIO()
            with tarfile.open(fileobj=layer_data, mode='w') as layer:
                tar_member(layer, '../../outside', b'a' * 8193)
            image = Path(directory) / 'image.tar'
            with tarfile.open(image, 'w') as archive:
                tar_member(archive, 'manifest.json', json.dumps([{'Config': 'config.json', 'Layers': ['layer']}]).encode())
                tar_member(archive, 'config.json', b'{"os":"linux","architecture":"amd64"}')
                tar_member(archive, 'layer', gzip.compress(layer_data.getvalue()))
            self.assertEqual(measurement.archive_layers(image), (12288, 1))
            self.assertEqual(sorted(path.name for path in Path(directory).iterdir()), ['image.tar'])

    def test_rejects_architecture_mismatch(self):
        with tempfile.TemporaryDirectory() as directory:
            image = Path(directory) / 'image.tar'
            with tarfile.open(image, 'w') as archive:
                tar_member(archive, 'manifest.json', b'[{"Config":"config.json","Layers":[]}]')
                tar_member(archive, 'config.json', b'{"os":"linux","architecture":"arm64"}')
            with self.assertRaisesRegex(ValueError, 'exactly one Linux amd64'):
                measurement.archive_layers(image)

    def test_retention_preserves_failed_recent_and_rollback_deployments(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            backups = root / '.backups'
            releases = root / '.releases'
            backups.mkdir()
            releases.mkdir()
            current_revision = 'f' * 40
            current = backups / (current_revision + '-CURRENT1')
            current.mkdir()
            current_release = releases / current_revision
            current_release.mkdir()
            previous_image = 'sha256:' + 'a' * 64
            current_image = 'sha256:' + 'b' * 64
            created = []
            now = time.time()
            for index in range(14):
                revision = f'{index:040x}'
                backup = backups / (revision + '-ARCHIVE1')
                backup.mkdir()
                release = releases / revision
                release.mkdir()
                image = previous_image if index == 0 else 'sha256:' + 'c' * 64
                (backup / 'completed.json').write_text(json.dumps({
                    'completed_at': now - 86400 * (60 - index), 'status': 'success',
                    'revision': revision, 'release': str(release), 'image': image,
                }))
                created.append(backup)
            failed = backups / ('e' * 40 + '-FAILED01')
            failed.mkdir()
            with patch.object(retention.time, 'time', return_value=now):
                retention.complete_and_retain(root, current, current_release, current_revision, previous_image, current_image)
            self.assertTrue(current.exists())
            self.assertTrue(failed.exists())
            self.assertTrue(created[0].exists())
            self.assertFalse(created[1].exists())
            self.assertFalse((releases / f'{1:040x}').exists())
            self.assertTrue(all(path.exists() for path in created[-9:]))

    def test_retention_preserves_malformed_metadata_without_failing_deployment(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            backups = root / '.backups'
            backups.mkdir()
            revision = 'f' * 40
            current = backups / (revision + '-CURRENT1')
            current.mkdir()
            for index in range(20, 32):
                recent_revision = f'{index:040x}'
                recent = backups / (recent_revision + '-RECENT01')
                recent.mkdir()
                (recent / 'completed.json').write_text(json.dumps({
                    'status': 'success', 'completed_at': time.time(),
                    'revision': recent_revision, 'image': 'sha256:' + 'c' * 64,
                    'release': str(root / '.releases' / recent_revision),
                }))
            for index, value in enumerate([[], 'text', 42, None, {'release': []}, {'release': 123}, {'release': {'path': '/tmp'}}]):
                previous_revision = f'{index:040x}'
                previous = backups / (previous_revision + '-ARCHIVE1')
                previous.mkdir()
                if isinstance(value, dict):
                    value.update({'status': 'success', 'completed_at': 1,
                                  'revision': previous_revision, 'image': 'sha256:' + 'a' * 64})
                (previous / 'completed.json').write_text(json.dumps(value))
            retention.complete_and_retain(root, current, root, revision, 'sha256:' + 'a' * 64, 'sha256:' + 'b' * 64)
            self.assertEqual(len(list(backups.iterdir())), 20)

    def test_history_and_archive_measure_the_same_amd64_platform(self):
        def save(args, **kwargs):
            self.assertEqual(args[:4], ['docker', 'save', '--platform', 'linux/amd64'])
            layer_data = io.BytesIO()
            with tarfile.open(fileobj=layer_data, mode='w') as layer:
                tar_member(layer, 'data', b'a')
            with tarfile.open(args[args.index('-o') + 1], 'w') as archive:
                tar_member(archive, 'manifest.json', b'[{"Config":"config.json","Layers":["layer"]}]')
                tar_member(archive, 'config.json', b'{"os":"linux","architecture":"amd64"}')
                tar_member(archive, 'layer', gzip.compress(layer_data.getvalue()))
        with patch.object(measurement.subprocess, 'check_output', return_value='8192\n') as history, \
             patch.object(measurement.subprocess, 'run', side_effect=save):
            result = measurement.measure('local-image')
        self.assertEqual(history.call_args.args[0][:4], ['docker', 'history', '--platform', 'linux/amd64'])
        self.assertEqual(result['expanded_bytes'], 8192)


if __name__ == '__main__':
    unittest.main()
