
export interface ParasutAuthResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    created_at: number;
}

export interface ParasutContact {
    id: string;
    name: string;
    vkn: string;
}

export interface ParasutProduct {
    id: string;
    name: string;
}

export interface ParasutTrackableJob {
    id: string;
    status: 'pending' | 'running' | 'done' | 'error';
    error_message?: string;
}
