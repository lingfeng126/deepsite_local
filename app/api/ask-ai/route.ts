/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { OpenAI } from "openai";

import { MODELS, PROVIDERS } from "@/lib/providers";
import {
  DIVIDER,
  FOLLOW_UP_SYSTEM_PROMPT,
  INITIAL_SYSTEM_PROMPT,
  MAX_REQUESTS_PER_IP,
  REPLACE_END,
  SEARCH_START,
} from "@/lib/prompts";
import '@/lib/proxy';
import MY_TOKEN_KEY from "@/lib/get-cookie-name";

const ipAddresses = new Map();

function getOpenAIClient(apiKey: string, baseUrl?: string) {
  return new OpenAI({apiKey, baseURL: baseUrl || "https://api.openai.com/v1"});
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { prompt, model, redesignMarkdown, html, useCustomModel, baseUrl, maxTokens, token} = body;

  if (!model || (!prompt && !redesignMarkdown)) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields" },
      { status: 400 }
    );
  }
  
  let selectedModel;

  if (useCustomModel){
    selectedModel = {
      value: model,
      token: token || "",
      baseUrl: baseUrl as string,
      maxTokens: maxTokens,
    }
  }else{
    selectedModel = MODELS.find(
        (m) => m.value === model || m.label === model
      );
    if (!selectedModel) {
      return NextResponse.json(
        { ok: false, error: "Invalid model selected" },
        { status: 400 }
      );
    }
  }


//   let token = userToken || process.env.OPENAI_API_KEY;
//   let billTo: string | null = null;

//   const ip = authHeaders.get("x-forwarded-for")?.includes(",")
//     ? authHeaders.get("x-forwarded-for")?.split(",")[1].trim()
//     : authHeaders.get("x-forwarded-for");

//   if (!token) {
//     ipAddresses.set(ip, (ipAddresses.get(ip) || 0) + 1);
//     if (ipAddresses.get(ip) > MAX_REQUESTS_PER_IP) {
//       return NextResponse.json(
//         {
//           ok: false,
//           openLogin: true,
//           message: "Log In to continue using the service",
//         },
//         { status: 429 }
//       );
//     }
//     return NextResponse.json(
//       {
//         ok: false,
//         message: "No API key provided.",
//       },
//       { status: 401 }
//     );
//   }


  try {
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const response = new NextResponse(stream.readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });

    (async () => {
      let completeResponse = "";
      try {
        const token = selectedModel.token || ""
        const openai = getOpenAIClient(token, selectedModel.baseUrl);

        const messages = [
          {
            role: "system" as const,
            content: INITIAL_SYSTEM_PROMPT,
          },
          {
            role: "user" as const,
            content: redesignMarkdown
              ? `Here is my current design as a markdown:\n\n${redesignMarkdown}\n\nNow, please create a new design based on this markdown.`
              : html
              ? `Here is my current HTML code:\n\n\`\`\`html\n${html}\n\`\`\`\n\nNow, please create a new design based on this HTML.`
              : prompt,
          },
        ];

        const stream = await openai.chat.completions.create({
          model: selectedModel.value,
          messages: messages,
          temperature: 0.3,
          stream: true,
        });

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            try {
              await writer.write(encoder.encode(content));
              completeResponse += content;
              if (completeResponse.includes("</html>")) {
                break;
              }
            } catch (e) {
              // ignore malformed lines
            }
          }
        }
      } catch (error: any) {
        await writer.write(
          encoder.encode(
            JSON.stringify({
              ok: false,
              message:
                error.message ||
                "An error occurred while processing your request.",
            })
          )
        );
      } finally {
        await writer?.close();
      }
    })();

    return response;
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        openSelectProvider: true,
        message:
          error?.message || "An error occurred while processing your request.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const authHeaders = await headers();
  const userToken = request.cookies.get(MY_TOKEN_KEY())?.value;

  const body = await request.json();
  const { prompt, html, previousPrompt, provider, selectedElementHtml } = body;

  if (!prompt || !html) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields" },
      { status: 400 }
    );
  }

  const selectedModel = MODELS[0];

  let token = selectedModel.token;

  const ip = authHeaders.get("x-forwarded-for")?.includes(",")
    ? authHeaders.get("x-forwarded-for")?.split(",")[1].trim()
    : authHeaders.get("x-forwarded-for");


  const openai = getOpenAIClient(token, selectedModel.baseUrl);


  try {
    const messages = [
      {
        role: "system" as const,
        content: FOLLOW_UP_SYSTEM_PROMPT,
      },
      {
        role: "user" as const,
        content: previousPrompt
          ? previousPrompt
          : "You are modifying the HTML file based on the user's request.",
      },
      {
        role: "assistant" as const,
        content: `The current code is: \n\`\`\`html\n${html}\n\`\`\` ${
          selectedElementHtml
            ? `\n\nYou have to update ONLY the following element, NOTHING ELSE: \n\n\`\`\`html\n${selectedElementHtml}\n\`\`\``
            : ""
        }`,
      },
      {
        role: "user" as const,
        content: prompt,
      },
    ];

    const completion = await openai.chat.completions.create({
          model: selectedModel.value,
          messages: messages,
        });

    const chunk = completion.choices[0]?.message?.content;
    if (!chunk) {
      return NextResponse.json(
        { ok: false, message: "No content returned from the model" },
        { status: 400 }
      );
    }

    if (chunk) {
      const updatedLines: number[][] = [];
      let newHtml = html;
      let position = 0;
      let moreBlocks = true;

      while (moreBlocks) {
        const searchStartIndex = chunk.indexOf(SEARCH_START, position);
        if (searchStartIndex === -1) {
          moreBlocks = false;
          continue;
        }

        const dividerIndex = chunk.indexOf(DIVIDER, searchStartIndex);
        if (dividerIndex === -1) {
          moreBlocks = false;
          continue;
        }

        const replaceEndIndex = chunk.indexOf(REPLACE_END, dividerIndex);
        if (replaceEndIndex === -1) {
          moreBlocks = false;
          continue;
        }

        const searchBlock = chunk.substring(
          searchStartIndex + SEARCH_START.length,
          dividerIndex
        );
        const replaceBlock = chunk.substring(
          dividerIndex + DIVIDER.length,
          replaceEndIndex
        );

        if (searchBlock.trim() === "") {
          newHtml = `${replaceBlock}\n${newHtml}`;
          updatedLines.push([1, replaceBlock.split("\n").length]);
        } else {
          const blockPosition = newHtml.indexOf(searchBlock);
          if (blockPosition !== -1) {
            const beforeText = newHtml.substring(0, blockPosition);
            const startLineNumber = beforeText.split("\n").length;
            const replaceLines = replaceBlock.split("\n").length;
            const endLineNumber = startLineNumber + replaceLines - 1;

            updatedLines.push([startLineNumber, endLineNumber]);
            newHtml = newHtml.replace(searchBlock, replaceBlock);
          }
        }

        position = replaceEndIndex + REPLACE_END.length;
      }

      return NextResponse.json({
        ok: true,
        html: newHtml,
        updatedLines,
      });
    } else {
      return NextResponse.json(
        { ok: false, message: "No content returned from the model" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        openSelectProvider: true,
        message:
          error.message || "An error occurred while processing your request.",
      },
      { status: 500 }
    );
  }
}