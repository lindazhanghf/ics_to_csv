import { argv } from 'node:process';
import { readFile, writeFile } from 'node:fs/promises';
import parser from 'vdata-parser';

if (argv.length <= 2) {
    throw new Error('Missing filename!! Try again with arguments e.g. \n[$ node ics_to_csv.js file_to_parse.ics]');
}

let parsed_events = []
readFile(argv[2], 'utf-8')
  .then(file_content => {
    const all_lines = file_content.split(/\r?\n/) // split to line by line

    console.log(`total num lines read from file: ${all_lines.length}`)

    let event_chunk = ''
    let skip_chunk = true

    all_lines.forEach((line, index) => {
      /// start at the next chunk, process the current chunk then clear out
      if (line.startsWith('BEGIN:')) {
        console.log(event_chunk)
        if (!skip_chunk) {
          ParseEventByChunk(event_chunk)
        }

        /// clear out the chunk to prepare an empty canvas for the next chunk
        event_chunk = ''
        skip_chunk = !line.startsWith('BEGIN:VEVENT')
        console.log(`\nLine ${index}\t` + (skip_chunk ? 'SKIP' : ''))
      }

      if (!skip_chunk) {
        event_chunk += line + `\n`
      }
    })
  })
  .catch(console.error)

  function CleanEscapeCharacters(line) {
    line = line.replaceAll('\\n', '  ') // new lines shows up as \n in .ics => replace with spaces
    line = line.replaceAll('\\', '') // simply remove any other escape characters aka backslash
    return line
  }

function ParseEventByChunk(event_chunk) {
  event_chunk = CleanEscapeCharacters(event_chunk)
  const parsed_event = parser.fromString(event_chunk)['VEVENT']
  if (parsed_event == null) {
    return
  }
  let keys = Object.keys(parsed_event)
  console.log(`keys: ${keys}`)
  console.log(parsed_event)

  parsed_events.push(parsed_event)
  if (parsed_events.length > 20) { // testing 20 events for now
    process.exit()
  }
}
