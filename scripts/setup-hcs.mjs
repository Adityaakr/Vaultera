import { Client, TopicCreateTransaction, PrivateKey, AccountId, Hbar } from "@hashgraph/sdk";
import { config } from "dotenv";
config();

const AGENTS = [
  { id: "agent-1", name: "Atlas" },
  { id: "agent-2", name: "Meridian" },
  { id: "agent-3", name: "Echo" },
];

async function main() {
  const accountId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
  const privateKey = PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY);

  const client = Client.forTestnet().setOperator(accountId, privateKey);
  client.setDefaultMaxTransactionFee(new Hbar(5));

  console.log("Creating HCS topics for agent reasoning logs...\n");

  const topicIds = {};

  for (const agent of AGENTS) {
    console.log(`Creating topic for ${agent.name} (${agent.id})...`);

    const tx = new TopicCreateTransaction()
      .setTopicMemo(`Vaultera Agent: ${agent.name}`)
      .setSubmitKey(privateKey.publicKey);

    const response = await tx.execute(client);
    const receipt = await response.getReceipt(client);
    const topicId = receipt.topicId.toString();

    topicIds[agent.id] = topicId;
    console.log(`  -> Topic ID: ${topicId}`);
  }

  console.log("\n=== HCS SETUP COMPLETE ===\n");
  console.log("Update HCS_TOPIC_IDS in src/config/contracts.ts:\n");
  console.log("export const HCS_TOPIC_IDS: Record<string, string> = {");
  for (const [id, topicId] of Object.entries(topicIds)) {
    const agent = AGENTS.find((a) => a.id === id);
    console.log(`  '${id}': '${topicId}', // ${agent.name}`);
  }
  console.log("};");

  client.close();
}

main().catch(console.error);
