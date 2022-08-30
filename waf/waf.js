// Creates terminal and updates it's options.
const terminal = new Terminal({
  cols: 200,
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

async function fetchTest() {
  // Disables button after click to prevent multiple entries.
  const buttons = document.querySelectorAll('button');
  buttons.forEach((b) => {
      b.addEventListener('click', function(){ 
          buttons.forEach((b) => {
              b.disabled = true;
              setTimeout( function() {
                  b.disabled = false;
              }, 4000);
          });
      });
  });
  // Create nested objects containing all orgs.
  // Uses https://api.github.com/organizations for testing.
  const orgs = [
    { 
      org     : 'control',  
      url     : 'https://api.github.com/organizations',
      rank    : 0,
      percent : 100,
      graph   : 100,
      ttfb    : 0,
      actual  : 0
    },
    { 
      org     : 'StackPath', 
      url     : 'https://p4p2r9v3.stackpathcdn.com',
      rank    : 0,
      percent : 0,
      graph   : 0,
      ttfb    : 0,
      actual  : 0
    },
    { 
      org     : 'AWS CloudFront', 
      url     : 'https://d27kryaiszkpz.cloudfront.net',
      rank    : 0,
      percent : 0,
      graph   : 0,
      ttfb    : 0,
      actual  : 0
    }
  ];
  // Defines controls within main function scope.
  let controlAverage;
  let slowestActual = 0;

  // Iterates through each org and waits for completion before each.
  await orgs.reduce(async (memo, o) => {
    await memo;
    await test(o);
  }, undefined);

  async function test(o) {
    let a = 0;
    terminal.write('\r\n');
    terminal.write(`   Now Testing: ` + o.org);
    for (let t = 0; t < 3; t++) {
      // Performance.now() measures the time with higher presicision than date()/
      const t0 = performance.now()
      try {
          const response = await fetch(o.url, {
            cache: 'no-cache',
          });
          const t1 = performance.now();
          terminal.write('\r\n');
          terminal.write(`   ` + o.org + ` response time from ` + o.url + ` took ${t1 - t0} milliseconds.`);
          a += (t1 - t0);
      } catch (error) {
      }
    }
    // Average of 3 runs.
    a /= 3;
    terminal.write('\r\n');
    terminal.write(`   ` + o.org + ` average response time ` + a + ` milliseconds.`);
    // Sets average of control for baseline. 
    if (o.org === 'control') {
      controlAverage = a;
    }
    // Sets slowest actual.
    if ((a - controlAverage) > slowestActual) {
      slowestActual = (a - controlAverage);
    }
    // Sets results into orgs object.
    o.ttfb = a;
    // Sets average result in orgs object. Skips control.
    if ((a - controlAverage) > 0 ) {
      o.actual = (a - controlAverage);
    }
    return 1;
  }


  // Populates percentage. Skips control.
  let largestPercent = 0;
  orgs.forEach((o) => {
    if (o.org !== 'control') {
      o.percent = Math.round((((slowestActual - o.actual) / o.actual) * 100));
      // Gathers largest percentage for math.
      if (o.percent > largestPercent) {
        largestPercent = o.percent;
      }
    }
  });
  // Populates graph based off of largestPercent.
  orgs.forEach((o) => {
    o.graph = ((o.percent / largestPercent) * 100);
  });
  postTest(orgs);
}


function postTest(orgs) {
  // Sort by actual.
  orgs.sort((a, b) => a.actual - b.actual);
  // Rank orgs.
  orgs.forEach((o, idx) => {
    o.rank = idx;
  });
  // Populates table with rank, ttfb, and actual.
  orgs.forEach((o) => {
    updateTableFields(o);
  });
  
  terminal.write('\r\n');
  terminal.write('\r\n');
  terminal.write('   about    home    waf-test-start    waf-test-about   rpc-test');
  terminal.write('\r\n');
  terminal.write('\r\n');
  toggleKeyboard();
}

function updateTableFields(o) {
  // Sets col variable based on rank.
  var row = o.rank;
  // Iterate through each field to be updated.
  const fields = ['org', 'rank', 'percent', 'ttfb', 'actual'];
  fields.forEach((f) => {
    switch (f) {
      case 'org':
        var update = o.org;
        fields(0);
        break;
      case 'rank':
        var update = o.rank;
        fields(1);
        break;
      case 'percent':
        if (o.org === 'control') {
          graph('-');
          break;  
        } else {
          graph(o.percent, o.graph);
          break;
        };
      case 'ttfb':
        var update = Math.round(o.ttfb * 10) / 10 + 'ms';
        fields(3);
        break;
      case 'actual':
        var update = Math.round(o.actual * 10) / 10 + 'ms';
        fields(4);
        break;
    }
    function fields(col) {
      myBody = document.getElementsByTagName("body")[0];
      myTable = myBody.getElementsByTagName("table")[0];
      myTableBody = myTable.getElementsByTagName("tbody")[0];
      myRow = myTableBody.getElementsByTagName("tr")[row];
      myCell = myRow.getElementsByTagName("td")[col];
      myCell.textContent = update;
    
    }
    function graph(p, g) {
      // Doing some tricks to make the graph look good.
      if (p !== '-') {
        percent =  p  + '%';
      } else {
        percent = p;
      }
      myBody = document.getElementsByTagName("body")[0];
      myTable = myBody.getElementsByTagName("table")[0];
      myTableBody = myTable.getElementsByTagName("tbody")[0];
      myRow = myTableBody.getElementsByTagName("tr")[row];
      myCell = myRow.getElementsByTagName("td")[2];
      myDiv = myCell.querySelector("div");
      myDiv.style.width = g + '%';
      while(myDiv.firstChild) {
        myDiv.removeChild(myDiv.firstChild);
      }
      myDiv.insertAdjacentText('beforeend', percent);
    };
  });
  
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

