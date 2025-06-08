import React, { useState } from 'react';
import { getColors, getTextSizes } from '../utils/colorsAndText';

const SignInPage = ({ isDarkMode = false, onSignIn }) => {
  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Mock credentials - in the future this will be handled by backend
  const mockCredentials = {
    email: 'rafi@gmail.com',
    password: '1234'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      if (email === mockCredentials.email && password === mockCredentials.password) {
        // Store session
        sessionStorage.setItem('navaraSignedIn', 'true');
        onSignIn(true);
      } else {
        setError('Invalid email or password. Please try again.');
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      margin: 0,
      padding: 0,
      background: colors.background,
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        margin: '0 20px',
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px',
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
          }}>
            <i className="fas fa-user-md" style={{ fontSize: '32px', color: 'white' }} />
          </div>
          <h1 style={{
            fontSize: textSizes['3xl'].fontSize,
            fontFamily: textSizes['3xl'].fontFamily,
            color: colors.primary,
            margin: 0,
            marginBottom: '8px',
            fontWeight: '700'
          }}>
            Client Portal
          </h1>
          <p style={{
            fontSize: textSizes.lg.fontSize,
            fontFamily: textSizes.lg.fontFamily,
            color: colors.textSecondary,
            margin: 0,
          }}>
            Sign in to access your records
          </p>
        </div>

        {/* Sign In Form */}
        <div style={{
          background: colors.surface,
          borderRadius: '20px',
          padding: '40px',
          border: `1px solid ${colors.border}`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: textSizes.sm.fontSize,
                fontFamily: textSizes.sm.fontFamily,
                color: colors.textSecondary,
                marginBottom: '8px',
                fontWeight: '600'
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '12px',
                  fontSize: textSizes.base.fontSize,
                  fontFamily: textSizes.base.fontFamily,
                  color: colors.text,
                  background: colors.background,
                  boxSizing: 'border-box',
                  transition: 'all 0.3s ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary;
                  e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = colors.border;
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="Enter your email"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: textSizes.sm.fontSize,
                fontFamily: textSizes.sm.fontFamily,
                color: colors.textSecondary,
                marginBottom: '8px',
                fontWeight: '600'
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '12px',
                  fontSize: textSizes.base.fontSize,
                  fontFamily: textSizes.base.fontFamily,
                  color: colors.text,
                  background: colors.background,
                  boxSizing: 'border-box',
                  transition: 'all 0.3s ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary;
                  e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = colors.border;
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div style={{
                background: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '12px',
                padding: '12px 16px',
                marginBottom: '24px',
              }}>
                <p style={{
                  fontSize: textSizes.sm.fontSize,
                  fontFamily: textSizes.sm.fontFamily,
                  color: '#dc2626',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <i className="fas fa-exclamation-circle" />
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                background: isLoading ? colors.textSecondary : colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '14px 20px',
                fontSize: textSizes.base.fontSize,
                fontFamily: textSizes.base.fontFamily,
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.target.style.background = colors.secondary;
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.target.style.background = colors.primary;
                }
              }}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt" />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '32px',
        }}>
          <p style={{
            fontSize: textSizes.sm.fontSize,
            fontFamily: textSizes.sm.fontFamily,
            color: colors.textSecondary,
            margin: 0,
          }}>
            Need help? Contact our support team
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
