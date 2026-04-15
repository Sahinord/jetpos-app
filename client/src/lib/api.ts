/**
 * JetPos API Fetch Utility
 * Automatically routes API calls to the production Vercel backend when running in Electron.
 */

const IS_ELECTRON = typeof window !== 'undefined' && 
                   (window.process?.type === 'renderer' || 
                    navigator.userAgent.indexOf('Electron') >= 0);

// Production Vercel URL
const PROD_API_BASE = 'https://jetpos-app-71jf.vercel.app';

export async function apiFetch(path: string, options: RequestInit = {}) {
    let url = path;

    // If we're in Electron and calling a local API route, redirect to production
    if (IS_ELECTRON && path.startsWith('/api/')) {
        url = `${PROD_API_BASE}${path}`;
        
        // Ensure headers include Content-Type if we have a body
        if (options.body && (!options.headers || !(options.headers as any)['Content-Type'])) {
            options.headers = {
                ...options.headers,
                'Content-Type': 'application/json'
            };
        }
    }

    try {
        const response = await fetch(url, options);
        return response;
    } catch (error) {
        console.error(`[API Fetch Error] ${url}:`, error);
        throw error;
    }
}
