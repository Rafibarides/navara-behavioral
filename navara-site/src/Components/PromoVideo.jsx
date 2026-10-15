import React, { useRef, useState } from 'react';
import { getColors, getTextSizes } from '../utils/colorsAndText';
import CalendlyModal from './CalendlyModal';

const PromoVideo = ({ isDarkMode = false, showHeading = false, showBooking = false }) => {
  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);
  const videoRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [booking, setBooking] = useState(false);
  const play = async () => {
    try { videoRef.current.muted = false; await videoRef.current.play(); setStarted(true); }
    catch { setStarted(true); }
  };
  return (
    <div className="navara-promo" style={{ textAlign: 'center', width: '100%' }}>
      {showHeading && <h2 style={{ color: colors.primary, fontFamily: textSizes['3xl'].fontFamily, fontSize: 'clamp(26px, 3vw, 36px)', margin: '0 0 32px', lineHeight: 1.2 }}>See the Navara Behavior Method</h2>}
      <div style={{ position: 'relative', width: 'min(100%, 290px)', aspectRatio: '9 / 16', margin: '0 auto', border: '8px solid #172b43', borderRadius: '34px', overflow: 'hidden', background: '#172b43', boxShadow: '0 22px 50px rgba(27,59,98,.18)', boxSizing: 'border-box' }}>
        <video ref={videoRef} controls={started} playsInline preload="none" poster="/assets/8-navara-promo-poster.webp" aria-label="Navara Behavior Method introduction video" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}>
          <source src="/assets/3-11-navara-method-promo.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {!started && <button onClick={play} aria-label="Play Navara introduction with sound" style={{ position: 'absolute', inset: 0, border: 0, background: 'linear-gradient(transparent 55%, rgba(15,31,49,.65))', cursor: 'pointer', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: '0 16px 35px', gap: '12px', fontFamily: textSizes.base.fontFamily }}>
          <span style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#1b3b62', display: 'grid', placeItems: 'center', boxShadow: '0 4px 16px #0003', fontSize: '24px' }} aria-hidden="true">▶</span>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Play video</span>
        </button>}
      </div>
      {showBooking && <button onClick={() => setBooking(true)} style={{ marginTop: '30px', background: colors.primary, color: '#fff', border: 0, borderRadius: '28px', padding: '15px 24px', fontFamily: textSizes.base.fontFamily, fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>Book your free 15-minute consultation</button>}
      <CalendlyModal isOpen={booking} onClose={() => setBooking(false)} isDarkMode={isDarkMode} />
    </div>
  );
};
export default PromoVideo;
