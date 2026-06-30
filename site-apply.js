/**
 * site-apply.js — NEAT Construction
 * Reads admin config from localStorage and applies to page DOM.
 * Loaded on every page via <script src="site-apply.js" defer></script>
 */
(function() {
  'use strict';

  const CONFIG_KEY = 'neat_config';
  const DB_NAME = 'neat_admin_db';
  const DB_STORE = 'images';
  let cfg = null;
  let imageDB = null;

  // ── Open IndexedDB ──
  function openDB() {
    return new Promise((res) => {
      try {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = e => e.target.result.createObjectStore(DB_STORE, { keyPath: 'key' });
        req.onsuccess = e => { imageDB = e.target.result; res(true); };
        req.onerror = () => res(false);
      } catch(e) { res(false); }
    });
  }

  // ── Get image from DB ──
  function getImg(key) {
    return new Promise(res => {
      if (!imageDB || !key) return res(null);
      try {
        const tx = imageDB.transaction(DB_STORE, 'readonly');
        const r = tx.objectStore(DB_STORE).get(key);
        r.onsuccess = () => res(r.result?.dataUrl || null);
        r.onerror = () => res(null);
      } catch(e) { res(null); }
    });
  }

  // ── Apply text to element(s) ──
  function applyText(selector, text, isHTML) {
    if (!text) return;
    document.querySelectorAll(selector).forEach(el => {
      if (isHTML) el.innerHTML = text;
      else el.textContent = text;
    });
  }

  // ── Apply image src ──
  async function applyImg(selector, imgKey) {
    if (!imgKey) return;
    const url = await getImg(imgKey);
    if (!url) return;
    document.querySelectorAll(selector).forEach(el => {
      el.src = url;
    });
  }

  // ── Apply href ──
  function applyHref(selector, href, text) {
    document.querySelectorAll(selector).forEach(el => {
      if (href) el.href = href;
      if (text) el.textContent = text;
    });
  }

  // ── Determine current page ──
  function getPage() {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('about')) return 'about';
    if (path.includes('services')) return 'services';
    if (path.includes('why-us') || path.includes('whyus')) return 'whyus';
    if (path.includes('projects')) return 'projects';
    if (path.includes('contact')) return 'contact';
    return 'home';
  }

  // ── Build testimonial HTML ──
  async function buildTestimonialCard(t) {
    const stars = '★'.repeat(t.rating || 5);
    let imgHtml = `<div class="tb-img-placeholder">${t.name.charAt(0)}</div>`;
    if (t.imgKey) {
      const url = await getImg(t.imgKey);
      if (url) imgHtml = `<img src="${url}" alt="${t.name}" class="tb-portrait" loading="lazy"/>`;
    }
    return { stars, imgHtml };
  }

  // ── Apply global (all pages) ──
  async function applyGlobal(g) {
    if (!g) return;

    // Phone numbers
    if (g.phone) {
      applyHref('a[href^="tel:"]', 'tel:' + g.phone.replace(/\s/g, ''), g.phone);
      document.querySelectorAll('[data-neat-phone]').forEach(el => el.textContent = g.phone);
    }

    // Email
    if (g.email) {
      applyHref('a[href^="mailto:"]', 'mailto:' + g.email, g.email);
      document.querySelectorAll('[data-neat-email]').forEach(el => el.textContent = g.email);
    }

    // Address
    if (g.address) {
      document.querySelectorAll('[data-neat-address]').forEach(el => el.textContent = g.address);
    }

    // Instagram links
    if (g.instagram) {
      document.querySelectorAll('a[href*="instagram.com"]').forEach(el => el.href = g.instagram);
    }

    // Facebook links
    if (g.facebook) {
      document.querySelectorAll('a[href*="facebook.com"]').forEach(el => el.href = g.facebook);
    }

    // WhatsApp
    if (g.whatsapp || g.phone) {
      const wa = (g.whatsapp || g.phone).replace(/[^0-9+]/g, '');
      document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp.com"]').forEach(el => {
        el.href = 'https://wa.me/' + wa.replace('+', '');
      });
    }

    // Logo images
    await applyImg('img[alt="NEAT Logo"]', 'logo-light');
    await applyImg('img[alt="NEAT Logo Dark"], img[alt="NEAT Logo Light"]', 'logo-dark');
  }

  // ── Apply home page ──
  async function applyHome(p) {
    if (!p || !p.home) return;
    const h = p.home;

    // Hero Badge
    if (h.badge) applyText('.hero-badge span:not(.badge-star), .hero-badge-text', h.badge);

    // CTA buttons
    if (h.cta1) applyText('.btn-hero-primary, a.hero-cta-primary', h.cta1);
    if (h.cta2) applyText('.btn-hero-secondary, a.hero-cta-secondary', h.cta2);

    // Counters
    const ctData = [
      { val: h.ct1val, lbl: h.ct1lbl },
      { val: h.ct2val, lbl: h.ct2lbl },
      { val: h.ct3val, lbl: h.ct3lbl },
      { val: h.ct4val, lbl: h.ct4lbl }
    ];
    const ctItems = document.querySelectorAll('.ct-item');
    ctItems.forEach((item, i) => {
      if (ctData[i]) {
        const numEl = item.querySelector('.ct-n, [class*="ct-n"]');
        const lblEl = item.querySelector('.ct-l, [class*="ct-l"]');
        if (numEl && ctData[i].val) numEl.textContent = ctData[i].val;
        if (lblEl && ctData[i].lbl) lblEl.textContent = ctData[i].lbl;
      }
    });

    // Marquee texts
    const mqItems = document.querySelectorAll('.mq-item-filled, .mq-item-outline');
    if (mqItems.length >= 2 && h.mq1 && h.mq2) {
      const filled = document.querySelectorAll('.mq-item-filled');
      const outline = document.querySelectorAll('.mq-item-outline');
      filled.forEach(el => el.textContent = h.mq1);
      outline.forEach(el => el.textContent = h.mq2);
    }
  }

  // ── Apply testimonials (home or about) ──
  async function applyTestimonials(testimonials, page) {
    if (!testimonials || !testimonials.length) return;

    // For Home page testimonials
    if (page === 'home') {
      const board = document.getElementById('test-board');
      if (!board) return;

      const t0 = testimonials[0];
      if (!t0) return;

      const titleEl = document.getElementById('test-title');
      const descEl = document.getElementById('test-desc');
      const authorEl = document.getElementById('test-author');
      const imgEl = document.getElementById('test-img');

      if (titleEl) titleEl.textContent = '"' + t0.name + '"';
      if (descEl) descEl.textContent = t0.text;
      if (authorEl) authorEl.textContent = '— ' + t0.name + (t0.role ? ', ' + t0.role : '') + (t0.company ? ' · ' + t0.company : '');
      if (t0.imgKey && imgEl) {
        const url = await getImg(t0.imgKey);
        if (url) imgEl.src = url;
      }

      // Update tab buttons
      const tabsContainer = board.parentElement?.querySelector('[id*="test-tabs"], .test-tabs');
      if (tabsContainer && testimonials.length > 1) {
        testimonials.forEach((t, i) => {
          const btn = tabsContainer.querySelector(`[onclick*="${t.id}"], button:nth-child(${i+1})`);
          if (btn) btn.textContent = t.company || t.name;
        });
      }

      // Expose data for tab switching
      window.__neatTestimonials = {};
      testimonials.forEach(t => {
        window.__neatTestimonials[t.id] = {
          title: '"' + t.name + '"',
          desc: t.text,
          author: '— ' + t.name + (t.role ? ', ' + t.role : '') + (t.company ? ' · ' + t.company : ''),
          imgKey: t.imgKey
        };
      });
    }

    // For About page testimonials
    if (page === 'about') {
      const t0 = testimonials[0];
      if (!t0) return;

      const titleEl = document.getElementById('atest-title');
      const descEl = document.getElementById('atest-desc');
      const authorEl = document.getElementById('atest-author');
      const imgEl = document.getElementById('atest-img');

      if (titleEl) titleEl.textContent = '"' + t0.name + '"';
      if (descEl) descEl.textContent = t0.text;
      if (authorEl) authorEl.textContent = '— ' + t0.name + (t0.role ? ', ' + t0.role : '');
      if (t0.imgKey && imgEl) {
        const url = await getImg(t0.imgKey);
        if (url) imgEl.src = url;
      }
    }
  }

  // ── Apply character image (why-us) ──
  async function applyCharacterImg() {
    const url = await getImg('character');
    if (url) {
      document.querySelectorAll('img[src*="character"]').forEach(el => el.src = url);
      document.querySelectorAll('img[alt*="character"], img[alt*="Character"]').forEach(el => el.src = url);
    }
  }

  // ── Apply about page ──
  function applyAbout(p) {
    if (!p || !p.about) return;
    const ab = p.about;
    if (ab.visionTitle) applyText('#about-vision-title', ab.visionTitle);
    if (ab.vision) applyText('#about-vision-text', ab.vision);
    if (ab.missionTitle) applyText('#about-mission-title', ab.missionTitle);
    if (ab.mission) applyText('#about-mission-text', ab.mission);
  }

  // ── Apply contact page ──
  function applyContact(p) {
    if (!p || !p.contact) return;
    const ct = p.contact;
    if (ct.city) document.querySelectorAll('[data-neat-city]').forEach(el => el.textContent = ct.city);
    if (ct.hours) document.querySelectorAll('[data-neat-hours]').forEach(el => el.textContent = ct.hours);
    if (ct.map) {
      document.querySelectorAll('iframe.map-iframe, .map-wrap iframe').forEach(el => el.src = ct.map);
    }
    if (ct.ig) document.querySelectorAll('a[href*="instagram.com"]').forEach(el => el.href = ct.ig);
    if (ct.fb) document.querySelectorAll('a[href*="facebook.com"]').forEach(el => el.href = ct.fb);
    if (ct.wa) {
      const waNum = ct.wa.replace(/[^0-9]/g, '');
      document.querySelectorAll('a[href*="wa.me"]').forEach(el => el.href = 'https://wa.me/' + waNum);
    }
  }

  // ── Apply logo from DB ──
  async function applyLogos() {
    const lightUrl = await getImg('logo-light');
    const darkUrl = await getImg('logo-dark');
    if (lightUrl || darkUrl) {
      document.querySelectorAll('.nav-logo, .logo-img, img[alt="NEAT Logo"], .sidebar-logo img').forEach(el => {
        el.src = lightUrl || darkUrl;
      });
    }
  }

  // ── Inject Floating Sticky Side Logo ──
  function injectFloatingSideLogo() {
    if (document.getElementById('floating-side-logo-link')) return;
    if (window.location.pathname.includes('admin.html')) return;

    const link = document.createElement('a');
    link.href = 'index.html';
    link.id = 'floating-side-logo-link';
    link.setAttribute('data-cursor', 'Home');
    link.setAttribute('title', 'Go to Home');
    
    const img = document.createElement('img');
    img.src = 'Assets/animate logo.gif';
    img.alt = 'NEAT Floating Icon';
    
    link.appendChild(img);
    document.body.appendChild(link);

    const handleScroll = () => {
      if (window.scrollY > 300) {
        link.classList.add('visible');
      } else {
        link.classList.remove('visible');
      }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
  }

  // ── MAIN APPLY FUNCTION ──
  async function applyAll() {
    injectFloatingSideLogo();

    let raw = null;
    
    // Fetch latest config from server backend
    try {
      const response = await fetch('/api/config');
      if (response.ok) {
        const serverCfg = await response.json();
        localStorage.setItem(CONFIG_KEY, JSON.stringify(serverCfg));
        raw = JSON.stringify(serverCfg);
      }
    } catch(e) {
      console.warn("Backend server not running, falling back to localStorage config");
    }

    if (!raw) {
      raw = localStorage.getItem(CONFIG_KEY);
    }

    if (!raw) return; // No admin config saved yet

    try {
      cfg = JSON.parse(raw);
    } catch(e) { return; }

    if (!cfg) return;

    await openDB();
    const page = getPage();

    // Apply global settings
    await applyGlobal(cfg.global);
    await applyLogos();

    // Apply page-specific settings
    if (page === 'home' && cfg.pages) {
      await applyHome(cfg.pages);
      await applyTestimonials(cfg.testimonials, 'home');
    }
    if (page === 'about' && cfg.pages) {
      applyAbout(cfg.pages);
      await applyTestimonials(cfg.testimonials, 'about');
    }
    if (page === 'whyus') {
      await applyCharacterImg();
    }
    if (page === 'contact') {
      applyContact(cfg.pages);
    }

    // Patch testimonial tab switcher to use admin data
    patchTestimonialSwitcher();
  }

  // ── Patch the tab switch function to use admin testimonials ──
  function patchTestimonialSwitcher() {
    if (!cfg || !cfg.testimonials || !cfg.testimonials.length) return;

    const origSwitch = window.switchTestimonial;
    if (!origSwitch) return;

    window.switchTestimonial = function(id) {
      const t = cfg.testimonials.find(x => x.id === id);
      if (t && window.__neatTestimonials && window.__neatTestimonials[id]) {
        const data = window.__neatTestimonials[id];
        const titleEl = document.getElementById('test-title');
        const descEl = document.getElementById('test-desc');
        const authorEl = document.getElementById('test-author');
        if (titleEl) titleEl.textContent = data.title;
        if (descEl) descEl.textContent = data.desc;
        if (authorEl) authorEl.textContent = data.author;
        if (data.imgKey) {
          getImg(data.imgKey).then(url => {
            if (url) {
              const imgEl = document.getElementById('test-img');
              if (imgEl) imgEl.src = url;
            }
          });
        }
      } else {
        origSwitch(id);
      }
    };
  }

  // ── Run after DOM is ready ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyAll);
  } else {
    // DOM already loaded (defer script)
    setTimeout(applyAll, 100);
  }

})();
