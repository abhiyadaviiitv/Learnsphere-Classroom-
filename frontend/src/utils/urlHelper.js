export const getDownloadUrl = (fileUrl) => {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
        return fileUrl;
    }
    return `http://localhost:8080${fileUrl}`;
};
