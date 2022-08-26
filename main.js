

// Creates terminal and updates options
const terminal = new Terminal({
    columns: 200,
    rows: 15,
    fontFamily: 'DOS',
    cursorBlink: 'true',
    convertEol: true,
    theme: {
        background: 'black',
        cursor: 'yellowgreen',
      }
});
const fitAddon = new FitAddon.FitAddon();
terminal.loadAddon(fitAddon);
terminal.open(document.getElementById('terminal-wrapper'));
fitAddon.fit();
terminal.focus();

consoleUser()
introText();

function consoleUser() {
    terminal.write('\x1b[38;2;168;0;168m $ \x1b[38;2;255;255;255m');


}
// Types text into terminal upon load
function introText () {
    const txt = "This is where the intro text will be.\n\nThere will be instructrions on how to proceed.\nAs well as options for next steps.";
    for(i = 0; i < txt.length; i++) {
        (function(i){
            setTimeout(function() {
                terminal.write(txt[i]);
            }, 10 * i);
        }(i));
    }
}
