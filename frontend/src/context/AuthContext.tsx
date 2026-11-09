import React, { createContext, useContext, useState, useEffect } from 'react';

type User = {
    id: string;
    username: string;
    role: string;
};

type AuthContextType = {
    user: User | null;
    setUser: (user: User | null) => void;
    isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        fetch('/api/auth/me', {
            credentials: 'include',
            headers
        })
            .then(res => res.json())
            .then(data => {
                if (data.success && data.user) {
                    setUser(data.user);
                } else {
                    setUser(null);
                }
            })
            .catch(() => {
                setUser(null);
            })
            .finally(() => setIsLoading(false));
    }, []);

    const handleSetUser = (u: User | null) => {
        setUser(u);
        if (!u) {
            localStorage.removeItem('token');
        }
    };

    return (
        <AuthContext.Provider value={{ user, setUser: handleSetUser, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
