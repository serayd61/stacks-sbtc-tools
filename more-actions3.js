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
  
  console.log(`  ✓ ${contractName}.${functionName}: ${res.txid}`);
  return res.txid;
}

async function main() {
  console.log('='.repeat(60));
  console.log('Ek Kontrat İşlemleri - Batch 3');
  console.log('='.repeat(60));
  
  let nonce = await getCurrentNonce();
  console.log('Starting nonce:', nonce.toString(), '\n');

  // 1. sbtc-vault - Withdraw (0.1 STX)
  console.log('1. sBTC Vault - Withdraw 0.1 STX');
  await call('sbtc-vault', 'withdraw', [
    uintCV(100000)  // 0.1 STX
  ], nonce++);

  // 2. bridge-pause-guardian - Check Status
  console.log('2. Bridge Pause Guardian - Resume');
  await call('bridge-pause-guardian', 'resume', [], nonce++);

  // 3. sip010-token-v1 - Transfer
  console.log('3. SIP010 Token - Transfer 100 tokens');
  await call('sip010-token-v1', 'transfer', [
    uintCV(100000000),  // 100 tokens
    principalCV(ADDRESS),  // from
    principalCV('SP000000000000000000002Q6VF78'),  // to (burn address)
    stringAsciiCV('')  // memo (none)
  ], nonce++);

  // 4. membership-nft - Mint NFT
  console.log('4. Membership NFT - Mint');
  await call('membership-nft', 'mint', [
    principalCV(ADDRESS)  // recipient
  ], nonce++);

  // 5. bridge-liquidity-pool - Add Liquidity
  console.log('5. Bridge Liquidity Pool - Add Liquidity 0.5 STX');
  await call('bridge-liquidity-pool', 'add-liquidity', [
    uintCV(500000)  // 0.5 STX
  ], nonce++);

  console.log('\n' + '='.repeat(60));
  console.log('Batch 3 Tamamlandı!');
  console.log('='.repeat(60));
}

main().catch(console.error);
