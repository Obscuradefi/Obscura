import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { docsContent, DocSection, DocPage, DocBlock } from '../data/docsContent';
import BackgroundGrid from '../components/BackgroundGrid';

/* ══════════════════════════════════════════════════════════
   CODE BLOCK COMPONENT — Extracted so hooks work properly
   ══════════════════════════════════════════════════════════ */
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
                borderRadius: '12px 12px 0 0', border: '1px solid rgba(0,240,255,0.15)',
                borderBottom: 'none',
            }}>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {block.language || 'code'}
                </span>
                <button onClick={handleCopy} style={{
                    background: 'none', border: '1px solid rgba(255,255,255,0.1)',
                    color: copied ? '#00FF88' : 'var(--text-dim)',
                    padding: '4px 12px', borderRadius: '6px', cursor: 'pointer',
                    fontFamily: 'JetBrains Mono', fontSize: '0.7rem', transition: 'all 0.3s',
                }}>
                    {copied ? '✓ COPIED' : 'COPY'}
                </button>
            </div>
            <pre style={{
                background: 'rgba(0,0,0,0.5)', padding: '20px',
                borderRadius: '0 0 12px 12px', border: '1px solid rgba(0,240,255,0.15)',
                borderTop: '1px solid rgba(0,240,255,0.08)',
                overflowX: 'auto', margin: 0,
                fontFamily: 'JetBrains Mono', fontSize: '0.85rem', lineHeight: 1.7,
                color: 'rgba(255,255,255,0.85)',
            }}>
                <code>{block.content}</code>
            </pre>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════
   CONTENT RENDERER — Renders individual doc blocks
   ══════════════════════════════════════════════════════════ */
