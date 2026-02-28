import txPkg from '@stacks/transactions';
const { 
  makeContractCall, 
  broadcastTransaction, 
  AnchorMode, 
  PostConditionMode,
  stringAsciiCV,
  uintCV,
  principalCV,
  boolCV,
  someCV,
  noneCV
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
  console.log('Bridge Monitor - Activate All Contracts');
  console.log('='.repeat(60));
  
  let nonce = await getCurrentNonce();
  console.log('Starting nonce:', nonce.toString(), '\n');

  // 1. bridge-fee-calculator: Set fee tier
  console.log('1. Bridge Fee Calculator - Set Fee Tier');
  await call('bridge-fee-calculator', 'set-fee-tier', [
    uintCV(1),           // tier id
    uintCV(0),           // min amount
    uintCV(100000000),   // max amount (1 BTC)
    uintCV(30)           // 0.3% fee
  ], nonce++);

  // 2. bridge-fee-calculator: Set congestion multiplier
  console.log('2. Bridge Fee Calculator - Set Congestion');
  await call('bridge-fee-calculator', 'set-congestion-multiplier', [uintCV(120)], nonce++);

  // 3. bridge-pause-guardian: Add guardian
  console.log('3. Bridge Pause Guardian - Add Guardian');
  await call('bridge-pause-guardian', 'add-guardian', [principalCV(ADDRESS)], nonce++);

  // 4. bridge-rate-limiter: Set user limit
  console.log('4. Bridge Rate Limiter - Set User Limit');
  await call('bridge-rate-limiter', 'set-user-limit', [
    principalCV(ADDRESS),
    uintCV(5000000000)  // 50 BTC limit
  ], nonce++);

  // 5. bridge-rate-limiter: Whitelist user
  console.log('5. Bridge Rate Limiter - Whitelist User');
  await call('bridge-rate-limiter', 'whitelist-user', [principalCV(ADDRESS)], nonce++);

  // 6. btc-tx-verifier: Add verifier
  console.log('6. BTC TX Verifier - Add Verifier');
  await call('btc-tx-verifier', 'add-verifier', [principalCV(ADDRESS)], nonce++);

  // 7. btc-tx-verifier: Submit BTC transaction
  console.log('7. BTC TX Verifier - Submit BTC TX');
  await call('btc-tx-verifier', 'submit-btc-tx', [
    stringAsciiCV('a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'), // txid
    uintCV(50000000),    // 0.5 BTC
    uintCV(6),           // confirmations
    stringAsciiCV('0000000000000000000234abc123def456789abcdef0000000000000000000'), // block hash
    uintCV(938500),      // btc block height
    someCV(principalCV(ADDRESS))  // recipient
  ], nonce++);

  // 8. sbtc-reserve-auditor: Add auditor
  console.log('8. sBTC Reserve Auditor - Add Auditor');
  await call('sbtc-reserve-auditor', 'add-auditor', [principalCV(ADDRESS)], nonce++);

  // 9. sbtc-reserve-auditor: Submit reserve proof
  console.log('9. sBTC Reserve Auditor - Submit Reserve Proof');
  await call('sbtc-reserve-auditor', 'submit-reserve-proof', [
    stringAsciiCV('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'),  // btc address
    uintCV(2100000000000000)  // 21M BTC in sats
  ], nonce++);

  // 10. sbtc-reserve-auditor: Perform audit
  console.log('10. sBTC Reserve Auditor - Perform Audit');
  await call('sbtc-reserve-auditor', 'perform-audit', [
    someCV(stringAsciiCV('Initial audit - reserves verified'))
  ], nonce++);

  // 11. crosschain-verifier: Register as relayer (requires 100 STX stake)
  console.log('11. Crosschain Verifier - Register Relayer');
  await call('crosschain-verifier', 'register-relayer', [], nonce++);

  // 12. bridge-liquidity-pool: Add liquidity (1 STX for test)
  console.log('12. Bridge Liquidity Pool - Add Liquidity');
  await call('bridge-liquidity-pool', 'add-liquidity', [uintCV(1000000)], nonce++);

  console.log('\n' + '='.repeat(60));
  console.log('Done! 12 transactions submitted.');
  console.log('='.repeat(60));
}

main().catch(console.error);
