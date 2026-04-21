import { useState, useEffect, useRef } from 'react'
import './App.css'
import { locales } from './locales.js'

const ProjectModal = ({ project, onClose, t }) => {
  if (!project) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        
        <div className="modal-header">
          <span className="tag-pill">{project.tag}</span>
          <h2>{project.title}</h2>
          <p className="modal-desc">{project.desc}</p>
        </div>

        <div className="modal-body">
          <div className="glass-card detail-card">
            <h4><span className="icon">🛡️</span> {t.projects.roleLabel}</h4>
            <p>{project.role}</p>
          </div>
          
          <div className="glass-card detail-card">
            <h4><span className="icon">🏗️</span> {t.projects.archLabel}</h4>
            <div className="tech-stack">
              {project.architecture.split('+').map((tech, i) => (
                <span key={i} className="tech-tag">{tech.trim()}</span>
              ))}
            </div>
          </div>
          
          {project.longContent && (
            <div className="glass-card detail-card project-long-content" style={{ gridColumn: '1 / -1', marginTop: '1rem' }} dangerouslySetInnerHTML={{ __html: project.longContent }} />
          )}
        </div>
        
        <div className="modal-footer">
          <a href={project.link} target="_blank" rel="noopener noreferrer" className="btn-lg">
            {t.projects.launchBtn}
          </a>
        </div>
      </div>
    </div>
  );
};

