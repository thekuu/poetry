import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { poemsApi, categoriesApi } from '../services/api';
import { getAuthorToken } from '../utils/auth';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function WritePoem() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { t } = useLanguage();
    
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [authorName, setAuthorName] = useState('');
    const [category, setCategory] = useState('');
    const [type, setType] = useState<'formal' | 'prompt'>('formal');

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoriesApi.getAll()
    });

    const mutation = useMutation({
        mutationFn: (newPoem: { title: string, content: string, authorName?: string, category?: string, type: 'formal' | 'prompt', authorToken: string }) => {
            return poemsApi.create(newPoem);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['poems'] });
            navigate(`/poems/${data.id}`);
        }
    });

    const isContentEmpty = !content.trim() || content === '<p><br></p>';

    const handleSubmit = (e: any) => {
        e.preventDefault();
        if (!title.trim() || isContentEmpty) return;
        
        mutation.mutate({
            title: title.trim(),
            content: content.trim(),
            authorName: authorName.trim() || undefined,
            category: category || undefined,
            type,
            authorToken: getAuthorToken()
        });
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <h1 className="text-2xl sm:text-4xl font-serif text-[#2C2C2C] mb-8 sm:mb-12 tracking-wide text-center uppercase break-words">{t('writePoem')}</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 bg-white p-5 sm:p-12 rounded-2xl shadow-sm border border-[#F3F0EA] w-full max-w-full overflow-hidden">
                <div>
                    <label htmlFor="title" className="block text-xs font-semibold tracking-wider uppercase text-[#8B8476] mb-3">{t('title')}</label>
                    <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-6 py-4 bg-[#FAF8F5] border border-[#EAE5D9] rounded-xl focus:outline-none focus:border-[#8B7355] focus:ring-1 focus:ring-[#8B7355] transition-all text-xl font-serif text-[#2C2C2C]"
                        required
                    />
                </div>
                
                <div>
                    <label className="block text-xs font-semibold tracking-wider uppercase text-[#8B8476] mb-3">{t('poemContent')}</label>
                    <div className="bg-[#FAF8F5] border border-[#EAE5D9] rounded-xl overflow-hidden focus-within:border-[#8B7355] focus-within:ring-1 focus-within:ring-[#8B7355] transition-all">
                        <ReactQuill
                            theme="snow"
                            value={content}
                            onChange={setContent}
                            placeholder={t('poemContentPlaceholder')}
                            className="poem-editor text-lg text-[#5C564D] leading-[2.2]"
                        />
                    </div>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-8">
                    <div>
                        <label className="block text-xs font-semibold tracking-wider uppercase text-[#8B8476] mb-3">{t('categories')}</label>
                        <div className="flex flex-col gap-3">
                            <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE5D9] hover:border-[#8B7355] transition-all">
                                <input
                                    type="radio"
                                    checked={type === 'formal'}
                                    onChange={() => setType('formal')}
                                    className="accent-[#8B7355] w-4 h-4"
                                />
                                <span className="text-[#5C564D] font-medium">{t('formalPoemType')}</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE5D9] hover:border-[#8B7355] transition-all">
                                <input
                                    type="radio"
                                    checked={type === 'prompt'}
                                    onChange={() => setType('prompt')}
                                    className="accent-[#8B7355] w-4 h-4"
                                />
                                <span className="text-[#5C564D] font-medium">{t('conversationalPoemType')}</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-8 pt-8 border-t border-[#F3F0EA]">
                    {!user && (
                        <div>
                            <label htmlFor="authorName" className="block text-xs font-semibold tracking-wider uppercase text-[#8B8476] mb-3">{t('name')}</label>
                            <input
                                id="authorName"
                                type="text"
                                value={authorName}
                                onChange={(e) => setAuthorName(e.target.value)}
                                placeholder={t('namePlaceholder')}
                                className="w-full px-5 py-3.5 bg-[#FAF8F5] border border-[#EAE5D9] rounded-xl focus:outline-none focus:border-[#8B7355] focus:ring-1 focus:ring-[#8B7355] transition-all"
                            />
                        </div>
                    )}
                    <div>
                        <label htmlFor="category" className="block text-xs font-semibold tracking-wider uppercase text-[#8B8476] mb-3">{t('categoryLabel')}</label>
                        <select
                            id="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-5 py-3.5 bg-[#FAF8F5] border border-[#EAE5D9] rounded-xl focus:outline-none focus:border-[#8B7355] focus:ring-1 focus:ring-[#8B7355] transition-all appearance-none text-[#5C564D]"
                        >
                            <option value="">{t('selectCategory')}</option>
                            {categories?.map(c => (
                                <option key={c} value={c}>{t(c)}</option>
                            ))}
                        </select>
                    </div>
                </div>
                
                <div className="pt-8">
                    <button
                        type="submit"
                        disabled={mutation.isPending || !title.trim() || isContentEmpty}
                        className="w-full px-8 py-4 bg-[#2C2C2C] text-white rounded-full font-medium tracking-wide hover:bg-[#8B7355] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {mutation.isPending ? t('publishing') : t('publish')}
                    </button>
                </div>
            </form>
        </div>
    );
}
