#!/usr/bin/env bash
# Creative v2 assemble: parallel-action landing film with soft seam + natural VO.
# Budget path: reuse Heng×3 + Mei drawer motion; Mei 2/3 = cinematic Ken Burns on
# fresh stills; Minimax Wise_Woman VO; soft dissolve into Wall Mode.
set -euo pipefail

cd "$(dirname "$0")/.."
A=assets/video/landing
W="$A/work/v2"
OUT=output/video/87k-landing-story.mp4
WEB=public/landing-story.mp4
POSTER=public/landing-story-poster.jpg
mkdir -p "$W" output/video public

python3 scripts/gen-landing-overlays-v2.py

common="-r 24 -an -c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p"

# Soft amber hairline seam overlay helper (applied later)
split_lr () { # $1 left $2 right $3 out $4 duration
  local dur="${4:-8}"
  ffmpeg -y -loglevel error -i "$1" -i "$2" -i "$A/overlays/seam-amber.png" -filter_complex "
  [0:v]fps=24,scale=960:1080:force_original_aspect_ratio=increase,crop=960:1080,trim=duration=${dur},setpts=PTS-STARTPTS[l];
  [1:v]fps=24,scale=960:1080:force_original_aspect_ratio=increase,crop=960:1080,trim=duration=${dur},setpts=PTS-STARTPTS[r];
  [l][r]hstack=inputs=2[base];
  [base][2:v]overlay=0:0,format=yuv420p[v]" -map "[v]" $common "$3"
}

# Smooth push-in without zoompan (zoompan subpixel crop shimmers on UI / windows).
# Scale grows with t, then center-crop — continuous, no frame-to-frame crop jitter.
still_push () { # $1 image $2 duration $3 out $4 zoom_end
  local dur="$2" zend="${4:-1.08}"
  ffmpeg -y -loglevel error -loop 1 -t "$dur" -i "$1" -filter_complex "
  [0:v]fps=24,setsar=1,
  scale=w='trunc(1920*(1+(${zend}-1)*t/${dur})/2)*2':h='trunc(1080*(1+(${zend}-1)*t/${dur})/2)*2':
    force_original_aspect_ratio=increase:eval=frame:flags=bicubic,
  crop=1920:1080,setsar=1,
  eq=contrast=1.04:saturation=1.03,vignette=PI/7,format=yuv420p[v]" \
  -map "[v]" $common "$3"
}

# Static hold — use for real UI captures (text edges shiver under any zoom).
still_hold () { # $1 image $2 duration $3 out
  local dur="$2"
  ffmpeg -y -loglevel error -loop 1 -t "$dur" -i "$1" -vf "
  fps=24,scale=1920:1080:force_original_aspect_ratio=increase:flags=bicubic,
  crop=1920:1080,setsar=1,format=yuv420p" $common "$3"
}

# Smooth pull-back (start zoomed, ease to 1.0) — same scale+crop method.
still_pull () { # $1 image $2 duration $3 out $4 zoom_start
  local dur="$2" z0="${4:-1.10}"
  ffmpeg -y -loglevel error -loop 1 -t "$dur" -i "$1" -filter_complex "
  [0:v]fps=24,setsar=1,
  scale=w='trunc(1920*(${z0}-(${z0}-1)*t/${dur})/2)*2':h='trunc(1080*(${z0}-(${z0}-1)*t/${dur})/2)*2':
    force_original_aspect_ratio=increase:eval=frame:flags=bicubic,
  crop=1920:1080,setsar=1,
  eq=contrast=1.04:saturation=1.05,vignette=PI/7,format=yuv420p[v]" \
  -map "[v]" $common "$3"
}

echo "== Act 1: the count (16s) =="
ffmpeg -y -loglevel error -i assets/video/generated/seedance/02-dark-hdb.mp4 -filter_complex "
[0:v]setpts=1.7*PTS,fps=24,scale=1920:1080,trim=duration=16,
eq=contrast=1.05:saturation=0.95,vignette=PI/6,fade=t=in:st=0:d=1.2[v]" \
  -map "[v]" $common "$W/a1.mp4"

