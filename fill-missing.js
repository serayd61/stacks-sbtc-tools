import txPkg from '@stacks/transactions';
const { makeSTXTokenTransfer, broadcastTransaction, AnchorMode } = txPkg;
import netPkg from '@stacks/network';
const { STACKS_MAINNET } = netPkg;

const PRIVATE_KEY = '4c664d1c1c36f56063823b6a7cbc8185ab9bcd84d4b291500667bc7ad5e3054b01';
const BURN_ADDRESS = 'SP000000000000000000002Q6VF78';
const network = STACKS_MAINNET;

const MISSING_NONCES = [506, 507, 508, 509, 510, 511, 512, 513, 519, 520, 521, 522, 523];

async function main() {
  console.log('Filling', MISSING_NONCES.length, 'missing nonces...\n');
  
  for (const nonce of MISSING_NONCES) {
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
      if (res.error) {
        console.log(`  ✗ Nonce ${nonce}: ${res.reason}`);
      } else {
        console.log(`  ✓ Nonce ${nonce}`);
      }
    } catch (e) {
      console.log(`  ✗ Nonce ${nonce}: ${e.message.slice(0, 40)}`);
    }
    await new Promise(r => setTimeout(r, 100));
  }
  
  console.log('\nDone!');
}

main().catch(console.error);
