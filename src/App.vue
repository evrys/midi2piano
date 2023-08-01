<script setup lang="ts">
import { compile, onMounted } from 'vue';
import { defineState } from 'vue-define-state'


const POKEMON_CENTER = `BPM: 300
D6-D7,A6-A,F#6-D,A-A7,D6,A6-G7,F#,A-F#7,E6-E7
A-C#7,G6,A,E6,A,G,A,E-C#,A-A,G-C#,A-F#,E,A-E7,G
A-C#,D-D7,A-F#,B6,C#,D,C#,B,A,D6-D7,A-A,F#6-D
A-A7,D6,A6-G7,F#,A-F#7,E6-E7,A-C#,G6,A,E6,A,G,A
E-C#,A-A,G-C#,A-F#,E,A-E7,G,A-C#,D-D7,A,F#6,A
D6,A,F#,A,D-F#7,A,F#6,A,D-A7,A6,F#,A,G7-D,A7-B
G-G6,F#7-B,D-E,B,G,B,E6-C#,A6,G,A,C#6-E7,A,G,A
F#-D,G7-A,F#-F#6,E-A,F#-D7,A,G#6,A,D6-F#7,A,F#6
A,D-A7,A6,F#,A,Gn-G6,F#7-E,G7-B,A7-E,G6-B7,E,B6
E,E6-A,A6,G7-G6,F#-A,E-G7,A,G6,A,F#-D,G7-A
F#-F#6,E7-A,D-D7,E6,F#,G6,D6-D7,A-A,F#-D,A-A7
D6,A6-G7,F#,A-F#7,E-E7,A-C#7,G6,A,E6,A,G,A,E-C#
A-A,G-C#,A-F#,E,A-E7,G,A-C#,D-D7,A-F#,B,C#,D,C#
B,A,D6-D7,A-A,F#6-D,A-A7,D6,A6-G7,F#,A-F#7
E6-E7,A-C#,G6,A,E6,A,G,A,E-C#,A-A,G-C#,A-F#,E
A-E7,G,A-C#,D-D7,A,F#6,A,D6,A,F#,A,D-F#7,A,F#6
A,D-A7,A6,F#,A,G7-D,A7-B,G-G6,F#7-B,D-E,B,G,B
E6-C#,A6,G,A,C#6-E7,A,G,A,F#-D,G7-A,F#-F#6,E-A
F#-D7,A,G#,A,D6-F#7,A,F#6,A,D-A7,A6,F#,A,Gn-G6
F#7-E,G7-B,A7-E,G6-B7,E,B6,E,E6-A,A6,G7-G6,F#-A
E-G7,A,G6,A,F#-D,G7-A,F#-F#6,E7-A,D-D7,E6,F#,G6
F#-A-D6-D7,A,D6-A-F#-D7,A7,F#-A6-D6,G7,D-A-F#
F#7,E-G6-A-E7,C#7,E6-A-G/0.44,G-A-E/0.44
E-A-G/0.44,G-A-E-C#,A,E-A-G-C#,F#,G-A-E,E7
E6-A-G,C#,F#6-A-D-D7,F#7,D6-F#6-A/0.44,A-D-D7
A-E-C#,A-F#-B,G-A,F#-A-D6-D7,A,D6-A-F#-D7,A7
F#-A6-D6,G7,D-A-F#,F#7,G6-A-E-E7,C#,E6-A-G/0.44
G-A-E/0.44,E-A-G/0.44,G-A-E-C#,A,E-A-G-C#,F#
G-A-E,E7,E6-A-G,C#,D-D7,A,F#6,A,D6-F#-A/0.2`

const state = defineState({
  input: null as ArrayBuffer | null,
  track: POKEMON_CENTER,

  // get output() {
  //   return this.input ? midi2piano(this.input) : ""
  // }
});

function onFileUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    console.log(reader.result)
    state.input = reader.result as ArrayBuffer
  };
  reader.readAsArrayBuffer(file);
}


// _song.dm
const MUSIC_MAXLINES = 1000
const MUSIC_MAXLINECHARS = 300

// instrument_defines.dm
const INSTRUMENT_MIN_OCTAVE = 1
const INSTRUMENT_MAX_OCTAVE = 9
const INSTRUMENT_MIN_KEY = 0
const INSTRUMENT_MAX_KEY = 127


const NOTE_OFFSET_LOOKUP = [9, 11, 0, 2, 4, 5, 7]


const ACCENT_LOOKUP: {[key: string]: number|undefined} = {
  'b': -1,
  's': 1,
  '#': 1,
  'n': 0
}


