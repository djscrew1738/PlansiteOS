import axios from 'axios';
import toast from 'react-hot-toast';
import BASE_URL from './baseUrl';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
client.interceptors.request.use(
  config => {
    // Add correlation ID
    config.headers['x-correlation-id'] = crypto.randomUUID();
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor
client.interceptors.response.use(
  response => response.data,
  error => {
    // Only show toast if we got an actual response from the server
    // Don't show errors for network failures (backend not running)
    if (error.response && error.response.status !== 404) {
      const message = error.response?.data?.error || error.message || 'An error occurred';
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export const api = {
  get: (url, config) => client.get(url, config),
  post: (url, data, config) => client.post(url, data, config),
  put: (url, data, config) => client.put(url, data, config),
  delete: (url, config) => client.delete(url, config),
  patch: (url, data, config) => client.patch(url, data, config),
};

export default client;
