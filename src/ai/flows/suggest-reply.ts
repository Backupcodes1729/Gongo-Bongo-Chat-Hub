// src/ai/flows/suggest-reply.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow that suggests smart replies to a given message.
 *
 * - suggestReply - A function that takes a message as input and returns suggested replies.
 * - SuggestReplyInput - The input type for the suggestReply function.
 * - SuggestReplyOutput - The return type for the suggestReply function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestReplyInputSchema = z.object({
  message: z.string().describe('The message to generate smart replies for.'),
});
export type SuggestReplyInput = z.infer<typeof SuggestReplyInputSchema>;

const SuggestReplyOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('An array of suggested replies to the message.'),
});
export type SuggestReplyOutput = z.infer<typeof SuggestReplyOutputSchema>;

export async function suggestReply(input: SuggestReplyInput): Promise<SuggestReplyOutput> {
  return suggestReplyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestReplyPrompt',
  input: {schema: SuggestReplyInputSchema},
  output: {schema: SuggestReplyOutputSchema},
  prompt: `You are a helpful AI assistant that suggests smart replies to messages.

  Given the following message:
  {{message}}

  Suggest 3 short replies that the user can send. The replies should be no more than 5 words each.
  Format the replies as a JSON array of strings.
  `,
});

const suggestReplyFlow = ai.defineFlow(
  {
    name: 'suggestReplyFlow',
    inputSchema: SuggestReplyInputSchema,
    outputSchema: SuggestReplyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
