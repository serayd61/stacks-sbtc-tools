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
  console.log(`  ✓ ${contractName}.${functionName} - TX: ${res.txid.slice(0,16)}...`);
  return res.txid;
}

async function main() {
  console.log('='.repeat(60));
  console.log('Additional Contract Activations');
  console.log('='.repeat(60));
  
  let nonce = await getCurrentNonce();
  console.log('Starting nonce:', nonce.toString(), '\n');

  // bridge-fee-calculator
  console.log('1. Bridge Fee Calculator - Set Base Fee');
  await call('bridge-fee-calculator', 'set-base-fee', [uintCV(1000)], nonce++);

  // bridge-rate-limiter
  console.log('2. Bridge Rate Limiter - Set Daily Limit');
  await call('bridge-rate-limiter', 'set-daily-limit', [uintCV(100000000000)], nonce++);

  // bridge-pause-guardian
  console.log('3. Bridge Pause Guardian - Add Guardian');
  await call('bridge-pause-guardian', 'add-guardian', [principalCV(ADDRESS)], nonce++);

  // btc-tx-verifier
  console.log('4. BTC TX Verifier - Register Verifier');
  await call('btc-tx-verifier', 'register-verifier', [principalCV(ADDRESS)], nonce++);

  // sip010-token-v1
  console.log('5. SIP010 Token - Mint Initial Supply');
  await call('sip010-token-v1', 'mint', [uintCV(1000000000), principalCV(ADDRESS)], nonce++);

  // proposal-engine
  console.log('6. Proposal Engine - Set Min Proposal Threshold');
  await call('proposal-engine', 'set-min-proposal-threshold', [uintCV(100)], nonce++);

  // token-voting
  console.log('7. Token Voting - Set Quorum');
  await call('token-voting', 'set-quorum', [uintCV(10)], nonce++);

  console.log('\n' + '='.repeat(60));
  console.log('Done!');
  console.log('='.repeat(60));
}

main().catch(console.error);