const renderBlock = (block: DocBlock, idx: number) => {
    switch (block.type) {
        case 'heading': {
            const Tag = `h${block.level || 1}` as keyof JSX.IntrinsicElements;
            const sizes: Record<number, string> = { 1: '2rem', 2: '1.5rem', 3: '1.2rem' };
            const margins: Record<number, string> = { 1: '0 0 24px', 2: '40px 0 16px', 3: '32px 0 12px' };
            const id = (block.content || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            return (
                <Tag key={idx} id={id} style={{
                    fontSize: sizes[block.level || 1] || '1.2rem',
                    fontFamily: 'Rajdhani, sans-serif',
                    fontWeight: 700,
                    color: block.level === 1 ? 'white' : 'var(--neon-cyan)',
                    margin: margins[block.level || 1] || '32px 0 12px',
                    letterSpacing: '0.5px',
                    lineHeight: 1.3,
                    scrollMarginTop: '100px',
                }}>
                    {block.level === 1 && (
                        <div style={{
                            width: '40px', height: '4px', borderRadius: '2px',
                            background: 'linear-gradient(90deg, var(--neon-cyan), var(--neon-purple))',
                            marginBottom: '16px',
                        }} />
                    )}
                    {block.content}
                </Tag>
            );
        }

        case 'paragraph':
            return (
                <p key={idx} style={{
                    color: 'var(--text-dim)', fontSize: '0.95rem', lineHeight: 1.8,
                    margin: '0 0 16px',
                }} dangerouslySetInnerHTML={{
                    __html: (block.content || '').replace(/\*\*(.*?)\*\*/g, '<strong style="color: white">$1</strong>')
                }} />
            );

        case 'code':
            return <CodeBlock key={idx} block={block} />;

        case 'list':
            return (
                <ul key={idx} style={{ margin: '0 0 20px', paddingLeft: '0', listStyle: 'none' }}>
                    {(block.items || []).map((item, i) => (
                        <li key={i} style={{
                            padding: '10px 16px 10px 20px', color: 'var(--text-dim)',
                            fontSize: '0.93rem', lineHeight: 1.7, margin: '6px 0',
                            borderLeft: '2px solid rgba(0,240,255,0.3)',
                            background: 'rgba(0,240,255,0.02)',
                            borderRadius: '0 8px 8px 0',
                            transition: 'all 0.2s',
                        }} dangerouslySetInnerHTML={{
                            __html: item.replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--neon-cyan)">$1</strong>')
                        }} />
                    ))}
                </ul>
            );

        case 'callout': {
            const variants: Record<string, { bg: string; border: string; icon: string; titleColor: string }> = {
                info: { bg: 'rgba(0,240,255,0.05)', border: 'rgba(0,240,255,0.25)', icon: 'ℹ️', titleColor: 'var(--neon-cyan)' },
                warning: { bg: 'rgba(255,170,0,0.05)', border: 'rgba(255,170,0,0.25)', icon: '⚠️', titleColor: '#FFAA00' },
                tip: { bg: 'rgba(0,255,136,0.05)', border: 'rgba(0,255,136,0.25)', icon: '💡', titleColor: '#00FF88' },
                danger: { bg: 'rgba(255,51,102,0.05)', border: 'rgba(255,51,102,0.25)', icon: '🚨', titleColor: 'var(--neon-red)' },
            };
            const v = variants[block.variant || 'info'];
            return (
                <div key={idx} style={{
                    background: v.bg, border: `1px solid ${v.border}`,
                    borderRadius: '12px', padding: '20px 24px', margin: '20px 0',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span>{v.icon}</span>
                        <strong style={{ color: v.titleColor, fontFamily: 'JetBrains Mono', fontSize: '0.85rem', letterSpacing: '0.5px' }}>
                            {block.title}
                        </strong>
                    </div>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>
                        {block.content}
                    </p>
                </div>
            );
        }

        case 'table':
            return (
                <div key={idx} style={{ overflowX: 'auto', margin: '16px 0 24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter, sans-serif', fontSize: '0.88rem' }}>
                        <thead>
                            <tr style={{ background: 'rgba(0,240,255,0.05)' }}>
                                {(block.headers || []).map((h, i) => (
                                    <th key={i} style={{
                                        padding: '14px 18px', textAlign: 'left',
                                        color: 'var(--neon-cyan)', fontWeight: 600,
                                        borderBottom: '1px solid rgba(0,240,255,0.15)',
                                        fontFamily: 'JetBrains Mono', fontSize: '0.8rem',
                                        letterSpacing: '0.5px', textTransform: 'uppercase',
                                        whiteSpace: 'nowrap',
                                    }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {(block.rows || []).map((row, ri) => (
                                <tr key={ri} style={{
                                    borderBottom: ri < (block.rows?.length || 0) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                    transition: 'background 0.2s',
                                }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                                   onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                    {row.map((cell, ci) => (
                                        <td key={ci} style={{
                                            padding: '12px 18px', color: ci === 0 ? 'white' : 'var(--text-dim)',
                                            fontWeight: ci === 0 ? 500 : 400,
                                            fontFamily: cell.startsWith('0x') ? 'JetBrains Mono' : 'inherit',
                                            fontSize: cell.startsWith('0x') ? '0.8rem' : 'inherit',
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
                            display: 'flex', gap: '16px', marginBottom: '16px',
                            padding: '16px 20px', borderRadius: '12px',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            transition: 'all 0.3s',
                        }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                                background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: '0.85rem', color: '#000',
                            }}>{i + 1}</div>
                            <div>
                                <div style={{ color: 'white', fontWeight: 600, marginBottom: '4px', fontSize: '0.95rem' }}>{step.title}</div>
                                <div style={{ color: 'var(--text-dim)', fontSize: '0.88rem', lineHeight: 1.7 }}>{step.description}</div>
                            </div>
                        </div>
                    ))}
                </div>
            );

        default:
            return null;
    }
};

/* ══════════════════════════════════════════════════════════
   SIDEBAR COMPONENT
   ══════════════════════════════════════════════════════════ */
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

const Sidebar: React.FC<SidebarProps> = ({
    sections, activeSection, activePage, onNavigate,
    searchQuery, onSearchChange, isMobileOpen, onMobileClose,
}) => {
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
        const init: Record<string, boolean> = {};
        sections.forEach(s => { init[s.id] = true; });
        return init;
    });

    const toggleSection = (id: string) => {
        setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const sidebarContent = (
        <>
            {/* Logo & Title */}
            <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.2rem', fontWeight: 700, color: '#000',
                    }}>O</div>
                    <div>
                        <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '1.2rem', color: 'white', letterSpacing: '1px' }}>OBSCURA</div>
                        <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '1px' }}>DOCUMENTATION</div>
                    </div>
                </div>
                {/* Search */}
                <div style={{ position: 'relative' }}>
                    <input
                        type="text"
                        placeholder="Search docs..."
                        value={searchQuery}
                        onChange={e => onSearchChange(e.target.value)}
                        style={{
                            width: '100%', padding: '10px 14px 10px 36px',
                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '10px', color: 'white', fontSize: '0.85rem',
                            fontFamily: 'Inter, sans-serif', outline: 'none',
                            transition: 'all 0.3s',
                        }}
                        onFocus={e => { e.target.style.borderColor = 'var(--neon-cyan)'; e.target.style.boxShadow = '0 0 12px rgba(0,240,255,0.1)'; }}
                        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
                    />
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem', pointerEvents: 'none' }}>🔍</span>
                </div>
            </div>

            {/* Nav Items */}
            <div style={{ padding: '12px 0', overflowY: 'auto', flex: 1 }}>
                {sections.map(section => (
                    <div key={section.id} style={{ marginBottom: '4px' }}>
                        <button
                            onClick={() => toggleSection(section.id)}
                            style={{
                                width: '100%', padding: '10px 20px',
                                display: 'flex', alignItems: 'center', gap: '10px',
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: activeSection === section.id ? 'var(--neon-cyan)' : 'var(--text-dim)',
                                fontFamily: 'JetBrains Mono', fontSize: '0.8rem',
                                letterSpacing: '0.5px', textTransform: 'uppercase',
                                fontWeight: 600, textAlign: 'left', transition: 'color 0.2s',
                            }}
                        >
                            <span style={{ fontSize: '1rem' }}>{section.icon}</span>
                            <span style={{ flex: 1 }}>{section.title}</span>
                            <span style={{
                                fontSize: '0.7rem', transition: 'transform 0.3s',
                                transform: expandedSections[section.id] ? 'rotate(90deg)' : 'rotate(0deg)',
                            }}>▶</span>
                        </button>

                        <AnimatePresence>
                            {expandedSections[section.id] && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    style={{ overflow: 'hidden' }}
                                >
                                    {section.pages.map(page => (
                                        <button
                                            key={page.id}
                                            onClick={() => { onNavigate(section.id, page.id); onMobileClose(); }}
                                            style={{
                                                width: '100%', padding: '8px 20px 8px 52px',
                                                background: activePage === page.id ? 'rgba(0,240,255,0.08)' : 'none',
                                                border: 'none', borderLeft: activePage === page.id ? '2px solid var(--neon-cyan)' : '2px solid transparent',
                                                cursor: 'pointer', textAlign: 'left',
                                                color: activePage === page.id ? 'var(--neon-cyan)' : 'var(--text-dim)',
                                                fontSize: '0.85rem', fontFamily: 'Inter, sans-serif',
                                                transition: 'all 0.2s', display: 'block',
                                            }}
                                            onMouseEnter={e => {
                                                if (activePage !== page.id) e.currentTarget.style.color = 'white';
                                            }}
                                            onMouseLeave={e => {
                                                if (activePage !== page.id) e.currentTarget.style.color = 'var(--text-dim)';
                                            }}
                                        >
                                            {page.title}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>

            {/* Footer links */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <a href="/" style={{ display: 'block', padding: '8px 0', color: 'var(--text-dim)', textDecoration: 'none', fontSize: '0.82rem', fontFamily: 'JetBrains Mono', transition: 'color 0.2s' }}
                   onMouseEnter={e => e.currentTarget.style.color = 'var(--neon-cyan)'}
                   onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}>
                    ← Back to Home
                </a>
                <a href="/app" style={{ display: 'block', padding: '8px 0', color: 'var(--text-dim)', textDecoration: 'none', fontSize: '0.82rem', fontFamily: 'JetBrains Mono', transition: 'color 0.2s' }}
                   onMouseEnter={e => e.currentTarget.style.color = 'var(--neon-purple)'}
                   onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}>
                    🚀 Launch App
                </a>
            </div>
        </>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="docs-sidebar-desktop" style={{
                width: '280px', height: '100vh', position: 'fixed', top: 0, left: 0,
                background: 'rgba(5,5,12,0.97)', borderRight: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', flexDirection: 'column', zIndex: 100,
                backdropFilter: 'blur(16px)',
            }}>
                {sidebarContent}
            </aside>

            {/* Mobile Overlay */}
            <AnimatePresence>
                {isMobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={onMobileClose}
                            className="docs-sidebar-mobile-overlay"
                            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 199, backdropFilter: 'blur(4px)' }}
                        />
                        <motion.aside
                            initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="docs-sidebar-mobile"
                            style={{
                                width: '280px', height: '100vh', position: 'fixed', top: 0, left: 0,
                                background: 'rgba(5,5,12,0.98)', borderRight: '1px solid rgba(255,255,255,0.06)',
                                display: 'flex', flexDirection: 'column', zIndex: 200,
                            }}
                        >
                            {sidebarContent}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};


/* ══════════════════════════════════════════════════════════
   TABLE OF CONTENTS (Right sidebar)
   ══════════════════════════════════════════════════════════ */
const TableOfContents: React.FC<{ page: DocPage | null }> = ({ page }) => {
    const headings = useMemo(() => {
        if (!page) return [];
        return page.content
            .filter(b => b.type === 'heading' && (b.level === 2 || b.level === 3))
            .map(b => ({
                text: b.content || '',
                level: b.level || 2,
                id: (b.content || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
            }));
    }, [page]);

    if (headings.length < 2) return null;

    return (
        <div className="docs-toc-desktop" style={{
            width: '220px', position: 'sticky', top: '40px',
            alignSelf: 'flex-start', flexShrink: 0,
        }}>
            <div style={{
                fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '16px',
                paddingLeft: '12px',
            }}>
                On This Page
            </div>
            {headings.map((h, i) => (
                <a key={i} href={`#${h.id}`} style={{
                    display: 'block', padding: '5px 12px',
                    paddingLeft: h.level === 3 ? '24px' : '12px',
                    color: 'var(--text-muted)', textDecoration: 'none',
                    fontSize: '0.8rem', lineHeight: 1.5,
                    borderLeft: '1px solid rgba(255,255,255,0.06)',
                    transition: 'all 0.2s',
                }}
                   onMouseEnter={e => { e.currentTarget.style.color = 'var(--neon-cyan)'; e.currentTarget.style.borderLeftColor = 'var(--neon-cyan)'; }}
                   onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderLeftColor = 'rgba(255,255,255,0.06)'; }}
                >
                    {h.text}
                </a>
            ))}
        </div>
    );
};


/* ══════════════════════════════════════════════════════════
   SEARCH RESULTS
   ══════════════════════════════════════════════════════════ */
interface SearchResult {
    sectionId: string;
    sectionTitle: string;
    pageId: string;
    pageTitle: string;
    snippet: string;
}

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
                results.push({
                    sectionId: section.id,
                    sectionTitle: section.title,
                    pageId: page.id,
                    pageTitle: page.title,
                    snippet,
                });
            }
        });
    });
    return results.slice(0, 10);
};


/* ══════════════════════════════════════════════════════════
   MAIN DOCS PAGE COMPONENT
   ══════════════════════════════════════════════════════════ */
const DocsPage: React.FC = () => {
    const navigate = useNavigate();
    const { section: urlSection, page: urlPage } = useParams<{ section?: string; page?: string }>();

    const [activeSection, setActiveSection] = useState(urlSection || 'getting-started');
    const [activePage, setActivePage] = useState(urlPage || 'introduction');
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    // Sync URL params
    useEffect(() => {
        if (urlSection) setActiveSection(urlSection);
        if (urlPage) setActivePage(urlPage);
    }, [urlSection, urlPage]);

    const handleNavigate = (sectionId: string, pageId: string) => {
        setActiveSection(sectionId);
        setActivePage(pageId);
        setSearchQuery('');
        navigate(`/docs/${sectionId}/${pageId}`, { replace: true });
        contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const currentSection = docsContent.find(s => s.id === activeSection);
    const currentPage = currentSection?.pages.find(p => p.id === activePage) || null;

    // Find prev/next pages for navigation
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
        <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
            <BackgroundGrid />

            <div style={{ position: 'relative', zIndex: 10, display: 'flex' }}>
                <Sidebar
                    sections={docsContent}
                    activeSection={activeSection}
                    activePage={activePage}
                    onNavigate={handleNavigate}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    isMobileOpen={isMobileMenuOpen}
                    onMobileClose={() => setIsMobileMenuOpen(false)}
                />

                {/* Main Content Area */}
                <div ref={contentRef} className="docs-main-content" style={{
                    marginLeft: '280px', flex: 1, minHeight: '100vh',
                    display: 'flex', justifyContent: 'center',
                }}>
                    {/* Mobile Header */}
                    <div className="docs-mobile-header" style={{
                        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99,
                        background: 'rgba(5,5,12,0.95)', backdropFilter: 'blur(12px)',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        padding: '12px 20px', display: 'none',
                        alignItems: 'center', gap: '12px',
                    }}>
                        <button onClick={() => setIsMobileMenuOpen(true)} style={{
                            background: 'none', border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white', padding: '8px', borderRadius: '8px', cursor: 'pointer',
                            fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>☰</button>
                        <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '1.1rem', color: 'white', letterSpacing: '1px' }}>OBSCURA DOCS</div>
                    </div>

                    <div style={{
                        maxWidth: '900px', width: '100%',
                        padding: '40px 48px 80px',
                        display: 'flex', gap: '40px',
                    }}>
                        {/* Content Column */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            {/* Breadcrumb */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                marginBottom: '32px', fontFamily: 'JetBrains Mono', fontSize: '0.75rem',
                            }}>
                                <a href="/docs" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }}
                                   onMouseEnter={e => e.currentTarget.style.color = 'var(--neon-cyan)'}
                                   onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                                    Docs
                                </a>
                                <span style={{ color: 'var(--text-muted)' }}>/</span>
                                <span style={{ color: 'var(--text-dim)' }}>{currentSection?.title}</span>
                                <span style={{ color: 'var(--text-muted)' }}>/</span>
                                <span style={{ color: 'var(--neon-cyan)' }}>{currentPage?.title}</span>
                            </div>

                            {/* Search Results */}
                            {searchQuery.length >= 2 ? (
                                <div>
                                    <h2 style={{ color: 'white', fontFamily: 'Rajdhani', fontSize: '1.5rem', marginBottom: '24px' }}>
                                        Search Results for "{searchQuery}"
                                    </h2>
                                    {searchResults.length === 0 ? (
                                        <p style={{ color: 'var(--text-dim)' }}>No results found. Try a different search term.</p>
                                    ) : (
                                        searchResults.map((r, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                onClick={() => handleNavigate(r.sectionId, r.pageId)}
                                                style={{
                                                    padding: '16px 20px', marginBottom: '12px',
                                                    background: 'rgba(255,255,255,0.02)',
                                                    border: '1px solid rgba(255,255,255,0.06)',
                                                    borderRadius: '12px', cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--neon-cyan)'; e.currentTarget.style.background = 'rgba(0,240,255,0.03)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: 'var(--neon-purple)', textTransform: 'uppercase' }}>{r.sectionTitle}</span>
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>/</span>
                                                    <span style={{ color: 'var(--neon-cyan)', fontSize: '0.85rem', fontWeight: 600 }}>{r.pageTitle}</span>
                                                </div>
                                                <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', lineHeight: 1.6, margin: 0 }}>{r.snippet}</p>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            ) : (
                                /* Main Page Content */
                                <motion.div
                                    key={activePage}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {currentPage?.content.map((block, i) => renderBlock(block, i))}

                                    {/* Prev / Next Navigation */}
                                    <div style={{
                                        display: 'flex', gap: '16px', marginTop: '64px',
                                        paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.06)',
                                    }}>
                                        {prevPage && (
                                            <button onClick={() => handleNavigate(prevPage.sectionId, prevPage.page.id)}
                                                style={{
                                                    flex: 1, padding: '20px', textAlign: 'left',
                                                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                                                    borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--neon-purple)'; e.currentTarget.style.background = 'rgba(138,43,226,0.05)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                                            >
                                                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px' }}>← PREVIOUS</div>
                                                <div style={{ color: 'var(--neon-purple)', fontSize: '0.95rem', fontWeight: 600 }}>{prevPage.page.title}</div>
                                            </button>
                                        )}
                                        {nextPage && (
                                            <button onClick={() => handleNavigate(nextPage.sectionId, nextPage.page.id)}
                                                style={{
                                                    flex: 1, padding: '20px', textAlign: 'right',
                                                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                                                    borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--neon-cyan)'; e.currentTarget.style.background = 'rgba(0,240,255,0.03)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                                            >
                                                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px' }}>NEXT →</div>
                                                <div style={{ color: 'var(--neon-cyan)', fontSize: '0.95rem', fontWeight: 600 }}>{nextPage.page.title}</div>
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Right side Table of Contents */}
                        {!searchQuery && <TableOfContents page={currentPage} />}
                    </div>
                </div>
            </div>

            {/* Responsive Styles (injected) */}
            <style>{`
                @media (max-width: 1100px) {
                    .docs-toc-desktop { display: none !important; }
                }
                @media (max-width: 768px) {
                    .docs-sidebar-desktop { display: none !important; }
                    .docs-main-content { margin-left: 0 !important; }
                    .docs-main-content > div { padding: 80px 20px 60px !important; }
                    .docs-mobile-header { display: flex !important; }
                }
                @media (min-width: 769px) {
                    .docs-mobile-header { display: none !important; }
                    .docs-sidebar-mobile-overlay { display: none !important; }
                    .docs-sidebar-mobile { display: none !important; }
                }
            `}</style>
        </div>
    );
};

export default DocsPage;
