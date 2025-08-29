import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

// This is a helper function to create an API client that includes the auth token
const createApiClient = (token) => {
    const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    const handleResponse = async (response) => {
        if (!response.ok) throw new Error('Network response was not ok');
        // Handle cases where response might be empty (e.g., DELETE)
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return response.json();
        }
        return response.text();
    };

    return {
        get: async (url) => {
            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            return handleResponse(response);
        },
        post: async (url, body) => {
            const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
            return handleResponse(response);
        },
        put: async (url, body) => {
            const response = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(body) });
            return handleResponse(response);
        },
        patch: async (url, body) => {
             const response = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(body) });
             return handleResponse(response);
        },
        delete: async (url) => {
             const response = await fetch(url, { method: 'DELETE', headers });
             return handleResponse(response);
        }
    };
};

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(null); // State for user profile
    const [api, setApi] = useState(() => createApiClient(token));

    useEffect(() => {
        const fetchUser = async () => {
            if (token) {
                const apiClient = createApiClient(token);
                setApi(apiClient);
                try {
                    const userData = await apiClient.get(`${import.meta.env.VITE_API_BASE_URL}/api/users/me`);
                    setUser(userData);
                } catch (error) {
                    console.error("Failed to fetch user, token might be invalid", error);
                    logout(); // Log out if token is bad
                }
            } else {
                setUser(null);
                setApi(createApiClient(null));
            }
        };
        fetchUser();
    }, [token]);

    const login = (newToken) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    // Include user and the api client in the context value
    const authValue = { token, user, api, login, logout };

    return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthContext);
};