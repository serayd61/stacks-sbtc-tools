import txPkg from '@stacks/transactions';
const { 
  makeContractCall, 
  broadcastTransaction, 
  AnchorMode, 
  PostConditionMode,
  uintCV,
  principalCV
} = txPkg;
import netPkg from '@stacks/network';
const { STACKS_MAINNET } = netPkg;

const PRIVATE_KEY = '4c664d1c1c36f56063823b6a7cbc8185ab9bcd84d4b291500667bc7ad5e3054b01';
const ADDRESS = 'SP2PEBKJ2W1ZDDF2QQ6Y4FXKZEDPT9J9R2NKD9WJB';
const network = STACKS_MAINNET;

async function getCurrentNonce() {
  const response = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${ADDRESS}/nonces`);
  const data = await response.json();
  return BigInt(data.possible_next_nonce);
}

async function call(contractName, functionName, functionArgs, nonce) {
  const tx = await makeContractCall({
    contractAddress: ADDRESS,
    contractName,
    functionName,
    functionArgs,
    senderKey: PRIVATE_KEY,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    fee: 10000n,
    nonce
  });
  const res = await broadcastTransaction({ transaction: tx, network });
  if (res.error) {
    console.log(`  ✗ ${contractName}.${functionName}: ${res.reason}`);
    return null;
  }
  console.log(`  ✓ ${contractName}.${functionName}`);
  return res.txid;
}

async function main() {
  console.log('='.repeat(60));
  console.log('Last Contract Activations');
  console.log('='.repeat(60));
  
  let nonce = await getCurrentNonce();
  console.log('Starting nonce:', nonce.toString(), '\n');

  // peg-ratio-tracker
  console.log('1. Peg Ratio Tracker - Add Updater');
  await call('peg-ratio-tracker', 'add-updater', [principalCV(ADDRESS)], nonce++);

  console.log('2. Peg Ratio Tracker - Update Ratio (1:1)');
  await call('peg-ratio-tracker', 'update-ratio', [uintCV(100000000)], nonce++);

  // bridge-analytics
  console.log('3. Bridge Analytics - Add Reporter');
  await call('bridge-analytics', 'add-reporter', [principalCV(ADDRESS)], nonce++);

  console.log('4. Bridge Analytics - Record Daily Stats');
  await call('bridge-analytics', 'record-daily-stats', [
    uintCV(1000000),    // volume
    uintCV(50),         // tx count
    uintCV(10000)       // fees
  ], nonce++);

  // sbtc-vault
  console.log('5. sBTC Vault - Set APY (5%)');
  await call('sbtc-vault', 'set-apy-bps', [uintCV(500)], nonce++);

  console.log('\n' + '='.repeat(60));
  console.log('All Activations Complete!');
  console.log('='.repeat(60));
}

main().catch(console.error);
