
import { GoogleGenAI } from "@google/genai";
import type { DeforestationData, DataSource } from '../types';
import { DeforestationStatus } from '../types';

// FIX: Updated to use process.env.API_KEY directly in initialization as per guidelines.
if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
      "estimatedInitialArea": "string (The estimated total forest area in sq km at the beginning of the time period, e.g., 'approx. 6,000,000 sq km')",
      "chartData": [ { "year": "number", "loss": "number" } ],
      "deforestationDrivers": [ { "reason": "string (e.g., 'Cattle Ranching', 'Soy Cultivation', 'Logging', 'Wildfires')", "percentage": "number" } ],
      "sources": [ { "title": "string", "url": "string" } ]
    }
    IMPORTANT: The 'chartData' array must contain a data point for EVERY SINGLE YEAR within the specified 'timePeriod'. If data for a specific year is unavailable from sources, you can estimate it based on the trend or report it as zero, but the year must be present to ensure a complete graph.
    In addition, identify the primary drivers of deforestation (e.g., agriculture, logging, mining, wildfires) for this forest over the analyzed period and populate the 'deforestationDrivers' array. The percentages should be your best estimate based on the sources and should ideally sum to 100, but approximations are acceptable.
    Synthesize information from the search results to populate all fields. The 'sources' array in the JSON should include any primary sources you identified within the search results.
    Do not invent data. If a specific piece of information isn't in the search results, reflect that appropriately (e.g., an empty array for chartData or deforestationDrivers, or a note in the summary).
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

    // FIX: More robust JSON extraction to handle extraneous text or markdown from the model.
    // This finds the first '{' and last '}' to isolate the JSON object.
    const responseText = response.text.trim();
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}');

    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd < jsonStart) {
        console.error("Invalid response format from AI:", responseText);
        throw new Error("The AI response did not contain a valid JSON object.");
    }
    
    const jsonText = responseText.substring(jsonStart, jsonEnd + 1);
    
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
        !parsedData.estimatedInitialArea ||
        !Array.isArray(parsedData.deforestationDrivers) ||
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

const parseArea = (areaString: string): number => {
    if (!areaString) return 0;
    // Removes commas, text, and gets the first number sequence.
    const match = areaString.match(/[\d,.]+/);
    if (!match) return 0;
    return parseFloat(match[0].replace(/,/g, ''));
};

export const generateVisualEvidence = async (
    analysisData: DeforestationData,
    startYear: number,
    endYear: number
): Promise<string> => {
    // Calculate total loss and percentage for a more accurate image prompt
    const totalLoss = analysisData.chartData.reduce((acc, point) => acc + point.loss, 0);
    const initialArea = parseArea(analysisData.estimatedInitialArea);
    const percentageLoss = initialArea > 0 ? (totalLoss / initialArea) * 100 : 0;

    let lossDescription: string;
    const roundedPercentage = parseFloat(percentageLoss.toFixed(1));

    if (roundedPercentage <= 1) {
        lossDescription = `The forest is healthy and stable with almost no change. Instruct the image model to show only imperceptible differences, perhaps a very slight lightening of green in one or two small spots. The change should NOT be obvious.`;
    } else if (roundedPercentage > 1 && roundedPercentage <= 5) {
        lossDescription = `The deforestation is minor but present. Instruct the image model to show small, scattered patches of light brown, exposed earth, indicating some agricultural clearing or logging. The overall canopy must remain mostly dense. The change should be noticeable upon inspection.`;
    } else if (roundedPercentage > 5 && roundedPercentage <= 15) {
        lossDescription = `The deforestation is clear and significant. Instruct the image model to show multiple, noticeable patches of brown, cleared land. Some of these patches should connect into larger clearings. The forest edge should appear fragmented or "eaten away" in some areas.`;
    } else if (roundedPercentage > 15 && roundedPercentage <= 30) {
        lossDescription = `The deforestation is widespread and severe. Instruct the image model to render large swathes of the green canopy replaced by brown and yellow earth. A visible network of thin logging roads is essential. The contrast between before and after must be stark.`;
    } else { // > 30%
        lossDescription = `The deforestation is dramatic and extreme. Instruct the image model to show a landscape that is visibly scarred. A "fishbone" pattern of roads and massive clearings should dominate the 'after' image. More than a third of the green canopy must be visibly gone, replaced by huge expanses of bare earth, representing industrial-scale agriculture. The visual impact should be shocking.`;
    }

  // Step 1: Generate a high-quality prompt for the image model that is specific to the forest type.
  const promptGenerationPrompt = `
  Based on the deforestation analysis for "${analysisData.forestName}", create a single, concise, and highly descriptive prompt for an image generation AI (like Imagen). The goal is a data-driven, realistic satellite comparison between the years ${startYear} and ${endYear}.

  First, identify the key visual characteristics of the "${analysisData.forestName}". Consider its biome (e.g., tropical rainforest, boreal forest, temperate deciduous), typical flora (e.g., broadleaf trees, conifers), and geographical features (e.g., winding rivers, mountainous terrain, flat plains).

  Then, construct the prompt to describe a satellite image comparison, presented side-by-side in a split-screen view with a clear but thin dividing line.
  
  - Incorporate the specific visual characteristics you identified. For example, if it's the Amazon, mention "dense tropical canopy and a meandering river". If it's the Congo, "vast swathes of dark green, humid rainforest".
  - The 'before' image (left side) should depict the forest from around ${startYear}, showing a lush, dense, and vibrant green canopy under a clear sky, true to its biome.
  - The 'after' image (right side) must depict the same area around ${endYear}. The visual change MUST be a direct and unambiguous representation of the deforestation data. It is critical to get this right. Your prompt to the image model must contain the following specific instructions: "${lossDescription}". Emphasize that the visual cues described (like 'brown patches', 'logging roads', 'fishbone pattern') are not optional and must be rendered clearly. The visual contrast between the two sides of the image is the entire point.
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
