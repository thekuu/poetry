import { GoogleGenAI, Type } from "@google/genai";
import { db } from "../db/index.ts";
import { poems } from "../db/schema.ts";

function normalizeForMatching(text: string): string {
    return (text || '')
        .toLowerCase()
        .replace(/[\s\u200B\u00A0.,!?:;፤።፣፥፦፧፨"'\-_/\\()‹›«»“”]+/g, '')
        .trim();
}

function decodeTelegramHtml(t: string): string {
    return t
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(p|div|h[1-6])>/gi, '\n\n')
        .replace(/<a[^>]*>.*?<\/a>/gi, '') // Remove anchor tags and Telegram handles completely
        .replace(/<[^>]+>/g, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#33;/g, '!')
        .replace(/&#63;/g, '?')
        .replace(/&nbsp;/g, ' ')
        .replace(/[\u00A0\u202F\u2007\u2060\uFEFF]/g, ' ')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');
}

function cleanPoemContent(content: string): string {
    if (!content) return '';
    // Normalize newlines
    let text = content
        .replace(/\\n/g, '\n')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');

    // Remove standalone Telegram handle lines or bot promotion links
    text = text
        .replace(/https?:\/\/t\.me\/\S+/gi, '')
        .replace(/@[\w_]+/g, '');

    // Trim only trailing whitespace of each line to preserve all leading indentations,
    // and preserve ALL internal line gaps (single, double, or triple empty lines) exactly as in the source.
    const rawLines = text.split('\n').map(l => l.trimEnd());

    // Trim only outer top and bottom empty lines
    while (rawLines.length > 0 && rawLines[0].trim() === '') {
        rawLines.shift();
    }
    while (rawLines.length > 0 && rawLines[rawLines.length - 1].trim() === '') {
        rawLines.pop();
    }

    return rawLines.join('\n');
}

export async function scrapeAndParsePoems(url: string) {
    console.log(`[Scraper] Starting scrape for URL: ${url}`);
    
    // Normalize input (support @channel, t.me/channel, https://t.me/channel, etc.)
    let cleanUrl = (url || '').trim();
    if (cleanUrl.startsWith('@')) {
        cleanUrl = `https://t.me/s/${cleanUrl.substring(1)}`;
    } else if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        if (cleanUrl.startsWith('t.me/')) {
            cleanUrl = `https://${cleanUrl}`;
        } else {
            cleanUrl = `https://t.me/s/${cleanUrl}`;
        }
    }

    let targetUrl: URL;
    try {
        targetUrl = new URL(cleanUrl);
    } catch {
        throw new Error("Invalid Telegram link. Please enter a link like https://t.me/amharic_poems or @channel");
    }
    
    // Convert https://t.me/channel to https://t.me/s/channel for web preview if not single post
    const isSinglePost = /^\/[^/]+\/\d+$/.test(targetUrl.pathname);
    let previewUrlStr = cleanUrl;
    if (!isSinglePost && targetUrl.hostname === 't.me' && !targetUrl.pathname.startsWith('/s/')) {
        previewUrlStr = `https://t.me/s${targetUrl.pathname}`;
    }
    console.log(`[Scraper] Resolved preview URL: ${previewUrlStr} (Single post: ${isSinglePost})`);

    // 1. Fetch existing poems from database for deduplication
    const dbPoems = await db.select({
        id: poems.id,
        title: poems.title,
        content: poems.content,
        sourceUrl: poems.sourceUrl
    }).from(poems);

    const existingTitles = new Set(dbPoems.map(p => normalizeForMatching(p.title)));
    const existingContentSnippets = dbPoems.map(p => normalizeForMatching(p.content.slice(0, 80)));
    const existingSourceUrls = new Set(dbPoems.map(p => (p.sourceUrl || '').trim().toLowerCase()));

    console.log(`[Scraper] Loaded ${dbPoems.length} existing poems from DB for duplicate checking.`);

    interface ScrapedItem {
        postId: string;
        postNumber: number;
        postUrl: string;
        candidateTitle: string;
        decodedText: string;
        isExisting: boolean;
    }

    let candidateItems: ScrapedItem[] = [];

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);
        const response = await fetch(previewUrlStr, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        clearTimeout(timeoutId);
        console.log(`[Scraper] Preview fetch status: ${response.status}`);
        const html = await response.text();
        
        // Match message widgets with their data-post attribute
        const postMatches = [...html.matchAll(/data-post="([^"]+)"[\s\S]*?<div class="tgme_widget_message_text[^>]*>(.*?)<\/div>/gis)];
        console.log(`[Scraper] Found ${postMatches.length} messages with data-post`);

        if (postMatches.length > 0) {
            for (const match of postMatches) {
                const postId = match[1];
                const rawHtml = match[2];
                const postNumber = parseInt(postId.split('/').pop() || '0', 10);
                const postUrl = `https://t.me/${postId}`;
                const decodedText = decodeTelegramHtml(rawHtml);

                if (!decodedText || decodedText.length < 20) {
                    continue; // Skip very short messages or join links
                }

                // Extract candidate title from <b>...</b> or first line before <br/>
                const bMatch = rawHtml.match(/<b>(.*?)<\/b>/i);
                const firstLine = rawHtml.split(/<br\s*\/?>/i)[0] || '';
                const candidateTitle = bMatch 
                    ? decodeTelegramHtml(bMatch[1])
                    : decodeTelegramHtml(firstLine);

                const normTitle = normalizeForMatching(candidateTitle);
                const normSnippet = normalizeForMatching(decodedText.slice(0, 100));

                const isTitleInDb = normTitle.length > 0 && existingTitles.has(normTitle);
                const isSnippetInDb = existingContentSnippets.some(snip => snip.length > 15 && normSnippet.includes(snip.slice(0, 35)));
                const isUrlInDb = existingSourceUrls.has(postUrl.toLowerCase());

                const isExisting = isTitleInDb || isSnippetInDb || isUrlInDb;

                candidateItems.push({
                    postId,
                    postNumber,
                    postUrl,
                    candidateTitle,
                    decodedText,
                    isExisting
                });
            }
        } else {
            // Fallback for single post embed mode or if /s/ fails
            const embedUrl = new URL(targetUrl.toString());
            embedUrl.searchParams.set('embed', '1');
            embedUrl.searchParams.set('mode', 'tme');
            
            const controller2 = new AbortController();
            const timeoutId2 = setTimeout(() => controller2.abort(), 10000);
            const embedResponse = await fetch(embedUrl.toString(), {
                signal: controller2.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            clearTimeout(timeoutId2);
            const embedHtml = await embedResponse.text();
            const embedMatch = embedHtml.match(/<div class="tgme_widget_message_text[^>]*>(.*?)<\/div>/is);
            
            if (embedMatch && embedMatch[1]) {
                const decodedText = decodeTelegramHtml(embedMatch[1]);
                const firstLine = embedMatch[1].split(/<br\s*\/?>/i)[0] || '';
                const candidateTitle = decodeTelegramHtml(firstLine);
                const isTitleInDb = candidateTitle && existingTitles.has(normalizeForMatching(candidateTitle));
                const isSnippetInDb = existingContentSnippets.some(snip => snip.length > 15 && normalizeForMatching(decodedText).includes(snip.slice(0, 35)));
                
                candidateItems.push({
                    postId: targetUrl.pathname.replace(/^\//, ''),
                    postNumber: 1,
                    postUrl: cleanUrl,
                    candidateTitle,
                    decodedText,
                    isExisting: !!(isTitleInDb || isSnippetInDb)
                });
            }
        }
    } catch (e: any) {
        console.error("[Scraper] Fetch failed or timed out:", e?.message || e);
    }

    if (candidateItems.length === 0) {
        throw new Error("Could not extract any messages from the provided Telegram URL. Ensure it is a valid, public channel or post.");
    }

    // Single post check
    if (isSinglePost && candidateItems.length === 1 && candidateItems[0].isExisting) {
        throw new Error(`ይህ ግጥም ቀድሞውኑ በስብስብዎ ውስጥ ተካቷል ("${candidateItems[0].candidateTitle || 'Poem'}" is already in your collection).`);
    }

    // 2. Separate into existing and un-fetched
    const existingItems = candidateItems.filter(item => item.isExisting);
    const unFetchedItems = candidateItems.filter(item => !item.isExisting);

    console.log(`[Scraper] Out of ${candidateItems.length} messages: ${existingItems.length} already exist in DB, ${unFetchedItems.length} are un-fetched.`);

    if (unFetchedItems.length === 0) {
        throw new Error("በዚህ ቻናል ላይ የተገኙት የቅርብ ጊዜ ግጥሞች በሙሉ ቀድሞውኑ በስብስብዎ ውስጥ ተካተዋል፤ አዲስ ያልተካተተ ግጥም አልተገኘም። (All recent poems from this channel have already been imported. No new un-fetched poems found.)");
    }

    // 3. Apply rule: "only new poems and two from old that not fetched before"
    let selectedItems: ScrapedItem[] = [];

    if (existingItems.length > 0) {
        // Find the maximum post number that already exists in DB
        const maxFetchedPostNumber = Math.max(...existingItems.map(i => i.postNumber));
        console.log(`[Scraper] Max post number already in DB: ${maxFetchedPostNumber}`);

        // New un-fetched poems are posts after the last fetched post number
        const newUnfetched = unFetchedItems.filter(i => i.postNumber > maxFetchedPostNumber);
        // Older un-fetched poems are posts before or equal to the last fetched post number
        const olderUnfetched = unFetchedItems.filter(i => i.postNumber <= maxFetchedPostNumber);

        console.log(`[Scraper] New un-fetched: ${newUnfetched.length}, Older un-fetched: ${olderUnfetched.length}`);

        // Take up to 2 from old that were not fetched before (most recent 2 of the older backlog)
        const selectedOld = olderUnfetched.slice(-2);
        selectedItems = [...newUnfetched, ...selectedOld];
    } else {
        // No poems from this channel in DB yet:
        // Take the latest 2-3 as new poems, plus up to 2 older ones from the scraped batch
        if (unFetchedItems.length <= 4) {
            selectedItems = unFetchedItems;
        } else {
            const newCount = Math.min(3, unFetchedItems.length - 2);
            const olderPool = unFetchedItems.slice(0, unFetchedItems.length - newCount);
            const newestPool = unFetchedItems.slice(-newCount);
            selectedItems = [...newestPool, ...olderPool.slice(-2)];
        }
    }

    if (selectedItems.length === 0) {
        throw new Error("አዲስ ያልተካተተ ግጥም አልተገኘም። (No new un-fetched poems available to import.)");
    }

    console.log(`[Scraper] Selected ${selectedItems.length} un-fetched poems to process with Gemini AI.`);

    // 4. Process selected items with Gemini AI
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured in your environment variables.");
    }
    const ai = new GoogleGenAI({ apiKey });

    const formattedTexts = selectedItems.map((item, idx) => 
        `--- POEM ${idx + 1} (Source: ${item.postUrl}) ---\n${item.decodedText}\n`
    ).join('\n');

    const prompt = `
You are an expert Amharic poetry scholar, editor, and archivist (የአማርኛ ስነ-ግጥም ሊቅ እና አርታኢ).
Your task is to accurately extract poems from the scraped Telegram messages.

CRITICAL SOURCE FIDELITY & LINE GAP RULES (የምንጭ እና የስንኝ ክፍተት ህግጋት):
1. KEEP EVERYTHING EXACTLY AS THE SOURCE (ሁሉንም እንደምንጩ ጠብቅ):
   - Every single line break between verses must be kept using '\\n'.
   - Every blank line gap ('\\n\\n' or larger) between stanzas or sections MUST BE STRICTLY PRESERVED as in the original source. Under no circumstances should stanza gaps be removed, flattened, or collapsed.
   - Every leading indentation space (e.g. indented couplets or verses) must be kept exactly as in the source.
   - Every punctuation mark (፤ ፣ ። ! ? . . . -) must be kept exactly as in the source.
   - Do NOT rewrite, do NOT summarize, do NOT rephrase, and do NOT alter a single word or letter.
2. TITLE (ርዕስ): Extract the exact poem title. Remove formatting symbols like <b> or surrounding quotes from title.
3. AUTHOR (ገጣሚ): Extract the poet's name if indicated (e.g. from parentheses like (ኤፍሬም ስዩም), after ✍️, በ..., ገጣሚ...). If unknown, return an empty string "".
4. CATEGORY (ምድብ): Categorize into EXACTLY one of: ፍቅር, ሕይወት, ተፈጥሮ, ሐዘን, ተስፋ, ሌላ.
5. CONTENT: The poem body from the first verse to the last verse, excluding the title line, author credit line, and trailing channel handles (@amharic_poems).
6. VERSE ANCHORS:
   - "firstVerse": The exact text of the very first line of the poem body.
   - "lastVerse": The exact text of the very last line of the poem body.

Texts:
"""
${formattedTexts}
"""
`;

    function getSafeModelList(): string[] {
        const envModel = (process.env.GEMINI_MODEL || '').replace(/^models\//, '').trim();
        const preferred = (envModel && !envModel.includes('pro') && !envModel.includes('2.0') && !envModel.includes('2.5'))
            ? envModel
            : 'gemini-3.5-flash-lite';
        
        return Array.from(new Set([preferred, 'gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.8-flash']));
    }

    const candidateModels = getSafeModelList();
    let aiResponse;
    let lastError;

    for (const model of candidateModels) {
        try {
            console.log(`[Scraper] Requesting Gemini with model: ${model}...`);
            aiResponse = await ai.models.generateContent({
                model,
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
                                category: { type: Type.STRING },
                                sourceUrl: { type: Type.STRING },
                                firstVerse: { type: Type.STRING },
                                lastVerse: { type: Type.STRING }
                            },
                            required: ["title", "content", "authorName", "category"]
                        }
                    }
                }
            });
            if (aiResponse?.text) {
                break;
            }
        } catch (err: any) {
            console.warn(`Attempt with model "${model}" failed:`, err.message || err);
            lastError = err;
        }
    }

    if (!aiResponse || !aiResponse.text) {
        throw new Error(lastError?.message || "Failed to generate content from Gemini");
    }

    const rawText = aiResponse.text.trim();
    let result: any[] = [];
    try {
        result = JSON.parse(rawText);
    } catch {
        const cleaned = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
        const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            result = JSON.parse(jsonMatch[0]);
        } else {
            throw new Error("Could not parse AI response as JSON array");
        }
    }

    if (!Array.isArray(result)) {
        return [];
    }

    // 5. Post-process poems: Clean structure and double-check against existing DB poems
    const finalPoems: any[] = [];

    for (let i = 0; i < result.length; i++) {
        const item = result[i];
        const title = (item.title || '').trim();
        const matchedSourceItem = selectedItems[i] || selectedItems[0];

        let poemContent = cleanPoemContent(item.content);

        // Extract verbatim slice directly from the source message to guarantee 100% source fidelity
        if (matchedSourceItem?.decodedText && item.firstVerse && item.lastVerse) {
            const src = matchedSourceItem.decodedText;
            const firstTrim = item.firstVerse.trim();
            const lastTrim = item.lastVerse.trim();
            const firstIdx = src.indexOf(firstTrim);
            const lastIdx = src.lastIndexOf(lastTrim);

            if (firstIdx !== -1 && lastIdx !== -1 && lastIdx >= firstIdx) {
                const verbatimSlice = src.substring(firstIdx, lastIdx + lastTrim.length);
                const cleanedVerbatim = cleanPoemContent(verbatimSlice);
                if (cleanedVerbatim.length >= 20) {
                    poemContent = cleanedVerbatim;
                    console.log(`[Scraper] Successfully extracted 100% verbatim source slice for: "${title}"`);
                }
            }
        }

        if (!poemContent || poemContent.length < 20) {
            continue; // Skip invalid or empty content
        }

        const normTitle = normalizeForMatching(title);
        const normContent = normalizeForMatching(poemContent.slice(0, 80));

        // Strict deduplication check against database
        const isDuplicateTitle = normTitle.length > 0 && existingTitles.has(normTitle);
        const isDuplicateContent = existingContentSnippets.some(snip => snip.length > 15 && normContent.includes(snip.slice(0, 35)));

        if (isDuplicateTitle || isDuplicateContent) {
            console.log(`[Scraper] Discarding duplicate poem detected post-Gemini: "${title}"`);
            continue;
        }

        // Map source URL back if missing
        const sourceUrl = item.sourceUrl || (matchedSourceItem ? matchedSourceItem.postUrl : cleanUrl);

        finalPoems.push({
            title: title || 'ያልተሰየመ ግጥም',
            content: poemContent,
            authorName: (item.authorName || '').trim(),
            category: item.category || 'ሌላ',
            sourceUrl
        });
    }

    console.log(`[Scraper] Completed scrape. Returning ${finalPoems.length} clean, structured poems.`);
    return finalPoems;
}
