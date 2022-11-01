// The main script for the community rpcs comparison test.

 // Disables button after click to prevent multiple entries.
 let buttons = document.querySelectorAll('button')
 buttons.forEach((b) => {
     b.addEventListener('click', function(){ 
         buttons.forEach((b) => {
             b.disabled = true
         })
     })
 })

 let rpcns = []
 let rpcnsBad = []
 let rpcnsBadLog = []
 addDefaultTable()
 setListCount()
 
 // Main Function.
 async function runTest() {
   rpcnsBad = []
   rpcnsBadLog = []
   let list = await createRPCList()
   // Clears table from previous run.
   removePreviousTable()
   addDefaultTable()
   // Performs the test 5 times to generate averages.
   rpcnsGood = await testBatches(list)
   // Post test actions.
   let averageAllRpcn = 0
   rpcnsGood.forEach((rpcn) => {
     // Averages 5 runs and updates averages in list.
     let a = 0
     // First test is not included in average.
     for (let b = 1; b < 6; b++) {
       let batch = 'resT' + b
       a += parseFloat(rpcn[batch])
      }
      a /= 5
      rpcn.resA = a.toFixed(1)
    })
    // Sorts list by averages first to last BEFORE generating tableOutput list.
    rpcnsGood.sort((a, b) => a.resA - b.resA)
    // Generates list of unique orgs.
    let tableOutput = []
    rpcnsGood.forEach((rpcn, i) => {
      let testForRpcn = false
      tableOutput.forEach((rpcnToTable) => {
        if (rpcn.org === rpcnToTable.org) {
          testForRpcn = true
        }
      })
      if (testForRpcn === false) {
        tableOutput.push(rpcn)
      }
    })
    // Averages all orgs.
    tableOutput.forEach((rpcn) => {
      averageAllRpcn += Math.round(rpcn.resA)
    })
    averageAllRpcn /= Object.keys(tableOutput).length
    averageAllRpcn = averageAllRpcn.toFixed(1)
    updateResponseAverage(averageAllRpcn)
    // Sorts tableOutput by averages first to last.
    tableOutput.sort((a, b) => a.resA - b.resA)
    let fastestP = 0
    // Updates tableOutput list with percentFasterThanAverage.
    tableOutput.forEach((rpcn, i) => {
      // Adds rank to rpcns list.
      rpcn.rank = (i + 1)
      // Add percentFasterThanAverage field to rpcns list.
      let percentFasterThanAverage = Math.round(((averageAllRpcn - rpcn.resA) / rpcn.resA) * 100)
      rpcn.percentFasterThanAverage = percentFasterThanAverage
      // Sets fastestP for graph math.
      if (percentFasterThanAverage > fastestP ) {
        fastestP = percentFasterThanAverage
      }
  })
    // Updates rpcnsGood list with rank.
    rpcnsGood.forEach((rpcn, i) => {
      // Adds rank to rpcns list.
      rpcn.rank = (i + 1)
  })
    // Populates main table.
  removePreviousTable()
  tableOutput.slice(0, 15).forEach((rpcn, p) => {
    // Adds a cell for org name and test result.
    generateTableCellPairs(rpcn, fastestP)
  })
  tableOutput = []
  console.log('The following rpcns were tested: ')
  console.log(rpcnsGood)
  console.log('The following rpcns failed testing: ')
  console.log(rpcnsBadLog)
  // Output averages into terminal.
  consoleOutput = []
  rpcnsGood.slice().reverse().forEach(rpcn => {
    terminal.write('\r\n' + '    #' + rpcn.rank + ' ' + rpcn.rpcn + ', avg. response time: '  + rpcn.resA + 'ms ')
    consoleOutput.push('#' + rpcn.rank + ' ' + rpcn.rpcn + ', avg. response time: '  + rpcn.resA + 'ms ')
  })
  console.log('Terminal output: ')
  console.log(consoleOutput)
  terminal.write('\r\n' + '\r\n' + '    test complete - check dev tools console for complete log' + '\r\n' + '\r\n')
  toggleKeyboard()
  
  // Unlocks button.
  document.querySelector('body > div > div.action-bar > div > button').disabled = false
}

//Sets button counter.
async function setListCount() {
  let list = await createRPCList()
  // Divide by two since list is populats each rpc as http and https objects.
  document.querySelector('#rpc-list-count').innerText = (Object.keys(list).length) / 2
 }
