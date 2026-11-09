import { useState, useEffect, type FormEvent } from 'react';
import { Link, Outlet, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { 
    PenLine, 
    ChevronDown, 
    LogOut, 
    User, 
    Globe, 
    Menu, 
    X, 
    Search, 
    BookOpen, 
    MessageCircle, 
    Sparkles, 
    Shield,
    SlidersHorizontal,
    Check
} from 'lucide-react';
import { CATEGORIES } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Layout() {
    const [searchParams] = useSearchParams();
    const currentCategory = searchParams.get('category');
    const currentType = searchParams.get('type');
    const { user, setUser } = useAuth();
    const { language, setLanguage, t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

    // Synchronize search input if URL changes
    useEffect(() => {
        setSearchQuery(searchParams.get('q') || '');
    }, [searchParams]);

    // Lock body scrolling when mobile drawer is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileMenuOpen]);

    // Close mobile menu on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isMobileMenuOpen) {
                setIsMobileMenuOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isMobileMenuOpen]);

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        const trimmed = searchQuery.trim();
        let url = trimmed ? `/?q=${encodeURIComponent(trimmed)}` : '/';
        if (currentCategory) {
            url += (url === '/' ? '?' : '&') + `category=${currentCategory}`;
        }
        if (currentType) {
            url += (url === '/' ? '?' : '&') + `type=${currentType}`;
        }
        navigate(url);
        setIsMobileMenuOpen(false);
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
        navigate('/');
        setIsMobileMenuOpen(false);
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(prev => !prev);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    const isCurrentActive = (typeVal?: string | null, catVal?: string | null) => {
        if (location.pathname !== '/') return false;
        if (catVal !== undefined) {
            return (currentCategory || null) === (catVal || null);
        }
        if (typeVal === 'prompt') {
            return currentType === 'prompt';
        }
        if (typeVal === 'formal') {
            return !currentType || currentType === 'formal';
        }
        return false;
    };

    return (
        <div className="min-h-screen w-full max-w-full overflow-x-clip bg-[#FAF8F5] text-[#2C2C2C] font-sans selection:bg-[#EAE5D9] selection:text-[#2C2C2C] flex flex-col justify-between">
            {/* Header */}
            <header className="sticky top-0 z-30 w-full bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#EAE5D9]">
                <div className="max-w-6xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between gap-3 relative w-full">
                    {/* Brand */}
                    <Link 
                        to="/" 
                        onClick={closeMobileMenu} 
                        className={`text-lg sm:text-2xl font-normal tracking-wide text-[#2C2C2C] truncate min-w-0 shrink hover:opacity-85 transition-opacity ${language === 'am' ? 'font-amharic font-medium' : 'font-serif'}`}
                    >
                        {t('appTitle')}
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium tracking-wide shrink-0">
                        <form onSubmit={handleSearch} className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A39D93]" />
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={language === 'am' ? 'ፈልግ...' : 'Search...'}
                                className="pl-9 pr-4 py-2 bg-white/70 border border-[#EAE5D9] rounded-full text-[#5C564D] focus:outline-none focus:border-[#8B7355] focus:ring-1 focus:ring-[#8B7355] transition-all w-48 lg:w-64 text-sm"
                            />
                        </form>

                        {/* Categories dropdown */}
                        <div className="relative group">
                            <button className="text-[#8B8476] hover:text-[#2C2C2C] transition-colors flex items-center gap-1 py-2">
                                {t('categories')} <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-48 bg-[#FAF8F5] border border-[#EAE5D9] shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 py-2 rounded-xl">
                                <Link 
                                    to={`/${currentType ? `?type=${currentType}` : ''}`} 
                                    className={`block px-5 py-2 text-sm transition-colors ${!currentCategory ? 'text-[#8B7355] font-semibold bg-[#F3F0EA]' : 'text-[#5C564D] hover:bg-[#F3F0EA]'}`}
                                >
                                    {language === 'am' ? 'ሁሉም ምድቦች' : 'All Categories'}
                                </Link>
                                <div className="h-px bg-[#EAE5D9] my-1"></div>
                                {CATEGORIES.map(c => (
                                    <Link 
                                        key={c} 
                                        to={`/?category=${c}${currentType ? `&type=${currentType}` : ''}`} 
                                        className={`block px-5 py-2 text-sm transition-colors ${currentCategory === c ? 'text-[#8B7355] font-semibold bg-[#F3F0EA]' : 'text-[#5C564D] hover:bg-[#F3F0EA]'}`}
                                    >
                                        {t(c)}
                                    </Link>
                                ))}
                            </div>
                        </div>
                        
                        <Link 
                            to="/?type=prompt" 
                            className={`transition-colors ${currentType === 'prompt' ? 'text-[#8B7355] font-semibold' : 'text-[#8B8476] hover:text-[#2C2C2C]'}`}
                        >
                            {t('poemConversations')}
                        </Link>
                        
                        <Link 
                            to="/write" 
                            className="flex items-center gap-2 bg-white text-[#2C2C2C] px-4 py-2 rounded-full hover:bg-[#F3F0EA] transition-colors font-medium border border-[#EAE5D9] shadow-2xs"
                        >
                            <PenLine className="w-4 h-4 text-[#8B7355]" />
                            <span>{t('writePoem')}</span>
                        </Link>

                        <div className="h-4 w-px bg-[#EAE5D9] mx-1"></div>

                        {/* Language Toggle */}
                        <button
                            onClick={() => setLanguage(language === 'am' ? 'en' : 'am')}
                            className="flex items-center gap-1.5 text-[#8B8476] hover:text-[#2C2C2C] hover:bg-[#F3F0EA] transition-colors bg-transparent px-3 py-1.5 rounded-full border border-[#EAE5D9] text-xs font-medium"
                            title={language === 'am' ? 'Switch to English' : 'ወደ አማርኛ ቀይር'}
                        >
                            <Globe className="w-3.5 h-3.5" />
                            <span>{language === 'am' ? 'EN' : 'አማ'}</span>
                        </button>

                        {/* User/Auth */}
                        {user ? (
                            <div className="flex items-center gap-3">
                                {user.role === 'admin' && (
                                    <Link to="/admin" className="text-[#8B8476] hover:text-[#2C2C2C] transition-colors font-medium">
                                        Admin
                                    </Link>
                                )}
                                <span className="text-[#8B8476] font-serif italic">{t('hello')}, {user.username}</span>
                                <button onClick={handleLogout} className="text-[#8B8476] hover:text-[#8B7355] transition-colors" title={t('logout')}>
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <Link to="/login" className="flex items-center gap-1.5 text-[#8B8476] hover:text-[#2C2C2C] transition-colors">
                                <User className="w-4 h-4" />
                                <span>{t('login')}</span>
                            </Link>
                        )}
                    </nav>

                    {/* Mobile Header Action Controls */}
                    <div className="flex md:hidden items-center gap-2 shrink-0">
                        {/* Quick Write Button */}
                        <Link 
                            to="/write" 
                            className="inline-flex items-center justify-center p-2 rounded-full bg-white border border-[#EAE5D9] text-[#8B7355] hover:bg-[#F3F0EA] transition-colors shadow-2xs"
                            title={t('writePoem')}
                            aria-label={t('writePoem')}
                        >
                            <PenLine className="w-4 h-4" />
                        </Link>

                        {/* Language Switch */}
                        <button
                            onClick={() => setLanguage(language === 'am' ? 'en' : 'am')}
                            className="flex items-center gap-1 text-[#8B8476] hover:text-[#2C2C2C] px-2.5 py-1.5 rounded-full border border-[#EAE5D9] text-xs font-medium bg-white/70"
                            aria-label="Toggle language"
                        >
                            <Globe className="w-3 h-3 text-[#8B7355]" />
                            <span>{language === 'am' ? 'EN' : 'አማ'}</span>
                        </button>

                        {/* Hamburger Menu Toggle Button */}
                        <button 
                            className="inline-flex items-center justify-center p-2 rounded-full border border-[#EAE5D9] bg-white text-[#2C2C2C] hover:bg-[#F3F0EA] transition-colors shadow-2xs min-w-[40px] min-h-[40px]"
                            onClick={toggleMobileMenu}
                            aria-label={isMobileMenuOpen ? t('close') : t('menu')}
                            aria-expanded={isMobileMenuOpen}
                        >
                            {isMobileMenuOpen ? <X className="w-5 h-5 text-[#8B7355]" /> : <Menu className="w-5 h-5 text-[#2C2C2C]" />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Slide-Over Drawer Navigation */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
                        onClick={closeMobileMenu}
                        aria-hidden="true"
                    />

                    {/* Drawer Panel */}
                    <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-[#FAF8F5] shadow-2xl border-l border-[#EAE5D9] flex flex-col z-50 overflow-y-auto animate-in slide-in-from-right duration-300">
                        {/* Drawer Header */}
                        <div className="p-5 border-b border-[#EAE5D9] flex items-center justify-between bg-white/60">
                            <div>
                                <h3 className={`text-xl font-normal text-[#2C2C2C] ${language === 'am' ? 'font-amharic font-medium' : 'font-serif'}`}>
                                    {t('appTitle')}
                                </h3>
                                <p className="text-xs text-[#8B8476] font-serif italic mt-0.5">
                                    {language === 'am' ? 'የግጥም ማህበረሰብ' : 'A Poetry Community'}
                                </p>
                            </div>
                            <button 
                                onClick={closeMobileMenu}
                                className="p-2 rounded-full text-[#8B8476] hover:text-[#2C2C2C] hover:bg-[#F3F0EA] transition-colors"
                                aria-label={t('close')}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Drawer Content */}
                        <div className="p-5 space-y-6 flex-1">
                            {/* Search Form */}
                            <form onSubmit={handleSearch} className="relative">
                                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A39D93]" />
                                <input 
                                    type="text" 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={language === 'am' ? 'ግጥም፣ ጸሐፊ፣ ወይም ምድብ ፈልግ...' : 'Search poems, authors, or categories...'}
                                    className="w-full pl-10 pr-20 py-2.5 bg-white border border-[#EAE5D9] rounded-xl text-sm text-[#2C2C2C] focus:outline-none focus:border-[#8B7355] focus:ring-1 focus:ring-[#8B7355] transition-all shadow-2xs"
                                />
                                <button
                                    type="submit"
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-[#8B7355] text-white text-xs font-medium rounded-lg hover:bg-[#6F5B43] transition-colors"
                                >
                                    {language === 'am' ? 'ፈልግ' : 'Search'}
                                </button>
                            </form>

                            {/* Main Navigation Links */}
                            <div className="space-y-1">
                                <span className="text-[11px] font-semibold text-[#8B8476] uppercase tracking-wider px-2">
                                    {language === 'am' ? 'ዋና ዋና ገጾች' : 'Navigation'}
                                </span>
                                
                                <Link 
                                    to="/"
                                    onClick={closeMobileMenu}
                                    className={`flex items-center justify-between p-3 rounded-xl transition-colors ${isCurrentActive('formal', null) ? 'bg-[#EAE5D9]/70 text-[#2C2C2C] font-semibold' : 'text-[#5C564D] hover:bg-white'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <BookOpen className="w-4 h-4 text-[#8B7355]" />
                                        <span>{t('formalPoemsTitle')}</span>
                                    </div>
                                    {isCurrentActive('formal', null) && <Check className="w-4 h-4 text-[#8B7355]" />}
                                </Link>

                                <Link 
                                    to="/?type=prompt"
                                    onClick={closeMobileMenu}
                                    className={`flex items-center justify-between p-3 rounded-xl transition-colors ${currentType === 'prompt' ? 'bg-[#EAE5D9]/70 text-[#2C2C2C] font-semibold' : 'text-[#5C564D] hover:bg-white'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <MessageCircle className="w-4 h-4 text-[#8B7355]" />
                                        <span>{t('poemConversations')}</span>
                                    </div>
                                    {currentType === 'prompt' && <Check className="w-4 h-4 text-[#8B7355]" />}
                                </Link>

                                <Link 
                                    to="/write"
                                    onClick={closeMobileMenu}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-[#8B7355] text-white font-medium hover:bg-[#6F5B43] transition-all shadow-xs"
                                >
                                    <PenLine className="w-4 h-4" />
                                    <span>{t('writePoem')}</span>
                                </Link>
                            </div>

                            {/* Categories Section */}
                            <div className="space-y-2.5 pt-2 border-t border-[#EAE5D9]">
                                <div className="flex items-center justify-between px-2">
                                    <span className="text-[11px] font-semibold text-[#8B8476] uppercase tracking-wider flex items-center gap-1.5">
                                        <SlidersHorizontal className="w-3.5 h-3.5" />
                                        {t('categories')}
                                    </span>
                                    {currentCategory && (
                                        <Link 
                                            to={`/${currentType ? `?type=${currentType}` : ''}`}
                                            onClick={closeMobileMenu}
                                            className="text-xs text-[#8B7355] hover:underline"
                                        >
                                            {language === 'am' ? 'አጽዳ' : 'Clear'}
                                        </Link>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <Link 
                                        to={`/${currentType ? `?type=${currentType}` : ''}`}
                                        onClick={closeMobileMenu}
                                        className={`px-3 py-2 rounded-lg text-xs font-medium text-center border transition-all ${!currentCategory ? 'bg-[#8B7355] text-white border-[#8B7355] shadow-xs' : 'bg-white border-[#EAE5D9] text-[#5C564D] hover:bg-[#F3F0EA]'}`}
                                    >
                                        {language === 'am' ? 'ሁሉም ምድቦች' : 'All Categories'}
                                    </Link>
                                    {CATEGORIES.map(c => {
                                        const isSelected = currentCategory === c;
                                        return (
                                            <Link 
                                                key={c}
                                                to={`/?category=${c}${currentType ? `&type=${currentType}` : ''}`}
                                                onClick={closeMobileMenu}
                                                className={`px-3 py-2 rounded-lg text-xs font-medium text-center border transition-all ${isSelected ? 'bg-[#8B7355] text-white border-[#8B7355] shadow-xs' : 'bg-white border-[#EAE5D9] text-[#5C564D] hover:bg-[#F3F0EA]'}`}
                                            >
                                                {t(c)}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Language Switcher */}
                            <div className="space-y-2 pt-2 border-t border-[#EAE5D9]">
                                <span className="text-[11px] font-semibold text-[#8B8476] uppercase tracking-wider px-2 flex items-center gap-1.5">
                                    <Globe className="w-3.5 h-3.5" />
                                    {language === 'am' ? 'ቋንቋ (Language)' : 'Language'}
                                </span>
                                <div className="grid grid-cols-2 gap-2 p-1 bg-white rounded-xl border border-[#EAE5D9]">
                                    <button
                                        onClick={() => setLanguage('am')}
                                        className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${language === 'am' ? 'bg-[#8B7355] text-white shadow-xs' : 'text-[#5C564D] hover:bg-[#FAF8F5]'}`}
                                    >
                                        አማርኛ (Amharic)
                                    </button>
                                    <button
                                        onClick={() => setLanguage('en')}
                                        className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${language === 'en' ? 'bg-[#8B7355] text-white shadow-xs' : 'text-[#5C564D] hover:bg-[#FAF8F5]'}`}
                                    >
                                        English
                                    </button>
                                </div>
                            </div>

                            {/* User Profile / Auth */}
                            <div className="pt-2 border-t border-[#EAE5D9] space-y-3">
                                {user ? (
                                    <div className="bg-white p-4 rounded-xl border border-[#EAE5D9] space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full bg-[#EAE5D9] text-[#8B7355] font-serif font-bold flex items-center justify-center text-sm">
                                                    {user.username.slice(0, 1).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-[#2C2C2C]">{user.username}</p>
                                                    <p className="text-[11px] text-[#8B8476] font-mono">{user.role || 'Member'}</p>
                                                </div>
                                            </div>
                                            {user.role === 'admin' && (
                                                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-semibold rounded-full flex items-center gap-1">
                                                    <Shield className="w-3 h-3" /> Admin
                                                </span>
                                            )}
                                        </div>

                                        {user.role === 'admin' && (
                                            <Link 
                                                to="/admin" 
                                                onClick={closeMobileMenu}
                                                className="block text-center w-full py-2 bg-[#FAF8F5] border border-[#EAE5D9] rounded-lg text-xs font-medium text-[#2C2C2C] hover:bg-[#EAE5D9] transition-colors"
                                            >
                                                Admin Dashboard
                                            </Link>
                                        )}

                                        <button 
                                            onClick={handleLogout}
                                            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <LogOut className="w-3.5 h-3.5" />
                                            {t('logout')}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        <Link 
                                            to="/login"
                                            onClick={closeMobileMenu}
                                            className="py-2.5 px-3 rounded-xl border border-[#EAE5D9] bg-white text-center text-xs font-medium text-[#2C2C2C] hover:bg-[#F3F0EA] transition-colors shadow-2xs"
                                        >
                                            {t('login')}
                                        </Link>
                                        <Link 
                                            to="/register"
                                            onClick={closeMobileMenu}
                                            className="py-2.5 px-3 rounded-xl bg-[#2C2C2C] text-white text-center text-xs font-medium hover:bg-[#8B7355] transition-colors shadow-2xs"
                                        >
                                            {t('register')}
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Page Content */}
            <main className="w-full max-w-3xl mx-auto px-4 py-6 sm:py-12 pb-24 md:pb-12 flex-1">
                <Outlet />
            </main>

            {/* Desktop & Standard Footer */}
            <footer className="w-full max-w-3xl mx-auto px-4 py-8 sm:py-16 border-t border-[#EAE5D9] text-center text-[#A39D93] text-sm font-serif italic pb-24 md:pb-16">
                <p>The Poet Society</p>
                <p className="mt-2 font-sans text-xs">
                    {language === 'am' 
                        ? 'አንባቢዎች እና ጸሐፊዎች በግጥም የሚገናኙበት መድረክ።' 
                        : 'A digital poetry community where readers can converse with poems.'}
                </p>
            </footer>

            {/* Mobile Bottom Navigation Bar (Persistent Thumb Navigation) */}
            <nav 
                aria-label="Mobile Navigation" 
                className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-t border-[#EAE5D9] px-2 py-2 flex items-center justify-around shadow-lg"
            >
                {/* 1. Browse Collection */}
                <Link 
                    to="/" 
                    onClick={() => {
                        if (isMobileMenuOpen) setIsMobileMenuOpen(false);
                    }}
                    className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${location.pathname === '/' && currentType !== 'prompt' ? 'text-[#8B7355]' : 'text-[#8B8476] hover:text-[#2C2C2C]'}`}
                >
                    <BookOpen className="w-5 h-5" />
                    <span>{t('formalPoems')}</span>
                </Link>

                {/* 2. Poem Conversations */}
                <Link 
                    to="/?type=prompt" 
                    onClick={() => {
                        if (isMobileMenuOpen) setIsMobileMenuOpen(false);
                    }}
                    className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${currentType === 'prompt' ? 'text-[#8B7355]' : 'text-[#8B8476] hover:text-[#2C2C2C]'}`}
                >
                    <MessageCircle className="w-5 h-5" />
                    <span>{t('poemConversations')}</span>
                </Link>

                {/* 3. Write Poem (Accent Center Action) */}
                <Link 
                    to="/write" 
                    onClick={() => {
                        if (isMobileMenuOpen) setIsMobileMenuOpen(false);
                    }}
                    className="flex flex-col items-center justify-center -mt-4 bg-[#8B7355] text-white w-12 h-12 rounded-full shadow-md hover:bg-[#6F5B43] active:scale-95 transition-all"
                    aria-label={t('writePoem')}
                >
                    <PenLine className="w-5 h-5" />
                </Link>

                {/* 4. Categories Selector / Drawer */}
                <button
                    onClick={() => {
                        setIsMobileMenuOpen(true);
                    }}
                    className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${currentCategory ? 'text-[#8B7355]' : 'text-[#8B8476] hover:text-[#2C2C2C]'}`}
                >
                    <Sparkles className="w-5 h-5" />
                    <span>{t('categories')}</span>
                </button>

                {/* 5. Account or Full Menu */}
                {user ? (
                    <button
                        onClick={toggleMobileMenu}
                        className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-medium text-[#8B8476] hover:text-[#2C2C2C] transition-colors"
                    >
                        <User className="w-5 h-5" />
                        <span className="truncate max-w-[50px]">{user.username}</span>
                    </button>
                ) : (
                    <Link
                        to="/login"
                        onClick={() => {
                            if (isMobileMenuOpen) setIsMobileMenuOpen(false);
                        }}
                        className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${location.pathname === '/login' ? 'text-[#8B7355]' : 'text-[#8B8476] hover:text-[#2C2C2C]'}`}
                    >
                        <User className="w-5 h-5" />
                        <span>{t('login')}</span>
                    </Link>
                )}
            </nav>
        </div>
    );
}
