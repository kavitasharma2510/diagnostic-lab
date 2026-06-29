import apiClient from '../api/client';
import { mediaUrl } from '../config/api';

export const testCategoryService = {
    list: (params) => apiClient.get('/test-categories', { params }),
    get: (id) => apiClient.get(`/test-categories/${id}`),
    create: (data) => apiClient.post('/test-categories', data),
    update: (id, data) => apiClient.put(`/test-categories/${id}`, data),
    delete: (id) => apiClient.delete(`/test-categories/${id}`),
};

export const labTestService = {
    list: (params) => apiClient.get('/lab-tests', { params }),
    get: (id) => apiClient.get(`/lab-tests/${id}`),
    create: (data) => apiClient.post('/lab-tests', data),
    update: (id, data) => apiClient.put(`/lab-tests/${id}`, data),
    delete: (id) => apiClient.delete(`/lab-tests/${id}`),
    createParameter: (testId, data) => apiClient.post(`/lab-tests/${testId}/parameters`, data),
    updateParameter: (id, data) => apiClient.put(`/parameters/${id}`, data),
    deleteParameter: (id) => apiClient.delete(`/parameters/${id}`),
};

export const profileService = {
    list: (params) => apiClient.get('/profiles', { params }),
    get: (id) => apiClient.get(`/profiles/${id}`),
    create: (data) => apiClient.post('/profiles', data),
    update: (id, data) => apiClient.put(`/profiles/${id}`, data),
    delete: (id) => apiClient.delete(`/profiles/${id}`),
    syncTests: (id, tests) => apiClient.post(`/profiles/${id}/sync-tests`, { tests }),
};

export const patientService = {
    list: (params) => apiClient.get('/patients', { params }),
    get: (id) => apiClient.get(`/patients/${id}`),
    create: (data) => apiClient.post('/patients', data),
    update: (id, data) => apiClient.put(`/patients/${id}`, data),
    delete: (id) => apiClient.delete(`/patients/${id}`),
};

export const registrationService = {
    register: (data) => apiClient.post('/registrations', data),
};

export const billService = {
    list: (params) => apiClient.get('/bills', { params }),
    get: (id) => apiClient.get(`/bills/${id}`),
    create: (data) => apiClient.post('/bills', data),
    update: (id, data) => apiClient.put(`/bills/${id}`, data),
    delete: (id) => apiClient.delete(`/bills/${id}`),
};

export const sampleCollectionService = {
    listPending: (params) => apiClient.get('/samples/pending', { params }),
    collect: (data) => apiClient.post('/samples/collect', data),
    list: (params) => apiClient.get('/samples/collected', { params }),
    get: (id) => apiClient.get(`/samples/${id}`),
    reject: (id, data) => apiClient.post(`/samples/${id}/reject`, data),
    updateStatus: (id, data) => apiClient.patch(`/samples/${id}/status`, data),
    barcodeLabel: (id) => apiClient.get(`/samples/${id}/barcode-label`),
};

export const reportService = {
    list: (params) => apiClient.get('/reports', { params }),
    eligibleBills: () => apiClient.get('/reports/eligible-bills'),
    generate: (billId, data) => apiClient.post(`/reports/generate/${billId}`, data),
    get: (id) => apiClient.get(`/reports/${id}`),
    saveResults: (id, data) => apiClient.put(`/reports/${id}/results`, data),
    approve: (id, data) => apiClient.post(`/reports/${id}/approve`, data),
    whatsappLink: (id) => apiClient.get(`/reports/${id}/whatsapp-link`),
    previewUrl: (id) => mediaUrl(`/api/reports/${id}/preview`),
    downloadUrl: (id) => mediaUrl(`/api/reports/${id}/download`),
};
