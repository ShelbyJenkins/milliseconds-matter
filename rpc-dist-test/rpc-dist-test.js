// The main script for the centralized vs distributed infrastructure comparison.

// Disables buttons after click to prevent multiple entries.
const buttons = document.querySelectorAll('button')
buttons.forEach((a) => {
    a.addEventListener('click', function(){ 
        buttons.forEach((b) => {
            b.disabled = true
        })
    })
})
// Global list of rpcns. Printed to dev tools console after each run.
let rpcns = []
// Main Function.
async function runTest(buttonInput) {
  list = await createRPCList(buttonInput)
  // Calls tests.
  batchesOutput = await testBatches(list)
  // Inserts outputs into global rpcns list. Overwrites existing tests.
  batchesOutput.forEach((rpcnN) => {
    rpcns.forEach((rpcnE, i) => {
      if (rpcnN.rpcn === rpcnE.rpcn) {
        rpcns.splice(i, 1)
      }
    })
    rpcns.push(rpcnN)
  })
  // Post test actions.
  let fastestA = Number.MAX_VALUE
  let slowestA = 0
  // Finds slowest and fastest.
  batchesOutput.forEach((rpcn) => {
    terminal.write('\r\n' + '\x1b[38;2;0;168;0m' + '    ' + rpcn.rpcn + ' average respone time of ' + rpcn.resA + 'ms' + '\x1b[39m')
    // Sets slowest average.
    if (rpcn.resA > parseFloat(slowestA)) {
      slowestA = rpcn.resA
    }
    // Sets fastest average.
    if (rpcn.resA < parseFloat(fastestA)) {
      if (rpcn.type.includes('centralized')) {
        fastestL = rpcn.rpcn
      }
      fastestA = rpcn.resA
    }
  })
  // Updates table.
  switch (buttonInput) {
    case 'centralized':
        selectTable('centralized', slowestA, fastestA)
        updateDynamic(buttonInput, slowestA, fastestA)
        break
    case 'distributed':
        selectTable('distributed', slowestA, fastestA)
        updateDynamic(buttonInput, slowestA, fastestA, fastestL)
        break
    case 'secured':
        selectTable('secured', slowestA, fastestA)
        // Uses fastestA param for the distributed test's average.
        updateDynamic(buttonInput, null, (rpcns.find(({type}) => type === 'distributed')).resA, null, batchesOutput[0].resA)
        break
  }
  terminal.write('\r\n' + '\r\n' + '\r\n' + '    test complete - check dev tools console for complete log' + '\r\n' + '\r\n')
  toggleKeyboard()
  console.log(rpcns)
  // Ensures the tests are run in the correct order.
  if (rpcns.length === 4) {
    document.querySelector("#distributed > div.run-button > button").disabled = false
    document.querySelector("#centralized > div.run-button > button").disabled = false
  } else {
    document.querySelector("#distributed > div.run-button > button").disabled = false
    document.querySelector("#centralized > div.run-button > button").disabled = false
    document.querySelector("#secured > div.run-button > button").disabled = false
  }
}
// Creates an array of objects from json file.
async function createRPCList(criteria) {
  return new Promise(async function (resolve) {
    let response = await fetch('rpcns.json')
    let data = await response.json()
    let list = data
    let createRPCListOutput = []
    list.forEach((rpcn) => {
          if (rpcn.type.includes(criteria)) {
            createRPCListOutput.push(rpcn)
          }
        })
        resolve(createRPCListOutput)
  })
}
// Runs multiple tests and returns populated objects.
async function testBatches(rpcns) {
  // Calls a single round of test on all rpcns. Waits till all tests are complete, and then tests again.
  // Performs the test 5 times to generate averages.
  // First test is not counted in the averages.
  for (let b = 0; b < 6; b++) {
    updateBatchCount(b)
    let countRequested = 0
    let countResponded = 0
    // Pauses loop until batch is complete.
    await Promise.all(rpcns.map(async (rpcn) => {
      countRequested += 1
      updateRPCRequestedCount(countRequested)
      const promise = await testSingle(rpcn, b)
      if (promise === 1) {
        countResponded += 1
        updateRPCRespondedCount(countResponded)
      }
    }))
    // Pauses loop 1 seconds after each iteration.
    await new Promise(resolve => setTimeout(resolve, 300))
  }
   // Averages 5 runs and updates averages on table.
   rpcns.forEach((rpcn) => {
    let a = 0
    for (let b = 1; b < 6; b++) {
      const batch = 'resT' + b
      a += parseFloat(rpcn[batch])
    }
    a /= 5
    rpcn.resA = a.toFixed(1)
  })
  return rpcns
}
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
        })
        r = await response.json()
        const t1 = performance.now()
          // First test is not logged.
          if (b !== 0) {
            logTest((t1 - t0), rpcn, b)
            updateSolanaTransactionCount(r.result)
            terminal.write('\r\n' + '\x1b[38;2;0;168;0m' + '    response from ' + rpcn.rpcn + ' @ ' + rpcn.address + ' took ' + (t1 - t0).toFixed(1) + 'ms' + '\x1b[39m')
          }
        resolve(1)
    } catch (error) {
        terminal.write('\r\n')
        terminal.write('\x1b[38;2;168;0;0m ' + '    error testing ' + rpcn.rpcn + ' ' + rpcn.network + ' @ ' + rpcn.address + ' ' + error + '\x1b[39m')
        logError(error, rpcn, b)
        resolve(0)
    }
  })
}
// Updates rpcn object with result of tests.
function logTest(r, rpcn, b) {
  const batch = 'resT' + b
  rpcn.NewField = 'batch'
  r = r.toFixed(1)
  rpcn[batch] = r
}
// Updates rpcn objects with error result.
function logError(e, rpcn, b) {
  const batch = 'resT' + b
  rpcn.NewField = 'batch'
  rpcn[batch] = e
}
// This group of functions updates the status of the tests.
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

