import React, { useState } from 'react';
import SignIn from './SignIn';
import SignUp from './SignUp';

const Auth = () => {
  const [isSignIn, setIsSignIn] = useState(true);

  const toggleMode = () => {
    setIsSignIn(!isSignIn);
  };

  return (
    <div>
      {isSignIn ? (
        <SignIn onToggleMode={toggleMode} />
      ) : (
        <SignUp onToggleMode={toggleMode} />
      )}
    </div>
  );
};

export default Auth;