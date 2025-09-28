// src/components/Submissions.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteCookie, getCookie } from '../utils/cookies';
import {jwtDecode} from "jwt-decode";
import { authAPI } from '../services/api';
import { useAppDispatch } from '../store/hooks';
import { clearAuth } from '../store/authSlice';


const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function Submissions() {
    const [submissions, setSubmissions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate(); // Hook for navigation

        const dispatch = useAppDispatch();
    

    const userJson = getCookie('token');
    let decoded = null;
    if(userJson){
        decoded = jwtDecode(userJson);
    } else {
        navigate('/')
    }
    console.log(decoded)


    

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                const resp = await fetch(`${apiBase}/api/submissions`);
                if (!resp.ok) {
                    throw new Error(`HTTP error! status: ${resp.status}`);
                }
                const data = await resp.json();
                console.log("&&&&&&&&&&&&&&&&")
                console.log(data.items);
                console.log("&&&&&&&&&&&&&&&&")
                setSubmissions(data.items);
            } catch (err) {
                console.error('Fetch error:', err);
                setError('Failed to load submissions.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchSubmissions();
    }, []);

    // Function to navigate back to the home/validation page
    const goToValidator = () => {
        navigate('/');
    };

    if (isLoading) {
        return <div className="card">Loading submissions...</div>;
    }

    if (error) {
        return <div className="card error">{error}</div>;
    }

    const goToIndividualSubmission = (id) => {
        navigate(`/submissions/${id}`);
    }

    const handleLogout = async () => {
            try {
              await authAPI.logout();
        
              // Clear cookies on the frontend
              deleteCookie('token');
        
              dispatch(clearAuth());
              navigate('/');
    
            } catch (err) {
              // Even if logout fails on server, clear local state and cookies
              deleteCookie('token');
              dispatch(clearAuth());
            }
          };

    if(!decoded) {
        navigate('/')
    }
    
    return (
        <div className="card">
            <h2>All Submissions 📜</h2>
            <button onClick={goToValidator}>Validate Code</button>
            <button onClick={handleLogout}>Logout</button>
            
            
            <div className="submissions-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '16px',
                marginTop: '16px'
            }}>
                {submissions
                    .filter(sub => decoded?.role === 'teacher' || sub.username === decoded?.username)
                    .map((sub) => (
                        <div key={sub._id} className="submission-card" style={{
                                border: sub.ok ? '1px solid #4CAF50' : '1px solid #F44336',
                                padding: '10px',
                                borderRadius: '4px',
                                backgroundColor: sub.ok ? '#E8F5E9' : '#FFEBEE',
                                wordWrap: 'break-word',
                        }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#333' }}>
                                        Status: <span style={{ color: sub.ok ? '#4CAF50' : '#F44336' }}>
                                                {sub.ok ? 'OK' : 'ERRORS'}
                                        </span>
                                </div>
                                <div style={{ fontSize: '0.9em', color: '#666' }}>
                                        Submitted: {new Date(sub.createdAt).toLocaleString()}
                                </div>
                                <div style={{ fontSize: '0.9em', color: '#666' }}>
                                     {sub.username}
                                </div>
                                <button onClick={() => goToIndividualSubmission(sub._id)}>Expand</button>
                                {sub.errorCount > 0 && (
                                        <div style={{ color: '#F44336', fontSize: '0.9em', marginTop: '4px' }}>
                                                {sub.errorCount} Error(s)
                                        </div>
                                )}
                                <pre style={{ 
                                        backgroundColor: '#f8f8f8', 
                                        padding: '8px', 
                                        borderRadius: '2px',
                                        marginTop: '8px',
                                        color: '#000000',
                                        whiteSpace: 'pre-wrap',
                                        fontSize: '0.8em'
                                }}>
                                        {sub.source.substring(0, 150)}...
                                </pre>
                        </div>
                ))}

                {decoded?.role === 'instructor' && submissions.map((sub) => (
                    <div key={sub._id} className="submission-card" style={{
                        border: sub.ok ? '1px solid #4CAF50' : '1px solid #F44336',
                        padding: '10px',
                        borderRadius: '4px',
                        backgroundColor: sub.ok ? '#E8F5E9' : '#FFEBEE',
                        wordWrap: 'break-word',
                    }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#333' }}>
                            Status: <span style={{ color: sub.ok ? '#4CAF50' : '#F44336' }}>
                                {sub.ok ? 'OK' : 'ERRORS'}
                            </span>
                        </div>
                        <div style={{ fontSize: '0.9em', color: '#666' }}>
                            Submitted: {new Date(sub.createdAt).toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.9em', color: '#666' }}>
                            {sub.username}
                        </div>
                        <button onClick={() => goToIndividualSubmission(sub._id)}>Expand</button>
                        {sub.errorCount > 0 && (
                            <div style={{ color: '#F44336', fontSize: '0.9em', marginTop: '4px' }}>
                                {sub.errorCount} Error(s)
                            </div>
                        )}
                        <pre style={{ 
                            backgroundColor: '#f8f8f8', 
                            padding: '8px', 
                            borderRadius: '2px',
                            marginTop: '8px',
                            color: '#000000',
                            whiteSpace: 'pre-wrap',
                            fontSize: '0.8em'
                        }}>
                            {sub.source.substring(0, 150)}...
                        </pre>
                    </div>
                ))}
                
            </div>
            {submissions.length === 0 && (
                <div style={{ marginTop: '20px', color: '#888' }}>
                    No submissions found yet.
                </div>
            )}
        </div>
    );
}