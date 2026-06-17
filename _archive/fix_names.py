#!/usr/bin/env python3
import os

os.chdir('/volume1/docker/epark-bundang/img')

# Find files by size and rename
target = {
    1459203: '투시도.png',
    2038002: '조감도.png',
    933447: '배치도.png',
}

for f in os.listdir('.'):
    fp = os.path.join('.', f)
    if os.path.isfile(fp):
        sz = os.path.getsize(fp)
        if sz in target:
            new_name = target[sz]
            new_fp = os.path.join('.', new_name)
            print(f'{f} ({sz}) -> {new_name}')
            os.rename(fp, new_fp)

# Clean up old garbled files
for f in os.listdir('.'):
    if f.endswith('.png') and not f.startswith('5'):
        print(f'Removing: {f}')
        os.remove(os.path.join('.', f))

# Check final state
print('\nFinal files:')
for f in sorted(os.listdir('.')):
    print(f'  {f} ({os.path.getsize(os.path.join(".", f))} bytes)')