// Chooses the correct table to update.
function selectTable(table, slowestA, fastestA) {
  if (batchesOutput.length > 1) {
    batchesOutput.forEach((rpcn, i) => {
      if (rpcn.resA === slowestA) {
        updateStaticTable(table, i, rpcn.resA, 'red')
      }
      if (rpcn.resA === fastestA) {
        updateStaticTable(table, i, rpcn.resA, 'green')
      }
      updateStaticTable(table, i, rpcn.resA)
    })
  } else {
    updateStaticTable(table, 0, batchesOutput[0].resA)
  }
}
// Updates tables with information specific to this page.
function updateDynamic(test, slowestA, fastestA, location, wafT) {
  switch (test) {
    case 'centralized':
      let centralizedText = `
        <p>
          This test shows the high latency of geographically centralized RPC endpoints. 
          While, the nearest RPC endpoint responded in just <span class='green-168-text'>` + fastestA + `ms</span>,                 
          the farthest RPC endpoint took <span class='red-168-text'>` + slowestA + `ms</span>!
          Applications centralized in a single location will not be able to give global users a responsive experience!
        </p>
      `
      myP = document.querySelector('#centralized > div.dynamic')
      while(myP.firstChild) {
        myP.removeChild(myP.firstChild)
      }
      myP.innerHTML = centralizedText
      break
    case 'distributed':
      let distributedText = `
        <p>
          This test sends your request to a global Anycast IP address.
          Anycast routes your requests to the endpoint geographically nearest to you, <span class='cyan-168-text'>` + location + `</span>.
          Pairing Anycast with globally distributed endpoints ensures all users have a low latency user experience.
        </p>
      `
      myP = document.querySelector('#distributed > div.dynamic')
      while(myP.firstChild) {
          myP.removeChild(myP.firstChild)
        }
      myP.innerHTML = distributedText
      break
    case 'secured':
      let distibutedSecureText = `
        <p>
          If your endpoint is down, your app is down.
          DDoS. Injection attacks. Bots. 'Organic' DDoS aka excess traffic. These WILL bring you down.
          A web access firewall, aka a WAF, offers turnkey endpoint protection. 
          SP//'s low latency WAF adds only <span class='green-168-text'>` + (wafT - fastestA).toFixed(1) + `ms</span> to response times!
        </p>
        `
      myP = document.querySelector('#secured > div.dynamic')
      while(myP.firstChild) {
          myP.removeChild(myP.firstChild)
        }
      myP.innerHTML = distibutedSecureText
      break
  }
}
function updateStaticTable(table, col, v, color) {
  myTest = document.getElementById(table)
  myCol= myTest.getElementsByTagName('div')[col]
  myP = myCol.getElementsByTagName('p')[1]
  while(myP.firstChild) {
    myP.removeChild(myP.firstChild)
  }
  myP.textContent += v + 'ms'
  if (color === 'red' ) {
    myP.classList.add('red-168-text')
  }
  if (color === 'green' ) {
    myP.classList.add('green-168-text')
  }
}
function rpcDistTestAbout() {
  fetch('terminal-test-about.txt')
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