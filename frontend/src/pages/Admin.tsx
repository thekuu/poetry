import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { poemsApi, adminApi, categoriesApi } from '../services/api';
import { getAuthorToken } from '../utils/auth';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Download, Sparkles, Trash2, Send, X, UserPlus, Shield, Users, LayoutDashboard, Settings } from 'lucide-react';

type DraftPoem = {
    id: string;
    title: string;
    content: string;
    authorName: string;
    category: string;
    sourceUrl: string;
};

export default function Admin() {
    const queryClient = useQueryClient();
    const { user, isLoading } = useAuth();
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState<'content' | 'users' | 'settings'>('content');

    const [scrapeUrl, setScrapeUrl] = useState('');
    const [drafts, setDrafts] = useState<DraftPoem[]>([]);
    
    // Auth redirect
    useEffect(() => {
        if (!isLoading && (!user || user.role !== 'admin')) {
            navigate('/admin-login');
        }
    }, [user, isLoading, navigate]);

    // Queries
    const { data: recentChannels } = useQuery({
        queryKey: ['adminChannels'],
        queryFn: () => adminApi.getChannels(),
        enabled: !!user && user.role === 'admin' && activeTab === 'content'
    });

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoriesApi.getAll(),
        enabled: activeTab === 'content'
    });

    const { data: usersList } = useQuery({
        queryKey: ['adminUsers'],
        queryFn: () => adminApi.getUsers(),
        enabled: !!user && user.role === 'admin' && activeTab === 'users'
    });

    // Mutations - Content
    const scrapeMutation = useMutation({
        mutationFn: () => adminApi.scrapeTelegram(scrapeUrl),
        onSuccess: (data) => {
            const newDrafts = data.map((d: any) => ({
                id: Math.random().toString(36).substring(2, 9),
                title: d.title || '',
                content: d.content || '',
                authorName: d.authorName || '',
                category: d.category || '',
                sourceUrl: scrapeUrl
            }));
            setDrafts((prev: DraftPoem[]) => [...newDrafts, ...prev]);
            setScrapeUrl('');
        },
        onError: (err: any) => {
            alert("Scrape failed: " + err.message);
        }
    });

    const publishMutation = useMutation({
        mutationFn: (poemData: any) => poemsApi.create(poemData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['poems'] });
        }
    });

    const deleteChannelMutation = useMutation({
        mutationFn: (id: string) => adminApi.deleteChannel(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminChannels'] });
        }
    });

    // Mutations - Users
    const updateUserRoleMutation = useMutation({
        mutationFn: ({ id, role }: { id: string, role: string }) => adminApi.updateUserRole(id, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
        },
        onError: (err: any) => {
            alert("Failed to update role: " + err.message);
        }
    });

    const [newAdminUsername, setNewAdminUsername] = useState('');
    const [newAdminPassword, setNewAdminPassword] = useState('');
    const createAdminMutation = useMutation({
        mutationFn: (data: any) => adminApi.createAdmin(data),
        onSuccess: () => {
            alert('Admin created successfully!');
            setNewAdminUsername('');
            setNewAdminPassword('');
            queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
        },
        onError: (err: any) => {
            alert('Failed to create admin: ' + (err.message || 'Unknown error'));
        }
    });

    // Handlers
    const handleScrape = (e: any) => {
        e.preventDefault();
        if (!scrapeUrl) return;
        scrapeMutation.mutate();
    };

    const updateDraft = (id: string, field: keyof DraftPoem, value: string) => {
        setDrafts(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
    };

    const removeDraft = (id: string) => {
        setDrafts(prev => prev.filter(d => d.id !== id));
    };

    const handlePublishDraft = (draftId: string) => {
        const draft = drafts.find(d => d.id === draftId);
        if (!draft) return;
        
        if (!draft.title.trim() || !draft.content.trim()) {
            alert('ርዕስ እና ግጥም ማካተት ግዴታ ነው (Title and content are required)');
            return;
        }
        
        publishMutation.mutate({
            title: draft.title.trim(),
            content: draft.content.trim(),
            authorName: draft.authorName.trim() || 'ያልታወቀ (Anonymous)',
            category: draft.category || undefined,
            type: 'formal',
            sourceUrl: draft.sourceUrl.trim() || undefined,
            authorToken: getAuthorToken()
        }, {
            onSuccess: () => {
                setDrafts(prev => prev.filter(d => d.id !== draftId));
                alert('በተሳካ ሁኔታ ታትሟል (Published successfully!)');
            }
        });
    };

    const [isPublishingAll, setIsPublishingAll] = useState(false);
    
    const handlePublishAll = async () => {
        const validDrafts = drafts.filter(draft => draft.title.trim() && draft.content.trim());
        if (validDrafts.length === 0) {
            alert('ምንም ትክክለኛ ረቂቅ የለም (No valid drafts to publish)');
            return;
        }

        setIsPublishingAll(true);
        let successCount = 0;

        try {
            for (const draft of validDrafts) {
                await poemsApi.create({
                    title: draft.title.trim(),
                    content: draft.content.trim(),
                    authorName: draft.authorName.trim() || 'ያልታወቀ (Anonymous)',
                    category: draft.category || undefined,
                    type: 'formal',
                    sourceUrl: draft.sourceUrl.trim() || undefined,
                    authorToken: getAuthorToken()
                });
                successCount++;
            }
            const validIds = new Set(validDrafts.map(d => d.id));
            setDrafts(prev => prev.filter(d => !validIds.has(d.id)));
            queryClient.invalidateQueries({ queryKey: ['poems'] });
            alert(`በተሳካ ሁኔታ ${successCount} ግጥሞች ታትመዋል (Published ${successCount} poems successfully!)`);
        } catch (error: any) {
            alert("ህትመት አልተሳካም (Publish failed): " + error.message);
        } finally {
            setIsPublishingAll(false);
        }
    };

    const handleCreateAdmin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAdminUsername || !newAdminPassword) return;
        createAdminMutation.mutate({ username: newAdminUsername, password: newAdminPassword });
    };

    const handleRoleChange = (userId: string, currentRole: string) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        const actionText = newRole === 'admin' ? 'promote this user to admin' : 'demote this admin to user';
        
        if (window.confirm(`Are you sure you want to ${actionText}?`)) {
            updateUserRoleMutation.mutate({ id: userId, role: newRole });
        }
    };

    if (isLoading || !user || user.role !== 'admin') {
        return null;
    }

    return (
        <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-6 sm:py-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#2C2C2C] break-words">Admin Portal</h1>
                    <p className="text-[#8C8881] mt-1 text-sm sm:text-base">Manage content, users, and system settings.</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-1 border-b border-[#E5E1D8] mb-8 overflow-x-auto max-w-full pb-1">
                <button
                    onClick={() => setActiveTab('content')}
                    className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors whitespace-nowrap ${
                        activeTab === 'content'
                            ? 'border-b-2 border-[#2C2C2C] text-[#2C2C2C]'
                            : 'text-[#8C8881] hover:text-[#2C2C2C] hover:bg-gray-50 rounded-t-lg'
                    }`}
                >
                    <LayoutDashboard className="w-4 h-4" />
                    Content Management
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors whitespace-nowrap ${
                        activeTab === 'users'
                            ? 'border-b-2 border-[#2C2C2C] text-[#2C2C2C]'
                            : 'text-[#8C8881] hover:text-[#2C2C2C] hover:bg-gray-50 rounded-t-lg'
                    }`}
                >
                    <Users className="w-4 h-4" />
                    User Management
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors whitespace-nowrap ${
                        activeTab === 'settings'
                            ? 'border-b-2 border-[#2C2C2C] text-[#2C2C2C]'
                            : 'text-[#8C8881] hover:text-[#2C2C2C] hover:bg-gray-50 rounded-t-lg'
                    }`}
                >
                    <Settings className="w-4 h-4" />
                    Security & Settings
                </button>
            </div>

            {/* Tab Contents */}
            <div className="space-y-12">
                
                {/* CONTENT TAB */}
                {activeTab === 'content' && (
                    <>
                        <div className="bg-gradient-to-r from-[#FFF9E6] to-white p-4 sm:p-8 rounded-3xl border border-[#FFEAB3] shadow-sm relative overflow-hidden w-full max-w-full">
                            <Sparkles className="absolute -top-4 -right-4 w-24 h-24 text-[#FFEAB3] opacity-50" />
                            <h2 className="text-lg sm:text-xl font-bold mb-2 flex items-center gap-2">
                                <Download className="w-5 h-5 text-[#B28200]" />
                                ከቴሌግራም አምጣ (Scrape from Telegram)
                            </h2>
                            <p className="text-sm text-[#8C8881] mb-6 max-w-2xl">
                                Enter a Telegram channel link (e.g., https://t.me/channel) or a post link to extract recent poems and add them to your drafts below.
                            </p>
                            
                            <form onSubmit={handleScrape} className="flex flex-col sm:flex-row gap-4 relative z-10">
                                <input
                                    type="url"
                                    value={scrapeUrl}
                                    onChange={(e) => setScrapeUrl(e.target.value)}
                                    placeholder="https://t.me/..."
                                    className="flex-1 px-4 py-3 bg-white border border-[#E5E1D8] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#B28200]/20 min-w-0"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={scrapeMutation.isPending || !scrapeUrl}
                                    className="px-6 py-3 bg-[#B28200] text-white rounded-2xl font-medium hover:bg-[#8C6600] transition-colors flex justify-center items-center gap-2 disabled:opacity-50 shrink-0"
                                >
                                    {scrapeMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'አምጣ (Fetch Poems)'}
                                </button>
                            </form>

                            {recentChannels && recentChannels.length > 0 && (
                                <div className="mt-4 flex flex-wrap items-center gap-2 relative z-10">
                                    <span className="text-xs text-[#8C8881] font-medium uppercase tracking-wider mr-2">Recent:</span>
                                    {recentChannels.map((channel: any) => (
                                        <div key={channel.id} className="group relative flex items-center bg-white/60 hover:bg-white border border-[#E5E1D8] rounded-full transition-colors pl-1 pr-1 py-1">
                                            <button
                                                type="button"
                                                onClick={() => setScrapeUrl(channel.url)}
                                                className="text-xs text-[#5C5955] px-2 max-w-[200px] truncate"
                                                title={channel.url}
                                            >
                                                {channel.url}
                                            </button>
                                            <button 
                                                onClick={() => deleteChannelMutation.mutate(channel.id)}
                                                disabled={deleteChannelMutation.isPending}
                                                className="p-1 rounded-full text-[#A39D93] hover:text-red-500 hover:bg-red-50 transition-colors ml-1"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {drafts.length > 0 && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b border-[#E5E1D8] pb-4">
                                    <h2 className="text-2xl font-bold text-[#2D2B2A]">
                                        ረቂቆች (Drafts) <span className="text-[#8C8881] text-lg font-normal ml-2">({drafts.length})</span>
                                    </h2>
                                    {drafts.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={handlePublishAll}
                                            disabled={isPublishingAll}
                                            className="px-6 py-2.5 bg-[#2D2B2A] text-white rounded-xl font-medium hover:bg-[#1A1918] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            <Send className="w-4 h-4" />
                                            {isPublishingAll ? 'በማተም ላይ...' : 'ሁሉንም አትም (Publish All)'}
                                        </button>
                                    )}
                                </div>
                                
                                <div className="grid gap-6">
                                    {drafts.map(draft => (
                                        <div key={draft.id} className="bg-white p-4 sm:p-8 rounded-3xl border border-[#E5E1D8] shadow-sm relative w-full max-w-full overflow-hidden">
                                            <button 
                                                onClick={() => removeDraft(draft.id)}
                                                className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 text-[#8C8881] hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                title="Discard Draft"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>

                                            <div className="space-y-6 pr-10 sm:pr-12 w-full max-w-full">
                                                <div>
                                                    <label className="block text-sm font-medium text-[#5C5955] mb-2">ርዕስ (Title)</label>
                                                    <input
                                                        type="text"
                                                        value={draft.title}
                                                        onChange={(e) => updateDraft(draft.id, 'title', e.target.value)}
                                                        className="w-full px-4 py-3 bg-white border border-[#E5E1D8] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2D2B2A]/20 font-bold"
                                                        required
                                                    />
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-sm font-medium text-[#5C5955] mb-2">ግጥም (Content)</label>
                                                    <textarea
                                                        value={draft.content}
                                                        onChange={(e) => updateDraft(draft.id, 'content', e.target.value)}
                                                        rows={8}
                                                        className="w-full px-4 py-4 bg-white border border-[#E5E1D8] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2D2B2A]/20 resize-y whitespace-pre-wrap leading-relaxed break-all"
                                                        required
                                                    />
                                                </div>
                                                
                                                <div className="grid sm:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-sm font-medium text-[#5C5955] mb-2">የገጣሚው ስም (Author Name)</label>
                                                        <input
                                                            type="text"
                                                            value={draft.authorName}
                                                            onChange={(e) => updateDraft(draft.id, 'authorName', e.target.value)}
                                                            className="w-full px-4 py-3 bg-white border border-[#E5E1D8] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2D2B2A]/20"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-[#5C5955] mb-2">ምድብ (Category)</label>
                                                        <select
                                                            value={draft.category}
                                                            onChange={(e) => updateDraft(draft.id, 'category', e.target.value)}
                                                            className="w-full px-4 py-3 bg-white border border-[#E5E1D8] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2D2B2A]/20 appearance-none"
                                                        >
                                                            <option value="">ምድብ ምረጥ (Select Category)</option>
                                                            {categories?.map(c => (
                                                                <option key={c} value={c}>{c}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="sm:col-span-2">
                                                        <label className="block text-sm font-medium text-[#5C5955] mb-2">የምንጭ ሊንክ (Source URL)</label>
                                                        <input
                                                            type="url"
                                                            value={draft.sourceUrl}
                                                            onChange={(e) => updateDraft(draft.id, 'sourceUrl', e.target.value)}
                                                            className="w-full px-4 py-3 bg-white border border-[#E5E1D8] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2D2B2A]/20 text-[#8C8881]"
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div className="pt-6 border-t border-[#E5E1D8] flex justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => handlePublishDraft(draft.id)}
                                                        disabled={publishMutation.isPending}
                                                        className="w-full sm:w-auto px-8 py-3 bg-[#2D2B2A] text-white rounded-full font-medium hover:bg-[#1A1918] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                                    >
                                                        <Send className="w-4 h-4" />
                                                        {publishMutation.isPending ? 'በማተም ላይ...' : 'አትም (Publish)'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* USERS TAB */}
                {activeTab === 'users' && (
                    <div className="bg-white rounded-3xl border border-[#E5E1D8] shadow-sm overflow-hidden">
                        <div className="p-6 sm:p-8 border-b border-[#E5E1D8]">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Users className="w-5 h-5 text-[#2C2C2C]" />
                                User Roles & Management
                            </h2>
                            <p className="text-sm text-[#8C8881] mt-2">
                                Manage user accounts and assign administrative privileges.
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#FAF8F5] border-b border-[#E5E1D8]">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold tracking-wider text-[#8C8881] uppercase">Username</th>
                                        <th className="px-6 py-4 text-xs font-semibold tracking-wider text-[#8C8881] uppercase">Role</th>
                                        <th className="px-6 py-4 text-xs font-semibold tracking-wider text-[#8C8881] uppercase">Joined Date</th>
                                        <th className="px-6 py-4 text-xs font-semibold tracking-wider text-[#8C8881] uppercase text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E5E1D8]">
                                    {usersList?.map((u: any) => (
                                        <tr key={u.id} className="hover:bg-[#FAF8F5] transition-colors">
                                            <td className="px-6 py-4 font-medium text-[#2C2C2C]">
                                                {u.username}
                                                {user?.id === u.id && <span className="ml-2 text-xs bg-[#E5E1D8] text-[#5C5955] px-2 py-0.5 rounded-full">You</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                    u.role === 'admin' 
                                                        ? 'bg-amber-100 text-amber-800'
                                                        : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {u.role === 'admin' ? 'Admin' : 'Standard User'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-[#8C8881]">
                                                {new Date(u.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleRoleChange(u.id, u.role)}
                                                    disabled={user?.id === u.id || updateUserRoleMutation.isPending}
                                                    className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
                                                        u.role === 'admin' 
                                                            ? 'text-red-600 hover:bg-red-50' 
                                                            : 'text-[#8B7355] hover:bg-[#8B7355]/10'
                                                    } disabled:opacity-30 disabled:cursor-not-allowed`}
                                                >
                                                    {u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!usersList || usersList.length === 0) && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-[#8C8881]">
                                                No users found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* SETTINGS TAB */}
                {activeTab === 'settings' && (
                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5E1D8] shadow-sm relative overflow-hidden">
                        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-[#2C2C2C]" />
                            Create New Admin Account
                        </h2>
                        <p className="text-sm text-[#8C8881] mb-6">
                            Create a fresh, dedicated administrator account that bypassing standard registration.
                        </p>
                        <form onSubmit={handleCreateAdmin} className="flex flex-col sm:flex-row gap-4">
                            <input
                                type="text"
                                value={newAdminUsername}
                                onChange={(e) => setNewAdminUsername(e.target.value)}
                                placeholder="Admin Username"
                                className="flex-1 px-4 py-3 bg-[#FAF8F5] border border-[#E5E1D8] rounded-2xl focus:outline-none focus:border-[#8B7355] focus:ring-1 focus:ring-[#8B7355] transition-all"
                                required
                            />
                            <input
                                type="password"
                                value={newAdminPassword}
                                onChange={(e) => setNewAdminPassword(e.target.value)}
                                placeholder="Secure Password"
                                className="flex-1 px-4 py-3 bg-[#FAF8F5] border border-[#E5E1D8] rounded-2xl focus:outline-none focus:border-[#8B7355] focus:ring-1 focus:ring-[#8B7355] transition-all"
                                required
                            />
                            <button
                                type="submit"
                                disabled={createAdminMutation.isPending || !newAdminUsername || !newAdminPassword}
                                className="px-6 py-3 bg-[#2C2C2C] text-white rounded-2xl font-medium hover:bg-[#8B7355] transition-colors flex justify-center items-center gap-2 disabled:opacity-50 shrink-0"
                            >
                                {createAdminMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4" /> Create Admin</>}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
