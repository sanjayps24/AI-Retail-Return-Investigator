import React, { useState } from 'react';
import { allElements } from './data/elements';
import PeriodicTable3D from './components/PeriodicTable3D';
import ElementModal from './components/ElementModal';
import { Search, Info, RotateCcw, BarChart3, Atom } from 'lucide-react';

const layouts = [
  { id: 'table', name: 'Table' },
  { id: 'sphere', name: 'Sphere' },
  { id: 'helix', name: 'Helix' },
  { id: 'grid', name: 'Grid' },
  { id: 'cylinder', name: 'Cylinder' },
  { id: 'spiral', name: 'Spiral' },
  { id: 'cube', name: 'Cube' },
  { id: 'galaxy', name: 'Galaxy' },
  { id: 'atom', name: 'Atom' },
  { id: 'solar_system', name: 'Solar' },
  { id: 'random', name: 'Floating' }
];

const categories = [
  { id: 'diatomic-nonmetal', name: 'Nonmetal (Di)' },
  { id: 'polyatomic-nonmetal', name: 'Nonmetal (Poly)' },
  { id: 'noble-gas', name: 'Noble Gas' },
  { id: 'alkali-metal', name: 'Alkali Metal' },
  { id: 'alkaline-earth-metal', name: 'Alkaline Earth' },
  { id: 'metalloid', name: 'Metalloid' },
  { id: 'halogen', name: 'Halogen' },
  { id: 'post-transition-metal', name: 'Post-Trans' },
  { id: 'transition-metal', name: 'Transition' },
  { id: 'lanthanide', name: 'Lanthanide' },
  { id: 'actinide', name: 'Actinide' }
];

export default function App() {
  const [activeLayout, setActiveLayout] = useState('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedElement, setSelectedElement] = useState(null);
  const [hoveredElement, setHoveredElement] = useState(null);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
  };

  return (
    <div className="app-shell">

      {/* 3D Periodic Table Viewport (Background) */}
      <div className="viewport-3d">
        <PeriodicTable3D
          elements={allElements}
          onElementClick={setSelectedElement}
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          activeLayout={activeLayout}
          hoveredElement={hoveredElement}
          setHoveredElement={setHoveredElement}
        />
      </div>

      {/* TOP BAR PANEL */}
      <header className="top-bar">
        {/* Title */}
        <div className="top-bar-title">
          <div className="title-icon">
            <Atom size={26} className="animate-spin-slow" />
          </div>
          <div className="title-text">
            <h1>QUANTUM TABLE</h1>
            <p>VisionOS 3D Element Engine</p>
          </div>
        </div>

        {/* Search System */}
        <div className="search-wrap">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            placeholder="Search symbol, name, cat, group..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* 3D Layout Controls */}
        <div className="layout-controls">
          {layouts.map((l) => (
            <button
              key={l.id}
              onClick={() => setActiveLayout(l.id)}
              className={`layout-btn ${activeLayout === l.id ? 'active' : ''}`}
            >
              {l.name}
            </button>
          ))}
        </div>
      </header>

      {/* DASHBOARD CONTENT */}
      <div className="dashboard">

        {/* LEFT SIDEBAR */}
        <aside className="sidebar-left">

          {/* Categories Filter panel */}
          <div className="glass-panel">
            <div className="panel-heading">
              <span>Filter Categories</span>
              {(selectedCategory || searchQuery) && (
                <button onClick={resetFilters} className="reset-btn">
                  <RotateCcw size={10} /> reset
                </button>
              )}
            </div>
            <div className="category-chips">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(selectedCategory === c.id ? '' : c.id)}
                  className={`cat-chip ${selectedCategory === c.id ? 'active' : ''}`}
                  style={{ borderLeft: `3px solid var(--color-${c.id})` }}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Quick HUD Hover Card */}
          <div className="glass-panel hud-card">
            {hoveredElement ? (
              <div className="hud-filled">
                <div className="hud-top-row">
                  <span className="hud-number">#{hoveredElement.number}</span>
                  <span className="hud-state-badge">{hoveredElement.state}</span>
                </div>

                <div className="hud-center">
                  <h2 className="hud-symbol" style={{ textShadow: `0 0 15px var(--color-${hoveredElement.category})` }}>
                    {hoveredElement.symbol}
                  </h2>
                  <h3 className="hud-name">{hoveredElement.name}</h3>
                  <p className="hud-category">{hoveredElement.category.replace(/-/g, ' ')}</p>
                </div>

                <div className="hud-stats">
                  <div className="hud-stat-row">
                    <span className="hud-stat-label">Atomic Mass</span>
                    <span className="hud-stat-value">{hoveredElement.mass}</span>
                  </div>
                  <div className="hud-stat-row">
                    <span className="hud-stat-label">Configuration</span>
                    <span className="hud-stat-value">{hoveredElement.electronConfig}</span>
                  </div>
                  <div className="hud-stat-row">
                    <span className="hud-stat-label">Electronegativity</span>
                    <span className="hud-stat-value">{hoveredElement.electronegativity}</span>
                  </div>
                  <div className="hud-stat-row">
                    <span className="hud-stat-label">Discoverer</span>
                    <span className="hud-stat-value">{hoveredElement.discoverer}</span>
                  </div>
                </div>

                <div className="hud-cta">
                  Click card for full holographic visualization
                </div>
              </div>
            ) : (
              <div className="hud-empty">
                <BarChart3 size={32} className="hud-icon" />
                <p>HUD ELEMENT STATS</p>
                <p className="hud-sub">Hover or touch any element card in space to analyze molecular quantum states</p>
              </div>
            )}
          </div>
        </aside>

        {/* RIGHT SIDEBAR */}
        <aside className="sidebar-right">
          <div className="glass-panel">
            <div className="nav-heading">
              <Info size={14} /> Navigation Instructions
            </div>
            <div className="nav-instructions">
              <div className="nav-row">
                <div className="nav-key">DRAG</div>
                <span>Rotate 3D Space Camera</span>
              </div>
              <div className="nav-row">
                <div className="nav-key">SCROLL</div>
                <span>Zoom In / Zoom Out</span>
              </div>
              <div className="nav-row">
                <div className="nav-key">R-CLICK</div>
                <span>Pan Camera position</span>
              </div>
              <div className="nav-row">
                <div className="nav-key">CLICK CARD</div>
                <span>Open Holographic Shells</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* FULL DETAILED MODAL OVERLAY */}
      {selectedElement && (
        <ElementModal
          element={selectedElement}
          onClose={() => setSelectedElement(null)}
        />
      )}
    </div>
  );
}
