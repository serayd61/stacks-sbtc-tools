import txPkg from '@stacks/transactions';
const { 
  makeContractCall, 
  broadcastTransaction, 
  AnchorMode, 
  PostConditionMode,
  uintCV,
  principalCV,
  stringAsciiCV,
  boolCV,
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
    console.log(`  ✗ ${contractName}.${functionName}: error`);
    return false;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Final Contract Operations - Remaining Budget');
  console.log('='.repeat(60));
  
  let nonce = await getCurrentNonce();
  console.log('Starting nonce:', nonce.toString());
  let callCount = 0;

  // crowdfund-analytics
  console.log('\n📊 crowdfund-analytics');
  const categories = ['Tech', 'Art', 'Music', 'Gaming', 'Film'];
  for (const cat of categories) {
    if (await call('crowdfund-analytics', 'record-campaign-created', [
      stringAsciiCV(cat),
      uintCV(10000000 + Math.floor(Math.random() * 50000000))
    ], nonce++)) callCount++;
    await new Promise(r => setTimeout(r, 300));
  }

  // record-campaign-result
  for (let i = 0; i < 3; i++) {
    if (await call('crowdfund-analytics', 'record-campaign-result', [
      stringAsciiCV(categories[i]),
      uintCV(8000000 + i * 1000000),
      boolCV(true),
      uintCV(50 + i * 10)
    ], nonce++)) callCount++;
    await new Promise(r => setTimeout(r, 300));
  }

  // defi-governance-v1
  console.log('\n🏛️ defi-governance-v1');
  const proposals = ['sBTC pools', 'Flash loans', 'Protocol v2', 'NFT collateral', 'Cross-chain'];
  for (const p of proposals) {
    if (await call('defi-governance-v1', 'create-proposal', [stringAsciiCV(p)], nonce++)) callCount++;
    await new Promise(r => setTimeout(r, 300));
  }

  // Vote on proposals
  for (let i = 20; i < 30; i++) {
    if (await call('defi-governance-v1', 'vote', [uintCV(i), boolCV(Math.random() > 0.3)], nonce++)) callCount++;
    await new Promise(r => setTimeout(r, 300));
  }

  // test-simple-v1
  console.log('\n🔢 test-simple-v1');
  for (let i = 0; i < 15; i++) {
    if (await call('test-simple-v1', 'increment', [], nonce++)) callCount++;
    await new Promise(r => setTimeout(r, 300));
  }

  // toolkit-dao-core
  console.log('\n🏛️ toolkit-dao-core');
  for (let q of [12, 18, 22, 25, 30]) {
    if (await call('toolkit-dao-core', 'set-quorum', [uintCV(q)], nonce++)) callCount++;
    await new Promise(r => setTimeout(r, 300));
  }

  // toolkit-proposal-engine
  console.log('\n📜 toolkit-proposal-engine');
  const tkProposals = ['Upgrade v3', 'Quadratic voting', 'Delegation', 'Timelock', 'Multi-sig'];
  for (const p of tkProposals) {
    if (await call('toolkit-proposal-engine', 'create-proposal', [
      stringAsciiCV(p),
      stringAsciiCV('Community proposal'),
      uintCV(288)
    ], nonce++)) callCount++;
    await new Promise(r => setTimeout(r, 300));
  }

  // vault-tracker-v1
  console.log('\n📦 vault-tracker-v1');
  for (let i = 0; i < 8; i++) {
    if (await call('vault-tracker-v1', 'record-deposit', [uintCV((i + 50) * 100000)], nonce++)) callCount++;
    await new Promise(r => setTimeout(r, 300));
  }

  // defi-pool-v1
  console.log('\n💧 defi-pool-v1');
  for (let i = 0; i < 5; i++) {
    if (await call('defi-pool-v1', 'add-liquidity', [
      uintCV(i),
      uintCV(2000000 + i * 500000),
      uintCV(1000000 + i * 250000)
    ], nonce++)) callCount++;
    await new Promise(r => setTimeout(r, 300));
  }

  // defi-registry-v1
  console.log('\n📋 defi-registry-v1');
  const newProtocols = ['Velar', 'Alex', 'Arkadiko', 'Zest', 'Bitflow'];
  for (const p of newProtocols) {
    if (await call('defi-registry-v1', 'register-protocol', [
      stringAsciiCV(p),
      uintCV(Math.floor(Math.random() * 100000000))
    ], nonce++)) callCount++;
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('\n' + '='.repeat(60));
  console.log(`🔄 Total Interactions: ${callCount}`);
  console.log(`💰 Est. Fee: ~${(callCount * 8000 / 1000000).toFixed(3)} STX`);
  console.log('='.repeat(60));
}

main().catch(console.error);
