const Arweave = require("arweave/node");
const fs = require("fs");

const http = require("http");
const {interactRead}  = require('./lib/contract-interact');

const jwkPath = process.argv.slice(2)[0];

const server = http.createServer((req, res) => {

  Promise.race([read(), timeout(6000)])
    .then(function(result) {
      console.log(result);
    })
    .catch((e) => {
      console.error('Better luck next time..', e);
    })
    .finally(function () {
      if (global.gc) {
        console.log("Calling GC...");
        global.gc();
      }
      res.writeHead(200);
      res.end("Blah.");
    });
});

server.listen(3000);
console.log("Server listening to port 3000. Press Ctrl+C to stop it.");


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
    timeout: 20000,      // Network request timeouts in milliseconds
    logging: false,      // Enable network request logging
  });

  const jwk = readJSON(jwkPath);

  // "CbGCxBJn6jLeezqDl1w3o8oCSeRCb-MmtZNKPodla-0" - contract version with logging
  // "OrO8n453N6bx921wtsEs-0OCImBLCItNU5oSbFKlFuU" - contract version without logging

  const contracts = [
    "ru0dyEM_rpzKDz9bqGVKptItmHibjIfMBmvEzFsCSVE",
    "tqgrzE93YiWzwzBJCraTeY1nyVIcCZKNPOEpo4siQNc",
    "WoVukjvLbkfjAZ-B9T24qpQts8QSnKL9JLicnNqaSrI",
    "lzQ_LBq4Hin4nCAXew36nNGipSq2ZPfyVpTeblzt_XE",
    "6_8hmwbzASGGtrA6TDUBu05SjWZqTLGXvw8ELLTSmP0",
    "aZISZO_o50z0itDFJ24ztnJ9fsopdKp2z2akzQovpzU",
    "cRNMG0qPwqI9FG1Om6HQ4S4nXZRSK8pwuyxa_Kv0-YE",
    "OhBTyMzvzhC4nGCEtrcHVihZD7SJFNxMOpK6C3cRvL8",
    "CbGCxBJn6jLeezqDl1w3o8oCSeRCb-MmtZNKPodla-0",
    "OrO8n453N6bx921wtsEs-0OCImBLCItNU5oSbFKlFuU"
  ];

  const contractTxId = contracts[Math.floor(Math.random() * 10)];
  console.log("\n\n\nCalling SWC... ", {ts: Date.now(), contractTxId});

  return interactRead(
    arweave,
    jwk,
    contractTxId,
    {
      function: "activeManifest",
      data: {
        providerId: "33F0QHcb22W7LwWR1iRC8Az1ntZG09XQ03YWuw2ABqA",
        eagerManifestLoad: false
      }
    });
}

function readJSON(path) {
  const content = fs.readFileSync(path, "utf-8");
  try {
    return JSON.parse(content);
  } catch (e) {
    throw new Error(`File "${path}" does not contain a valid JSON`);
  }
}
