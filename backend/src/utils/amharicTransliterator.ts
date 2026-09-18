export const amharicDictionary: Record<string, string[]> = {
    'bewketu': ['በእውቀቱ'],
    'bewuketu': ['በእውቀቱ'],
    'seyoum': ['ስዩም', 'ሥዩም'],
    'seyum': ['ስዩም', 'ሥዩም'],
    'ephrem': ['ኤፍሬም'],
    'efrem': ['ኤፍሬም'],
    'desu': ['ደሱ'],
    'fikrel': ['ፍቅርኤል'],
    'fikir': ['ፍቅር'],
    'fkr': ['ፍቅር'],
    'nuredin': ['ኑረዲን'],
    'isa': ['ኢሳ'],
    'wendye': ['ወንድዬ'],
    'wendie': ['ወንድዬ'],
    'ali': ['ዓሊ', 'አሊ'],
    'base': ['ባሴ'],
    'habte': ['ሀብቴ'],
    'mesfin': ['መስፍን'],
    'semay': ['ሰማይ'],
    'tsegaye': ['ፀጋዬ'],
    'laureate': ['ሎሬት'],
    'tibebe': ['ጥበበ'],
    'alemayehu': ['አለማየሁ'],
    'getahun': ['ጌታሁን'],
    'tagel': ['ታገል'],
    'mengistu': ['መንግስቱ'],
    'lemma': ['ለማ'],
    'hager': ['ሀገር', 'አገር'],
    'ethiopia': ['ኢትዮጵያ'],
    'addis': ['አዲስ'],
    'ababa': ['አበባ'],
    'enat': ['እናት'],
    'abay': ['አባይ'],
    'selam': ['ሰላም'],
};

/**
 * Augments a search string with its Amharic equivalents if available.
 * Returns an array of search strings (the original + translated versions).
 */
export function getSearchVariants(search: string): string[] {
    const variants = new Set<string>();
    const lowerSearch = search.toLowerCase().trim();
    if (!lowerSearch) return [];
    
    variants.add(lowerSearch);

    const words = lowerSearch.split(/\s+/);
    
    let allTranslated = true;
    let translatedWords: string[] = [];

    // Try a simple word-by-word translation
    for (const word of words) {
        if (amharicDictionary[word]) {
            translatedWords.push(amharicDictionary[word][0]);
        } else {
            allTranslated = false;
            break;
        }
    }

    if (allTranslated && translatedWords.length > 0) {
        variants.add(translatedWords.join(' '));
    }

    // Add partial matching: if a word is >= 2 characters, 
    // find any dictionary keys that start with (or include) that word
    words.forEach(word => {
        if (word.length >= 2) {
            for (const [engKey, amhValues] of Object.entries(amharicDictionary)) {
                if (engKey.startsWith(word)) {
                    amhValues.forEach(t => variants.add(t));
                }
            }
        }
    });

    return Array.from(variants);
}
