
async function fetchTest() {
  const orgs = {'control': 'https://google.com/', stackpath: 'https://p4p2r9v3.stackpathcdn.com/'};
  let controlAverage;
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
    // Sets average of control for baseline. 
    if (org === 'control') {
      controlAverage = a;
    }
    // (ttfb)
    updateTableFields(org, a, 3);
    // (ttfb - control)
    updateTableFields(org, (a - controlAverage), 4);
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

function updateTableFields(org, a, col) {
  // Sets col variable based on org.
  switch (org) {
    case 'control':
      var row = 0;
      break;
    case 'stackpath':
      var row = 1;
      break;
    case 'imperva':
      var row = 2;
    case 'aws':
      var row = 3;
    case 'cloudflare':
      var row = 4;
    case 'fastly':
      var row = 5;
  }
  
  if (org === 'control' && col === 4) {
    return;
  }

  // org = 0, ranks = 1, % lead = 2, ttfb = 3, ttfb - control = 4
  myBody = document.getElementsByTagName("body")[0];
  myTable = myBody.getElementsByTagName("table")[0];
  myTableBody = myTable.getElementsByTagName("tbody")[0];
  myRow = myTableBody.getElementsByTagName("tr")[row];
  myCell = myRow.getElementsByTagName("td")[col];
  myCell.innerText = Math.round(a * 10) / 10 + 'ms';
}