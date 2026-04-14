import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { docsContent, DocSection, DocPage, DocBlock } from '../data/docsContent';

const GR = 'var(--green-400)';
const GD = 'var(--text-dim)';

const CodeBlock: React.FC<{ block: DocBlock }> = ({ block }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(block.content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={{ position: 'relative', margin: '16px 0 24px' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(0,0,0,0.6)', padding: '8px 16px',
        borderRadius: '12px 12px 0 0', border: '1px solid rgba(255,255,255,0.07)',
        borderBottom: 'none',
      }}>
        <span style={{ fontSize: '0.72rem', color: GD, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {block.language || 'code'}
        </span>
        <button onClick={handleCopy} style={{
          background: 'none', border: `1px solid ${copied ? 'var(--green-600)' : 'rgba(255,255,255,0.1)'}`,
          color: copied ? GR : GD, padding: '4px 12px', borderRadius: '6px', cursor: 'pointer',
          fontSize: '0.7rem', transition: 'all 0.3s',
        }}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre style={{
        background: 'rgba(0,0,0,0.45)', padding: '20px',
        borderRadius: '0 0 12px 12px', border: '1px solid rgba(255,255,255,0.07)',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        overflowX: 'auto', margin: 0,
        fontSize: '0.85rem', lineHeight: 1.7,
        color: 'rgba(255,255,255,0.85)',
      }}>
        <code>{block.content}</code>
      </pre>
    </div>
  );
};

const renderBlock = (block: DocBlock, idx: number) => {
  switch (block.type) {
    case 'heading': {
      const Tag = `h${block.level || 1}` as keyof JSX.IntrinsicElements;
      const sizes: Record<number, string> = { 1: '2rem', 2: '1.45rem', 3: '1.15rem' };
      const margins: Record<number, string> = { 1: '0 0 24px', 2: '40px 0 16px', 3: '32px 0 12px' };
      const id = (block.content || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return (
        <Tag key={idx} id={id} style={{
          fontSize: sizes[block.level || 1] || '1.15rem',
          fontFamily: 'Inter, sans-serif', fontWeight: 800,
          color: block.level === 1 ? '#F0F0F0' : GR,
          margin: margins[block.level || 1] || '32px 0 12px',
          letterSpacing: block.level === 1 ? '-0.04em' : '-0.02em',
          lineHeight: 1.25, scrollMarginTop: '100px',
        }}>
          {block.level === 1 && (
            <div style={{
              width: '36px', height: '3px', borderRadius: '2px',
              background: 'linear-gradient(90deg, var(--accent), var(--green-600))',
              marginBottom: '16px',
            }} />
          )}
          {block.content}
        </Tag>
      );
    }

    case 'paragraph':
      return (
        <p key={idx} style={{ color: '#C8C8D4', fontSize: '0.95rem', lineHeight: 1.85, margin: '0 0 18px' }}
          dangerouslySetInnerHTML={{ __html: (block.content || '').replace(/\*\*(.*?)\*\*/g, '<strong style="color: #F0F0F0; font-weight: 700">$1</strong>') }}
        />
      );

    case 'code':
      return <CodeBlock key={idx} block={block} />;

    case 'list':
      return (
        <ul key={idx} style={{ margin: '0 0 22px', paddingLeft: 0, listStyle: 'none' }}>
          {(block.items || []).map((item, i) => (
            <li key={i} style={{
              padding: '11px 18px 11px 18px', color: '#C8C8D4',
              fontSize: '0.92rem', lineHeight: 1.75, margin: '5px 0',
              borderLeft: '2px solid rgba(61,158,78,0.5)',
              background: 'rgba(0,0,0,0.30)',
              borderRadius: '0 8px 8px 0', transition: 'background 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(61,158,78,0.07)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.30)')}
              dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, `<strong style="color: var(--green-300); font-weight: 700">$1</strong>`) }} />
          ))}
        </ul>
      );

    case 'callout': {
      const variants: Record<string, { bg: string; border: string; icon: string; titleColor: string }> = {
        info: { bg: 'rgba(61,158,78,0.1)', border: 'rgba(61,158,78,0.3)', icon: 'ℹ️', titleColor: 'var(--green-300)' },
        warning: { bg: 'rgba(255,170,0,0.1)', border: 'rgba(255,170,0,0.35)', icon: '⚠️', titleColor: '#FFAA00' },
        tip: { bg: 'rgba(61,158,78,0.1)', border: 'rgba(61,158,78,0.35)', icon: '💡', titleColor: 'var(--green-200)' },
        danger: { bg: 'rgba(255,51,102,0.1)', border: 'rgba(255,51,102,0.35)', icon: '🚨', titleColor: '#FF5577' },
      };
      const v = variants[block.variant || 'info'];
      return (
        <div key={idx} style={{ background: v.bg, border: `1px solid ${v.border}`, borderRadius: '12px', padding: '18px 22px', margin: '20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span>{v.icon}</span>
            <strong style={{ color: v.titleColor, fontSize: '0.82rem', letterSpacing: '0.04em', fontWeight: 700 }}>{block.title}</strong>
          </div>
          <p style={{ color: '#C8C8D4', fontSize: '0.9rem', lineHeight: 1.75, margin: 0 }}>{block.content}</p>
        </div>
      );
    }

    case 'table':
      return (
        <div key={idx} style={{ overflowX: 'auto', margin: '16px 0 24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.35)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'rgba(61,158,78,0.08)' }}>
                {(block.headers || []).map((h, i) => (
                  <th key={i} style={{
                    padding: '13px 18px', textAlign: 'left',
                    color: 'var(--green-300)', fontWeight: 700,
                    borderBottom: '1px solid rgba(61,158,78,0.2)',
                    fontSize: '0.74rem', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(block.rows || []).map((row, ri) => (
                <tr key={ri} style={{ borderBottom: ri < (block.rows?.length || 0) - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', transition: 'background 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{
                      padding: '11px 18px', color: ci === 0 ? '#F0F0F0' : '#C8C8D4',
                      fontWeight: ci === 0 ? 600 : 400,
                    }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'divider':
      return <hr key={idx} style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '32px 0' }} />;

    case 'steps':
      return (
        <div key={idx} style={{ margin: '20px 0 28px' }}>
          {(block.steps || []).map((step, i) => (
            <div key={i} style={{
              display: 'flex', gap: '16px', marginBottom: '12px',
              padding: '16px 20px', borderRadius: '12px',
              background: 'rgba(0,0,0,0.30)',
              border: '1px solid rgba(255,255,255,0.07)', transition: 'all 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(61,158,78,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.30)')}>
              <div style={{
                width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                background: 'rgba(61,158,78,0.15)', border: '1px solid var(--green-700)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '0.8rem', color: 'var(--green-300)',
              }}>{i + 1}</div>
              <div>
                <div style={{ color: '#F0F0F0', fontWeight: 700, marginBottom: '5px', fontSize: '0.93rem' }}>{step.title}</div>
                <div style={{ color: '#C8C8D4', fontSize: '0.87rem', lineHeight: 1.75 }}>{step.description}</div>
              </div>
            </div>
          ))}
        </div>
      );

    default:
      return null;
  }
};

interface SidebarProps {
  sections: DocSection[];
  activeSection: string;
  activePage: string;
  onNavigate: (sectionId: string, pageId: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sections, activeSection, activePage, onNavigate, searchQuery, onSearchChange, isMobileOpen, onMobileClose }) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    sections.forEach(s => { init[s.id] = true; });
    return init;
  });

  const toggleSection = (id: string) => setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));

  const sidebarContent = (
    <>
      {}
      <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'rgba(61,158,78,0.15)', border: '1px solid var(--green-700)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem', fontWeight: 800, color: GR,
          }}>O</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#F0F0F0', letterSpacing: '-0.02em' }}>obscura</div>
            <div style={{ fontSize: '0.62rem', color: GD, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Documentation</div>
          </div>
        </div>
        {}
        <div style={{ position: 'relative' }}>
          <input type="text" placeholder="Search docs..." value={searchQuery} onChange={e => onSearchChange(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px 10px 34px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px', color: '#F0F0F0', fontSize: '0.83rem', outline: 'none', transition: 'all 0.3s', boxSizing: 'border-box',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--green-600)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
          />
          <span style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: GD, fontSize: '0.82rem', pointerEvents: 'none' }}>🔍</span>
        </div>
      </div>

      {}
      <div style={{ padding: '10px 0', overflowY: 'auto', flex: 1 }}>
        {sections.map(section => (
          <div key={section.id} style={{ marginBottom: '2px' }}>
            <button onClick={() => toggleSection(section.id)}
              style={{
                width: '100%', padding: '9px 20px',
                display: 'flex', alignItems: 'center', gap: '9px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: activeSection === section.id ? GR : GD,
                fontSize: '0.76rem', letterSpacing: '0.06em', textTransform: 'uppercase',
                fontWeight: 700, textAlign: 'left', transition: 'color 0.2s',
              }}>
              <span style={{ fontSize: '0.95rem' }}>{section.icon}</span>
              <span style={{ flex: 1 }}>{section.title}</span>
              <span style={{ fontSize: '0.65rem', transition: 'transform 0.3s', transform: expandedSections[section.id] ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
            </button>

            <AnimatePresence>
              {expandedSections[section.id] && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} style={{ overflow: 'hidden' }}>
                  {section.pages.map(page => (
                    <button key={page.id} onClick={() => { onNavigate(section.id, page.id); onMobileClose(); }}
                      style={{
                        width: '100%', padding: '7px 20px 7px 50px',
                        background: activePage === page.id ? 'rgba(61,158,78,0.08)' : 'none',
                        border: 'none', borderLeft: activePage === page.id ? '2px solid var(--green-500)' : '2px solid transparent',
                        cursor: 'pointer', textAlign: 'left',
                        color: activePage === page.id ? GR : GD,
                        fontSize: '0.83rem', transition: 'all 0.18s', display: 'block',
                      }}
                      onMouseEnter={e => { if (activePage !== page.id) e.currentTarget.style.color = '#F0F0F0'; }}
                      onMouseLeave={e => { if (activePage !== page.id) e.currentTarget.style.color = GD; }}>
                      {page.title}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {}
      <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <a href="/" style={{ display: 'block', padding: '7px 0', color: GD, textDecoration: 'none', fontSize: '0.8rem', transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = GR}
          onMouseLeave={e => e.currentTarget.style.color = GD}>
          Back to home
        </a>
        <a href="/app" style={{ display: 'block', padding: '7px 0', color: GD, textDecoration: 'none', fontSize: '0.8rem', transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = GR}
          onMouseLeave={e => e.currentTarget.style.color = GD}>
          Launch app
        </a>
      </div>
    </>
  );

  return (
    <>
      <aside className="docs-sidebar-desktop" style={{
        width: '260px', height: '100vh', position: 'fixed', top: 0, left: 0,
        background: 'rgba(7,7,10,0.97)', borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column', zIndex: 100, backdropFilter: 'blur(16px)',
      }}>{sidebarContent}</aside>

      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onMobileClose}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 199, backdropFilter: 'blur(4px)' }} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 26, stiffness: 200 }}
              style={{
                width: '260px', height: '100vh', position: 'fixed', top: 0, left: 0,
                background: 'rgba(7,7,10,0.99)', borderRight: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', flexDirection: 'column', zIndex: 200,
              }}>{sidebarContent}</motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

const TableOfContents: React.FC<{ page: DocPage | null }> = ({ page }) => {
  const headings = useMemo(() => {
    if (!page) return [];
    return page.content
      .filter(b => b.type === 'heading' && (b.level === 2 || b.level === 3))
      .map(b => ({
        text: b.content || '', level: b.level || 2,
        id: (b.content || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      }));
  }, [page]);

  if (headings.length < 2) return null;

  return (
    <div className="docs-toc-desktop" style={{ width: '200px', position: 'sticky', top: '40px', alignSelf: 'flex-start', flexShrink: 0 }}>
      <div style={{ fontSize: '0.68rem', color: GD, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px', paddingLeft: '12px' }}>
        On this page
      </div>
      {headings.map((h, i) => (
        <a key={i} href={`#${h.id}`} style={{
          display: 'block', padding: '5px 12px',
          paddingLeft: h.level === 3 ? '22px' : '12px',
          color: GD, textDecoration: 'none',
          fontSize: '0.78rem', lineHeight: 1.5,
          borderLeft: '1px solid rgba(255,255,255,0.06)', transition: 'all 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.color = GR; e.currentTarget.style.borderLeftColor = 'var(--green-600)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = GD; e.currentTarget.style.borderLeftColor = 'rgba(255,255,255,0.06)'; }}>
          {h.text}
        </a>
      ))}
    </div>
  );
};

interface SearchResult { sectionId: string; sectionTitle: string; pageId: string; pageTitle: string; snippet: string; }

const getSearchResults = (query: string): SearchResult[] => {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  const results: SearchResult[] = [];
  docsContent.forEach(section => {
    section.pages.forEach(page => {
      const pageText = page.content.map(b => {
        let text = b.content || '';
        if (b.items) text += ' ' + b.items.join(' ');
        if (b.rows) text += ' ' + b.rows.flat().join(' ');
        if (b.steps) text += ' ' + b.steps.map(s => s.title + ' ' + s.description).join(' ');
        return text;
      }).join(' ');
      if (pageText.toLowerCase().includes(q) || page.title.toLowerCase().includes(q)) {
        const idx = pageText.toLowerCase().indexOf(q);
        const start = Math.max(0, idx - 40);
        const end = Math.min(pageText.length, idx + query.length + 60);
        const snippet = (start > 0 ? '...' : '') + pageText.slice(start, end) + (end < pageText.length ? '...' : '');
        results.push({ sectionId: section.id, sectionTitle: section.title, pageId: page.id, pageTitle: page.title, snippet });
      }
    });
  });
  return results.slice(0, 10);
};

/* ══════════════════════════════════════════════════════════
   MAIN DOCS PAGE
   ══════════════════════════════════════════════════════════ */
const DocsPage: React.FC = () => {
  const navigate = useNavigate();
  const { section: urlSection, page: urlPage } = useParams<{ section?: string; page?: string }>();

  const [activeSection, setActiveSection] = useState(urlSection || 'getting-started');
  const [activePage, setActivePage] = useState(urlPage || 'introduction');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (urlSection) setActiveSection(urlSection);
    if (urlPage) setActivePage(urlPage);
  }, [urlSection, urlPage]);

  const handleNavigate = (sectionId: string, pageId: string) => {
    setActiveSection(sectionId); setActivePage(pageId); setSearchQuery('');
    navigate(`/docs/${sectionId}/${pageId}`, { replace: true });
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentSection = docsContent.find(s => s.id === activeSection);
  const currentPage = currentSection?.pages.find(p => p.id === activePage) || null;

  const allPages = useMemo(() => {
    const pages: { sectionId: string; sectionTitle: string; page: DocPage }[] = [];
    docsContent.forEach(s => s.pages.forEach(p => pages.push({ sectionId: s.id, sectionTitle: s.title, page: p })));
    return pages;
  }, []);

  const currentIndex = allPages.findIndex(p => p.sectionId === activeSection && p.page.id === activePage);
  const prevPage = currentIndex > 0 ? allPages[currentIndex - 1] : null;
  const nextPage = currentIndex < allPages.length - 1 ? allPages[currentIndex + 1] : null;
  const searchResults = useMemo(() => getSearchResults(searchQuery), [searchQuery]);

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'rgba(5,6,8,0.72)',
        backdropFilter: 'blur(0px)',
        pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative', zIndex: 10, display: 'flex' }}>
        <Sidebar sections={docsContent} activeSection={activeSection} activePage={activePage}
          onNavigate={handleNavigate} searchQuery={searchQuery} onSearchChange={setSearchQuery}
          isMobileOpen={isMobileMenuOpen} onMobileClose={() => setIsMobileMenuOpen(false)} />

        <div ref={contentRef} className="docs-main-content" style={{
          marginLeft: '260px', flex: 1, minHeight: '100vh', display: 'flex', justifyContent: 'center',
          background: 'rgba(7,8,12,0.88)',
          borderLeft: '1px solid rgba(255,255,255,0.05)',
        }}>
          {}
          <div className="docs-mobile-header" style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99,
            background: 'rgba(7,7,10,0.95)', backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            padding: '12px 20px', display: 'none', alignItems: 'center', gap: '12px',
          }}>
            <button onClick={() => setIsMobileMenuOpen(true)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#F0F0F0', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>☰</button>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#F0F0F0', letterSpacing: '-0.02em' }}>obscura docs</div>
          </div>

          <div style={{ maxWidth: '900px', width: '100%', padding: '48px 52px 100px', display: 'flex', gap: '48px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px', fontSize: '0.73rem', color: GD }}>
                <a href="/docs" style={{ color: GD, textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = GR}
                  onMouseLeave={e => e.currentTarget.style.color = GD}>Docs</a>
                <span>/</span>
                <span>{currentSection?.title}</span>
                <span>/</span>
                <span style={{ color: GR }}>{currentPage?.title}</span>
              </div>

              {searchQuery.length >= 2 ? (
                <div>
                  <h2 style={{ color: '#F0F0F0', fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '24px' }}>
                    Results for "{searchQuery}"
                  </h2>
                  {searchResults.length === 0 ? (
                    <p style={{ color: GD }}>No results found.</p>
                  ) : (
                    searchResults.map((r, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                        onClick={() => handleNavigate(r.sectionId, r.pageId)}
                        style={{ padding: '16px 20px', marginBottom: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green-600)'; e.currentTarget.style.background = 'rgba(61,158,78,0.04)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.68rem', color: GD, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{r.sectionTitle}</span>
                          <span style={{ color: GD, fontSize: '0.68rem' }}>/</span>
                          <span style={{ color: GR, fontSize: '0.83rem', fontWeight: 600 }}>{r.pageTitle}</span>
                        </div>
                        <p style={{ color: GD, fontSize: '0.8rem', lineHeight: 1.6, margin: 0 }}>{r.snippet}</p>
                      </motion.div>
                    ))
                  )}
                </div>
              ) : (
                <motion.div key={activePage} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                  {currentPage?.content.map((block, i) => renderBlock(block, i))}

                  {}
                  <div style={{ display: 'flex', gap: '16px', marginTop: '64px', paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {prevPage && (
                      <button onClick={() => handleNavigate(prevPage.sectionId, prevPage.page.id)}
                        style={{ flex: 1, padding: '18px', textAlign: 'left', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green-600)'; e.currentTarget.style.background = 'rgba(61,158,78,0.05)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}>
                        <div style={{ fontSize: '0.68rem', color: GD, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Previous</div>
                        <div style={{ color: GR, fontSize: '0.9rem', fontWeight: 600 }}>{prevPage.page.title}</div>
                      </button>
                    )}
                    {nextPage && (
                      <button onClick={() => handleNavigate(nextPage.sectionId, nextPage.page.id)}
                        style={{ flex: 1, padding: '18px', textAlign: 'right', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green-600)'; e.currentTarget.style.background = 'rgba(61,158,78,0.05)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}>
                        <div style={{ fontSize: '0.68rem', color: GD, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Next</div>
                        <div style={{ color: GR, fontSize: '0.9rem', fontWeight: 600 }}>{nextPage.page.title}</div>
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            {!searchQuery && <TableOfContents page={currentPage} />}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1100px) { .docs-toc-desktop { display: none !important; } }
        @media (max-width: 768px) {
          .docs-sidebar-desktop { display: none !important; }
          .docs-main-content { margin-left: 0 !important; }
          .docs-main-content > div { padding: 80px 20px 60px !important; }
          .docs-mobile-header { display: flex !important; }
        }
        @media (min-width: 769px) { .docs-mobile-header { display: none !important; } }
      `}</style>
    </div>
  );
};

export default DocsPage;
