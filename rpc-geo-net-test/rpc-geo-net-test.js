// The main script for the centralized vs spanned infrastructure comparison.

// Disables buttons after click to prevent multiple entries.
const buttons = document.querySelectorAll('button');
buttons.forEach((a) => {
    a.addEventListener('click', function(){ 
        buttons.forEach((b) => {
            b.disabled = true;
            setTimeout( function() {
                b.disabled = false;
            }, 3000);
        });
    });
});

let rpcns = [];

// Main Function.
async function runTest(buttonInput) {
  list = await createRPCList(buttonInput);
  batchesOutput = await testBatches(list);
  // Inserts outputs into global rpcns list. Overwrites existing tests.
  batchesOutput.forEach((rpcnN) => {
    rpcns.forEach((rpcnE, i) => {
      if (rpcnN.rpcn === rpcnE.rpcn) {
        rpcns.splice(i, 1);
      }
    })
    rpcns.push(rpcnN);
  });
  // Post test actions.
  let fastestA = Number.MAX_VALUE;
  let slowestA = 0;
  // Finds slowest and fastest.
  batchesOutput.forEach((rpcn) => {
    terminal.write('\r\n' + '\x1b[38;2;0;168;0m' + '    ' + rpcn.rpcn + ' average respone time of ' + rpcn.resA + 'ms' + '\x1b[39m');
    // Sets slowest average.
    if (rpcn.resA > parseFloat(slowestA)) {
    slowestA = rpcn.resA;
    }
    // Sets fastest average.
    if (rpcn.resA < parseFloat(fastestA)) {
      fastestA = rpcn.resA;
    }
  });
  // Updates table.
  switch (buttonInput) {
    case 'centralized':
        updateTable('centralized');
        updateDynamicCentralized(slowestA, fastestA);
        unlockButton(1);
        break;
    case 'spanned':
        updateTable('spanned');
        updateDynamicSpanned(slowestA, fastestA);
        unlockButton(2);
        break;
    case 'securespan':
        updateTable('securespan');
        updateDynamicSecured(slowestA, fastestA);
        break;
  }
  function updateTable(table) {
    if (batchesOutput.length > 1) {
      batchesOutput.forEach((rpcn, i) => {
        if (rpcn.resA === slowestA) {
          updateStaticTable(table, i, rpcn.resA, 'red');
        }
        if (rpcn.resA === fastestA) {
          updateStaticTable(table, i, rpcn.resA, 'green');
        }
        updateStaticTable(table, i, rpcn.resA);
      });
    } else {
      updateStaticTable(table, 0, batchesOutput[0].resA);
    }
  }
  terminal.write('\r\n' + '\r\n' + '\r\n' + '    test complete - check dev tools console for complete log')
  terminal.write('\r\n' + '\r\n');
  toggleKeyboard();
  console.log(rpcns);
}

