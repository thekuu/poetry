import { useQuery } from '@tanstack/react-query';
import { poemsApi } from '../services/api';
import { Link, useSearchParams } from 'react-router-dom';
import { MessageCircle, Sparkles, Feather } from 'lucide-react';
import DOMPurify from 'dompurify';
import { formatPoemContent } from '../utils/text';
import { useLanguage } from '../context/LanguageContext';

export default function Home() {
    const [searchParams] = useSearchParams();
    const category = searchParams.get('category') || undefined;
    const typeQuery = searchParams.get('type');
    const type = typeQuery || 'formal';
    const searchQuery = searchParams.get('q') || undefined;
    const { t, language } = useLanguage();

    const { data: poems, isLoading, error } = useQuery({
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
        return <div className="text-red-500 text-center py-12">{t('somethingWentWrong')}</div>;
    }

    let pageTitle = t('formalPoemsTitle');
    if (searchQuery) pageTitle = `${language === 'am' ? 'የፍለጋ ውጤቶች:' : 'Search Results:'} ${searchQuery}`;
    else if (type === 'prompt') pageTitle = t('conversationsTitle');
    else if (type === 'formal') pageTitle = t('formalPoemsTitle');
    else if (category) pageTitle = `${t(category)} ${t('appTitle')}`;

    return (
        <div className="space-y-12 sm:space-y-16 w-full max-w-full">
            {!category && type === 'formal' && (
                <section className="text-center py-16 sm:py-24 px-2 sm:px-4 bg-[#FAF8F5] relative border-b border-[#EAE5D9]">
                    <Feather className="w-8 h-8 mx-auto text-[#8B7355] mb-6 sm:mb-8 stroke-[1.5]" />
                    <h1 className={`text-3xl sm:text-6xl text-[#2C2C2C] mb-6 sm:mb-8 tracking-wide break-words ${language === 'am' ? 'font-amharic font-medium' : 'font-serif'}`}>{t('formalPoemsTitle')}</h1>
                    <div className="w-16 h-px bg-[#D9D1C7] mx-auto mb-6 sm:mb-8"></div>
                    <p className="text-[#8B8476] text-lg sm:text-xl max-w-lg mx-auto font-serif italic leading-relaxed">
                        {t('formalPoemsSubtitle')}
                    </p>
                </section>
            )}
            
            {!category && type === 'prompt' && (
                <section className="text-center py-16 sm:py-24 px-2 sm:px-4 bg-[#FAF8F5] relative border-b border-[#EAE5D9]">
                    <MessageCircle className="w-8 h-8 mx-auto text-[#8B7355] mb-6 sm:mb-8 stroke-[1.5]" />
                    <h1 className={`text-3xl sm:text-6xl text-[#2C2C2C] mb-6 sm:mb-8 tracking-wide break-words ${language === 'am' ? 'font-amharic font-medium' : 'font-serif'}`}>{t('conversationsTitle')}</h1>
                    <div className="w-16 h-px bg-[#D9D1C7] mx-auto mb-6 sm:mb-8"></div>
                    <p className="text-[#8B8476] text-lg sm:text-xl max-w-lg mx-auto font-serif italic leading-relaxed">
                        {t('conversationsSubtitle')}
                    </p>
                </section>
            )}

            <section className="w-full max-w-full">
                <div className="flex items-center justify-center mb-10 sm:mb-16">
                    <div className="h-px bg-[#EAE5D9] flex-1 hidden sm:block"></div>
                    <h2 className="text-lg sm:text-xl font-serif text-[#8B8476] tracking-widest uppercase sm:px-8 text-center break-words">{pageTitle}</h2>
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
                    <div className="grid gap-8 sm:gap-12 w-full max-w-full">
                        {poems?.map((poem) => (
                            <Link key={poem.id} to={`/poems/${poem.id}`} className="group block bg-white p-5 sm:p-14 rounded-2xl shadow-sm border border-[#F3F0EA] hover:shadow-md hover:border-[#EAE5D9] transition-all duration-500 relative max-w-full overflow-hidden">
                                <div className="flex flex-col items-center text-center">
                                    <h3 className="text-2xl sm:text-3xl font-serif text-[#2C2C2C] mb-4 sm:mb-6 transition-colors break-words max-w-full">{poem.title}</h3>
                                    <div className="w-12 h-px bg-[#EAE5D9] mb-6 sm:mb-10 group-hover:bg-[#8B7355] transition-colors duration-500"></div>
                                </div>
                                <div className="w-full max-w-lg mx-auto min-w-0 overflow-hidden">
                                    <div 
                                        className="poem-content text-[#5C564D] line-clamp-4 whitespace-pre-wrap leading-[2.2] mb-8 sm:mb-12 text-base sm:text-xl text-left w-full break-words min-w-0"
                                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatPoemContent(poem.content)) }}
                                    />
                                </div>
                                <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-[#A39D93] pt-6 sm:pt-8 border-t border-[#F3F0EA] gap-3 sm:gap-4">
                                    <span className="font-serif italic text-[#8B8476] text-base sm:text-lg break-words text-center sm:text-left">— {poem.authorName || t('unknownAuthorWithParen')}</span>
                                    <div className="flex items-center gap-4">
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
