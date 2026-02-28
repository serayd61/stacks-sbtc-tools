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

// Budget: 1 STX = 1,000,000 microSTX
// Fee per TX: ~10,000 microSTX = 0.01 STX
// Max TXs: ~100

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
    return false;
  }
  
  console.log(`  ✓ ${contractName}.${functionName}`);
  return true;
}

async function main() {
  console.log('='.repeat(60));
  console.log('Contract Interactions - Budget: 1 STX');
  console.log('='.repeat(60));
  
  let nonce = await getCurrentNonce();
  console.log('Starting nonce:', nonce.toString());
  let txCount = 0;
  const maxTx = 50; // ~0.5 STX for fees
  
  // ========== vault-tracker-v1 ==========
  console.log('\n📦 vault-tracker-v1');
  
  for (let i = 1; i <= 5 && txCount < maxTx; i++) {
    await call('vault-tracker-v1', 'record-deposit', [uintCV(i * 1000000)], nonce++);
    txCount++;
  }
  
  // ========== defi-registry-v1 ==========
  console.log('\n📋 defi-registry-v1');
  
  const protocols = ['ALEX', 'Velar', 'Arkadiko', 'Zest', 'Bitflow'];
  for (const p of protocols) {
    if (txCount >= maxTx) break;
    await call('defi-registry-v1', 'register-protocol', [
      stringAsciiCV(p),
      uintCV(Math.floor(Math.random() * 50000000))
    ], nonce++);
    txCount++;
  }
  
  // Update TVL
  for (let i = 0; i < 3 && txCount < maxTx; i++) {
    await call('defi-registry-v1', 'update-tvl', [
      uintCV(i),
      uintCV(Math.floor(Math.random() * 100000000))
    ], nonce++);
    txCount++;
  }
  
  // ========== defi-governance-v1 ==========
  console.log('\n🗳️ defi-governance-v1');
  
  const proposals = [
    'Increase staking rewards',
    'Add new liquidity pool',
    'Reduce protocol fees',
    'Enable flash loans',
    'Upgrade oracle system'
  ];
  
  for (const p of proposals) {
    if (txCount >= maxTx) break;
    await call('defi-governance-v1', 'create-proposal', [stringAsciiCV(p)], nonce++);
    txCount++;
  }
  
  // Vote on proposals
  for (let i = 0; i < 5 && txCount < maxTx; i++) {
    await call('defi-governance-v1', 'vote', [uintCV(i), boolCV(Math.random() > 0.3)], nonce++);
    txCount++;
  }
  
  // ========== defi-pool-v1 ==========
  console.log('\n💧 defi-pool-v1');
  
  const pools = [
    ['STX', 'USDA', 10000000, 27000000],
    ['STX', 'ALEX', 5000000, 15000000],
    ['BTC', 'STX', 100000, 250000000],
    ['USDA', 'ALEX', 20000000, 8000000]
  ];
  
  for (const [a, b, ra, rb] of pools) {
    if (txCount >= maxTx) break;
    await call('defi-pool-v1', 'create-pool', [
      stringAsciiCV(a),
      stringAsciiCV(b),
      uintCV(ra),
      uintCV(rb)
    ], nonce++);
    txCount++;
  }
  
  // Add liquidity
  for (let i = 0; i < 4 && txCount < maxTx; i++) {
    await call('defi-pool-v1', 'add-liquidity', [
      uintCV(i),
      uintCV(1000000 + i * 500000),
      uintCV(2000000 + i * 300000)
    ], nonce++);
    txCount++;
  }
  
  // ========== test-simple-v1 ==========
  console.log('\n🔢 test-simple-v1');
  
  for (let i = 0; i < 10 && txCount < maxTx; i++) {
    await call('test-simple-v1', 'increment', [], nonce++);
    txCount++;
  }
  
  // ========== Existing contracts ==========
  console.log('\n🏦 Existing Contracts');
  
  // sbtc-vault
  await call('sbtc-vault', 'deposit', [uintCV(100000)], nonce++); txCount++;
  await call('sbtc-vault', 'claim-yield', [], nonce++); txCount++;
  
  // bridge-fee-calculator
  await call('bridge-fee-calculator', 'set-fee-bps', [uintCV(45)], nonce++); txCount++;
  await call('bridge-fee-calculator', 'set-congestion-multiplier', [uintCV(110)], nonce++); txCount++;
  
  // proposal-engine
  await call('proposal-engine', 'create-proposal', [
    stringAsciiCV('Community fund allocation'),
    stringAsciiCV('Allocate 10% to community'),
    uintCV(288)
  ], nonce++); txCount++;
  
  // bridge-pause-guardian
  await call('bridge-pause-guardian', 'add-guardian', [principalCV(ADDRESS)], nonce++); txCount++;
  
  // btc-tx-verifier
  await call('btc-tx-verifier', 'add-verifier', [principalCV(ADDRESS)], nonce++); txCount++;
  
  // bridge-rate-limiter
  await call('bridge-rate-limiter', 'set-global-limit', [uintCV(500000000000)], nonce++); txCount++;
  await call('bridge-rate-limiter', 'whitelist-user', [principalCV(ADDRESS)], nonce++); txCount++;
  
  // sip010-token-v1
  await call('sip010-token-v1', 'mint', [uintCV(5000000000), principalCV(ADDRESS)], nonce++); txCount++;

  console.log('\n' + '='.repeat(60));
  console.log(`Total TXs: ${txCount}`);
  console.log(`Estimated Fee: ~${(txCount * 10000 / 1000000).toFixed(2)} STX`);
  console.log('='.repeat(60));
}

main().catch(console.error);
