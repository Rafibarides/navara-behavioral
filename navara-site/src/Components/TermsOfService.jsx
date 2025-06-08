import React, { useEffect } from 'react';
import { getColors, getTextSizes } from '../utils/colorsAndText';

const TermsOfService = ({ isDarkMode = false }) => {
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
          Terms of Service
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
              Agreement to Terms
            </h2>
            <p style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              marginBottom: '16px'
            }}>
              By accessing and using Navara Behavioral Group's website and services, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
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
              Services Description
            </h2>
            <p style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              marginBottom: '16px'
            }}>
              Navara Behavioral Group provides behavioral health services, diagnostic evaluations, and related support services. Our services include:
            </p>
            <ul style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              marginBottom: '16px',
              paddingLeft: '20px'
            }}>
              <li>Behavioral assessments and evaluations</li>
              <li>Individual and family therapy sessions</li>
              <li>Career guidance and pathways consulting</li>
              <li>Online client portal access</li>
              <li>Appointment scheduling and management</li>
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
              Client Responsibilities
            </h2>
            <p style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              marginBottom: '16px'
            }}>
              As a client, you agree to:
            </p>
            <ul style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              marginBottom: '16px',
              paddingLeft: '20px'
            }}>
              <li>Provide accurate and complete information</li>
              <li>Attend scheduled appointments or provide adequate notice for cancellations</li>
              <li>Follow treatment recommendations and care plans</li>
              <li>Pay for services according to agreed-upon terms</li>
              <li>Respect our staff and other clients</li>
              <li>Keep login credentials secure and confidential</li>
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
              Appointment and Cancellation Policy
            </h2>
            <p style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              marginBottom: '16px'
            }}>
              - Appointments must be cancelled at least 24 hours in advance<br />
              - Late cancellations may result in charges<br />
              - Repeated no-shows may result in service termination<br />
              - Emergency situations will be considered on a case-by-case basis
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
              Payment Terms
            </h2>
            <p style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              marginBottom: '16px'
            }}>
              Payment is due at the time of service unless other arrangements have been made. We accept cash, checks, and major credit cards. Insurance claims will be processed according to your coverage benefits.
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
              Confidentiality and Privacy
            </h2>
            <p style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              marginBottom: '16px'
            }}>
              We maintain strict confidentiality in accordance with HIPAA regulations and professional ethical standards. Information will only be disclosed with your written consent or as required by law.
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
              Limitation of Liability
            </h2>
            <p style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              marginBottom: '16px'
            }}>
              Our services are provided "as is" and we make no guarantees regarding specific outcomes. Our liability is limited to the cost of services provided. We are not responsible for indirect, incidental, or consequential damages.
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
              Modifications to Terms
            </h2>
            <p style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              marginBottom: '16px'
            }}>
              We reserve the right to modify these terms at any time. Changes will be posted on our website and will become effective immediately upon posting.
            </p>
          </section>

          <section>
            <h2 style={{
              fontSize: textSizes['2xl'].fontSize,
              fontFamily: textSizes['2xl'].fontFamily,
              color: colors.primary,
              marginBottom: '16px',
              fontWeight: '600'
            }}>
              Contact Information
            </h2>
            <p style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text,
              marginBottom: '16px'
            }}>
              For questions about these Terms of Service, please contact us at:
            </p>
            <p style={{
              fontSize: textSizes.base.fontSize,
              fontFamily: textSizes.base.fontFamily,
              color: colors.text
            }}>
              <strong>Navara Behavioral Group</strong><br />
              Email: info@navara.com<br />
              Phone: (555) 123-4567
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService; 