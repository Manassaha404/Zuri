import { ChatOpenAI } from "@langchain/openai";
import { env } from "../env";
const model = new ChatOpenAI({
  model: env.OPENAI_MAIN_MODEL,
});
export default model;
