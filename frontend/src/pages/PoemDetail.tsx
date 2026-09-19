import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import DOMPurify from 'dompurify';
import { formatPoemContent } from '../utils/text';
import { poemsApi, repliesApi } from '../services/api';
import { getAuthorToken } from '../utils/auth';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ArrowDown, MessageCircle, PenLine, Trash2, Feather, Sparkles, ExternalLink, ArrowLeft, Pencil, X, Save } from 'lucide-react';

export default function PoemDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const authorToken = getAuthorToken();
    const { user } = useAuth();
    const { t, language } = useLanguage();

    const [replyContent, setReplyContent] = useState('');
    const [replyAuthor, setReplyAuthor] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState('');
    const [editTitle, setEditTitle] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteReplyTargetId, setDeleteReplyTargetId] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const { data: poem, isLoading: isLoadingPoem, error: poemError } = useQuery({
        queryKey: ['poem', id],
        queryFn: () => poemsApi.getById(id!),
        enabled: !!id
    });

    const { data: replies, isLoading: isLoadingReplies } = useQuery({
        queryKey: ['replies', id],
        queryFn: () => repliesApi.getByPoemId(id!),
        enabled: !!id
    });

    const { data: relatedPoems } = useQuery({
        queryKey: ['poems', 'related', poem?.type, poem?.type === 'formal' ? poem?.category : 'all'],
        queryFn: () => {
            if (poem?.type === 'prompt') {
                return poemsApi.getAll(undefined, undefined, 'prompt');
            }
            return poemsApi.getAll(poem?.category, undefined, 'formal');
        },
        enabled: !!poem
    });

    const filteredRelatedPoems = relatedPoems?.filter(p => p.id !== id);

    const canManagePoem = Boolean(user?.role === 'admin' || (poem as any)?.canManage);

    const deletePoemMutation = useMutation({
        mutationFn: () => poemsApi.delete(id!, authorToken),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['poems'] });
            setShowDeleteModal(false);
            navigate('/');
        },
        onError: (err: any) => {
            setDeleteError(err?.message || 'Failed to delete poem');
        }
    });

    const updatePoemMutation = useMutation({
        mutationFn: (data: { title: string, content: string }) => poemsApi.update(id!, { ...data, authorToken }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['poem', id] });
            queryClient.invalidateQueries({ queryKey: ['poems'] });
            setIsEditing(false);
        }
    });

    const deleteReplyMutation = useMutation({
        mutationFn: (replyId: string) => repliesApi.delete(replyId, authorToken),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['replies', id] });
            queryClient.invalidateQueries({ queryKey: ['poems'] });
            setDeleteReplyTargetId(null);
        },
        onError: (err: any) => {
            setDeleteError(err?.message || 'Failed to delete reply');
        }
    });

    const replyMutation = useMutation({
        mutationFn: (newReply: { content: string, authorName?: string, authorToken: string }) => {
            return repliesApi.create(id!, newReply);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['replies', id] });
            queryClient.invalidateQueries({ queryKey: ['poems'] });
            setReplyContent('');
            setReplyAuthor('');
        }
    });

    if (isLoadingPoem) {
        return <div className="animate-pulse space-y-8">
            <div className="bg-white p-8 rounded-3xl border border-[#E5E1D8]">
                <div className="h-8 bg-[#E5E1D8] rounded w-1/2 mx-auto mb-8"></div>
                <div className="space-y-4 max-w-md mx-auto">
                    <div className="h-4 bg-[#E5E1D8] rounded w-full"></div>
                    <div className="h-4 bg-[#E5E1D8] rounded w-5/6"></div>
                    <div className="h-4 bg-[#E5E1D8] rounded w-4/6"></div>
                </div>
            </div>
        </div>;
    }

    if (poemError || !poem) {
        return <div className="text-center py-20 text-[#5C5955]">{t('noPoemsFound')}</div>;
    }

    const isReplyEmpty = !replyContent.trim() || replyContent === '<p><br></p>';

    const handleSubmitReply = (e: any) => {
        e.preventDefault();
        if (isReplyEmpty) return;
        replyMutation.mutate({
            content: replyContent.trim(),
            authorName: replyAuthor.trim() || undefined,
            authorToken: getAuthorToken()
        });
    };

    return (
        <div className="space-y-12 sm:space-y-16">
            <article className="bg-white p-6 sm:p-16 rounded-2xl shadow-sm border border-[#F3F0EA] relative">
                {/* Original Poem */}
                {isEditing ? (
                    <div className="mb-16">
                        <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full text-center text-2xl sm:text-5xl font-serif text-[#2C2C2C] tracking-wide mb-8 bg-transparent border-b border-[#D9D1C7] focus:outline-none focus:border-[#8B7355] px-2 py-1 break-words"
                            placeholder="Poem Title"
                        />
                        <div className="bg-[#FAF8F5] border border-[#EAE5D9] rounded-xl overflow-hidden focus-within:border-[#8B7355] focus-within:ring-1 focus-within:ring-[#8B7355] transition-all mb-6">
                            {(poem.content?.includes('<p>') || poem.content?.includes('<br>')) ? (
                                <ReactQuill
                                    theme="snow"
                                    value={editContent}
                                    onChange={setEditContent}
                                    className="poem-editor text-lg sm:text-xl text-[#5C564D] leading-[2.2]"
                                />
                            ) : (
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    rows={12}
                                    className="w-full bg-transparent px-4 sm:px-6 py-4 text-lg sm:text-xl text-[#5C564D] leading-[2.2] focus:outline-none resize-y whitespace-pre-wrap break-words"
                                />
                            )}
                        </div>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-6 py-2 rounded-full border border-[#EAE5D9] text-[#5C564D] hover:bg-[#F3F0EA] transition-colors flex items-center gap-2"
                            >
                                <X className="w-4 h-4" /> Cancel
                            </button>
                            <button
                                onClick={() => updatePoemMutation.mutate({ title: editTitle, content: editContent })}
                                disabled={updatePoemMutation.isPending}
                                className="px-6 py-2 bg-[#2C2C2C] text-white rounded-full hover:bg-[#8B7355] transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" /> Save Changes
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center mb-12 sm:mb-16 flex flex-col items-center">
                        <Feather className="w-5 h-5 text-[#8B7355] mb-6 sm:mb-8 stroke-[1.5]" />
                        <h1 className="text-2xl sm:text-5xl font-serif text-[#2C2C2C] tracking-wide mb-6 sm:mb-8 break-words max-w-full px-2">{poem.title}</h1>
                        <div className="w-12 h-px bg-[#D9D1C7]"></div>
                    </div>
                )}
                
                {!isEditing && (
                    <div className="w-full max-w-lg mx-auto min-w-0 mb-4 relative group">
                    {poem.type === 'prompt' ? (
                        <div className="w-full min-w-0 overflow-hidden">
                            <div 
                                className="poem-content text-lg sm:text-2xl leading-[2.2] whitespace-pre-wrap text-[#5C564D] text-left break-words w-full max-w-full min-w-0 overflow-hidden"
                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatPoemContent(poem.content)) }}
                            />
                            
                            <div className="mt-4 flex flex-row items-center justify-end gap-3 flex-wrap">
                                <p className="font-serif italic text-[#8B8476] text-sm sm:text-base break-words">— {poem.authorName || t('unknownAuthorWithParen')}</p>
                                <div className="flex items-center justify-end gap-3">
                                    <p className="text-[10px] text-[#A39D93] font-sans tracking-widest uppercase">{new Date(poem.createdAt).toLocaleDateString(language === 'am' ? 'am-ET' : 'en-US')}</p>
                                    {poem.sourceUrl && (
                                        <a href={poem.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-[#8B8476] hover:text-[#8B7355] transition-colors uppercase tracking-widest">
                                            <ExternalLink className="w-3 h-3" />
                                            {language === 'am' ? 'ምንጭ' : 'Source'}
                                        </a>
                                    )}
                                    {canManagePoem && (
                                        <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex gap-2 ml-4">
                                            <button 
                                                onClick={() => {
                                                    setEditTitle(poem.title);
                                                    setEditContent(poem.content);
                                                    setIsEditing(true);
                                                }}
                                                className="p-1.5 text-[#A39D93] hover:text-[#8B7355] hover:bg-[#F3F0EA] rounded-full transition-colors inline-flex border border-transparent"
                                                title="Edit Poem"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    setDeleteError(null);
                                                    setShowDeleteModal(true);
                                                }}
                                                className="p-1.5 text-[#A39D93] hover:text-red-600 hover:bg-red-50 rounded-full transition-colors inline-flex border border-transparent"
                                                title={t('delete')}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full min-w-0 overflow-hidden">
                            <div 
                                className="poem-content text-lg sm:text-2xl leading-[2.2] whitespace-pre-wrap text-[#5C564D] text-left break-words w-full max-w-full min-w-0 overflow-hidden"
                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatPoemContent(poem.content)) }}
                            />
                            
                            <div className="mt-12 sm:mt-16 pt-8 border-t border-[#F3F0EA] flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                                <div>
                                    <p className="font-serif italic text-[#8B8476] text-lg sm:text-xl break-words">— {poem.authorName || t('unknownAuthorWithParen')}</p>
                                    <p className="text-xs text-[#A39D93] mt-3 font-sans tracking-widest uppercase">{new Date(poem.createdAt).toLocaleDateString(language === 'am' ? 'am-ET' : 'en-US')}</p>
                                    
                                    {poem.sourceUrl && (
                                        <a href={poem.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-[#8B8476] hover:text-[#8B7355] transition-colors mt-6 border border-[#EAE5D9] px-4 py-2 rounded-full font-medium tracking-wide">
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            {language === 'am' ? 'ምንጭ' : 'Source'}
                                        </a>
                                    )}
                                </div>
                                
                                {/* Admin / Author actions */}
                                {canManagePoem && (
                                    <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex gap-2">
                                        <button 
                                            onClick={() => {
                                                setEditTitle(poem.title);
                                                setEditContent(poem.content);
                                                setIsEditing(true);
                                            }}
                                            className="p-2 text-[#A39D93] hover:text-[#8B7355] hover:bg-[#F3F0EA] rounded-full transition-colors inline-flex border border-transparent"
                                            title="Edit Poem"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setDeleteError(null);
                                                setShowDeleteModal(true);
                                            }}
                                            className="p-2 text-[#A39D93] hover:text-red-600 hover:bg-red-50 rounded-full transition-colors inline-flex border border-transparent"
                                            title={t('delete')}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                )}

                {/* Conversation Thread / Replies - Only show for prompt type */}
                {poem.type === 'prompt' && replies && replies.length > 0 && (
                    <div className="mt-4 pt-4 flex flex-col w-full relative before:absolute before:left-1/2 before:top-0 before:-translate-x-1/2 before:w-px before:h-4 before:bg-[#EAE5D9]">
                        <div className="space-y-6 w-full max-w-full">
                            {replies.map((reply) => (
                                <div key={reply.id} className="w-full max-w-lg mx-auto min-w-0 relative group">
                                    <div className="w-full min-w-0 overflow-hidden">
                                        <div 
                                            className="poem-content text-base sm:text-2xl leading-[2.2] whitespace-pre-wrap text-[#5C564D] text-left break-words w-full max-w-full min-w-0 overflow-hidden"
                                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatPoemContent(reply.content)) }}
                                        />
                                        
                                        <div className="mt-2 flex flex-row items-center justify-end gap-3 flex-wrap">
                                            <p className="font-serif italic text-[#8B8476] text-sm sm:text-base break-words">— {reply.authorName || t('unknownAuthor')}</p>
                                            <p className="text-[10px] text-[#A39D93] font-sans tracking-widest uppercase">{new Date(reply.createdAt).toLocaleDateString(language === 'am' ? 'am-ET' : 'en-US')}</p>
                                            {(user?.role === 'admin' || (reply as any)?.canManage) && (
                                                <button
                                                    onClick={() => {
                                                        setDeleteError(null);
                                                        setDeleteReplyTargetId(reply.id);
                                                    }}
                                                    className="p-1.5 text-[#A39D93] hover:text-red-600 hover:bg-red-50 rounded-full transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                                    title={t('delete')}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Reply Form - Only show for prompt type */}
                {poem.type === 'prompt' && (
                    <div className="mt-10 sm:mt-12 pt-10 sm:pt-12 flex flex-col items-center relative border-t border-[#EAE5D9] w-full max-w-full">
                        <div className="absolute -top-8 h-8 w-px bg-[#EAE5D9]"></div>
                        <div className="absolute -top-4 bg-white px-4 text-[#8B7355]">
                            <Feather className="w-5 h-5 stroke-[1.5]" />
                        </div>
                        <form onSubmit={handleSubmitReply} className="w-full max-w-lg space-y-6">
                            <div className="bg-[#FAF8F5] border border-[#EAE5D9] rounded-xl overflow-hidden focus-within:border-[#8B7355] focus-within:ring-1 focus-within:ring-[#8B7355] transition-all">
                                <ReactQuill
                                    theme="snow"
                                    value={replyContent}
                                    onChange={setReplyContent}
                                    placeholder={t('continuePoem')}
                                    className="poem-editor text-base sm:text-xl text-[#5C564D] leading-[2.2]"
                                />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center w-full">
                                {!user && (
                                    <input
                                        type="text"
                                        value={replyAuthor}
                                        onChange={(e) => setReplyAuthor(e.target.value)}
                                        placeholder={t('namePlaceholder')}
                                        className="w-full sm:flex-1 px-5 py-3.5 bg-[#FAF8F5] border border-[#EAE5D9] rounded-full focus:outline-none focus:border-[#8B7355] focus:ring-1 focus:ring-[#8B7355] transition-all text-[#5C564D] placeholder:text-[#A39D93]"
                                    />
                                )}
                                <button
                                    type="submit"
                                    disabled={replyMutation.isPending || isReplyEmpty}
                                    className="w-full sm:w-auto px-8 py-3.5 bg-[#2C2C2C] text-white rounded-full font-medium hover:bg-[#8B7355] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 whitespace-nowrap"
                                >
                                    <PenLine className="w-4 h-4" />
                                    <span>{replyMutation.isPending ? t('sending') : t('sendReply')}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </article>

            {/* Back Button and Related Poems */}
            <div className="mt-12 flex flex-col gap-12">
                <div>
                    <button 
                        onClick={() => navigate(-1)} 
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-[#EAE5D9] rounded-full text-[#5C564D] hover:text-[#2C2C2C] hover:border-[#8B7355] hover:bg-[#FAF8F5] transition-all font-medium text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                </div>

                {filteredRelatedPoems && filteredRelatedPoems.length > 0 && (
                    <div className="bg-white p-8 rounded-2xl border border-[#EAE5D9]">
                        <h3 className="text-xl font-serif text-[#2C2C2C] mb-6">
                            {poem.type === 'prompt' 
                                ? (language === 'am' ? 'ተጨማሪ ውይይቶች' : 'More Conversations')
                                : `More in ${poem.category}`}
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-6">
                            {filteredRelatedPoems.map(related => (
                                <Link 
                                    key={related.id} 
                                    to={`/poems/${related.id}`}
                                    className="p-5 rounded-xl border border-[#F3F0EA] hover:border-[#8B7355] bg-[#FAF8F5] transition-colors group"
                                >
                                    <h4 className="font-serif text-[#2C2C2C] text-lg mb-2 group-hover:text-[#8B7355] transition-colors line-clamp-1">{related.title}</h4>
                                    <p className="text-sm text-[#A39D93] font-serif italic line-clamp-1">— {related.authorName || t('unknownAuthor')}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Poem Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#EAE5D9] space-y-4 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center gap-3 text-red-600">
                            <div className="p-2.5 bg-red-50 rounded-full">
                                <Trash2 className="w-5 h-5 text-red-600" />
                            </div>
                            <h3 className="font-serif text-xl text-[#2C2C2C] font-semibold">
                                {language === 'am' ? 'ግጥሙን ሰርዝ' : 'Delete Poem'}
                            </h3>
                        </div>
                        
                        <p className="text-sm text-[#5C564D] leading-relaxed">
                            {language === 'am' 
                                ? 'ይህን ግጥም በእርግጥ መሰረዝ ይፈልጋሉ? ይህ ድርጊት አይመለስም።' 
                                : 'Are you sure you want to delete this poem? This action cannot be undone.'}
                        </p>

                        {deleteError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                                {deleteError}
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setDeleteError(null);
                                }}
                                disabled={deletePoemMutation.isPending}
                                className="px-4 py-2 text-sm font-medium text-[#8B8476] hover:text-[#2C2C2C] hover:bg-[#F3F0EA] rounded-xl transition-colors"
                            >
                                {language === 'am' ? 'ተመለስ' : 'Cancel'}
                            </button>
                            <button
                                type="button"
                                onClick={() => deletePoemMutation.mutate()}
                                disabled={deletePoemMutation.isPending}
                                className="px-5 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors inline-flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                            >
                                {deletePoemMutation.isPending ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        {language === 'am' ? 'በመሰረዝ ላይ...' : 'Deleting...'}
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        {language === 'am' ? 'ሰርዝ' : 'Delete'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reply Delete Confirmation Modal */}
            {deleteReplyTargetId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#EAE5D9] space-y-4 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center gap-3 text-red-600">
                            <div className="p-2.5 bg-red-50 rounded-full">
                                <Trash2 className="w-5 h-5 text-red-600" />
                            </div>
                            <h3 className="font-serif text-xl text-[#2C2C2C] font-semibold">
                                {language === 'am' ? 'ምላሹን ሰርዝ' : 'Delete Reply'}
                            </h3>
                        </div>
                        
                        <p className="text-sm text-[#5C564D] leading-relaxed">
                            {language === 'am' 
                                ? 'ይህን ምላሽ በእርግጥ መሰረዝ ይፈልጋሉ?' 
                                : 'Are you sure you want to delete this reply?'}
                        </p>

                        {deleteError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                                {deleteError}
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setDeleteReplyTargetId(null);
                                    setDeleteError(null);
                                }}
                                disabled={deleteReplyMutation.isPending}
                                className="px-4 py-2 text-sm font-medium text-[#8B8476] hover:text-[#2C2C2C] hover:bg-[#F3F0EA] rounded-xl transition-colors"
                            >
                                {language === 'am' ? 'ተመለስ' : 'Cancel'}
                            </button>
                            <button
                                type="button"
                                onClick={() => deleteReplyMutation.mutate(deleteReplyTargetId)}
                                disabled={deleteReplyMutation.isPending}
                                className="px-5 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors inline-flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                            >
                                {deleteReplyMutation.isPending ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        {language === 'am' ? 'በመሰረዝ ላይ...' : 'Deleting...'}
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        {language === 'am' ? 'ሰርዝ' : 'Delete'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
