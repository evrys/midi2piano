<script setup lang="ts">
import { onMounted } from 'vue';
import { defineState } from 'vue-define-state'
import struct from 'python-struct'
import { Buffer } from 'buffer'

const LINE_LENGTH_LIM = 50
const LINES_LIMIT = 200
const TICK_LAG = 0.5
const OVERALL_IMPORT_LIM = 2*LINE_LENGTH_LIM*LINES_LIMIT
const END_OF_LINE_CHAR = `
` // BYOND can't parse \n and we are forced to define my own NEWLINE char

const OCTAVE_TRANSPOSE = 0 // Change here to transpose melodies by octaves
const FLOAT_PRECISION = 2 // Change here to allow more or less numbers after dot in floats

const OCTAVE_KEYS = 12
const HIGHEST_OCTAVE = 8

const TIME_QUANTA = 100 * TICK_LAG

const decoder = new TextDecoder()

function midi2scoreWithoutTicks(midi: ArrayBuffer) {

}

function midi2opus(midi: ArrayBuffer) {
  let myMidi = new Uint8Array(midi)
  if (myMidi.length < 4) {
    return [1000, []]
  }
  const id = myMidi.slice(0, 4)

  if (decoder.decode(id) !== 'MThd') {
    console.warn(`midi2opus: midi starts with ${id} instead of 'MThd'`)
    return [1000, []]
  }

  const [length, format, tracksExpected, ticks] = struct.unpack('>IHHH', 
    Buffer.from(myMidi.slice(4, 14))
  )

  if (length !== 6) {
    console.warn(`midi2opus: midi header length was ${length} instead of 6`)
    return [1000, []]
  }

  const myOpus = [ticks]
  myMidi = myMidi.slice(14)
  let trackNum = 1

  while (myMidi.length >= 8) {
    const trackType = myMidi.slice(0, 4)
    if (decoder.decode(trackType) !== 'MTrk') {
      console.warn(`midi2opus: Warning: track #${trackNum} type is ${trackType} instead of 'MTrk'`)
    }
      
    const [trackLength] = struct.unpack('>I', Buffer.from(myMidi.slice(4, 8))) as [number]
    myMidi = myMidi.slice(8)

    if (trackLength > myMidi.length) {
      console.warn(`midi2opus: track #${trackNum} length ${trackLength} is too large`)
      return myOpus
    }

    const myMidiTrack = myMidi.slice(0, trackLength)
    const myTrack = decode(myMidiTrack)
  }



  //   if length != 6:
  //       _warn("midi2opus: midi header length was "+str(length)+" instead of 6")
  //       _clean_up_warnings()
  //       return [1000,[],]
  //   my_opus = [ticks,]
  //   my_midi = my_midi[14:]
  //   track_num = 1   # 5.1
  //   while len(my_midi) >= 8:
  //       track_type   = bytes(my_midi[0:4])
  //       if track_type != b'MTrk':
  //           _warn('midi2opus: Warning: track #'+str(track_num)+' type is '+str(track_type)+" instead of b'MTrk'")
  //       [track_length] = struct.unpack('>I', my_midi[4:8])
  //       my_midi = my_midi[8:]
  //       if track_length > len(my_midi):
  //           _warn('midi2opus: track #'+str(track_num)+' length '+str(track_length)+' is too large')
  //           _clean_up_warnings()
  //           return my_opus   # 5.0
  //       my_midi_track = my_midi[0:track_length]
  //       my_track = _decode(my_midi_track)
  //       my_opus.append(my_track)
  //       my_midi = my_midi[track_length:]
  //       track_num += 1   # 5.1
  //   _clean_up_warnings()
  //   return my_opus

}

function midi2piano(midi: ArrayBuffer): string {
  // let score = midi2scoreWithoutTicks(midi)
  // score = filter_events_from_score(score)
  // score = filter_start_time_and_note_num(score)
  // score = filter_empty_tracks(score)
  // score = merge_events(score)
  // score = sort_score_by_event_times(score)
  // score = convert_into_delta_times(score)
  // score = perform_roundation(score)
  // const mostFrequentDur = obtain_common_duration(score)
  // score = reduce_score_to_chords(score)
  // let sheet_music = obtain_sheet_music(score, mostFrequentDur)
  // const split_music = explode_sheet_music(sheet_music)
  // sheet_music = finalize_sheet_music(split_music, mostFrequentDur)

  const opus = midi2opus(midi)

  return ""

  // return sheet_music
}

const state = defineState({
  input: null as ArrayBuffer | null,

  get output() {
    return this.input ? midi2piano(this.input) : ""
  }
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

onMounted(async () => {
  const dataURI = `data:audio/midi;base64,TVRoZAAAAAYAAAABABhNVHJrAAAArgDwCkEQQhJAAH8AQfcA8ApBEEISQBAVABv3AP8GH0NvbnZlcnRlZCBieSBTZXF1ZW5jZVJpcHBlciAyLjAAsFtPALFbTwCwB2oA/1EDBkVOAMACALEHagDBAwCRNGwAkFNaDIE0bAyAU1oAkTRsAJBTWgyBNGwMgFNaAJE0bACQU1oMgTRsAIBTWgCROGwAkFBaDIE4bACAUFoAkTRsAJBYWiSBNGwMgFhaAP8vAA==`
  state.input = await (await fetch(dataURI)).arrayBuffer()
})
</script>

<template>
  <main>
    <div class="container">
      <h1>SS13 midi2piano</h1>
      <input type="file" @change="onFileUpload"/>
      <div class="output">
        {{ state.output }}
      </div>
    </div>
  </main>
</template>

<style scoped>
  main {
    padding-top: 10rem;
  }
</style>
