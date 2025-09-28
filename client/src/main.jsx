import React from 'react'
import { createRoot } from 'react-dom/client'
import './App.css'
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import App from './App.jsx'
import { Provider } from 'react-redux';
import Submissions from './components/Submissions.jsx';
import IndividualSubmission from './components/IndividualSubmission.jsx';
import { store } from './store/index.js';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 1. Wrap the App with BrowserRouter */}
    <Provider store={store}>
      <BrowserRouter> 
      {/* 2. Define the Routes */}
      <Routes>
        {/* Route for the main validator page */}
        <Route path="/" element={<App />} /> 
        <Route path="/example" element={<h1>Hello</h1>} />
        {/* Route for the submissions page */}
        <Route path="/submissions" element={<Submissions />} /> 
        <Route path="/submissions/:id" element={<IndividualSubmission />} /> 
        {/* Optional: Add a 404/catch-all route */}
      </Routes>
    </BrowserRouter>
    </Provider>
  </React.StrictMode>,
)
