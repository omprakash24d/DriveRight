
'use server';
/**
 * @fileOverview A chatbot AI agent for the driving school.
 *
 * - chat - A function that handles the chatbot conversation.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import {ai} from '@/ai/genkit';
import {schoolConfig} from '@/lib/config';
import {z} from 'genkit';
import { getCourses } from '@/services/coursesService';
import { getInstructors } from '@/services/instructorsService';

const ChatHistoryMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const ChatInputSchema = z.object({
  history: z
    .array(ChatHistoryMessageSchema)
    .describe('The conversation history, starting with the user.'),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  response: z.string().describe("The chatbot's response."),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;


const listCoursesTool = ai.defineTool(
  {
    name: 'listCourses',
    description: 'Get a list of available driving courses and their prices.',
    outputSchema: z.array(z.object({ title: z.string(), price: z.string() })),
  },
  async () => {
    const courses = await getCourses();
    return courses.map(c => ({ title: c.title, price: c.price }));
  }
);

const listInstructorsTool = ai.defineTool(
  {
    name: 'listInstructors',
    description: 'Get a list of available driving instructors.',
    outputSchema: z.array(z.object({ name: z.string(), specialties: z.string() })),
  },
  async () => {
    const instructors = await getInstructors();
    return instructors.map(i => ({ name: i.name, specialties: i.specialties }));
  }
);

export async function chat(input: ChatInput): Promise<ChatOutput> {
  return chatbotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatbotPrompt',
  input: {schema: ChatInputSchema},
  output: {schema: ChatOutputSchema},
  tools: [listCoursesTool, listInstructorsTool],
  system: `You are a friendly and helpful AI assistant for a driving school called "${schoolConfig.name}".
Your goal is to answer questions and guide users. Use the available tools to provide real-time information when asked about courses and instructors.

Your output MUST be a JSON object that conforms to this Zod schema: { response: z.string() }.

Available Pages (for general guidance):
- Home: General information.
- Courses (/courses): Details on LMV, MCWG, HMV, and Refresher courses.
- Refresher Course Request (/refresher): For licensed drivers to request a refresher course.
- Enroll (/enroll): Online enrollment form.
- Instructors (/instructors): Information about the teaching staff.
- Contact (/contact): For sending messages to the admin.
- Results (/results): To check test results.
- LL Exam Pass Info (/ll-exam-pass): To inquire about Learner's License exam results.
- DL Print Request (/license-print): To request a print-ready copy of a Driving License.
- Certificate Download (/certificate/download): To download a course completion certificate.

School Information:
- Name: ${schoolConfig.name}
- Email: ${schoolConfig.contactEmail}
- Phone: ${schoolConfig.phone}

Rules:
- Be concise and friendly.
- Use the tools provided for accurate, up-to-date data about courses and instructors. If asked about specific student results, politely direct them to the Results page (/results).
- If you use a tool, summarize the information in a friendly, conversational way. Don't just dump the raw data.
- If you don't know the answer and a tool cannot help, politely say so and suggest they use the contact form.
- When you mention a page, provide the path in parentheses, like "You can see our courses on the Courses page (/courses)".
- Do not make up information about pricing, schedules, or services not mentioned.
- The user's entire conversation history is provided. Use it for context.`,
});

const chatbotFlow = ai.defineFlow(
  {
    name: 'chatbotFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async input => {
    try {
      // The prompt function automatically uses the 'history' field for multi-turn conversations
      // and handles the tool-calling loop.
      const {output} = await prompt(input);
      if (output) {
        return output;
      }
      // Fallback if AI gives no output
      return { response: "I'm sorry, I couldn't generate a response. Please try rephrasing your message." };
    } catch (error) {
      console.error("Error in chatbotFlow:", error);
      // Fallback for system errors
      return { response: "I'm currently experiencing technical difficulties. Please try again in a few moments." };
    }
  }
);
