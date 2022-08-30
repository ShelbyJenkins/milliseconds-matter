// Creates terminal and updates it's options.
const terminal = new Terminal({
    cols: 124,
    rows: 30,
    fontSize: 12,
    fontWeight: 450,
    fontFamily: 'DOS',
    cursorBlink: 'true',
    convertEol: true,
    theme: {
        background: 'black',
        cursor: 'yellowgreen',
      }
});