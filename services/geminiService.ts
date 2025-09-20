import { GoogleGenAI } from "@google/genai";
import type { DeforestationData, DataSource } from '../types';
import { DeforestationStatus } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const fetchDeforestationData = async (forestName: string): Promise<DeforestationData> => {
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
      "chartData": [ { "year": "number", "loss": "number" } ],
      "sources": [ { "title": "string", "url": "string" } ]
    }
    Synthesize information from the search results to populate all fields. The 'chartData' should cover the last 5-10 years if possible, representing tree cover loss in square kilometers. The 'sources' array in the JSON should include any primary sources you identified within the search results.
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

    // Extract JSON from the response text, removing markdown backticks if present
    let jsonText = response.text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.substring(7, jsonText.length - 3).trim();
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.substring(3, jsonText.length - 3).trim();
    }
    const parsedData = JSON.parse(jsonText) as DeforestationData;

    // Extract sources from grounding metadata provided by Google Search
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
    
    // Combine sources from the AI's response and the grounding data, ensuring no duplicates
    const allSources = [...(parsedData.sources || []), ...groundingSources];
    const uniqueSources = Array.from(new Map(allSources.map(item => [item.url, item])).values());
    parsedData.sources = uniqueSources;

    // Basic validation to ensure the parsed object matches the expected structure.
    if (
        !parsedData.forestName ||
        !parsedData.status ||
        !parsedData.conclusion ||
        !Object.values(DeforestationStatus).includes(parsedData.status)
    ) {
        throw new Error('AI response is missing required fields or has an invalid status.');
    }
    
    return parsedData;

  } catch (error) {
    console.error("Error fetching or parsing data from Gemini API:", error);
    let errorMessage = "Failed to get a valid analysis from the AI. The web search might not have returned sufficient data.";
    if (error instanceof SyntaxError) { // Catches JSON.parse errors
        errorMessage = "The AI returned an invalid data format. Please try your search again.";
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }
    throw new Error(errorMessage);
  }
};

export const generateVisualEvidence = async (analysisData: DeforestationData): Promise<string> => {
  // Step 1: Generate a high-quality prompt for the image model that is specific to the forest type.
  const promptGenerationPrompt = `
  Based on the deforestation analysis for "${analysisData.forestName}", create a single, concise, and highly descriptive prompt for an image generation AI (like Imagen). The goal is an image that looks like a realistic satellite comparison.

  First, identify the key visual characteristics of the "${analysisData.forestName}". Consider its biome (e.g., tropical rainforest, boreal forest, temperate deciduous), typical flora (e.g., broadleaf trees, conifers), and geographical features (e.g., winding rivers, mountainous terrain, flat plains).

  Then, construct the prompt to describe a satellite image comparison, presented side-by-side in a split-screen view with a clear but thin dividing line.
  
  - Incorporate the specific visual characteristics you identified. For example, if it's the Amazon, mention "dense tropical canopy and a meandering river". If it's the Congo, "vast swathes of dark green, humid rainforest".
  - The 'before' image (left side) should depict the forest from around the start of the analysis period (${analysisData.timePeriod.split('-')[0]}), showing a lush, dense, and vibrant green canopy under a clear sky, true to its biome.
  - The 'after' image (right side) should depict the same area towards the end of the period (${analysisData.timePeriod.split('-')[1]}), clearly showing the impact of deforestation: visible cleared patches (showing exposed, brownish earth), logging roads, and reduced tree density.
  - The style must be "ultra-realistic 4k satellite photography". Emphasize the stark visual contrast.
  - Include small, unobtrusive text labels 'Before: ~${analysisData.timePeriod.split('-')[0]}' and 'After: ~${analysisData.timePeriod.split('-')[1]}' on their respective sides.

  Analysis Data:
  - Forest Name: ${analysisData.forestName}
  - Status: ${analysisData.status}
  - Summary: ${analysisData.summary}
  - Area Lost: ${analysisData.areaLost} over ${analysisData.timePeriod}

  Generate ONLY the image prompt text and nothing else.
  `;

  try {
    const promptResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: promptGenerationPrompt,
        config: {
            temperature: 0.3,
        }
    });
    const imagePrompt = promptResponse.text.trim();
    console.log("Generated Image Prompt:", imagePrompt);

    // Step 2: Generate the image using the created prompt
    const imageResponse = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: imagePrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '16:9',
        },
    });

    const base64ImageBytes = imageResponse.generatedImages[0]?.image?.imageBytes;

    if (!base64ImageBytes) {
        throw new Error('Image generation failed to return image data.');
    }

    return `data:image/jpeg;base64,${base64ImageBytes}`;

  } catch (error) {
    console.error("Error during visual evidence generation:", error);
    throw new Error("The AI failed to generate a visual representation. This can happen with complex or ambiguous data.");
  }
};

export const fetchDeepResearchData = async (analysisData: DeforestationData): Promise<string> => {
    const prompt = `
    You are an expert environmental data analyst who has already performed an initial analysis for "${analysisData.forestName}". Now, you must conduct a "deep research" investigation.

    Your task is to re-evaluate your initial findings and provide a more nuanced, detailed narrative. Use Google Search again, but this time, specifically look for corroborating or conflicting reports from more niche, authoritative sources like academic journals, environmental NGO publications (e.g., WWF, Greenpeace), government environmental agencies, and indigenous rights organizations.

    Initial Analysis Context:
    - Forest Name: ${analysisData.forestName}
    - Status: ${analysisData.status}
    - Summary: ${analysisData.summary}
    - Area Lost: ${analysisData.areaLost} over ${analysisData.timePeriod}

    Your deep research response should be a single text block (2-4 paragraphs) that addresses the following:
    1.  **Corroboration & Nuance:** Do the deeper sources confirm the initial findings? Add more specific details. For instance, if the initial summary mentioned agriculture as a driver, the deep research should specify *what kind* of agriculture (e.g., soy, palm oil, cattle ranching).
    2.  **Conflicting Data or Perspectives:** Did you find any data that conflicts with the initial analysis? Are there different viewpoints on the severity or causes of deforestation in this region?
    3.  **Root Causes & Impacts:** Briefly touch upon the underlying socio-economic drivers (e.g., government policies, illegal logging, poverty) and the ecological or social impacts (e.g., biodiversity loss, displacement of communities) mentioned in your new sources.
    4.  **Data Confidence:** Conclude with a sentence about your confidence in the overall analysis, given the available data.

    Provide ONLY the text of your deep research findings. Do not repeat the initial analysis data.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                temperature: 0.5,
            },
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error during deep research:", error);
        throw new Error("The AI failed to conduct a deep research analysis. The web search may not have returned sufficient data for a deeper dive.");
    }
};