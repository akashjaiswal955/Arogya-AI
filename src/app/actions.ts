"use server";

import { answerQuestionUsingLLM } from "@/ai/flows/answer-question-llm";
import type { Language } from "@/components/LanguageProvider";

export async function getAIResponse(question: string, language: Language, userName?: string, image?: string) {
  try {
    const response = await answerQuestionUsingLLM({ question, language, userName, image });
    return JSON.stringify(response);
  } catch (error) {
    console.error("Error getting AI response:", error);
    return JSON.stringify({
      answer: "I'm sorry, but I encountered an error while processing your request. Please try again later."
    });
  }
}
