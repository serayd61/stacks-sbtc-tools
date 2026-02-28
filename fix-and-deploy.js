import txPkg from '@stacks/transactions';
const { makeContractDeploy, makeSTXTokenTransfer, broadcastTransaction, AnchorMode } = txPkg;
import netPkg from '@stacks/network';
const { STACKS_MAINNET } = netPkg;
import fs from 'fs';

const PRIVATE_KEY = '4c664d1c1c36f56063823b6a7cbc8185ab9bcd84d4b291500667bc7ad5e3054b01';
const network = STACKS_MAINNET;

// Fill missing nonce 334
const fillTx = await makeSTXTokenTransfer({
  recipient: 'SP000000000000000000002Q6VF78',
  amount: 1n,
  senderKey: PRIVATE_KEY,
  network,
  anchorMode: AnchorMode.Any,
  fee: 10000n,
  nonce: 334n
});
const fillRes = await broadcastTransaction({ transaction: fillTx, network });
console.log('Fill nonce 334:', fillRes.error ? fillRes.reason : 'OK');

// Deploy lending-pool-v1 with nonce 343
const code = fs.readFileSync('/Users/serkanaydin/stacks-defi-suite/contracts/lending-pool-v1.clar', 'utf-8');
const deployTx = await makeContractDeploy({
  contractName: 'lending-pool-v1',
  codeBody: code,
  senderKey: PRIVATE_KEY,
  network,
  anchorMode: AnchorMode.Any,
  fee: 10000n,
  nonce: 343n
});
const deployRes = await broadcastTransaction({ transaction: deployTx, network });
console.log('Deploy lending-pool-v1:', deployRes.error ? deployRes.reason : deployRes.txid.slice(0, 20) + '...');
