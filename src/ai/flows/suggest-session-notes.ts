'use server';

/**
 * @fileOverview A flow to suggest session notes based on session time and items ordered.
 *
 * - suggestSessionNotes - A function that suggests session notes.
 * - SuggestSessionNotesInput - The input type for the suggestSessionNotes function.
 * - SuggestSessionNotesOutput - The return type for the suggestSessionNotes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSessionNotesInputSchema = z.object({
  sessionTime: z.number().describe('The duration of the session in minutes.'),
  itemsOrdered: z
    .string()
    .describe('A comma-separated list of items ordered during the session.'),
});
export type SuggestSessionNotesInput = z.infer<typeof SuggestSessionNotesInputSchema>;

const SuggestSessionNotesOutputSchema = z.object({
  suggestedNotes: z
    .string()
    .describe('Suggested notes summarizing the session details.'),
});
export type SuggestSessionNotesOutput = z.infer<typeof SuggestSessionNotesOutputSchema>;

export async function suggestSessionNotes(
  input: SuggestSessionNotesInput
): Promise<SuggestSessionNotesOutput> {
  return suggestSessionNotesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSessionNotesPrompt',
  input: {schema: SuggestSessionNotesInputSchema},
  output: {schema: SuggestSessionNotesOutputSchema},
  prompt: `You are a snooker club assistant. Based on the session time and items ordered, suggest notes summarizing the session. Keep it concise.

Session Time: {{{sessionTime}}} minutes
Items Ordered: {{{itemsOrdered}}}

Suggested Notes:`,
});

const suggestSessionNotesFlow = ai.defineFlow(
  {
    name: 'suggestSessionNotesFlow',
    inputSchema: SuggestSessionNotesInputSchema,
    outputSchema: SuggestSessionNotesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
