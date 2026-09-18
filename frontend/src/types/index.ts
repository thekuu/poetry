export interface Poem {
    id: string;
    title: string;
    content: string;
    authorName: string;
    category: string | null;
    type: 'standard' | 'prompt' | 'formal';
    sourceUrl: string | null;
    createdAt: string;
    replyCount?: number;
}

export interface Reply {
    id: string;
    poemId: string;
    parentReplyId: string | null;
    content: string;
    authorName: string;
    createdAt: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code?: string;
        message: string;
    };
}
