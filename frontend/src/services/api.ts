import { Poem, Reply, ApiResponse } from '../types';

const API_URL = '/api';

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
        credentials: 'include',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
    const data = await response.json();
    if (!data.success) {
        throw new Error(data.error?.message || 'API Error');
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
    getById: (id: string) => fetchApi<Poem>(`/poems/${id}`),
    create: (data: Partial<Poem> & { authorToken: string }) => fetchApi<Poem>(`/poems`, {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: string, data: Partial<Poem> & { authorToken: string }) => fetchApi<Poem>(`/poems/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),
    delete: (id: string, authorToken: string) => fetchApi<{id: string}>(`/poems/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${authorToken}`
        }
    }),
    search: (query: string) => fetchApi<Poem[]>(`/search?q=${encodeURIComponent(query)}`)
};

export const repliesApi = {
    getByPoemId: (poemId: string) => fetchApi<Reply[]>(`/poems/${poemId}/replies`),
    create: (poemId: string, data: Partial<Reply> & { authorToken: string }) => fetchApi<Reply>(`/poems/${poemId}/replies`, {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: string, data: Partial<Reply> & { authorToken: string }) => fetchApi<Reply>(`/replies/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),
    delete: (id: string, authorToken: string) => fetchApi<{id: string}>(`/replies/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${authorToken}`
        }
    }),
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
