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
      rpcn    : 'anycast-user-locale',  
      address : 'http://1.1.1.1',
      resT0   : 0,
      resT1   : 0,
      resT2   : 0,
      resA    : 0
    },
    // { 
    //   rpcn    : 'anycast-na1', 
    //   address : 'http://1.1.1.1',
    //   rest0    : 0,
    //   resT1   : 0,
    //   resT2   : 0,
    // resA    : 0
    // },
    // { 
    //   rpcn    : 'anycast-na2', 
    //   address : 'http://1.1.1.1',
    //   rest0    : 0,
    //   resT1   : 0,
    //   resT2   : 0,
    // resA    : 0
    // },
    // { 
    //   rpcn    : 'anycast-eu', 
    //   address : 'http://1.1.1.1',
    //   rest0    : 0,
    //   resT1   : 0,
    //   resT2   : 0,
    // resA    : 0
    // },
    // { 
    //   rpcn    : 'anycast-apac', 
    //   address : 'http://1.1.1.1',
    //   rest0    : 0,
    //   resT1   : 0,
    //   resT2   : 0,
    // resA    : 0
    // },
    { 
      rpcn    : 'public-na1', 
      address : 'http://1.1.1.1',
      resT0   : 0,
      resT1   : 0,
      resT2   : 0,
      resA    : 0
    },
    { 
      rpcn    : 'public-na2', 
      address : 'http://1.1.1.1',
      resT0   : 0,
      resT1   : 0,
      resT2   : 0,
      resA    : 0
    },
    { 
      rpcn    : 'public-eu', 
      address : 'http://1.1.1.1',
      resT0   : 0,
      resT1   : 0,
      resT2   : 0,
      resA    : 0
    },
    { 
      rpcn    : 'public-apac', 
      address : 'http://1.1.1.1',
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
          postTest();
        // ~~~ remove settimeout after tests finalized. ~~~ 
          resolve();
      }
    });
    
  }
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
    // Sets slowest average.
    if (a > slowestA) {
      slowestActual = a;
    }
    // Sets fastest average.
    if (a < fastestA) {
      fastestA = a;
    }
    rpcn.resA = a;
    terminal.write('\r\n');
    terminal.write(`    average response from ` + rpcn.rpcn + ' @ ' + rpcn.address + ' took ' + a + ' milliseconds.');
  }) 
  // Populates table with rank, ttfb, and actual.
  rpcns.forEach((rpcn) => {
    // updateTableFields(rpcn);
    // update graph
  });
  console.log('hey')
  terminal.write('\r\n');
  terminal.write('\r\n');
  terminal.write('    about    home    waf-test-start    waf-test-about   rpc-test');
  terminal.write('\r\n');
  terminal.write('\r\n');
  toggleKeyboard();
}



// Populates percentage. Skips control.
// let largestPercent = 0;
// orgs.forEach((o) => {
//   if (o.org !== 'control') {
//     o.percent = Math.round((((slowestActual - o.actual) / o.actual) * 100));
//     // Gathers largest percentage for math.
//     if (o.percent > largestPercent) {
//       largestPercent = o.percent;
//     }
//   }
// });
// // Populates graph based off of largestPercent.
// orgs.forEach((o) => {
//   o.graph = ((o.percent / largestPercent) * 100);
// });



// function updateTableFields(o) {
//   // Sets col variable based on rank.
//   var row = o.rank;
//   // Iterate through each field to be updated.
//   const fields = ['org', 'rank', 'percent', 'ttfb', 'actual'];
//   fields.forEach((f) => {
//     switch (f) {
//       case 'org':
//         var update = o.org;
//         fields(0);
//         break;
//       case 'rank':
//         var update = o.rank;
//         fields(1);
//         break;
//       case 'percent':
//         if (o.org === 'control') {
//           graph('-');
//           break;  
//         } else {
//           graph(o.percent, o.graph);
//           break;
//         };
//       case 'ttfb':
//         var update = Math.round(o.ttfb * 10) / 10 + 'ms';
//         fields(3);
//         break;
//       case 'actual':
//         var update = Math.round(o.actual * 10) / 10 + 'ms';
//         fields(4);
//         break;
//     }
//     function fields(col) {
//       myBody = document.getElementsByTagName("body")[0];
//       myTable = myBody.getElementsByTagName("table")[0];
//       myTableBody = myTable.getElementsByTagName("tbody")[0];
//       myRow = myTableBody.getElementsByTagName("tr")[row];
//       myCell = myRow.getElementsByTagName("td")[col];
//       myCell.textContent = update;
    
//     }
//     function graph(p, g) {
//       // Doing some tricks to make the graph look good.
//       if (p !== '-') {
//         percent =  p  + '%';
//       } else {
//         percent = p;
//       }
//       myBody = document.getElementsByTagName("body")[0];
//       myTable = myBody.getElementsByTagName("table")[0];
//       myTableBody = myTable.getElementsByTagName("tbody")[0];
//       myRow = myTableBody.getElementsByTagName("tr")[row];
//       myCell = myRow.getElementsByTagName("td")[2];
//       myDiv = myCell.querySelector("div");
//       myDiv.style.width = g + '%';
//       while(myDiv.firstChild) {
//         myDiv.removeChild(myDiv.firstChild);
//       }
//       myDiv.insertAdjacentText('beforeend', percent);
//     };
//   });
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

