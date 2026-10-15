import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getColors, getTextSizes } from '../../utils/colorsAndText';

const ServiceCardSection = ({ isDarkMode = false }) => {
  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 768px)').matches);
  const [isTablet, setIsTablet] = useState(() => window.matchMedia('(min-width: 769px) and (max-width: 1024px)').matches);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches);
      setIsTablet(window.matchMedia('(min-width: 769px) and (max-width: 1024px)').matches);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const divisions = [
    {
      title: 'The Navara Behavior Method\u2122',
      tagline: '12-Week Parent Training Program',
      description: 'Our flagship offering. A structured 12-week program built on the Four Cs Framework - Connection, Clarity, Control, and Carryover - that trains you to understand and respond to your child\'s behavior with confidence.',
      icon: 'fas fa-graduation-cap',
      route: '/services/behavior-method',
      live: true,
    },
    {
      title: 'Navara Direct ABA\u2122',
      tagline: 'Private, BCBA-Led ABA',
      description: 'Private ABA designed around your family. Every session is led by a Board Certified Behavior Analyst, scheduled on your terms, with a plan individualized to your child.',
      icon: 'fas fa-user-md',
      route: '/services/direct-aba',
      live: true,
    },
    {
      title: 'Behavioral Consulting',
      tagline: 'Expert-Level Guidance',
      description: 'A single focused session for families or professionals who need straight answers from a senior BCBA - no commitment, no program required.',
      icon: 'fas fa-comments',
      route: '/services/consulting',
      live: true,
    },
  ];



  return (
    <section style={{
      backgroundColor: colors.surface,
      width: '100vw',
      padding: isMobile ? '60px 20px' : '80px 20px',
      margin: 0,
      boxSizing: 'border-box',
    }}>
      {/* Section Title */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '48px',
          maxWidth: '820px',
          margin: '0 auto 48px auto',
        }}
      >
        <h2 style={{
          fontSize: isMobile ? textSizes['3xl'].fontSize : textSizes['4xl'].fontSize,
          fontFamily: textSizes['4xl'].fontFamily,
          color: colors.primary,
          fontWeight: '700',
          marginBottom: '14px',
        }}>
          What We Offer
        </h2>
        <p style={{
          fontSize: isMobile ? textSizes.base.fontSize : textSizes.lg.fontSize,
          fontFamily: textSizes.lg.fontFamily,
          color: colors.textSecondary,
          lineHeight: '1.6',
          margin: 0,
        }}>
          Real support, available today. These are the three services Navara offers -
          each one built around your child and your family.
        </p>
      </div>

      {/* Division Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: '24px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {divisions.map((division, index) => (
          <Link
            key={index}
            to={division.route}
            style={{
              textDecoration: 'none',
              color: 'inherit',
              position: 'relative',
              backgroundColor: colors.background,
              border: `2px solid ${colors.primary}40`,
              borderRadius: '18px',
              padding: isMobile ? '24px' : '28px',
              boxShadow: '0 6px 24px rgba(27, 59, 98, 0.1)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              minHeight: '220px',
              overflow: 'hidden',
            }}
          >
            {/* Icon */}
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: `linear-gradient(135deg, ${colors.primary}20, ${colors.secondary}15)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '6px',
            }}>
              <i
                className={division.icon}
                style={{
                  fontSize: '22px',
                  color: colors.primary,
                }}
              />
            </div>

            <h3 style={{
              fontSize: textSizes.lg.fontSize,
              fontFamily: textSizes.lg.fontFamily,
              color: colors.text,
              fontWeight: '700',
              margin: 0,
              lineHeight: '1.3',
            }}>
              {division.title}
            </h3>

            <p style={{
              fontSize: textSizes.sm.fontSize,
              fontFamily: textSizes.sm.fontFamily,
              color: colors.primary,
              fontWeight: '600',
              fontStyle: division.live ? 'normal' : 'italic',
              margin: 0,
            }}>
              {division.tagline}
            </p>

            <p style={{
              fontSize: textSizes.sm.fontSize,
              fontFamily: textSizes.sm.fontFamily,
              color: colors.text,
              lineHeight: '1.55',
              margin: 0,
              flex: 1,
            }}>
              {division.description}
            </p>

            {division.live && !isMobile && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: colors.primary,
                fontSize: textSizes.sm.fontSize,
                fontFamily: textSizes.sm.fontFamily,
                fontWeight: '600',
                marginTop: '4px',
              }}>
                Learn More
                <i className="fas fa-arrow-right" style={{ fontSize: '11px' }} />
              </span>
            )}
          </Link>
        ))}
      </div>

    </section>
  );
};

export default ServiceCardSection;
