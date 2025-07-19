
// src/app/contact/_ai/personalize-response.ts
'use server';

/**
 * @fileOverview An AI flow to generate personalized thank you messages.
 *
 * - personalizeResponse - A function that creates a custom response based on user input.
 * - PersonalizeResponseInput - The input type for the personalizeResponse function.
 * - PersonalizeResponseOutput - The return type for the personalizeResponse function.
 */

import {ai} from './genkit';
import {z} from 'genkit';

const PersonalizeResponseInputSchema = z.object({
  message: z.string().describe("The content of the user's message."),
});
export type PersonalizeResponseInput = z.infer<
  typeof PersonalizeResponseInputSchema
>;

const PersonalizeResponseOutputSchema = z.object({
  personalizedMessage: z
    .string()
    .describe(
      "A short, friendly, personalized thank you message that acknowledges the topic of the user's query."
    ),
});
export type PersonalizeResponseOutput = z.infer<
  typeof PersonalizeResponseOutputSchema
>;

export async function personalizeResponse(
  input: PersonalizeResponseInput
): Promise<PersonalizeResponseOutput> {
  return personalizeResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizeResponsePrompt',
  input: {schema: PersonalizeResponseInputSchema},
  output: {schema: PersonalizeResponseOutputSchema},
  prompt: `You are a friendly and helpful assistant. Your task is to generate a personalized success message for a user who has just submitted a contact form.

The message should be a single, warm, and reassuring sentence. It must briefly acknowledge the main topic of the user's message without being too specific or making any promises.

For example, if the user's message is about "pricing for a project", a good response would be: "Thank you for your inquiry about our pricing! We've received your message and will get back to you with the details shortly."
If the user's message is a bug report about "the login page", a good response would be: "Thank you for reporting the issue with the login page. We'll look into it right away."
If the user's message is a general question about "your services", a good response would be: "Thank you for your interest in our services! We've received your message and will be in touch soon."

User's Message:
{{{message}}}
`,
});

const personalizeResponseFlow = ai.defineFlow(
  {
    name: 'personalizeResponseFlow',
    inputSchema: PersonalizeResponseInputSchema,
    outputSchema: PersonalizeResponseOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      return output!;
    } catch (error) {
      console.error('Failed to generate personalized message:', error);
      // Return a generic success message on failure
      return {
        personalizedMessage:
          "Thank you for your message. We've received your submission and will get back to you shortly.",
      };
    }
  }
);
