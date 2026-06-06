import api from './axiosInstance';

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  refresh: (refresh_token) => api.post('/auth/refresh', { refresh_token }),
  logout: () => api.post('/auth/logout'),
};
