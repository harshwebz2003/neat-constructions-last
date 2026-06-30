/**
 * NEAT Construction & Hospitality Services
 * Core JavaScript Animation and Controller Suite – main.js
 */
gsap.registerPlugin(ScrollTrigger);

window.lenis = null;

// Global window loader sequence (Failsafe & DOMContentLoaded optimized)
function hidePreloader() {
  const loader = document.getElementById('ploader');
  if (loader && loader.style.display !== 'none') {
    gsap.to(loader, {
      opacity: 0,
      duration: 0.5,
      ease: 'power2.inOut',
      onComplete: () => {
        loader.style.display = 'none';
        const hero = document.getElementById('hero-container');
        if (hero) hero.classList.add('loaded');
        // Ensure animations trigger
        if (typeof initAllAnimations === 'function') {
          initAllAnimations();
        }
      }
    });
  } else {
    const hero = document.getElementById('hero-container');
    if (hero) hero.classList.add('loaded');
    if (typeof initAllAnimations === 'function') {
      initAllAnimations();
    }
  }
}

// Trigger preloader hide after exactly 8 seconds (8000ms) or instantly if skipped
document.addEventListener('DOMContentLoaded', () => {
  const loader = document.getElementById('ploader');
  if (loader && loader.style.display !== 'none') {
    setTimeout(hidePreloader, 8000); // Play video for 8 seconds
  } else {
    hidePreloader(); // Hide and initialize immediately
  }
});
window.addEventListener('load', () => {
  // Let the video play for the full duration of 8 seconds from DOMContentLoaded
});
setTimeout(() => {
  const loader = document.getElementById('ploader');
  if (loader && loader.style.display !== 'none') {
    hidePreloader();
  }
}, 9000); // 9.0s absolute failsafe fallback


// Realtime Theme Toggler
function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  if (isDark) {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  } else {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }
  setTimeout(() => ScrollTrigger.refresh(), 100);
}

// Side Menu Control Logic (Hover to Show)
const sideMenu = document.getElementById('side-menu');
const triggerContainer = document.getElementById('menu-trigger-container');
const triggerBtn = document.getElementById('menu-trigger');
const mbar1 = document.getElementById('mbar1');
const mbar2 = document.getElementById('mbar2');

let menuTimeout;

function openSideMenu() {
  clearTimeout(menuTimeout);
  if (sideMenu) {
    sideMenu.classList.remove('translate-x-full');
    sideMenu.classList.add('menu-open');
  }
  if (mbar1) mbar1.style.transform = 'translateY(2.5px) rotate(45deg)';
  if (mbar2) {
    mbar2.style.transform = 'translateY(-2.5px) rotate(-45deg)';
    mbar2.style.width = '100%';
  }

  // Handle Backdrop Overlay
  let backdrop = document.getElementById('menu-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'menu-backdrop';
    backdrop.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1999;opacity:0;pointer-events:none;transition:opacity 0.3s ease;';
    document.body.appendChild(backdrop);
    backdrop.addEventListener('click', closeSideMenu);
  }
  backdrop.style.opacity = '1';
  backdrop.style.pointerEvents = 'all';
  document.body.style.overflowY = 'hidden';
  
  // GSAP stagger links in side menu
  gsap.fromTo('.side-link', 
    { opacity: 0, x: 25 },
    { opacity: 1, x: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out', overwrite: true }
  );
}

function closeSideMenu() {
  if (sideMenu) {
    sideMenu.classList.add('translate-x-full');
    sideMenu.classList.remove('menu-open');
  }
  if (mbar1) mbar1.style.transform = 'none';
  if (mbar2) {
    mbar2.style.transform = 'none';
    mbar2.style.width = '80%';
  }

  // Handle Backdrop Overlay
  const backdrop = document.getElementById('menu-backdrop');
  if (backdrop) {
    backdrop.style.opacity = '0';
    backdrop.style.pointerEvents = 'none';
  }
  document.body.style.overflowY = '';
}

if (triggerContainer && sideMenu) {
  // Create backdrop early so it is ready
  let backdrop = document.getElementById('menu-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'menu-backdrop';
    backdrop.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1999;opacity:0;pointer-events:none;transition:opacity 0.3s ease;';
    document.body.appendChild(backdrop);
    backdrop.addEventListener('click', closeSideMenu);
  }

  // Detect if device is touch-capable — hover disabled on touch/mobile
  let isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  // ── Desktop ONLY: hover open/close ──
  if (!isTouchDevice) {
    triggerContainer.addEventListener('mouseenter', openSideMenu);
    sideMenu.addEventListener('mouseenter', () => { clearTimeout(menuTimeout); });
    sideMenu.addEventListener('mouseleave', () => { menuTimeout = setTimeout(closeSideMenu, 400); });
    triggerContainer.addEventListener('mouseleave', () => {
      menuTimeout = setTimeout(() => { if (!sideMenu.matches(':hover')) closeSideMenu(); }, 400);
    });
  }

  // ── All devices: click/tap to toggle ──
  const menuBtn = document.getElementById('menu-trigger');
  if (menuBtn) {
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      // On touch, also clear any hover timeout that might have fired
      clearTimeout(menuTimeout);
      const isOpen = sideMenu.classList.contains('menu-open');
      if (isOpen) { closeSideMenu(); } else { openSideMenu(); }
    });
  }

  // Mark as touch on first touchstart (covers hybrid devices)
  document.addEventListener('touchstart', () => { isTouchDevice = true; }, { once: true });

  // Close on Escape key
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSideMenu(); });
}

