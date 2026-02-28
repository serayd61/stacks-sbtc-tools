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
  noneCV,
  someCV
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
    console.log(`  ✗ ${contractName}.${functionName}: ${e.message.slice(0, 50)}`);
    return false;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Correct Contract Operations');
  console.log('='.repeat(60));
  
  let nonce = await getCurrentNonce();
  console.log('Starting nonce:', nonce.toString());
  let callCount = 0;

  // crowdfund-nft: mint-reward(recipient, tier, campaign-id)
  console.log('\n📦 crowdfund-nft');
  for (let i = 0; i < 5; i++) {
    if (await call('crowdfund-nft', 'mint-reward', [
      principalCV(ADDRESS),
      uintCV(i + 1),
      uintCV(100 + i)
    ], nonce++)) callCount++;
    await new Promise(r => setTimeout(r, 200));
  }

  // crowdfund-governance: create-proposal(title, description, proposal-type, target, param-value, duration)
  console.log('\n🗳️ crowdfund-governance');
  const proposals = [
    ['Enable refunds', 'Allow backers to get refunds'],
    ['Add milestones', 'Milestone-based funding'],
    ['Lower fees', 'Reduce platform fee to 2%']
  ];
  for (const [title, desc] of proposals) {
    if (await call('crowdfund-governance', 'create-proposal', [
      stringAsciiCV(title),
      stringAsciiCV(desc),
      uintCV(1),
      noneCV(),
      noneCV(),
      uintCV(144)
    ], nonce++)) callCount++;
    await new Promise(r => setTimeout(r, 200));
  }

  // crowdfund-whitelist: verify-creator(creator, tier, max-goal)
  console.log('\n📋 crowdfund-whitelist');
  if (await call('crowdfund-whitelist', 'verify-creator', [
    principalCV(ADDRESS),
    uintCV(3),
    uintCV(100000000)
  ], nonce++)) callCount++;
  
  if (await call('crowdfund-whitelist', 'verify-backer', [
    principalCV(ADDRESS),
    uintCV(50000000)
  ], nonce++)) callCount++;

  // crowdfund-analytics: record-contribution(backer, amount, is-new-backer)
  console.log('\n📊 crowdfund-analytics');
  for (let i = 0; i < 5; i++) {
    if (await call('crowdfund-analytics', 'record-contribution', [
      principalCV(ADDRESS),
      uintCV((i + 1) * 1000000),
      boolCV(i === 0)
    ], nonce++)) callCount++;
    await new Promise(r => setTimeout(r, 200));
  }

  // record-campaign-created
  const categories = ['Tech', 'Art', 'Music', 'Gaming'];
  for (const cat of categories) {
    if (await call('crowdfund-analytics', 'record-campaign-created', [
      stringAsciiCV(cat),
      uintCV(10000000 + Math.floor(Math.random() * 50000000))
    ], nonce++)) callCount++;
    await new Promise(r => setTimeout(r, 200));
  }

  // crowdfund-token
  console.log('\n🪙 crowdfund-token');
  const tokenResponse = await fetch(`https://api.mainnet.hiro.so/v2/contracts/interface/${ADDRESS}/crowdfund-token`);
  if (tokenResponse.ok) {
    const tokenInterface = await tokenResponse.json();
    const publicFuncs = tokenInterface.functions.filter(f => f.access === 'public').map(f => f.name);
    console.log('  Available functions:', publicFuncs.join(', '));
    
    if (publicFuncs.includes('mint')) {
      if (await call('crowdfund-token', 'mint', [uintCV(1000000), principalCV(ADDRESS)], nonce++)) callCount++;
    }
  }

  // social contracts
  console.log('\n📝 social-content-v2');
  const socialResponse = await fetch(`https://api.mainnet.hiro.so/v2/contracts/interface/${ADDRESS}/social-content-v2`);
  if (socialResponse.ok) {
    const socialInterface = await socialResponse.json();
    const publicFuncs = socialInterface.functions.filter(f => f.access === 'public').map(f => f.name);
    console.log('  Available functions:', publicFuncs.join(', '));
  } else {
    console.log('  Contract not found');
  }

  // defi-governance-v1
  console.log('\n🏛️ defi-governance-v1');
  const govProposals = ['sBTC integration', 'Flash loans', 'Protocol v2'];
  for (const p of govProposals) {
    if (await call('defi-governance-v1', 'create-proposal', [stringAsciiCV(p)], nonce++)) callCount++;
    await new Promise(r => setTimeout(r, 200));
  }

  // test-simple-v1
  console.log('\n🔢 test-simple-v1');
  for (let i = 0; i < 10; i++) {
    if (await call('test-simple-v1', 'increment', [], nonce++)) callCount++;
    await new Promise(r => setTimeout(r, 200));
  }

  // toolkit-dao-core
  console.log('\n🏛️ toolkit-dao-core');
  for (let q of [10, 15, 20]) {
    if (await call('toolkit-dao-core', 'set-quorum', [uintCV(q)], nonce++)) callCount++;
    await new Promise(r => setTimeout(r, 200));
  }

  // vault-tracker-v1
  console.log('\n📦 vault-tracker-v1');
  for (let i = 0; i < 5; i++) {
    if (await call('vault-tracker-v1', 'record-deposit', [uintCV((i + 30) * 100000)], nonce++)) callCount++;
    await new Promise(r => setTimeout(r, 200));
  }

  console.log('\n' + '='.repeat(60));
  console.log(`🔄 Total Interactions: ${callCount}`);
  console.log(`💰 Est. Fee: ~${(callCount * 8000 / 1000000).toFixed(3)} STX`);
  console.log('='.repeat(60));
}

main().catch(console.error);
