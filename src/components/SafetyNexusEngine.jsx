import React, { useState, useEffect } from 'react';
import { PROJECTS } from '../data/projects';
import { ArrowLeft, ExternalLink, Play, Info, Sparkles } from 'lucide-react';

const HONG_KONG_ANCHOR = {
  x: 50,
  y: 50,
};

const buildDigitString = (seed, length = 20) => (
  Array.from({ length }, (_, index) => (seed + index * 7 + (index % 3) * 2) % 10).join('\n')
);

const DIGITAL_RAIN_STREAMS = Array.from({ length: 46 }, (_, index) => {
  const seed = index * 11 + 3;
  return {
    id: `rain-${index}`,
    left: `${4 + ((index * 13) % 93)}%`,
    delay: `${-((index * 0.37) % 13.4).toFixed(2)}s`,
    drift: `${((index % 7) - 3) * 9}px`,
    size: `${0.9 + (index % 4) * 0.08}rem`,
    alpha: `${0.56 + (index % 5) * 0.045}`,
    digits: buildDigitString(seed),
    alternateDigits: buildDigitString(seed + 5),
  };
});

const trackSafetyNexusEvent = (eventName, params = {}) => {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

  window.gtag('event', eventName, {
    ...params,
    page_location: window.location.href,
    page_path: `${window.location.pathname}${window.location.search}${window.location.hash}`,
    transport_type: 'beacon',
  });
};

function DigitalNumberRain() {
  return (
    <div className="digital-rain-layer" aria-hidden="true">
      {DIGITAL_RAIN_STREAMS.map((stream) => (
        <span
          className="digital-rain-stream"
          key={stream.id}
          style={{
            '--rain-left': stream.left,
            '--rain-delay': stream.delay,
            '--rain-drift': stream.drift,
            '--rain-size': stream.size,
            '--rain-alpha': stream.alpha,
          }}
        >
          <span className="digital-rain-digits primary">{stream.digits}</span>
          <span className="digital-rain-digits alternate">{stream.alternateDigits}</span>
        </span>
      ))}
    </div>
  );
}