echo "== Act 2: true split (3×8s + 4s silence) =="
# Prefer fal Seedance motion clips; fall back to cinematic still push
stretch_clip () { # $1 in $2 out $3 target_dur — slow 5s clips to fill 8s
  local dur="$3"
  ffmpeg -y -loglevel error -i "$1" -filter_complex "
  [0:v]setpts=(${dur}/5.04)*PTS,fps=24,scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,
  trim=duration=${dur},setpts=PTS-STARTPTS,eq=contrast=1.03:saturation=1.02[v]" \
    -map "[v]" $common "$2"
}

split_lr "$A/clips/heng-1-shelf.mp4" "$A/clips/mei-1-drawer.mp4" "$W/a2a.mp4" 8
if [[ -f "$A/clips/mei-2-radio.mp4" ]]; then
  stretch_clip "$A/clips/mei-2-radio.mp4" "$W/mei2.mp4" 8
else
  still_push "${A}/stills/mei-2-radio-v2.jpg" 8 "$W/mei2.mp4" 1.07
fi
split_lr "$A/clips/heng-2-tuning.mp4" "$W/mei2.mp4" "$W/a2b.mp4" 8
if [[ -f "$A/clips/mei-3-window.mp4" ]]; then
  stretch_clip "$A/clips/mei-3-window.mp4" "$W/mei3.mp4" 8
else
  still_push "${A}/stills/mei-3-window-v2.jpg" 8 "$W/mei3.mp4" 1.06
fi
split_lr "$A/clips/heng-3-window.mp4" "$W/mei3.mp4" "$W/a2c.mp4" 8
still_push "$A/stills/two-windows-dark.png" 4 "$W/a2d.mp4" 1.04

echo "== Act 3: missing sentence → soft dissolve merge =="
# UI captures: static hold (zoom shimmers text/edges)
still_hold "$A/captures/join-share-1920x1080.png" 6 "$W/js.mp4"
still_hold "$A/captures/join-listen-1920x1080.png" 6 "$W/jl.mp4"
ffmpeg -y -loglevel error -i "$W/js.mp4" -i "$W/jl.mp4" -i "$A/overlays/seam-amber.png" -filter_complex "
[0:v]scale=960:1080:force_original_aspect_ratio=increase,crop=960:1080[l];
[1:v]scale=960:1080:force_original_aspect_ratio=increase,crop=960:1080[r];
[l][r]hstack=inputs=2[base];[base][2:v]overlay=0:0,format=yuv420p[v]" \
  -map "[v]" -t 6 $common "$W/a3a.mp4"

still_hold "assets/video/captures/03-join-consent-review-1920x1080.png" 5 "$W/cc.mp4"
ffmpeg -y -loglevel error -i "$W/cc.mp4" -i "$W/jl.mp4" -i "$A/overlays/seam-amber.png" -filter_complex "
[0:v]scale=960:1080:force_original_aspect_ratio=increase,crop=960:1080[l];
[1:v]scale=960:1080:force_original_aspect_ratio=increase,crop=960:1080[r];
[l][r]hstack=inputs=2[base];[base][2:v]overlay=0:0,format=yuv420p[v]" \
  -map "[v]" -t 5 $common "$W/a3b.mp4"

# Soft dissolve: last split frame into Wall Mode (static UI — no zoom shimmer)
still_hold "assets/video/captures/04-wall-matched-two-lights-1920x1080.png" 8 "$W/wall.mp4"
ffmpeg -y -loglevel error -i "$W/a3b.mp4" -i "$W/wall.mp4" -filter_complex "
[0:v][1:v]xfade=transition=fade:duration=1.4:offset=3.6,trim=duration=8,setpts=PTS-STARTPTS[v]" \
  -map "[v]" $common "$W/a3c.mp4"

echo "== Act 4: reveal + question =="
FACADE="$A/stills/facade-lit-v2.png"
[[ -f "$FACADE" ]] || FACADE="$A/stills/facade-lit.png"
# Soft pull-back without zoompan; keep motion gentle (1.06) on low-res still
still_pull "$FACADE" 8 "$W/a4a.mp4" 1.06

