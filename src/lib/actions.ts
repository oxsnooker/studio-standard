'use server';

import { suggestSessionNotes } from '@/ai/flows/suggest-session-notes';

export async function getSuggestedNotes(sessionTimeInSeconds: number, itemsOrdered: string) {
  try {
    const sessionTimeInMinutes = Math.round(sessionTimeInSeconds / 60);
    const result = await suggestSessionNotes({ 
        sessionTime: sessionTimeInMinutes, 
        itemsOrdered: itemsOrdered || 'None' 
    });
    return { success: true, notes: result.suggestedNotes };
  } catch (error) {
    console.error('AI suggestion failed:', error);
    return { success: false, error: 'Failed to generate AI notes.' };
  }
}