// Creates an array of objects from json file.
async function createRPCList() {
  let response = await fetch('rpcns-updated.json')
  let data = await response.json()
  let output = []
  data.forEach((e) => {
    e.address = 'http://' + e.address
    e.rpcn = e.rpcn.toUpperCase()
    output.push(e)
  })
  response = await fetch('rpcns-updated.json')
  data = await response.json()
  data.forEach((e) => {
    e.address = 'https://' + e.address
    e.rpcn = e.rpcn.toUpperCase()
    output.push(e)
  })
  return output
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
    let count = 0
    await Promise.all(rpcns.map(async (rpcn) => {
      countRequested += 1
      updateRPCRequestedCount(countRequested)
      let promise = await testSingle(rpcn, b)
      if (promise === 1) {
        countResponded += 1
        updateRPCRespondedCount(countResponded)
      }
    }))
    // If rpcn has been added to rpcnsBad array, then it's removed from further testing.
    rpcnsBad.forEach((rpcnBad) => {
      rpcns.forEach((rpcn, i) => {
        if (rpcn === rpcnBad) {
          rpcns.splice(i, 1)
        }
      })
    })
    // Bad rpcns are logged with rpcnsBadLog IF no version passed testing.
    rpcnsBad.forEach((rpcnBad) => {
        let testForRpcn = false
        rpcns.forEach((rpcn, i) => {
          if (rpcn.rpcn === rpcnBad.rpcn) {
            testForRpcn = true
          }
        })
        if (testForRpcn === false) {
          rpcnsBadLog.push(rpcnBad)
        }
    })
    // Clears rpcnsBad after each run.
    rpcnsBad = []
    // If rpcn works with both https and http then the https version is removed
    rpcns.forEach((rpcnA, iA) => {
        rpcns.forEach((rpcnB, iB) => {
          // Checks for name match but exlcudes from matching with itself.
          if (rpcnA.rpcn === rpcnB.rpcn && rpcnA.address !== rpcnB.address) {
            // Match found
            if (rpcnA.address.includes('https://')) {
            rpcns.splice(iA, 1)
            } else {
            rpcns.splice(iB, 1)
            }
          }
        })
      })
    // Removes duplicates from rpcnsBadLog.
    rpcnsBadLog.forEach((rpcnA, iA) => {
        rpcnsBadLog.forEach((rpcnB, iB) => {
          // Checks for name match but exlcudes from matching with itself.
          if (rpcnA.rpcn === rpcnB.rpcn && rpcnA.address !== rpcnB.address) {
            // Match found
            if (rpcnA.address.includes('https://')) {
            rpcnsBadLog.splice(iA, 1)
            } else {
            rpcnsBadLog.splice(iB, 1)
            }
          }
        })
      })
    // Pauses loop 1 seconds after each iteration.
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  return rpcns
}
// Single test within a batch.
// First test requests getTransactionCount.
// The following test requests getBalance on a unique address for each test.
async function testSingle(rpcn, b) {
  // Returns promise when fetch succeeds or fails.

  // In the future test the getBlock method more as a testing method.
  // return new Promise(async function(resolve, reject){
  //   // First we grab the current slot.
  //   let slot = 0
  //   try {
  //     let response = await fetch(rpcn.address, {
  //       signal: AbortSignal.timeout(2000),
  //       method: 'POST',
  //       headers: {
  //         'mode': 'no-cors',
  //         'Accept': 'application/json',
  //         'Content-Type': 'application/json'
  //       },
  //       body: JSON.stringify( {jsonrpc: '2.0', id: 'null', method: 'getSlot'} )
  //     })
  //     r = await response.json()
  //     slot = r.result
  //     updateSolanaTransactionCount(r.result)
  //   } catch (error) {
  //     terminal.write('\r\n' + '\x1b[38;2;168;0;0m ' + '   ' + rpcn.address + ' removed from test due to ' + error + '\x1b[39m')
  //     // Add to rpcnsBad to be used to remove bad nodes from testing.
  //     rpcnsBad.push(rpcn)
  //     resolve()
  //   }
  //   // Now run the test on getBlock.
  //   // Performance.now() measures the time with higher presicision than date().
  //   const t0 = performance.now()
  //   try {
  //       let response = await fetch(rpcn.address, {
  //         signal: AbortSignal.timeout(2000),
  //         method: 'POST',
  //         headers: {
  //           'mode': 'no-cors',
  //           'Accept': 'application/json',
  //           'Content-Type': 'application/json'
  //         },
  //         body: JSON.stringify( {"jsonrpc": "2.0","id":1,"method":"getBlock","params":[slot, {"encoding": "json","transactionDetails":"full","rewards":false}] } )
  //       })
  //       r = await response.json()
  //       const t1 = performance.now()
  //       logTest((t1 - t0), rpcn, b, r.result)
  //       terminal.write('\r\n' + '\x1b[38;2;0;168;0m' + '    response from ' + rpcn.rpcn + ' @ ' + rpcn.address + ' took ' + (t1 - t0).toFixed(1) + 'ms' + '\x1b[39m')
  //       resolve(1)
  //   } catch (error) {
  //       terminal.write('\r\n' + '\x1b[38;2;168;0;0m ' + '   ' + rpcn.address + ' removed from test due to ' + error + '\x1b[39m')
  //       // Add to rpcnsBad to be used to remove bad nodes from testing.
  //       rpcnsBad.push(rpcn)
  //       resolve()
  //   }
  // })
  return new Promise(async function(resolve, reject){
    const t0 = performance.now()
    try {
        let response = await fetch(rpcn.address, {
          signal: AbortSignal.timeout(3000),
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify( {"jsonrpc":"2.0", "id":1, "method":"getTransactionCount"} )
        })
        r = await response.json()
        const t1 = performance.now()
        updateSolanaTransactionCount(r.result)
        logTest((t1 - t0), rpcn, b)
        terminal.write('\r\n' + '\x1b[38;2;0;168;0m' + '    response from ' + rpcn.rpcn + ' @ ' + rpcn.address + ' took ' + (t1 - t0).toFixed(1) + 'ms' + '\x1b[39m')
        resolve(1)
    } catch (error) {
        terminal.write('\r\n' + '\x1b[38;2;168;0;0m ' + '   ' + rpcn.address + ' removed from test due to ' + error + '\x1b[39m')
        // Add to rpcnsBad to be used to remove bad nodes from testing.
        rpcnsBad.push(rpcn)
        resolve()
    }
  })
}
// Updates object after each test within a batch.
function logTest(r, rpcn, b, c) {
  // Updates rpcn objects with results of tests.
  let batch = 'resT' + b
  r = r.toFixed(1)
  rpcn.timestamp = new Date().toJSON()
  rpcn[batch] = r
}

