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
          const parsed_event = parser.fromString(event_chunk)['VEVENT']
          if (parsed_event != null) parsed_events.push(parsed_event)

          if (parsed_events.length > 10) {
            parsed_events.forEach(event => console.log(event))
            process.exit()
          }
        }

        /// clear out the chunk to prepare an empty canvas for the next chunk
        event_chunk = ''
        skip_chunk = !line.startsWith('BEGIN:VEVENT')
        console.log(`Line ${index}\t${skip_chunk}`)
      }

      if (!skip_chunk) {
        event_chunk += CleanEscapeCharacters(line) + `
` // add a new line
      }
    })
  })
  .catch(console.error)

  function CleanEscapeCharacters(line) {
    line = line.replaceAll('\\n', '  ') // new lines shows up as \n in .ics => replace with spaces
    line = line.replaceAll('\\', '') // simply remove any other escape characters aka backslash
    return line
  }
