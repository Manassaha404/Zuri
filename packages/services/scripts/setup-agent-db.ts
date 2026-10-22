import { setupDBForAgent } from "../agent/pg-for-agent";

setupDBForAgent()
  .then(() => {
    console.log("✅ Agent DB setup complete");
    process.exit(0);
  })
  .catch((e) => {
    console.error("❌ Agent DB setup failed:", e);
    process.exit(1);
  });
