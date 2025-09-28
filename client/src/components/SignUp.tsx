import React, { useState } from 'react';
import { useAppDispatch } from '../store/hooks';
import { setAuth } from '../store/authSlice';
import { authAPI } from '../services/api';
import { setCookie } from '../utils/cookies';

interface SignUpProps {
  onToggleMode: () => void;
}

const SignUp: React.FC<SignUpProps> = ({ onToggleMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
    const [role, setRole] = useState('student');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dispatch = useAppDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        email,
        password,
        username,
        role
      };
      console.log("################")
      console.log(payload)
      const response = await authAPI.signup(
        email,
        password,
        username,
        role);

      // setCookie('user', JSON.stringify(response.user), 7);
      dispatch(setAuth(response));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setLoading(true);
  //   setError('');

  //   if (password !== confirmPassword) {
  //     setError('Passwords do not match');
  //     setLoading(false);
  //     return;
  //   }

  //   if (password.length < 6) {
  //     setError('Password must be at least 6 characters');
  //     setLoading(false);
  //     return;
  //   }

  //   try {
  //     const response = await authAPI.signup(email, password);

  //     // Set user cookie for persistence across tabs/refreshes
  //     setCookie('user', JSON.stringify(response.user), 7);

  //     dispatch(setAuth(response));
  //   } catch (err: any) {
  //     setError(err.response?.data?.error || 'Sign up failed');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h2>Sign Up</h2>
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
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => {
              const val = e.target.value;
              if (/^[a-zA-Z0-9]*$/.test(val)) setUsername(val);
            }}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            placeholder="Alphanumeric only"
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="role">Role:</label>
          <select
            id="role"
            value={role || 'student'}
            onChange={(e) => setRole(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          >
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}></div>
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
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Signing Up...' : 'Sign Up'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        Already have an account?{' '}
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
          Sign In
        </button>
      </p>
    </div>
  );
};

export default SignUp;