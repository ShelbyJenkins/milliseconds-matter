
// Creates terminal and updates it's options.
const terminal = new Terminal({
    cols: 124,
    rows: 20,
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
const fitAddon = new FitAddon.FitAddon();
terminal.loadAddon(fitAddon);
terminal.open(document.getElementById('terminal'));
fitAddon.fit();
terminal.focus();

// On resize or reload runs fit().
window.onresize = function(){ location.reload(); }
window.addEventListener('load', function () {
    fitAddon.fit();
  })

// Types text into terminal upon load.
function introText() {
    fetch('/terminalText.txt')
    .then(response => response.text())
    .then((text) => {
      for(i = 0; i < text.length; i++) {
        (function(i){
            setTimeout(function() {
                terminal.write(text[i]);
            }, 1 * i);
        }(i));
        } 
    })
    setTimeout(consoleUser, 1000);
}
// Very basic typing interface.
var cmd = '';
terminal.onKey(e => {
    if (e.key === '\r') {
        terminal.write('\r\n');
        terminal.write('\r\n');
        runCommand(cmd);
        cmd = '';
    } else if (e.key === '\x7F') {
        terminal.write("\b \b");
        cmd = cmd.slice(0, -1); 
    } else {
        terminal.write(e.key);
        cmd += e.key;
    }
})
// Very basic CLI.
function runCommand(cmd) {
    switch (cmd) {
        case '':
            break;
        case 'about':
            terminal.write('   Command not implemented.');
            terminal.write('\r\n');
            break;
        case 'home':
            window.location.href = '/';
            terminal.write('\r\n');
            break;
        case 'waf-test':
            window.location.href = '/waf/waf.html';
            break;
        case 'rpc-test':
            terminal.write('   Command not implemented.');
            terminal.write('\r\n');
            break;
        default:
            terminal.write('   Command does not exist.');
            terminal.write('\r\n');
    }
    terminal.write('\r\n');
    consoleUser();
}
// Prints '$' at start of new lines.
function consoleUser() {
    terminal.write('\x1b[38;2;168;0;168m $ \x1b[38;2;255;255;255m');
}

introText()



