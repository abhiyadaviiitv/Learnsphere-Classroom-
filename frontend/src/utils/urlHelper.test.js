import { getDownloadUrl } from './urlHelper';

describe('getDownloadUrl', () => {
    test('returns absolute HTTP URL as is', () => {
        const url = 'http://example.com/file.pdf';
        expect(getDownloadUrl(url)).toBe(url);
    });

    test('returns absolute HTTPS URL as is', () => {
        const url = 'https://example.com/file.pdf';
        expect(getDownloadUrl(url)).toBe(url);
    });

    test('prepends base URL to relative path', () => {
        const path = '/uploads/file.pdf';
        expect(getDownloadUrl(path)).toBe(`http://localhost:8080${path}`);
    });

    test('returns empty string for empty input', () => {
        expect(getDownloadUrl('')).toBe('');
        expect(getDownloadUrl(null)).toBe('');
    });
});
