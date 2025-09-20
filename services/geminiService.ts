import type { DeforestationData } from '../types';

const API_ENDPOINT = '/api/gemini-proxy';

async function callApi(action: string, payload: unknown) {
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, payload }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `Request failed with status ${response.status}`);
        }
        return data;
    } catch (error) {
        console.error(`API call failed for action "${action}":`, error);
        // Re-throw the error to be caught by the component
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error('An unknown network error occurred.');
    }
}

export const fetchDeforestationData = async (forestName: string): Promise<DeforestationData> => {
    return callApi('fetchDeforestationData', { forestName });
};

export const generateVisualEvidence = async (analysisData: DeforestationData, startYear: number, endYear: number): Promise<string> => {
    const result = await callApi('generateVisualEvidence', { analysisData, startYear, endYear });
    return result.imageUrl;
};

export const fetchDeepResearchData = async (analysisData: DeforestationData): Promise<string> => {
    const result = await callApi('fetchDeepResearchData', { analysisData });
    return result.text;
};