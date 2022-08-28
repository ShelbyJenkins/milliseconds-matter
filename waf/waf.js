
async function fetchTest() {
  const orgs = {'control': 'https://google.com/', stackpath: 'https://p4p2r9v3.stackpathcdn.com/'};
  var cmd = '';
  for (var [key, value] of Object.entries(orgs)) {
      await test(key, value);
    };

  async function test(org, url) {
    let a = 0;
    for (let t = 0; t < 3; t++) {
      const t0 = performance.now()
      try {
          const response = await fetch(url);
      } catch (error) {
          const t1 = performance.now()
          terminal.write('\r\n');
          terminal.write(`   ` + org + ` response time from ` + url + ` took ${t1 - t0} milliseconds.`);
          a += (t1 - t0)
      }   
    }
    a /= 3;
    terminal.write('\r\n');
    terminal.write(`   ` + org + ` average response time ` + a + ` milliseconds.`);
    return 1;
  }
  terminal.write('\r\n');
  terminal.write('\r\n');
  toggleKeyboard();
}

function wafTestAbout() {
  fetch('terminalTextWaf.txt')
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
}