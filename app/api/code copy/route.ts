import { NextResponse } from "@/node_modules/next/server";
import { OpenAI } from "openai";
import { OpenAsBlobOptions } from "fs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // This is also the default, can be omitted
});

const intructionMessage: OpenAI.Chat.ChatCompletionMessage = {
  role: "system" as any,
  content:
    "You are a code generator expert. Provide a brief explanation accompannying the code. You must provide code in markdown code snippets. Use code comments for explanations.",
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!process.env.OPENAI_API_KEY) {
      return new NextResponse("OpenAI API key not configured", { status: 500 });
    }

    if (!messages) {
      return new NextResponse("Messages are required", { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [intructionMessage, ...messages],
    });

    return NextResponse.json(response.choices[0].message);
  } catch (error) {
    console.log("[CONVERSATION_ERROR]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
