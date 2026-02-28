import txPkg from '@stacks/transactions';
const { 
  makeSTXTokenTransfer, 
  broadcastTransaction, 
  AnchorMode
} = txPkg;
import netPkg from '@stacks/network';
const { STACKS_MAINNET } = netPkg;

const PRIVATE_KEY = '4c664d1c1c36f56063823b6a7cbc8185ab9bcd84d4b291500667bc7ad5e3054b01';
const ADDRESS = 'SP2PEBKJ2W1ZDDF2QQ6Y4FXKZEDPT9J9R2NKD9WJB';
const network = STACKS_MAINNET;

const MISSING_NONCES = [283, 284, 286, 298, 301, 303, 304, 306, 308];

async function fillNonce(nonce) {
  const tx = await makeSTXTokenTransfer({
    recipient: 'SP000000000000000000002Q6VF78', // burn address
    amount: 1n,
    senderKey: PRIVATE_KEY,
    network,
    anchorMode: AnchorMode.Any,
    fee: 10000n,
    nonce: BigInt(nonce)
  });
  
  const res = await broadcastTransaction({ transaction: tx, network });
  
  if (res.error) {
    console.log(`  ✗ Nonce ${nonce}: ${res.reason}`);
    return false;
  }
  
  console.log(`  ✓ Nonce ${nonce}: ${res.txid.slice(0, 16)}...`);
  return true;
}

async function main() {
  console.log('='.repeat(50));
  console.log('Eksik Nonce\'ları Doldurma');
  console.log('='.repeat(50));
  console.log(`Eksik nonce sayısı: ${MISSING_NONCES.length}\n`);

  for (const nonce of MISSING_NONCES) {
    await fillNonce(nonce);
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n' + '='.repeat(50));
  console.log('Tamamlandı!');
  console.log('='.repeat(50));
}

main().catch(console.error);
