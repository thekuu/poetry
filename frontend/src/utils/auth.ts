export const getAuthorToken = (): string => {
    let token = localStorage.getItem('author_token');
    if (!token) {
        token = crypto.randomUUID();
        localStorage.setItem('author_token', token);
    }
    return token;
};
