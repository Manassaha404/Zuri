import { Composio } from "@composio/core";
import { LangchainProvider } from "@composio/langchain";
import { env } from "../env";

export const composio = new Composio({
  apiKey: env.COMPOSIO_API_KEY,
  provider: new LangchainProvider(),
});
