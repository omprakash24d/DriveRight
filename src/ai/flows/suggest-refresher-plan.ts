'use server';

/**
 * @fileOverview An AI agent for suggesting refresher course lesson plans.
 *
 * - suggestRefresherPlan - A function that creates a lesson plan based on a student's request.
 * - SuggestRefresherPlanInput - The input type for the suggestRefresherPlan function.
 * - SuggestRefresherPlanOutput - The return type for the suggestRefresherPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRefresherPlanInputSchema = z.object({
  reason: z
    .string()
    .describe(
      'The reason provided by the student for requesting a refresher course.'
    ),
});
export type SuggestRefresherPlanInput = z.infer<typeof SuggestRefresherPlanInputSchema>;

const SuggestRefresherPlanOutputSchema = z.object({
  plan: z
    .string()
    .describe(
      'A concise, actionable lesson plan for a driving instructor based on the student\'s reason. The plan should be a few bullet points.'
    ),
});
export type SuggestRefresherPlanOutput = z.infer<typeof SuggestRefresherPlanOutputSchema>;

export async function suggestRefresherPlan(input: SuggestRefresherPlanInput): Promise<SuggestRefresherPlanOutput> {
  return suggestRefresherPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRefresherPlanPrompt',
  input: {schema: SuggestRefresherPlanInputSchema},
  output: {schema: SuggestRefresherPlanOutputSchema},
  prompt: `You are an expert driving instructor creating a lesson plan. Based on the student's reason for needing a refresher course, create a concise, actionable lesson plan.

  Student's Reason: {{{reason}}}

  Provide a few bullet points outlining the key areas to focus on during the refresher lessons.
  `,
});

const suggestRefresherPlanFlow = ai.defineFlow(
  {
    name: 'suggestRefresherPlanFlow',
    inputSchema: SuggestRefresherPlanInputSchema,
    outputSchema: SuggestRefresherPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
