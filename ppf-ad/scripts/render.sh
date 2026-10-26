#!/usr/bin/env bash
# Renders the Master edit in chunks (silent), then concatenates and muxes the
# score. Re-running skips chunks that already exist.
set -euo pipefail
cd "$(dirname "$0")/.."
# COMP=Master renders 60fps; the default 30fps master is half the frames
# with identical timing (animation is authored in 60fps units).
COMP=${COMP:-Master30}
DIV=$([ "$COMP" = "Master" ] && echo 1 || echo 2)
TOTAL=$(node -e "const t=require('./src/timeline.json');let s=0;t.scenes.forEach((c,i)=>{if(i)s-=c.overlap;s+=c.dur});console.log(Math.round(s/$DIV))")
CHUNK=${CHUNK:-240}
mkdir -p out/chunks
: > out/chunks/list.txt
for ((a=0; a<TOTAL; a+=CHUNK)); do
  b=$(( a+CHUNK-1 < TOTAL-1 ? a+CHUNK-1 : TOTAL-1 ))
  f=$(printf "out/chunks/c_%05d.mp4" $a)
  if [ ! -s "$f" ]; then
    echo "rendering $a-$b"
    npx remotion render "$COMP" "$f.tmp.mp4" --frames=$a-$b --muted --concurrency=1 --timeout=180000 --crf=16 --log=error
    mv "$f.tmp.mp4" "$f"
  fi
  echo "file '$(basename $f)'" >> out/chunks/list.txt
done
ffmpeg -loglevel error -y -f concat -safe 0 -i out/chunks/list.txt -c copy out/video_silent.mp4
# Two-pass loudness normalisation to -14 LUFS. The 16 kHz low-pass and the
# limiter keep true peak below -2 dBTP after AAC encoding (Reels-safe).
M=$(ffmpeg -hide_banner -i public/audio/score.wav -af loudnorm=I=-14:TP=-1.5:LRA=9:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
LN=$(echo "$M" | python3 -c "import json,sys;d=json.load(sys.stdin);print(f\"measured_I={d['input_i']}:measured_TP={d['input_tp']}:measured_LRA={d['input_lra']}:measured_thresh={d['input_thresh']}:offset={d['target_offset']}\")")
ffmpeg -loglevel error -y -i out/video_silent.mp4 -i public/audio/score.wav -map 0:v -map 1:a -c:v copy \
  -af "lowpass=f=16000:poles=2,loudnorm=I=-14:TP=-2:LRA=9:$LN:linear=true,aresample=48000,alimiter=limit=0.7:attack=2:release=80:level=false" -c:a aac -b:a 256k -shortest out/REK_FlexiShield_PPF_Reel.mp4
echo DONE
