#!/usr/bin/env python3
import urllib.request
import os

base = 'http://192.168.1.44:8888/img/'
dest = '/volume1/docker/epark-bundang/img/'

files = {
    '투시도.png': '투시도.png',
    '조감도.png': '조감도.png',
    '배치도.png': '배치도.png',
}

for remote_name, local_name in files.items():
    url = base + remote_name
    filepath = os.path.join(dest, local_name)
    print(f'Downloading {url} -> {local_name}')
    try:
        urllib.request.urlretrieve(url, filepath)
        print(f'  OK: {os.path.getsize(filepath)} bytes')
    except Exception as e:
        print(f'  ERROR: {e}')

# Also download SVGs if available
svg_files = ['elife_logo.svg', 'elife_logo_construction.svg']
for svg in svg_files:
    url = f'http://192.168.1.44:8888/img/{svg}'
    filepath = os.path.join(dest, svg)
    print(f'Checking {url}')
    try:
        req = urllib.request.Request(url)
        resp = urllib.request.urlopen(req, timeout=5)
        data = resp.read()
        if len(data) > 0:
            with open(filepath, 'wb') as f:
                f.write(data)
            print(f'  OK: {len(data)} bytes')
        else:
            print(f'  Empty, skipping')
    except Exception as e:
        print(f'  Not available: {e}')
        if os.path.exists(filepath) and os.path.getsize(filepath) == 0:
            os.remove(filepath)
