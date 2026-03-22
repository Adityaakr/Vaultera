import { ethers } from 'ethers';
import { config } from 'dotenv';
config();

const VAULTS = {
  'vault-1': '0xBD1a0E7e1472e268e4C8033412abb537A164CB9F',
  'vault-2': '0x5fD2c29D7aBb44a353b02aD8E521454b6ED38eb3',
  'vault-3': '0x3b51F9E7188b3523f2263F7D01cb093FA7cb1ED0',
};

const VAULT_ABI = ['function deposit() external payable'];

async function main() {
  const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api', 296);
  const wallet = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, provider);
  console.log('Seeding deposits from:', wallet.address);

  for (const [id, addr] of Object.entries(VAULTS)) {
    const contract = new ethers.Contract(addr, VAULT_ABI, wallet);
    const amount = ethers.parseEther('10');
    console.log(`\nDepositing 10 HBAR into ${id} (${addr})...`);
    const tx = await contract.deposit({ value: amount, gasLimit: 500_000 });
    console.log('  tx:', tx.hash);
    await tx.wait();
    console.log('  confirmed');
  }

  console.log('\nDone! All vaults seeded with 10 HBAR each.');
}

main().catch(console.error);
