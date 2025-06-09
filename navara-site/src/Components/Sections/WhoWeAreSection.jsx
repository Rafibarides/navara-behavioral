import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { getColors, getTextSizes } from '../../utils/colorsAndText';

const WhoWeAreSection = ({ isDarkMode = false }) => {
  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);
  const [isMobile, setIsMobile] = useState(false);
  const [letterOpacities, setLetterOpacities] = useState({});
  const textRefs = useRef([]);
  const sectionRef = useRef(null);
  const lastUpdateTime = useRef(0);

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
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Dynamic array for strips - easily expandable
  const strips = [
    {
      photo: 'assets/NAVARA7.jpg',
      title: 'Who We Are',
      text: 'Navara was founded to bridge the gap between families and the support they actually need. We provide high-quality diagnostic evaluations, evidence-based behavior support, and guided career exploration, all under one streamlined, client-focused model.'
    },
    {
      photo: 'assets/NAVARA8.jpg',
      title: 'We exist to simplify the process',
      text: 'Whether it\'s understanding a child\'s development, managing challenging behaviors, or navigating early career decisions, our goal is to give families and young adults the tools, clarity, and confidence they need to move forward.'
    }
  ];

  // Throttle function for better performance
  const throttle = useCallback((func, limit) => {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }
  }, []);

  // Optimized scroll animation effect for letter opacity
  useEffect(() => {
    const handleScroll = throttle(() => {
      const now = performance.now();
      if (now - lastUpdateTime.current < 16) return; // Limit to 60fps
      lastUpdateTime.current = now;

      const newOpacities = {};

      textRefs.current.forEach((textRef, stripIndex) => {
        if (textRef) {
          const rect = textRef.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          
          const elementTop = rect.top;
          const elementBottom = rect.bottom;
          
          // More responsive trigger points
          const startPoint = windowHeight * 0.85;
          const endPoint = windowHeight * 0.15;
          
          let progress = 0;
          if (elementTop < startPoint && elementBottom > endPoint) {
            if (elementTop <= endPoint) {
              progress = 1;
            } else {
              progress = (startPoint - elementTop) / (startPoint - endPoint);
            }
          }
          
          // Smooth easing curve
          progress = Math.max(0, Math.min(1, progress));
          const easedProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
          
          const text = strips[stripIndex].text;
          const totalLetters = text.length;
          
          for (let i = 0; i < totalLetters; i++) {
            const letterProgress = (easedProgress * totalLetters - i) / 2; // Reduced spread for smoother effect
            const opacity = Math.max(0.5, Math.min(1, 0.5 + letterProgress * 0.5));
            newOpacities[`${stripIndex}-${i}`] = opacity;
          }
        }
      });

      setLetterOpacities(newOpacities);
    }, 8); // Higher frequency for smoother updates

    handleScroll();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [strips, throttle]);

  // Function to render text with animated letters
  const renderAnimatedText = (text, stripIndex) => {
    return text.split('').map((char, charIndex) => {
      const opacity = letterOpacities[`${stripIndex}-${charIndex}`] || 0.5;
      return (
        <span
          key={charIndex}
          style={{
            opacity: opacity,
            transition: 'opacity 0.08s cubic-bezier(0.4, 0, 0.2, 1)', // Smoother easing
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
                  alt={strip.title}
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    height: '300px',
                    objectFit: 'cover',
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
                alt={strip.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
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
