import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function AdminLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { setUser } = useAuth();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (data.success) {
                if (data.user.role !== 'admin') {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    setUser(null);
                    setError('Access denied. Admin privileges required.');
                } else {
                    setUser(data.user);
                    navigate('/admin');
                }
            } else {
                setError(data.error?.message || t('loginFailed'));
            }
        } catch (err) {
            setError(t('somethingWentWrong'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-12 bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-[#F3F0EA]">
            <h1 className="text-3xl font-serif mb-8 text-center text-[#2C2C2C] tracking-wide">Admin Login</h1>
            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 text-sm">{error}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-xs font-semibold tracking-wider uppercase text-[#8B8476] mb-3">{t('username')}</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="w-full px-5 py-3.5 bg-[#FAF8F5] border border-[#EAE5D9] rounded-xl focus:outline-none focus:border-[#8B7355] focus:ring-1 focus:ring-[#8B7355] transition-all text-[#5C564D]"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold tracking-wider uppercase text-[#8B8476] mb-3">{t('password')}</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-5 py-3.5 bg-[#FAF8F5] border border-[#EAE5D9] rounded-xl focus:outline-none focus:border-[#8B7355] focus:ring-1 focus:ring-[#8B7355] transition-all text-[#5C564D]"
                    />
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#2C2C2C] text-white py-4 rounded-full font-medium tracking-wide hover:bg-[#8B7355] transition-colors disabled:opacity-50 mt-8"
                >
                    {isLoading ? t('loggingIn') : 'Login to Admin Panel'}
                </button>
            </form>
        </div>
    );
}
