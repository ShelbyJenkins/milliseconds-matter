// Creates terminal and updates it's options.
const terminal = new Terminal({
  cols: 200,
  rows: 15,
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
createRPCList();
async function createRPCList() {
  let response = await fetch('rpcns.json');
  let data = await response.json();
  rpcns = data;
};
// Main Function.
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
  };
  // Post test actions.
  let fastestA = Number.MAX_VALUE;
  let slowestA = 0;
   // Averages 3 runs and updates averages on table.
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
      // Sets slowest average.
    if (rpcn.resA > slowestA) {
      slowestA = rpcn.resA;
    }
    // Sets fastest average.
    if (rpcn.resA < fastestA) {
      fastestA = rpcn.resA;
    }
    // Updates average response times.
    selectCellForUpdate(rpcn, 'resA');
  });
  // Highlights slowest and fastest.
  rpcns.forEach((rpcn) => {
    if (rpcn.resA === slowestA) {
      selectCellForUpdate(rpcn, 'resA', 'red-168-text');
    }
    if (rpcn.resA === fastestA) {
      selectCellForUpdate(rpcn, 'resA', 'green-168-text');
    }
  });
  // Updates slowest and fastest average scores in to best/worst table.
  updateSlowestFastestGraph(slowestA, fastestA);
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
  selectCellForUpdate(rpcn, batch);
  if (c !== undefined ) {
    document.getElementById('solana-transaction-count').innerText = c;
  }
}
// Initialize update process.
function selectCellForUpdate(rpcn, batch, color) {
  // Iterate through each field to be updated.
  switch (rpcn.rpcn) {
    case 'sea':
      var col = 1;
      break;
    case 'mia':
      var col = 3;
      break;
    case 'fra':
      var col = 5;
      break;
    case 'sin':
      var col = 7;
      break;
  };
  switch (rpcn.network) {
    case 'public':
      col += 1;
      break;
    case 'private':
      break;
  };
  switch (batch) {
    case 'resT0':
      var row = 2;
      break;
    case 'resT1':
      var row = 3;
      break;
    case 'resT2':
      var row = 4;
      break;
    case 'resA':
      var row = 5;
      break;
  };
  updateTable(row, col, (rpcn[batch] + 'ms'), color);
}
// Updates tables.
function updateTable(row, col, v, color) {
  myBody = document.getElementsByTagName("body")[0];
  myTableBody = myBody.getElementsByTagName("table")[1];
  myRow = myTableBody.getElementsByTagName("tr")[row];
  myCell = myRow.getElementsByTagName("td")[col];
  // Removes previous test's entry.
  while(myCell.firstChild) {
    myCell.removeChild(myCell.firstChild);
    myCell.classList.remove('red-168-text');
    myCell.classList.remove('green-168-text');
  }
  myCell.textContent += v;
  if (color === 'red-168-text' ) {
    myCell.classList.add('red-168-text');
  };
  if (color === 'green-168-text' ) {
    myCell.classList.add('green-168-text');
  };
}
// Updates top table with slowest and fastest and graph.
function updateSlowestFastestGraph(slowestA, fastestA) {
  myBody = document.getElementsByTagName("body")[0];
  myTableBody = myBody.getElementsByTagName("table")[0];
  myRow = myTableBody.getElementsByTagName("tr")[1];
  myCell = myRow.getElementsByTagName("td")[0];
  while(myCell.firstChild) {
    myCell.removeChild(myCell.firstChild);
  }
  myCell.textContent += slowestA;
  myCell = myRow.getElementsByTagName("td")[2];
  while(myCell.firstChild) {
    myCell.removeChild(myCell.firstChild);
  }
  myCell.textContent += fastestA;
  // Updates graph text.
  d = slowestA - fastestA;
  myRow = myTableBody.getElementsByTagName("tr")[1];
  myCell = myRow.getElementsByTagName("td")[1];
  while(myCell.firstChild) {
    myCell.removeChild(myCell.firstChild);
  }
  myCell.textContent += (d + 'ms delta');
  // Doing some tricks to make the graph look good.
  p = Math.round(((slowestA - fastestA) / fastestA) * 100);
  // Sets graph.
  myRow = myTableBody.getElementsByTagName("tr")[0];
  myCell = myRow.getElementsByTagName("th")[1];
  myDiv = myCell.querySelector("div");
  // Removes previous test's entry.
  while(myDiv.firstChild) {
    myDiv.removeChild(myDiv.firstChild);
  }
  myDiv.classList.add('tui-chart-value', 'yellowgreen-168', 'rpc-table-chart');
  myDiv.insertAdjacentText('beforeend', p + '% faster');
  if (p > 100) {
    myDiv.style.width = 100 + '%';

  } else {
    myDiv.style.width = p + '%';
  }
  myDiv.style.color = 'white';
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





 
