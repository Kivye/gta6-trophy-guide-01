#!/usr/bin/env bash
# Render the actual built app; JPEG conversion is the only image processing.
set -euo pipefail
cd "$(dirname "$0")"
NODE=/home/hatch/workspace/makefun/node22/node-v22.21.0-linux-x64/bin/node
CHROME=/opt/meta-chromium/chrome
MAKEFUN_OUTPUT_DIR=out "$NODE" main.ts --preview
mkdir -p screenshots
capture_dir=$(mktemp -d /tmp/leonida-captures.XXXXXX)
flags=(--headless=new --no-sandbox --disable-gpu --hide-scrollbars
  --window-size=1280,800
  --hatch-webgl-allowed-domains-file=/tmp/webgl-policy.txt
  --hatch-webgl-allowed-domains-sha256=c5c85869591ff8b3491450f49cfd62912c6dd41e5cecada4e831191d3185035e
  --user-data-dir=/tmp/trophy-chrome)
names=(01-cover 02-guide-open 03-roadmap 04-spoiler-filters)
hashes=('demo=1' 'demo=1&guides=all' 'demo=1&view=roadmap' 'demo=1&spoiler=1&grade=bronze&status=open&backup=1')
for i in 0 1 2 3; do
  "$CHROME" "${flags[@]}" "--screenshot=$capture_dir/${names[$i]}.png" "file://$PWD/out/index.html#${hashes[$i]}"
done
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
