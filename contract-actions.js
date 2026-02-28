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
  console.log('Kontrat İşlemleri');
  console.log('='.repeat(60));
  
  let nonce = await getCurrentNonce();
  console.log('Starting nonce:', nonce.toString(), '\n');

  // 1. sbtc-vault - Deposit
  console.log('1. sBTC Vault - Deposit 1 STX');
  await call('sbtc-vault', 'deposit', [uintCV(1000000)], nonce++);

  // 2. bridge-fee-calculator - Set Fee BPS
  console.log('2. Bridge Fee Calculator - Set Fee 0.5%');
  await call('bridge-fee-calculator', 'set-fee-bps', [uintCV(50)], nonce++);

  // 3. proposal-engine - Create Proposal
  console.log('3. Proposal Engine - Create New Proposal');
  await call('proposal-engine', 'create-proposal', [
    stringAsciiCV('Upgrade bridge v2'),
    stringAsciiCV('Proposal for bridge upgrade'),
    uintCV(288)
  ], nonce++);

  // 4. peg-ratio-tracker - Add Updater
  console.log('4. Peg Ratio Tracker - Add Updater');
  await call('peg-ratio-tracker', 'add-updater', [principalCV(ADDRESS)], nonce++);

  // 5. bridge-analytics - Add Reporter
  console.log('5. Bridge Analytics - Add Reporter');
  await call('bridge-analytics', 'add-reporter', [principalCV(ADDRESS)], nonce++);

  // 6. sbtc-vault - Set APY
  console.log('6. sBTC Vault - Set APY 5%');
  await call('sbtc-vault', 'set-apy-bps', [uintCV(500)], nonce++);

  // 7. bridge-rate-limiter - Set Global Limit
  console.log('7. Bridge Rate Limiter - Set Global Limit');
  await call('bridge-rate-limiter', 'set-global-limit', [uintCV(100000000000)], nonce++);

  // 8. token-voting - Set Quorum
  console.log('8. Token Voting - Set Quorum');
  await call('token-voting', 'set-quorum', [uintCV(1000)], nonce++);

  console.log('\n' + '='.repeat(60));
  console.log('8 İşlem Gönderildi!');
  console.log('='.repeat(60));
}

main().catch(console.error);