/**
 * /datum/song/proc/sanitize_tempo(new_tempo)
 * 
 * In-game this is based on the current value of world.tick_lag
 * meaning you can get a different song tempo at parse time depending
 * on how much the server is lagging...
 * 
 * In BYOND docs the default value of world.tick_lag is 1, so let's go with that
 * https://www.byond.com/docs/ref/#/world/var/tick_lag
 */
const WORLD_TICK_LAG = 1
const SECONDS = 10
const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);
function sanitizeTempo(newTempo: number) {
  newTempo = Math.abs(newTempo)

  return clamp(Math.round(newTempo), WORLD_TICK_LAG, 5 * SECONDS)


	// return clamp(round(new_tempo, world.tick_lag), world.tick_lag, 5 SECONDS)

}

/**
 * /datum/song/proc/parse_song(text)
 * 
 * Doesn't actually parse anything except
 * the BPM and splitting into lines...
 */
function parseSong(text: string) {
  const lines = text.split('\n')

  let bpm = 120
  const bpmInput = lines[0].match(/BPM: (\d+)/)?.[1]
  if (bpmInput) {
    bpm = parseInt(bpmInput)
    lines.shift()
  }
  const tempo = sanitizeTempo(600 / Math.round(bpm))

  if (lines.length > MUSIC_MAXLINES) {
    throw new Error(`Song has too many lines; max lines is ${MUSIC_MAXLINES}`)
  }

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].length > MUSIC_MAXLINECHARS) {
      throw new Error(`Line ${i + 1} is too long; max line length is ${MUSIC_MAXLINECHARS}`)
    }
  }

  return { tempo, lines }
}

/**
 * /datum/song/proc/compile_synthesized()
 * 
 * Where the actual chord parsing happens.
 */
function compileSynthesized({ tempo, lines }: { tempo: number, lines: string[] }) {
  const compiledChords = []
  const octaves = [3, 3, 3, 3, 3, 3, 3]
  const accents = ["n", "n", "n", "n", "n", "n", "n"]
  for (const line of lines) {
    const chords = line.toLowerCase().split(",")
    for (const chord of chords) {
      const compiledChord = []
      let tempodiv = 1
      const notesTempodiv = chord.split("/")
      const len = notesTempodiv.length
      if (len >= 2) {
        tempodiv = parseInt(notesTempodiv[1])
      }
      if (len) {
        const notes = notesTempodiv[0].split("-")
        for (const note of notes) {
          if (note.length === 0)
            continue

            // 0-6, A-G
            const key = note.charCodeAt(0) - 97
            if (key < 0 || key > 6)
              continue
            for (let i = 1; i < note.length; i++) {
              const octAcc = note.slice(i, i + 1)
              const num = parseInt(octAcc)
              if (!num) // it's an accidental
                accents[key] = octAcc
              else
                octaves[key] = clamp(num, INSTRUMENT_MIN_OCTAVE, INSTRUMENT_MAX_OCTAVE)
              compiledChord.push(
                clamp(
                  NOTE_OFFSET_LOOKUP[key] + octaves[key] * 12 + (ACCENT_LOOKUP[accents[key]]||0),
                  INSTRUMENT_MIN_KEY,
                  INSTRUMENT_MAX_KEY
                )
              )
              compiledChord.push(tempodiv)
              if (compiledChord.length) {
                compiledChords.push(compiledChord)
              }
            }
        }
      }
    }
  }
  return compiledChords
}
	// 		if(length(compiled_chord))
	// 			compiled_chords[++compiled_chords.len] = compiled_chord




onMounted(async () => {
  // const dataURI = `data:audio/midi;base64,TVRoZAAAAAYAAAABABhNVHJrAAAArgDwCkEQQhJAAH8AQfcA8ApBEEISQBAVABv3AP8GH0NvbnZlcnRlZCBieSBTZXF1ZW5jZVJpcHBlciAyLjAAsFtPALFbTwCwB2oA/1EDBkVOAMACALEHagDBAwCRNGwAkFNaDIE0bAyAU1oAkTRsAJBTWgyBNGwMgFNaAJE0bACQU1oMgTRsAIBTWgCROGwAkFBaDIE4bACAUFoAkTRsAJBYWiSBNGwMgFhaAP8vAA==`
  // state.input = await (await fetch(dataURI)).arrayBuffer()

  console.log(compileSynthesized(parseSong(state.track)))
})
</script>

<template>
  <main>
    <div class="container">
      <h1>SS13 midi2piano</h1>
      <!-- <input type="file" @change="onFileUpload"/>
      <div class="output">
        {{ state.output }}
      </div> -->
      <textarea v-model="state.track"></textarea>
      <button class="btn btn-success">Play</button>
    </div>
  </main>
</template>

<style scoped>
  main {
    padding-top: 10rem;
  }
</style>
