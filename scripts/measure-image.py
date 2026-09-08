"""Measure a built image off-server, including compressed and expanded layers."""

import contextlib
import gzip
import io
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tarfile
import tempfile


@contextlib.contextmanager
def layer_reader(source):
    magic = source.read(4)
    source.seek(0)
    if magic[:2] == b'\x1f\x8b':
        with gzip.GzipFile(fileobj=source) as expanded:
            yield expanded
    elif magic == b'\x28\xb5\x2f\xfd':
        with tempfile.NamedTemporaryFile() as compressed:
            shutil.copyfileobj(source, compressed)
            compressed.flush()
            process = subprocess.Popen(['zstd', '-dc', compressed.name], stdout=subprocess.PIPE)
            try:
                yield process.stdout
                if process.wait() != 0:
                    raise ValueError('Zstandard layer decompression failed')
            finally:
                process.stdout.close()
                if process.poll() is None:
                    process.kill()
                    process.wait()
    else:
        yield source


def archive_layers(archive_path):
    with tarfile.open(archive_path, 'r:') as archive:
        manifests = json.load(archive.extractfile('manifest.json'))
        selected = []
        for manifest in manifests:
            config = json.load(archive.extractfile(manifest['Config']))
            if config.get('os') == 'linux' and config.get('architecture') == 'amd64':
                selected.append(manifest)
        if len(selected) != 1:
            raise ValueError('Expected exactly one Linux amd64 image in the saved archive')
        allocated = 0
        file_count = 0
        for name in set(selected[0]['Layers']):
            source = archive.extractfile(name)
            if source is None:
                raise ValueError('Image layer is unavailable')
            with source, layer_reader(source) as expanded, tarfile.open(fileobj=expanded, mode='r|') as layer:
                for member in layer:
                    if member.isfile():
                        allocated += ((member.size + 4095) // 4096) * 4096
                    elif member.isdir() or member.issym():
                        allocated += 4096
                    elif member.islnk():
                        continue
                    else:
                        raise ValueError('Unsupported image layer entry type')
                    file_count += 1
        if allocated <= 0 or file_count <= 0:
            raise ValueError('Expanded image measurement is empty')
        return allocated, file_count


class Counter(io.RawIOBase):
    def __init__(self):
        self.bytes = 0

    def writable(self):
        return True

    def write(self, data):
        self.bytes += len(data)
        return len(data)


def measure(image):
    # History is queried only on the build machine. Never run this script on a
    # serving host: it saves an archive and reads build metadata locally.
    history = subprocess.check_output(
        ['docker', 'history', '--platform', 'linux/amd64', '--no-trunc', '--human=false', '--format', '{{.Size}}', image],
        text=True,
    ).splitlines()
    if not history or any(not value.isdecimal() for value in history):
        raise ValueError('Expanded image history is unavailable')
    history_bytes = sum(int(value) for value in history)
    if history_bytes <= 0:
        raise ValueError('Expanded image history is empty')
    with tempfile.TemporaryDirectory(prefix='pricetoken-image-') as directory:
        archive = Path(directory) / 'image.tar'
        subprocess.run(['docker', 'save', '--platform', 'linux/amd64', '-o', str(archive), image], check=True)
        allocated, files = archive_layers(archive)
        counter = Counter()
        with archive.open('rb') as source, gzip.GzipFile(fileobj=counter, mode='wb', mtime=0) as compressed:
            shutil.copyfileobj(source, compressed)
        # A gzip of an OCI archive may be smaller than the already-compressed
        # registry blobs. Keep the full archive size as a conservative transfer
        # bound for pulls, including manifests and tar metadata.
        return {'expanded_bytes': max(allocated, history_bytes),
                'compressed_bytes': max(counter.bytes, archive.stat().st_size),
                'archive_gzip_bytes': counter.bytes, 'archive_bytes': archive.stat().st_size,
                'layer_allocated_bytes': allocated,
                'history_expanded_bytes': history_bytes, 'layer_file_count': files}


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Usage: measure-image.py local-image-reference (build machine only)')
    print(json.dumps(measure(sys.argv[1])))
