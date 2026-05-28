import Groq from "groq-sdk";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export const groq = new Groq({
  apiKey: requireEnv("GROQ_API_KEY"),
});