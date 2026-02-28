import txPkg from '@stacks/transactions';
const { makeContractDeploy, broadcastTransaction, AnchorMode } = txPkg;
import netPkg from '@stacks/network';
const { STACKS_MAINNET } = netPkg;
import fs from 'fs';
import path from 'path';

const PRIVATE_KEY = '4c664d1c1c36f56063823b6a7cbc8185ab9bcd84d4b291500667bc7ad5e3054b01';
const ADDRESS = 'SP2PEBKJ2W1ZDDF2QQ6Y4FXKZEDPT9J9R2NKD9WJB';
const network = STACKS_MAINNET;
const CONTRACTS_DIR = '/Users/serkanaydin/stacks-defi-suite/contracts';

// Budget: 0.1 STX = 100,000 microSTX for 20 contracts = 5,000 each
const FEE_PER_CONTRACT = 5000n;

async function getCurrentNonce() {
  const response = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${ADDRESS}/nonces`);
  const data = await response.json();
  return BigInt(data.possible_next_nonce);
}

async function deployContract(contractName, codeBody, nonce) {
  try {
    const tx = await makeContractDeploy({
      contractName,
      codeBody,
      senderKey: PRIVATE_KEY,
      network,
      anchorMode: AnchorMode.Any,
      fee: FEE_PER_CONTRACT,
      nonce
    });
    
    const res = await broadcastTransaction({ transaction: tx, network });
    
    if (res.error) {
      if (res.reason === 'ContractAlreadyExists') {
        console.log(`  ⏭️  ${contractName}: Already exists`);
        return 'exists';
      }
      console.log(`  ✗ ${contractName}: ${res.reason}`);
      return null;
    }
    
    console.log(`  ✓ ${contractName}: ${res.txid.slice(0, 16)}...`);
    return res.txid;
  } catch (e) {
    console.log(`  ✗ ${contractName}: ${e.message}`);
    return null;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Stacks DeFi Suite - Mainnet Deploy');
  console.log('Budget: 0.1 STX (5,000 microSTX per contract)');
  console.log('='.repeat(60));
  
  const files = fs.readdirSync(CONTRACTS_DIR).filter(f => f.endsWith('.clar'));
  console.log(`\nFound ${files.length} contracts\n`);
  
  let nonce = await getCurrentNonce();
  console.log('Starting nonce:', nonce.toString());
  
  let deployed = 0;
  let skipped = 0;
  let failed = 0;
  
  for (const file of files) {
    const contractName = file.replace('.clar', '');
    const filePath = path.join(CONTRACTS_DIR, file);
    const codeBody = fs.readFileSync(filePath, 'utf-8');
    
    const result = await deployContract(contractName, codeBody, nonce);
    
    if (result === 'exists') {
      skipped++;
    } else if (result) {
      deployed++;
      nonce++;
    } else {
      failed++;
      nonce++; // Still increment to avoid nonce issues
    }
    
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`Deployed: ${deployed}`);
  console.log(`Already Exists: ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total Fee Used: ~${(deployed * 5000) / 1000000} STX`);
  console.log('='.repeat(60));
}

main().catch(console.error);
