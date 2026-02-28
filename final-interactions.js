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

// Budget: ~0.85 STX = 850,000 microSTX
// Fee per TX: 8,000 microSTX = 0.008 STX
// Max TXs: ~100

async function getCurrentNonce() {
  const response = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${ADDRESS}/nonces`);
  const data = await response.json();
  return BigInt(data.possible_next_nonce);
}

async function call(contractName, functionName, functionArgs, nonce) {
  try {
    const tx = await makeContractCall({
      contractAddress: ADDRESS,
      contractName,
      functionName,
      functionArgs,
      senderKey: PRIVATE_KEY,
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      fee: 8000n,
      nonce
    });
    
    const res = await broadcastTransaction({ transaction: tx, network });
    
    if (res.error) {
      console.log(`  ✗ ${contractName}.${functionName}: ${res.reason}`);
      return false;
    }
    
    console.log(`  ✓ ${contractName}.${functionName}`);
    return true;
  } catch (e) {
    console.log(`  ✗ ${contractName}.${functionName}: ${e.message.slice(0, 50)}`);
    return false;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Final Contract Interactions - Budget: ~0.85 STX');
  console.log('='.repeat(60));
  
  let nonce = await getCurrentNonce();
  console.log('Starting nonce:', nonce.toString());
  let txCount = 0;
  let success = 0;

  // ========== toolkit-dao-core ==========
  console.log('\n🏛️ toolkit-dao-core');
  
  if (await call('toolkit-dao-core', 'initialize', [
    stringAsciiCV('Stacks Community DAO'),
    uintCV(100),
    uintCV(51)
  ], nonce++)) success++; txCount++;
  
  if (await call('toolkit-dao-core', 'add-member', [principalCV(ADDRESS)], nonce++)) success++; txCount++;
  if (await call('toolkit-dao-core', 'set-quorum', [uintCV(10)], nonce++)) success++; txCount++;

  // ========== toolkit-membership-nft ==========
  console.log('\n🎫 toolkit-membership-nft');
  
  for (let i = 0; i < 5; i++) {
    if (await call('toolkit-membership-nft', 'mint', [principalCV(ADDRESS)], nonce++)) success++;
    txCount++;
  }
  
  if (await call('toolkit-membership-nft', 'set-base-uri', [stringAsciiCV('https://api.stacks-dao.io/nft/')], nonce++)) success++; txCount++;

  // ========== toolkit-proposal-engine ==========
  console.log('\n📜 toolkit-proposal-engine');
  
  const proposals = [
    'Increase treasury allocation',
    'Add new governance module',
    'Reduce voting period',
    'Enable delegation',
    'Upgrade oracle integration'
  ];
  
  for (const p of proposals) {
    if (await call('toolkit-proposal-engine', 'create-proposal', [
      stringAsciiCV(p),
      stringAsciiCV('Community proposal'),
      uintCV(144)
    ], nonce++)) success++;
    txCount++;
  }

  // ========== toolkit-token-voting ==========
  console.log('\n🗳️ toolkit-token-voting');
  
  for (let i = 0; i < 5; i++) {
    if (await call('toolkit-token-voting', 'create-proposal', [
      stringAsciiCV(`Proposal ${i + 1}`),
      uintCV(288)
    ], nonce++)) success++;
    txCount++;
  }
  
  // Vote on proposals
  for (let i = 0; i < 5; i++) {
    if (await call('toolkit-token-voting', 'cast-vote', [
      uintCV(i),
      boolCV(true),
      uintCV(1000)
    ], nonce++)) success++;
    txCount++;
  }

  // ========== vault-tracker-v1 ==========
  console.log('\n📦 vault-tracker-v1');
  
  for (let i = 0; i < 10; i++) {
    if (await call('vault-tracker-v1', 'record-deposit', [uintCV((i + 1) * 500000)], nonce++)) success++;
    txCount++;
  }
  
  for (let i = 0; i < 5; i++) {
    if (await call('vault-tracker-v1', 'record-withdraw', [uintCV(100000)], nonce++)) success++;
    txCount++;
  }

  // ========== defi-registry-v1 ==========
  console.log('\n📋 defi-registry-v1');
  
  const newProtocols = ['StackSwap', 'STXCity', 'Gamma', 'Ryder', 'Console'];
  for (const p of newProtocols) {
    if (await call('defi-registry-v1', 'register-protocol', [
      stringAsciiCV(p),
      uintCV(Math.floor(Math.random() * 100000000))
    ], nonce++)) success++;
    txCount++;
  }
  
  // Update TVL for protocols
  for (let i = 0; i < 8; i++) {
    if (await call('defi-registry-v1', 'update-tvl', [
      uintCV(i),
      uintCV(Math.floor(Math.random() * 200000000))
    ], nonce++)) success++;
    txCount++;
  }

  // ========== defi-governance-v1 ==========
  console.log('\n🏛️ defi-governance-v1');
  
  const govProposals = [
    'Launch staking rewards v2',
    'Integrate new oracle',
    'Add BTC collateral support',
    'Reduce platform fees',
    'Enable cross-chain swaps',
    'Launch governance token',
    'Create insurance fund',
    'Add flash loan support'
  ];
  
  for (const p of govProposals) {
    if (await call('defi-governance-v1', 'create-proposal', [stringAsciiCV(p)], nonce++)) success++;
    txCount++;
  }
  
  // Vote on governance proposals
  for (let i = 0; i < 10; i++) {
    if (await call('defi-governance-v1', 'vote', [
      uintCV(i),
      boolCV(Math.random() > 0.2)
    ], nonce++)) success++;
    txCount++;
  }

  // ========== defi-pool-v1 ==========
  console.log('\n💧 defi-pool-v1');
  
  const newPools = [
    ['WELSH', 'STX', 50000000, 15000000],
    ['LEO', 'USDA', 30000000, 12000000],
    ['VELAR', 'STX', 20000000, 8000000],
    ['NOT', 'ALEX', 10000000, 5000000]
  ];
  
  for (const [a, b, ra, rb] of newPools) {
    if (await call('defi-pool-v1', 'create-pool', [
      stringAsciiCV(a),
      stringAsciiCV(b),
      uintCV(ra),
      uintCV(rb)
    ], nonce++)) success++;
    txCount++;
  }
  
  // Add liquidity to pools
  for (let i = 0; i < 6; i++) {
    if (await call('defi-pool-v1', 'add-liquidity', [
      uintCV(i),
      uintCV(2000000 + i * 500000),
      uintCV(1000000 + i * 300000)
    ], nonce++)) success++;
    txCount++;
  }

  // ========== test-simple-v1 ==========
  console.log('\n🔢 test-simple-v1');
  
  for (let i = 0; i < 15; i++) {
    if (await call('test-simple-v1', 'increment', [], nonce++)) success++;
    txCount++;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Total TXs Sent: ${txCount}`);
  console.log(`Successful: ${success}`);
  console.log(`Estimated Fee: ~${(txCount * 8000 / 1000000).toFixed(3)} STX`);
  console.log('='.repeat(60));
}

main().catch(console.error);
