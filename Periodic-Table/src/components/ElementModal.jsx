import React, { useRef } from 'react';
import { X, Sparkles, Cpu, Thermometer, Globe, Zap } from 'lucide-react';

export default function ElementModal({ element, onClose }) {
  const modalOverlayRef = useRef(null);

  // Helper to determine electron shells
  const getShells = (number) => {
    if (number === 1) return [1];
    if (number === 2) return [2];
    if (number >= 3 && number <= 10) return [2, number - 2];
    if (number >= 11 && number <= 18) return [2, 8, number - 10];
    if (number >= 19 && number <= 20) return [2, 8, 8, number - 18];
    if (number >= 21 && number <= 30) {
      if (number === 24) return [2, 8, 13, 1];
      if (number === 29) return [2, 8, 18, 1];
      return [2, 8, 8 + (number - 20), 2];
    }
    if (number >= 31 && number <= 36) return [2, 8, 18, number - 28];
    if (number === 37) return [2, 8, 18, 8, 1];
    if (number === 38) return [2, 8, 18, 8, 2];
    if (number >= 39 && number <= 48) {
      if (number === 41) return [2, 8, 18, 12, 1];
      if (number === 42) return [2, 8, 18, 13, 1];
      if (number === 46) return [2, 8, 18, 18];
      if (number === 47) return [2, 8, 18, 18, 1];
      return [2, 8, 18, 8 + (number - 38), 2];
    }
    if (number >= 49 && number <= 54) return [2, 8, 18, 18, number - 48];
    if (number === 55) return [2, 8, 18, 18, 8, 1];
    if (number === 56) return [2, 8, 18, 18, 8, 2];
    if (number >= 57 && number <= 71) return [2, 8, 18, 18 + (number - 56), 9, 2];
    if (number >= 72 && number <= 80) {
      if (number === 78) return [2, 8, 18, 32, 17, 1];
      if (number === 79) return [2, 8, 18, 32, 18, 1];
      return [2, 8, 18, 32, 8 + (number - 71), 2];
    }
    if (number >= 81 && number <= 86) return [2, 8, 18, 32, 18, number - 80];
    if (number === 87) return [2, 8, 18, 32, 18, 8, 1];
    if (number === 88) return [2, 8, 18, 32, 18, 8, 2];
    if (number >= 89 && number <= 103) return [2, 8, 18, 32, 18 + (number - 88), 9, 2];
    return [2, 8, 18, 32, 32, 8 + (number - 103), 2];
  };

  const shells = getShells(element.number);

  const handleBackdropClick = (e) => {
    if (e.target === modalOverlayRef.current) {
      onClose();
    }
  };

  return (
    <div
      ref={modalOverlayRef}
      onClick={handleBackdropClick}
      className="modal-overlay"
    >
      <div className="modal-container">

        {/* Close Button */}
        <button onClick={onClose} className="modal-close">
          <X size={20} />
        </button>

        {/* Left Side: Animated Atom & Core Stats */}
        <div className="modal-left">

          <div style={{ textAlign: 'center', width: '100%' }}>
            <span className="elem-category">{element.category.replace(/-/g, ' ')}</span>
            <h1 className="elem-name" style={{ textShadow: `0 0 15px var(--color-${element.category})` }}>
              {element.name}
            </h1>
          </div>

          {/* Bohr Model Atom Animation */}
          <div className="bohr-container">
            {/* Nucleus */}
            <div
              className="nucleus"
              style={{
                background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, rgba(0,0,0,0.4) 100%), var(--color-${element.category})`,
                borderColor: `var(--color-${element.category})`,
                border: `2px solid var(--color-${element.category})`,
                boxShadow: `0 0 30px var(--color-${element.category})`
              }}
            >
              <span className="nucleus-symbol">{element.symbol}</span>
              <span className="nucleus-num">{element.number}</span>
            </div>

            {/* Orbit Shells */}
            {shells.map((electronsCount, shellIdx) => {
              const radius = 55 + shellIdx * 25;
              const duration = 8 + shellIdx * 5;

              return (
                <div
                  key={shellIdx}
                  className="orbit-shell"
                  style={{
                    width: `${radius * 2}px`,
                    height: `${radius * 2}px`,
                    '--duration': `${duration}s`
                  }}
                >
                  {Array.from({ length: electronsCount }).map((_, electronIdx) => {
                    const angle = (electronIdx / electronsCount) * 360;
                    return (
                      <div
                        key={electronIdx}
                        style={{
                          position: 'absolute',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          top: '50%',
                          left: '50%',
                          transform: `translate(-50%, -50%) rotate(${angle}deg) translate(${radius}px) rotate(-${angle}deg)`,
                          background: `var(--color-${element.category}, #00f0ff)`,
                          boxShadow: `0 0 8px var(--color-${element.category}, #00f0ff)`
                        }}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Quick stats */}
          <div className="modal-stats-grid">
            <div className="modal-stat-box">
              <div className="stat-label">Mass</div>
              <div className="stat-value">{element.mass}</div>
            </div>
            <div className="modal-stat-box">
              <div className="stat-label">State</div>
              <div className="stat-value">{element.state}</div>
            </div>
            <div className="modal-stat-box">
              <div className="stat-label">Valency</div>
              <div className="stat-value">{element.valency}</div>
            </div>
          </div>
        </div>

        {/* Right Side: Detailed Scientific Dashboard */}
        <div className="modal-right">

          <div className="info-section">
            <h2><Sparkles style={{ color: '#60a5fa' }} size={18} /> Description</h2>
            <p>{element.description}</p>
          </div>

          <div className="info-grid">
            <div className="info-section">
              <h2><Cpu style={{ color: '#a78bfa' }} size={18} /> Atomic & Chemical</h2>
              <div className="info-row">
                <div className="info-kv"><span className="kv-label">Electron Config</span><span className="kv-value">{element.electronConfig}</span></div>
                <div className="info-kv"><span className="kv-label">Group</span><span className="kv-value">{element.group || 'N/A'}</span></div>
                <div className="info-kv"><span className="kv-label">Period</span><span className="kv-value">{element.period}</span></div>
                <div className="info-kv"><span className="kv-label">Block</span><span className="kv-value" style={{ textTransform: 'uppercase' }}>{element.block}</span></div>
                <div className="info-kv"><span className="kv-label">Atomic Radius</span><span className="kv-value">{element.radius || 'N/A'}</span></div>
                <div className="info-kv"><span className="kv-label">Electronegativity</span><span className="kv-value">{element.electronegativity}</span></div>
                <div className="info-kv"><span className="kv-label">Oxidation States</span><span className="kv-value">{element.oxidationStates || 'N/A'}</span></div>
              </div>
            </div>

            <div className="info-section">
              <h2><Thermometer style={{ color: '#f87171' }} size={18} /> Thermal & Physical</h2>
              <div className="info-row">
                <div className="info-kv"><span className="kv-label">Melting Point</span><span className="kv-value">{element.meltingPoint || 'N/A'}</span></div>
                <div className="info-kv"><span className="kv-label">Boiling Point</span><span className="kv-value">{element.boilingPoint || 'N/A'}</span></div>
                <div className="info-kv"><span className="kv-label">Density</span><span className="kv-value">{element.density || 'N/A'}</span></div>
                <div className="info-kv"><span className="kv-label">Room Temp State</span><span className="kv-value">{element.state}</span></div>
              </div>
            </div>
          </div>

          <div className="info-grid">
            <div className="info-section">
              <h2><Globe style={{ color: '#4ade80' }} size={18} /> History & Discovery</h2>
              <div className="info-row">
                <div className="info-kv"><span className="kv-label">Discovery Year</span><span className="kv-value">{element.year}</span></div>
                <div className="info-kv"><span className="kv-label">Discoverer</span><span className="kv-value">{element.discoverer}</span></div>
              </div>
            </div>

            <div className="info-section">
              <h2><Zap style={{ color: '#facc15' }} size={18} /> Common Uses</h2>
              <p>{element.uses}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
