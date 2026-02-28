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
    fee: 15000n,
    nonce
  });
  
  const res = await broadcastTransaction({ transaction: tx, network });
  
  if (res.error) {
    console.log(`  ✗ ${contractName}.${functionName}: ${res.reason}`);
    return null;
  }
  
  console.log(`  ✓ ${contractName}.${functionName}: ${res.txid.slice(0, 20)}...`);
  return res.txid;
}

async function main() {
  console.log('='.repeat(60));
  console.log('Kontrat İşlemleri - Batch 2');
  console.log('='.repeat(60));
  
  let nonce = await getCurrentNonce();
  console.log('Starting nonce:', nonce.toString(), '\n');

  // 1. btc-tx-verifier - Add Verifier
  console.log('1. BTC TX Verifier - Add Verifier');
  await call('btc-tx-verifier', 'add-verifier', [principalCV(ADDRESS)], nonce++);

  // 2. crosschain-verifier - Register Relayer
  console.log('2. Crosschain Verifier - Register Relayer');
  await call('crosschain-verifier', 'register-relayer', [principalCV(ADDRESS)], nonce++);

  // 3. bridge-pause-guardian - Add Guardian
  console.log('3. Bridge Pause Guardian - Add Guardian');
  await call('bridge-pause-guardian', 'add-guardian', [principalCV(ADDRESS)], nonce++);

  // 4. sbtc-reserve-auditor - Add Auditor
  console.log('4. sBTC Reserve Auditor - Add Auditor');
  await call('sbtc-reserve-auditor', 'add-auditor', [principalCV(ADDRESS)], nonce++);

  // 5. membership-nft - Mint
  console.log('5. Membership NFT - Mint');
  await call('membership-nft', 'mint', [principalCV(ADDRESS)], nonce++);

  // 6. sip010-token-v1 - Mint
  console.log('6. SIP010 Token - Mint 1000 tokens');
  await call('sip010-token-v1', 'mint', [uintCV(1000000000), principalCV(ADDRESS)], nonce++);

  // 7. bridge-liquidity-pool - Add Liquidity
  console.log('7. Bridge Liquidity Pool - Add Liquidity 2 STX');
  await call('bridge-liquidity-pool', 'add-liquidity', [uintCV(2000000)], nonce++);

  // 8. sbtc-vault - Withdraw
  console.log('8. sBTC Vault - Withdraw 0.5 STX');
  await call('sbtc-vault', 'withdraw', [uintCV(500000)], nonce++);

  console.log('\n' + '='.repeat(60));
  console.log('Batch 2 Tamamlandı!');
  console.log('='.repeat(60));
}

main().catch(console.error);
