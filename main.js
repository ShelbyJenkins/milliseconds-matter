
// Creates terminal and updates options
const terminal = new Terminal({
    fontFamily: 'DOS',
    cursorBlink: 'true',
    convertEol: true,
  });
terminal.setOption('theme', { background: 'green' });
terminal.open(document.getElementById('terminal'));
terminal.focus();

terminal.write('$ ');
introText();

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
