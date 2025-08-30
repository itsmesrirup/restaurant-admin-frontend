import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'react-hot-toast';

// --- Centralized API Client ---
// Get the base URL from environment variables once.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// This reusable API client can be imported and used anywhere in the app.
export const apiClient = {
    // A helper function to handle API responses and errors consistently.
    handleResponse: async (response) => {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
            throw new Error(errorData.message || 'A network error occurred.');
        }
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return response.json();
        }
        return response.text(); // For DELETE requests that might not return JSON
    },

    // A helper to get the current authentication headers.
    getAuthHeaders: () => {
        const token = localStorage.getItem('token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    },
    
    // Define the HTTP methods. They all use the API_BASE_URL.
    get: async function(path) {
        const response = await fetch(`${API_BASE_URL}${path}`, { headers: this.getAuthHeaders() });
        return this.handleResponse(response);
    },
    post: async function(path, body) {
        const response = await fetch(`${API_BASE_URL}${path}`, { method: 'POST', headers: this.getAuthHeaders(), body: JSON.stringify(body) });
        return this.handleResponse(response);
    },
    patch: async function(path, body) {
        const response = await fetch(`${API_BASE_URL}${path}`, { method: 'PATCH', headers: this.getAuthHeaders(), body: JSON.stringify(body) });
        return this.handleResponse(response);
    },
    put: async function(path, body) {
        const response = await fetch(`${API_BASE_URL}${path}`, { method: 'PUT', headers: this.getAuthHeaders(), body: JSON.stringify(body) });
        return this.handleResponse(response);
    },
    delete: async function(path) {
        const response = await fetch(`${API_BASE_URL}${path}`, { method: 'DELETE', headers: this.getAuthHeaders() });
        return this.handleResponse(response);
    }
};

// --- Auth Context Setup ---
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // Tracks initial user fetch

    useEffect(() => {
        const fetchUserOnLoad = async () => {
            const currentToken = localStorage.getItem('token');
            if (currentToken) {
                try {
                    const userData = await apiClient.get('/api/users/me');
                    setUser(userData);
                } catch (error) {
                    console.error("Auth token is invalid, logging out:", error);
                    logout();
                }
            }
            setIsLoading(false);
        };
        fetchUserOnLoad();
    }, [token]);

    const login = async (email, password) => {
        // Login is a special case since it doesn't use an auth token
        const response = await fetch(`${API_BASE_URL}/api/auth/authenticate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await apiClient.handleResponse(response);
        if (data.token) {
            localStorage.setItem('token', data.token);
            setToken(data.token); // This will trigger the useEffect to fetch the user
            toast.success('Login successful!');
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const authValue = { token, user, isLoading, login, logout };

    return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthContext);
};