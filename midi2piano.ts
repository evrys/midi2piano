
import struct from 'python-struct'
import { Buffer } from 'buffer'
import { parseMidi } from 'midi-file';


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

type NoteEvent = {
  duration: number
  note: number
}

// def obtain_sheet_music(score, most_frequent_dur):
//     """
//     Returns unformated sheet music from score
//     """
//     result = ""

//     octaves = [3 for i in range(12)]
//     accidentals = [False for i in range(7)]
//     for event in score:
//         for note_indx in range(len(event[0])):
//             data = notenum2string(event[0][note_indx], accidentals, octaves)
//             result += data[0]
//             accidentals = data[1]
//             octaves = data[2]
//             if note_indx != len(event[0])-1:
//                 result += '-'

//         if event[1] != most_frequent_dur: # Quarters are default
//             result += '/'
//             result += dur2mod(event[1], most_frequent_dur)
//         result += ','

//     return result

export function midi2piano(midiFile: ArrayBuffer): string {
  const midi = parseMidi(new Uint8Array(midiFile))

  const ticksPerBeat = midi.header.ticksPerBeat || 1000

  const track = midi.tracks[0]

  let ticksPassed = 0
  console.log(track)

  const score: NoteEvent[] = []

  // Record of currently activated notes and when they were activated
  const notesActivated: Record<number, number> = {}

  for (const event of track) {
    if (!('meta' in event)) {
      ticksPassed += ticksPerBeat + event.deltaTime
    }

    if (event.type === 'noteOn') {
      notesActivated[event.noteNumber] = ticksPassed
    } else if (event.type === 'noteOff') {
      score.push({
        duration: ticksPassed - notesActivated[event.noteNumber],
        note: event.noteNumber
      })
    }
  }

  console.log(score)




  // 

// def filter_start_time_and_note_num(score):
//     """
//     Recreates score with only note numbers and start time of each note and returns new score
//     """
//     return list(map(
//         lambda score_track: list(map(
//             lambda event: [event[1], event[4]],
//             score_track)),
//         score))




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

  return ""

  // return sheet_music
}
