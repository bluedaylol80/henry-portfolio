/**
 * Process a raw BGM file (Suno/Udio export, mp3/wav) into a loop-ready, web-sized
 * track for the room speaker. Requires ffmpeg on PATH.
 *
 *   node scripts/process-bgm.mjs <input> [--seamless] [--out public/music/jazz-room.mp3]
 *
 * Default pipeline: trim leading/trailing silence → loudness-normalise (EBU R128,
 * ~-18 LUFS so it sits gently under the site at volume 0.3) → 0.4s fade-in +
 * 2.0s fade-out (a soft "breath" at the loop point) → 128k CBR mp3, 44.1k stereo.
 *
 * --seamless: instead of end/start fades, build a truly seamless loop by
 * crossfading the tail into the head (acrossfade d=4). Use this if the plain
 * loop's restart is noticeable. Output is ~4s shorter than the input.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, rmSync } from 'node:fs'

const args = process.argv.slice(2)
const input = args.find((a) => !a.startsWith('--'))
const seamless = args.includes('--seamless')
const outArg = args.find((a) => a.startsWith('--out='))
const out = outArg ? outArg.slice('--out='.length) : 'public/music/jazz-room.mp3'
// --trim-end=N : drop the last N seconds BEFORE the seamless crossfade. Use it to
// cut a song's fade-out outro so the loop's tail is at full level and matches the
// (full-level) head — otherwise crossfading a quiet outro into the head dips the
// loop point. (measure with ffmpeg volumedetect to find where the fade begins.)
const trimArg = args.find((a) => a.startsWith('--trim-end='))
const trimEnd = trimArg ? Number(trimArg.slice('--trim-end='.length)) : 0

if (!input || !existsSync(input)) {
  console.error('usage: node scripts/process-bgm.mjs <input-audio> [--seamless] [--out=path]')
  process.exit(1)
}

const ff = (fArgs) => {
  console.log('ffmpeg', fArgs.join(' '))
  execFileSync('ffmpeg', fArgs, { stdio: 'inherit' })
}

// 1) trim silence + loudness normalise → temp wav
const tmp = 'scripts/.bgm-norm.wav'
ff([
  '-y', '-i', input,
  '-af',
  'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.1,areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.1,areverse,loudnorm=I=-18:TP=-1.5:LRA=11',
  '-ar', '44100', '-ac', '2', tmp,
])

if (seamless) {
  // TRUE seamless loop: crossfade the track's OWN tail into its OWN head so the
  // loop wrap (end → start) is gapless. Loop length = L − D.
  //   [mh]  = equal-power mix of head(0..D, fade-in) + tail(L-D..L, fade-out)
  //   [mid] = body(D..L-D), untouched
  //   out   = [mh] + [mid]  → both the mh/mid join AND the loop wrap are continuous
  // (the earlier acrossfade-of-two-copies only smoothed the middle, not the wrap.)
  const D = 3
  const Lraw = Number(
    execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', tmp])
      .toString().trim(),
  )
  const L = Lraw - trimEnd // cut the fade-out outro so tail matches the head level
  const Ld = (L - D).toFixed(3)
  const Lf = L.toFixed(3)
  console.log(`[seamless] body 0..${Lf}s (trimmed ${trimEnd}s outro), ${D}s tail→head crossfade`)
  // Use the dedicated acrossfade filter (equal-power) to blend the TAIL into the
  // HEAD: with two 3s segments and d=3 it fully overlaps them → a clean 3s
  // crossfade where output[0]=tail[0] and output[end]=head[end]. Then concat the
  // untouched middle. Wrap is continuous because mid ends at T[Ld] == tail[0].
  const filter = [
    `[0]atrim=0:${D},asetpts=PTS-STARTPTS[head]`,
    `[0]atrim=${Ld}:${Lf},asetpts=PTS-STARTPTS[tail]`,
    `[tail][head]acrossfade=d=${D}:c1=hsin:c2=hsin[mh]`,
    `[0]atrim=${D}:${Ld},asetpts=PTS-STARTPTS[mid]`,
    `[mh][mid]concat=n=2:v=0:a=1[out]`,
  ].join(';')
  ff([
    '-y', '-i', tmp, '-filter_complex', filter, '-map', '[out]',
    '-b:a', '128k', '-ar', '44100', '-ac', '2', out,
  ])
} else {
  ff([
    '-y', '-i', tmp,
    '-af', 'afade=t=in:st=0:d=0.4,areverse,afade=t=in:st=0:d=2.0,areverse',
    '-b:a', '128k', '-ar', '44100', '-ac', '2', out,
  ])
}

// clean up the intermediate wav (can be tens of MB)
rmSync(tmp, { force: true })

// report duration/size
const dur = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out]).toString().trim()
console.log(`\n✓ wrote ${out}  (${Number(dur).toFixed(1)}s)`)
