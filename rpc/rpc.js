// Creates terminal and updates it's options.
const terminal = new Terminal({
  cols: 200,
  rows: 20,
  fontSize: 10,
  fontWeight: 450,
  fontFamily: 'DOS',
  cursorBlink: 'true',
  convertEol: true,
  theme: {
      background: 'black',
      cursor: 'yellowgreen',
    }
});

// Creates an array of objects from json file.
let rpcns = [];
async function fetchRpcns() {
  let response = await fetch('rpcns.json');
  let data = await response.json();
  rpcns = data;
};
fetchRpcns();

// Starts test.
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
    terminal.write('\r\n');
    terminal.write('    starting test batch ' + (b + 1) + ' of 3');
    terminal.write('\r\n');
    terminal.write(`    now testing: `)
    await Promise.all(rpcns.map(async (rpcn) => {
    await testSingle(rpcn, b);
    }));
  };
  
  // Single test within a batch.
  async function testSingle(rpcn, b) {
    // Returns promise when fetch succeeds or fails.
    return new Promise(async function(resolve, reject){
      terminal.write('    ' + rpcn.rpcn + ' ' +  rpcn.network + '...');  
      // Performance.now() measures the time with higher presicision than date()/
      const t0 = performance.now()
      try {
          const response = await fetch(rpcn.address, {
            method: 'POST',
            headers: {
              'mode': 'no-cors',
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify( {jsonrpc: "2.0", id: "null", method: "getTransactionCount"} )
          });
          r = await response.json()
          const t1 = performance.now();
          logTest((t1 - t0), rpcn, b, r.result);
          terminal.write('\r\n');
          terminal.write('\x1b[38;2;0;168;0m' + '    response from ' + rpcn.rpcn + ' ' + rpcn.network + ' @ ' + rpcn.address + ' took ' + Math.round((t1 - t0)) + ' milliseconds.' + '\x1b[39m');  
          resolve();      
      } catch (error) {
          terminal.write('\r\n');
          terminal.write('\x1b[38;2;168;0;0m ' + '    error testing ' + rpcn.rpcn + ' ' + rpcn.network + ' @ ' + rpcn.address + ' ' + error + '\x1b[39m');        
          logTest(999, rpcn, b);
          resolve();
      };
    });
  }

  // Post test actions.
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
    terminal.write('\r\n');
    terminal.write(`    average response from ` + rpcn.rpcn + ' ' + rpcn.network + ' @ ' + rpcn.address + ' took ' + a + ' milliseconds.');
      if (rpcn.provider === "stackpath") {
        // Sets slowest average.
      if (rpcn.resA > slowestA) {
        slowestA = rpcn.resA;
      }
      // Sets fastest average.
      if (rpcn.resA < fastestA) {
        fastestA = rpcn.resA;
      }
    }
  }) 
  // Populates table with response time averages, and highlights best/worse.
  rpcns.forEach((rpcn) => {
    if (rpcn.resA === slowestA) {
      updatePage(rpcn, true, false);
    } else if (rpcn.resA === fastestA) {
      updatePage(rpcn, false, true);
    } else {
      updatePage(rpcn);
    }
  });
  // Updates slowest and fastest average scores in to best/worst table.
  updateSF(slowestA, fastestA);
  terminal.write('\r\n');
  terminal.write(`    test complete`)
  terminal.write('\r\n');
  terminal.write('\r\n');
  terminal.write('    about    home    waf-test-start    waf-test-about   rpc-test');
  terminal.write('\r\n');
  terminal.write('\r\n');
  toggleKeyboard();
}
// Updates object after each test within a batch.
function logTest(r, rpcn, b, c) {
  // Updates rpcn objects with results of tests.
  const batch = 'resT' + b;
  r = Math.round(r);
  rpcn[batch] = r;
  if (c !== undefined ) {
    console.log(c);
    document.getElementById('solana-transaction-count').innerText = c;
  }
}
// Initialize update process.
function updatePage(rpcn, s, f) {
  // Iterate through each field to be updated.
  if (rpcn.provider === "stackpath") { 
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
    };
  function fields(row) {
    switch (rpcn.rpcn) {
      case 'sea':
        var col = 2;
        break;
      case 'mia':
        var col = 3;
        break;
      case 'fra':
        var col = 4;
        break;
      case 'sin':
        var col = 5;
        break;
      case 'user-locale':
        var col = 1;
        break;
    }
    updateTable(1, row, col, (rpcn.resA + 'ms'), false, s, f);
  }
  } else {
    switch (rpcn.rpcn) {
      case 'foundation':
        var col = 0;
        break;
      case 'serum':
        var col = 1;
        break;
      case 'quicknode':
        var col = 2;
        break;
      case 'blockdaemon':
        var col = 3;
        break;
      case 'allthatnode':
        var col = 4;
        break;
    }
    updateTable(2, 0, col, (rpcn.resA + 'ms'), false, false, false);
  }
}
// Updates tables.
function updateTable(t, row, col, v, g, s, f) {
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
    // Removes previous test's entry.
    while(myDiv.firstChild) {
      myDiv.removeChild(myDiv.firstChild);
    }
    myDiv.classList.add('tui-chart-value', 'yellowgreen-168', 'rpc-table-chart');
    myDiv.insertAdjacentText('beforeend', v + '% delta');
    if (v > 100) {
      myDiv.style.width = 100 + '%';

    } else {
      myDiv.style.width = v + '%';
    }
    myDiv.style.color = 'white';
  } else {
    myCell = myRow.getElementsByTagName("td")[col];
    // Removes previous test's entry.
    while(myCell.firstChild) {
      myCell.removeChild(myCell.firstChild);
    }
    myCell.textContent += v;
    // Highlights slowest and fastest.
    // if (s === true) {
    //   myCell.classList.add('red-168-text');
    // };
    // if (f === true) {
    //   myCell.classList.add('green-168-text');
    // };
  }
}
// Updates top table with slowest and fastest and graph.
function updateSF(slowestA, fastestA) {
  updateTable(0, 0, 0, (slowestA + 'ms'), false, false, false);
  updateTable(0, 0, 2, (fastestA + 'ms'), false, false, false);
  // Updates graph text.
  d = slowestA - fastestA;
  updateTable(0, 0, 1, (d + 'ms delta'), false);
  // Doing some tricks to make the graph look good.
  p = Math.round(((slowestA - fastestA) / fastestA) * 10);
  updateTable(0, 0, 1, p, true);
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
