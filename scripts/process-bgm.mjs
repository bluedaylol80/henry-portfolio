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
import { existsSync } from 'node:fs'

const args = process.argv.slice(2)
const input = args.find((a) => !a.startsWith('--'))
const seamless = args.includes('--seamless')
const outArg = args.find((a) => a.startsWith('--out='))
const out = outArg ? outArg.slice('--out='.length) : 'public/music/jazz-room.mp3'

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
  // crossfade the tail into the head for a gapless loop
  ff([
    '-y', '-i', tmp, '-i', tmp,
    '-filter_complex', '[0][1]acrossfade=d=4:c1=tri:c2=tri',
    '-b:a', '128k', '-ar', '44100', '-ac', '2', out,
  ])
} else {
  ff([
    '-y', '-i', tmp,
    '-af', 'afade=t=in:st=0:d=0.4,areverse,afade=t=in:st=0:d=2.0,areverse',
    '-b:a', '128k', '-ar', '44100', '-ac', '2', out,
  ])
}

// report duration/size
const dur = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out]).toString().trim()
console.log(`\n✓ wrote ${out}  (${Number(dur).toFixed(1)}s)`)
