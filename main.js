// Creates terminal and updates it's options.
const terminal = new Terminal({
    fontWeight: 450,
    cursorBlink: 'true',
    convertEol: true,
    theme: {
        background: 'black',
        cursor: '#a800a8',
      }
  });

const fitAddon = new FitAddon.FitAddon();
terminal.loadAddon(fitAddon);
terminal.open(document.getElementById('terminal'));
fitAddon.fit();
// Rechecks font size.
setTimeout(checkTerminal, 400);
setTimeout(introText, 500);
terminal.focus();

// Important due to delay in loading custom font.
function checkTerminal() {
    fitAddon.fit();
    terminal.setOption("fontSize", 14);
    terminal.setOption("fontFamily", 'DOS');
}

// On resize runs fit() and checks font size.
window.addEventListener('resize', checkTerminal)

// Types text into terminal upon load.
function introText() {
    fetch('terminal.txt')
    .then(response => response.text())
    .then((text) => {
        for(var i = 0; i < text.length; i++) {
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
        // case 'waf-test':
        //     window.location.href = '/waf/waf.html';
        //     break;
        // case 'waf-test-start':
        //     fetchTest();
        //     return;
        // case 'waf-test-about':
        //     terminal.write('\r\n');
        //     wafTestAbout();
        //     break;    
        case 'rpc-com-test':
            window.location.href = 'rpc-com-test';
            break;
        case 'rpc-com-test-start':
            rpcTest(rpcns);
            return;
        case 'rpc-com-test-about':
            terminal.write('\r\n');
            rpcTestAbout();
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
    terminal.write('\x1b[38;2;154;205;50m $ \x1b[38;2;255;255;255m');
}






