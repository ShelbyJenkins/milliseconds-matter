// Asynchronous database opening
const Reader = require('@maxmind/geoip2-node').Reader;
const net = require('net')
const dns = require('node:dns');
const { Console } = require('console');
const dnsPromises = require('node:dns').promises;
var fs = require('fs');



runUpdate()
// Creates an array of objects from json file.
async function runUpdate() {
  let rpcnsOutput = []
  // const rpcns = await createRPCList()
  const rpcns = await createList()
  // iterate through each rpcn
  for (const rpcn of rpcns) {
      const parts = rpcn.address.split(":")
      const port = parts[1]
      const ipOrHost = parts[0]
      // If not an IP address requires conversion.
      let ipInput = []
      if (net.isIP(ipOrHost) === 0) {
          const host = ipOrHost
          // Converts host to IP.
          try {
            // Maybe fetch API could be used here as well.
            resolve = await dnsPromises.resolve4(host)
            ipInput = resolve
            // const options = {
            //   family: 0
            // }
            // lookup = await dnsPromises.lookup(host, options)
          } catch (error) {
              console.log('error: ', rpcn.rpcn, ' did not respond.')
              continue
          }
      } else {
          ipInput.push(ipOrHost)
      }
      // Grabs ASN and pushes the first to the output.
      // A zero length indicates a failed test.
      if (ipInput.length > 0) {
          // Grab ASN.
          rpcn.ip = ipInput[0]
          let ASNList = []
          for (const ip of ipInput) {
              const ASN = await Reader.open('rpc-maxmind-data/GeoLite2-ASN_20220916/GeoLite2-ASN.mmdb').then(reader => {
                  try {
                      return reader.asn(ip);
                  } catch (error) {
                      console.log('error: ', rpcn.rpcn, ' does not have an asn.')
                  }
              });
              if (ASN !== undefined) {
                  ASNList.push(ASN.autonomousSystemOrganization)
              }
          }
          // Checks if all ASNs are the same.
          if (!ASNList.every( (val, i, arr) => val === arr[0] )) {
              // console.log('Found mulitple ASNs for: ', rpcn.rpcn)
          }
          if (ASNList.length > 0) 
          {
              rpcn.asn = ASNList[0]
          }
          // Grab City.
          let locationList = []
          for (const ip of ipInput) {
              const location = await Reader.open('rpc-maxmind-data/GeoLite2-City_20220916/GeoLite2-City.mmdb').then(reader => {
                  try {
                      const response = reader.city(ip)
                      // console.log(response.city.names.en)
                      // console.log(response.subdivisions[0].names.en)
                      // console.log(response.country.isoCode)
                      return response.city.names.en + ' ' + response.country.isoCode
                  } catch (error) {
                      // console.log('error: ', rpcn.rpcn, ' does not have an location data.')

                  }
              });
              if (location !== undefined) {
                  locationList.push(location)
              } else {
                  locationList.push('unknown')
              }
          }
          // Checks if all locations are the same.
          if (!locationList.every( (val, i, arr) => val === arr[0] )) {
              console.log('Found mulitple locations for: ', rpcn.rpcn)
              console.log(locationList)            
          }
          if (locationList.length > 0) 
          {
              rpcn.location = locationList[0]
              
          }
      }
      delete rpcn['ip'];
      rpcnsOutput.push(rpcn)
  }
  var json = JSON.stringify(rpcnsOutput, null, 2);
  fs.writeFile('rpcns-updated.json', json, 'utf8', function(err) {
      if (err) throw err;
      console.log('complete');
      }
  )
}
    
// RPC Identity be used to search solana gossip for ip address.
async function getIdentity(rpcn) {
    // Returns promise when fetch succeeds or fails.
    return new Promise(async function(resolve, reject){
      // Performance.now() measures the time with higher presicision than date()/
      try {
          const response = await fetch(rpcn.address, {
            signal: AbortSignal.timeout(2000),
            method: 'POST',
            headers: {
              'mode': 'no-cors',
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify( {jsonrpc: '2.0', id: 'null', method: 'getIdentity'} )
          })
          r = await response.json()
          console.log(rpcn.address)
          console.log(r.result.identity)

      } catch (error) {
            // console.log(error)
      }
    })
  }
// async function createRPCList() {
//   let output = []
//   let http = JSON.parse(await fs.promises.readFile("./rpcns.json", "utf8"));
//   http.forEach((e) => {
//     e.address = 'http://' + e.address
//     output.push(e)
//   })
//   let https = JSON.parse(await fs.promises.readFile("./rpcns.json", "utf8"));
//   https.forEach((e) => {
//     e.address = 'https://' + e.address
//     output.push(e)
//   })
//   return output
// }
async function createList() {
  let output = JSON.parse(await fs.promises.readFile("rpc-maxmind-data/rpcns.json", "utf8"))
  return output
}
