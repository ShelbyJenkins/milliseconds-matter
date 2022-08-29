
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
    fetch('terminalText.txt')
    .then(response => response.text())
    .then((text) => {
        for(i = 0; i < text.length; i++) {
            (function(i){
                setTimeout(function() {
                    terminal.write(text[i]);
                    if ((text.length - 1) == (i)) { 
                        toggleKeyboard();
                    };
                }, 1 * i);
            }(i));
            } 
    })
    fitAddon.fit();
}
// Very basic typing interface.
let keyboardStatus = false;
function toggleKeyboard() {
    terminal.focus();
    var cmd = '';
    consoleUser();
    if (keyboardStatus === true) { 
        return ;
    } else {
        keyboardStatus = true;
        let keyboard = terminal.onKey(e => {
            if (e.key === '\r') {
                terminal.write('\r\n');
                keyboardStatus = false;
                runCommand(cmd);
                keyboard.dispose()
                cmd = '';
            } else if (e.key === '\x7F') {
                terminal.write("\b \b");
                cmd = cmd.slice(0, -1); 
            } else {
                terminal.write(e.key);
                cmd += e.key;
            }
        })
    }
}
// Very basic CLI.
function runCommand(cmd) {
    switch (cmd) {
        case '':
            terminal.write('\r\n');
            toggleKeyboard();
            break;
        case 'about':
            terminal.write('   Command not implemented.');
            terminal.write('\r\n');
            toggleKeyboard();
            break;
        case 'home':
            window.location.href = '/';
            terminal.write('\r\n');
            break;
        case 'waf-test':
            window.location.href = '/waf/waf.html';
            break;
        case 'waf-test-start':
            fetchTest();
            return;
        case 'waf-test-about':
            terminal.write('\r\n');
            wafTestAbout();
            break;    
        case 'rpc-test':
            terminal.write('   Command not implemented.');
            terminal.write('\r\n');
            toggleKeyboard();
            break;
        default:
            terminal.write('   Command does not exist.');
            terminal.write('\r\n');
            toggleKeyboard();
            break;
    }
}
// Prints '$' at start of new lines.
function consoleUser() {
    terminal.write('\x1b[38;2;168;0;168m $ \x1b[38;2;255;255;255m');
}

introText()




