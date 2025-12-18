'use server';

/**
 * @fileOverview An AI agent that converts human-readable addresses into geographical coordinates.
 *
 * - getLocationCoordinates - A function that handles the conversion process.
 * - LocationInput - The input type for the getLocationCoordinates function.
 * - LocationOutput - The return type for the getLocationCoordinates function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LocationInputSchema = z.object({
  address: z.string().describe('The human-readable address to convert.'),
});
export type LocationInput = z.infer<typeof LocationInputSchema>;

const LocationOutputSchema = z.object({
  latitude: z.number().describe('The latitude of the address.'),
  longitude: z.number().describe('The longitude of the address.'),
});
export type LocationOutput = z.infer<typeof LocationOutputSchema>;

export async function getLocationCoordinates(input: LocationInput): Promise<LocationOutput> {
  return locationCoordinatesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'locationCoordinatesPrompt',
  input: {schema: LocationInputSchema},
  output: {schema: LocationOutputSchema},
  prompt: `You are a geocoding expert. Convert the given address into geographical coordinates (latitude and longitude).

Address: {{{address}}}

Output the latitude and longitude in JSON format.`,
});

const locationCoordinatesFlow = ai.defineFlow(
  {
    name: 'locationCoordinatesFlow',
    inputSchema: LocationInputSchema,
    outputSchema: LocationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
