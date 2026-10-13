import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { getColors, getTextSizes } from '../../utils/colorsAndText';
import siteData from '../../../SiteData.json';

const WhoWeAreSection = ({ isDarkMode = false }) => {
  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 768px)').matches);
  const [letterOpacities, setLetterOpacities] = useState({});
  const textRefs = useRef([]);
  const sectionRef = useRef(null);

  // Get strips from siteData
  const strips = siteData.sections.whoWeAre.strips;

  // Smooth scroll tracking for the entire section
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  // Add spring to scroll progress for smoother animations
  const smoothScrollProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Letter-by-letter scroll reveal: text starts soft grey and darkens as it scrolls into view.
  // MIN_OPACITY keeps the unrevealed text readable (contrast), while still visibly lighter.
  useEffect(() => {
    const MIN_OPACITY = 0.38;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;

    const update = () => {
      frame = 0;
      const newOpacities = {};
      const windowHeight = window.innerHeight;

      textRefs.current.forEach((textRef, stripIndex) => {
        if (!textRef) return;
        const text = strips[stripIndex].text;
        const totalLetters = text.length;

        let eased = 1;
        if (!reduceMotion) {
          const rect = textRef.getBoundingClientRect();
          const startPoint = windowHeight * 0.92; // starts when text enters the bottom
          const endPoint = windowHeight * 0.45;   // fully dark by mid-screen
          const progress = Math.max(0, Math.min(1, (startPoint - rect.top) / (startPoint - endPoint)));
          eased = progress;
        }

        const spread = 12; // letters that are mid-fade at once
        for (let i = 0; i < totalLetters; i++) {
          const letterProgress = Math.max(0, Math.min(1, (eased * (totalLetters + spread) - i) / spread));
          newOpacities[`${stripIndex}-${i}`] = MIN_OPACITY + (1 - MIN_OPACITY) * letterProgress;
        }
      });

      setLetterOpacities(newOpacities);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [strips, isMobile]);

  // Function to render text with animated letters
  const renderAnimatedText = (text, stripIndex) => {
    return text.split('').map((char, charIndex) => {
      const opacity = letterOpacities[`${stripIndex}-${charIndex}`] ?? 0.38;
      return (
        <span
          key={charIndex}
          style={{
            opacity: opacity,
            transition: 'opacity 0.12s linear',
            willChange: 'opacity', // Optimize for animation
          }}
        >
          {char}
        </span>
      );
    });
  };

  // Create individual scroll transforms for each strip with smoother springs
  const createStripTransforms = (index) => {
    const stripStart = index * 0.4;
    const stripEnd = stripStart + 0.6;
    
    // Smoother transforms with springs
    const imageScale = useSpring(
      useTransform(
        smoothScrollProgress,
        [stripStart, stripStart + 0.3, stripEnd],
        [1, 1.03, 1] // Reduced scale for subtlety
      ),
      { stiffness: 200, damping: 40 }
    );
    
    const imageRotate = useSpring(
      useTransform(
        smoothScrollProgress,
        [stripStart, stripEnd],
        index % 2 === 0 ? [-0.5, 0.5] : [0.5, -0.5] // Reduced rotation
      ),
      { stiffness: 200, damping: 40 }
    );
    
    const textY = useSpring(
      useTransform(
        smoothScrollProgress,
        [stripStart, stripEnd],
        [-20, 20] // Reduced parallax
      ),
      { stiffness: 200, damping: 40 }
    );
    
    const imageY = useSpring(
      useTransform(
        smoothScrollProgress,
        [stripStart, stripEnd],
        [20, -20] // Reduced parallax
      ),
      { stiffness: 200, damping: 40 }
    );

    return {
      imageScale,
      imageRotate,
      textY,
      imageY
    };
  };

  // Mobile Layout - Text-Pic-Text-Pic sandwich
  if (isMobile) {
    return (
      <section 
        ref={sectionRef}
        style={{
          backgroundColor: colors.background,
          width: '100vw',
          padding: '40px 0',
        }}
      >
        {strips.map((strip, index) => {
          const transforms = createStripTransforms(index);
          
          return (
            <div key={index}>
              {/* Text Section */}
              <motion.div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  maxWidth: '600px',
                  margin: '0 auto',
                  y: transforms.textY,
                  willChange: 'transform',
                }}
              >
                <h2
                  style={{
                    fontSize: textSizes['2xl'].fontSize,
                    fontFamily: textSizes['2xl'].fontFamily,
                    color: colors.primary,
                    marginBottom: '24px',
                    fontWeight: '700',
                    lineHeight: '1.2',
                  }}
                >
                  {strip.title}
                </h2>
                <p
                  ref={el => textRefs.current[index] = el}
                  style={{
                    fontSize: textSizes.base.fontSize,
                    fontFamily: textSizes.base.fontFamily,
                    color: colors.text,
                    lineHeight: '1.6',
                    margin: 0,
                  }}
                >
                  {renderAnimatedText(strip.text, index)}
                </p>
              </motion.div>

              {/* Photo Section */}
              <motion.div
                style={{
                  padding: '0 20px 40px 20px',
                  display: 'flex',
                  justifyContent: 'center',
                  y: transforms.imageY,
                  willChange: 'transform',
                }}
              >
                <motion.img
                  src={strip.photo}
                  alt={strip.photoAlt || strip.title}
                  loading="lazy"
                  decoding="async"
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    height: '300px',
                    objectFit: 'cover',
                    objectPosition: strip.photoPosition || 'center',
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                    scale: transforms.imageScale,
                    rotate: transforms.imageRotate,
                    willChange: 'transform',
                  }}
                />
              </motion.div>
            </div>
          );
        })}
      </section>
    );
  }

  // Desktop Layout - Alternating sides
  return (
    <section 
      ref={sectionRef}
      style={{
        backgroundColor: colors.background,
        width: '100vw',
        padding: '60px 0',
        margin: 0,
        boxSizing: 'border-box',
        overflowX: 'hidden',
      }}
    >
      {strips.map((strip, index) => {
        const isPhotoRight = index % 2 === 0;
        const transforms = createStripTransforms(index);
        
        return (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              minHeight: '500px',
              width: '100%',
              maxWidth: '1200px',
              margin: '0 auto',
              padding: '0 40px',
              boxSizing: 'border-box',
            }}
          >
            {/* Content Section */}
            <motion.div
              style={{
                flex: 1,
                padding: '40px',
                order: isPhotoRight ? 1 : 2,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                maxWidth: '600px',
                margin: '0 auto',
                y: transforms.textY,
                willChange: 'transform',
              }}
            >
              <h2
                style={{
                  fontSize: textSizes['3xl'].fontSize,
                  fontFamily: textSizes['3xl'].fontFamily,
                  color: colors.primary,
                  marginBottom: '24px',
                  fontWeight: '700',
                  lineHeight: '1.2',
                }}
              >
                {strip.title}
              </h2>
              <p
                ref={el => textRefs.current[index] = el}
                style={{
                  fontSize: textSizes.lg.fontSize,
                  fontFamily: textSizes.lg.fontFamily,
                  color: colors.text,
                  lineHeight: '1.6',
                  margin: 0,
                }}
              >
                {renderAnimatedText(strip.text, index)}
              </p>
            </motion.div>

            {/* Photo Section */}
            <motion.div
              style={{
                flex: '0 0 400px',
                height: '500px',
                order: isPhotoRight ? 2 : 1,
                y: transforms.imageY,
                willChange: 'transform',
              }}
            >
              <motion.img
                src={strip.photo}
                alt={strip.photoAlt || strip.title}
                  loading="lazy"
                  decoding="async"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                    objectPosition: strip.photoPosition || 'center',
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  scale: transforms.imageScale,
                  rotate: transforms.imageRotate,
                  transformOrigin: 'center center',
                  willChange: 'transform',
                }}
              />
            </motion.div>
          </div>
        );
      })}
    </section>
  );
};

export default WhoWeAreSection;
