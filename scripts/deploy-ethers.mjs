import { ethers } from "ethers";
import { readFileSync } from "fs";
import { config } from "dotenv";
config();

const VAULTS = [
  { name: "HBAR Treasury Core", symbol: "vaHBAR" },
  { name: "StableFlow Income", symbol: "vaSFI" },
  { name: "Momentum Alpha", symbol: "vaMALPHA" },
];

async function main() {
  const provider = new ethers.JsonRpcProvider("https://testnet.hashio.io/api", 296);
  const wallet = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, provider);

  console.log("Deployer:", wallet.address);

  const artifact = JSON.parse(
    readFileSync("./artifacts/contracts/VaultArena.sol/VaultArena.json", "utf8")
  );

  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const deployed = [];

  for (let i = 0; i < VAULTS.length; i++) {
    const v = VAULTS[i];
    console.log(`\nDeploying vault ${i + 1}: ${v.name} (${v.symbol})...`);

    const contract = await factory.deploy(v.name, v.symbol, wallet.address, {
      gasLimit: 4_000_000,
    });

    console.log("  tx hash:", contract.deploymentTransaction().hash);
    console.log("  waiting for confirmation...");
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    console.log(`  -> deployed at ${address}`);
    deployed.push({ id: `vault-${i + 1}`, name: v.name, symbol: v.symbol, address });
  }

  console.log("\n=== DEPLOYMENT COMPLETE ===");
  console.log("\nPaste into src/config/contracts.ts:\n");
  console.log("export const VAULT_ADDRESSES: Record<string, string> = {");
  for (const d of deployed) {
    console.log(`  '${d.id}': '${d.address}',  // ${d.name}`);
  }
  console.log("};");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
