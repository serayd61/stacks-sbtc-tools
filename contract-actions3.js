import txPkg from '@stacks/transactions';
const { 
  makeContractCall, 
  broadcastTransaction, 
  AnchorMode, 
  PostConditionMode,
  uintCV,
  principalCV,
  stringAsciiCV,
  boolCV
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
    fee: 15000n,
    nonce
  });
  
  const res = await broadcastTransaction({ transaction: tx, network });
  
  if (res.error) {
    console.log(`  ✗ ${contractName}.${functionName}: ${res.reason}`);
    return null;
  }
  
  console.log(`  ✓ ${contractName}.${functionName}: ${res.txid.slice(0, 20)}...`);
  return res.txid;
}

async function main() {
  console.log('='.repeat(60));
  console.log('Kontrat İşlemleri - Batch 3');
  console.log('='.repeat(60));
  
  let nonce = await getCurrentNonce();
  console.log('Starting nonce:', nonce.toString(), '\n');

  // 1. sbtc-vault - Request Withdrawal
  console.log('1. sBTC Vault - Request Withdrawal 0.3 STX');
  await call('sbtc-vault', 'request-withdrawal', [uintCV(300000)], nonce++);

  // 2. sbtc-vault - Claim Yield
  console.log('2. sBTC Vault - Claim Yield');
  await call('sbtc-vault', 'claim-yield', [], nonce++);

  // 3. sbtc-vault - Deposit more
  console.log('3. sBTC Vault - Deposit 2 STX');
  await call('sbtc-vault', 'deposit', [uintCV(2000000)], nonce++);

  // 4. bridge-fee-calculator - Set Fee Collector
  console.log('4. Bridge Fee Calculator - Set Fee Collector');
  await call('bridge-fee-calculator', 'set-fee-collector', [principalCV(ADDRESS)], nonce++);

  // 5. proposal-engine - Add Proposer
  console.log('5. Proposal Engine - Add Proposer');
  await call('proposal-engine', 'add-proposer', [principalCV(ADDRESS)], nonce++);

  // 6. bridge-analytics - Record Daily Stats
  console.log('6. Bridge Analytics - Record Daily Stats');
  await call('bridge-analytics', 'record-daily-stats', [
    uintCV(5000000000),  // volume
    uintCV(150),         // tx count
    uintCV(50000),       // fees
    uintCV(75)           // unique users
  ], nonce++);

  // 7. peg-ratio-tracker - Update Ratio
  console.log('7. Peg Ratio Tracker - Update Ratio');
  await call('peg-ratio-tracker', 'update-ratio', [uintCV(100000000)], nonce++);

  // 8. token-voting - Create Proposal
  console.log('8. Token Voting - Create Proposal');
  await call('token-voting', 'create-proposal', [
    stringAsciiCV('Increase rewards'),
    uintCV(144)
  ], nonce++);

  console.log('\n' + '='.repeat(60));
  console.log('Batch 3 Tamamlandı!');
  console.log('='.repeat(60));
}

main().catch(console.error);
