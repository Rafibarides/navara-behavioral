import React, { useEffect } from 'react';
import { getColors, getTextSizes } from '../utils/colorsAndText';

const PrivacyPolicy = ({ isDarkMode = false }) => {
  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      margin: 0,
      padding: 0,
      background: colors.background,
      boxSizing: 'border-box',
    }}>
      {/* Back Button */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        zIndex: 1000,
      }}>
        <button
          onClick={handleGoBack}
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.target.style.background = colors.primary + '10';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = colors.surface;
          }}
        >
          <i className="fas fa-arrow-left" style={{
            fontSize: '14px',
            color: colors.primary,
          }} />
          <span style={{
            fontSize: textSizes.sm.fontSize,
            fontFamily: textSizes.sm.fontFamily,
            color: colors.text,
            fontWeight: '500'
          }}>
            Back
          </span>
        </button>
      </div>

      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '80px 40px 60px 40px',
      }}>
        <h1 style={{
          fontSize: textSizes['4xl'].fontSize,
          fontFamily: textSizes['4xl'].fontFamily,
          color: colors.primary,
          marginBottom: '16px',
          fontWeight: '700'
        }}>
          Privacy Policy
        </h1>
        
        <p style={{
          fontSize: textSizes.base.fontSize,
          fontFamily: textSizes.base.fontFamily,
          color: colors.textSecondary,
          marginBottom: '40px'
        }}>
          Last updated: December 21, 2024
        </p>

        <div style={{
          background: colors.surface,
          borderRadius: '16px',
          padding: '40px',
          border: `1px solid ${colors.border}`,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          lineHeight: '1.7'
        }}>
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: textSizes['2xl'].fontSize,
              fontFamily: textSizes['2xl'].fontFamily,
              color: colors.primary,
              marginBottom: '16px',
              fontWeight: '600'
            }}>
              Introduction
            </h2>
            <p style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              marginBottom: '16px'
            }}>
              Navara Behavioral Group ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: textSizes['2xl'].fontSize,
              fontFamily: textSizes['2xl'].fontFamily,
              color: colors.primary,
              marginBottom: '16px',
              fontWeight: '600'
            }}>
              Information We Collect
            </h2>
            <h3 style={{
              fontSize: textSizes.lg.fontSize,
              fontFamily: textSizes.lg.fontFamily,
              color: colors.text,
              marginBottom: '12px',
              fontWeight: '600'
            }}>
              Personal Information
            </h3>
            <p style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              marginBottom: '16px'
            }}>
              We may collect personal information that you provide directly to us, including:
            </p>
            <ul style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              marginBottom: '16px',
              paddingLeft: '20px'
            }}>
              <li>Name, email address, and contact information</li>
              <li>Medical and behavioral health information</li>
              <li>Insurance information</li>
              <li>Payment information</li>
              <li>Appointment and scheduling data</li>
            </ul>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: textSizes['2xl'].fontSize,
              fontFamily: textSizes['2xl'].fontFamily,
              color: colors.primary,
              marginBottom: '16px',
              fontWeight: '600'
            }}>
              HIPAA Compliance
            </h2>
            <p style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              marginBottom: '16px'
            }}>
              As a healthcare provider, we comply with the Health Insurance Portability and Accountability Act (HIPAA). Your protected health information (PHI) is handled according to HIPAA standards and our Notice of Privacy Practices, which is provided separately.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: textSizes['2xl'].fontSize,
              fontFamily: textSizes['2xl'].fontFamily,
              color: colors.primary,
              marginBottom: '16px',
              fontWeight: '600'
            }}>
              How We Use Your Information
            </h2>
            <p style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              marginBottom: '16px'
            }}>
              We use the information we collect to:
            </p>
            <ul style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              marginBottom: '16px',
              paddingLeft: '20px'
            }}>
              <li>Provide behavioral health services and support</li>
              <li>Process appointments and manage your care</li>
              <li>Communicate with you about your treatment</li>
              <li>Process payments and insurance claims</li>
              <li>Comply with legal and regulatory requirements</li>
              <li>Send appointment reminders and care notifications via SMS (with your consent)</li>
            </ul>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: textSizes['2xl'].fontSize,
              fontFamily: textSizes['2xl'].fontFamily,
              color: colors.primary,
              marginBottom: '16px',
              fontWeight: '600'
            }}>
              Information Sharing
            </h2>
            <p style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              marginBottom: '16px'
            }}>
              We may share your personal information with:
            </p>
            <ul style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              marginBottom: '16px',
              paddingLeft: '20px'
            }}>
              <li>Healthcare providers involved in your care</li>
              <li>Insurance companies for billing and coverage verification</li>
              <li>Legal authorities when required by law</li>
              <li>Service providers who assist with our operations (under strict confidentiality agreements)</li>
            </ul>
            <p style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              marginBottom: '16px',
              fontWeight: '600'
            }}>
              <strong>SMS Consent is not shared with third parties or affiliates.</strong> Your consent to receive SMS messages from us is kept confidential and is not sold, shared, or disclosed to any third parties for marketing or other purposes.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: textSizes['2xl'].fontSize,
              fontFamily: textSizes['2xl'].fontFamily,
              color: colors.primary,
              marginBottom: '16px',
              fontWeight: '600'
            }}>
              SMS Terms of Service
            </h2>
            <p style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              marginBottom: '16px'
            }}>
              By opting into SMS from a web form or other medium, you are agreeing to receive SMS messages from Navara Behavioral Group. This includes SMS messages for customer care and appointment reminders.
            </p>
            <ul style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              marginBottom: '16px',
              paddingLeft: '20px'
            }}>
              <li>Message frequency varies based on your care needs and preferences</li>
              <li>Message and data rates may apply depending on your mobile carrier plan</li>
              <li>To opt out at any time, text <strong>STOP</strong> to any message</li>
              <li>For assistance, text <strong>HELP</strong> or visit our website at <a href="https://navarabehavioralgroup.com" style={{ color: colors.primary, textDecoration: 'none' }}>https://navarabehavioralgroup.com</a></li>
              <li>Carriers are not liable for delayed or undelivered messages</li>
            </ul>
            <p style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              marginBottom: '16px'
            }}>
              For privacy policy information, visit <a href="https://navarabehavioralgroup.com/privacy" style={{ color: colors.primary, textDecoration: 'none' }}>https://navarabehavioralgroup.com/privacy</a>. For Terms of Service, visit <a href="https://navarabehavioralgroup.com/terms" style={{ color: colors.primary, textDecoration: 'none' }}>https://navarabehavioralgroup.com/terms</a>.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: textSizes['2xl'].fontSize,
              fontFamily: textSizes['2xl'].fontFamily,
              color: colors.primary,
              marginBottom: '16px',
              fontWeight: '600'
            }}>
              Information Security
            </h2>
            <p style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              marginBottom: '16px'
            }}>
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption, secure servers, and regular security assessments.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: textSizes['2xl'].fontSize,
              fontFamily: textSizes['2xl'].fontFamily,
              color: colors.primary,
              marginBottom: '16px',
              fontWeight: '600'
            }}>
              Your Rights
            </h2>
            <p style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              marginBottom: '16px'
            }}>
              You have the right to:
            </p>
            <ul style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              marginBottom: '16px',
              paddingLeft: '20px'
            }}>
              <li>Access your personal information</li>
              <li>Request corrections to your information</li>
              <li>Request deletion of your information (subject to legal requirements)</li>
              <li>Restrict processing of your information</li>
              <li>Receive a copy of your information</li>
            </ul>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: textSizes['2xl'].fontSize,
              fontFamily: textSizes['2xl'].fontFamily,
              color: colors.primary,
              marginBottom: '16px',
              fontWeight: '600'
            }}>
              Contact Us
            </h2>
            <p style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              marginBottom: '16px'
            }}>
              If you have questions about this Privacy Policy or wish to exercise your rights, please contact us at:
            </p>
            <p style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              marginBottom: '16px'
            }}>
              <strong>Navara Behavioral Group</strong><br />
              Email: privacy@navara.com<br />
              Phone: (555) 123-4567
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 