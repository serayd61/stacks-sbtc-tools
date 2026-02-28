import txPkg from '@stacks/transactions';
const { 
  makeContractCall, 
  broadcastTransaction, 
  AnchorMode, 
  PostConditionMode,
  stringAsciiCV,
  uintCV,
  principalCV,
  boolCV,
  bufferCV
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
  console.log('Final Contract Activations');
  console.log('='.repeat(60));
  
  let nonce = await getCurrentNonce();
  console.log('Starting nonce:', nonce.toString(), '\n');

  // bridge-fee-calculator
  console.log('1. Bridge Fee Calculator - Set Fee BPS (0.5%)');
  await call('bridge-fee-calculator', 'set-fee-bps', [uintCV(50)], nonce++);

  console.log('2. Bridge Fee Calculator - Set Fee Collector');
  await call('bridge-fee-calculator', 'set-fee-collector', [principalCV(ADDRESS)], nonce++);

  // bridge-rate-limiter
  console.log('3. Bridge Rate Limiter - Set Global Limit (1B sats)');
  await call('bridge-rate-limiter', 'set-global-limit', [uintCV(100000000000)], nonce++);

  console.log('4. Bridge Rate Limiter - Toggle Limiter ON');
  await call('bridge-rate-limiter', 'toggle-limiter', [boolCV(true)], nonce++);

  // btc-tx-verifier
  console.log('5. BTC TX Verifier - Add Verifier');
  await call('btc-tx-verifier', 'add-verifier', [principalCV(ADDRESS)], nonce++);

  // proposal-engine
  console.log('6. Proposal Engine - Add Proposer');
  await call('proposal-engine', 'add-proposer', [principalCV(ADDRESS)], nonce++);

  console.log('7. Proposal Engine - Set Discussion Period (144 blocks)');
  await call('proposal-engine', 'set-discussion-period', [uintCV(144)], nonce++);

  // token-voting
  console.log('8. Token Voting - Set Token Balance (1000)');
  await call('token-voting', 'set-token-balance', [principalCV(ADDRESS), uintCV(1000)], nonce++);

  console.log('9. Token Voting - Enable Quadratic Voting');
  await call('token-voting', 'set-quadratic-voting', [boolCV(true)], nonce++);

  // peg-ratio-tracker
  console.log('10. Peg Ratio Tracker - Update Ratio');
  await call('peg-ratio-tracker', 'update-peg-ratio', [uintCV(100000000)], nonce++);

  console.log('\n' + '='.repeat(60));
  console.log('Done!');
  console.log('='.repeat(60));
}

main().catch(console.error);
