#!/usr/bin/env bash
# Render the actual built app; JPEG conversion is the only image processing.
# Captures are driven over CDP (capture-cdp.mjs): the one-shot --screenshot
# mode writes no file in this environment.
set -euo pipefail
cd "$(dirname "$0")"
NODE=/home/hatch/workspace/makefun/node22/node-v22.21.0-linux-x64/bin/node
rm -rf out
MAKEFUN_OUTPUT_DIR=out "$NODE" main.ts --preview
mkdir -p screenshots
capture_dir=$(mktemp -d /tmp/leonida-captures.XXXXXX)
"$NODE" capture-cdp.mjs "$capture_dir" "file://$PWD/out/index.html"
python3 - "$capture_dir" <<'PY'
from pathlib import Path
from PIL import Image
import sys
for source in sorted(Path(sys.argv[1]).glob('*.png')):
    image=Image.open(source).convert('RGB')
    assert image.size==(1280,800), (source,image.size)
    target=Path('screenshots')/(source.stem+'.jpg')
    for quality in (91,87,83,79,75):
        image.save(target,'JPEG',quality=quality,optimize=True)
        if target.stat().st_size<=262144:
            break
    assert target.stat().st_size<=262144
    assert Image.open(target).size==(1280,800)
    print(target, target.stat().st_size, 'bytes; 1280 × 800')
PY
MAKEFUN_OUTPUT_DIR=out "$NODE" main.ts
