const Arweave = require("arweave/node");
const fs = require("fs");

const {interactRead} = require('./lib/contract-interact');

const jwkPath = process.argv.slice(2)[0];

function main(counter) {

  if (counter == 1) {
    process.exit(0);
  }

  console.info(`running check: ${counter+1}`);

  Promise.race([read(), timeout(60000)])
    .then(function (result) {
      //console.log(result);
    })
    .catch((e) => {
      console.error('Better luck next time..', e);
    })
    .finally(function () {
      main(++counter);
    });
}

main(0);


function timeout(timer) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, timer)
  });
}

async function read() {
  const arweave = Arweave.init({
    host: "arweave.net", // Hostname or IP address for a Arweave host
    port: 443,           // Port
    protocol: "https",   // Network protocol http or https
    timeout: 60000,      // Network request timeouts in milliseconds
    logging: false,      // Enable network request logging
  });

  const jwk = readJSON(jwkPath);

  // "CbGCxBJn6jLeezqDl1w3o8oCSeRCb-MmtZNKPodla-0" - contract version with logging
  // "OrO8n453N6bx921wtsEs-0OCImBLCItNU5oSbFKlFuU" - contract version without logging

  console.time("Total");

 /* console.time("contracts-registry");
  const contractTxId = (await interactRead(
    arweave,
    jwk,
    "XQkGzXG6YknJyy-YbakEZvQKAWkW2_aPRhc3ShC8lyA",
    {
      function: "contractsCurrentTxId",
      data: {
        contractNames: ["providers-registry"]
      }
    }))["providers-registry"];
  console.timeEnd("contracts-registry");*/

  console.time("providers-registry");
  const result = await interactRead(
    arweave,
    jwk,
    "OrO8n453N6bx921wtsEs-0OCImBLCItNU5oSbFKlFuU",
    {
      function: "activeManifest",
      data: {
        providerId: "I-5rWUehEv-MjdK9gFw09RxfSLQX9DIHxG614Wf8qo0",
        eagerManifestLoad: false
      }
    });
  console.timeEnd("providers-registry");

  console.timeEnd("Total");
  console.log("\n");

  return;
}

function readJSON(path) {
  const content = fs.readFileSync(path, "utf-8");
  try {
    return JSON.parse(content);
  } catch (e) {
    throw new Error(`File "${path}" does not contain a valid JSON`);
  }
}
