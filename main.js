// Creates terminal and updates it's options.
const terminal = new Terminal({
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

const fitAddon = new FitAddon.FitAddon()
const webLinksAddon = new WebLinksAddon.WebLinksAddon()
terminal.loadAddon(webLinksAddon);
terminal.loadAddon(fitAddon)
homeTerminal = document.getElementById('homeTerminal')
if (homeTerminal === null) {
    terminal.open(document.getElementById('terminal'))
} else {
    terminal.open(homeTerminal)
}
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
    const introFile = await getIntroTextFile()
    let homeFile = null
    if (homeTerminal !== null) {
        homeFile = await gethomeTextFile()
    }
    introText()

    // Types text into terminal upon load.
    async function introText() {
        for(var i = 0; i < introFile.length; i++) {
            (function(i){
                setTimeout(function() {
                    terminal.write(introFile[i])
                    if ((introFile.length - 1) == (i)) { 
                        checkTerminal()
                        if (homeTerminal !== null) {
                            setTimeout(homeText, 1, 10 , 0)
                        } else {
                            toggleKeyboard()     
                        }
                    }
                }, 1 * i)
            }(i))
        }
    }
    // Types additional text into home screen.
    async function homeText(time, index) {
        if ((homeFile.length - 1) == (index)) {
            checkTerminal()
            setTimeout(introText, 1000, 0, 0);
        } else {
            terminal.write(homeFile[index])
            setTimeout(homeText, time, (time + .09), (index + 1));
        }
    }
    async function gethomeTextFile() {
        var response = await fetch('homeText.txt')
        const homeFile = await response.text()
        return homeFile
    }
    async function getIntroTextFile() {
        var response = await fetch('terminal.txt')
        const introFile = await response.text()
        return introFile
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
            terminal.write('   Command not implemented.')
            terminal.write('\r\n')
            toggleKeyboard()
            break
        case 'home':
            window.location.href = '/'
            terminal.write('\r\n')
            break
        // case 'waf-test':
        //     window.location.href = '/waf/waf.html'
        //     break
        // case 'waf-test-start':
        //     fetchTest()
        //     return
        // case 'waf-test-about':
        //     terminal.write('\r\n')
        //     wafTestAbout()
        //     break    
        case 'rpc-speed-comparison':
            window.location.href = '/rpc-speed-comparison'
            break
        // case 'rpc-com-test-start':
        //     rpcTest(rpcns)
        //     return
        // case 'rpc-com-test-about':
        //     terminal.write('\r\n')
        //     rpcTestAbout()
        //     break
        case 'rpc-geo-demo':
            window.location.href = '/rpc-geo-demo'
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






