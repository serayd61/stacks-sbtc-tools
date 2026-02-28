import txPkg from '@stacks/transactions';
const { makeContractDeploy, broadcastTransaction, AnchorMode } = txPkg;
import netPkg from '@stacks/network';
const { STACKS_MAINNET } = netPkg;
import fs from 'fs';

const PRIVATE_KEY = '4c664d1c1c36f56063823b6a7cbc8185ab9bcd84d4b291500667bc7ad5e3054b01';
const ADDRESS = 'SP2PEBKJ2W1ZDDF2QQ6Y4FXKZEDPT9J9R2NKD9WJB';
const network = STACKS_MAINNET;

const CONTRACTS = [
  // DAO Governance
  { name: 'dao-governance-token', path: '/Users/serkanaydin/stacks-dao-governance/contracts/governance-token.clar' },
  { name: 'dao-proposal-manager', path: '/Users/serkanaydin/stacks-dao-governance/contracts/proposal-manager.clar' },
  { name: 'dao-timelock', path: '/Users/serkanaydin/stacks-dao-governance/contracts/timelock.clar' },
  { name: 'dao-voting-escrow', path: '/Users/serkanaydin/stacks-dao-governance/contracts/voting-escrow.clar' },
  
  // Social Protocol
  { name: 'social-content-registry', path: '/Users/serkanaydin/stacks-social-protocol/contracts/content-registry.clar' },
  { name: 'social-moderation-dao', path: '/Users/serkanaydin/stacks-social-protocol/contracts/moderation-dao.clar' },
  { name: 'social-user-profiles', path: '/Users/serkanaydin/stacks-social-protocol/contracts/user-profiles.clar' },
  
  // NFT Gaming
  { name: 'gaming-leaderboard', path: '/Users/serkanaydin/stacks-nft-gaming/contracts/leaderboard.clar' },
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
      if (res.reason === 'ContractAlreadyExists') {
        console.log(`  ⏭️  ${name}: Already exists`);
        return 'exists';
      }
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
  console.log('='.repeat(60));
  console.log('Multi-Repo Contract Deploy');
  console.log('='.repeat(60));
  
  let nonce = await getCurrentNonce();
  console.log('Starting nonce:', nonce.toString());
  console.log(`Contracts: ${CONTRACTS.length}\n`);
  
  let deployed = 0;
  let skipped = 0;
  let failed = 0;
  
  for (const c of CONTRACTS) {
    const result = await deploy(c.name, c.path, nonce);
    
    if (result === 'exists') {
      skipped++;
    } else if (result) {
      deployed++;
      nonce++;
    } else {
      failed++;
      nonce++;
    }
    
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`✓ Deployed: ${deployed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`✗ Failed: ${failed}`);
  console.log(`💰 Fee: ~${(deployed * 12000 / 1000000).toFixed(3)} STX`);
  console.log('='.repeat(60));
}

main().catch(console.error);
