// src/ai/flows/answer-question-existing-information.ts
'use server';

/**
 * @fileOverview Answers health-related questions using available information from a structured database.
 *
 * - answerQuestionUsingExistingInformation - A function that answers the question based on existing information.
 * - AnswerQuestionUsingExistingInformationInput - The input type for the answerQuestionUsingExistingInformation function.
 * - AnswerQuestionUsingExistingInformationOutput - The return type for the answerQuestionUsingExistingInformation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerQuestionUsingExistingInformationInputSchema = z.object({
  question: z.string().describe('The health-related question to answer.'),
  healthInfo: z.string().describe('Relevant health information from the structured database.'),
});

export type AnswerQuestionUsingExistingInformationInput = z.infer<
  typeof AnswerQuestionUsingExistingInformationInputSchema
>;

const AnswerQuestionUsingExistingInformationOutputSchema = z.object({
  answer: z.string().describe('A concise answer to the question using the provided health information.'),
});

export type AnswerQuestionUsingExistingInformationOutput = z.infer<
  typeof AnswerQuestionUsingExistingInformationOutputSchema
>;

export async function answerQuestionUsingExistingInformation(
  input: AnswerQuestionUsingExistingInformationInput
): Promise<AnswerQuestionUsingExistingInformationOutput> {
  return answerQuestionUsingExistingInformationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerQuestionUsingExistingInformationPrompt',
  input: {
    schema: AnswerQuestionUsingExistingInformationInputSchema,
  },
  output: {
    schema: AnswerQuestionUsingExistingInformationOutputSchema,
  },
  prompt: `You are an AI assistant designed to answer questions about health topics.

  Using the following information:
  {{healthInfo}}

  Answer the following question:
  {{question}}
  `,
});

const answerQuestionUsingExistingInformationFlow = ai.defineFlow(
  {
    name: 'answerQuestionUsingExistingInformationFlow',
    inputSchema: AnswerQuestionUsingExistingInformationInputSchema,
    outputSchema: AnswerQuestionUsingExistingInformationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
