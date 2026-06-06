// src/ai/flows/answer-question-llm.ts
'use server';

/**
 * @fileOverview An AI agent that answers health-related questions using a combination of a
 * structured database and an LLM for comprehensive responses.
 *
 * - answerQuestionUsingLLM - A function that answers a health-related question.
 * - AnswerQuestionUsingLLMInput - The input type for the answerQuestionUsingLLM function.
 * - AnswerQuestionUsingLLMOutput - The return type for the answerQuestionUsingLLM function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerQuestionUsingLLMInputSchema = z.object({
  question: z.string().describe('The health-related question to answer.'),
  language: z.enum(['en', 'hi', 'mr', 'bho']).describe("The user's preferred language."),
  healthInfo: z.string().optional().describe('Relevant health information from the database, if available.'),
  userName: z.string().optional().describe('The name of the logged-in user, if available.'),
  image: z.string().optional().describe('Base64 image data URL, if available.'),
});
export type AnswerQuestionUsingLLMInput = z.infer<typeof AnswerQuestionUsingLLMInputSchema>;

const AnswerQuestionUsingLLMOutputSchema = z.object({
  answer: z.string().describe('A general friendly/empathetic response, introduction, or general info.'),
  symptoms: z.string().optional().describe('List of symptoms (formatted with markdown bullets), if applicable.'),
  precautions: z.string().optional().describe('List of precautions (formatted with markdown bullets), if applicable.'),
  whenToMeetDoctor: z.string().optional().describe('When to see a doctor (formatted with markdown bullets), if applicable.'),
  homeRemedies: z.string().optional().describe('Home remedies or self-care steps (formatted with markdown bullets), if applicable.'),
});
export type AnswerQuestionUsingLLMOutput = z.infer<typeof AnswerQuestionUsingLLMOutputSchema>;

export async function answerQuestionUsingLLM(input: AnswerQuestionUsingLLMInput): Promise<AnswerQuestionUsingLLMOutput> {
  return answerQuestionUsingLLMFlow(input);
}

const answerQuestionPrompt = ai.definePrompt({
  name: 'answerQuestionPrompt',
  input: {schema: AnswerQuestionUsingLLMInputSchema},
  output: {schema: AnswerQuestionUsingLLMOutputSchema},
  prompt: `You are a helpful AI assistant providing information on health-related topics.

  {{#if userName}}
  The user is logged in as "{{userName}}". Please address them by their name (e.g. greeting them, speaking to them directly, or referring to them as "{{userName}}") in a natural, polite manner in the response.
  {{/if}}

  Respond in the user's preferred language:
  - If "{{language}}" is "en", respond in English.
  - If "{{language}}" is "hi", respond in Hindi (हिन्दी).
  - If "{{language}}" is "mr", respond in Marathi (मराठी).
  - If "{{language}}" is "bho", respond in native Bhojpuri (भोजपुरी) language using the Devanagari script.

  Answer the following question:
  {{question}}

  CRITICAL STRUCTURE REQUIREMENT:
  If the question is about a disease, condition, illness, or health issue:
  1. Provide a general friendly/empathetic response or brief introduction in the "answer" field.
  2. In the "symptoms" field, list the symptoms of the condition in detail (formatted with bullets).
  3. In the "precautions" field, list precautions or preventative measures (formatted with bullets).
  4. In the "whenToMeetDoctor" field, specify when to see a doctor or seek medical attention (formatted with bullets).
  5. In the "homeRemedies" field, list natural home remedies or self-care steps to prevent/alleviate that problem (formatted with bullets).

  If the question is NOT about a disease/illness (e.g., greetings, general chat, or generic topics), answer it fully inside the "answer" field and leave the other fields (symptoms, precautions, whenToMeetDoctor, homeRemedies) empty or undefined.

  Use the following health information, if provided, to augment your answer:
  {{#if healthInfo}}
  {{healthInfo}}
  {{else}}
  No health information from database available.
  {{/if}}`,
});

const answerQuestionUsingLLMFlow = ai.defineFlow(
  {
    name: 'answerQuestionUsingLLMFlow',
    inputSchema: AnswerQuestionUsingLLMInputSchema,
    outputSchema: AnswerQuestionUsingLLMOutputSchema,
  },
  async input => {
    // If an image is provided, bypass prompt-template and invoke multimodal ai.generate directly
    if (input.image) {
      let mimeType = 'image/jpeg';
      let base64Data = input.image;

      if (input.image.startsWith('data:')) {
        const parts = input.image.split(';base64,');
        mimeType = parts[0].split(':')[1];
        base64Data = parts[1];
      }

      const promptText = `You are a helpful AI assistant providing information on health-related topics.

      ${input.userName ? `The user is logged in as "${input.userName}". Please address them by their name (e.g. greeting them, speaking to them directly, or referring to them as "${input.userName}") in a natural, polite manner in the response.` : ''}

      Respond in the user's preferred language:
      - If "${input.language}" is "en", respond in English.
      - If "${input.language}" is "hi", respond in Hindi (हिन्दी).
      - If "${input.language}" is "mr", respond in Marathi (मराठी).
      - If "${input.language}" is "bho", respond in native Bhojpuri (भोजपुरी) language using the Devanagari script.

      Analyze the attached image and answer the following question:
      ${input.question}

      CRITICAL STRUCTURE REQUIREMENT:
      If the question/image is about a disease, condition, illness, or health issue:
      1. Provide a general friendly/empathetic response or brief introduction in the "answer" field.
      2. In the "symptoms" field, list the symptoms of the condition in detail (formatted with bullets).
      3. In the "precautions" field, list precautions or preventative measures (formatted with bullets).
      4. In the "whenToMeetDoctor" field, specify when to see a doctor or seek medical attention (formatted with bullets).
      5. In the "homeRemedies" field, list natural home remedies or self-care steps to prevent/alleviate that problem (formatted with bullets).

      If the question/image is NOT about a disease/illness (e.g., greetings, general chat, or generic topics), answer it fully inside the "answer" field and leave the other fields (symptoms, precautions, whenToMeetDoctor, homeRemedies) empty or undefined.

      Use the following health information, if provided, to augment your answer:
      ${input.healthInfo || 'No health information from database available.'}`;

      const response = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        prompt: [
          { text: promptText },
          { media: { url: `data:${mimeType};base64,${base64Data}`, contentType: mimeType } }
        ],
        output: { schema: AnswerQuestionUsingLLMOutputSchema }
      });

      return response.output!;
    }

    const {output} = await answerQuestionPrompt(input);
    return output!;
  }
);
