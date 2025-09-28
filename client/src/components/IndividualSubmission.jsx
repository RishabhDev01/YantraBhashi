// src/components/IndividualSubmission.jsx (Updated)

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCookie } from '../utils/cookies';
import { jwtDecode } from 'jwt-decode';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function IndividualSubmission() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [submission, setSubmission] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasFeedback, setHasFeedback] = useState(false);
    
    // 💡 New state for instructor feedback
    const [feedback, setFeedback] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    const userJson = getCookie('token');
        let decoded = null;
        if(userJson){
            decoded = jwtDecode(userJson);
        } else {
            navigate('/')
        }
        console.log(decoded)

    const fetchSubmission = async () => {
        setIsLoading(true);
        try {
            const resp = await fetch(`${apiBase}/api/submissions/${id}`);
            if (resp.status === 404) {
                throw new Error('Submission not found.');
            }
            if (!resp.ok) {
                throw new Error(`HTTP error! status: ${resp.status}`);
            }
            const data = await resp.json();
            
            setSubmission(data);
            if(data.feedback) {
               setHasFeedback(true);
            }
            // 💡 Initialize feedback state with existing feedback or empty string
            setFeedback(data.feedback || ''); 
            
        } catch (err) {
            console.error('Fetch error:', err);
            setError(err.message || 'Failed to load submission details.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchSubmission();
        } else {
            setError('No submission ID provided.');
            setIsLoading(false);
        }
    }, [id]);

    // 🚀 Function to save the feedback to the backend
    const saveFeedback = async () => {
        setIsSaving(true);
        setSaveMessage('');
        try {
            // Using PATCH method is common for partial updates
            const resp = await fetch(`${apiBase}/api/submissions/${id}/feedback`, {
                method: 'PUT', // Assuming your backend handles PATCH or PUT for updates
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feedback: feedback }), // Send only the feedback string
            });

            if (!resp.ok) {
                const errorData = await resp.json();
                throw new Error(errorData.message || 'Failed to save feedback.');
            }


            // Update the local submission state with the new feedback
            setSubmission(prev => ({ ...prev, feedback: feedback }));
            setSaveMessage('Feedback saved successfully! ✅');

        } catch (err) {
            console.error('Save error:', err);
            setSaveMessage(`Error: ${err.message}`);
        } finally {
            setIsSaving(false);
            setFeedback('');
            setHasFeedback(true);
        }
    };

    // --- Loading and Error rendering ---
    if (isLoading) {
        return <div className="card">Loading submission details...</div>;
    }
    if (error) {
        return <div className="card error">Error: {error}</div>;
    }
    if (!submission) {
        return <div className="card">Submission data is empty.</div>;
    }
    
    // --- Display variables ---
    const isOk = submission.ok;
    const statusText = isOk ? 'Validation Successful (OK)' : 'Syntax/Semantic Errors Found';
    const statusColor = isOk ? '#4CAF50' : '#F44336';
    // Removed the 'testing' function as it's no longer necessary

    return (
        <div className="card">
            <h2>Submission Details: {submission._id}</h2>
            <button onClick={() => navigate('/submissions')}>Back to All Submissions</button>

            <div style={{ marginTop: '16px', padding: '12px', borderLeft: `5px solid ${statusColor}`, backgroundColor: isOk ? '#E8F5E9' : '#FFEBEE' }}>
                <h3 style={{ margin: 0, color: statusColor }}>{statusText}</h3>
                <p style={{ fontSize: '0.9em', color: '#555' }}>
                    Submitted on: {new Date(submission.createdAt).toLocaleString()} | 
                    Errors Count: {submission.errorCount}
                </p>
            </div>

            {/* Source Code */}
            <h3 style={{ marginTop: '20px' }}>Source Code</h3>
            <pre style={{ backgroundColor: '#333', color: '#f8f8f8', padding: '15px', borderRadius: '4px', overflowX: 'auto' }}>
                {submission.source}
            </pre>

            {/* Errors Section (Unchanged) */}
            {/* {submission.errors.length > 0 && (
                <>
                    </details><h3 style={{ color: '#F44336' }}>Errors ({submission.errorCount})</h3>
                    {submission.errors.map((e, idx) => (
                        <div key={idx} className="error" style={{ marginBottom: '8px', padding: '10px', border: '1px solid #F44336', backgroundColor: '#FFEBEE', color: '#333', borderRadius: '4px' }}>
                            <pre>{`Line ${e.line}, Col ${e.col}: ${e.msg}`}</pre>
                        </div>
                    ))}
                </>
            )} */}

            {submission.errors.length > 0 && (
                <details style={{ marginTop: '20px' }}>
                    {/* The summary acts as the dropdown header */}
                    <summary style={{ color: '#F44336', cursor: 'pointer' }}>
                        View Errors ({submission.errorCount})
                    </summary>
                    
                    {/* The content that is hidden/shown */}
                    <div className="small" style={{ marginTop: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                        {submission.errors.map((e, idx) => (
                            <div key={idx} className="error" style={{ marginBottom: '8px', padding: '10px', border: '1px solid #F44336', backgroundColor: '#FFEBEE', color: '#333', borderRadius: '4px' }}>
                                <pre>{`Line ${e.line}, Col ${e.col}: ${e.msg}`}</pre>
                            </div>
                        ))}
                    </div>
                </details>
            )}

            {/* Tokens Section (Unchanged) */}
            <details style={{ marginTop: '20px' }}>
                <summary>View Tokens ({submission.tokens.length})</summary>
                <div className="small" style={{ marginTop: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                    <pre style={{ backgroundColor: '#eee', padding: '10px', borderRadius: '4px', fontSize: '0.8em' }}>
                        {submission.tokens.map(t => `${t.line}:${t.col} ${t.type}(${t.value})`).join('\n')}
                    </pre>
                </div>
            </details>

            {hasFeedback && <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f9f9f9', border: '1px solid #ddd', borderRadius: '4px' }}>
                <h3 style={{color: '#333'}}>Instructor Feedback</h3>
                <p style={{color: '#4CAF50'}}>instructor username</p>
                <p style={{ whiteSpace: 'pre-wrap', color: '#333' }}>{submission.feedback}</p>
            </div>}
            
            {/* 📝 Instructor Feedback Section */}

            {decoded?.role === 'instructor' && (
                <div style={{ marginTop: '30px', borderTop: '1px solid #ccc', paddingTop: '20px' }}>
                    <h3 style={{ marginBottom: '10px' }}>Instructor Feedback</h3>
                    
                    <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Enter feedback for the student here..."
                        rows="6"
                        style={{
                            width: '100%',
                            padding: '10px',
                            marginBottom: '10px',
                            resize: 'vertical',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                        }}
                    />
                    
                    <button 
                        onClick={saveFeedback} 
                        disabled={isSaving}
                        style={{
                            backgroundColor: '#007bff', 
                            color: 'white', 
                            padding: '10px 15px', 
                            border: 'none', 
                            borderRadius: '4px',
                            cursor: isSaving ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isSaving ? 'Saving...' : 'Save Feedback'}
                    </button>
                    
                    {saveMessage && (
                        <p style={{ marginTop: '10px', color: saveMessage.startsWith('Error') ? '#F44336' : '#4CAF50' }}>
                            {saveMessage}
                        </p>
                    )}
                </div>
            )}
            
            {/* <div style={{ marginTop: '30px', borderTop: '1px solid #ccc', paddingTop: '20px' }}>
                <h3 style={{ marginBottom: '10px' }}>Instructor Feedback</h3>
                
                <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Enter feedback for the student here..."
                    rows="6"
                    style={{
                        width: '100%',
                        padding: '10px',
                        marginBottom: '10px',
                        resize: 'vertical',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                    }}
                />
                
                <button 
                    onClick={saveFeedback} 
                    disabled={isSaving}
                    style={{
                        backgroundColor: '#007bff', 
                        color: 'white', 
                        padding: '10px 15px', 
                        border: 'none', 
                        borderRadius: '4px',
                        cursor: isSaving ? 'not-allowed' : 'pointer'
                    }}
                >
                    {isSaving ? 'Saving...' : 'Save Feedback'}
                </button>
                
                {saveMessage && (
                    <p style={{ marginTop: '10px', color: saveMessage.startsWith('Error') ? '#F44336' : '#4CAF50' }}>
                        {saveMessage}
                    </p>
                )}
            </div> */}
        </div>
    );
}