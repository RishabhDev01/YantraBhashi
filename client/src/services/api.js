import axios from 'axios';

const API_BASE = 'http://localhost:4000';

// Configure axios to include credentials (cookies)
axios.defaults.withCredentials = true;

// User, Todo, AuthResponse interfaces removed for JS

export const authAPI = {
  signup: async (email, password, username, role) => {
    const response = await axios.post(`${API_BASE}/signup`, { email, password, username, role });
    return response.data;
  },

  signin: async (email, password) => {
    const response = await axios.post(`${API_BASE}/signin`, { email, password });
    return response.data;
  },

  logout: async () => {
    await axios.post(`${API_BASE}/logout`);
  },
};

export const todoAPI = {
  getTodos: async () => {
    const response = await axios.get(`${API_BASE}/todos`);
    return response.data;
  },

  createTodo: async (title) => {
    const response = await axios.post(`${API_BASE}/todos`, { title });
    return response.data;
  },

  deleteTodo: async (id) => {
    await axios.delete(`${API_BASE}/todos/${id}`);
  },
};