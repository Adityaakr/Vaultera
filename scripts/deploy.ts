import { ethers } from "hardhat";

const VAULTS = [
  { name: "HBAR Treasury Core", symbol: "vaHBAR" },
  { name: "StableFlow Income", symbol: "vaSFI" },
  { name: "Momentum Alpha", symbol: "vaMALPHA" },
];

async function main() {
  const [deployer] = await ethers.getSigners();
  const agentAddress = deployer.address;

  console.log("Deploying with account:", deployer.address);
  console.log("Agent address (same as deployer for testnet):", agentAddress);

  const VaultArena = await ethers.getContractFactory("VaultArena");
  const deployed: { id: string; name: string; symbol: string; address: string }[] = [];

  for (let i = 0; i < VAULTS.length; i++) {
    const v = VAULTS[i];
    console.log(`\nDeploying vault ${i + 1}: ${v.name} (${v.symbol})...`);
    const vault = await VaultArena.deploy(v.name, v.symbol, agentAddress);
    await vault.waitForDeployment();
    const address = await vault.getAddress();
    console.log(`  -> deployed at ${address}`);
    deployed.push({ id: `vault-${i + 1}`, name: v.name, symbol: v.symbol, address });
  }

  console.log("\n=== DEPLOYMENT COMPLETE ===");
  console.log("Copy these addresses into src/config/contracts.ts:\n");
  console.log("export const VAULT_ADDRESSES = {");
  for (const d of deployed) {
    console.log(`  '${d.id}': '${d.address}',  // ${d.name}`);
  }
  console.log("};");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
