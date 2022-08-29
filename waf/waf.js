
async function fetchTest() {
  // Create nested objects containing all orgs.
  const orgs = [
    { 
      org     : 'control',  
      url     : 'https://google.com/',
      rank    : 0,
      percent : 100,
      ttfb    : 0,
      actual  : 0
    },
    { 
      org     : 'stackpath', 
      url     : 'https://p4p2r9v3.stackpathcdn.com/',
      rank    : 0,
      percent : 0,
      ttfb    : 0,
      actual  : 0
    },
    { 
      org     : 'error.com', 
      url     : 'https://error.com',
      rank    : 0,
      percent : 0,
      ttfb    : 0,
      actual  : 0
    }
  ];
  // Defines control average within main function scope.
  let controlAverage;
  let slowestActual = 0;

  // Iterates through each org and waits for completion before each.
  await orgs.reduce(async (memo, o) => {
    await memo;
    await test(o);
  }, undefined);

  async function test(o) {
    let a = 0;
    for (let t = 0; t < 3; t++) {
      // Performance.now() measures the time with higher presicision than date()/
      const t0 = performance.now()
      try {
          const response = await fetch(o.url);
      } catch (error) {
          const t1 = performance.now()
          terminal.write('\r\n');
          terminal.write(`   ` + o.org + ` response time from ` + o.url + ` took ${t1 - t0} milliseconds.`);
          a += (t1 - t0)
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
    if (a > slowestActual) {
      slowestActual = a;
    }
    // Sets results into orgs object.
    o.ttfb = a;
    // Sets average results and graph in orgs object. Skips control.
    if ((a - controlAverage) > 0 ) {
      o.actual = (a - controlAverage);
    }
    return 1;
  }

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
  })
  // Populates graph.
  // (old-new)/new x 100% = %
  

  terminal.write('\r\n');
  terminal.write('\r\n');
  toggleKeyboard();
}

function updateTableFields(o) {
  // Sets col variable based on rank.
  var row = o.rank;
  // Iterate through each field to be updated.
  const fields = ['org', 'percent', 'rank', 'ttfb', 'actual'];
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
      // case 'percent':
      //   var update = o.percent;
      //   fields(2);
      //   break;  
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
      myCell.innerText = update;
    }
    function graph(percent) {

    }

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