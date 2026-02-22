import React, { createContext, useContext, useEffect, useState } from 'react';
import api, { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [id, setId] = useState(null);
  const [username, setUsername] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role');
    const storedId = localStorage.getItem('id');
    const storedUsername = localStorage.getItem('username');
    const storedProfilePicture = localStorage.getItem('profilePicture');
    if (storedToken) {
      setAuthToken(storedToken);
      setToken(storedToken);
      setRole(storedRole);
      setId(storedId);
      setUsername(storedUsername);
      setProfilePicture(storedProfilePicture);
      setUser({ token: storedToken, profilePicture: storedProfilePicture });
    }
    setLoading(false);
  }, []);

  const setAuthToken = (newToken) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
    if (newToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  };

  const fetchUserProfileAndStore = async () => {
    const userResponse = await api.get('/profile');
    const userData = userResponse.data;

    // Store role and id in state and localStorage
    setRole(userData.role);
    setId(userData.id);
    setUsername(userData.username);
    setProfilePicture(userData.profilePicture || '');
    localStorage.setItem('role', userData.role);
    localStorage.setItem('id', userData.id);
    localStorage.setItem('username', userData.username);
    localStorage.setItem('profilePicture', userData.profilePicture || '');
    setUser(userData);

    return userData;
  };

  const login = async (formData) => {
    try {
      const response = await authAPI.login({
        email: formData.email,
        password: formData.password,
      });

      if (response.data.token) {
        const token = response.data.token;

        setToken(token);
        localStorage.setItem('token', token);

        // Store user data from login response
        if (response.data.id) {
          setId(response.data.id);
          localStorage.setItem('id', response.data.id);
        }
        if (response.data.role) {
          setRole(response.data.role);
          localStorage.setItem('role', response.data.role);
        }
        if (response.data.username) {
          setUsername(response.data.username);
          localStorage.setItem('username', response.data.username);
        }
        if (response.data.profilePicture) {
          setProfilePicture(response.data.profilePicture);
          localStorage.setItem('profilePicture', response.data.profilePicture);
        }

        // Fetch profile and store role/id
        const userData = await fetchUserProfileAndStore();
        console.log("trying for role selection ");
        // Redirect based on role
        if (userData.role === 'USER') {
          console.log("1112");
          //navigate('/role-selection');
          return { success: true, roleselectionneeded: true };
        } else {
          console.log("2221");
          //navigate('/dashboard');
          return { success: true, roleselectionneeded: false };
        }


      } else {
        return { success: false, error: response.data.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed. Please try again.',
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);

      if (response.data.token) {
        const token = response.data.token;
        setToken(token);
        localStorage.setItem('token', token);


        // Fetch profile and store role/id
        const userData = await fetchUserProfileAndStore();

        console.log("trying roleselection");

        window.location.href = '/role-selection';
        // Redirect to role selection (since after register user should select role)

      }
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setRole(null);
    setId(null);
    setUsername(null);
    setProfilePicture(null);
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('id');
    localStorage.removeItem('username');
    localStorage.removeItem('profilePicture');
    window.location.href = '/login';
  };

  const value = {
    user,
    setUser,
    setAuthToken,
    token,
    username,
    profilePicture,
    role,
    id,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    fetchUserProfileAndStore,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;
