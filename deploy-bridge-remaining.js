import txPkg from '@stacks/transactions';
const { makeContractDeploy, broadcastTransaction, AnchorMode, PostConditionMode } = txPkg;
import netPkg from '@stacks/network';
const { STACKS_MAINNET } = netPkg;
import { readFileSync } from 'fs';
import { join } from 'path';

const PRIVATE_KEY = '4c664d1c1c36f56063823b6a7cbc8185ab9bcd84d4b291500667bc7ad5e3054b01';
const ADDRESS = 'SP2PEBKJ2W1ZDDF2QQ6Y4FXKZEDPT9J9R2NKD9WJB';
const network = STACKS_MAINNET;
const FEE = 100000n; // 0.1 STX

// Contracts that need to be deployed (not yet successful)
const contractsToDeply = [
  'bridge-liquidity-pool',
  'crosschain-verifier', 
  'btc-tx-verifier',
  'sbtc-reserve-auditor',
  'sbtc-vault'
];

const contractsDir = '/Users/serkanaydin/stacks-bridge-monitor/contracts';

async function getCurrentNonce() {
  const response = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${ADDRESS}/nonces`);
  const data = await response.json();
  return BigInt(data.possible_next_nonce);
}

async function deployContract(name, sourceCode, nonce) {
  const txOptions = {
    contractName: name,
    codeBody: sourceCode,
    senderKey: PRIVATE_KEY,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    fee: FEE,
    nonce: nonce
  };

  const transaction = await makeContractDeploy(txOptions);
  const broadcastResponse = await broadcastTransaction({ transaction, network });
  
  if (broadcastResponse.error) {
    return { success: false, error: broadcastResponse.reason };
  }
  
  return { success: true, txid: broadcastResponse.txid };
}

async function main() {
  console.log('='.repeat(60));
  console.log('Bridge Monitor - Deploy Remaining Contracts (0.1 STX)');
  console.log('='.repeat(60));
  
  let nonce = await getCurrentNonce();
  console.log('Starting nonce:', nonce.toString(), '\n');

  for (const name of contractsToDeply) {
    const file = join(contractsDir, `${name}.clar`);
    const sourceCode = readFileSync(file, 'utf-8');
    
    process.stdout.write(`${name}... `);
    const result = await deployContract(name, sourceCode, nonce);
    
    if (result.success) {
      console.log(`✓ ${result.txid.slice(0, 12)}...`);
      nonce = nonce + 1n;
    } else {
      console.log(`✗ ${result.error}`);
    }
  }
  
  console.log('\nDone!');
}

main().catch(console.error);