// Mobile hamburger toggle menu
function toggleMenu() {
  const m = document.getElementById('mob-menu');
  if (m) {
    m.style.display = m.style.display === 'flex' ? 'none' : 'flex';
    document.body.style.overflow = m.style.display === 'flex' ? 'hidden' : '';
  }
}

// Custom cursor systems
function initCustomCursor() {
  if (window.innerWidth <= 1024) return;
  const cursor = document.getElementById('gcursor');
  const dot = document.getElementById('gcursordot');
  const label = document.getElementById('gcursorlabel');
  if (!cursor || !dot) return;

  let mouseX = 0, mouseY = 0;
  let cursorX = 0, cursorY = 0;
  let dotX = 0, dotY = 0;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  gsap.ticker.add(() => {
    cursorX += (mouseX - cursorX) * 0.15;
    cursorY += (mouseY - cursorY) * 0.15;
    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';

    dotX += (mouseX - dotX) * 0.35;
    dotY += (mouseY - dotY) * 0.35;
    dot.style.left = dotX + 'px';
    dot.style.top = dotY + 'px';

    if (label) {
      label.style.left = cursorX + 'px';
      label.style.top = (cursorY + 38) + 'px';
    }
  });

  document.querySelectorAll('[data-cursor]').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('expand');
      if (label) {
        label.textContent = el.dataset.cursor;
        label.style.opacity = '1';
      }
    });
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('expand');
      if (label) label.style.opacity = '0';
    });
  });

  document.querySelectorAll('.nav-link, a, button').forEach(el => {
    if (!el.dataset.cursor) {
      el.addEventListener('mouseenter', () => {
        gsap.to(cursor, { width: 12, height: 12, duration: 0.3 });
        gsap.to(dot, { scale: 2, duration: 0.3 });
      });
      el.addEventListener('mouseleave', () => {
        gsap.to(cursor, { width: 20, height: 20, duration: 0.3 });
        gsap.to(dot, { scale: 1, duration: 0.3 });
      });
    }
  });
}

// Magnetic Buttons
function initMagneticButtons() {
  if (window.innerWidth <= 1024) return;
  document.querySelectorAll('.btn-magnetic').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(btn, {
        x: x * 0.2,
        y: y * 0.2,
        duration: 0.4,
        ease: 'power2.out'
      });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    });
  });
}

