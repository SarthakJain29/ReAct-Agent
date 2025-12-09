//to get a graph image of the agent's workflow
import { writeFileSync } from "node:fs";

export async function drawGraph(agent, path) {
  const drawableGraphState = await agent.getGraphAsync();
  const graphStateImage = await drawableGraphState.drawMermaidPng();
  const graphStateArrayBuffer = await graphStateImage.arrayBuffer();

  writeFileSync(path, new Uint8Array(graphStateArrayBuffer));
}
