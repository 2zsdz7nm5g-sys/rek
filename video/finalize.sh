#!/usr/bin/env bash
# Build the final Instagram-ready MP4: re-mix audio (picks up any VO lines in
# public/audio/vo/) and mux it onto the rendered silent master.
set -euo pipefail
cd "$(dirname "$0")"
python3 audio/mix.py
ffmpeg -y -loglevel error -i out/video-silent.mp4 -i public/audio/mix.wav \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 \
  -shortest -movflags +faststart \
  out/REK-Proffset-Windshield-Shield-1080x1920.mp4
echo "Wrote out/REK-Proffset-Windshield-Shield-1080x1920.mp4"
