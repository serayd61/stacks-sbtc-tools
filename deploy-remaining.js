import txPkg from '@stacks/transactions';
const { makeContractDeploy, broadcastTransaction, AnchorMode, PostConditionMode } = txPkg;
import netPkg from '@stacks/network';
const { STACKS_MAINNET } = netPkg;
import { readFileSync } from 'fs';
import { join } from 'path';

const PRIVATE_KEY = '4c664d1c1c36f56063823b6a7cbc8185ab9bcd84d4b291500667bc7ad5e3054b01';
const ADDRESS = 'SP2PEBKJ2W1ZDDF2QQ6Y4FXKZEDPT9J9R2NKD9WJB';
const network = STACKS_MAINNET;
const FEE = 100000n; // 0.1 STX for larger contracts

const failedContracts = [
  { name: 'cdp-stablecoin-v1', path: '/Users/serkanaydin/stacks-defi-suite/contracts' },
  { name: 'nft-marketplace-v1', path: '/Users/serkanaydin/stacks-defi-suite/contracts' },
  { name: 'options-protocol-v1', path: '/Users/serkanaydin/stacks-defi-suite/contracts' },
  { name: 'prediction-market-v1', path: '/Users/serkanaydin/stacks-defi-suite/contracts' },
  { name: 'reputation-system-v1', path: '/Users/serkanaydin/stacks-defi-suite/contracts' },
  { name: 'timelock-controller-v1', path: '/Users/serkanaydin/stacks-defi-suite/contracts' }
];

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
    return { success: false, error: broadcastResponse.error, reason: broadcastResponse.reason };
  }
  
  return { success: true, txid: broadcastResponse.txid };
}

async function main() {
  console.log('='.repeat(70));
  console.log('DEPLOYING REMAINING CONTRACTS - 0.05 STX FEE');
  console.log('='.repeat(70));
  
  let nonce = await getCurrentNonce();
  console.log('Starting nonce:', nonce.toString());
  
  for (const contract of failedContracts) {
    const file = join(contract.path, `${contract.name}.clar`);
    const sourceCode = readFileSync(file, 'utf-8');
    
    process.stdout.write(`${contract.name}... `);
    const result = await deployContract(contract.name, sourceCode, nonce);
    
    if (result.success) {
      console.log(`✓`);
      console.log(`  https://explorer.hiro.so/txid/${result.txid}?chain=mainnet`);
      nonce = nonce + 1n;
    } else {
      console.log(`✗ ${result.error} - ${result.reason}`);
    }
  }
}

main().catch(console.error);
