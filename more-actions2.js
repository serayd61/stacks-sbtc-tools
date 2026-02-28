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
  
  console.log(`  ✓ ${contractName}.${functionName}`);
  return res.txid;
}

async function main() {
  console.log('='.repeat(60));
  console.log('Ek Kontrat İşlemleri - Batch 2');
  console.log('='.repeat(60));
  
  let nonce = await getCurrentNonce();
  console.log('Starting nonce:', nonce.toString(), '\n');

  // 1. bridge-fee-calculator - Record Fee Collection
  console.log('1. Bridge Fee Calculator - Record Fee Collection');
  await call('bridge-fee-calculator', 'record-fee-collection', [
    uintCV(50000)  // 0.05 STX fee collected
  ], nonce++);

  // 2. bridge-fee-calculator - Set Congestion Multiplier
  console.log('2. Bridge Fee Calculator - Set Congestion Multiplier');
  await call('bridge-fee-calculator', 'set-congestion-multiplier', [
    uintCV(100)  // 1x multiplier (100 = 1.00)
  ], nonce++);

  // 3. token-voting - Create Proposal
  console.log('3. Token Voting - Create Proposal');
  await call('token-voting', 'create-proposal', [
    stringAsciiCV('Increase APY to 7%'),
    uintCV(144)  // voting period
  ], nonce++);

  // 4. proposal-engine - Create Proposal
  console.log('4. Proposal Engine - Create Proposal');
  await call('proposal-engine', 'create-proposal', [
    stringAsciiCV('Add new bridge route'),
    stringAsciiCV('Proposal to add ETH bridge'),
    uintCV(288)  // discussion period
  ], nonce++);

  // 5. btc-tx-verifier - Update Confirmations
  console.log('5. BTC TX Verifier - Update Confirmations');
  await call('btc-tx-verifier', 'update-confirmations', [
    uintCV(1),  // tx id
    uintCV(6)   // confirmations
  ], nonce++);

  console.log('\n' + '='.repeat(60));
  console.log('Batch 2 Tamamlandı!');
  console.log('='.repeat(60));
}

main().catch(console.error);
