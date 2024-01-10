
// Creates terminal and updates it's options.
let terminal = new Terminal({
    // Declaring font here breaks the font somehow.
    allowProposedApi: true,
    fontWeight: 450,
    fontSize: 14,
    cursorBlink: 'true',
    convertEol: true,
    scrollSensitivity: .25,
    theme: {
        background: 'black',
        cursor: '#a800a8',
      }
  })

let fitAddon = new FitAddon.FitAddon()
let webLinksAddon = new WebLinksAddon.WebLinksAddon()
terminal.loadAddon(webLinksAddon);
terminal.loadAddon(fitAddon)

const aboutTerminal = document.getElementById('about-terminal');
const testTerminal = document.getElementById('test-terminal');
const terminalElement = aboutTerminal || testTerminal;
terminal.open(terminalElement);

// Slight delay to ensure font loads.
setTimeout(checkTerminal, 400)
fitAddon.fit()
terminal.focus()
setTimeout(textOutputMain, 600)
// On resize runs fit() and checks font size.
window.addEventListener('resize', checkTerminal)

// Important due to delay in loading custom font.
function checkTerminal() {
    terminal.options.fontFamily = 'DOS'
    terminal.options.fontSize = 14
    fitAddon.fit()
}

// Async wrapper for text functions.
async function textOutputMain() {
    let baseFile = await getTextFromFile('base-terminal.txt')
    let aboutFile = null
    if (aboutTerminal !== null) {
        aboutFile = await getTextFromFile('about-terminal.txt')
    }
    if (testTerminal !== null) {
        testFile = await getTextFromFile('rpc-test-terminal.txt')
        baseFile = baseFile + testFile
    }
    introText()

    // Types text into terminal upon load.
    async function introText() {
        for(var i = 0; i < baseFile.length; i++) {
            (function(i){
                setTimeout(function() {
                    terminal.write(baseFile[i])
                    if ((baseFile.length - 1) == (i)) { 
                        checkTerminal()
                        if (aboutTerminal !== null) {
                            setTimeout(aboutText, 1, 10 , 0)
                        } 
                    }
                }, 1 * i)
            }(i))
        }

    }
    // Types additional text into home screen.
    async function aboutText(time, index) {
        if ((aboutFile.length - 1) == (index)) {
            checkTerminal()
            setTimeout(introText, 1000, 0, 0);
        } else {
            terminal.write(aboutFile[index])
            setTimeout(aboutText, time, (time + .09), (index + 1));
        }
    }
    async function getTextFromFile(fileName) {
        var response = await fetch(`/assets/${fileName}`);
        let aboutFile = await response.text()
        return aboutFile
    }

}

// Very basic typing interface.
let keyboardStatus = false
function toggleKeyboard() {
    terminal.focus()
    var cmd = ''
    consoleUser()
    if (keyboardStatus === true) { 
        return 
    } else {
        keyboardStatus = true
        let keyboard = terminal.onKey(e => {
            if (e.key === '\r') {
                terminal.write('\r\n')
                keyboardStatus = false
                runCommand(cmd)
                keyboard.dispose()
                cmd = ''
            } else if (e.key === '\x7F') {
                terminal.write('\b \b')
                cmd = cmd.slice(0, -1) 
            } else {
                terminal.write(e.key)
                cmd += e.key
            }
        })
    }
    checkTerminal()
}
// Very basic CLI.
function runCommand(cmd) {
    switch (cmd) {
        case '':
            terminal.write('\r\n')
            toggleKeyboard()
            break
        case 'about':
            window.location.href = '/pages/about'
            terminal.write('\r\n')
            break
        case 'rpc-speed-comparison':
            window.location.href = '/'
            break
        default:
            terminal.write('   Command does not exist.')
            terminal.write('\r\n')
            toggleKeyboard()
            break
    }
}
// Prints '$' at start of new lines.
function consoleUser() {
    terminal.write('\x1b[38215420550m $ \x1b[382255255255m')
}






