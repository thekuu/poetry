import { Poem, Reply, ApiResponse } from '../types';

const API_URL = '/api';

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    headers['x-admin-dev'] = 'true';

    const response = await fetch(`${API_URL}${endpoint}`, {
        credentials: 'include',
        ...options,
        headers,
    });

    let data: any;
    try {
        data = await response.json();
    } catch {
        throw new Error(`Server returned ${response.status} ${response.statusText}`);
    }

    if (!data.success) {
        const msg = typeof data.error === 'string' 
            ? data.error 
            : (data.error?.message || `Request failed (${response.status})`);
        throw new Error(msg);
    }
    return data.data;
}

export const poemsApi = {
    getAll: (category?: string, query?: string, type?: string) => {
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        if (query) params.append('q', query);
        if (type) params.append('type', type);
        const qs = params.toString();
        return fetchApi<Poem[]>(`/poems${qs ? `?${qs}` : ''}`);
    },
    getById: (id: string, authorToken?: string) => {
        const token = authorToken || (typeof window !== 'undefined' ? localStorage.getItem('author_token') : undefined);
        return fetchApi<Poem>(`/poems/${id}`, {
            headers: token ? { 'x-author-token': token } : {}
        });
    },
    create: (data: Partial<Poem> & { authorToken: string }) => fetchApi<Poem>(`/poems`, {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: string, data: Partial<Poem> & { authorToken: string }) => fetchApi<Poem>(`/poems/${id}`, {
        method: 'PATCH',
        headers: {
            'x-author-token': data.authorToken
        },
        body: JSON.stringify(data),
    }),
    delete: (id: string, authorToken?: string) => {
        const token = authorToken || (typeof window !== 'undefined' ? localStorage.getItem('author_token') : undefined);
        return fetchApi<{id: string}>(`/poems/${id}`, {
            method: 'DELETE',
            headers: token ? { 'x-author-token': token } : {}
        });
    },
    search: (query: string) => fetchApi<Poem[]>(`/search?q=${encodeURIComponent(query)}`)
};

export const repliesApi = {
    getByPoemId: (poemId: string, authorToken?: string) => {
        const token = authorToken || (typeof window !== 'undefined' ? localStorage.getItem('author_token') : undefined);
        return fetchApi<Reply[]>(`/poems/${poemId}/replies`, {
            headers: token ? { 'x-author-token': token } : {}
        });
    },
    create: (poemId: string, data: Partial<Reply> & { authorToken: string }) => fetchApi<Reply>(`/poems/${poemId}/replies`, {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: string, data: Partial<Reply> & { authorToken: string }) => fetchApi<Reply>(`/replies/${id}`, {
        method: 'PATCH',
        headers: {
            'x-author-token': data.authorToken
        },
        body: JSON.stringify(data),
    }),
    delete: (id: string, authorToken?: string) => {
        const token = authorToken || (typeof window !== 'undefined' ? localStorage.getItem('author_token') : undefined);
        return fetchApi<{id: string}>(`/replies/${id}`, {
            method: 'DELETE',
            headers: token ? { 'x-author-token': token } : {}
        });
    },
};

export const categoriesApi = {
    getAll: () => fetchApi<string[]>(`/categories`)
};

export const adminApi = {
    getUsers: () => fetchApi<any[]>(`/admin/users`),
    updateUserRole: (id: string, role: string) => fetchApi<{ user: any }>(`/admin/users/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
    }),
    createAdmin: (data: any) => fetchApi<{ user: any }>(`/admin/create-admin`, {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    scrapeTelegram: (url: string) => fetchApi<Array<{
        title: string;
        content: string;
        authorName: string;
        category: string;
    }>>(`/admin/scrape`, {
        method: 'POST',
        body: JSON.stringify({ url }),
    }),
    getChannels: () => fetchApi<Array<{ id: string; url: string; createdAt: string }>>(`/admin/channels`),
    addChannel: (url: string) => fetchApi<{ id: string; url: string; createdAt: string }>(`/admin/channels`, {
        method: 'POST',
        body: JSON.stringify({ url })
    }),
    deleteChannel: (id: string) => fetchApi<{ id: string }>(`/admin/channels/${id}`, {
        method: 'DELETE'
    })
};
