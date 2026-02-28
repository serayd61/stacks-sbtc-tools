import txPkg from '@stacks/transactions';
const { 
  makeContractCall, 
  broadcastTransaction, 
  AnchorMode, 
  PostConditionMode,
  uintCV,
  principalCV
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

async function call(functionName, functionArgs, nonce, stxAmount = 0) {
  const tx = await makeContractCall({
    contractAddress: ADDRESS,
    contractName: 'yield-distributor',
    functionName,
    functionArgs,
    senderKey: PRIVATE_KEY,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    fee: 10000n, // 0.01 STX fee
    nonce
  });
  
  const res = await broadcastTransaction({ transaction: tx, network });
  
  if (res.error) {
    console.log(`  ✗ ${functionName}: ${res.reason}`);
    return null;
  }
  
  console.log(`  ✓ ${functionName}`);
  console.log(`    TX: https://explorer.hiro.so/txid/${res.txid}?chain=mainnet`);
  return res.txid;
}

async function main() {
  console.log('='.repeat(60));
  console.log('Yield Distributor - 5 İşlem (Max 3 STX)');
  console.log('='.repeat(60));
  
  let nonce = await getCurrentNonce();
  console.log('Starting nonce:', nonce.toString(), '\n');

  // 1. Set Treasury Address (0.01 STX fee)
  console.log('1. Set Treasury Address');
  await call('set-treasury', [principalCV(ADDRESS)], nonce++);

  // 2. Set LP Pool Address (0.01 STX fee)
  console.log('2. Set LP Pool Address');
  await call('set-lp-pool', [principalCV(ADDRESS)], nonce++);

  // 3. Set Minimum Deposit (0.01 STX fee)
  console.log('3. Set Minimum Deposit (0.1 STX)');
  await call('set-min-deposit', [uintCV(100000)], nonce++); // 0.1 STX

  // 4. Deposit 1 STX (1 STX + 0.01 fee)
  console.log('4. Deposit 1 STX to Yield Pool');
  await call('deposit', [uintCV(1000000)], nonce++); // 1 STX

  // 5. Inject Yield 0.5 STX (0.5 STX + 0.01 fee)
  console.log('5. Inject 0.5 STX Yield (simulating bridge fees)');
  await call('inject-yield', [uintCV(500000)], nonce++); // 0.5 STX

  console.log('\n' + '='.repeat(60));
  console.log('Toplam Harcama:');
  console.log('  - Fee: 5 x 0.01 = 0.05 STX');
  console.log('  - Deposit: 1 STX');
  console.log('  - Inject: 0.5 STX');
  console.log('  - TOPLAM: ~1.55 STX');
  console.log('='.repeat(60));
}

main().catch(console.error);
