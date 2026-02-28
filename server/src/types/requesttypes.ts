export interface Header {
    key: string;
    value: string;
}

export interface CreateRequestInput {
    name: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
    url: string;
    headers?: Header[];
    body?: string;
}

export interface ExecuteRequestInput {
    method: string;
    url: string;
    headers?: Header[];
    body?: string;
}

export interface ExecuteRequestResponse {
    statusCode: number;
    statusText: string;
    headers: Record<string, string>;
    data: any;
    responseTime: number;
}