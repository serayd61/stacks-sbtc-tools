import txPkg from '@stacks/transactions';
const { makeContractDeploy, broadcastTransaction, AnchorMode } = txPkg;
import netPkg from '@stacks/network';
const { STACKS_MAINNET } = netPkg;
import fs from 'fs';

const PRIVATE_KEY = '4c664d1c1c36f56063823b6a7cbc8185ab9bcd84d4b291500667bc7ad5e3054b01';
const ADDRESS = 'SP2PEBKJ2W1ZDDF2QQ6Y4FXKZEDPT9J9R2NKD9WJB';
const network = STACKS_MAINNET;

const response = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${ADDRESS}/nonces`);
const data = await response.json();
const nonce = BigInt(data.possible_next_nonce);

const code = fs.readFileSync('contracts/vault-no-transfer.clar', 'utf-8');
const tx = await makeContractDeploy({
  contractName: 'vault-tracker-v1',
  codeBody: code,
  senderKey: PRIVATE_KEY,
  network,
  anchorMode: AnchorMode.Any,
  fee: 15000n,
  nonce
});

const res = await broadcastTransaction({ transaction: tx, network });
console.log('TX:', res.error ? res.reason : res.txid);
