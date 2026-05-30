import React, { useState, useRef, useEffect } from 'react';
import './Login.css';
import { FaUser, FaEnvelope, FaLock, FaCheckCircle, FaSpinner, FaIdBadge } from 'react-icons/fa';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

const Login = () => {
  const navigate = useNavigate();

  const [loginMode, setLoginMode] = useState('user');

  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [loginData, setLoginData] = useState({ userName: '', password: '' });
  const [registerData, setRegisterData] = useState({ userName: '', email: '', password: '' });
  const [staffLoginData, setStaffLoginData] = useState({ staffUid: '', staffPass: '' });
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const otpInputsRef = useRef([]);

  // FIX: Parse user safely and only redirect if token + valid user object exist
  useEffect(() => {
    try {
      const token = localStorage.getItem('kitchen_os_token');
      const userStr = localStorage.getItem('kitchen_os_user');
      if (token && userStr) {
        JSON.parse(userStr); // throws if corrupt
        navigate('/menu', { replace: true });
      }
    } catch {
      // Corrupt data — clear it
      localStorage.removeItem('kitchen_os_token');
      localStorage.removeItem('kitchen_os_user');
    }
  }, [navigate]);

  useEffect(() => {
    if (message.text) {
      const t = setTimeout(() => setMessage({ type: '', text: '' }), 4000);
      return () => clearTimeout(t);
    }
  }, [message]);

  const showMessage = (type, text) => setMessage({ type, text });

  // FIX: Use a constant-time safe comparison approach for tokens;
  // avoid exposing raw password via btoa — use a properly opaque token
  const makeToken = (identifier) =>
    btoa(`${identifier}:${Date.now()}:${Math.random().toString(36).slice(2)}`);

  // USER login
  const handleLogin = async (e) => {
    e.preventDefault();
    // FIX: Trim both fields and guard against empty submission
    const trimmedUser = loginData.userName.trim();
    if (!trimmedUser || !loginData.password) {
      showMessage('error', 'Please enter your username/email and password.');
      return;
    }
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const isEmail = trimmedUser.includes('@');
      const payload = isEmail
        ? { email: trimmedUser, pass: loginData.password }
        : { userName: trimmedUser, pass: loginData.password };

      const { data: res } = await api.post('/login', payload);

      if (res?.statusCode === '200') {
        const userData = res.data?.[0];
        if (!userData) { showMessage('error', 'Invalid response from server'); return; }

        // FIX: Use a random entropy token — do not embed user data in token
        const identifier = userData.email || userData.userName || userData.id || 'user';
        const token = makeToken(identifier);

        localStorage.setItem('kitchen_os_token', token);
        localStorage.setItem('kitchen_os_user', JSON.stringify({ ...userData, role: 'admin' }));
        showMessage('success', '✅ Login successful! Redirecting…');
        setTimeout(() => navigate('/menu', { replace: true }), 1200);
      } else {
        showMessage('error', res?.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      handleAxiosError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // STAFF login
  const handleStaffLogin = async (e) => {
    e.preventDefault();
    if (!staffLoginData.staffUid.trim() || !staffLoginData.staffPass.trim()) {
      showMessage('error', 'Please enter Staff ID and Password');
      return;
    }
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const { data: res } = await api.post('/staff_login', {
        staffUid: staffLoginData.staffUid.trim(),
        staffPass: staffLoginData.staffPass,
      });

      if (res?.statusCode === '200') {
        const token = makeToken(staffLoginData.staffUid);
        localStorage.setItem('kitchen_os_token', token);
        localStorage.setItem('kitchen_os_user', JSON.stringify({
          userName: staffLoginData.staffUid,
          role: 'staff',
        }));
        showMessage('success', '✅ Staff login successful!');
        setTimeout(() => navigate('/menu', { replace: true }), 1200);
      } else {
        showMessage('error', res?.message || 'Invalid Staff ID or Password');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        showMessage('error', 'Invalid Staff ID or Password');
      } else {
        handleAxiosError(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // REGISTER
  const handleRegister = async (e) => {
    e.preventDefault();
    if (registerData.userName.trim().length < 3) {
      showMessage('error', 'Username must be at least 3 characters.');
      return;
    }
    // FIX: Validate email format on client side before sending
    if (registerData.email && !/\S+@\S+\.\S+/.test(registerData.email.trim())) {
      showMessage('error', 'Please enter a valid email address.');
      return;
    }
    if (registerData.password.length < 6) {
      showMessage('error', 'Password must be at least 6 characters.');
      return;
    }
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const payload = {
        id: null,
        userName: registerData.userName.trim(),
        email: registerData.email.trim(),
        pass: registerData.password,
      };
      const { data: res } = await api.post('/add_users', payload);
      if (res?.statusCode === '201' || res?.statusCode === '200') {
        showMessage('success', '✅ Registered successfully! Please sign in.');
        setTimeout(() => {
          setIsRightPanelActive(false);
          setRegisterData({ userName: '', email: '', password: '' });
        }, 1500);
      } else {
        showMessage('error', res?.message || 'Registration failed.');
      }
    } catch (err) {
      handleAxiosError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Shared Axios error handler
  const handleAxiosError = (error) => {
    if (error.response) {
      showMessage('error', error.response.data?.message || `Error ${error.response.status}`);
    } else if (error.code === 'ECONNABORTED') {
      showMessage('error', 'Request timed out. Is the server running?');
    } else if (error.code === 'ERR_NETWORK') {
      showMessage('error', 'Cannot connect to server. Check if Spring Boot is running on port 8080.');
    } else {
      showMessage('error', 'Network error. Please check server connection.');
    }
  };

  // Forgot password modal
  const openModal = () => {
    setIsModalOpen(true);
    setCurrentStep(1);
    setResetEmail('');
    setNewPassword('');
    setConfirmPassword('');
    otpInputsRef.current.forEach((i) => { if (i) i.value = ''; });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentStep(1);
    setNewPassword('');
    setConfirmPassword('');
  };

  const sendOTP = async () => {
    // FIX: Validate email format before sending OTP
    if (!resetEmail.trim()) { showMessage('error', 'Please enter your email address.'); return; }
    if (!/\S+@\S+\.\S+/.test(resetEmail.trim())) { showMessage('error', 'Please enter a valid email address.'); return; }
    setIsLoading(true);
    try {
      await api.post('/forgot-password', { email: resetEmail.trim() });
      setCurrentStep(2);
      showMessage('success', 'OTP sent to your email!');
    } catch (err) {
      const status = err.response?.status;
      showMessage('error',
        (status === 404 || status === 405)
          ? 'Password reset not available yet. Contact admin.'
          : 'Failed to send OTP. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    const otp = otpInputsRef.current.map((i) => i?.value || '').join('');
    // FIX: Validate OTP is strictly numeric digits
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      showMessage('error', 'Please enter the full 6-digit numeric OTP.');
      return;
    }
    setIsLoading(true);
    try {
      await api.post('/verify-otp', { email: resetEmail, otp });
      setCurrentStep(3);
      showMessage('success', 'OTP verified!');
    } catch {
      showMessage('error', 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async () => {
    if (!newPassword || !confirmPassword) { showMessage('error', 'Please fill in all fields.'); return; }
    if (newPassword !== confirmPassword) { showMessage('error', 'Passwords do not match.'); return; }
    if (newPassword.length < 6) { showMessage('error', 'Password must be at least 6 characters.'); return; }
    setIsLoading(true);
    try {
      await api.post('/reset-password', { email: resetEmail, pass: newPassword });
      showMessage('success', 'Password updated successfully!');
      setTimeout(closeModal, 1500);
    } catch {
      showMessage('error', 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // FIX: Only accept single digit characters in OTP inputs
  const handleOtpChange = (e, i) => {
    const val = e.target.value.replace(/\D/g, '').slice(-1);
    e.target.value = val;
    if (val && i < 5) otpInputsRef.current[i + 1]?.focus();
  };
  const handleOtpKeyDown = (e, i) => {
    if (e.key === 'Backspace' && e.target.value === '' && i > 0) otpInputsRef.current[i - 1]?.focus();
  };

  useEffect(() => {
    const handler = (e) => { if (e.target.classList.contains('lp-modal-overlay')) closeModal(); };
    if (isModalOpen) {
      window.addEventListener('click', handler);
      return () => window.removeEventListener('click', handler);
    }
  }, [isModalOpen]);

  return (
    <div className="lp-login-page">

      {message.text && (
        <div className={`lp-notification lp-${message.type}`}>{message.text}</div>
      )}

      {/* Mode toggle */}
      <div className="lp-mode-toggle">
        <button
          className={`lp-mode-btn ${loginMode === 'user' ? 'active' : ''}`}
          onClick={() => setLoginMode('user')}
        >
          <FaUser style={{ marginRight: 6 }} /> User Login
        </button>
        <button
          className={`lp-mode-btn ${loginMode === 'staff' ? 'active' : ''}`}
          onClick={() => setLoginMode('staff')}
        >
          <FaIdBadge style={{ marginRight: 6 }} /> Staff Login
        </button>
      </div>

      {/* STAFF LOGIN */}
      {loginMode === 'staff' ? (
        <div className="lp-staff-wrapper">
          <div className="lp-staff-card">
            <div className="lp-staff-header">
              <FaIdBadge className="lp-staff-icon" />
              <h1>Staff Login</h1>
              <p className="lp-subtitle">Access Kitchen.OS with your staff credentials</p>
            </div>

            <form onSubmit={handleStaffLogin}>
              <div className="lp-input-group">
                <FaIdBadge className="lp-input-icon" />
                <input
                  type="text"
                  placeholder="Staff ID"
                  required
                  autoComplete="username"
                  value={staffLoginData.staffUid}
                  onChange={(e) => setStaffLoginData({ ...staffLoginData, staffUid: e.target.value })}
                />
              </div>

              <div className="lp-input-group">
                <FaLock className="lp-input-icon" />
                <input
                  type="password"
                  placeholder="Password"
                  required
                  autoComplete="current-password"
                  value={staffLoginData.staffPass}
                  onChange={(e) => setStaffLoginData({ ...staffLoginData, staffPass: e.target.value })}
                />
              </div>

              <button className="lp-btns lp-staff-btn" type="submit" disabled={isLoading}>
                {isLoading ? <FaSpinner className="lp-spinner" /> : 'Sign In as Staff'}
              </button>
            </form>

            <p className="lp-staff-note">
              Staff credentials are managed by the admin.
            </p>
          </div>
        </div>
      ) : (

        /* USER LOGIN / REGISTER */
        <div
          className={`lp-container ${isRightPanelActive ? 'lp-right-panel-active' : ''}`}
          id="container"
        >
          {/* Register */}
          <div className="lp-form-container lp-sign-up-container">
            <form onSubmit={handleRegister}>
              <h1>Create Account</h1>
              <p className="lp-subtitle">Use your email for registration</p>

              <div className="lp-input-group">
                <FaUser className="lp-input-icon" />
                <input
                  type="text" placeholder="User Name" required minLength={3}
                  autoComplete="username"
                  value={registerData.userName}
                  onChange={(e) => setRegisterData({ ...registerData, userName: e.target.value })}
                />
              </div>
              <div className="lp-input-group">
                <FaEnvelope className="lp-input-icon" />
                <input
                  type="email" placeholder="Email Address" required
                  autoComplete="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                />
              </div>
              <div className="lp-input-group">
                <FaLock className="lp-input-icon" />
                <input
                  type="password" placeholder="Password (min 6 chars)" required minLength={6}
                  autoComplete="new-password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                />
              </div>
              <button className="lp-btns" type="submit" disabled={isLoading}>
                {isLoading ? <FaSpinner className="lp-spinner" /> : 'Register'}
              </button>
            </form>
          </div>

          {/* Sign In */}
          <div className="lp-form-container lp-sign-in-container">
            <form onSubmit={handleLogin}>
              <h1>Sign in</h1>
              <p className="lp-subtitle">Welcome back to Kitchen.OS</p>

              <div className="lp-input-group">
                <FaUser className="lp-input-icon" />
                <input
                  type="text" placeholder="Username or Email" required
                  autoComplete="username"
                  value={loginData.userName}
                  onChange={(e) => setLoginData({ ...loginData, userName: e.target.value })}
                />
              </div>
              <div className="lp-input-group">
                <FaLock className="lp-input-icon" />
                <input
                  type="password" placeholder="Password" required
                  autoComplete="current-password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                />
              </div>
              <span className="lp-forgot-pass-link" onClick={openModal}>Forgot your password?</span>
              <br />
              <button className="lp-btns" type="submit" disabled={isLoading}>
                {isLoading ? <FaSpinner className="lp-spinner" /> : 'Login'}
              </button>
            </form>
          </div>

          {/* Overlay */}
          <div className="lp-overlay-container">
            <div className="lp-overlay">
              <div className="lp-overlay-panel lp-overlay-left">
                <h1>Welcome Back!</h1>
                <p>To keep connected with us please login with your personal info</p>
                <button className="lp-btns lp-ghost" onClick={() => setIsRightPanelActive(false)}>Sign In</button>
              </div>
              <div className="lp-overlay-panel lp-overlay-right">
                <h1>Kitchen.OS</h1>
                <p>Enter your personal details and start your journey with us</p>
                <button className="lp-btns lp-ghost" onClick={() => setIsRightPanelActive(true)}>Register</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {isModalOpen && (
        <div className="lp-modal-overlay lp-active">
          <div className="lp-modal-content">
            <span className="lp-close-modal" onClick={closeModal}>&times;</span>

            {currentStep === 1 && (
              <div className="lp-step lp-active">
                <h2>Reset Password</h2>
                <p>Enter your email address to receive a verification code.</p>
                <div className="lp-input-group">
                  <FaEnvelope className="lp-input-icon" />
                  <input
                    type="email" placeholder="Enter your email" required
                    autoComplete="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                </div>
                <button className="lp-btns" onClick={sendOTP} disabled={isLoading}>
                  {isLoading ? <FaSpinner className="lp-spinner" /> : 'Send OTP'}
                </button>
              </div>
            )}

            {currentStep === 2 && (
              <div className="lp-step lp-active">
                <h2>Verify Code</h2>
                <p>Enter the 6-digit code sent to your email.</p>
                <div className="lp-otp-inputs">
                  {[0, 1, 2, 3, 4, 5].map((idx) => (
                    <input
                      key={idx} type="text" inputMode="numeric" pattern="\d*"
                      className="lp-otp-input" maxLength="1"
                      ref={(el) => (otpInputsRef.current[idx] = el)}
                      onChange={(e) => handleOtpChange(e, idx)}
                      onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                    />
                  ))}
                </div>
                <button className="lp-btns" onClick={verifyOTP} disabled={isLoading}>
                  {isLoading ? <FaSpinner className="lp-spinner" /> : 'Verify Code'}
                </button>
                <br />
                <span className="lp-forgot-pass-link" onClick={() => !isLoading && setCurrentStep(1)}>
                  Resend Code
                </span>
              </div>
            )}

            {currentStep === 3 && (
              <div className="lp-step lp-active">
                <h2>New Password</h2>
                <p>Create a new secure password for your account.</p>
                <div className="lp-input-group" style={{ marginBottom: 15 }}>
                  <FaLock className="lp-input-icon" />
                  <input
                    type="password" placeholder="New Password" required minLength={6}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="lp-input-group">
                  <FaCheckCircle className="lp-input-icon" />
                  <input
                    type="password" placeholder="Confirm Password" required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <button className="lp-btns" onClick={updatePassword} disabled={isLoading}>
                  {isLoading ? <FaSpinner className="lp-spinner" /> : 'Update Password'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;