// Refreshes table back to blank.
function removePreviousTable() {
  document.getElementsByTagName('table')[0].deleteRow(1)
  document.getElementsByTagName('table')[0].deleteRow(1)
  document.getElementsByTagName('table')[0].deleteRow(1)
  myBody = document.getElementsByTagName('body')[0]
  myTable = myBody.getElementsByTagName('table')[0]
  myTableBody = myTable.getElementsByTagName('tbody')[0]
  myTableBody.insertRow(0)
  myTableBody.insertRow(0)
  myTableBody.insertRow(0)
  myTableBody.insertRow(0)
  myTableBody.insertRow(0)
}
function addDefaultTable() {
  myBody = document.getElementsByTagName('body')[0]
  myTable = myBody.getElementsByTagName('table')[0]
  myTableBody = myTable.getElementsByTagName('tbody')[0]
  for (i = 0; i < 15; i++) {
    // Row of 'percent faster than average.'
    // Create TD and text.
    var tdText = document.createElement('td')
    tdText.appendChild(document.createTextNode('% ⚡ than avg.'))
    // Create div.
    var myDiv = document.createElement('div')
    myDiv.appendChild(tdText)
    // Create wrapper td.
    var myTd = document.createElement('td')
    myTd.appendChild(myDiv)
    // Add to table..
    myRow = myTableBody.getElementsByTagName('tr')[0]
    myRow.appendChild(myTd)
    // Row of 'ms average.'
    myRow = myTableBody.getElementsByTagName('tr')[1]
    var td = document.createElement('td')
    td.appendChild(document.createTextNode('ms average'))
    myRow.appendChild(td)
    myRow = myTableBody.getElementsByTagName('tr')[2]
    var td = document.createElement('td')
    td.appendChild(document.createTextNode('rpcn'))
    myRow.appendChild(td)
  }
}
// Updates all table fields with dynamic information.
function generateTableCellPairs(rpcn, fastestP) {
  myBody = document.getElementsByTagName('body')[0]
  myTable = myBody.getElementsByTagName('table')[0]
  myTableBody = myTable.getElementsByTagName('tbody')[0]
  // Sets % ⚡ than avg..
  // Row of 'percent faster than average.'
  // Create td wrapper for graph.
  var tdGraph = document.createElement('td')
  tdGraph.appendChild(document.createTextNode(rpcn.percentFasterThanAverage +'%'))
  // Create div.
  var myDiv = document.createElement('div')
  // Tricks to make the graph scale. Sets fastestP as 100%.
  w = Math.round(rpcn.percentFasterThanAverage * (100 / fastestP))
  if (w > 0) { 
    myDiv.style.width = w + '%' 
  } else {
    myDiv.style.width = 0 + '%' 
  }
  myDiv.classList.add('tui-chart-value', 'yellowgreen-168', 'rpc-table-chart')
  myDiv.appendChild(tdGraph)
  // Create key text td.
  var tdKey = document.createElement('td')
  tdKey.appendChild(document.createTextNode('% ⚡ than avg.'))
  // Create wrapper td.
  var myTd = document.createElement('td')
  myTd.appendChild(tdKey)
  myTd.appendChild(myDiv)
  // Add to table.
  myRow = myTableBody.getElementsByTagName('tr')[0]
  myRow.appendChild(myTd)
  // Sets rpcn response times.
  myRow = myTableBody.getElementsByTagName('tr')[1]
  var td = document.createElement('td')
  td.appendChild(document.createTextNode(rpcn.resA + 'ms average'))
  myRow.appendChild(td)
   myRow = myTableBody.getElementsByTagName('tr')[2]
   var td = document.createElement('td')
   td.appendChild(document.createTextNode(rpcn.org))
   myRow.appendChild(td)
}

