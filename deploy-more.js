import txPkg from '@stacks/transactions';
const { makeContractDeploy, broadcastTransaction, AnchorMode } = txPkg;
import netPkg from '@stacks/network';
const { STACKS_MAINNET } = netPkg;
import fs from 'fs';

const PRIVATE_KEY = '4c664d1c1c36f56063823b6a7cbc8185ab9bcd84d4b291500667bc7ad5e3054b01';
const ADDRESS = 'SP2PEBKJ2W1ZDDF2QQ6Y4FXKZEDPT9J9R2NKD9WJB';
const network = STACKS_MAINNET;

const CONTRACTS = [
  // DAO Toolkit
  { name: 'toolkit-token-voting', path: '/Users/serkanaydin/stacks-dao-toolkit/contracts/token-voting.clar' },
  { name: 'toolkit-proposal-engine', path: '/Users/serkanaydin/stacks-dao-toolkit/contracts/proposal-engine.clar' },
  { name: 'toolkit-membership-nft', path: '/Users/serkanaydin/stacks-dao-toolkit/contracts/membership-nft.clar' },
  { name: 'toolkit-dao-core', path: '/Users/serkanaydin/stacks-dao-toolkit/contracts/dao-core.clar' },
];

async function getCurrentNonce() {
  const response = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${ADDRESS}/nonces`);
  const data = await response.json();
  return BigInt(data.possible_next_nonce);
}

async function deploy(name, codePath, nonce) {
  try {
    const code = fs.readFileSync(codePath, 'utf-8');
    
    const tx = await makeContractDeploy({
      contractName: name,
      codeBody: code,
      senderKey: PRIVATE_KEY,
      network,
      anchorMode: AnchorMode.Any,
      fee: 12000n,
      nonce
    });
    
    const res = await broadcastTransaction({ transaction: tx, network });
    
    if (res.error) {
      console.log(`  ✗ ${name}: ${res.reason}`);
      return null;
    }
    
    console.log(`  ✓ ${name}: ${res.txid.slice(0, 16)}...`);
    return res.txid;
  } catch (e) {
    console.log(`  ✗ ${name}: ${e.message}`);
    return null;
  }
}

async function main() {
  console.log('='.repeat(50));
  console.log('DAO Toolkit Deploy');
  console.log('='.repeat(50));
  
  let nonce = await getCurrentNonce();
  console.log('Nonce:', nonce.toString(), '\n');
  
  let deployed = 0;
  
  for (const c of CONTRACTS) {
    if (await deploy(c.name, c.path, nonce++)) deployed++;
    await new Promise(r => setTimeout(r, 250));
  }
  
  console.log(`\n${deployed}/${CONTRACTS.length} deployed`);
  console.log(`Fee: ~${(deployed * 12000 / 1000000).toFixed(3)} STX`);
}

main().catch(console.error);
