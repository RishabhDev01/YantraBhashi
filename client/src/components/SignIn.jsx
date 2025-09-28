import React, { useState } from 'react';
import { useAppDispatch } from '../store/hooks';
import { setAuth } from '../store/authSlice';
import { authAPI } from '../services/api';
import { setCookie } from '../utils/cookies';

const SignIn = ({ onToggleMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dispatch = useAppDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.signin(email, password);

      // Set user cookie for persistence across tabs/refreshes
      setCookie('user', JSON.stringify(response.user), 7);

      dispatch(setAuth(response));
    } catch (err) {
      setError(err.response?.data?.error || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h2>Sign In</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        {error && (
          <div style={{ color: 'red', marginBottom: '15px' }}>
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        Don't have an account?{' '}
        <button
          onClick={onToggleMode}
          style={{
            background: 'none',
            border: 'none',
            color: '#007bff',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          Sign Up
        </button>
      </p>
    </div>
  );
};

export default SignIn;