// Creates an array of objects from json file.
async function createRPCList(criteria) {
  return new Promise(async function (resolve) {
    let response = await fetch('rpcnsList.json');
    let data = await response.json();
    let list = data;
    let createRPCListOutput = [];
    list.forEach((rpcn) => {
          if (rpcn.rpcn.includes(criteria)) {
            createRPCListOutput.push(rpcn);
          }
        });
        resolve(createRPCListOutput);
  });
}
// Runs tests and returns populate 
async function testBatches(rpcns) {
  // Calls a single round of test on all rpcns. Waits till all tests are complete, and then tests again.
  // Performs the test 5 times to generate averages.
  // First test is not counted in the averages.
  for (let b = 0; b < 6; b++) {
    updateBatchCount(b);
    // Pauses loop until batch is complete.
    let countRequested = 0;
    let countResponded = 0;
    await Promise.all(rpcns.map(async (rpcn) => {
      countRequested += 1;
      updateRPCRequestedCount(countRequested);
      const promise = await testSingle(rpcn, b);
      if (promise === 1) {
        countResponded += 1;
        updateRPCRespondedCount(countResponded);
      }
    }));
    // Pauses loop 1 seconds after each iteration.
    await new Promise(resolve => setTimeout(resolve, 10));
  };
  // Single test within a batch.
  async function testSingle(rpcn, b) {
    // Returns promise when fetch succeeds or fails.
    return new Promise(async function(resolve, reject){
      // Performance.now() measures the time with higher presicision than date()/
      const t0 = performance.now()
      try {
          const response = await fetch(rpcn.address, {
            signal: AbortSignal.timeout(500),
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
            // First test is not logged.
            if (b !== 0) {
              logTest((t1 - t0), rpcn, b);
              updateSolanaTransactionCount(r.result);
              terminal.write('\r\n' + '\x1b[38;2;0;168;0m' + '    response from ' + rpcn.rpcn + ' @ ' + rpcn.address + ' took ' + Math.round((t1 - t0)) + 'ms' + '\x1b[39m');
            }
          resolve(1);
      } catch (error) {
          terminal.write('\r\n');
          terminal.write('\x1b[38;2;168;0;0m ' + '    error testing ' + rpcn.rpcn + ' ' + rpcn.network + ' @ ' + rpcn.address + ' ' + error + '\x1b[39m');
          logError(error, rpcn, b);
          resolve(0);
      };
    });
  };

   // Averages 5 runs and updates averages on table.
   // Also sets slowest and fastest averages for highlights.
   rpcns.forEach((rpcn) => {
    let a = 0;
    for (let b = 1; b < 6; b++) {
      const batch = 'resT' + b;
      a += parseFloat(rpcn[batch]);
    }
    a /= 5;
    rpcn.resA = a.toFixed(1);
  });
  return rpcns;
}
function logTest(r, rpcn, b) {
  // Updates rpcn objects with results of tests.
  const batch = 'resT' + b;
  rpcn.NewField = 'batch';
  r = r.toFixed(1);
  rpcn[batch] = r;
  
}
function logError(e, rpcn, b) {
  // Updates rpcn objects with results of tests.
  const batch = 'resT' + b;
  rpcn.NewField = 'batch';
  rpcn[batch] = e;
}
function updateRPCRequestedCount(c) {
    document.getElementById('rpc-requested-count').innerHTML = '';
    var newSpan = document.createElement('span');
    newSpan.innerText = c;
    newSpan.style.color = '#00a8a8';
    document.getElementById('rpc-requested-count').appendChild(newSpan);
}
function updateBatchCount(b) {
  document.getElementById('batch-count').innerHTML = '';
  var newSpan = document.createElement('span');
  newSpan.innerText = b;
  newSpan.style.color = '#a800a8';
  document.getElementById('batch-count').appendChild(newSpan);
}
function updateRPCRespondedCount(c) {
    document.getElementById('rpc-responded-count').innerHTML = '';
    var newSpan = document.createElement('span');
    newSpan.innerText = c;
    newSpan.style.color = 'yellowgreen';
    document.getElementById('rpc-responded-count').appendChild(newSpan);
}
function updateSolanaTransactionCount(c) {
// Updates solana-transaction-count and colorizes/fromats each power of a thousand for readiblity.
  if (c !== undefined ) {
    // Clears previous entry.
    document.getElementById('solana-transaction-count').innerHTML = '';
    let arrayOfP = [];
    while (c > 0) {
      let n = (c % 1000);
      // Adds leading comman and leading zeros if required.
      let s = '  ' + n.toString().padStart(3, '0');
      arrayOfP.push(s);
      c = Math.round(c / 1000);
    }
    // Removes extraneous leading chars from leading period.
    arrayOfP[arrayOfP.length - 1] = arrayOfP[arrayOfP.length - 1].replace('  ', '');
    arrayOfP[arrayOfP.length - 1] = arrayOfP[arrayOfP.length - 1].replace(/^0+/, '');
    arrayOfP.reverse().forEach(p => {
      var newSpan = document.createElement('span');
      newSpan.innerText = p;
      var randomColor = Math.floor(Math.random()*16777215).toString(16);
      newSpan.style.color = '#' + randomColor;
      document.getElementById('solana-transaction-count').appendChild(newSpan);
    });
  }
}
function updateStaticTable(table, col, v, color) {
  myTest = document.getElementById(table);
  myCol= myTest.getElementsByTagName('div')[col];
  myP = myCol.getElementsByTagName('p')[1];
  while(myP.firstChild) {
    myP.removeChild(myP.firstChild);
  }
  myP.textContent += v + 'ms';
  if (color === 'red' ) {
    myP.classList.add('red-168-text');
  };
  if (color === 'green' ) {
    myP.classList.add('green-168-text');
  };
}
function unlockButton(b) {
  if (b === 1) { 
    // Supresses error message for unlocked button.
    while ( !document.querySelector("#spanned > div.run-button-locked") ) { 
      return
    };
    var buttonDiv = document.querySelector("#spanned > div.run-button-locked");
    buttonDiv.innerHTML = `<button onclick="runTest('spanned');">`;
    var button = buttonDiv.querySelector("button")
    const span = document.createElement("span");
    span.innerText = 'test spanned endpoints';
    button.appendChild(span);
  } else { 
    // Supresses error message for unlocked button.
    while ( !document.querySelector("#securespan > div.run-button-locked") ) { 
      return
    };
    var buttonDiv = document.querySelector("#securespan > div.run-button-locked");
    buttonDiv.innerHTML = `<button onclick="runTest('securespan');">`;
    var button = buttonDiv.querySelector("button")
    const span = document.createElement("span");
    span.innerText = 'test secure spanned endpoints';
    button.appendChild(span);
  };
  buttonDiv.classList.remove('run-button-locked');
  buttonDiv.classList.add('run-button');
}
function updateDynamicCentralized(slowestA, fastestA) {
  let text = `
    <p>This test shows the high latency of geographically centralized RPC endpoints. 
    While, the nearest RPC endpoint responded in just <span class="green-168-text">` + fastestA + `ms</span>,                 
    the farthest RPC endpoint took <span class="red-168-text">` + slowestA + `ms</span>!
    Applications with endpoints in only a single location will not be able to give global users a responsive experience!</p>`
  myP = document.querySelector("#centralized > div.dynamic")
  while(myP.firstChild) {
    myP.removeChild(myP.firstChild);
  }
  myP.innerHTML = text;
}
function updateDynamicSpanned(slowestA, fastestA) {
  let text = `
    <p>This test shows the high latency of geographically centralized RPC endpoints. 
    While, the nearest RPC endpoint responded in just <span class="green-168-text">` + fastestA + `ms</span>,                 
    the farthest RPC endpoint took <span class="red-168-text">` + slowestA + `ms</span>!
    Applications with endpoints in only a single location will not be able to give global users a responsive experience!</p>`
  myP = document.querySelector("#spanned > div.dynamic")
  while(myP.firstChild) {
    myP.removeChild(myP.firstChild);
  }
  myP.innerHTML = text;
}
function updateDynamicSecured(slowestA, fastestA) {
  let text = `
    <p>This test shows the high latency of geographically centralized RPC endpoints. 
    While, the nearest RPC endpoint responded in just <span class="green-168-text">` + fastestA + `ms</span>,                 
    the farthest RPC endpoint took <span class="red-168-text">` + slowestA + `ms</span>!
    Applications with endpoints in only a single location will not be able to give global users a responsive experience!</p>`
  myP = document.querySelector("#securespan > div.dynamic")
  while(myP.firstChild) {
    myP.removeChild(myP.firstChild);
  }
  myP.innerHTML = text;
}


// Updates top table with slowest and fastest and graph.
// function updateSlowestFastestGraph(slowestA, fastestA) {
//   myBody = document.getElementsByTagName("body")[0];
//   myTableBody = myBody.getElementsByTagName("table")[0];
//   myRow = myTableBody.getElementsByTagName("tr")[1];
//   myCell = myRow.getElementsByTagName("td")[0];
//   while(myCell.firstChild) {
//     myCell.removeChild(myCell.firstChild);
//   }
//   myCell.textContent += slowestA + 'ms';
//   myCell = myRow.getElementsByTagName("td")[2];
//   while(myCell.firstChild) {
//     myCell.removeChild(myCell.firstChild);
//   }
//   myCell.textContent += fastestA + 'ms';
//   // Updates graph text.
//   d = (slowestA - fastestA).toFixed(1);
//   myRow = myTableBody.getElementsByTagName("tr")[1];
//   myCell = myRow.getElementsByTagName("td")[1];
//   while(myCell.firstChild) {
//     myCell.removeChild(myCell.firstChild);
//   }
//   myCell.textContent += (d + 'ms delta');
//   // Doing some tricks to make the graph look good.
//   p = Math.round(((slowestA - fastestA) / fastestA) * 100);
//   // Sets graph.
//   myRow = myTableBody.getElementsByTagName("tr")[0];
//   myCell = myRow.getElementsByTagName("th")[1];
//   myDiv = myCell.querySelector("div");
//   // Removes previous test's entry.
//   while(myDiv.firstChild) {
//     myDiv.removeChild(myDiv.firstChild);
//   }
//   myDiv.classList.add('tui-chart-value', 'yellowgreen-168', 'rpc-table-chart');
//   myDiv.insertAdjacentText('beforeend', p + '% faster');
//   if (p > 100) {
//     myDiv.style.width = 100 + '%';

//   } else {
//     myDiv.style.width = p + '%';
//   }
//   myDiv.style.color = 'white';
// } 
// function rpcTestAbout() {
//   fetch('terminalTextRpc.txt')
//     .then(response => response.text())
//     .then((text) => {
//         for(i = 0; i < text.length; i++) {
//             (function(i){
//                 setTimeout(function() {
//                     terminal.write(text[i]);
//                     if ((text.length - 1) == (i)) { 
//                         toggleKeyboard();
//                     };
//                 }, 1 * i);
//             }(i));
//             } 
//     })
// }