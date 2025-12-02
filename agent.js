import { ChatGroq } from "@langchain/groq";
import { createAgent } from "langchain";
import dotenv from "dotenv";
import { TavilySearch } from "@langchain/tavily";

dotenv.config();

async function main() {
  const model = new ChatGroq({
    model: "openai/gpt-oss-120b",
    temperature: 0,
  });

  const search = new TavilySearch({
    maxResults: 3,
    topic: 'general',
  })

  const agent = createAgent({
    model: model,
    tools: [search],
    systemPrompt: "You are a helpful assistant.",
  });

  const result = await agent.invoke({
    messages: [{ role: "user", content: "What is the weather in Tokyo?" }],
  });


  console.log("Assistant: ", result.messages[result.messages.length-1].content);
}

main();
