import txPkg from '@stacks/transactions';
const { makeSTXTokenTransfer, broadcastTransaction, AnchorMode } = txPkg;
import netPkg from '@stacks/network';
const { STACKS_MAINNET } = netPkg;

const PRIVATE_KEY = '4c664d1c1c36f56063823b6a7cbc8185ab9bcd84d4b291500667bc7ad5e3054b01';
const BURN_ADDRESS = 'SP000000000000000000002Q6VF78';
const network = STACKS_MAINNET;

async function main() {
  for (const nonce of [575, 576]) {
    try {
      const tx = await makeSTXTokenTransfer({
        recipient: BURN_ADDRESS,
        amount: 1n,
        senderKey: PRIVATE_KEY,
        network,
        anchorMode: AnchorMode.Any,
        fee: 5000n,
        nonce: BigInt(nonce)
      });
      const res = await broadcastTransaction({ transaction: tx, network });
      console.log(`Nonce ${nonce}:`, res.error ? res.reason : 'OK');
    } catch (e) {
      console.log(`Nonce ${nonce}: error`);
    }
  }
}

main();
