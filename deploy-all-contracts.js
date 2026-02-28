import txPkg from '@stacks/transactions';
const { makeContractDeploy, broadcastTransaction, AnchorMode, PostConditionMode } = txPkg;
import netPkg from '@stacks/network';
const { STACKS_MAINNET } = netPkg;
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const PRIVATE_KEY = '4c664d1c1c36f56063823b6a7cbc8185ab9bcd84d4b291500667bc7ad5e3054b01';
const ADDRESS = 'SP2PEBKJ2W1ZDDF2QQ6Y4FXKZEDPT9J9R2NKD9WJB';
const network = STACKS_MAINNET;
const FEE = 10000n; // 0.01 STX

const projects = [
  {
    name: 'sBTC Tools',
    path: '/Users/serkanaydin/stacks-sbtc-tools/contracts',
    skip: ['sbtc-price-feed.clar', 'sbtc-yield-strategy.clar'] // Already deployed
  },
  {
    name: 'Bridge Monitor',
    path: '/Users/serkanaydin/stacks-bridge-monitor/contracts',
    skip: []
  },
  {
    name: 'DeFi Suite',
    path: '/Users/serkanaydin/stacks-defi-suite/contracts',
    skip: []
  }
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
  console.log('DEPLOYING ALL CONTRACTS - 0.01 STX FEE');
  console.log('='.repeat(70));
  console.log('Address:', ADDRESS);
  console.log('Fee per contract: 0.01 STX\n');

  let nonce = await getCurrentNonce();
  console.log('Starting nonce:', nonce.toString());
  
  const allResults = [];
  let successCount = 0;
  let failCount = 0;

  for (const project of projects) {
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`📦 ${project.name}`);
    console.log('─'.repeat(70));

    const contracts = readdirSync(project.path)
      .filter(f => f.endsWith('.clar') && !project.skip.includes(f))
      .map(f => ({
        name: f.replace('.clar', ''),
        file: join(project.path, f)
      }));

    for (const contract of contracts) {
      const sourceCode = readFileSync(contract.file, 'utf-8');
      process.stdout.write(`  ${contract.name}... `);
      
      const result = await deployContract(contract.name, sourceCode, nonce);
      
      if (result.success) {
        console.log(`✓ ${result.txid.slice(0, 10)}...`);
        allResults.push({ project: project.name, name: contract.name, txid: result.txid, success: true });
        successCount++;
        nonce = nonce + 1n;
      } else {
        console.log(`✗ ${result.error}`);
        allResults.push({ project: project.name, name: contract.name, error: result.reason, success: false });
        failCount++;
      }
    }
  }

  // Summary
  console.log(`\n${'='.repeat(70)}`);
  console.log('DEPLOYMENT SUMMARY');
  console.log('='.repeat(70));
  console.log(`✓ Success: ${successCount}`);
  console.log(`✗ Failed: ${failCount}`);
  console.log(`Total fee: ~${(successCount * 0.01).toFixed(2)} STX\n`);

  // Group by project
  for (const project of projects) {
    const projectResults = allResults.filter(r => r.project === project.name);
    if (projectResults.length > 0) {
      console.log(`\n${project.name}:`);
      for (const r of projectResults) {
        if (r.success) {
          console.log(`  ✓ ${r.name}`);
          console.log(`    https://explorer.hiro.so/txid/${r.txid}?chain=mainnet`);
        } else {
          console.log(`  ✗ ${r.name}: ${r.error}`);
        }
      }
    }
  }
}

main().catch(console.error);
