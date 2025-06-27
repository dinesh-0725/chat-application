import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MenuOutlined, CloseOutlined } from '@ant-design/icons';
import { signIn } from '../UserReducer';
import { useDispatch } from 'react-redux';
import './Auth.css';
import { backend_url } from '../constants';

const Auth = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 500);
  const history = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 500);
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const validateInputs = (): boolean => {
    if (!username || !password) {
      alert('Invalid details: Username and password cannot be empty');
      return false;
    }
    return true;
  };

  const register = async () => {
    if (!validateInputs()) return;

    const response = await fetch(`${backend_url}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `username=${username}&password=${password}`,
    });

    if (response.ok) {
      alert('User registered successfully');
      setIsLoginMode(true);
    } else {
      alert('Registration failed');
    }
  };

  const login = async () => {
    if (!validateInputs()) return;

    const response = await fetch(`${backend_url}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `username=${username}&password=${password}`,
    });

    if (response.ok) {
      dispatch(signIn({ email: username }));
      history('/chat');
    } else {
      alert('Login failed');
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      <header>
        <nav className="navbar">
          <h2 className="navbar-title"><u>Chat Application</u></h2>
          <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
            <ul>
              <li><a href="#home">Home</a></li>
              <li><a href="#about">About Us</a></li>
              <li><a href="#contact">Contact Us</a></li>
            </ul>
          </div>
          {/* <input type="text" className="search-box" placeholder="Search..." /> */}
          <div className="menu-icon" onClick={toggleMenu}>
            {isMenuOpen ? <CloseOutlined /> : <MenuOutlined />}
          </div>
        </nav>
      </header>

      <div className='whole-div'>
        <h1><u>{isLoginMode ? 'Login' : 'Register'}</u></h1>

        <div className="input-container">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder=""
            type="text"
            required
          />
          <label className="input-label">Username</label>
        </div>

        <div className="input-container">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder=""
            required
          />
          <label className="input-label">Password</label>
        </div>

        {isLoginMode ? (
          <>
            <button onClick={login}>Login</button>
            <p style={{ marginLeft: '30px', marginTop:'40px' }}>
              <span
                style={{ color: 'white', textDecoration: 'underline', cursor: 'pointer' }}
                onClick={() => setIsLoginMode(false)}
                className='signlinks2'
              >
                Don't have an account? Sign up
              </span>
            </p>
          </>
        ) : (
          <>
            <button onClick={register}>Register</button>
            <p>
              <span
                style={{ color: 'white', textDecoration: 'underline', cursor: 'pointer' }}
                onClick={() => setIsLoginMode(true)}
              >
                <a className="signlinks2">Already have an account? Login</a>
              </span>
            </p>
          </>
        )}

      </div>

      <div className='sign-links'>
        {isLoginMode ? (
          <a href="#" className="btns signup" onClick={() => setIsLoginMode(false)}>
            <p>Signup</p>
          </a>
        ) : (
          <a href="#" className="btns signup" onClick={() => setIsLoginMode(true)}>
            <p>Login</p>
          </a>
        )}
        <a href="#" className="btns"><p>Forget <br /> Password</p></a>
      </div>

      <footer className="footer" style={{ position: 'fixed' }}>
        <p><u>&copy; {new Date().getFullYear()} Chat Application. All rights reserved.</u></p>
      </footer>
    </>
  );
};

export default Auth;
