import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PROJECTS } from '../data/projects';
import { ArrowLeft, ExternalLink, Play, Info, Sparkles, Image as ImageIcon, ChevronRight } from 'lucide-react';

// --- Flipbook Components ---

const FlipbookOverlay = ({ active, onToggle }) => (
  <div className={`flipbook-toggle ${active ? 'active' : ''}`} onClick={onToggle}>
    <div className="toggle-track">
      <div className="toggle-thumb">
        {active ? <Sparkles size={12} /> : <ImageIcon size={12} />}
      </div>
    </div>
    <span>FLIPBOOK MODE</span>
  </div>
);

function HomeScene({ onSelect, flipbookMode, onBack }) {
  const radius = 320;

  return (
    <motion.div 
      className={`scene ${flipbookMode ? 'flipbook-active' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      key="home"
    >
      <div className="scene-bg-container">
        <div className="scene-bg" style={{ backgroundImage: 'url(/bg_world.png)' }} />
        <div className="scene-vignette" />
      </div>



      <div className="scene-content">
        {/* Hub */}
        <motion.div 
          className="hub-node"
          layoutId="hub"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, type: 'spring' }}
          style={{ position: 'absolute', top: '50%', left: '50%', x: '-50%', y: '-50%', zIndex: 100 }}
        >
          <img src="/bot_qr.png" alt="QR" className="hub-qr" />
          <div className="hub-title">SafeT Chai Bot</div>
          <div className="hub-subtitle">Central AI Safety Hub</div>
        </motion.div>

        {/* SVG Neural Connections */}
        {!flipbookMode && (
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 5, pointerEvents: 'none' }}>
            {PROJECTS.filter(p => !p.isHub).map(p => {
              const rad = (p.angle * Math.PI) / 180;
              const x2 = 50 + (radius / window.innerWidth) * 100 * Math.cos(rad);
              const y2 = 50 + (radius / window.innerHeight) * 100 * Math.sin(rad);
              return (
                <motion.line
                  key={`line-${p.id}`}
                  x1="50%" y1="50%"
                  x2={`${x2}%`} y2={`${y2}%`}
                  stroke="rgba(34, 211, 238, 0.2)"
                  strokeWidth="1.5"
                  strokeDasharray="4,8"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                />
              );
            })}
          </svg>
        )}

        {/* Spoke Cards */}
        {PROJECTS.filter(p => !p.isHub).map((p, i) => {
          const rad = (p.angle * Math.PI) / 180;
          const xPos = radius * Math.cos(rad);
          const yPos = radius * Math.sin(rad);

          return (
            <motion.div
              className={`spoke-card ${flipbookMode ? 'flipbook-card' : ''}`}
              key={p.id}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                x: `calc(-50% + ${xPos}px)`,
                y: `calc(-50% + ${yPos}px)`,
                backgroundImage: p.bg ? `url(${p.bg})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05, zIndex: 110 }}
              onClick={() => onSelect(p)}
            >
              {/* Overlay for better text readability on image backgrounds */}
              {p.bg && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: -1, borderRadius: 'inherit' }} />}
              <div className="card-icon" style={{ position: 'relative', zIndex: 1 }}>{p.icon}</div>
              <div className="card-title" style={{ position: 'relative', zIndex: 1 }}>{p.title}</div>
              <div className="card-subtitle" style={{ position: 'relative', zIndex: 1 }}>{p.subtitle}</div>
              {flipbookMode && <div className="flipbook-indicator" style={{ position: 'relative', zIndex: 1 }}><Sparkles size={10} /> GEN</div>}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
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
    <motion.div 
      className={`scene ${flipbookMode ? 'flipbook-detail' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      key={project.id}
    >
      <div className="scene-bg-container">
        {flipbookMode && project.id === 'osh' ? (
           <motion.div 
           className="scene-bg" 
           style={{ backgroundImage: `url(/osh_bg.png)` }}
           layoutId={`bg-${project.id}`}
         />
        ) : (
          <motion.div 
            className="scene-bg" 
            style={{ backgroundImage: `url(${project.bg})` }}
            layoutId={`bg-${project.id}`}
          />
        )}
        <div className="scene-vignette" />
        {isGenerating && (
          <div className="gen-overlay">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            >
              <Sparkles size={48} color="#22d3ee" />
            </motion.div>
            <span>Generating infinite pixels...</span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {flipbookMode && project.id === 'osh' && !isGenerating && (
          <motion.div 
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
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button className="back-btn" onClick={onBack}>
        <ArrowLeft size={18} /> BACK TO ECOSYSTEM
      </motion.button>

      <motion.div 
        className={`detail-panel ${flipbookMode ? 'flipbook-panel' : ''}`}
        initial={{ x: flipbookMode ? 0 : 500, opacity: 0, scale: flipbookMode ? 0.9 : 1 }}
        animate={{ x: 0, opacity: 1, scale: 1 }}
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
      </motion.div>
    </motion.div>
  );
}

export default function SafetyNexusEngine() {
  const [view, setView] = useState('home'); // 'home', 'detail'
  const [currentProject, setCurrentProject] = useState(null);
  const [flipbookMode, setFlipbookMode] = useState(false);

  const handleSelect = (p) => {
    setCurrentProject(p);
    setView('detail');
  };

  const handleBack = () => {
    setCurrentProject(null);
    setView('home');
  };

  return (
    <div className={`app-wrapper ${flipbookMode ? 'theme-flipbook' : ''}`} style={{ position: 'relative', height: '800px', width: '100%', borderRadius: '32px', overflow: 'hidden' }}>
      <FlipbookOverlay active={flipbookMode} onToggle={() => setFlipbookMode(!flipbookMode)} />
      
      <AnimatePresence mode="wait">
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
      </AnimatePresence>
    </div>
  );
}
