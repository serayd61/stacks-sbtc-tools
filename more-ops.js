import txPkg from '@stacks/transactions';
const { 
  makeContractCall, 
  broadcastTransaction, 
  AnchorMode, 
  PostConditionMode,
  uintCV,
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
  console.log('Additional Contract Operations');
  console.log('='.repeat(60));
  
  let nonce = await getCurrentNonce();
  console.log('Starting nonce:', nonce.toString());
  let callCount = 0;

  // New deployed contracts
  console.log('\n📦 crowdfund-nft');
  for (let i = 0; i < 5; i++) {
    if (await call('crowdfund-nft', 'mint', [uintCV(i + 100), stringAsciiCV(`Backer #${i + 100}`)], nonce++)) callCount++;
    await new Promise(r => setTimeout(r, 150));
  }

  console.log('\n🗳️ crowdfund-governance');
  const proposals = ['Enable refunds', 'Add milestone voting', 'Reduce fee to 2%'];
  for (const p of proposals) {
    if (await call('crowdfund-governance', 'create-proposal', [stringAsciiCV(p)], nonce++)) callCount++;
    await new Promise(r => setTimeout(r, 150));
  }
  for (let i = 0; i < 5; i++) {
    if (await call('crowdfund-governance', 'vote', [uintCV(i), boolCV(true)], nonce++)) callCount++;
    await new Promise(r => setTimeout(r, 150));
  }

  console.log('\n📋 crowdfund-whitelist');
  const addresses = [
    'SP1JTCR202ECC6333N7ZXD7MK7E3ZTEEE1MJ73C60',
    'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9',
    'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR'
  ];
  for (const addr of addresses) {
    if (await call('crowdfund-whitelist', 'add-to-whitelist', [stringAsciiCV(addr)], nonce++)) callCount++;
    await new Promise(r => setTimeout(r, 150));
  }

  console.log('\n📊 crowdfund-analytics');
  for (let i = 0; i < 5; i++) {
    if (await call('crowdfund-analytics', 'record-contribution', [
      uintCV(i),
      uintCV((i + 1) * 500000)
    ], nonce++)) callCount++;
    await new Promise(r => setTimeout(r, 150));
  }

  console.log('\n🪙 crowdfund-token');
  if (await call('crowdfund-token', 'set-token-uri', [stringAsciiCV('https://crowdfund.stx/token')], nonce++)) callCount++;

  console.log('\n📝 social-content-v2');
  const posts = ['First post on Stacks', 'Building DeFi', 'sBTC is live'];
  for (const p of posts) {
    if (await call('social-content-v2', 'create-content', [stringAsciiCV(p)], nonce++)) callCount++;
    await new Promise(r => setTimeout(r, 150));
  }

  console.log('\n⚖️ social-moderation-v2');
  if (await call('social-moderation-v2', 'create-proposal', [stringAsciiCV('Ban spam accounts')], nonce++)) callCount++;
  if (await call('social-moderation-v2', 'vote', [uintCV(0), boolCV(true)], nonce++)) callCount++;

  console.log('\n👤 social-profiles-v2');
  if (await call('social-profiles-v2', 'update-profile', [
    stringAsciiCV('StacksDev'),
    stringAsciiCV('Building on Bitcoin')
  ], nonce++)) callCount++;

  // Existing contracts
  console.log('\n🏛️ defi-governance-v1');
  const newProposals = ['Add sBTC pools', 'Enable flash loans', 'Launch v2'];
  for (const p of newProposals) {
    if (await call('defi-governance-v1', 'create-proposal', [stringAsciiCV(p)], nonce++)) callCount++;
    await new Promise(r => setTimeout(r, 150));
  }

  console.log('\n💧 defi-pool-v1');
  for (let i = 0; i < 3; i++) {
    if (await call('defi-pool-v1', 'add-liquidity', [
      uintCV(i),
      uintCV(1000000 + i * 200000),
      uintCV(500000 + i * 100000)
    ], nonce++)) callCount++;
    await new Promise(r => setTimeout(r, 150));
  }

  console.log('\n🔢 test-simple-v1');
  for (let i = 0; i < 10; i++) {
    if (await call('test-simple-v1', 'increment', [], nonce++)) callCount++;
    await new Promise(r => setTimeout(r, 150));
  }

  console.log('\n' + '='.repeat(60));
  console.log(`🔄 Total Interactions: ${callCount}`);
  console.log(`💰 Est. Fee: ~${(callCount * 8000 / 1000000).toFixed(3)} STX`);
  console.log('='.repeat(60));
}

main().catch(console.error);
