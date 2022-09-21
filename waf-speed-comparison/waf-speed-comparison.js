// The main script for the WAF comparison test.

 // Disables button after click to prevent multiple entries.
 let buttons = document.querySelectorAll('button')
 buttons.forEach((b) => {
     b.addEventListener('click', function(){ 
         buttons.forEach((b) => {
             b.disabled = true
         })
     })
 })

 let wafs = []
 let wafsBad = []
 let wafsBadLog = []
 setListCount()
 
// Main Function.
async function runTest() {
  wafsBad = []
  wafsBadLog = []
  let list = await createWAFList()
  // Clears table from previous run.
  removePreviousTable()
  // Performs the test 5 times to generate averages.
  wafsGood = await testBatches(list)
  // Post test actions.
  let averageAllwaf = 0
  wafsGood.forEach((waf) => {
    // Averages 5 runs and updates averages in list.
    let a = 0
    // First test is not included in average.
    for (let b = 1; b < 6; b++) {
      let batch = 'resT' + b
      a += parseFloat(waf[batch])
    }
    a /= 5
    waf.resA = a.toFixed(1)
    if (waf.waf !== 'CONTROL') { 
      averageAllwaf += Math.round(a)
    }
  })
  // Sets average for all tests.
  averageAllwaf /= (Object.keys(wafsGood).length - 1)
  averageAllwaf = averageAllwaf.toFixed(1)
  updateResponseAverage(averageAllwaf)
  // Sorts list by averages first to last.
  wafsGood.sort((a, b) => a.resA - b.resA)
  let fastestP = 0
  // Updates list with percentFasterThanAverage and rank.
  wafsGood.forEach((waf, i) => {
    // Adds rank to wafs list.
    waf.rank = (i)
    // Add percentFasterThanAverage field to wafs list.
    let percentFasterThanAverage = Math.round(((averageAllwaf - waf.resA) / waf.resA) * 100)
    waf.percentFasterThanAverage = percentFasterThanAverage
    // Sets fastestP for graph math.
    if (percentFasterThanAverage > fastestP ) {
      fastestP = percentFasterThanAverage
    }
  })
  removePreviousTable()
  addDefaultTable((wafsGood.length - 1) )
  // Populates main table.
  wafsGood.slice(1, 9).forEach((waf) => {
    // Adds a cell for org name and test result.
    generateTableCellPairs(waf, fastestP)
  })
  console.log('The following wafs were tested: ')
  console.log(wafsGood)
  console.log('The following wafs failed testing: ')
  console.log(wafsBad)
  // Output averages into terminal.
  consoleOutput = []
  wafsGood.slice().reverse().forEach(waf => {
    terminal.write('\r\n' + '    #' + waf.rank + ' ' + waf.waf + ', avg. response time: '  + waf.resA + 'ms ')
    consoleOutput.push('#' + waf.rank + ' ' + waf.waf + ', avg. response time: '  + waf.resA + 'ms ')
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
  let list = await createWAFList()
  // Divide by two since list is populats each rpc as http and https objects.
  document.querySelector('#waf-list-count').innerText = ((Object.keys(list).length - 2)) / 2
 }
// Creates an array of objects from json file.
async function createWAFList() {
  let response = await fetch('wafs.json')
  let data = await response.json()
  let output = []
  data.forEach((e) => {
    e.address = 'http://' + e.address
    e.waf = e.waf.toUpperCase()
    output.push(e)
  })
  response = await fetch('wafs.json')
  data = await response.json()
  data.forEach((e) => {
    e.address = 'https://' + e.address
    e.waf = e.waf.toUpperCase()
    output.push(e)
  })
  return output
}
// Runs multiple tests and returns populated objects.
async function testBatches(wafs) {
  // Calls a single round of test on all wafs. Waits till all tests are complete, and then tests again.
  // Performs the test 5 times to generate averages.
  // First test is not counted in the averages.
  for (let b = 0; b < 6; b++) {
    updateBatchCount(b)
    let countRequested = -1
    let countResponded = -1
    // Pauses loop until batch is complete.
    let count = 0
    await Promise.all(wafs.map(async (waf) => {
      console.log(countRequested)
      countRequested += 1
      updateWAFRequestedCount(countRequested)
      let promise = await testSingle(waf, b)
      if (promise === 1) {
        countResponded += 1
        updateWAFRespondedCount(countResponded)
      }
    }))
    // If waf has been added to wafsBad array, then it's removed from further testing.
    // Bad wafs are logged with wafsBadLog.
    wafsBad.forEach((wafBad) => {
      wafsBadLog.push(wafBad)
        wafs.forEach((waf, i) => {
          if (waf === wafBad) {
            wafs.splice(i, 1)
          }
        })
    })
    // Clears wafsBad after each run.
    rpncsBad = []
    // If waf works with both https and http then the https version is removed
    wafs.forEach((wafA, iA) => {
        wafs.forEach((wafB, iB) => {
          // Checks for name match but exlcudes from matching with itself.
          if (wafA.waf === wafB.waf && wafA.address !== wafB.address) {
            // Match found
            if (wafA.address.includes('https://')) {
            wafs.splice(iA, 1)
            } else {
            wafs.splice(iB, 1)
            }
          }
        })
      })
    // Pauses loop .003 seconds after each iteration.
    await new Promise(resolve => setTimeout(resolve, 3))
  }
  return wafs
}
// Single test within a batch.
// First test requests getTransactionCount.
// The following test requests getBalance on a unique address for each test.
async function testSingle(waf, b) {
  return new Promise(async function(resolve, reject){
    const t0 = performance.now()
    try {
        let response = await fetch(waf.address, {
          // signal: AbortSignal.timeout(2000),
          method: 'GET',
          // cache: 'no-cache',
          // mode: 'no-cors',
        })
        const t1 = performance.now()
        let kanye = await response.json()
        updateQuote(kanye.quote)
        logTest((t1 - t0), waf, b)
        terminal.write('\r\n' + '\x1b[38;2;0;168;0m' + '    response from ' + waf.waf + ' @ ' + waf.address + ' took ' + (t1 - t0).toFixed(1) + 'ms' + '\x1b[39m')
        resolve(1)
    } catch (error) {
        terminal.write('\r\n' + '\x1b[38;2;168;0;0m ' + '   ' + waf.address + ' removed from test due to ' + error + '\x1b[39m')
        // Add to wafsBad to be used to remove bad nodes from testing.
        wafsBad.push(waf)
        resolve()
    }
  })
}
// Updates object after each test within a batch.
function logTest(r, waf, b, c) {
  // Updates waf objects with results of tests.
  let batch = 'resT' + b
  r = r.toFixed(1)
  waf[batch] = r
}
function getASN(waf) {
  return asn
}
// Refreshes table back to blank.
function removePreviousTable() {
  document.getElementsByTagName('table')[0].deleteRow(1)
  document.getElementsByTagName('table')[0].deleteRow(1)
  document.getElementsByTagName('table')[0].deleteRow(1)
  document.getElementsByTagName('table')[0].deleteTHead(1)
  myBody = document.getElementsByTagName('body')[0]
  myTable = myBody.getElementsByTagName('table')[0]
  myTableBody = myTable.getElementsByTagName('tbody')[0]
  myTableBody.insertRow(0)
  myTableBody.insertRow(0)
  myTableBody.insertRow(0)
  var header = myTable.createTHead();
  var row = header.insertRow(0);    
}
// All this does is generate the header now.
function addDefaultTable(count) {
  myBody = document.getElementsByTagName('body')[0]
  myTable = myBody.getElementsByTagName('table')[0]
  myTableBody = myTable.getElementsByTagName('tbody')[0]
  myHeader = myTable.getElementsByTagName('thead')[0]
  for (i = 0; i < count; i++) {
    // Header.
    myRow = myHeader.getElementsByTagName('tr')[0]
    var th = document.createElement('th')
    th.appendChild(document.createTextNode('#' + i))
    myRow.appendChild(th)
    // // Row of 'percent faster than average.'
    // // Create TD and text.
    // var tdText = document.createElement('td')
    // tdText.appendChild(document.createTextNode('% ⚡ than avg.'))
    // // Create div.
    // var myDiv = document.createElement('div')
    // myDiv.appendChild(tdText)
    // // Create wrapper td.
    // var myTd = document.createElement('td')
    // myTd.appendChild(myDiv)
    // // Add to table..
    // myRow = myTableBody.getElementsByTagName('tr')[0]
    // myRow.appendChild(myTd)
    // // Row of 'ms average.'
    // myRow = myTableBody.getElementsByTagName('tr')[1]
    // var td = document.createElement('td')
    // td.appendChild(document.createTextNode('ms average'))
    // myRow.appendChild(td)
    // // Row of 'waf.'
    // myRow = myTableBody.getElementsByTagName('tr')[2]
    // var td = document.createElement('td')
    // td.appendChild(document.createTextNode('waf'))
    // myRow.appendChild(td)
  }
}
// Updates all table fields with dynamic information.
function generateTableCellPairs(waf, fastestP) {
  myBody = document.getElementsByTagName('body')[0]
  myTable = myBody.getElementsByTagName('table')[0]
  myTableBody = myTable.getElementsByTagName('tbody')[0]
  // Sets % ⚡ than avg..
  // Row of 'percent faster than average.'
  // Create td wrapper for graph.
  var tdGraph = document.createElement('td')
  tdGraph.appendChild(document.createTextNode(waf.percentFasterThanAverage +'%'))
  // Create div.
  var myDiv = document.createElement('div')
  // Tricks to make the graph scale. Sets fastestP as 100%.
  w = Math.round(waf.percentFasterThanAverage * (100 / fastestP))
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
  // Sets waf response times.
  myRow = myTableBody.getElementsByTagName('tr')[1]
  var td = document.createElement('td')
  td.appendChild(document.createTextNode(waf.resA + 'ms average'))
  myRow.appendChild(td)
  // // Sets waf location.
  // myRow = myTableBody.getElementsByTagName('tr')[2]
  // var td = document.createElement('td')
  // td.appendChild(document.createTextNode(waf.location))
  // myRow.appendChild(td)
  // // Sets waf asn.
  // myRow = myTableBody.getElementsByTagName('tr')[3]
  // var td = document.createElement('td')
  // td.appendChild(document.createTextNode(waf.asn))
  // myRow.appendChild(td)
   // Sets waf names.
   myRow = myTableBody.getElementsByTagName('tr')[2]
   var td = document.createElement('td')
   td.appendChild(document.createTextNode(waf.waf))
   myRow.appendChild(td)
}

// This group of functions updates the status of the tests.
function updateWAFRequestedCount(c) {
  document.getElementById('waf-requested-count').innerHTML = ''
  var newSpan = document.createElement('span')
  newSpan.innerText = c
  newSpan.style.color = '#00a8a8'
  document.getElementById('waf-requested-count').appendChild(newSpan)
}
function updateBatchCount(b) {
document.getElementById('batch-count').innerHTML = ''
var newSpan = document.createElement('span')
newSpan.innerText = b
newSpan.style.color = '#a800a8'
document.getElementById('batch-count').appendChild(newSpan)
}
function updateWAFRespondedCount(c) {
  document.getElementById('waf-responded-count').innerHTML = ''
  var newSpan = document.createElement('span')
  newSpan.innerText = c
  newSpan.style.color = 'yellowgreen'
  document.getElementById('waf-responded-count').appendChild(newSpan)
}
function updateQuote(c) {
  // Clears previous entry.
  document.getElementById('kanye-quote').innerHTML = ''
  var newSpan = document.createElement('span')
  newSpan.innerText = c
  var randomColor = Math.floor(Math.random()*16777215).toString(16)
  newSpan.style.color = '#' + randomColor
  document.getElementById('kanye-quote').appendChild(newSpan)
}
function updateResponseAverage(a) {
  document.getElementById('response-average').innerHTML = ''
  var newSpan = document.createElement('span')
  newSpan.innerText = a + 'ms'
  newSpan.style.color = '#00a8a8'
  document.getElementById('response-average').appendChild(newSpan)
}
