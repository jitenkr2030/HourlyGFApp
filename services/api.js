import axios from 'axios';

const API_URL = 'https://yourapi.com/api';

export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Add more functions for signup, booking, etc.
