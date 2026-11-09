import { useQuery } from '@tanstack/react-query';
import { poemsApi } from '../services/api';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { MessageCircle, Sparkles, Feather, AlertCircle, RotateCcw, BookOpen, X } from 'lucide-react';
import DOMPurify from 'dompurify';
import { formatPoemContent } from '../utils/text';
import { useLanguage } from '../context/LanguageContext';
import { CATEGORIES } from '../utils/constants';

export default function Home() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const category = searchParams.get('category') || undefined;
    const typeQuery = searchParams.get('type');
    const type = typeQuery || 'formal';
    const searchQuery = searchParams.get('q') || undefined;
    const { t, language } = useLanguage();

    const setFilter = (newType?: string, newCategory?: string) => {
        const params = new URLSearchParams();
        if (searchQuery) params.set('q', searchQuery);
        const resolvedType = newType !== undefined ? newType : (typeQuery || '');
        if (resolvedType && resolvedType !== 'formal') {
            params.set('type', resolvedType);
        }
        const resolvedCat = newCategory !== undefined ? newCategory : (category || '');
        if (resolvedCat) {
            params.set('category', resolvedCat);
        }
        const queryStr = params.toString();
        navigate(queryStr ? `/?${queryStr}` : '/');
    };

    const { data: poems, isLoading, error, refetch } = useQuery({
        queryKey: ['poems', category, type, searchQuery],
        queryFn: () => poemsApi.getAll(category, searchQuery, type)
    });

    if (isLoading) {
        return <div className="animate-pulse space-y-8">
            {[1, 2, 3].map(i => (
                <div key={i} className="bg-white/50 p-6 rounded-2xl border border-[#E5E1D8]">
                    <div className="h-6 bg-[#E5E1D8] rounded w-1/3 mb-4"></div>
                    <div className="h-4 bg-[#E5E1D8] rounded w-full mb-2"></div>
                    <div className="h-4 bg-[#E5E1D8] rounded w-2/3"></div>
                </div>
            ))}
        </div>;
    }

    if (error) {
        const errorMessage = (error as Error)?.message || String(error);
        const isDbError = errorMessage.toLowerCase().includes('database') || errorMessage.toLowerCase().includes('not configured');
        const is404 = errorMessage.includes('404');
        const is500 = errorMessage.includes('500');
        return (
            <div className="py-16 px-4 max-w-lg mx-auto text-center space-y-5">
                <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
                    <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-medium text-[#2C2C2C] mb-1">{t('somethingWentWrong')}</h2>
                    <p className="text-sm text-[#8B8476]">
                        {language === 'am' ? 'ግጥሞችን ማምጣት አልተቻለም' : 'Unable to load poems at this moment'}
                    </p>
                </div>
                <div className="bg-[#FAF8F5] border border-[#EAE5D9] rounded-xl p-4 text-xs font-mono text-left space-y-1">
                    <p className="font-semibold text-rose-700">
                        {is404 
                            ? (language === 'am' ? 'የሰርቨር ኤፒአይ አልተገኘም (404 Not Found)' : 'Server Route Not Found (404)')
                            : isDbError 
                            ? (language === 'am' ? 'የዳታቤዝ ግንኙነት (Database Connection)' : 'Database Not Configured')
                            : is500
                            ? (language === 'am' ? 'የሰርቨር ስህተት (500 Internal Error)' : 'Server Error (500)')
                            : (language === 'am' ? 'የስህተት ዝርዝር (Error Detail)' : 'Error Detail')}
                    </p>
                    <p className="text-[#5C5955] break-words">{errorMessage}</p>
                </div>
                {(isDbError || is500) && (
                    <p className="text-xs text-[#8B8476] leading-relaxed bg-amber-50/70 border border-amber-200/60 p-3 rounded-lg text-left">
                        {language === 'am'
                            ? 'ማሳሰቢያ፡ በVercel Settings > Environment Variables ላይ DATABASE_URL በትክክል መሞላቱን ያረጋግጡ።'
                            : 'Note: If deployed on Vercel, make sure DATABASE_URL is added to Vercel Project Settings > Environment Variables. Also push the latest compiled api/index.js.'}
                    </p>
                )}
                {is404 && (
                    <p className="text-xs text-[#8B8476] leading-relaxed bg-blue-50/70 border border-blue-200/60 p-3 rounded-lg text-left">
                        {language === 'am'
                            ? 'ማሳሰቢያ፡ በVercel ላይ ከተጠቀሙ አዲሱን ኮድ (vercel.json እና api/) ወደ ጊትሃብ ፑሽ አድርገው በድጋሚ ይላኩ።'
                            : 'Note: If deployed on Vercel, push the latest changes (including vercel.json and api/) to your repository so Vercel provisions the API serverless function.'}
                    </p>
                )}
                <div className="pt-2">
                    <button
                        onClick={() => refetch()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8B7355] text-white text-sm font-medium rounded-xl hover:bg-[#6F5B43] active:scale-95 transition-all shadow-xs"
                    >
                        <RotateCcw className="w-4 h-4" />
                        {language === 'am' ? 'እንደገና ሞክር' : 'Retry'}
                    </button>
                </div>
            </div>
        );
    }

    let pageTitle = t('formalPoemsTitle');
    if (searchQuery) pageTitle = `${language === 'am' ? 'የፍለጋ ውጤቶች:' : 'Search Results:'} ${searchQuery}`;
    else if (type === 'prompt') pageTitle = t('conversationsTitle');
    else if (type === 'formal') pageTitle = t('formalPoemsTitle');
    else if (category) pageTitle = `${t(category)} ${t('appTitle')}`;

    return (
        <div className="space-y-12 sm:space-y-16">
            {!category && type === 'formal' && (
                <section className="text-center py-16 sm:py-24 px-4 bg-[#FAF8F5] relative border-b border-[#EAE5D9]">
                    <Feather className="w-8 h-8 mx-auto text-[#8B7355] mb-6 sm:mb-8 stroke-[1.5]" />
                    <h1 className={`text-3xl sm:text-6xl text-[#2C2C2C] mb-6 sm:mb-8 tracking-wide break-words ${language === 'am' ? 'font-amharic font-medium' : 'font-serif'}`}>{t('formalPoemsTitle')}</h1>
                    <div className="w-16 h-px bg-[#D9D1C7] mx-auto mb-6 sm:mb-8"></div>
                    <p className="text-[#8B8476] text-lg sm:text-xl max-w-lg mx-auto font-serif italic leading-relaxed">
                        {t('formalPoemsSubtitle')}
                    </p>
                </section>
            )}
            
            {!category && type === 'prompt' && (
                <section className="text-center py-16 sm:py-24 px-4 bg-[#FAF8F5] relative border-b border-[#EAE5D9]">
                    <MessageCircle className="w-8 h-8 mx-auto text-[#8B7355] mb-6 sm:mb-8 stroke-[1.5]" />
                    <h1 className={`text-3xl sm:text-6xl text-[#2C2C2C] mb-6 sm:mb-8 tracking-wide break-words ${language === 'am' ? 'font-amharic font-medium' : 'font-serif'}`}>{t('conversationsTitle')}</h1>
                    <div className="w-16 h-px bg-[#D9D1C7] mx-auto mb-6 sm:mb-8"></div>
                    <p className="text-[#8B8476] text-lg sm:text-xl max-w-lg mx-auto font-serif italic leading-relaxed">
                        {t('conversationsSubtitle')}
                    </p>
                </section>
            )}

            {/* Interactive Filter and Category Navigation Bar */}
            <div className="space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#EAE5D9] pb-4">
                    {/* Type Switcher Tabs */}
                    <div className="flex items-center gap-1 p-1 bg-white border border-[#EAE5D9] rounded-xl self-start shadow-2xs">
                        <button
                            type="button"
                            onClick={() => setFilter('formal', category)}
                            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${type === 'formal' ? 'bg-[#8B7355] text-white shadow-xs' : 'text-[#5C564D] hover:text-[#2C2C2C] hover:bg-[#FAF8F5]'}`}
                        >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>{t('formalPoemsTitle')}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilter('prompt', category)}
                            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${type === 'prompt' ? 'bg-[#8B7355] text-white shadow-xs' : 'text-[#5C564D] hover:text-[#2C2C2C] hover:bg-[#FAF8F5]'}`}
                        >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>{t('poemConversations')}</span>
                        </button>
                    </div>

                    {/* Active Filter Clear Control */}
                    {(category || searchQuery) && (
                        <div className="flex items-center gap-2 text-xs text-[#8B8476] self-start sm:self-auto bg-white/60 px-3 py-1.5 rounded-lg border border-[#EAE5D9]">
                            <span>
                                {language === 'am' ? 'የተጣራው በ:' : 'Filtered by:'} <strong className="text-[#2C2C2C]">{category ? t(category) : ''} {searchQuery ? `"${searchQuery}"` : ''}</strong>
                            </span>
                            <button
                                type="button"
                                onClick={() => setFilter(type, '')}
                                className="inline-flex items-center gap-1 text-xs text-[#8B7355] hover:text-[#6F5B43] hover:underline font-medium ml-1"
                            >
                                <X className="w-3.5 h-3.5" />
                                {language === 'am' ? 'አጽዳ' : 'Clear'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Horizontal Scrollable Categories Bar */}
                <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                    <button
                        type="button"
                        onClick={() => setFilter(type, '')}
                        className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${!category ? 'bg-[#2C2C2C] text-white shadow-xs' : 'bg-white border border-[#EAE5D9] text-[#5C564D] hover:bg-[#F3F0EA]'}`}
                    >
                        {language === 'am' ? 'ሁሉም' : 'All'}
                    </button>
                    {CATEGORIES.map(c => {
                        const isSelected = category === c;
                        return (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setFilter(type, isSelected ? '' : c)}
                                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${isSelected ? 'bg-[#8B7355] text-white shadow-xs' : 'bg-white border border-[#EAE5D9] text-[#5C564D] hover:bg-[#F3F0EA]'}`}
                            >
                                {t(c)}
                            </button>
                        );
                    })}
                </div>
            </div>

            <section>
                <div className="flex items-center justify-center mb-8 sm:mb-12">
                    <div className="h-px bg-[#EAE5D9] flex-1 hidden sm:block"></div>
                    <h2 className="text-base sm:text-xl font-serif text-[#8B8476] tracking-widest uppercase sm:px-8 text-center break-words">{pageTitle}</h2>
                    <div className="h-px bg-[#EAE5D9] flex-1 hidden sm:block"></div>
                </div>
                
                {poems?.length === 0 ? (
                    <div className="text-center py-16 sm:py-24 bg-[#FAF8F5] rounded-xl border border-[#EAE5D9] px-4">
                        <p className="text-[#8B8476] mb-8 font-serif italic text-lg sm:text-xl">{t('noPoemsFound')}</p>
                        <Link to="/write" className="inline-flex items-center gap-2 bg-transparent text-[#2C2C2C] px-8 py-3 rounded-full font-medium hover:bg-[#F3F0EA] transition-all border border-[#EAE5D9] text-sm">
                            <Feather className="w-4 h-4 text-[#8B7355]" />
                            {t('writePoem')}
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-8 sm:gap-12">
                        {poems?.map((poem) => (
                            <Link key={poem.id} to={`/poems/${poem.id}`} className="group block bg-white p-6 sm:p-14 rounded-2xl shadow-sm border border-[#F3F0EA] hover:shadow-md hover:border-[#EAE5D9] transition-all duration-500 relative">
                                <div className="flex flex-col items-center text-center">
                                    <h3 className="text-2xl sm:text-3xl font-serif text-[#2C2C2C] mb-4 sm:mb-6 transition-colors break-words">{poem.title}</h3>
                                    <div className="w-12 h-px bg-[#EAE5D9] mb-6 sm:mb-10 group-hover:bg-[#8B7355] transition-colors duration-500"></div>
                                </div>
                                <div className="max-w-lg mx-auto">
                                    <div 
                                        className="poem-content text-[#5C564D] line-clamp-4 whitespace-pre-wrap leading-[2.2] mb-8 sm:mb-12 text-base sm:text-xl text-left break-words"
                                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatPoemContent(poem.content)) }}
                                    />
                                </div>
                                <div className="flex items-center justify-between text-sm text-[#A39D93] pt-6 sm:pt-8 border-t border-[#F3F0EA] gap-4">
                                    <span className="font-serif italic text-[#8B8476] text-base sm:text-lg break-words">— {poem.authorName || t('unknownAuthorWithParen')}</span>
                                    <div className="flex items-center gap-4 shrink-0">
                                        {poem.type === 'prompt' && (
                                            <div className="flex items-center gap-2 text-[#8B8476] transition-colors">
                                                <MessageCircle className="w-4 h-4" />
                                                <span className="font-medium">{poem.replyCount || 0}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
