import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import gsap from 'gsap';

export default function PeriodicTable3D({
  elements,
  onElementClick,
  searchQuery,
  selectedCategory,
  activeLayout,
  hoveredElement,
  setHoveredElement
}) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const cssRendererRef = useRef(null);
  const particlesRef = useRef(null);
  const objectsRef = useRef([]);
  const cardsRef = useRef([]);
  const initRef = useRef(false);

  // Use refs for callback props to avoid stale closures
  const onElementClickRef = useRef(onElementClick);
  const setHoveredElementRef = useRef(setHoveredElement);
  useEffect(() => { onElementClickRef.current = onElementClick; }, [onElementClick]);
  useEffect(() => { setHoveredElementRef.current = setHoveredElement; }, [setHoveredElement]);

  // Generate target coordinates for different layouts
  const getCoordinates = useCallback((element, index, layout, total) => {
    const num = element.number;
    const group = element.group;
    const period = element.period;

    switch (layout) {
      case 'table': {
        let col = group;
        let row = period;
        if (num >= 57 && num <= 71) { col = num - 57 + 4; row = 9; }
        else if (num >= 89 && num <= 103) { col = num - 89 + 4; row = 10; }
        return { x: (col - 9.5) * 140, y: -(row - 5.5) * 180, z: 0, rx: 0, ry: 0, rz: 0 };
      }

      case 'sphere': {
        const phi = Math.acos(-1 + (2 * index) / total);
        const theta = Math.sqrt(total * Math.PI) * phi;
        const radius = 700;
        return {
          x: radius * Math.sin(phi) * Math.cos(theta),
          y: radius * Math.sin(phi) * Math.sin(theta),
          z: radius * Math.cos(phi),
          rx: 0, ry: Math.atan2(radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi)), rz: 0
        };
      }

      case 'helix': {
        const strand = index % 2;
        const theta = (index * 0.22) + (strand * Math.PI);
        const radius = 450;
        return {
          x: radius * Math.sin(theta),
          y: -(index * 8) + 470,
          z: radius * Math.cos(theta),
          rx: 0, ry: -theta + Math.PI / 2, rz: 0
        };
      }

      case 'grid': {
        const gridX = index % 5;
        const gridY = Math.floor(index / 5) % 5;
        const gridZ = Math.floor(index / 25);
        return {
          x: (gridX - 2) * 320, y: -(gridY - 2) * 320, z: (gridZ - 2) * 320,
          rx: 0, ry: 0, rz: 0
        };
      }

      case 'cylinder': {
        const radius = 600;
        const theta = index * 0.175;
        return {
          x: radius * Math.sin(theta),
          y: -(index * 8) + 470,
          z: radius * Math.cos(theta),
          rx: 0, ry: -theta, rz: 0
        };
      }

      case 'spiral': {
        const theta = index * 0.28;
        const r = 80 + index * 9;
        return {
          x: r * Math.cos(theta),
          y: (index - 59) * 4,
          z: r * Math.sin(theta),
          rx: 0, ry: -theta + Math.PI / 2, rz: 0
        };
      }

      case 'cube': {
        const faceSize = 650;
        const face = index % 6;
        const subIndex = Math.floor(index / 6);
        const col = subIndex % 5;
        const row = Math.floor(subIndex / 5) % 4;
        const offset = 220;
        const posX = (col - 2) * offset;
        const posY = (row - 1.5) * offset;
        let x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0;

        switch (face) {
          case 0: x = posX; y = posY; z = faceSize; break;
          case 1: x = -posX; y = posY; z = -faceSize; ry = Math.PI; break;
          case 2: x = posX; y = faceSize; z = -posY; rx = -Math.PI / 2; break;
          case 3: x = posX; y = -faceSize; z = posY; rx = Math.PI / 2; break;
          case 4: x = -faceSize; y = posY; z = posX; ry = -Math.PI / 2; break;
          case 5: x = faceSize; y = posY; z = -posX; ry = Math.PI / 2; break;
        }
        return { x, y, z, rx, ry, rz };
      }

      case 'galaxy': {
        const arm = index % 3;
        const angle = (index * 0.08) + (arm * (2 * Math.PI / 3));
        const dist = 150 + index * 7;
        const spreadX = (Math.sin(index * 1.7) * 0.5) * 60;
        const spreadZ = (Math.cos(index * 2.3) * 0.5) * 60;
        return {
          x: dist * Math.cos(angle) + spreadX,
          y: (Math.sin(index * 0.5) * 0.5) * 120,
          z: dist * Math.sin(angle) + spreadZ,
          rx: 0, ry: -angle + Math.PI / 2, rz: 0
        };
      }

      case 'atom': {
        let ring = 0;
        let ringIndex = index;
        const ringSizes = [2, 8, 8, 18, 18, 32, 32];
        for (let i = 0; i < ringSizes.length; i++) {
          if (ringIndex < ringSizes[i]) { ring = i; break; }
          ringIndex -= ringSizes[i];
        }
        const shellRadius = (ring + 1) * 160;
        const ringSize = ringSizes[ring] || 10;
        const angle = (ringIndex / ringSize) * 2 * Math.PI;
        const tiltX = ring * 0.15;
        const tiltY = ring * 0.25;
        const pos = new THREE.Vector3(shellRadius * Math.cos(angle), 0, shellRadius * Math.sin(angle));
        pos.applyAxisAngle(new THREE.Vector3(1, 0, 0), tiltX);
        pos.applyAxisAngle(new THREE.Vector3(0, 1, 0), tiltY);
        return { x: pos.x, y: pos.y, z: pos.z, rx: tiltX, ry: angle + tiltY, rz: 0 };
      }

      case 'solar_system': {
        const radius = period * 150;
        const angle = (num * 0.28) + (group * 0.05);
        return {
          x: radius * Math.cos(angle),
          y: (group - 9.5) * 35,
          z: radius * Math.sin(angle),
          rx: 0, ry: -angle + Math.PI / 2, rz: 0
        };
      }

      case 'random': {
        // Use deterministic pseudo-random to avoid jumps on re-render
        const seed = num * 9973;
        const rx1 = ((seed * 16807) % 2147483647) / 2147483647;
        const rx2 = ((seed * 48271) % 2147483647) / 2147483647;
        const rx3 = ((seed * 69621) % 2147483647) / 2147483647;
        return {
          x: (rx1 - 0.5) * 1800,
          y: (rx2 - 0.5) * 1800,
          z: (rx3 - 0.5) * 1800,
          rx: (rx1 - 0.5) * Math.PI,
          ry: (rx2 - 0.5) * Math.PI,
          rz: 0
        };
      }

      default:
        return { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 };
    }
  }, []);

  // Transition handler
  const transition = useCallback((layout, duration = 1.2) => {
    if (!objectsRef.current.length || !elements.length) return;

    elements.forEach((element, i) => {
      const obj = objectsRef.current[i];
      if (!obj) return;

      const target = getCoordinates(element, i, layout, elements.length);

      gsap.to(obj.position, {
        x: target.x, y: target.y, z: target.z,
        duration,
        ease: 'power3.inOut',
        delay: i * 0.003,
        overwrite: true
      });

      gsap.to(obj.rotation, {
        x: target.rx, y: target.ry, z: target.rz,
        duration,
        ease: 'power3.inOut',
        delay: i * 0.003,
        overwrite: true
      });
    });

    // Animate camera
    if (cameraRef.current && controlsRef.current) {
      let targetZ = 2400;
      if (layout === 'table') targetZ = 2200;
      else if (layout === 'sphere') targetZ = 2000;
      else if (layout === 'cube') targetZ = 2200;
      else if (layout === 'grid') targetZ = 2000;
      else if (layout === 'spiral') targetZ = 1800;

      gsap.to(cameraRef.current.position, {
        x: 0, y: 0, z: targetZ,
        duration: duration * 1.2,
        ease: 'power2.inOut',
        overwrite: true,
        onUpdate: () => {
          if (controlsRef.current) controlsRef.current.target.set(0, 0, 0);
        }
      });
    }
  }, [elements, getCoordinates]);

  // Initialize Three.js scene (runs once)
  useEffect(() => {
    if (!containerRef.current || initRef.current) return;
    initRef.current = true;

    const container = containerRef.current;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = 2500;
    cameraRef.current = camera;

    // WebGL Renderer (particles/background)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '1';
    renderer.domElement.style.pointerEvents = 'none';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // CSS3D Renderer (interactive HTML element cards)
    const cssRenderer = new CSS3DRenderer();
    cssRenderer.setSize(window.innerWidth, window.innerHeight);
    cssRenderer.domElement.style.position = 'absolute';
    cssRenderer.domElement.style.top = '0';
    cssRenderer.domElement.style.left = '0';
    cssRenderer.domElement.style.zIndex = '2';
    container.appendChild(cssRenderer.domElement);
    cssRendererRef.current = cssRenderer;

    // Controls
    const controls = new OrbitControls(camera, cssRenderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 500;
    controls.maxDistance = 6000;
    controlsRef.current = controls;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const dirLight = new THREE.DirectionalLight(0x00f0ff, 0.8);
    dirLight.position.set(0, 1, 1).normalize();
    scene.add(dirLight);

    // Background Starfield Particles
    const particleCount = 800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 4000;
      positions[i + 1] = (Math.random() - 0.5) * 4000;
      positions[i + 2] = (Math.random() - 0.5) * 4000;

      const r = Math.random() > 0.5 ? 0 : 1;
      const g = Math.random() > 0.5 ? 0.94 : 0.07;
      colors[i] = r;
      colors[i + 1] = g;
      colors[i + 2] = 1;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);
    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 5,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      map: texture,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    particlesRef.current = particles;

    // Create CSS3D element cards
    const objects = [];
    const cards = [];

    elements.forEach((element, i) => {
      const card = document.createElement('div');
      card.className = `element-card cat-${element.category}`;
      card.id = `card-${element.number}`;

      const numDiv = document.createElement('div');
      numDiv.className = 'number';
      numDiv.textContent = element.number;
      card.appendChild(numDiv);

      const symDiv = document.createElement('div');
      symDiv.className = 'symbol';
      symDiv.textContent = element.symbol;
      card.appendChild(symDiv);

      const nameDiv = document.createElement('div');
      nameDiv.className = 'name';
      nameDiv.textContent = element.name;
      card.appendChild(nameDiv);

      const massDiv = document.createElement('div');
      massDiv.className = 'mass';
      massDiv.textContent = element.mass;
      card.appendChild(massDiv);

      const categoryLine = document.createElement('div');
      categoryLine.className = 'category-line';
      card.appendChild(categoryLine);

      // Use refs for handlers to avoid stale closures
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        onElementClickRef.current(element);
      });

      card.addEventListener('mouseenter', () => {
        setHoveredElementRef.current(element);
      });

      card.addEventListener('mouseleave', () => {
        setHoveredElementRef.current(null);
      });

      const objectCSS = new CSS3DObject(card);
      // Start scattered
      objectCSS.position.x = (Math.random() - 0.5) * 4000;
      objectCSS.position.y = (Math.random() - 0.5) * 4000;
      objectCSS.position.z = (Math.random() - 0.5) * 4000;
      scene.add(objectCSS);

      objects.push(objectCSS);
      cards.push(card);
    });

    objectsRef.current = objects;
    cardsRef.current = cards;

    // Resize handler
    const onResize = () => {
      if (!cameraRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      cssRendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (particlesRef.current) {
        particlesRef.current.rotation.y += 0.0003;
        particlesRef.current.rotation.x += 0.00015;
      }

      controlsRef.current.update();
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      cssRendererRef.current.render(sceneRef.current, cameraRef.current);
    };
    animate();

    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', onResize);
      initRef.current = false;
      if (container) {
        if (rendererRef.current?.domElement?.parentNode === container) {
          container.removeChild(rendererRef.current.domElement);
        }
        if (cssRendererRef.current?.domElement?.parentNode === container) {
          container.removeChild(cssRendererRef.current.domElement);
        }
      }
    };
  // eslint-disable-next-line
  }, []);

  // Trigger initial layout after objects are created
  useEffect(() => {
    // Small delay to ensure objects are created
    const timer = setTimeout(() => {
      transition(activeLayout, 2.0);
    }, 100);
    return () => clearTimeout(timer);
  // eslint-disable-next-line
  }, []);

  // Transition when layout changes
  useEffect(() => {
    transition(activeLayout);
  }, [activeLayout, transition]);

  // Handle visual highlights based on Search and Filter Category
  useEffect(() => {
    if (!cardsRef.current.length) return;

    elements.forEach((element, i) => {
      const card = cardsRef.current[i];
      if (!card) return;

      let match = true;

      if (selectedCategory && element.category !== selectedCategory) {
        match = false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const numberMatch = element.number.toString() === q;
        const nameMatch = element.name.toLowerCase().includes(q);
        const symMatch = element.symbol.toLowerCase() === q;
        const groupMatch = element.group.toString() === q;
        const catMatch = element.category.toLowerCase().includes(q);

        if (!numberMatch && !nameMatch && !symMatch && !groupMatch && !catMatch) {
          match = false;
        }
      }

      if (match) {
        card.style.opacity = '1';
        card.style.pointerEvents = 'auto';
        card.style.border = '1px solid rgba(255, 255, 255, 0.15)';
      } else {
        card.style.opacity = '0.08';
        card.style.pointerEvents = 'none';
        card.style.border = '1px solid rgba(255, 255, 255, 0.02)';
      }
    });
  }, [searchQuery, selectedCategory, elements]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
    />
  );
}
