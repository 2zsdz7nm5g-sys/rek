#!/usr/bin/env bash
# Renders the Master edit in chunks (silent), then concatenates and muxes the
# score. Re-running skips chunks that already exist.
set -euo pipefail
cd "$(dirname "$0")/.."
TOTAL=$(node -e "const t=require('./src/timeline.json');let s=0;t.scenes.forEach((c,i)=>{if(i)s-=c.overlap;s+=c.dur});console.log(s)")
CHUNK=${CHUNK:-450}
mkdir -p out/chunks
: > out/chunks/list.txt
for ((a=0; a<TOTAL; a+=CHUNK)); do
  b=$(( a+CHUNK-1 < TOTAL-1 ? a+CHUNK-1 : TOTAL-1 ))
  f=$(printf "out/chunks/c_%05d.mp4" $a)
  if [ ! -s "$f" ]; then
    echo "rendering $a-$b"
    npx remotion render Master "$f.tmp.mp4" --frames=$a-$b --muted --concurrency=1 --timeout=180000 --crf=16 --log=error
    mv "$f.tmp.mp4" "$f"
  fi
  echo "file '$(basename $f)'" >> out/chunks/list.txt
done
ffmpeg -loglevel error -y -f concat -safe 0 -i out/chunks/list.txt -c copy out/video_silent.mp4
ffmpeg -loglevel error -y -i out/video_silent.mp4 -i public/audio/score.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest out/REK_FlexiShield_PPF_Reel.mp4
echo DONE
