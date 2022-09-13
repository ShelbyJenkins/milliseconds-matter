// The main script for the community rpcs comparison test.
removePreviousTable();
addDefaultTable();
let rpcns = [];
let rpcnsBad = [];
let rpcnsBadLog = [];
createRPCList();
// Creates an array of objects from json file.
async function createRPCList() {
  var response = await fetch('rpcns.json');
  var data = await response.json();
  data.forEach((e) => {
    e.address = 'http://' + e.address;
    rpcns.push(e);
  });
  var response = await fetch('rpcns.json');
  var data = await response.json();
  data.forEach((e) => {
    e.address = 'https://' + e.address;
    rpcns.push(e);
  });
  console.log(rpcns);
};
 // Disables button after click to prevent multiple entries.
 const buttons = document.querySelectorAll('button');
 buttons.forEach((b) => {
     b.addEventListener('click', function(){ 
         buttons.forEach((b) => {
             b.disabled = true;
             setTimeout( function() {
                 b.disabled = false;
             }, 30000);
         });
     });
 });
// Main Function.
async function rpcTest(rpcns) {
  // Clears table from previous run.
  removePreviousTable();
  addDefaultTable();
  // Calls a single round of test on all rpcns. Waits till all tests are complete, and then tests again.
  // Performs the test 5 times to generate averages.
  for (let b = 1; b < 6; b++) {
    updateBatchCount(b);
    let countRequested = 0;
    let countResponded = 0;
    // Pauses loop until batch is complete.
    let count = 0;
    await Promise.all(rpcns.map(async (rpcn) => {
      countRequested += 1;
      updateRPCRequestedCount(countRequested);
      const promise = await testSingle(rpcn, b);
      if (promise === 1) {
        countResponded += 1;
        updateRPCRespondedCount(countResponded);
      }
    }));
    // If rpcn has been added to rpcnsBad array, then it's removed from further testing.
    // Bad rpcns are logged with rpcnsBadLog.
    rpcnsBad.forEach((rpcnBad) => {
      rpcnsBadLog.push(rpcnBad);
        rpcns.forEach((rpcn, i) => {
          if (rpcn === rpcnBad) {
            rpcns.splice(i, 1);
          }
        });
    });
    // Clears rpcnsBad after each run.
    rpncsBad = [];
    // If rpcn works with both https and http then the https version is removed
    rpcns.forEach((rpcnA, iA) => {
        rpcns.forEach((rpcnB, iB) => {
          // Checks for name match but exlcudes from matching with itself.
          if (rpcnA.rpcn === rpcnB.rpcn && rpcnA.address !== rpcnB.address) {
            // Match found
            if (rpcnA.address.includes('https://')) {
            rpcns.splice(iA, 1);
            } else {
            rpcns.splice(iB, 1);
            }
          }
        });
      });
    // // Pauses loop 3 seconds after each iteration.
    await new Promise(resolve => setTimeout(resolve, 1000));
  };
  // Single test within a batch.
  async function testSingle(rpcn, b) {
    // Returns promise when fetch succeeds or fails.
    return new Promise(async function(resolve, reject){
      // Performance.now() measures the time with higher presicision than date()/
      const t0 = performance.now()
      try {
          const response = await fetch(rpcn.address, {
            signal: AbortSignal.timeout(1000),
            method: 'POST',
            headers: {
              'mode': 'no-cors',
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify( {jsonrpc: '2.0', id: 'null', method: 'getTransactionCount'} )
          });
          r = await response.json()
          const t1 = performance.now();
            // First test is not logged.
            if (b > 0) {
              logTest((t1 - t0), rpcn, b, r.result);
              updateSolanaTransactionCount(r.result);
              terminal.write('\r\n' + '\x1b[38;2;0;168;0m' + '    response from ' + rpcn.rpcn + ' @ ' + rpcn.address + ' took ' + Math.round((t1 - t0)) + 'ms' + '\x1b[39m');
            }
          resolve(1);
      } catch (error) {
          terminal.write('\r\n' + '\x1b[38;2;168;0;0m ' + '    ' + rpcn.address + ' removed from test due to ' + error + '\x1b[39m');
          // Add to rpcnsBad to be used to remove bad nodes from testing.
          rpcnsBad.push(rpcn);
          resolve();
      };
    });
  };
  // Post test actions.
  let fastestA = Number.MAX_VALUE;
  let slowestA = 0;
   // Averages 5 runs and updates averages in list.
   // Also sets slowest and fastest averages for graph.
   rpcns.forEach((rpcn) => {
    let a = 0;
    for (let b = 1; b < 6; b++) {
      const batch = 'resT' + b;
      a += parseFloat(rpcn[batch]);
    }
    a /= 5;
    rpcn.resA = a.toFixed(1);
    // Sets slowest average.
    if (rpcn.resA > parseFloat(slowestA)) {
      slowestA = rpcn.resA;
    }
    // Sets fastest average.
    if (rpcn.resA < parseFloat(fastestA)) {
      fastestA = rpcn.resA;
    }
  });

  // Sorts list by averages.
  rpcns.sort((a, b) => a.resA - b.resA);
  // Output averages into terminal.
  rpcns.forEach((rpcn, i) => {
    terminal.write('\r\n' + '     #' +  (i + 1) + ' ' + rpcn.address + ' with an average response of ' + rpcn.resA + 'ms');
  });
  removePreviousTable();
  // Populates main table.
  rpcns.slice(0, 9).forEach((rpcn, p) => {
    // Adds a cell for org name and test result.
    generateTableCellPairs(rpcn);
  });
  // Updates slowest and fastest average scores in to best/worst table.
  updateSlowestFastestGraph(slowestA, fastestA);
  terminal.write('\r\n' + '\r\n' + '    test complete - check console for complete log')
  toggleKeyboard();
  checkTerminal();
  console.log('The following rpcns were tested: ');
  console.log(rpcns);
  console.log('The following rpcns failed testing: ');
  console.log(rpcnsBad);
}
// Updates object after each test within a batch.
function logTest(r, rpcn, b, c) {
  // Updates rpcn objects with results of tests.
  const batch = 'resT' + b;
  rpcn.NewField = 'batch';
  r = r.toFixed(1);
  rpcn[batch] = r;
}
function removePreviousTable() {
  document.getElementsByTagName("table")[1].deleteRow(1);
  document.getElementsByTagName("table")[1].deleteRow(1);
  myBody = document.getElementsByTagName('body')[0];
  myTable = myBody.getElementsByTagName('table')[1];
  myTableBody = myTable.getElementsByTagName('tbody')[0];
  myTableBody.insertRow(0);
  myTableBody.insertRow(0);
}
function addDefaultTable() {
  myBody = document.getElementsByTagName('body')[0];
  myTable = myBody.getElementsByTagName('table')[1];
  myTableBody = myTable.getElementsByTagName('tbody')[0];
  for (i = 0; i < 9; i++) {
    myRow = myTableBody.getElementsByTagName('tr')[0];
    var td = document.createElement('td');
    td.appendChild(document.createTextNode('rpcn'));
    myRow.appendChild(td)
    myBody = document.getElementsByTagName('body')[0];
    myTable = myBody.getElementsByTagName('table')[1];
    myTableBody = myTable.getElementsByTagName('tbody')[0];
    myRow = myTableBody.getElementsByTagName('tr')[1];
    var td = document.createElement('td');
    td.appendChild(document.createTextNode('ms average'));
    myRow.appendChild(td)
  }
}
function generateTableCellPairs(rpcn) {
  myBody = document.getElementsByTagName('body')[0];
  myTable = myBody.getElementsByTagName('table')[1];
  myTableBody = myTable.getElementsByTagName('tbody')[0];
  myRow = myTableBody.getElementsByTagName('tr')[0];
  var td = document.createElement('td');
  td.appendChild(document.createTextNode(rpcn.rpcn));
  myRow.appendChild(td)
  myRow = myTableBody.getElementsByTagName('tr')[1];
  var td = document.createElement('td');
  td.appendChild(document.createTextNode(rpcn.resA + 'ms average'));
  myRow.appendChild(td)
}
// Updates top table with slowest and fastest and graph.
function updateSlowestFastestGraph(slowestA, fastestA) {
  myBody = document.getElementsByTagName('body')[0];
  myTableBody = myBody.getElementsByTagName('table')[0];
  myRow = myTableBody.getElementsByTagName('tr')[1];
  // Updates slowest org.
  myCell = myRow.getElementsByTagName('td')[2];
  while(myCell.firstChild) {
    myCell.removeChild(myCell.firstChild);
  }
  myCell.textContent += slowestA + 'ms';
  // Updates fastest org
  myCell = myRow.getElementsByTagName('td')[0];
  while(myCell.firstChild) {
    myCell.removeChild(myCell.firstChild);
  }
  myCell.textContent += fastestA + 'ms';
  // Updates graph text.
  d = (slowestA - fastestA).toFixed(1);
  myRow = myTableBody.getElementsByTagName('tr')[1];
  myCell = myRow.getElementsByTagName('td')[1];
  while(myCell.firstChild) {
    myCell.removeChild(myCell.firstChild);
  }
  myCell.textContent += (d + 'ms delta');
  // Doing some tricks to make the graph look good.
  p = Math.round(((slowestA - fastestA) / fastestA) * 100);
  // Sets graph.
  myRow = myTableBody.getElementsByTagName('tr')[0];
  myCell = myRow.getElementsByTagName('th')[1];
  myDiv = myCell.querySelector('div');
  // Removes previous test's graph.
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