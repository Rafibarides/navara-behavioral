import React, { useState } from 'react';
import { getColors, getTextSizes } from '../utils/colorsAndText';

const SignInPage = ({ isDarkMode = false }) => {
  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState(false);

  // The portal is not live yet. The form never checks credentials or signs anyone in.
  const handleSubmit = (e) => {
    e.preventDefault();
    setNotice(true);
  };

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      margin: 0,
      padding: 0,
      background: colors.background,
      boxSizing: 'border-box',
      paddingTop: '90px',
      paddingBottom: '40px',
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

            {notice && (
              <div style={{
                background: colors.accent + '55',
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                padding: '14px 16px',
                marginBottom: '24px',
              }}>
                <p style={{
                  fontSize: textSizes.sm.fontSize,
                  fontFamily: textSizes.sm.fontFamily,
                  color: colors.text,
                  margin: 0,
                  lineHeight: 1.5,
                }}>
                  <i className="fas fa-info-circle" style={{ marginRight: '8px' }} />
                  Our client portal is opening soon. For records in the meantime, please contact us at:{' '}
                  <a href="mailto:info@navarabehavioralgroup.com" style={{ color: colors.primary, fontWeight: 600, display: 'block', marginTop: '6px', fontSize: '13px', wordBreak: 'normal', overflowWrap: 'normal' }}>info@navarabehavioralgroup.com</a>
                </p>
              </div>
            )}

            <button
              type="submit"
                            style={{
                width: '100%',
                background: colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '14px 20px',
                fontSize: textSizes.base.fontSize,
                fontFamily: textSizes.base.fontFamily,
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = colors.secondary;
              }}
              onMouseLeave={(e) => {
                e.target.style.background = colors.primary;
              }}
            >
                              <>
                  <i className="fas fa-sign-in-alt" />
                  Sign In
                </>
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
