import { writeFileSync } from "node:fs";
import readline from "node:readline/promises";
import { ChatGroq } from "@langchain/groq";
import { createAgent } from "langchain";
import dotenv from "dotenv";
import { TavilySearch } from "@langchain/tavily";
import { MemorySaver} from "@langchain/langgraph";
import { tool } from "langchain";
import * as z from "zod";

dotenv.config();

async function main() {
  const model = new ChatGroq({
    model: "llama-3.3-70b-versatile",
    temperature: 0,
  });

  const search = new TavilySearch({
    maxResults: 3,
  });

  //langchain tool methods requires 2 parameters - 1 function and an object having name, description, schema
  const calendarEvents = tool(
    ({ query }) => {
      //google calendar logic goes here
      return JSON.stringify([
        { title: "Prodgain Interview", time: "2 PM", location: "Gmeet" },
      ]);
    },
    {
      name: "get-calendar-events",
      description: "Call to get the calendar events",
      schema: z.object({
        query: z.string().describe("the query to use in calendar event search"),
      }),
    }
  );

  const checkpointer = new MemorySaver(); //adding memory

  const agent = createAgent({
    model: model,
    tools: [search, calendarEvents],
    checkpointer: checkpointer,
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });



  while (true) { //loop for continuous user/ai chats
    const userQuery = await rl.question("You: ");
    if (userQuery === "bye") break;

    const result = await agent.invoke({
      messages: [
        {
          role: "system",
          content: `You are a personal assistant.
            You have access to two tools:
            - search: use this to search the web for real-time information. Only pass: { query: string }
            Do NOT specify topic or timeRange.
            When calling the search tool:
            - Only send { "query": "..."}
            - Do NOT send topic, timeRange, searchDepth, includeImages, etc.
            - Do not send null values.

            - calendarEvents: use this to get the calendar events
            Current date and time: ${new Date().toUTCString()}`,
        },
        {
          role: "user",
          content: userQuery,
        },
      ],
    },{configurable: {thread_id: '1'}});

    console.log(
      "Assistant: ",
      result.messages[result.messages.length - 1].content
    );
  }

  rl.close();

  //to get a graph image of the agent's workflow
  // const drawableGraphState = await agent.getGraphAsync();
  // const graphStateImage = await drawableGraphState.drawMermaidPng();
  // const graphStateArrayBuffer = await graphStateImage.arrayBuffer();

  // const filePath = "./graphState.png";
  // writeFileSync(filePath, new Uint8Array(graphStateArrayBuffer));
}

main();
