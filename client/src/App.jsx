// App.jsx
import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from './store/hooks';
import { setAuth } from './store/authSlice';
import { getCookie } from './utils/cookies';
import Auth from './components/Auth';
import './App.css';
import Validation from './components/Validation';
import { jwtDecode } from 'jwt-decode';
import Submissions from './components/Submissions';

const App = () => {
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((state) => state.auth);
  const [bootstrapped, setBootstrapped] = useState(false);

  const cookieToken = getCookie('token');
  let decoded = null;
  if(cookieToken) {
    decoded = jwtDecode(cookieToken);
  }

  useEffect(() => {
    
    // const userJson = getCookie('user');

    console.log('Cookie token:', cookieToken);
    // console.log('Cookie user:', userJson);

    // let user = null;
    // if (userJson) {
    //   try {
    //     user = JSON.parse(userJson);
    //   } catch {
    //     user = null;
    //   }
    // }

    // if (cookieToken) {
    //   dispatch(setAuth({ token: cookieToken, user: user ?? null }));
    // }
    setBootstrapped(true);
  }, [dispatch]);

  if (!bootstrapped) return null;

  return <div className="App">{decoded ? (decoded.role==="instructor" ? <Submissions /> : <Validation />) : <Auth />}</div>;
};

export default App;