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
  console.log('Mevcut Kontratlarla 5 İşlem');
  console.log('='.repeat(60));
  
  let nonce = await getCurrentNonce();
  console.log('Starting nonce:', nonce.toString(), '\n');

  // 1. bridge-fee-calculator - Set Fee Tier
  console.log('1. Bridge Fee Calculator - Set Fee Tier');
  await call('bridge-fee-calculator', 'set-fee-tier', [
    uintCV(1),           // tier
    uintCV(1000000000),  // min volume (1000 STX)
    uintCV(30)           // fee bps (0.3%)
  ], nonce++);

  // 2. bridge-rate-limiter - Whitelist User
  console.log('2. Bridge Rate Limiter - Whitelist User');
  await call('bridge-rate-limiter', 'whitelist-user', [
    principalCV(ADDRESS)
  ], nonce++);

  // 3. peg-ratio-tracker - Update Ratio
  console.log('3. Peg Ratio Tracker - Update Ratio');
  await call('peg-ratio-tracker', 'update-ratio', [
    uintCV(99980000)  // 0.9998 ratio (8 decimals)
  ], nonce++);

  // 4. bridge-analytics - Record Weekly Summary
  console.log('4. Bridge Analytics - Record Weekly Summary');
  await call('bridge-analytics', 'record-weekly-summary', [
    uintCV(10000000000),  // weekly volume
    uintCV(500),          // tx count
    uintCV(100000),       // total fees
    uintCV(150)           // unique users
  ], nonce++);

  // 5. sbtc-vault - Deposit (0.5 STX)
  console.log('5. sBTC Vault - Deposit 0.5 STX');
  await call('sbtc-vault', 'deposit', [
    uintCV(500000)  // 0.5 STX
  ], nonce++);

  console.log('\n' + '='.repeat(60));
  console.log('5 İşlem Tamamlandı!');
  console.log('Toplam Fee: ~0.05 STX');
  console.log('='.repeat(60));
}

main().catch(console.error);
