import txPkg from '@stacks/transactions';
const { 
  makeContractDeploy,
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
import fs from 'fs';

const PRIVATE_KEY = '4c664d1c1c36f56063823b6a7cbc8185ab9bcd84d4b291500667bc7ad5e3054b01';
const ADDRESS = 'SP2PEBKJ2W1ZDDF2QQ6Y4FXKZEDPT9J9R2NKD9WJB';
const network = STACKS_MAINNET;

// Budget: 1 STX = 1,000,000 microSTX
// Deploy fee: ~12,000 microSTX
// Call fee: ~8,000 microSTX

const CONTRACTS_TO_DEPLOY = [
  { name: 'crowdfund-nft', path: '/Users/serkanaydin/stacks-crowdfund/contracts/crowdfund-nft.clar' },
  { name: 'crowdfund-governance', path: '/Users/serkanaydin/stacks-crowdfund/contracts/crowdfund-governance.clar' },
  { name: 'crowdfund-whitelist', path: '/Users/serkanaydin/stacks-crowdfund/contracts/crowdfund-whitelist.clar' },
  { name: 'crowdfund-analytics', path: '/Users/serkanaydin/stacks-crowdfund/contracts/crowdfund-analytics.clar' },
  { name: 'crowdfund-token', path: '/Users/serkanaydin/stacks-crowdfund/contracts/crowdfund-token.clar' },
  { name: 'social-content-v2', path: '/Users/serkanaydin/stacks-social-protocol/contracts/content-registry.clar' },
  { name: 'social-moderation-v2', path: '/Users/serkanaydin/stacks-social-protocol/contracts/moderation-dao.clar' },
  { name: 'social-profiles-v2', path: '/Users/serkanaydin/stacks-social-protocol/contracts/user-profiles.clar' },
];

async function getCurrentNonce() {
  const response = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${ADDRESS}/nonces`);
  const data = await response.json();
  return BigInt(data.possible_next_nonce);
}

async function deploy(name, codePath, nonce) {
  try {
    const code = fs.readFileSync(codePath, 'utf-8');
    const tx = await makeContractDeploy({
      contractName: name,
      codeBody: code,
      senderKey: PRIVATE_KEY,
      network,
      anchorMode: AnchorMode.Any,
      fee: 12000n,
      nonce
    });
    const res = await broadcastTransaction({ transaction: tx, network });
    if (res.error) {
      console.log(`  ✗ ${name}: ${res.reason}`);
      return false;
    }
    console.log(`  ✓ ${name}`);
    return true;
  } catch (e) {
    console.log(`  ✗ ${name}: ${e.message.slice(0, 40)}`);
    return false;
  }
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
  console.log('Deploy & Interact - Budget: 1 STX');
  console.log('='.repeat(60));
  
  let nonce = await getCurrentNonce();
  console.log('Starting nonce:', nonce.toString());
  let deployCount = 0;
  let callCount = 0;

  // ========== PHASE 1: Deploy Contracts ==========
  console.log('\n📦 PHASE 1: Deploying Contracts\n');
  
  for (const c of CONTRACTS_TO_DEPLOY) {
    if (await deploy(c.name, c.path, nonce++)) deployCount++;
    await new Promise(r => setTimeout(r, 200));
  }
  
  console.log(`\nDeployed: ${deployCount}/${CONTRACTS_TO_DEPLOY.length}`);
  
  // ========== PHASE 2: Interact with Existing Contracts ==========
  console.log('\n🔄 PHASE 2: Contract Interactions\n');
  
  // vault-tracker-v1
  console.log('📦 vault-tracker-v1');
  for (let i = 0; i < 10; i++) {
    if (await call('vault-tracker-v1', 'record-deposit', [uintCV((i + 20) * 100000)], nonce++)) callCount++;
    await new Promise(r => setTimeout(r, 100));
  }
  
  // defi-registry-v1
  console.log('\n📋 defi-registry-v1');
  const protocols = ['Ordinals', 'BRC20', 'Runes', 'SIP10', 'Clarity'];
  for (const p of protocols) {
    if (await call('defi-registry-v1', 'register-protocol', [
      stringAsciiCV(p),
      uintCV(Math.floor(Math.random() * 80000000))
    ], nonce++)) callCount++;
    await new Promise(r => setTimeout(r, 100));
  }
  
  // Update TVL
  for (let i = 0; i < 10; i++) {
    if (await call('defi-registry-v1', 'update-tvl', [
      uintCV(i),
      uintCV(Math.floor(Math.random() * 150000000))
    ], nonce++)) callCount++;
    await new Promise(r => setTimeout(r, 100));
  }
  
  // defi-governance-v1
  console.log('\n🏛️ defi-governance-v1');
  const proposals = [
    'Launch sBTC integration',
    'Add Ordinals support',
    'Enable cross-chain swaps',
    'Reduce gas fees',
    'Add NFT collateral',
    'Launch mobile wallet',
    'Enable staking v4',
    'Add BRC20 tokens'
  ];
  for (const p of proposals) {
    if (await call('defi-governance-v1', 'create-proposal', [stringAsciiCV(p)], nonce++)) callCount++;
    await new Promise(r => setTimeout(r, 100));
  }
  
  // Vote on proposals
  for (let i = 5; i < 20; i++) {
    if (await call('defi-governance-v1', 'vote', [uintCV(i), boolCV(Math.random() > 0.25)], nonce++)) callCount++;
    await new Promise(r => setTimeout(r, 100));
  }
  
  // defi-pool-v1
  console.log('\n💧 defi-pool-v1');
  const pools = [
    ['sBTC', 'STX'],
    ['ORDI', 'STX'],
    ['RUNE', 'USDA'],
    ['DOG', 'STX']
  ];
  for (const [a, b] of pools) {
    if (await call('defi-pool-v1', 'create-pool', [
      stringAsciiCV(a),
      stringAsciiCV(b),
      uintCV(Math.floor(Math.random() * 10000000) + 1000000),
      uintCV(Math.floor(Math.random() * 5000000) + 500000)
    ], nonce++)) callCount++;
    await new Promise(r => setTimeout(r, 100));
  }
  
  // Add liquidity
  for (let i = 0; i < 8; i++) {
    if (await call('defi-pool-v1', 'add-liquidity', [
      uintCV(i % 8),
      uintCV(500000 + i * 100000),
      uintCV(300000 + i * 50000)
    ], nonce++)) callCount++;
    await new Promise(r => setTimeout(r, 100));
  }
  
  // test-simple-v1
  console.log('\n🔢 test-simple-v1');
  for (let i = 0; i < 15; i++) {
    if (await call('test-simple-v1', 'increment', [], nonce++)) callCount++;
    await new Promise(r => setTimeout(r, 100));
  }
  
  // toolkit-proposal-engine
  console.log('\n📜 toolkit-proposal-engine');
  const tkProposals = [
    'Upgrade to v3',
    'Add quadratic voting',
    'Enable delegation',
    'Reduce quorum',
    'Add timelock'
  ];
  for (const p of tkProposals) {
    if (await call('toolkit-proposal-engine', 'create-proposal', [
      stringAsciiCV(p),
      stringAsciiCV('Community proposal'),
      uintCV(288)
    ], nonce++)) callCount++;
    await new Promise(r => setTimeout(r, 100));
  }
  
  // toolkit-dao-core
  console.log('\n🏛️ toolkit-dao-core');
  if (await call('toolkit-dao-core', 'set-quorum', [uintCV(15)], nonce++)) callCount++;
  if (await call('toolkit-dao-core', 'set-quorum', [uintCV(20)], nonce++)) callCount++;
  if (await call('toolkit-dao-core', 'set-quorum', [uintCV(25)], nonce++)) callCount++;

  console.log('\n' + '='.repeat(60));
  console.log(`📦 Deployed: ${deployCount} contracts`);
  console.log(`🔄 Interactions: ${callCount} calls`);
  console.log(`💰 Est. Fee: ~${((deployCount * 12000 + callCount * 8000) / 1000000).toFixed(3)} STX`);
  console.log('='.repeat(60));
}

main().catch(console.error);
