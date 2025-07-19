
// src/app/contact/_ai/spam-filter.ts
'use server';

/**
 * @fileOverview An AI-powered spam filter for contact form submissions.
 *
 * - analyzeSubmission - A function that analyzes form submissions for spam.
 * - AnalyzeSubmissionInput - The input type for the analyzeSubmission function.
 * - AnalyzeSubmissionOutput - The return type for the analyzeSubmission function.
 */

import {ai} from './genkit';
import {z} from 'genkit';

const AnalyzeSubmissionInputSchema = z.object({
  ipAddress: z
    .string()
    .describe('The IP address of the user submitting the form.'),
  content: z.string().describe('The content of the form submission.'),
  honeypotFilled: z
    .boolean()
    .describe('Whether the honeypot field was filled or not.'),
});
export type AnalyzeSubmissionInput = z.infer<typeof AnalyzeSubmissionInputSchema>;

const AnalyzeSubmissionOutputSchema = z.object({
  isSpam: z
    .boolean()
    .describe(
      'Whether or not the submission is considered spam by the AI model.'
    ),
  reason: z
    .string()
    .describe('The reason why the submission was classified as spam.'),
});
export type AnalyzeSubmissionOutput = z.infer<typeof AnalyzeSubmissionOutputSchema>;

export async function analyzeSubmission(
  input: AnalyzeSubmissionInput
): Promise<AnalyzeSubmissionOutput> {
  return analyzeSubmissionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeSubmissionPrompt',
  input: {schema: AnalyzeSubmissionInputSchema},
  output: {schema: AnalyzeSubmissionOutputSchema},
  prompt: `You are an AI spam filter that analyzes contact form submissions.

You will use the following information to determine if the submission is spam or not. You will make a determination as to whether the submission is spam or not, and set the isSpam output field appropriately.  If the honeypotFilled is true, the submission should always be marked as spam.

IP Address: {{{ipAddress}}}
Content: {{{content}}}
Honeypot Filled: {{{honeypotFilled}}}

Explain your reasoning in the reason field.
`,
});

const analyzeSubmissionFlow = ai.defineFlow(
  {
    name: 'analyzeSubmissionFlow',
    inputSchema: AnalyzeSubmissionInputSchema,
    outputSchema: AnalyzeSubmissionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
