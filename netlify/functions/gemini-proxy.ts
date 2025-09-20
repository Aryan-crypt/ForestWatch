import { GoogleGenAI } from "@google/genai";
import type { Handler } from "@netlify/functions";

// Copied types from types.ts to avoid pathing issues in serverless function builds
enum DeforestationStatus {
  SIGNIFICANT = 'Significant Deforestation Detected',
  MINOR = 'Minor Deforestation Detected',
  STABLE = 'No Major Deforestation Detected',
  UNKNOWN = 'Status Unknown',
}
interface ChartDataPoint {
  year: number;
  loss: number;
}
interface DataSource {
  title: string;
  url: string;
}
interface DeforestationData {
  forestName: string;
  status: DeforestationStatus;
  summary: string;
  conclusion: string;
  areaLost: string;
  timePeriod: string;
  estimatedInitialArea: string;
  chartData: ChartDataPoint[];
  sources: DataSource[];
}

const { GEMINI_API_KEY } = process.env;

if (!GEMINI_API_KEY) {
  throw new Error("The GEMINI_API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const handleFetchDeforestationData = async (forestName: string): Promise<DeforestationData> => {
    const prompt = `
    Analyze deforestation status for "${forestName}".
    Act as an expert environmental data analyst. Use the provided Google Search results to find the most up-to-date and accurate data available, ideally up to the last full year.
    Your response MUST be a single JSON object string and nothing else. Do not include markdown formatting like \`\`\`json.
    The JSON object must conform to this structure:
    {
      "forestName": "string",
      "status": "string (Enum: 'Significant Deforestation Detected', 'Minor Deforestation Detected', 'No Major Deforestation Detected', 'Status Unknown')",
      "summary": "string (A concise summary of the findings)",
      "conclusion": "string (A concluding thought or forward-looking outlook on the forest's future based on the data.)",
      "areaLost": "string (e.g., 'approx. 15,000 sq km')",
      "timePeriod": "string (e.g., '2015-2023')",
      "estimatedInitialArea": "string (The estimated total forest area in sq km at the beginning of the time period, e.g., 'approx. 6,000,000 sq km')",
      "chartData": [ { "year": "number", "loss": "number" } ],
      "sources": [ { "title": "string", "url": "string" } ]
    }
    IMPORTANT: The 'chartData' array must contain a data point for EVERY SINGLE YEAR within the specified 'timePeriod'. If data for a specific year is unavailable from sources, you can estimate it based on the trend or report it as zero, but the year must be present to ensure a complete graph.
    Synthesize information from the search results to populate all fields. The 'sources' array in the JSON should include any primary sources you identified within the search results.
    Do not invent data. If a specific piece of information isn't in the search results, reflect that appropriately (e.g., an empty array for chartData, or a note in the summary).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      },
    });

    let jsonText = response.text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.substring(7, jsonText.length - 3).trim();
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.substring(3, jsonText.length - 3).trim();
    }
    const parsedData = JSON.parse(jsonText) as DeforestationData;

    const groundingSources: DataSource[] = [];
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
      for (const chunk of groundingChunks) {
        if (chunk.web) {
          groundingSources.push({
            title: chunk.web.title || new URL(chunk.web.uri).hostname,
            url: chunk.web.uri,
          });
        }
      }
    }
    
    const allSources = [...(parsedData.sources || []), ...groundingSources];
    const uniqueSources = Array.from(new Map(allSources.map(item => [item.url, item])).values());
    parsedData.sources = uniqueSources;

    if (!parsedData.forestName || !parsedData.status || !parsedData.conclusion || !parsedData.estimatedInitialArea || !Object.values(DeforestationStatus).includes(parsedData.status)) {
        throw new Error('AI response is missing required fields or has an invalid status.');
    }
    
    return parsedData;
  } catch (error) {
    console.error("Error in handleFetchDeforestationData:", error);
    let errorMessage = "Failed to get a valid analysis from the AI. The web search might not have returned sufficient data.";
    if (error instanceof SyntaxError) {
        errorMessage = "The AI returned an invalid data format. Please try your search again.";
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }
    throw new Error(errorMessage);
  }
};

const handleGenerateVisualEvidence = async ({ analysisData, startYear, endYear }: { analysisData: DeforestationData; startYear: number; endYear: number }): Promise<{ imageUrl: string }> => {
    const parseArea = (areaString: string): number => {
      if (!areaString) return 0;
      const match = areaString.match(/[\d,.]+/);
      if (!match) return 0;
      return parseFloat(match[0].replace(/,/g, ''));
    };

    const totalLoss = analysisData.chartData.reduce((acc, point) => acc + point.loss, 0);
    const initialArea = parseArea(analysisData.estimatedInitialArea);
    const percentageLoss = initialArea > 0 ? (totalLoss / initialArea) * 100 : 0;

    let lossDescription = `The deforestation level is significant.`;
    if (analysisData.status === DeforestationStatus.STABLE || percentageLoss === 0) {
        lossDescription = `The forest is mostly stable with minimal to no visible deforestation.`
    } else if (percentageLoss > 0 && percentageLoss <= 5) {
        lossDescription = `The deforestation is noticeable but minor, with about ${percentageLoss.toFixed(1)}% of the area affected.`;
    } else if (percentageLoss > 5 && percentageLoss <= 20) {
        lossDescription = `The deforestation is significant, with visible clearing affecting around ${percentageLoss.toFixed(1)}% of the area.`;
    } else if (percentageLoss > 20) {
        lossDescription = `The deforestation is severe and widespread, with over ${percentageLoss.toFixed(1)}% of the area cleared.`;
    }

  const promptGenerationPrompt = `
  Based on the deforestation analysis for "${analysisData.forestName}", create a single, concise, and highly descriptive prompt for an image generation AI (like Imagen). The goal is a data-driven, realistic satellite comparison between the years ${startYear} and ${endYear}.
  First, identify the key visual characteristics of the "${analysisData.forestName}". Consider its biome (e.g., tropical rainforest, boreal forest, temperate deciduous), typical flora (e.g., broadleaf trees, conifers), and geographical features (e.g., winding rivers, mountainous terrain, flat plains).
  Then, construct the prompt to describe a satellite image comparison, presented side-by-side in a split-screen view with a clear but thin dividing line.
  - Incorporate the specific visual characteristics you identified.
  - The 'before' image (left side) should depict the forest from around ${startYear}, showing a lush, dense, and vibrant green canopy under a clear sky, true to its biome.
  - The 'after' image (right side) should depict the same area towards ${endYear}. It MUST visually represent the calculated data for the overall period. The prompt must instruct the AI that: "${lossDescription}". This means showing signs of deforestation like cleared patches (exposed, brownish earth), logging roads, or reduced tree density that are proportional to this level of loss. The visual change must be consistent with the data provided, not exaggerated.
  - The style must be "ultra-realistic 4k satellite photography". Emphasize the stark visual contrast.
  - Include small, unobtrusive text labels 'Before: ~${startYear}' and 'After: ~${endYear}' on their respective sides.
  Analysis Data Context (for overall trend):
  - Forest Name: ${analysisData.forestName}
  - Status: ${analysisData.status}
  - Total Loss: ${totalLoss.toLocaleString()} sq km over ${analysisData.timePeriod}
  - Percentage Loss: ~${percentageLoss.toFixed(1)}%
  Generate ONLY the image prompt text and nothing else.
  `;

  try {
    const promptResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: promptGenerationPrompt,
        config: { temperature: 0.3 }
    });
    const imagePrompt = promptResponse.text.trim();

    const imageResponse = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: imagePrompt,
        config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '16:9' },
    });

    const base64ImageBytes = imageResponse.generatedImages[0]?.image?.imageBytes;
    if (!base64ImageBytes) throw new Error('Image generation failed to return image data.');

    return { imageUrl: `data:image/jpeg;base64,${base64ImageBytes}` };
  } catch (error) {
    console.error("Error in handleGenerateVisualEvidence:", error);
    throw new Error("The AI failed to generate a visual representation. This can happen with complex or ambiguous data.");
  }
};

const handleFetchDeepResearchData = async ({ analysisData }: { analysisData: DeforestationData }): Promise<{ text: string }> => {
    const prompt = `
    You are an expert environmental data analyst who has already performed an initial analysis for "${analysisData.forestName}". Now, you must conduct a "deep research" investigation.
    Your task is to re-evaluate your initial findings and provide a more nuanced, detailed narrative. Use Google Search again, but this time, specifically look for corroborating or conflicting reports from more niche, authoritative sources like academic journals, environmental NGO publications (e.g., WWF, Greenpeace), government environmental agencies, and indigenous rights organizations.
    Initial Analysis Context:
    - Forest Name: ${analysisData.forestName}
    - Status: ${analysisData.status}
    - Summary: ${analysisData.summary}
    - Area Lost: ${analysisData.areaLost} over ${analysisData.timePeriod}
    Your deep research response should be a single text block (2-4 paragraphs) that addresses the following:
    1.  **Corroboration & Nuance:** Do the deeper sources confirm the initial findings? Add more specific details.
    2.  **Conflicting Data or Perspectives:** Did you find any data that conflicts with the initial analysis?
    3.  **Root Causes & Impacts:** Briefly touch upon the underlying socio-economic drivers and the ecological or social impacts.
    4.  **Data Confidence:** Conclude with a sentence about your confidence in the overall analysis.
    Provide ONLY the text of your deep research findings.
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }], temperature: 0.5 },
        });
        return { text: response.text.trim() };
    } catch (error) {
        console.error("Error in handleFetchDeepResearchData:", error);
        throw new Error("The AI failed to conduct a deep research analysis.");
    }
};

const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const { action, payload } = JSON.parse(event.body || '{}');
        let result;

        switch (action) {
            case 'fetchDeforestationData':
                if (!payload.forestName) throw new Error('Missing forestName');
                result = await handleFetchDeforestationData(payload.forestName);
                break;
            case 'generateVisualEvidence':
                if (!payload.analysisData || !payload.startYear || !payload.endYear) throw new Error('Missing payload for image generation');
                result = await handleGenerateVisualEvidence(payload);
                break;
            case 'fetchDeepResearchData':
                 if (!payload.analysisData) throw new Error('Missing payload for deep research');
                result = await handleFetchDeepResearchData(payload);
                break;
            default:
                throw new Error(`Unknown action: ${action}`);
        }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(result),
        };
    } catch (error) {
        console.error('Error in Netlify function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error instanceof Error ? error.message : 'An internal server error occurred.' }),
        };
    }
};

export { handler };