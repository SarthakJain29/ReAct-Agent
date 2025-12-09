//rebuilding ReAct agent using custom graph
/*
Bring in LLM
Build the graph
Invoke the agent
Add memory
*/

import readline from "node:readline/promises";
import { ChatGroq } from "@langchain/groq";
import {
  MessagesAnnotation,
  START,
  StateGraph,
  END,
  MemorySaver,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { TavilySearch } from "@langchain/tavily";
import { tool } from "langchain";
import dotenv from "dotenv";
import z, { check } from "zod";
import { drawGraph } from "./utils.js";

dotenv.config();

//adding memory
const checkpointer = new MemorySaver();

//Call the llm node
async function callModel(state) {
  const response = await llm.invoke(state.messages);
  return { messages: [response] };
}

//Defining tools and toolNode
const search = new TavilySearch({
  maxResults: 3,
});

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

const tools = [search, calendarEvents];

const toolNode = new ToolNode(tools);

//Initialize the llm
const llm = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0,
}).bindTools(tools);

//conditional edge decision
function shouldContinue(state) {
  const lastMessage = state.messages[state.messages.length - 1];

  if (lastMessage.tool_calls?.length) {
    return "tools";
  }
  return END;
}

//defining the graph
const graph = new StateGraph(MessagesAnnotation)
  .addNode("LLM", callModel)
  .addNode("tools", toolNode)
  .addEdge(START, "LLM")
  .addEdge("tools", "LLM")
  .addConditionalEdges("LLM", shouldContinue, {
    END: END,
    tools: 'tools',
  });

const app = graph.compile({ checkpointer });

async function main() {
  let config = { configurable: { thread_id: "conversation-num-1" } };
  //unique id for each convo for memory
  //await drawGraph(app, './customGraph.png');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  while (true) {
    const userInput = await rl.question("You: ");
    if (userInput === "/bye") break;

    const result = await app.invoke(
      {
        messages: [{ role: "user", content: userInput }], //Initial state
      },
      config
    );
    const messages = result.messages;
    const final = messages[messages.length - 1];

    console.log("AI: ", final.content);
  }

  rl.close();
}

main();
