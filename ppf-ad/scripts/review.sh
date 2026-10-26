#!/usr/bin/env bash
# Burns a "replace with REK footage" tag into the placeholder-car shots.
set -euo pipefail
cd "$(dirname "$0")/.."
F=public/fonts/PlexMono-Medium.ttf
EN=$(node -e "
const t=require('./src/timeline.json');let s=0,r=[];
t.scenes.forEach((c,i)=>{if(i)s-=c.overlap;if(c.placeholderCar)r.push('between(t,'+(s/60).toFixed(2)+','+((s+c.dur)/60).toFixed(2)+')');s+=c.dur});
console.log(r.join('+'))")
ffmpeg -loglevel error -y -i out/REK_FlexiShield_PPF_Reel.mp4 -vf "drawbox=x=40:y=1700:w=1000:h=86:color=0xE0313B@0.85:t=fill:enable='$EN',drawtext=fontfile=$F:text='PLACEHOLDER CAR · REPLACE WITH REK FOOTAGE':x=(w-tw)/2:y=1730:fontsize=30:fontcolor=white:enable='$EN'" -c:a copy -crf 18 out/REK_FlexiShield_PPF_Reel_REVIEW.mp4
echo DONE
