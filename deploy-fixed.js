import txPkg from '@stacks/transactions';
const { makeContractDeploy, broadcastTransaction, AnchorMode } = txPkg;
import netPkg from '@stacks/network';
const { STACKS_MAINNET } = netPkg;
import fs from 'fs';

const PRIVATE_KEY = '4c664d1c1c36f56063823b6a7cbc8185ab9bcd84d4b291500667bc7ad5e3054b01';
const ADDRESS = 'SP2PEBKJ2W1ZDDF2QQ6Y4FXKZEDPT9J9R2NKD9WJB';
const network = STACKS_MAINNET;

async function getCurrentNonce() {
  const response = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${ADDRESS}/nonces`);
  const data = await response.json();
  return BigInt(data.possible_next_nonce);
}

async function deploy(name, code, nonce) {
  const tx = await makeContractDeploy({
    contractName: name,
    codeBody: code,
    senderKey: PRIVATE_KEY,
    network,
    anchorMode: AnchorMode.Any,
    fee: 15000n,
    nonce
  });
  const res = await broadcastTransaction({ transaction: tx, network });
  console.log(`${name}:`, res.error ? res.reason : res.txid.slice(0, 20) + '...');
  return !res.error;
}

async function main() {
  console.log('Deploying fixed contracts...\n');
  let nonce = await getCurrentNonce();
  
  const contracts = [
    { name: 'amm-dex-v2', file: 'contracts/amm-dex-v2.clar' },
    { name: 'lending-pool-v2', file: 'contracts/lending-pool-v2.clar' }
  ];
  
  for (const c of contracts) {
    const code = fs.readFileSync(c.file, 'utf-8');
    await deploy(c.name, code, nonce++);
    await new Promise(r => setTimeout(r, 300));
  }
}

main().catch(console.error);