ffmpeg -y -loglevel error -loop 1 -t 12 -i "$A/captures/landing-choice-1920x1080.png" \
  -vf "fps=24,scale=1920:1080:flags=bicubic,setsar=1,fade=t=in:st=0:d=0.8,fade=t=out:st=10:d=2,format=yuv420p" \
  $common "$W/a4b.mp4"

echo "== Concat =="
for f in a1 a2a a2b a2c a2d a3a a3b a3c a4a a4b; do
  echo "file '$PWD/$W/$f.mp4'"
done > "$W/list.txt"
ffmpeg -y -loglevel error -f concat -safe 0 -i "$W/list.txt" -c copy "$W/visual.mp4"

echo "== Text overlays =="
# Visual duration ≈ 16+8+8+8+4+6+5+8+8+12 = 83s
inputs=(-i "$W/visual.mp4"
  -i "$A/overlays/num-2015.png" -i "$A/overlays/num-2025.png" -i "$A/overlays/num-87k.png"
  -i "$A/overlays/title.png" -i "$A/overlays/roles.png" -i "$A/overlays/metres.png")
chain="[0:v][1:v]overlay=enable='between(t,0.6,5.8)'[t1];\
[t1][2:v]overlay=enable='between(t,6.2,11.6)'[t2];\
[t2][3:v]overlay=enable='between(t,12.0,15.6)'[t3];\
[t3][4:v]overlay=enable='between(t,68.5,75.0)'[t4];\
[t4][5:v]overlay=enable='between(t,16.2,24.0)'[t5];\
[t5][6:v]overlay=enable='between(t,42.5,49.0)'[t6]"
n=7
last="t6"
while read -r idx start end; do
  [[ -z "${idx:-}" ]] && continue
  inputs+=(-i "$A/overlays/$(printf 'cap-%02d.png' "$idx")")
  chain="$chain;[$last][${n}:v]overlay=enable='between(t,$start,$end)'[c$idx]"
  last="c$idx"
  n=$((n+1))
done < "$A/overlays/captions-timing-v2.txt"
ffmpeg -y -loglevel error "${inputs[@]}" -filter_complex "$chain" -map "[$last]" $common "$W/texted.mp4"

echo "== Audio: Minimax VO + Pixabay BGM (sidechain duck) =="
VO="$A/audio/vo-natural.mp3"
BGM="$A/audio/bgm-i-giorni.mp3"
DUR=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$W/texted.mp4")
FADE_START=$(python3 -c "print(max(0, float('$DUR')-7))")
# Keep Minimax VO; warm it slightly. Piano bed stays audible under speech, then lifts on the end card.
ffmpeg -y -loglevel error -i "$W/texted.mp4" -i "$VO" -i "$BGM" -filter_complex "
[1:a]adelay=600|600,apad=whole_dur=${DUR},aformat=sample_fmts=fltp:channel_layouts=stereo,
  highpass=f=80,lowpass=f=14000,bass=g=1.5:f=180,treble=g=-1.5:f=6500,volume=1.25,asplit=2[vo][voside];
[2:a]atrim=duration=${DUR},asetpts=PTS-STARTPTS,aformat=sample_fmts=fltp:channel_layouts=stereo,
  afade=t=in:st=0:d=2.5,afade=t=out:st=${FADE_START}:d=6.5,volume=0.62[bg];
[bg][voside]sidechaincompress=threshold=0.10:ratio=2.4:attack=20:release=260:makeup=1:knee=7:level_sc=1[bgd];
[vo][bgd]amix=inputs=2:duration=longest:dropout_transition=0:normalize=0,
  alimiter=limit=0.95,atrim=duration=${DUR}[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 -t "$DUR" "$OUT"

# Web encode ≤ ~8 MB
ffmpeg -y -loglevel error -i "$OUT" -vf "scale=1280:720" -c:v libx264 -preset medium -crf 26 \
  -movflags +faststart -c:a aac -b:a 160k -ar 48000 -ac 2 "$WEB"
ffmpeg -y -loglevel error -ss 26 -i "$OUT" -frames:v 1 -q:v 3 "$POSTER"

ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 "$OUT"
ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 "$WEB"
echo "Built $OUT → $WEB"
