import txPkg from '@stacks/transactions';
const { makeSTXTokenTransfer, broadcastTransaction, AnchorMode } = txPkg;
import netPkg from '@stacks/network';
const { STACKS_MAINNET } = netPkg;

const PRIVATE_KEY = '4c664d1c1c36f56063823b6a7cbc8185ab9bcd84d4b291500667bc7ad5e3054b01';
const network = STACKS_MAINNET;

const MISSING = [415, 416, 418, 419, 420, 421, 422, 423, 429, 430, 431, 432, 433, 434, 435, 436, 437, 438];

async function fill(nonce) {
  const tx = await makeSTXTokenTransfer({
    recipient: 'SP000000000000000000002Q6VF78',
    amount: 1n,
    senderKey: PRIVATE_KEY,
    network,
    anchorMode: AnchorMode.Any,
    fee: 5000n,
    nonce: BigInt(nonce)
  });
  const res = await broadcastTransaction({ transaction: tx, network });
  console.log(`Nonce ${nonce}:`, res.error ? res.reason : 'OK');
}

console.log(`Filling ${MISSING.length} missing nonces...`);
for (const n of MISSING) {
  await fill(n);
  await new Promise(r => setTimeout(r, 200));
}
console.log('Done!');
