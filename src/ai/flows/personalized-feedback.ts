
'use server';

/**
 * @fileOverview Personalized feedback AI agent.
 *
 * - getPersonalizedFeedback - A function that provides personalized feedback based on test results.
 * - PersonalizedFeedbackInput - The input type for the getPersonalizedFeedback function.
 * - PersonalizedFeedbackOutput - The return type for the getPersonalizedFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedFeedbackInputSchema = z.object({
  testResults: z
    .string()
    .describe(
      'The test results of the student. Include the test name, date, and score.'
    ),
  studyPlan: z
    .string()
    .optional()
    .describe('The current study plan of the student, if any.'),
});
export type PersonalizedFeedbackInput = z.infer<typeof PersonalizedFeedbackInputSchema>;

const PersonalizedFeedbackOutputSchema = z.object({
  summary: z
    .string()
    .describe("A brief, one-sentence summary of the student's performance."),
  strengths: z
    .array(z.string())
    .describe("A list of 2-3 areas where the student performed well."),
  areasForImprovement: z
    .array(z.string())
    .describe(
      "A list of 2-3 specific, actionable areas where the student needs to improve."
    ),
  suggestedPlan: z
    .string()
    .describe(
      "A concise, customized study plan in a few sentences based on the results and areas for improvement."
    ),
});
export type PersonalizedFeedbackOutput = z.infer<typeof PersonalizedFeedbackOutputSchema>;

export async function getPersonalizedFeedback(input: PersonalizedFeedbackInput): Promise<PersonalizedFeedbackOutput> {
  return personalizedFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedFeedbackPrompt',
  input: {schema: PersonalizedFeedbackInputSchema},
  output: {schema: PersonalizedFeedbackOutputSchema},
  prompt: `You are an AI driving instructor assistant. Your task is to provide personalized, structured feedback to students based on their driving test results.

  Analyze the following test results. If a study plan is provided, take it into account to tailor your suggestions.

  Test Results: {{{testResults}}}

  {{#if studyPlan}}
  Current Study Plan: {{{studyPlan}}}
  {{/if}}

  Based on the results, generate a structured feedback object. Be encouraging but clear.
  - The summary should be a single sentence.
  - Identify 2-3 strengths.
  - Identify 2-3 key areas for improvement.
  - Create a short, actionable suggested study plan.
  `,
});

const personalizedFeedbackFlow = ai.defineFlow(
  {
    name: 'personalizedFeedbackFlow',
    inputSchema: PersonalizedFeedbackInputSchema,
    outputSchema: PersonalizedFeedbackOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
