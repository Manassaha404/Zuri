import { QdrantVectorStore } from "@langchain/qdrant";
import { env } from "../env";
import { embeddings } from "./model";

// Synchronous vector store instance
export const vectorStore = new QdrantVectorStore(embeddings, {
  url: env.QDRANT_URL,
  collectionName: "zuri-rag",
});

// Setup vector store collection
export const setupVectorStore = async () => {
  await vectorStore.ensureCollection();
  try {
    await vectorStore.client.createPayloadIndex("zuri-rag", {
      field_name: "metadata.conversationId",
      field_schema: "keyword",
    });
  } catch {
    // Ignore if payload index already exists
  }
};
