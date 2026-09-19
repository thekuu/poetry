import { useState } from 'react';
import { Link, Outlet, useSearchParams, useNavigate } from 'react-router-dom';
import { PenLine, ChevronDown, LogOut, User, Globe, Menu, X, Search } from 'lucide-react';
import { CATEGORIES } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Layout() {
    const [searchParams] = useSearchParams();
    const currentType = searchParams.get('type');
    const { user, setUser } = useAuth();
    const { language, setLanguage, t } = useLanguage();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

    const handleSearch = (e: any) => {
        e.preventDefault();
        const currentCategory = searchParams.get('category');
        let url = `/?q=${encodeURIComponent(searchQuery.trim())}`;
        if (!searchQuery.trim()) {
            url = '/';
        }
        if (currentCategory) {
            url += (url === '/' ? '?' : '&') + `category=${currentCategory}`;
        }
        if (currentType) {
            url += (url === '/' ? '?' : '&') + `type=${currentType}`;
        }
        navigate(url);
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
        navigate('/');
        setIsMobileMenuOpen(false);
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <div className="min-h-screen w-full max-w-full overflow-x-clip overflow-x-hidden bg-[#FAF8F5] text-[#2C2C2C] font-sans selection:bg-[#EAE5D9] selection:text-[#2C2C2C] touch-pan-y">
            <header className="sticky top-0 z-10 w-full max-w-full bg-[#FAF8F5]/90 backdrop-blur-sm border-b border-[#EAE5D9] overflow-x-hidden">
                <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between gap-2 relative w-full min-w-0">
                    <Link to="/" onClick={closeMobileMenu} className={`text-base sm:text-2xl font-normal tracking-wide text-[#2C2C2C] truncate min-w-0 shrink ${language === 'am' ? 'font-amharic font-medium' : 'font-serif'}`}>
                        {t('appTitle')}
                    </Link>

                    <nav className="flex items-center gap-2 sm:gap-6 text-xs sm:text-sm font-medium tracking-wide shrink-0">
                        <div className="hidden md:flex items-center gap-6">
                            <form onSubmit={handleSearch} className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A39D93]" />
                                <input 
                                    type="text" 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={language === 'am' ? 'ፈልግ...' : 'Search...'}
                                    className="pl-9 pr-4 py-2 bg-[#FAF8F5] border border-[#EAE5D9] rounded-full text-[#5C564D] focus:outline-none focus:border-[#8B7355] focus:ring-1 focus:ring-[#8B7355] transition-all w-48 lg:w-64"
                                />
                            </form>

                            <div className="relative group">
                                <button className="text-[#8B8476] hover:text-[#2C2C2C] transition-colors flex items-center gap-1 h-full py-2">
                                    {t('categories')} <ChevronDown className="w-3 h-3" />
                                </button>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-[#FAF8F5] border border-[#EAE5D9] shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 py-2 rounded-md">
                                    {CATEGORIES.map(c => (
                                        <Link key={c} to={`/?category=${c}${currentType ? `&type=${currentType}` : ''}`} className="block px-6 py-2.5 hover:bg-[#F3F0EA] text-[#5C564D] transition-colors text-sm">
                                            {t(c)}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                            
                            <Link to="/?type=prompt" className="text-[#8B8476] hover:text-[#2C2C2C] transition-colors">
                                {t('poemConversations')}
                            </Link>
                            
                            <Link to="/write" className="flex items-center gap-2 bg-[#FAF8F5] text-[#2C2C2C] px-5 py-2.5 rounded-full hover:bg-[#F3F0EA] transition-colors font-medium border border-[#EAE5D9]">
                                <PenLine className="w-4 h-4 text-[#8B7355]" />
                                <span>{t('writePoem')}</span>
                            </Link>

                            <div className="h-4 w-px bg-[#EAE5D9] mx-1"></div>

                            {user ? (
                                <div className="flex items-center gap-3">
                                    {user.role === 'admin' && (
                                        <Link to="/admin" className="text-[#8B8476] hover:text-[#2C2C2C] transition-colors font-medium">
                                            Admin
                                        </Link>
                                    )}
                                    <span className="text-[#8B8476] font-serif italic text-base">{t('hello')}, {user.username}</span>
                                    <button onClick={handleLogout} className="text-[#8B8476] hover:text-[#8B7355] transition-colors" title={t('logout')}>
                                        <LogOut className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <Link to="/login" className="flex items-center gap-1 text-[#8B8476] hover:text-[#2C2C2C] transition-colors">
                                    <User className="w-4 h-4" />
                                    <span>{t('login')}</span>
                                </Link>
                            )}
                        </div>
                        
                        <button
                            onClick={() => setLanguage(language === 'am' ? 'en' : 'am')}
                            className="flex items-center gap-2 text-[#8B8476] hover:text-[#2C2C2C] hover:bg-[#F3F0EA] transition-colors bg-transparent px-3 py-1.5 rounded-full border border-[#EAE5D9] text-xs font-medium"
                        >
                            <Globe className="w-3.5 h-3.5" />
                            <span>{language === 'am' ? 'EN' : 'AM'}</span>
                        </button>

                        <button 
                            className="md:hidden text-[#8B8476] hover:text-[#2C2C2C] transition-colors p-1"
                            onClick={toggleMobileMenu}
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </nav>
                </div>

                {/* Mobile Menu Dropdown */}
                {isMobileMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 right-0 w-full max-w-full bg-[#FAF8F5] border-b border-[#EAE5D9] shadow-lg py-6 px-4 flex flex-col gap-6 font-medium overflow-hidden box-border">
                        <form onSubmit={(e) => { handleSearch(e); closeMobileMenu(); }} className="relative w-full">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#A39D93]" />
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={language === 'am' ? 'ፈልግ...' : 'Search...'}
                                className="pl-10 pr-4 py-3 bg-white border border-[#EAE5D9] rounded-xl text-[#5C564D] focus:outline-none focus:border-[#8B7355] focus:ring-1 focus:ring-[#8B7355] transition-all w-full text-base"
                            />
                        </form>
                        
                        <Link to={`/?type=prompt`} onClick={closeMobileMenu} className="text-[#2C2C2C] hover:text-[#8B7355] transition-colors text-lg">
                            {t('poemConversations')}
                        </Link>
                        
                        <div className="flex flex-col gap-3">
                            <span className="text-[#8B8476] text-sm uppercase tracking-wider">{t('categories')}</span>
                            <div className="flex flex-wrap gap-2">
                                {CATEGORIES.map(c => (
                                    <Link key={c} to={`/?category=${c}${currentType ? `&type=${currentType}` : ''}`} onClick={closeMobileMenu} className="px-4 py-2 bg-[#F3F0EA] hover:bg-[#EAE5D9] transition-colors text-[#5C564D] rounded-md text-sm">
                                        {t(c)}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <Link to="/write" onClick={closeMobileMenu} className="flex items-center gap-2 text-[#2C2C2C] hover:text-[#8B7355] transition-colors text-lg">
                            <PenLine className="w-5 h-5 text-[#8B7355]" />
                            {t('writePoem')}
                        </Link>

                        <div className="h-px w-full bg-[#EAE5D9]"></div>
                        
                        {user ? (
                            <div className="flex flex-col gap-4">
                                <span className="text-[#8B8476] font-serif italic text-lg">{t('hello')}, {user.username}</span>
                                {user.role === 'admin' && (
                                    <Link to="/admin" onClick={closeMobileMenu} className="text-[#2C2C2C] hover:text-[#8B7355] transition-colors text-lg font-medium">
                                        Admin Dashboard
                                    </Link>
                                )}
                                <button onClick={handleLogout} className="text-[#8B8476] hover:text-[#8B7355] transition-colors flex items-center gap-2 text-lg self-start">
                                    <LogOut className="w-5 h-5" />
                                    {t('logout')}
                                </button>
                            </div>
                        ) : (
                            <Link to="/login" onClick={closeMobileMenu} className="flex items-center gap-2 text-[#2C2C2C] hover:text-[#8B7355] transition-colors text-lg">
                                <User className="w-5 h-5" />
                                {t('login')}
                            </Link>
                        )}
                    </div>
                )}
            </header>
            
            <main className="w-full max-w-3xl mx-auto px-3 sm:px-4 py-8 sm:py-12 min-w-0 max-w-full overflow-x-clip overflow-x-hidden">
                <Outlet />
            </main>
            
            <footer className="w-full max-w-3xl mx-auto px-4 py-12 sm:py-16 border-t border-[#EAE5D9] text-center text-[#A39D93] text-sm mt-12 sm:mt-16 font-serif italic min-w-0 max-w-full overflow-hidden">
                <p>The Poet Society</p>
                <p className="mt-2 font-sans text-xs">A digital poetry community where readers can converse with poems.</p>
            </footer>
        </div>
    );
}
