/* =============================================================================
   SWIPE NAVIGATION
   Wische nach links/rechts um zwischen Seiten zu wechseln
   ============================================================================= */

(function() {
  // Seiten-Reihenfolge basierend auf Bottom-Navigation
  const pages = [
    { name: 'Liste', url: 'index.html' },
    { name: 'Hausdienst', url: 'hausdienst.html' },
    { name: 'Rang', url: 'rangliste.html' },
    { name: 'Badges', url: 'badges.html' },
    { name: 'Buchungen', url: 'buchungen.html' }
  ];

  // Finde aktuelle Seite
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  const currentIndex = pages.findIndex(p => p.url === currentPage);
  
  if (currentIndex === -1) return; // Nicht auf einer Hauptseite

  // Swipe-Detection
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let isSwiping = false;

  const SWIPE_THRESHOLD = 50; // Mindestens 50px horizontal
  const SWIPE_MAX_TIME = 300; // Maximal 300ms
  const VERTICAL_TOLERANCE = 30; // Max 30px vertikal

  document.addEventListener('touchstart', function(e) {
    // Ignoriere Touch auf Buttons, Inputs, etc.
    if (e.target.closest('button, input, select, a, .btn, .plus-btn, .minus-btn')) {
      return;
    }

    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchStartTime = Date.now();
    isSwiping = false;
  }, { passive: true });

  document.addEventListener('touchmove', function(e) {
    if (!touchStartX) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = Math.abs(touch.clientY - touchStartY);

    // Horizontaler Swipe mit wenig vertikaler Bewegung = Seiten-Swipe
    if (Math.abs(deltaX) > SWIPE_THRESHOLD && deltaY < VERTICAL_TOLERANCE) {
      isSwiping = true;
    }
  }, { passive: true });

  document.addEventListener('touchend', function(e) {
    if (!touchStartX || !isSwiping) {
      touchStartX = 0;
      return;
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = Math.abs(touch.clientY - touchStartY);
    const duration = Date.now() - touchStartTime;

    // Reset
    touchStartX = 0;
    isSwiping = false;

    // Validierung: Schneller horizontaler Swipe
    if (Math.abs(deltaX) < SWIPE_THRESHOLD || 
        deltaY > VERTICAL_TOLERANCE || 
        duration > SWIPE_MAX_TIME) {
      return;
    }

    // Swipe nach links = nächste Seite
    if (deltaX < -SWIPE_THRESHOLD && currentIndex < pages.length - 1) {
      navigateToPage(pages[currentIndex + 1]);
    }
    // Swipe nach rechts = vorherige Seite
    else if (deltaX > SWIPE_THRESHOLD && currentIndex > 0) {
      navigateToPage(pages[currentIndex - 1]);
    }
  }, { passive: true });

  function navigateToPage(page) {
    // Smooth Fade-out Animation
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.2s ease';
    
    setTimeout(() => {
      location.href = page.url;
    }, 200);
  }

  // Keyboard-Navigation (optional: Pfeiltasten)
  document.addEventListener('keydown', function(e) {
    // Ignoriere wenn in Input-Feld
    if (e.target.matches('input, textarea, select')) return;
    
    // Arrow Left = vorherige Seite
    if (e.key === 'ArrowLeft' && currentIndex > 0) {
      navigateToPage(pages[currentIndex - 1]);
    }
    // Arrow Right = nächste Seite
    else if (e.key === 'ArrowRight' && currentIndex < pages.length - 1) {
      navigateToPage(pages[currentIndex + 1]);
    }
  });

  // Fade-in beim Laden
  document.addEventListener('DOMContentLoaded', function() {
    document.body.style.opacity = '1';
  });
})();