// Scroll Reveals
function initScrollReveals() {
  ScrollTrigger.batch('.reveal', {
    onEnter: batch => {
      gsap.to(batch, { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out', overwrite: true });
    },
    start: 'top 92%'
  });
  ScrollTrigger.batch('.reveal-left', {
    onEnter: batch => {
      gsap.to(batch, { opacity: 1, x: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out', overwrite: true });
    },
    start: 'top 90%'
  });
  ScrollTrigger.batch('.reveal-right', {
    onEnter: batch => {
      gsap.to(batch, { opacity: 1, x: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out', overwrite: true });
    },
    start: 'top 90%'
  });
}

// Headers & lines
function initSectionHeaders() {
  document.querySelectorAll('.sec-label').forEach(label => {
    gsap.fromTo(label, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out', scrollTrigger: { trigger: label, start: 'top 88%', once: true } });
  });
  document.querySelectorAll('.sec-div').forEach(div => {
    gsap.fromTo(div, { width: 0 }, { width: 60, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: div, start: 'top 88%', once: true } });
  });
  document.querySelectorAll('.gold-line').forEach(line => {
    gsap.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: 'power2.inOut', scrollTrigger: { trigger: line, start: 'top 88%', once: true } });
  });
}

// Navbar effects
function initNavbarEffects() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  ScrollTrigger.create({
    start: 'top -60',
    onUpdate: (self) => {
      navbar.classList.toggle('scrolled', self.scroll() > 60);
    }
  });
}

// Sound Control System
const bgAudio = document.getElementById("bg-audio");
const soundToggle = document.querySelector(".sound-toggle-btn");
if (bgAudio && soundToggle) {
  bgAudio.volume = 0.35;
  const setSoundState = (isPlaying) => {
    const offIcon = document.querySelector(".sound-icon-off");
    const onIcon = document.querySelector(".sound-icon-on");
    if (offIcon && onIcon) {
      offIcon.classList.toggle("hidden", isPlaying);
      onIcon.classList.toggle("hidden", !isPlaying);
    }
  };
  const toggleSound = (e) => {
    e.stopPropagation();
    if (bgAudio.paused) {
      bgAudio.play().then(() => setSoundState(true)).catch(() => {});
    } else {
      bgAudio.pause();
      setSoundState(false);
    }
  };
  soundToggle.addEventListener("click", toggleSound);
  const playAudio = () => {
    bgAudio.play().then(() => {
      setSoundState(true);
      document.removeEventListener("click", playAudio);
      document.removeEventListener("touchstart", playAudio);
    }).catch(() => {});
  };
  document.addEventListener("click", playAudio);
  document.addEventListener("touchstart", playAudio);
}

// Spotlight Cursor Tracker
document.addEventListener('mousemove', e => {
  const elements = document.querySelectorAll('.premium-card, .why-row');
  elements.forEach(el => {
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    el.style.setProperty('--x', `${x}px`);
    el.style.setProperty('--y', `${y}px`);
  });
});

// Floating Navbar Tracker Logic
document.addEventListener('DOMContentLoaded', () => {
  const tracker = document.getElementById('nav-tracker');
  const nav = document.getElementById('navbar');
  if (tracker && nav) {
    const links = nav.querySelectorAll('.nav-link');
    links.forEach(link => {
      link.addEventListener('mouseenter', () => {
        const rect = link.getBoundingClientRect();
        const navRect = nav.getBoundingClientRect();
        tracker.style.width = `${rect.width}px`;
        tracker.style.left = `${rect.left - navRect.left}px`;
        tracker.style.top = `${rect.top - navRect.top}px`;
        tracker.style.height = `${rect.height}px`;
        tracker.style.opacity = '1';
      });
    });
    
    nav.addEventListener('mouseleave', () => {
      tracker.style.opacity = '0';
    });
  }

  // Dynamic SEO Canonical Fix for multi-domain support
  (function() {
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      const currentHost = window.location.host;
      if (currentHost.includes('neatqatar.com')) {
        canonicalLink.href = canonicalLink.href.replace('www.neat-construction.com', 'www.neatqatar.com');
      }
    }
  })();
});
