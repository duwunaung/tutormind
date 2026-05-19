import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export const gemini = new GoogleGenerativeAI(requireEnv("GEMINI_API_KEY"));

export const groq = new Groq({
  apiKey: requireEnv("GROQ_API_KEY"),
});