function HomeScene({ onSelect, flipbookMode }) {
  const radius = 340;
  const hubConnectorOffset = 108;
  const cardHalfWidth = 110;
  const cardHalfHeight = 62;
  const spokes = PROJECTS.filter(p => !p.isHub);

  return (
    <div
      className={`scene ${flipbookMode ? 'flipbook-active' : ''}`}
      key="home"
    >
      <div className="scene-bg-container">
        <div className="scene-bg home-world-bg" />
        <div className="scene-vignette" />
      </div>

      <DigitalNumberRain />

      <div className="scene-content">
        {/* Hub */}
        <div
          className="hub-node"
          style={{ position: 'absolute', top: `${HONG_KONG_ANCHOR.y}%`, left: `${HONG_KONG_ANCHOR.x}%`, transform: 'translate(-50%, -50%)', zIndex: 100 }}
        >
          <img src="/bot_qr.png" alt="SafeT Chai Bot QR code" className="hub-qr" decoding="async" />
          <div className="hub-title">SafeT Chai Bot</div>
          <div className="hub-subtitle">Central AI Safety Hub</div>
        </div>

        {/* Neural Connections */}
        {!flipbookMode && (
          <div className="nexus-connectors" aria-hidden="true">
            {spokes.map(p => {
              const rad = (p.angle * Math.PI) / 180;
              const absCos = Math.max(Math.abs(Math.cos(rad)), 0.001);
              const absSin = Math.max(Math.abs(Math.sin(rad)), 0.001);
              const cardEdgeOffset = Math.min(cardHalfWidth / absCos, cardHalfHeight / absSin);
              const connectorLength = Math.max(radius - hubConnectorOffset - cardEdgeOffset + 8, 72);

              return (
                <div
                  key={`connector-${p.id}`}
                  className={`nexus-connector ${p.isFuture ? 'future-connector' : ''}`}
                  style={{
                    '--connector-angle': `${p.angle}deg`,
                    '--connector-color': p.color,
                    '--connector-length': `${connectorLength}px`,
                  }}
                >
                  <span className="connector-track" />
                  <span className="connector-dot connector-dot-start" />
                  <span className="connector-dot connector-dot-end" />
                </div>
              );
            })}
          </div>
        )}

        {/* Spoke Cards */}
        {spokes.map((p) => {
          const rad = (p.angle * Math.PI) / 180;
          const xPos = radius * Math.cos(rad);
          const yPos = radius * Math.sin(rad);

          return (
            <div
              className={`spoke-card ecosystem-node ${p.isFuture ? 'future-slot' : ''} ${flipbookMode ? 'flipbook-card' : ''}`}
              key={p.id}
              style={{
                position: 'absolute',
                top: `${HONG_KONG_ANCHOR.y}%`,
                left: `${HONG_KONG_ANCHOR.x}%`,
                transform: `translate(calc(-50% + ${xPos}px), calc(-50% + ${yPos}px))`,
                '--project-color': p.color,
              }}
              onClick={() => {
                if (p.isFuture) return;
                trackSafetyNexusEvent('ecosystem_project_open', {
                  project_id: p.id,
                  project_name: p.title,
                });
                onSelect(p);
              }}
              role={p.isFuture ? undefined : 'button'}
              tabIndex={p.isFuture ? -1 : 0}
              aria-label={p.isFuture ? undefined : `Open ${p.title} ${p.subtitle}`}
              aria-disabled={p.isFuture ? 'true' : undefined}
              onKeyDown={(event) => {
                if (!p.isFuture && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault();
                  trackSafetyNexusEvent('ecosystem_project_open', {
                    project_id: p.id,
                    project_name: p.title,
                    input: 'keyboard',
                  });
                  onSelect(p);
                }
              }}
            >
              <div className="card-icon" style={{ position: 'relative', zIndex: 1 }}>{p.icon}</div>
              <div className="card-title" style={{ position: 'relative', zIndex: 1 }}>{p.title}</div>
              <div className="card-subtitle" style={{ position: 'relative', zIndex: 1 }}>{p.subtitle}</div>
              {flipbookMode && <div className="flipbook-indicator" style={{ position: 'relative', zIndex: 1 }}><Sparkles size={10} /> GEN</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DetailScene({ project, onBack, flipbookMode }) {
  const [isGenerating, setIsGenerating] = useState(flipbookMode);

  useEffect(() => {
    if (flipbookMode) {
      const timer = setTimeout(() => setIsGenerating(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [flipbookMode, project.id]);

  return (
    <div
      className={`scene ${flipbookMode ? 'flipbook-detail' : ''}`}
      key={project.id}
    >
      <div className="scene-bg-container">
        {flipbookMode && project.id === 'osh' ? (
           <div
           className="scene-bg" 
           style={{ backgroundImage: `url(/osh_bg.avif)` }}
         />
        ) : (
          <div
            className="scene-bg" 
            style={{ backgroundImage: `url(${project.bg})` }}
          />
        )}
        <div className="scene-vignette" />
        {isGenerating && (
          <div className="gen-overlay">
            <div className="gen-spinner">
              <Sparkles size={48} color="#22d3ee" />
            </div>
            <span>Generating infinite pixels...</span>
          </div>
        )}
      </div>

      {flipbookMode && project.id === 'osh' && !isGenerating && (
          <div
            className="video-stream-container"
          >
            <video 
              src="/preview.mp4" 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="stream-video"
            />
          </div>
        )}

      <button className="back-btn" onClick={onBack}>
        <ArrowLeft size={18} /> BACK TO ECOSYSTEM
      </button>

      <div
        className={`detail-panel ${flipbookMode ? 'flipbook-panel' : ''}`}
      >
        <div className="detail-header">
          <div className="card-icon-large">
            {project.icon}
          </div>
          <h2>{project.title}</h2>
          <p className="tag" style={{ color: project.color }}>
            {flipbookMode ? 'INFINITE EXPLORATION' : project.tag}
          </p>
        </div>

        <div className="description">
          {project.description}
          {flipbookMode && (
            <p className="flipbook-note">
              * This page is generated in real-time. No HTML or code was used to layout this information.
            </p>
          )}
        </div>

        <div className="stats-grid">
          {project.stats.map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-value" style={{ color: project.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="actions">
          {project.link ? (
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="launch-btn"
              onClick={() => trackSafetyNexusEvent('ecosystem_project_launch', {
                project_id: project.id,
                project_name: project.title,
              })}
            >
              <ExternalLink size={20} /> LAUNCH MODULE
            </a>
          ) : (
            <div className="coming-soon">
              <Info size={20} /> MODULE LINK PENDING
            </div>
          )}
          {flipbookMode && (
            <button className="stream-btn">
              <Play size={20} /> LIVE STREAM
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SafetyNexusEngine() {
  const [view, setView] = useState('home'); // 'home', 'detail'
  const [currentProject, setCurrentProject] = useState(null);
  const flipbookMode = false;

  const handleSelect = (p) => {
    setCurrentProject(p);
    setView('detail');
  };

  const handleBack = () => {
    trackSafetyNexusEvent('ecosystem_back_click', {
      project_id: currentProject?.id || '',
      project_name: currentProject?.title || '',
    });
    setCurrentProject(null);
    setView('home');
  };

  return (
    <div className={`app-wrapper ${flipbookMode ? 'theme-flipbook' : ''}`} style={{ position: 'relative', height: '800px', width: '100%', borderRadius: '32px', overflow: 'hidden' }}>
      {view === 'home' && (
          <HomeScene 
            key="home" 
            onSelect={handleSelect} 
            flipbookMode={flipbookMode} 
          />
      )}

      {view === 'detail' && (
          <DetailScene 
            key="detail"
            project={currentProject} 
            onBack={handleBack} 
            flipbookMode={flipbookMode}
          />
      )}
    </div>
  );
}
