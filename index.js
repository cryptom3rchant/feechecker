// get the latest block. check what fees are included.

const request = require('request'); // npm install request

let fees = {}; // { <sats/byte>: <qty> }

async function init () {
  try {
    let block = await getBlock();
    for (let i = 0; i < block.txIndexes.length; i++) {
      let tx = await getTx(block.txIndexes[i]);
      processFee(tx);
      if (i % 20 === 0) {
        console.log('Completed ' + i + ' out of ' + block.txIndexes.length);
      }
    }
    console.log(JSON.stringify(fees));
  } catch (err) {
    console.log(err.stack);
  }
}

async function getBlock (hash) {
  return new Promise(function (resolve, reject) {
    let url = hash ? 'https://blockchain.info/rawblock/' + hash : 'https://blockchain.info/latestblock';
    request({
      url: url,
      method: 'get',
    }, function (err, result) {
      if (err || !result || !result.body) {
        console.log(err);
        reject(err);
      } else {
        resolve(JSON.parse(result.body));
      }
    });
  });
}

async function getTx (hash) {
  return new Promise(function (resolve, reject) {
    let url = 'https://blockchain.info/rawtx/' + hash;
    request({
      url: url,
      method: 'get',
    }, function (err, result) {
      if (err || !result || !result.body) {
        console.log(err);
        reject(err);
      } else {
        resolve(JSON.parse(result.body));
      }
    });
  });
}

function processFee (tx) {
  let inputTotal = 0;
  let outputTotal = 0;
  for (let i = 0; i < tx.inputs.length; i++) {
    if (!tx.inputs[i].prev_out) {
      continue; // skip coinbase tx
    }
    inputTotal += tx.inputs[i].prev_out.value;
  }
  for (let i = 0; i < tx.out.length; i++) {
    outputTotal += tx.out[i].value;
  }
  if (inputTotal) {
    let fee = inputTotal - outputTotal;
    let feePerByte = Math.round(fee / tx.size);
    fees[feePerByte] = fees[feePerByte] || 0;
    fees[feePerByte]++;
  }
}

init();
