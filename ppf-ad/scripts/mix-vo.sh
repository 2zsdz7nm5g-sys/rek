#!/usr/bin/env bash
# For when the voice-over exists: place public/vo/NN.wav at their timeline
# slots, duck the score under the voice (sidechain) and mux into the video.
set -euo pipefail
cd "$(dirname "$0")/.."
INPUTS=""; FILTERS=""; LABELS=""; n=1
while read -r line at; do
  f=$(printf "public/vo/%02d.wav" "$line")
  [ -f "$f" ] || continue
  INPUTS="$INPUTS -i $f"
  ms=$(node -e "console.log(Math.round($at/60*1000))")
  FILTERS="$FILTERS[$n:a]adelay=${ms}|${ms},aformat=channel_layouts=stereo[v$n];"
  LABELS="$LABELS[v$n]"; n=$((n+1))
done < <(node -e "
const t=require('./src/timeline.json');let s=0,st={};
t.scenes.forEach((c,i)=>{if(i)s-=c.overlap;st[c.id]=s;s+=c.dur});
t.vo.forEach(v=>console.log(v.line, st[v.scene]+v.at))")
[ $n -gt 1 ] || { echo "no VO files in public/vo"; exit 1; }
ffmpeg -loglevel error -y -i public/audio/score.wav $INPUTS -filter_complex \
 "${FILTERS}${LABELS}amix=inputs=$((n-1)):normalize=0,volume=1.6[vo];[vo]asplit[vo1][vo2];[0:a][vo1]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=350[duck];[duck][vo2]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1:LRA=9[mix]" \
 -map "[mix]" -ar 48000 out/mix.wav
ffmpeg -loglevel error -y -i out/video_silent.mp4 -i out/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest out/REK_FlexiShield_PPF_Reel_VO.mp4
echo DONE
