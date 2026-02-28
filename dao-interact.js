import txPkg from '@stacks/transactions';
const { 
  makeContractCall, 
  broadcastTransaction, 
  AnchorMode, 
  PostConditionMode,
  stringAsciiCV,
  uintCV,
  principalCV
} = txPkg;
import netPkg from '@stacks/network';
const { STACKS_MAINNET } = netPkg;

const PRIVATE_KEY = '4c664d1c1c36f56063823b6a7cbc8185ab9bcd84d4b291500667bc7ad5e3054b01';
const ADDRESS = 'SP2PEBKJ2W1ZDDF2QQ6Y4FXKZEDPT9J9R2NKD9WJB';
const CONTRACT = `${ADDRESS}.dao-core`;
const network = STACKS_MAINNET;

async function getCurrentNonce() {
  const response = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${ADDRESS}/nonces`);
  const data = await response.json();
  return BigInt(data.possible_next_nonce);
}

async function callContract(functionName, functionArgs, nonce) {
  console.log(`\nCalling ${functionName}...`);
  
  const txOptions = {
    contractAddress: ADDRESS,
    contractName: 'dao-core',
    functionName: functionName,
    functionArgs: functionArgs,
    senderKey: PRIVATE_KEY,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    fee: 10000n, // 0.01 STX
    nonce: nonce
  };

  const transaction = await makeContractCall(txOptions);
  const broadcastResponse = await broadcastTransaction({ transaction, network });
  
  if (broadcastResponse.error) {
    console.log(`✗ Error: ${broadcastResponse.error} - ${broadcastResponse.reason}`);
    return null;
  }
  
  console.log(`✓ TX: https://explorer.hiro.so/txid/${broadcastResponse.txid}?chain=mainnet`);
  return broadcastResponse.txid;
}

async function main() {
  const action = process.argv[2];
  let nonce = await getCurrentNonce();
  
  console.log('='.repeat(60));
  console.log('DAO-CORE Contract Interaction');
  console.log('='.repeat(60));
  console.log('Contract:', CONTRACT);
  console.log('Nonce:', nonce.toString());

  switch(action) {
    case 'initialize':
      // Initialize DAO with name, voting period (144 blocks ~1 day), quorum (20%), pass threshold (51%)
      await callContract('initialize', [
        stringAsciiCV('Stacks Builder DAO'),  // name
        uintCV(144),                           // voting period (blocks)
        uintCV(20),                            // quorum threshold (%)
        uintCV(51)                             // pass threshold (%)
      ], nonce);
      break;
      
    case 'add-member':
      // Add a new member with ROLE_MEMBER (u2)
      const memberAddress = process.argv[3] || 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE';
      await callContract('register-member', [
        principalCV(memberAddress),
        uintCV(2)  // ROLE_MEMBER
      ], nonce);
      break;
      
    case 'pause':
      await callContract('pause-dao', [], nonce);
      break;
      
    case 'unpause':
      await callContract('unpause-dao', [], nonce);
      break;
      
    case 'set-voting-period':
      const period = parseInt(process.argv[3]) || 288;
      await callContract('set-voting-period', [uintCV(period)], nonce);
      break;
      
    default:
      console.log('\nUsage:');
      console.log('  node dao-interact.js initialize');
      console.log('  node dao-interact.js add-member <address>');
      console.log('  node dao-interact.js pause');
      console.log('  node dao-interact.js unpause');
      console.log('  node dao-interact.js set-voting-period <blocks>');
  }
}

main().catch(console.error);
