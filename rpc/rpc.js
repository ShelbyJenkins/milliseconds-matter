// Creates terminal and updates it's options.
const terminal = new Terminal({
  cols: 200,
  rows: 10,
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

// need to call this from json.
// Create nested objects containing all rpcn.
const rpcns = [
    { 
      rpcn    : 'user-locale',
      network : 'anycast',
      address : 'http://1.1.1.1',
      resT0   : 0,
      resT1   : 0,
      resT2   : 0,
      resA    : 0
    },
    { 
      rpcn    : 'na1', 
      address : 'http://1.1.1.1',
      network : 'private',
      rest0   : 0,
      resT1   : 0,
      resT2   : 0,
      resA    : 0
    },
    { 
      rpcn    : 'na2', 
      address : 'http://1.1.1.1',
      network : 'private',
      rest0   : 0,
      resT1   : 0,
      resT2   : 0,
      resA    : 0
    },
    { 
      rpcn    : 'eu', 
      address : 'http://1.1.1.1',
      network : 'private',
      rest0   : 0,
      resT1   : 0,
      resT2   : 0,
      resA    : 0
    },
    { 
      rpcn    : 'apac', 
      address : 'http://1.1.1.1',
      network : 'private',
      rest0   : 0,
      resT1   : 0,
      resT2   : 0,
      resA    : 0
    },
    { 
      rpcn    : 'na1', 
      address : 'http://1.1.1.1',
      network : 'public',
      resT0   : 0,
      resT1   : 0,
      resT2   : 0,
      resA    : 0
    },
    { 
      rpcn    : 'na2', 
      address : 'http://1.1.1.1',
      network : 'public',
      resT0   : 0,
      resT1   : 0,
      resT2   : 0,
      resA    : 0
    },
    { 
      rpcn    : 'eu', 
      address : 'http://1.1.1.1',
      network : 'public',
      resT0   : 0,
      resT1   : 0,
      resT2   : 0,
      resA    : 0
    },
    { 
      rpcn    : 'apac', 
      address : 'http://1.1.1.1',
      network : 'public',
      resT0   : 0,
      resT1   : 0,
      resT2   : 0,
      resA    : 0
    }
  ];

async function rpcTest(rpcns) {
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
  
  // Calls a single round of test on all rpcns. Waits till all tests are complete, and then tests again.
  // Performs the test 3 times to generate averages.
  for (let b = 0; b < 3; b++) {
    // Pauses loop until batch is complete.
    await Promise.all(rpcns.map(async (rpcn) => {
    await testSingle(rpcn, b);
    }));
  };

  // Single test within a batch.
  async function testSingle(rpcn, b) {
    // Returns promise when fetch succeeds or fails.
    return new Promise(async function(resolve, reject){
      // Performance.now() measures the time with higher presicision than date()/
      const t0 = performance.now()
      try {
          const response = await fetch(rpcn.address, {
            cache: 'no-cache',
          });
      } catch (error) {
          const t1 = performance.now();
          logTest((t1 - t0), rpcn, b);
          resolve();
      }
    });
  }
  postTest();
}

function logTest(r, rpcn, b) {
  // Updates rpcn objects with results of tests.
  const batch = 'resT' + b;
  r = Math.round(r);
  rpcn[batch] = r;
  terminal.write('\r\n');
  terminal.write(`    response from ` + rpcn.rpcn + ' @ ' + rpcn.address + ' took ' + r + ' milliseconds.');
}

function postTest() {
  let fastestA = Number.MAX_VALUE;
  let slowestA = 0;
   // Average of 3 runs.
   rpcns.forEach((rpcn) => {
    let a = 0;
    for (let b = 0; b < 3; b++) {
      const batch = 'resT' + b;
      a += rpcn[batch];
    }
    a /= 3;
    rpcn.resA = Math.round(a);
    // Sets slowest average.
    if (rpcn.resA > slowestA) {
      slowestA = rpcn.resA;
    }
    // Sets fastest average.
    if (rpcn.resA < fastestA) {
      fastestA = rpcn.resA;
    }
    terminal.write('\r\n');
    terminal.write(`    average response from ` + rpcn.rpcn + ' @ ' + rpcn.address + ' took ' + a + ' milliseconds.');
    // Populates table with response time averages, bests/worst, and graph.
    updateMainTableFields(rpcn);
  }) 
 
  // Updates slowest and fastest average scores in to best/worst table.
  updateSF(slowestA, fastestA);
  terminal.write('\r\n');
  terminal.write('\r\n');
  terminal.write('    about    home    waf-test-start    waf-test-about   rpc-test');
  terminal.write('\r\n');
  terminal.write('\r\n');
  toggleKeyboard();
}

function updateSF(slowestA, fastestA) {
  updateTable(0, 0, 0, (slowestA + 'ms'), false);
  updateTable(0, 0, 2, (fastestA + 'ms'), false);
  // Updates graph text.
  d = slowestA - fastestA;
  updateTable(0, 0, 1, (d + 'ms delta'), false);
  // Doing some tricks to make the graph look good.
  p = Math.round(((slowestA - fastestA) / fastestA) * 10);
  console.log(p);
  updateTable(0, 0, 1, p, true);

}

function updateTable(t, row, col, v, g) {
  myBody = document.getElementsByTagName("body")[0];
  myTable = myBody.getElementsByTagName("table")[t];
  if (g === true) {
    myTableBody = myTable.getElementsByTagName("thead")[0];
  } else {
    myTableBody = myTable.getElementsByTagName("tbody")[0];
  }
  myRow = myTableBody.getElementsByTagName("tr")[row];
  // Sets graph.
  if (g === true) {
    myCell = myRow.getElementsByTagName("th")[col];
    myDiv = myCell.querySelector("div");
    myDiv.classList.add('tui-chart-value', 'yellowgreen-168', 'rpc-table-chart');
    myDiv.insertAdjacentText('beforeend', v + '% delta');
    myDiv.style.width = v + '%';
    myDiv.style.color = 'white';
  } else {
    myCell = myRow.getElementsByTagName("td")[col];
    myCell.textContent += v;
  }
}
function updateMainTableFields(rpcn) {
  // Iterate through each field to be updated.
  switch (rpcn.network) {
    case 'public':
      fields(1);
      break;
    case 'private':
      fields(0);
      break;
    case 'anycast':
      fields(0);
      break;
  }
  function fields(row) {
    switch (rpcn.rpcn) {
      case 'na1':
        var col = 2;
        break;
      case 'na2':
        var col = 3;
        break;
      case 'eu':
        var col = 4;
        break;
      case 'apac':
        var col = 5;
        break;
      case 'user-locale':
        var col = 1;
        break;
    }
    updateTable(1, row, col, (rpcn.resA + 'ms'));
  }
}
  
function rpcTestAbout() {
  fetch('terminalTextRpc.txt')
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
