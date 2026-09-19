import { GoogleGenAI, Type } from "@google/genai";

export async function scrapeAndParsePoems(url: string) {
    const targetUrl = new URL(url);
    
    // Convert https://t.me/channel to https://t.me/s/channel for web preview
    let previewUrlStr = url;
    if (targetUrl.hostname === 't.me' && !targetUrl.pathname.startsWith('/s/')) {
        previewUrlStr = `https://t.me/s${targetUrl.pathname}`;
    }

    let rawTexts: string[] = [];

    try {
        const response = await fetch(previewUrlStr, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const html = await response.text();
        
        // Extract all message text divs
        const matches = [...html.matchAll(/<div class="tgme_widget_message_text[^>]*>(.*?)<\/div>/gis)];
        
        if (matches.length > 0) {
            // Get up to 10 most recent messages
            const recentMatches = matches.slice(-10);
            for (const match of recentMatches) {
                const text = match[1].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
                if (text) {
                    rawTexts.push(text);
                }
            }
        } else {
            // Fallback for single post embed mode or if /s/ fails
            const embedUrl = new URL(targetUrl.toString());
            embedUrl.searchParams.set('embed', '1');
            embedUrl.searchParams.set('mode', 'tme');
            
            const embedResponse = await fetch(embedUrl.toString(), {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            const embedHtml = await embedResponse.text();
            const embedMatch = embedHtml.match(/<div class="tgme_widget_message_text[^>]*>(.*?)<\/div>/is);
            
            if (embedMatch && embedMatch[1]) {
                const text = embedMatch[1].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
                if (text) rawTexts.push(text);
            } else {
                // Main page fallback
                const metaMatch = html.match(/<meta property="og:description" content="([^"]+)"/i);
                if (metaMatch && metaMatch[1] && metaMatch[1].trim() !== '') {
                    rawTexts.push(metaMatch[1]);
                }
            }
        }
    } catch (e) {
        console.error("Fetch failed:", e);
    }

    if (rawTexts.length === 0) {
        throw new Error("Could not extract any content from the provided Telegram URL. Ensure it is a valid, public channel or post.");
    }

    // Process with Gemini AI
    const ai = new GoogleGenAI();
    
    const formattedTexts = rawTexts.map((text, idx) => `--- Poem ${idx + 1} ---\n${text}\n`).join('\n');

    const prompt = `
    Extract Amharic poems from the following texts scraped from a Telegram channel.
    
    Texts:
    """
    ${formattedTexts}
    """
    
    Instructions:
    - Return an array of objects.
    - Each object should represent a poem extracted from the texts above.
    - Format the content as a proper poem with correct line breaks. Do not wrap it in quotes.
    - If there is a title at the top, extract it. If not, invent a short fitting title in Amharic.
    - If there is an author name (e.g., "✍️ Author" or "- Author"), extract it. Otherwise return an empty string.
    - Categorize it into one of these exact allowed categories: ፍቅር, ሕይወት, ተፈጥሮ, ሐዘን, ተስፋ, ሌላ. Pick the best fit.
    - Skip any texts that do not look like poems (e.g., pure announcements, links, UI text). Do not include them in the array.
    `;

    const selectedModel = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

    let aiResponse;
    try {
        aiResponse = await ai.models.generateContent({
            model: selectedModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            content: { type: Type.STRING },
                            authorName: { type: Type.STRING },
                            category: { type: Type.STRING }
                        },
                        required: ["title", "content", "authorName", "category"]
                    }
                }
            }
        });
    } catch (primaryErr) {
        console.warn(`Primary model ${selectedModel} failed, trying fallback gemini-3.8-flash:`, primaryErr);
        aiResponse = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            content: { type: Type.STRING },
                            authorName: { type: Type.STRING },
                            category: { type: Type.STRING }
                        },
                        required: ["title", "content", "authorName", "category"]
                    }
                }
            }
        });
    }

    if (!aiResponse.text) {
        throw new Error("Failed to generate content from Gemini");
    }

    const result = JSON.parse(aiResponse.text);
    return result;
}