// This group of functions updates the status of the tests.
function updateRPCRequestedCount(c) {
  document.getElementById('rpc-requested-count').innerHTML = ''
  var newSpan = document.createElement('span')
  newSpan.innerText = c
  newSpan.style.color = '#00a8a8'
  document.getElementById('rpc-requested-count').appendChild(newSpan)
}
function updateBatchCount(b) {
document.getElementById('batch-count').innerHTML = ''
var newSpan = document.createElement('span')
newSpan.innerText = b
newSpan.style.color = '#a800a8'
document.getElementById('batch-count').appendChild(newSpan)
}
function updateRPCRespondedCount(c) {
  document.getElementById('rpc-responded-count').innerHTML = ''
  var newSpan = document.createElement('span')
  newSpan.innerText = c
  newSpan.style.color = 'yellowgreen'
  document.getElementById('rpc-responded-count').appendChild(newSpan)
}
function updateSolanaTransactionCount(c) {
// Updates solana-transaction-count and colorizes/fromats each power of a thousand for readiblity.
if (c !== undefined ) {
  // Clears previous entry.
  document.getElementById('solana-transaction-count').innerHTML = ''
  let arrayOfP = []
  while (c > 0) {
    let n = (c % 1000)
    // Adds leading comman and leading zeros if required.
    let s = '  ' + n.toString().padStart(3, '0')
    arrayOfP.push(s)
    c = Math.round(c / 1000)
  }
  // Removes extraneous leading chars from leading period.
  arrayOfP[arrayOfP.length - 1] = arrayOfP[arrayOfP.length - 1].replace('  ', '')
  arrayOfP[arrayOfP.length - 1] = arrayOfP[arrayOfP.length - 1].replace(/^0+/, '')
  arrayOfP.reverse().forEach(p => {
    var newSpan = document.createElement('span')
    newSpan.innerText = p
    var randomColor = Math.floor(Math.random()*16777215).toString(16)
    newSpan.style.color = '#' + randomColor
    document.getElementById('solana-transaction-count').appendChild(newSpan)
  })
}
}
function updateResponseAverage(a) {
  document.getElementById('response-average').innerHTML = ''
  var newSpan = document.createElement('span')
  newSpan.innerText = a + 'ms'
  newSpan.style.color = '#00a8a8'
  document.getElementById('response-average').appendChild(newSpan)
}
// function rpcCompTestAbout() {
//   fetch('terminal-test-about.txt')
//     .then(response => response.text())
//     .then((text) => {
//         for(i = 0; i < text.length; i++) {
//             (function(i){
//                 setTimeout(function() {
//                     terminal.write(text[i])
//                     if ((text.length - 1) == (i)) { 
//                         toggleKeyboard()
//                     }
//                 }, 1 * i)
//             }(i))
//             } 
//     })
// }
