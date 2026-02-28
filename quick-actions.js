import txPkg from '@stacks/transactions';
const { 
  makeContractCall, 
  broadcastTransaction, 
  AnchorMode, 
  PostConditionMode,
  stringAsciiCV,
  uintCV,
  principalCV,
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
  console.log(`  ✓ ${contractName}.${functionName} - ${res.txid.slice(0,12)}...`);
  return res.txid;
}

async function main() {
  console.log('='.repeat(60));
  console.log('Quick Contract Actions');
  console.log('='.repeat(60));
  
  let nonce = await getCurrentNonce();
  console.log('Starting nonce:', nonce.toString(), '\n');

  // 1. membership-nft: Add admin
  console.log('1. Membership NFT - Add Admin');
  await call('membership-nft', 'add-admin', [principalCV(ADDRESS)], nonce++);

  // 2. membership-nft: Mint membership NFT (tier 3 = founding)
  console.log('2. Membership NFT - Mint Founding Member');
  await call('membership-nft', 'mint-membership', [principalCV(ADDRESS), uintCV(3)], nonce++);

  // 3. token-voting: Set token balance for voting power
  console.log('3. Token Voting - Set Balance (1000 tokens)');
  await call('token-voting', 'set-token-balance', [principalCV(ADDRESS), uintCV(1000000000)], nonce++);

  // 4. token-voting: Create a proposal
  console.log('4. Token Voting - Create Proposal');
  await call('token-voting', 'create-proposal', [
    stringAsciiCV('Enable Quadratic Voting'),
    stringAsciiCV('Proposal to enable quadratic voting for fairer governance'),
    uintCV(144)
  ], nonce++);

  // 5. token-voting: Vote on proposal (id=0)
  console.log('5. Token Voting - Vote YES on Proposal #0');
  await call('token-voting', 'cast-vote', [uintCV(0), boolCV(true)], nonce++);

  // 6. bridge-analytics: Add reporter
  console.log('6. Bridge Analytics - Add Reporter');
  await call('bridge-analytics', 'add-reporter', [principalCV(ADDRESS)], nonce++);

  // 7. bridge-analytics: Record daily stats
  console.log('7. Bridge Analytics - Record Daily Stats');
  await call('bridge-analytics', 'record-daily-stats', [
    uintCV(150),      // peg-in count
    uintCV(120),      // peg-out count
    uintCV(500000000000), // peg-in volume (5 BTC)
    uintCV(400000000000), // peg-out volume (4 BTC)
    uintCV(85),       // unique users
    uintCV(1000000),  // fees collected
    uintCV(3),        // failed count
    uintCV(12)        // avg confirmation time
  ], nonce++);

  // 8. peg-ratio-tracker: Add updater
  console.log('8. Peg Ratio Tracker - Add Updater');
  await call('peg-ratio-tracker', 'add-updater', [principalCV(ADDRESS)], nonce++);

  // 9. peg-ratio-tracker: Update ratio (perfect peg)
  console.log('9. Peg Ratio Tracker - Update Ratio');
  await call('peg-ratio-tracker', 'update-ratio', [
    uintCV(1000000),    // ratio (1.0 = perfect peg)
    uintCV(21000000000000), // sbtc supply
    uintCV(21000000000000)  // btc reserve
  ], nonce++);

  // 10. sbtc-vault: Deposit 1 STX
  console.log('10. sBTC Vault - Deposit 1 STX');
  await call('sbtc-vault', 'deposit', [uintCV(1000000)], nonce++);

  console.log('\n' + '='.repeat(60));
  console.log('Done! 10 transactions submitted.');
  console.log('='.repeat(60));
}

main().catch(console.error);
