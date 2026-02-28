import txPkg from '@stacks/transactions';
const { makeContractDeploy, broadcastTransaction, AnchorMode, PostConditionMode } = txPkg;
import netPkg from '@stacks/network';
const { STACKS_MAINNET } = netPkg;
import { readFileSync } from 'fs';

const PRIVATE_KEY = '4c664d1c1c36f56063823b6a7cbc8185ab9bcd84d4b291500667bc7ad5e3054b01';
const ADDRESS = 'SP2PEBKJ2W1ZDDF2QQ6Y4FXKZEDPT9J9R2NKD9WJB';
const network = STACKS_MAINNET;

async function getCurrentNonce() {
  const response = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${ADDRESS}/nonces`);
  const data = await response.json();
  return BigInt(data.possible_next_nonce);
}

async function deployContract(name, sourceCode, nonce) {
  console.log(`\nDeploying ${name} (nonce: ${nonce})...`);

  const txOptions = {
    contractName: name,
    codeBody: sourceCode,
    senderKey: PRIVATE_KEY,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    fee: 100000n, // 0.1 STX
    nonce: nonce
  };

  const transaction = await makeContractDeploy(txOptions);
  const broadcastResponse = await broadcastTransaction({ transaction, network });

  if (broadcastResponse.error) {
    console.error(`Error deploying ${name}:`, broadcastResponse.error, broadcastResponse.reason);
    return null;
  }

  console.log(`✓ ${name} deployed!`);
  console.log(`  TX ID: ${broadcastResponse.txid}`);
  console.log(`  Contract: ${ADDRESS}.${name}`);
  console.log(`  Explorer: https://explorer.hiro.so/txid/${broadcastResponse.txid}?chain=mainnet`);

  return broadcastResponse.txid;
}

async function main() {
  console.log('='.repeat(60));
  console.log('Deploying Yield Distributor Contract');
  console.log('='.repeat(60));
  console.log('Address:', ADDRESS);

  let nonce = await getCurrentNonce();
  console.log('Current nonce:', nonce.toString());

  const contractFile = '/Users/serkanaydin/stacks-bridge-monitor/contracts/yield-distributor.clar';
  const sourceCode = readFileSync(contractFile, 'utf-8');
  
  console.log('Contract size:', sourceCode.length, 'bytes');

  const txid = await deployContract('yield-distributor', sourceCode, nonce);

  if (txid) {
    console.log('\n' + '='.repeat(60));
    console.log('Deployment Successful!');
    console.log('='.repeat(60));
    console.log(`Contract: ${ADDRESS}.yield-distributor`);
    console.log(`TX: https://explorer.hiro.so/txid/${txid}?chain=mainnet`);
  }
}

main().catch(console.error);
