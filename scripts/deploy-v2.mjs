import { ethers } from "ethers";
import { readFileSync } from "fs";
import { config } from "dotenv";
config();

const RPC = "https://testnet.hashio.io/api";
const CHAIN_ID = 296;
const GAS_LIMIT = 4_000_000;

const VAULTS = [
  { name: "HBAR Treasury Core", symbol: "vaHBAR" },
  { name: "StableFlow Income", symbol: "vaSFI" },
  { name: "Momentum Alpha", symbol: "vaMALPHA" },
];

const STRATEGIES = ["StableLending", "MomentumPool", "YieldFarm"];

function loadArtifact(name) {
  return JSON.parse(readFileSync(`./artifacts/contracts/${name}.sol/${name}.json`, "utf8"));
}

async function deployContract(factory, args, label) {
  console.log(`\nDeploying ${label}...`);
  const contract = await factory.deploy(...args, { gasLimit: GAS_LIMIT });
  console.log(`  tx: ${contract.deploymentTransaction().hash}`);
  await contract.waitForDeployment();
  const addr = await contract.getAddress();
  console.log(`  -> ${addr}`);
  return { contract, address: addr };
}

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC, CHAIN_ID);
  const wallet = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, provider);
  console.log("Deployer:", wallet.address);

  // ─── 1. Deploy MockUSDC ───────────────────────────────────────────
  const usdcArtifact = loadArtifact("MockUSDC");
  const usdcFactory = new ethers.ContractFactory(usdcArtifact.abi, usdcArtifact.bytecode, wallet);
  const { address: usdcAddr } = await deployContract(usdcFactory, [], "MockUSDC");

  // ─── 2. Deploy VaultArenaUSD (takes USDC address) ─────────────────
  const vausdArtifact = loadArtifact("VaultArenaUSD");
  const vausdFactory = new ethers.ContractFactory(vausdArtifact.abi, vausdArtifact.bytecode, wallet);
  const { address: vausdAddr } = await deployContract(vausdFactory, [usdcAddr], "VaultArenaUSD");

  // ─── 3. Deploy 3 VaultArenaV2 ─────────────────────────────────────
  const vaultArtifact = loadArtifact("VaultArenaV2");
  const vaultFactory = new ethers.ContractFactory(vaultArtifact.abi, vaultArtifact.bytecode, wallet);
  const vaultAddresses = {};

  for (let i = 0; i < VAULTS.length; i++) {
    const v = VAULTS[i];
    const { address } = await deployContract(
      vaultFactory,
      [v.name, v.symbol, usdcAddr, vausdAddr, wallet.address],
      `Vault ${i + 1}: ${v.name}`
    );
    vaultAddresses[`vault-${i + 1}`] = address;
  }

  // ─── 4. Authorize vaults as vaUSD minters ─────────────────────────
  console.log("\nAuthorizing vaults as vaUSD minters...");
  const vausdContract = new ethers.Contract(
    vausdAddr,
    ["function addMinter(address) external"],
    wallet
  );
  for (const [id, addr] of Object.entries(vaultAddresses)) {
    const tx = await vausdContract.addMinter(addr, { gasLimit: 500_000 });
    await tx.wait();
    console.log(`  ${id} (${addr}) authorized`);
  }

  // ─── 5. Deploy 3 Strategies ───────────────────────────────────────
  const stratArtifact = loadArtifact("Strategy");
  const stratFactory = new ethers.ContractFactory(stratArtifact.abi, stratArtifact.bytecode, wallet);
  const stratAddresses = {};

  for (const name of STRATEGIES) {
    const { address } = await deployContract(stratFactory, [name, usdcAddr], `Strategy: ${name}`);
    stratAddresses[name] = address;
  }

  // ─── 6. Deploy Arena ──────────────────────────────────────────────
  const arenaArtifact = loadArtifact("Arena");
  const arenaFactory = new ethers.ContractFactory(arenaArtifact.abi, arenaArtifact.bytecode, wallet);
  const { address: arenaAddr } = await deployContract(arenaFactory, [usdcAddr, wallet.address], "Arena");

  // ─── 7. Seed: Mint USDC + vaUSD, deposit into vaults ──────────────
  console.log("\n=== SEEDING ===");

  const usdcC = new ethers.Contract(usdcAddr, [
    "function mint(uint256) external",
    "function approve(address,uint256) external",
    "function balanceOf(address) view returns (uint256)",
  ], wallet);
  const vausdC = new ethers.Contract(vausdAddr, [
    "function mint(uint256) external",
    "function approve(address,uint256) external",
    "function balanceOf(address) view returns (uint256)",
  ], wallet);

  console.log("\nMinting 30,000 USDC...");
  let tx = await usdcC.mint(ethers.parseEther("30000"), { gasLimit: 500_000 });
  await tx.wait();

  console.log("Minting 30,000 vaUSD...");
  tx = await vausdC.mint(ethers.parseEther("30000"), { gasLimit: 500_000 });
  await tx.wait();

  const usdcBal = await usdcC.balanceOf(wallet.address);
  const vausdBal = await vausdC.balanceOf(wallet.address);
  console.log(`  Balances: ${ethers.formatEther(usdcBal)} USDC, ${ethers.formatEther(vausdBal)} vaUSD`);

  const depositABI = [
    "function deposit(uint256 usdcAmount, uint256 vausdAmount) external payable",
    "function tvl() external view returns (uint256)",
  ];

  const perVaultUSDC = ethers.parseEther("8000");
  const perVaultVaUSD = ethers.parseEther("8000");
  const perVaultHBAR = ethers.parseEther("50");

  for (const [id, addr] of Object.entries(vaultAddresses)) {
    console.log(`\nSeeding ${id} (${addr})...`);

    tx = await usdcC.approve(addr, perVaultUSDC, { gasLimit: 500_000 });
    await tx.wait();
    tx = await vausdC.approve(addr, perVaultVaUSD, { gasLimit: 500_000 });
    await tx.wait();

    const vault = new ethers.Contract(addr, depositABI, wallet);
    tx = await vault.deposit(perVaultUSDC, perVaultVaUSD, {
      value: perVaultHBAR,
      gasLimit: 1_500_000,
    });
    await tx.wait();

    const tvl = await vault.tvl();
    console.log(`  TVL: $${ethers.formatEther(tvl)}`);
  }

  // ─── 8. Output config ─────────────────────────────────────────────
  console.log("\n\n=== DEPLOYMENT COMPLETE ===\n");
  console.log("Paste into src/config/contracts.ts:\n");
  console.log(`export const USDC_ADDRESS = '${usdcAddr}';`);
  console.log(`export const VAUSD_ADDRESS = '${vausdAddr}';`);
  console.log(`export const ARENA_ADDRESS = '${arenaAddr}';\n`);
  console.log("export const VAULT_ADDRESSES: Record<string, string> = {");
  for (const [id, addr] of Object.entries(vaultAddresses)) {
    console.log(`  '${id}': '${addr}',`);
  }
  console.log("};\n");
  console.log("export const STRATEGY_ADDRESSES: Record<string, string> = {");
  for (const [name, addr] of Object.entries(stratAddresses)) {
    console.log(`  '${name}': '${addr}',`);
  }
  console.log("};\n");
  console.log(`export const AGENT_ADDRESS = '${wallet.address}';`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
