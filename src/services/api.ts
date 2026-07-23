import { scopedStorage } from '../utils/storage';
import { API_BASE_URL } from '../config';

export const getToken = () => {
  return scopedStorage.getItem('booran_token') || '';
};

const headers = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'Bearer ' + getToken(),
  'X-Username': scopedStorage.getItem('booran_username') || 'User'
});

const handleResponse = async (res: Response) => {
  if (res.status === 401) {
    console.warn('Unauthorized request, ignoring redirect to login screen');
    throw new Error('Unauthorized');
  }

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }

  const text = await res.text();
  if (res.status >= 400) {
    throw new Error(`Server error (${res.status}): ${text.substring(0, 100)}`);
  }

  throw new Error('Expected JSON response but received: ' + (text.startsWith('<!DOCTYPE') ? 'HTML page' : 'text'));
};

const apiFetch = (url: string, options: RequestInit = {}) => {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  return fetch(fullUrl, {
    ...options
  });
};

export const api = {
  getFlashes: () => apiFetch('/api/flashes', { headers: headers() }).then(handleResponse),
  createFlash: (data: any) => apiFetch('/api/flashes', { method: 'POST', headers: headers(), body: JSON.stringify(data) }).then(handleResponse),
  deleteFlash: (id: string) => apiFetch('/api/flashes/' + id, { method: 'DELETE', headers: headers() }).then(handleResponse),
  likeFlash: (id: string) => apiFetch(`/api/flashes/${id}/like`, { method: 'POST', headers: headers() }).then(handleResponse),
  commentFlash: (id: string, text: string) => apiFetch(`/api/flashes/${id}/comment`, { method: 'POST', headers: headers(), body: JSON.stringify({ text }) }).then(handleResponse),

  getPosts: () => apiFetch('/api/posts', { headers: headers() }).then(handleResponse),
  createPost: (data: any) => apiFetch('/api/posts', { method: 'POST', headers: headers(), body: JSON.stringify(data) }).then(handleResponse),
  likePost: (id: string) => apiFetch(`/api/posts/${id}/like`, { method: 'POST', headers: headers() }).then(handleResponse),
  commentPost: (id: string, text: string) => apiFetch(`/api/posts/${id}/comment`, { method: 'POST', headers: headers(), body: JSON.stringify({ text }) }).then(handleResponse),

  getConnections: () => apiFetch('/api/connections', { headers: headers() }).then(handleResponse),
  requestConnection: (toUser: string) => apiFetch('/api/connections/request', { method: 'POST', headers: headers(), body: JSON.stringify({ toUser }) }).then(handleResponse),
  
  getMessages: (otherUser: string) => apiFetch('/api/messages/' + otherUser, { headers: headers() }).then(handleResponse),
  sendMessage: (data: any) => apiFetch('/api/messages', { method: 'POST', headers: headers(), body: JSON.stringify(data) }).then(handleResponse),
  
  getGroups: () => apiFetch('/api/groups', { headers: headers() }).then(handleResponse),
  createGroup: (data: any) => apiFetch('/api/groups', { method: 'POST', headers: headers(), body: JSON.stringify(data) }).then(handleResponse),
  
  getSales: () => apiFetch('/api/sales', { headers: headers() }).then(handleResponse),
  createSale: (data: any) => apiFetch('/api/sales', { method: 'POST', headers: headers(), body: JSON.stringify(data) }).then(handleResponse),
  deleteSale: (id: string) => apiFetch('/api/sales/' + id, { method: 'DELETE', headers: headers() }).then(handleResponse),
  
  getShopi: () => apiFetch('/api/shopi', { headers: headers() }).then(handleResponse),
  createShopi: (data: any) => apiFetch('/api/shopi', { method: 'POST', headers: headers(), body: JSON.stringify(data) }).then(handleResponse),
  deleteShopi: (id: string) => apiFetch('/api/shopi/' + id, { method: 'DELETE', headers: headers() }).then(handleResponse),
  
  reportItem: (data: any) => apiFetch('/api/reports', { method: 'POST', headers: headers(), body: JSON.stringify(data) }).then(handleResponse),

  blockUser: (targetUsername: string) => apiFetch('/api/blocks', { method: 'POST', headers: headers(), body: JSON.stringify({ targetUsername }) }).then(handleResponse),
  unblockUser: (username: string) => apiFetch('/api/blocks/' + username, { method: 'DELETE', headers: headers() }).then(handleResponse),
};
