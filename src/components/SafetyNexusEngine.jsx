import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PROJECTS } from '../data/projects';
import { ArrowLeft, ExternalLink, Play, Info, Sparkles } from 'lucide-react';

const HONG_KONG_ANCHOR = {
  x: 50,
  y: 51,
};

const Motion = motion;

// --- Hook ---
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);
  return isMobile;
}

function HomeScene({ onSelect, flipbookMode, isMobile }) {
  const radius = 340;

  // --- Mobile grid layout ---
  if (isMobile) {
    return (
      <Motion.div
        className={`scene scene-mobile ${flipbookMode ? 'flipbook-active' : ''}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        key="home"
      >
        <div className="scene-bg-container">
          <div className="scene-bg home-world-bg" style={{ backgroundImage: 'url(/bg_world.png)' }} />
          <div className="scene-vignette" />
        </div>

        <div className="mobile-scroll-content">
          <Motion.div
            className="hub-node-ai hub-node-mobile-ai"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, type: 'spring' }}
            onClick={() => onSelect({ id: 'safet-bot' })}
          >
            <img src="/bot_qr.png" alt="QR" className="hub-qr-ai" />
            <div className="hub-title-ai">SafeT Chai Bot</div>
            <div className="hub-subtitle-ai">Central AI Safety Hub</div>
          </Motion.div>

          <div className="spoke-grid-mobile">
            {PROJECTS.filter(p => !p.isHub).map((p, i) => (
              <Motion.div
                className={`spoke-card-mobile-ai ${flipbookMode ? 'flipbook-card' : ''}`}
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onSelect(p)}
              >
                <div className="card-icon-ai" style={{ color: p.color }}>{p.icon}</div>
                <div className="card-title-ai">{p.title}</div>
                <div className="card-subtitle-ai">{p.subtitle}</div>
                {flipbookMode && <div className="flipbook-indicator"><Sparkles size={10} /> GEN</div>}
              </Motion.div>
            ))}
          </div>
        </div>
      </Motion.div>
    );
  }

  // --- Desktop radial layout ---
  return (
    <Motion.div 
      className={`scene ${flipbookMode ? 'flipbook-active' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      key="home"
    >
      <div className="scene-bg-container">
        <div className="scene-bg home-world-bg" style={{ backgroundImage: 'url(/bg_world.png)' }} />
        <div className="scene-vignette" />
      </div>

      <div className="scene-content hub-spoke-visual-ai">
        {/* SVG Neural Connections */}
        {!flipbookMode && (
          <svg className="spoke-lines-svg-ai" aria-hidden="true" style={{ width: '800px', height: '800px', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', overflow: 'visible' }}>
            {PROJECTS.filter(p => !p.isHub).map(p => {
              const rad = (p.angle * Math.PI) / 180;
              const xPos = radius * Math.cos(rad);
              const yPos = radius * Math.sin(rad);
              return (
                <Motion.line
                  key={`line-${p.id}`}
                  x1={400} y1={400}
                  x2={400 + xPos}
                  y2={400 + yPos}
                  className="connection-line-ai"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                />
              );
            })}
          </svg>
        )}

        {/* Hub */}
        <Motion.div 
          className="hub-node-ai"
          layoutId="hub"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, type: 'spring' }}
          style={{ position: 'absolute', top: `50%`, left: `50%`, x: '-50%', y: '-50%', zIndex: 100 }}
        >
          <img src="/bot_qr.png" alt="QR" className="hub-qr-ai" />
          <div className="hub-title-ai">SafeT Chai Bot</div>
          <div className="hub-subtitle-ai">Central AI Safety Hub</div>
        </Motion.div>

        {/* Spoke Cards */}
        {PROJECTS.filter(p => !p.isHub).map(p => {
          const rad = (p.angle * Math.PI) / 180;
          const xPos = radius * Math.cos(rad);
          const yPos = radius * Math.sin(rad);

          return (
            <Motion.div
              className={`spoke-wrapper-ai ${flipbookMode ? 'flipbook-card' : ''}`}
              key={p.id}
              style={{
                position: 'absolute',
                top: `50%`,
                left: `50%`,
                marginLeft: '-100px',
                marginTop: '-70px',
                x: xPos,
                y: yPos,
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05, zIndex: 110 }}
              onClick={() => onSelect(p)}
            >
              <div className="spoke-node-ai">
                <div className="card-icon-ai" style={{ color: p.color }}>{p.icon}</div>
                <h4 className="card-title-ai">{p.title}</h4>
                <p className="card-subtitle-ai">{p.subtitle}</p>
                {flipbookMode && <div className="flipbook-indicator" style={{ position: 'relative', zIndex: 1 }}><Sparkles size={10} /> GEN</div>}
              </div>
            </Motion.div>
          );
        })}
      </div>
    </Motion.div>
  );
}

function DetailScene({ project, onBack, flipbookMode, isMobile }) {
  const [isGenerating, setIsGenerating] = useState(flipbookMode);

  useEffect(() => {
    if (flipbookMode) {
      const timer = setTimeout(() => setIsGenerating(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [flipbookMode, project.id]);

  return (
    <Motion.div 
      className={`scene ${isMobile ? 'scene-mobile' : ''} ${flipbookMode ? 'flipbook-detail' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      key={project.id}
    >
      <div className="scene-bg-container">
        {flipbookMode && project.id === 'osh' ? (
           <Motion.div 
           className="scene-bg" 
           style={{ backgroundImage: `url(/osh_bg.png)` }}
           layoutId={`bg-${project.id}`}
         />
        ) : (
          <Motion.div 
            className="scene-bg" 
            style={{ backgroundImage: `url(${project.bg})` }}
            layoutId={`bg-${project.id}`}
          />
        )}
        <div className="scene-vignette" />
        {isGenerating && (
          <div className="gen-overlay">
            <Motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            >
              <Sparkles size={isMobile ? 32 : 48} color="#22d3ee" />
            </Motion.div>
            <span>Generating infinite pixels...</span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {flipbookMode && project.id === 'osh' && !isGenerating && (
          <Motion.div 
            className="video-stream-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <video 
              src="/preview.mp4" 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="stream-video"
            />
          </Motion.div>
        )}
      </AnimatePresence>

      <Motion.button className="back-btn" onClick={onBack}>
        <ArrowLeft size={isMobile ? 16 : 18} /> {isMobile ? 'BACK' : 'BACK TO ECOSYSTEM'}
      </Motion.button>

      <Motion.div 
        className={`detail-panel ${flipbookMode ? 'flipbook-panel' : ''}`}
        initial={isMobile 
          ? { y: 100, opacity: 0 }
          : { x: flipbookMode ? 0 : 500, opacity: 0, scale: flipbookMode ? 0.9 : 1 }
        }
        animate={isMobile
          ? { y: 0, opacity: 1 }
          : { x: 0, opacity: 1, scale: 1 }
        }
        transition={{ type: 'spring', damping: 20 }}
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
            <a href={project.link} target="_blank" rel="noreferrer" className="launch-btn">
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
      </Motion.div>
    </Motion.div>
  );
}

export default function SafetyNexusEngine() {
  const [view, setView] = useState('home');
  const [currentProject, setCurrentProject] = useState(null);
  const flipbookMode = false;
  const isMobile = useIsMobile();

  const handleSelect = (p) => {
    setCurrentProject(p);
    setView('detail');
  };

  const handleBack = () => {
    setCurrentProject(null);
    setView('home');
  };

  return (
    <div className={`app-wrapper ${flipbookMode ? 'theme-flipbook' : ''}`} style={{ position: 'relative', height: isMobile ? 'auto' : '800px', minHeight: isMobile ? '600px' : undefined, width: '100%', borderRadius: isMobile ? '16px' : '32px', overflow: 'hidden' }}>
      <AnimatePresence mode="wait">
        {view === 'home' && (
          <HomeScene 
            key="home" 
            onSelect={handleSelect} 
            flipbookMode={flipbookMode}
            isMobile={isMobile}
          />
        )}

        {view === 'detail' && (
          <DetailScene 
            key="detail"
            project={currentProject} 
            onBack={handleBack} 
            flipbookMode={flipbookMode}
            isMobile={isMobile}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
