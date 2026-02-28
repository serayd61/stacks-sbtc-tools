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
    console.log(`  ✗ Error`);
    return false;
  }
}

async function main() {
  console.log('='.repeat(50));
  console.log('More Interactions');
  console.log('='.repeat(50));
  
  let nonce = await getCurrentNonce();
  console.log('Nonce:', nonce.toString(), '\n');
  let success = 0;

  // vault-tracker-v1
  console.log('📦 vault-tracker-v1');
  for (let i = 0; i < 8; i++) {
    if (await call('vault-tracker-v1', 'record-deposit', [uintCV((i + 10) * 100000)], nonce++)) success++;
    await new Promise(r => setTimeout(r, 150));
  }

  // defi-registry-v1
  console.log('\n📋 defi-registry-v1');
  const protocols = ['Hermetica', 'Lisa', 'Charisma', 'Stacking DAO', 'STX20'];
  for (const p of protocols) {
    if (await call('defi-registry-v1', 'register-protocol', [
      stringAsciiCV(p),
      uintCV(Math.floor(Math.random() * 50000000))
    ], nonce++)) success++;
    await new Promise(r => setTimeout(r, 150));
  }

  // defi-governance-v1
  console.log('\n🏛️ defi-governance-v1');
  const props = ['Enable staking v3', 'Add RUNES support', 'Launch mobile app'];
  for (const p of props) {
    if (await call('defi-governance-v1', 'create-proposal', [stringAsciiCV(p)], nonce++)) success++;
    await new Promise(r => setTimeout(r, 150));
  }

  // defi-pool-v1
  console.log('\n💧 defi-pool-v1');
  for (let i = 0; i < 3; i++) {
    if (await call('defi-pool-v1', 'add-liquidity', [
      uintCV(i),
      uintCV(500000),
      uintCV(300000)
    ], nonce++)) success++;
    await new Promise(r => setTimeout(r, 150));
  }

  // test-simple-v1
  console.log('\n🔢 test-simple-v1');
  for (let i = 0; i < 10; i++) {
    if (await call('test-simple-v1', 'increment', [], nonce++)) success++;
    await new Promise(r => setTimeout(r, 150));
  }

  // toolkit-proposal-engine
  console.log('\n📜 toolkit-proposal-engine');
  const tkProps = ['Upgrade v2', 'Add NFT rewards', 'Enable delegation'];
  for (const p of tkProps) {
    if (await call('toolkit-proposal-engine', 'create-proposal', [
      stringAsciiCV(p),
      stringAsciiCV('Community initiative'),
      uintCV(200)
    ], nonce++)) success++;
    await new Promise(r => setTimeout(r, 150));
  }

  console.log(`\n✓ Success: ${success}`);
}

main().catch(console.error);
