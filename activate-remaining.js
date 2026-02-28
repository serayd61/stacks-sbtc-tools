import txPkg from '@stacks/transactions';
const { 
  makeContractCall, 
  broadcastTransaction, 
  AnchorMode, 
  PostConditionMode,
  stringAsciiCV,
  uintCV,
  principalCV,
  someCV
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
  console.log('Activate Remaining Bridge Contracts');
  console.log('='.repeat(60));
  
  let nonce = await getCurrentNonce();
  console.log('Starting nonce:', nonce.toString(), '\n');

  // sbtc-reserve-auditor
  console.log('1. sBTC Reserve Auditor - Add Auditor');
  await call('sbtc-reserve-auditor', 'add-auditor', [principalCV(ADDRESS)], nonce++);

  console.log('2. sBTC Reserve Auditor - Submit Reserve Proof');
  await call('sbtc-reserve-auditor', 'submit-reserve-proof', [
    stringAsciiCV('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'),
    uintCV(2100000000000000)
  ], nonce++);

  console.log('3. sBTC Reserve Auditor - Update Supply');
  await call('sbtc-reserve-auditor', 'update-sbtc-supply', [uintCV(2100000000000000)], nonce++);

  // crosschain-verifier
  console.log('4. Crosschain Verifier - Register Relayer');
  await call('crosschain-verifier', 'register-relayer', [], nonce++);

  // bridge-liquidity-pool
  console.log('5. Bridge Liquidity Pool - Add Liquidity (1 STX)');
  await call('bridge-liquidity-pool', 'add-liquidity', [uintCV(1000000)], nonce++);

  console.log('\n' + '='.repeat(60));
  console.log('Done!');
  console.log('='.repeat(60));
}

main().catch(console.error);