const RoleModal = ({ role, onClose, t }) => {
  if (!role) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        
        <div className="modal-header">
          <h2>{role.title}</h2>
          <p className="modal-desc">{role.org}</p>
        </div>

        <div className="modal-body role-modal-body">
          {role.longContent ? (
            <div className="project-long-content" dangerouslySetInnerHTML={{ __html: role.longContent }} />
          ) : (
            <div className="glass-card detail-card">
              <p>{role.desc}</p>
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button className="btn-lg action-btn" onClick={onClose}>
            {t.journey.closeWindow}
          </button>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [lang, setLang] = useState(localStorage.getItem('portfolio_lang') || 'en');
  const t = locales[lang];

  useEffect(() => {
    // Persist language choice
    localStorage.setItem('portfolio_lang', lang);
    
    // Update SEO
    document.title = t.seo.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', t.seo.desc);
    } else {
      const meta = document.createElement('meta');
      meta.name = "description";
      meta.content = t.seo.desc;
      document.head.appendChild(meta);
    }
    
    // Update document lang attribute
    document.documentElement.lang = lang;
  }, [lang, t]);

  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const mapRef = useRef(null);

  const [scrolled, setScrolled] = useState(false);
  const [heroImgIdx, setHeroImgIdx] = useState(0);

  const heroImages = [
    { url: "/alvin_headshot.png", title: "Chief Corporate Safety Manager", location: "Hong Kong MTR" },
    ...t.about.journeyHighlights
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroImgIdx(prev => (prev + 1) % heroImages.length);
    }, 4500); // Rotate every 4.5 seconds
    return () => clearInterval(interval);
  }, [heroImages.length]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMapLoad = () => {
    if (mapRef.current && mapRef.current.contentDocument) {
      const svgDoc = mapRef.current.contentDocument;
      
      const style = svgDoc.createElementNS("http://www.w3.org/2000/svg", "style");
      style.textContent = `
        path, g.mainland { 
          fill: rgba(255, 255, 255, 0.08); 
          stroke: rgba(255, 255, 255, 0.2); 
          stroke-width: 0.5px; 
          transition: all 0.3s ease; 
        }
        path:hover, g.mainland:hover { 
          fill: rgba(0, 242, 254, 0.5); 
          cursor: pointer; 
        }
        #cn, #cn path, #kr, #kr path, #jp, #jp path, #sg, #sg path, 
        #gb, #gb path, #ie, #ie path, #fr, #fr path, #de, #de path, #it, #it path, #ch, #ch path, #be, #be path, #nl, #nl path, #dk, #dk path, #se, #se path, 
        #us, #us path, #mx, #mx path, #br, #br path, #cl, #cl path, #co, #co path, #pe, #pe path, #cr, #cr path, #pa, #pa path, #do, #do path, #ec, #ec path, #ar, #ar path, 
        #eg, #eg path, #ru, #ru path, #kz, #kz path, #ua, #ua path, #sn, #sn path,
        #au, #au path, #my, #my path, #na, #na path, #bd, #bd path, #za, #za path, #nz, #nz path {
          fill: rgba(0, 242, 254, 0.3);
          stroke: #00f2fe;
          stroke-width: 1px;
        }
      `;
      svgDoc.documentElement.appendChild(style);
    }
  };

  return (
    <div className="layout">
      {/* Navigation */}
      <nav className={`navbar ${scrolled ? 'scrolled glass-panel' : ''}`}>
        <div className="logo">SAFETY <span>NEXUS</span></div>
        <div className="nav-links">
          <a href="#projects">{t.nav.ecosystem}</a>
          <a href="#graph">{t.nav.knowledgeGraph}</a>
          <a href="#experience">{t.nav.globalJourney}</a>
          <a href="#about">{t.nav.professional}</a>
          <a 
            href="https://www.linkedin.com/in/ir-bo-alvin-liao-2b237b95/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="connect-btn"
          >
            {t.nav.connect}
          </a>
          <div 
            className="lang-toggle-btn" 
            onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
            title="Toggle Language"
          >
            {t.nav.langToggle}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="badge glass-panel">GLOBAL SAFETY LEADER • AI EDUCATOR</div>
          <h1 className="gradient-text">{t.hero.title}</h1>
          <p className="hero-subtitle">{t.hero.subtitle}</p>
          <div className="hero-actions">
            <a href="#projects" className="btn-primary">
              {t.hero.btnPrimary} 
              <span className="btn-arrow">→</span>
            </a>
            <div className="system-status">
              <span className="pulse"></span> {t.hero.statusLabel} <span className="status-text">{t.hero.statusValue}</span>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          {heroImages.map((img, idx) => (
            <div key={idx} className={`hero-slide ${idx === heroImgIdx ? 'active' : ''}`}>
              <img src={img.url} alt={img.title} className="profile-img" />
              {idx !== 0 && (
                <div className="hero-slide-caption glass-panel">
                  <p className="hero-slide-loc">{img.location}</p>
                  <p className="hero-slide-title">{img.title}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Projects Grid */}
      <section id="projects" className="projects">
        <div className="section-header">
          <h2>{t.projects.sectionTitle.split(' ')[0]} <span>{t.projects.sectionTitle.split(' ').slice(1).join(' ')}</span></h2>
          <p>{t.projects.sectionSub}</p>
        </div>
        <div className="grid">
          {t.projects.registry.map((project, idx) => (
            <div 
              className={`project-card glass-panel variant-${project.backgroundVariant}`} 
              key={idx}
              onClick={() => setSelectedProject(project)}
            >
              <div className="card-top">
                <span className="tag">{project.tag}</span>
                <span className="stats">{project.stats}</span>
              </div>
              <div className="card-body">
                <h3>{project.title}</h3>
                <p>{project.desc}</p>
              </div>
              <div className="card-footer">
                <a 
                  href={project.link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="view-btn"
                  onClick={(e) => {
                    if (project.link === '#') {
                      e.preventDefault();
                    } else {
                      e.stopPropagation();
                    }
                  }}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  {t.projects.launchBtn} ➔
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* Knowledge Graph Section */}
      <section id="graph" className="knowledge-graph">
         <div className="section-header">
            <h2>{t.graph.sectionTitle.split(' ').slice(0, -1).join(' ')} <span>{t.graph.sectionTitle.split(' ').slice(-1)}</span></h2>
            <p>{t.graph.sectionSub}</p>
         </div>
         <div className="graph-container-wrapper glass-panel">
            <iframe 
              src="/v2_graph.html" 
              title="Knowledge Graph"
              className="graph-iframe"
              loading="lazy"
            ></iframe>
            <div className="graph-overlay-hint">
               <a href="/v2_graph.html" target="_blank" rel="noopener noreferrer" className="btn-sm">
                 {t.graph.fullscreenBtn} ↗
               </a>
            </div>
         </div>
      </section>

      {/* Experience Timeline */}
      <section id="experience" className="experience projects">
         <div className="section-header">
            <h2>{t.journey.sectionTitle.split(' ')[0]} <span>{t.journey.sectionTitle.split(' ').slice(1).join(' ')}</span></h2>
            <p>{t.journey.sectionSub}</p>
         </div>

         <div className="footprint-container glass-panel">
            <div className="footprint-header">
              <h3>{t.journey.footprintTitle.split(' ')[0]} <span>{t.journey.footprintTitle.split(' ').slice(1).join(' ')}</span></h3>
              <p>{t.journey.footprintSub}</p>
            </div>
            <div className="world-map-svg">
              <object 
                ref={mapRef}
                data="/world.svg" 
                type="image/svg+xml" 
                onLoad={handleMapLoad}
                className="interactive-map simple-map"
                aria-label="Global Footprint World Map"
                style={{ pointerEvents: 'auto', display: 'block', width: '100%', height: '100%' }}
              />
              <div className="country-grid">
                <div className="region-group">
                  <label>{t.journey.asia}</label>
                  <span>{t.journey.asiaList}</span>
                </div>
                <div className="region-group">
                  <label>{t.journey.europe}</label>
                  <span>{t.journey.europeList}</span>
                </div>
                <div className="region-group">
                  <label>{t.journey.americas}</label>
                  <span>{t.journey.americasList}</span>
                </div>
                <div className="region-group">
                  <label>{t.journey.africa}</label>
                  <span>{t.journey.africaList}</span>
                </div>
              </div>
            </div>
         </div>

         <div className="timeline">
            {t.journey.timeline.map((item, idx) => (
              <div 
                className="timeline-item glass-panel" 
                key={idx} 
                onClick={() => setSelectedExperience(item)}
                style={{ cursor: 'pointer' }}
              >
                <div className="year-pill">{item.year}</div>
                <div className="timeline-content">
                  <h4>{item.title}</h4>
                  <p className="org">{item.org}</p>
                  <p className="desc">{item.desc}</p>
                  <div className="view-details-btn">{t.journey.viewDetails}</div>
                </div>
              </div>
            ))}
         </div>
      </section>

      {/* Experience Modal */}
      {selectedExperience && (
        <div className="modal-overlay" onClick={() => setSelectedExperience(null)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedExperience(null)}>×</button>
            <div className="modal-header">
              <h2>{selectedExperience.title}</h2>
              <p className="modal-subtitle">{selectedExperience.org} | {selectedExperience.year}</p>
            </div>
            <div className="modal-body experience-modal-body">
              <h3>{t.journey.respTitle}</h3>
              {selectedExperience.details ? (
                <ul className="experience-bullet-list">
                  {selectedExperience.details.map((bullet, i) => {
                    const colonIndex = bullet.indexOf('：') > -1 ? bullet.indexOf('：') : bullet.indexOf(':');
                    if (colonIndex > -1) {
                      const tag = bullet.substring(0, colonIndex);
                      const desc = bullet.substring(colonIndex + 1);
                      return (
                        <li key={i}>
                          <strong>{tag}:</strong>{desc}
                        </li>
                      );
                    }
                    return <li key={i}>{bullet}</li>;
                  })}
                </ul>
              ) : (
                <p className="experience-desc">{selectedExperience.desc}</p>
              )}
            </div>
            <div className="modal-footer">
              <button className="action-btn" onClick={() => setSelectedExperience(null)}>{t.journey.closeWindow}</button>
            </div>
          </div>
        </div>
      )}

      {/* Project Modal */}
      <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} t={t} />

      {/* Resume & Credentials */}
      <section id="about" className="manifesto glass-panel resume-section">
        <div className="manifesto-content">
          <h2>{t.about.sectionTitle.split(' ').slice(0, -1).join(' ')} <span>{t.about.sectionTitle.split(' ').slice(-1)}</span></h2>
          
          <div className="identity-hero">
            <p className="identity-lead">
              {t.about.leadTextPrefix}<strong>{t.about.leadTextBold}</strong>{t.about.leadTextSuffix}
            </p>
            <div className="identity-stats">
              <div className="stat-box">
                <span className="stat-number">18+</span>
                <span className="stat-label">{t.about.stat1}</span>
              </div>
              <div className="stat-box">
                <span className="stat-number">17+</span>
                <span className="stat-label">{t.about.stat2}</span>
              </div>
              <div className="stat-box">
                <span className="stat-number">2.4<small>GW</small></span>
                <span className="stat-label">{t.about.stat3}</span>
              </div>
            </div>
            <p className="identity-sub">
              {t.about.subTextPrefix}<strong>{t.about.subTextBold}</strong>{t.about.subTextSuffix}
            </p>

            <div className="video-spotlight glass-panel">
              <div className="video-header">
                <h3>📽️ {t.about.aiVideoTitle}</h3>
                <p>{t.about.aiVideoDesc}</p>
              </div>
              <div className="video-container" style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '12px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
                <iframe 
                  src="//player.bilibili.com/player.html?bvid=BV1D7421h7Lw&page=1&high_quality=1&danmaku=0" 
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                  allowFullScreen
                  scrolling="no"
                  frameBorder="0"
                  sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts"
                  title="Safety Nexus AI Video"
                ></iframe>
              </div>
            </div>
          </div>

          <div className="credentials-bento">
            {/* Social Roles */}
            <div className="bento-box bento-social glass-card">
              <h3>🤝 {t.about.socialTitle}</h3>
              <div className="social-roles">
                {t.about.socialRoles.map((role, idx) => (
                  <div 
                    className={`role-item ${role.longContent ? 'clickable' : ''}`} 
                    key={idx}
                    onClick={() => role.longContent && setSelectedRole(role)}
                  >
                    <div className="role-icon">
                      {idx === 0 ? '🏛️' : idx === 1 ? '⚙️' : idx === 2 ? '🚀' : '🛡️'}
                    </div>
                    <div className="role-info">
                      <h4>{role.title}</h4>
                      <p>{role.org}</p>
                      <span>{role.desc}</span>
                      {role.longContent && <div className="role-view-more">{lang === 'en' ? 'View Details ➔' : '查看详情 ➔'}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div className="bento-box bento-certs glass-card">
              <h3>🏆 {t.about.certTitle}</h3>
              <div className="cert-tags">
                {t.about.certList.map((cert, i) => (
                  <span key={i} className={`cert-tag ${cert.category}`}>
                    {cert.category === 'ai' ? '🤖 ' : cert.category === 'safety' ? '🛡️ ' : '📈 '}
                    {cert.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Education */}
            <div className="bento-box bento-edu glass-card">
              <h3>🎓 {t.about.eduTitle}</h3>
              <ul className="edu-list">
                <li>
                  <div className="edu-marker"></div>
                  <div className="edu-data">
                    <strong>Shanghai Jiao Tong University</strong>
                    <span>{t.about.eduMaster}</span>
                  </div>
                </li>
                <li>
                  <div className="edu-marker"></div>
                  <div className="edu-data">
                    <strong>Wuhan University</strong>
                    <span>{t.about.eduBachelor}</span>
                  </div>
                </li>
                <li>
                  <div className="edu-marker"></div>
                  <div className="edu-data">
                    <strong>Naval University of Engineering</strong>
                    <span>{t.about.eduJoint}</span>
                  </div>
                </li>
              </ul>
              <div className="languages-box">
                <div className="lang-tags">
                  {t.about.languages.map((l, i) => <span key={i}>{l}</span>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Modal */}
      <RoleModal role={selectedRole} onClose={() => setSelectedRole(null)} t={t} />

      <footer>
        <p>© 2026 <a href="https://www.linkedin.com/in/ir-bo-alvin-liao-2b237b95/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>Alvin Liao</a> | {t.footerLabel}</p>
      </footer>
    </div>
  );
}

export default App;
