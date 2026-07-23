import { createGoogleGenerativeAI } from "@ai-sdk/google";

/**
 * Google Generative AI provider for the AI SDK.
 * Server-only — never import into client code.
 */
export function createGoogleProvider(apiKey: string) {
  return createGoogleGenerativeAI({ apiKey });
}

/** The Gemini model Van runs on. */
export const GEMINI_CHAT_MODEL = "gemini-3-flash-preview";
