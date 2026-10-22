import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { PostgresStore } from "@langchain/langgraph-checkpoint-postgres/store";
import { env } from "../env";
const CONN = env.DATABASE_URL;
import { OpenAIEmbeddings } from "@langchain/openai";
// instance of postgres store
const store = PostgresStore.fromConnString(CONN, {
  //for semantic search
  index: {
    dims: 1536,
    embed: new OpenAIEmbeddings({ model: "text-embedding-3-small" }),
    fields: ["text"], // which field of the stored value gets embedded
  },
});
const checkPointer = PostgresSaver.fromConnString(CONN);
const setupDBForAgent = async () => {
  // define checkPointer table in pg
  await checkPointer.setup();
  // define store in pg vector
  await store.setup();
};
export { checkPointer, store, setupDBForAgent };
