
async function fetchTest() {
  // Create nested objects containing all orgs.
  const orgs = [
    { 
      org     : 'control',  
      url     : 'https://google.com/',
      rank    : 0,
      percent : 0,
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
      org     : 'stackpath1', 
      url     : 'https://p4p2r9v3.stackpathcdn.com/',
      rank    : 0,
      percent : 0,
      ttfb    : 0,
      actual  : 0
    }
  ];
  // Defines control average within main function scope.
  let controlAverage;

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
    // Sets results into orgs object.
    o.ttfb = a;
    // Skips control.
    if ((a - controlAverage) > 0 ) {
      o.actual = (a - controlAverage);
    } 
    return 1;
  }
  console.log('unsorted: ', orgs);
  postTest(orgs);
}

function postTest(orgs) {
  // Sort by actual.
  orgs.sort((a, b) => a.actual - b.actual);
  // Rank orgs.
  orgs.forEach((o, idx) => {
    o.rank = idx;
  });
  console.log('sorted and ranked: ', orgs);
  // Updates table with rank, ttfb, and actual.
  orgs.forEach((o) => {
    updateTableFields(o);
  })

  
  // Sorts tables.

  // Populates graph.

  terminal.write('\r\n');
  terminal.write('\r\n');
  toggleKeyboard();
}

function updateTableFields(o) {
  // Sets col variable based on org.
  switch (o.org) {
    case 'control':
      var row = 0;
      break;
    case 'stackpath':
      var row = 1;
      break;
    case 'stackpath1':
      var row = 2;
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
  // Iterate through each field to be updated.
  const fields = ['rank', 'ttfb', 'actual'];
  fields.forEach((f) => {
    console.log(f)
    switch (f) {
      case 'rank':
        var col = 1;
        var update = o.rank;
        break;
      case 'ttfb':
        var col = 3;
        var update = Math.round(o.ttfb * 10) / 10 + 'ms';
        break;
      case 'actual':
        var col = 4;
        var update = Math.round(o.actual * 10) / 10 + 'ms';
        break;
    }
    // Updates table!
    myBody = document.getElementsByTagName("body")[0];
    myTable = myBody.getElementsByTagName("table")[0];
    myTableBody = myTable.getElementsByTagName("tbody")[0];
    myRow = myTableBody.getElementsByTagName("tr")[row];
    myCell = myRow.getElementsByTagName("td")[col];
    myCell.innerText = update;
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