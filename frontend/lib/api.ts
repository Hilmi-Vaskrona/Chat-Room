// API client helper for Chat Room Frontend
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApiResponse<T = any> {
  statusCode?: number;
  message: string;
  data: T;
  error?: string;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('chat_room_token');
}

export function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('chat_room_token', token);
  }
}

export function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('chat_room_token');
    localStorage.removeItem('chat_room_user');
  }
}

export function getStoredUser(): any | null {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('chat_room_user');
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
}

export function setStoredUser(user: any): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('chat_room_user', JSON.stringify(user));
  }
}

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    let errorMessage = data.message || 'Terjadi kesalahan pada server';
    if (Array.isArray(errorMessage)) {
      errorMessage = errorMessage.join(', ');
    }
    const err: any = new Error(errorMessage);
    err.statusCode = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  auth: {
    register: (payload: {
      username: string;
      display_name: string;
      email: string;
      password: string;
    }) =>
      request<ApiResponse<{ user: any; access_token: string }>>(
        '/api/auth/register',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
      ),
    login: (payload: { identifier: string; password: string }) =>
      request<ApiResponse<{ user: any; access_token: string }>>(
        '/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
      ),
    logout: () =>
      request<ApiResponse<null>>('/api/auth/logout', {
        method: 'POST',
      }),
  },
  users: {
    getMe: () => request<ApiResponse<any>>('/api/users/me'),
    updateProfile: (payload: { display_name?: string; bio?: string }) =>
      request<ApiResponse<any>>('/api/users/me', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    search: (username: string) =>
      request<ApiResponse<any[]>>(`/api/users/search?username=${encodeURIComponent(username)}`),
    getById: (id: string) => request<ApiResponse<any>>(`/api/users/${id}`),
  },
  contacts: {
    getAll: () => request<ApiResponse<any[]>>('/api/contacts'),
    add: (username: string) =>
      request<ApiResponse<any>>('/api/contacts', {
        method: 'POST',
        body: JSON.stringify({ username }),
      }),
    remove: (id: string) =>
      request<ApiResponse<null>>(`/api/contacts/${id}`, {
        method: 'DELETE',
      }),
  },
  groups: {
    getAll: () => request<ApiResponse<any[]>>('/api/groups'),
    create: (name: string) =>
      request<ApiResponse<any>>('/api/groups', {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    getDetails: (id: string) => request<ApiResponse<any>>(`/api/groups/${id}`),
    updateName: (id: string, name: string) =>
      request<ApiResponse<any>>(`/api/groups/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      }),
    getMembers: (id: string) =>
      request<ApiResponse<any[]>>(`/api/groups/${id}/members`),
    changeRole: (groupId: string, userId: string, role: 'admin' | 'member') =>
      request<ApiResponse<any>>(`/api/groups/${groupId}/members/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }),
    createInvite: (groupId: string, expires_in_hours?: number) =>
      request<ApiResponse<any>>(`/api/groups/${groupId}/invite`, {
        method: 'POST',
        body: JSON.stringify({ expires_in_hours }),
      }),
    getMessages: (groupId: string, limit: number = 50, before?: string) => {
      let q = `/api/groups/${groupId}/messages?limit=${limit}`;
      if (before) q += `&before=${encodeURIComponent(before)}`;
      return request<ApiResponse<any[]>>(q);
    },
  },
  invite: {
    getInfo: (code: string) => request<ApiResponse<any>>(`/api/invite/${code}`),
    join: (code: string) =>
      request<ApiResponse<any>>(`/api/invite/${code}/join`, {
        method: 'POST',
      }),
  },
  mentions: {
    getAll: () => request<ApiResponse<any[]>>('/api/mentions'),
    markAsRead: (id: string) =>
      request<ApiResponse<any>>(`/api/mentions/${id}/read`, {
        method: 'PATCH',
      }),
  },
};
