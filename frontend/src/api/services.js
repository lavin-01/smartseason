import api from './axios';

// Auth
export const login = (email, password) =>
  api.post('/auth/login', { email, password });

export const register = (name, email, password, role) =>
  api.post('/auth/register', { name, email, password, role });

export const getMe = () => api.get('/auth/me');
export const getAgents = () => api.get('/auth/agents');

// Fields
export const getFields = () => api.get('/fields');
export const getField = (id) => api.get(`/fields/${id}`);
export const createField = (data) => api.post('/fields', data);
export const updateField = (id, data) => api.put(`/fields/${id}`, data);
export const deleteField = (id) => api.delete(`/fields/${id}`);
export const getFieldsSummary = () => api.get('/fields/stats/summary');

// Updates
export const addFieldUpdate = (fieldId, data) =>
  api.post(`/fields/${fieldId}/updates`, data);
export const getRecentUpdates = (limit = 10) =>
  api.get(`/updates/recent?limit=${limit}`);
