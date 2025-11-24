/**
 * API Service - Handles all backend API calls
 */
const API_BASE_URL = 'http://localhost:3000/credentials';

class ApiService {
  async issueCredential(type, claims) {
    const response = await fetch(`${API_BASE_URL}/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, claims }),
    });
    if (!response.ok) throw new Error('Failed to issue credential');
    return response.json();
  }

  async getAllCredentials() {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) throw new Error('Failed to load credentials');
    return response.json();
  }

  async getCredential(id) {
    const response = await fetch(`${API_BASE_URL}/${id}`);
    if (!response.ok) throw new Error('Failed to load credential');
    return response.json();
  }

  async verifyCredential(credential) {
    const response = await fetch(`${API_BASE_URL}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    });
    if (!response.ok) throw new Error('Failed to verify credential');
    return response.json();
  }

  async deleteCredential(id) {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete credential');
    return response.json();
  }
}

const apiService = new ApiService();

