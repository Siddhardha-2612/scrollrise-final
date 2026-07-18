const fs = require('fs');

const code = `export const getToken = () => {
  return localStorage.getItem('booran_token') || sessionStorage.getItem('booran_token') || '';
};

const headers = () => ({
  'Content-Type': 'application/json',
  'Authorization': 'Bearer ' + getToken()
});

export const api = {
  getFlashes: () => fetch('/api/flashes', { headers: headers() }).then(res => res.json()),
  createFlash: (data: any) => fetch('/api/flashes', { method: 'POST', headers: headers(), body: JSON.stringify(data) }).then(res => res.json()),
  deleteFlash: (id: string) => fetch('/api/flashes/' + id, { method: 'DELETE', headers: headers() }).then(res => res.json()),

  getConnections: () => fetch('/api/connections', { headers: headers() }).then(res => res.json()),
  requestConnection: (toUser: string) => fetch('/api/connections/request', { method: 'POST', headers: headers(), body: JSON.stringify({ toUser }) }).then(res => res.json()),
  
  getMessages: (otherUser: string) => fetch('/api/messages/' + otherUser, { headers: headers() }).then(res => res.json()),
  sendMessage: (data: any) => fetch('/api/messages', { method: 'POST', headers: headers(), body: JSON.stringify(data) }).then(res => res.json()),
  
  getGroups: () => fetch('/api/groups', { headers: headers() }).then(res => res.json()),
  createGroup: (data: any) => fetch('/api/groups', { method: 'POST', headers: headers(), body: JSON.stringify(data) }).then(res => res.json()),
  
  getSales: () => fetch('/api/sales', { headers: headers() }).then(res => res.json()),
  createSale: (data: any) => fetch('/api/sales', { method: 'POST', headers: headers(), body: JSON.stringify(data) }).then(res => res.json()),
  deleteSale: (id: string) => fetch('/api/sales/' + id, { method: 'DELETE', headers: headers() }).then(res => res.json()),
  
  getShopi: () => fetch('/api/shopi', { headers: headers() }).then(res => res.json()),
  createShopi: (data: any) => fetch('/api/shopi', { method: 'POST', headers: headers(), body: JSON.stringify(data) }).then(res => res.json()),
  deleteShopi: (id: string) => fetch('/api/shopi/' + id, { method: 'DELETE', headers: headers() }).then(res => res.json()),
  
  reportItem: (data: any) => fetch('/api/reports', { method: 'POST', headers: headers(), body: JSON.stringify(data) }).then(res => res.json()),
};`;

fs.writeFileSync('src/services/api.ts', code);
