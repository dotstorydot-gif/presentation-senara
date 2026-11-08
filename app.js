/**
 * SENARA (صنارة) — Interactive Presentation & Pitch Deck Engine
 * Built for high-performance interactive storytelling with animated fishing hook physics.
 */

(function () {
  'use strict';

  // State Management
  const state = {
    currentSlide: 0,
    totalSlides: 8,
    mode: 'deck', // 'deck' | 'scroll'
    lang: 'en',   // 'en' | 'ar'
    soundEnabled: true,
    audioCtx: null,
    isTransitioning: false
  };

  // DOM Cache
  const deckContainer = document.getElementById('deck-container');
  const slides = document.querySelectorAll('.slide-section');
  const railDots = document.querySelectorAll('.rail-dot');
  const prevBtn = document.getElementById('prev-slide-btn');
  const nextBtn = document.getElementById('next-slide-btn');
  const slideCounter = document.getElementById('slide-counter');
  const slideTitlePreview = document.getElementById('current-slide-title');
  const modeToggleBtn = document.getElementById('mode-toggle-btn');
  const langToggleBtn = document.getElementById('lang-toggle-btn');
  const audioToggleBtn = document.getElementById('audio-toggle-btn');
  const audioOnIcon = document.getElementById('audio-on-icon');
  const audioOffIcon = document.getElementById('audio-off-icon');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const fishingLine = document.getElementById('fishing-line');
  const hookUnit = document.getElementById('hook-unit');
  const hookBaitPill = document.getElementById('hook-bait-pill');
  const soundToast = document.getElementById('sound-toast');
  const helpDialog = document.getElementById('help-dialog');
  const closeDialogBtn = document.getElementById('close-dialog-btn');
  const restartBtn = document.getElementById('restart-deck-btn');
  const printDeckBtn = document.getElementById('print-deck-btn');
  const nextSlideTriggers = document.querySelectorAll('.next-slide-trigger');

  // Interactive Match Simulator Elements
  const skillSlider = document.getElementById('skill-slider');
  const portfolioSlider = document.getElementById('portfolio-slider');
  const expSlider = document.getElementById('exp-slider');
  const locationSlider = document.getElementById('location-slider');
  const skillVal = document.getElementById('skill-val');
  const portfolioVal = document.getElementById('portfolio-val');
  const expVal = document.getElementById('exp-val');
  const locationVal = document.getElementById('location-val');
  const dialFillCircle = document.getElementById('dial-fill-circle');
  const matchPercentDisplay = document.getElementById('match-percent-display');
  const matchVerdictTitle = document.getElementById('match-verdict-title');
  const matchVerdictTitleAr = document.getElementById('match-verdict-title-ar');
  const matchVerdictText = document.getElementById('match-verdict-text');
  const matchVerdictTextAr = document.getElementById('match-verdict-text-ar');

  // Bait notification captions for each slide
  const hookBaitCaptions = [
    { en: 'Hooking The Right Talent...', ar: 'جاري اصطياد الكفاءة المناسبة...' },
    { en: 'Dual Verified Badges 🟢🔵', ar: 'توثيق مزدوج معتمد 🟢🔵' },
    { en: 'Calculating Match Fit 🎯', ar: 'حساب مؤشر التوافق 🎯' },
    { en: 'Reeling 41 Event Applications 📊', ar: 'اصطياد 41 طلباً بالحدث 📊' },
    { en: 'Senara Phases 🚀', ar: 'مراحل صنارة 🚀' },
    { en: '3 Scalable Revenue Streams 💼', ar: '3 مسارات دخل متصاعدة 💼' },
    { en: 'Disciplined 200k EGP Seed 💰', ar: 'ميزانية تأسيس 200 ألف 💰' },
    { en: 'Sustaining Monthly Operations ⚙️', ar: 'تأمين تكاليف التشغيل الشهري ⚙️' }
  ];

  // Initialize Application
  function init() {
    document.body.classList.add('mode-deck');
    updateSlide(0, false);
    setupEventListeners();
    setupMatchSimulator();
    setupRevenueCalculator();
    initWebAudio();
  }

  // ==========================================================================
  // Web Audio Sound FX Generator (Reel clicks & Underwater bite pops)
  // ==========================================================================
  function initWebAudio() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      state.audioCtx = new AudioContext();
    }
  }

  function playReelSound() {
    if (!state.soundEnabled || !state.audioCtx) return;
    try {
      if (state.audioCtx.state === 'suspended') {
        state.audioCtx.resume();
      }
      
      // Rod Reel Rapid Click Sequence
      const now = state.audioCtx.currentTime;
      for (let i = 0; i < 4; i++) {
        const osc = state.audioCtx.createOscillator();
        const gain = state.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600 + Math.random() * 400, now + i * 0.04);
        
        gain.gain.setValueAtTime(0.08, now + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.03);
        
        osc.connect(gain);
        gain.connect(state.audioCtx.destination);
        
        osc.start(now + i * 0.04);
        osc.stop(now + i * 0.04 + 0.035);
      }
    } catch (e) {
      console.warn('Audio play prevented:', e);
    }
  }

  function playBiteSound() {
    if (!state.soundEnabled || !state.audioCtx) return;
    try {
      if (state.audioCtx.state === 'suspended') {
        state.audioCtx.resume();
      }
      // Water Bubble Pop Sound
      const now = state.audioCtx.currentTime;
      const osc = state.audioCtx.createOscillator();
      const gain = state.audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.08);
      
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      
      osc.connect(gain);
      gain.connect(state.audioCtx.destination);
      
      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {
      console.warn('Audio play prevented:', e);
    }
  }

  // ==========================================================================
  // Hook Physics & Position Animation
  // ==========================================================================
  function updateHookPosition(slideIndex) {
    if (!fishingLine || !hookUnit) return;
    
    // Calculate realistic drop height for the hook based on viewport & slide
    const viewportHeight = window.innerHeight - 100;
    const minLineHeight = 70;
    const maxLineHeight = Math.min(viewportHeight - 200, 480);
    const step = (maxLineHeight - minLineHeight) / (state.totalSlides - 1);
    const targetHeight = minLineHeight + slideIndex * step;

    fishingLine.style.height = `${targetHeight}px`;

    // Hook strike wiggle animation on each transition
    hookUnit.classList.remove('hook-bite');
    void hookUnit.offsetWidth; // Force CSS reflow
    hookUnit.classList.add('hook-bite');

    // Update Hook Bait Pill Text
    if (hookBaitPill && hookBaitCaptions[slideIndex]) {
      const caption = hookBaitCaptions[slideIndex][state.lang];
      hookBaitPill.innerHTML = `<span class="hook-bait-text">${caption}</span>`;
    }

    playBiteSound();
  }

  // ==========================================================================
  // Slide Controller
  // ==========================================================================
  function updateSlide(index, playSound = true) {
    if (index < 0) index = 0;
    if (index >= state.totalSlides) index = state.totalSlides - 1;

    state.currentSlide = index;

    // Update Slides Active Class
    slides.forEach((slide, i) => {
      if (i === index) {
        slide.classList.add('active');
        if (state.mode === 'scroll') {
          slide.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        slide.classList.remove('active');
      }
    });

    // Update Right Rail Dots
    railDots.forEach((dot, i) => {
      if (i === index) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    // Update Stepper Counter
    if (slideCounter) {
      slideCounter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(state.totalSlides).padStart(2, '0')}`;
    }

    // Update Header Preview Title
    const activeSlide = slides[index];
    if (activeSlide && slideTitlePreview) {
      const titleAttr = state.lang === 'ar' ? 'data-title-ar' : 'data-title-en';
      slideTitlePreview.textContent = activeSlide.getAttribute(titleAttr) || '';
    }

    // Update Button Disabled States
    if (prevBtn) prevBtn.disabled = (index === 0);
    if (nextBtn) nextBtn.disabled = (index === state.totalSlides - 1);

    // Update Fishing Hook Rig
    updateHookPosition(index);

    if (playSound) {
      playReelSound();
    }
  }

  function nextSlide() {
    if (state.currentSlide < state.totalSlides - 1) {
      updateSlide(state.currentSlide + 1);
    }
  }

  function prevSlide() {
    if (state.currentSlide > 0) {
      updateSlide(state.currentSlide - 1);
    }
  }

  // ==========================================================================
  // Interactive Match Simulator Calculation
  // ==========================================================================
  function setupMatchSimulator() {
    if (!skillSlider || !portfolioSlider || !expSlider || !locationSlider) return;

    function recalculate() {
      const skill = parseInt(skillSlider.value, 10);
      const portfolio = parseInt(portfolioSlider.value, 10);
      const exp = parseInt(expSlider.value, 10);
      const loc = parseInt(locationSlider.value, 10);

      if (skillVal) skillVal.textContent = `${skill}%`;
      if (portfolioVal) portfolioVal.textContent = `${portfolio}%`;
      if (expVal) expVal.textContent = `${exp}%`;
      if (locationVal) locationVal.textContent = `${loc}%`;

      // Weighted calculation formula
      const score = Math.round(
        (skill * 0.35) + 
        (portfolio * 0.30) + 
        (exp * 0.20) + 
        (loc * 0.15)
      );

      if (matchPercentDisplay) {
        matchPercentDisplay.textContent = `${score}%`;
      }

      const lsmLiveScore = document.getElementById('lsm-live-score');
      if (lsmLiveScore) {
        lsmLiveScore.textContent = `${score}%`;
      }

      // Update Circular SVG Gauge (circumference: 2 * PI * 42 ≈ 263.9)
      if (dialFillCircle) {
        const circumference = 264;
        const offset = circumference - (circumference * (score / 100));
        dialFillCircle.style.strokeDashoffset = offset;
      }

      // Update Verdict Feedback
      if (score >= 85) {
        if (matchVerdictTitle) matchVerdictTitle.textContent = 'High Affinity Match 🎯';
        if (matchVerdictTitleAr) matchVerdictTitleAr.textContent = 'توافق استثنائي فائق 🎯';
        if (matchVerdictText) matchVerdictText.textContent = 'The hook is locked. Both parties receive an instant notification with verified credentials to initiate direct encrypted chat.';
        if (matchVerdictTextAr) matchVerdictTextAr.textContent = 'الصنارة التقطت الهدف بنجاح! يتم إشعار الطرفين ببيانات موثقة لبدء محادثة مباشرة فوراً.';
      } else if (score >= 65) {
        if (matchVerdictTitle) matchVerdictTitle.textContent = 'Promising Strong Fit 👍';
        if (matchVerdictTitleAr) matchVerdictTitleAr.textContent = 'توافق واعد وقوي 👍';
        if (matchVerdictText) matchVerdictText.textContent = 'Skill foundation is solid. Employer can review full portfolio benchmarks before scheduling an intro.';
        if (matchVerdictTextAr) matchVerdictTextAr.textContent = 'الأساس المهني متين. يمكن لصاحب العمل مراجعة سابقة الأعمال بالتفصيل قبل تحديد المقابلة.';
      } else {
        if (matchVerdictTitle) matchVerdictTitle.textContent = 'Exploratory Match 🔍';
        if (matchVerdictTitleAr) matchVerdictTitleAr.textContent = 'توافق استكشافي أولي 🔍';
        if (matchVerdictText) matchVerdictText.textContent = 'Potential gap in specialized tools or location preference. Candidate can request feedback.';
        if (matchVerdictTextAr) matchVerdictTextAr.textContent = 'توجد بعض الفجوات التقنية أو الجغرافية. يمكن للمرشح طلب توجيهات لتطوير ملفه.';
      }
    }

    [skillSlider, portfolioSlider, expSlider, locationSlider].forEach(slider => {
      slider.addEventListener('input', recalculate);
    });

    recalculate();
  }

  // ==========================================================================
  // Interactive Revenue & ROI Calculator (Slide 6)
  // ==========================================================================
  function setupRevenueCalculator() {
    const compSlider = document.getElementById('companies-slider');
    const banSlider = document.getElementById('banners-slider');
    const addSlider = document.getElementById('addons-slider');
    const compVal = document.getElementById('companies-count-val');
    const banVal = document.getElementById('banners-count-val');
    const addVal = document.getElementById('addons-count-val');
    const mrrVal = document.getElementById('mrr-val');
    const arrVal = document.getElementById('arr-val');
    const paybackVal = document.getElementById('payback-val');

    if (!compSlider || !banSlider || !addSlider) return;

    function recalcRevenue() {
      const companies = parseInt(compSlider.value, 10);
      const banners = parseInt(banSlider.value, 10);
      const addons = parseInt(addSlider.value, 10);

      if (compVal) compVal.textContent = companies;
      if (banVal) banVal.textContent = banners;
      if (addVal) addVal.textContent = banners > 0 ? banners : 0;
      if (addVal) addVal.textContent = addons;

      const mrr = (companies * 3500) + (banners * 4500) + (addons * 15000);
      const arr = mrr * 12;
      const paybackMonths = mrr > 0 ? (200000 / mrr).toFixed(1) : '0';

      if (mrrVal) mrrVal.textContent = `${mrr.toLocaleString()} EGP`;
      if (arrVal) arrVal.textContent = `${arr.toLocaleString()} EGP`;
      if (paybackVal) paybackVal.textContent = `${paybackMonths} Months`;
    }

    [compSlider, banSlider, addSlider].forEach(slider => {
      slider.addEventListener('input', recalcRevenue);
    });

    recalcRevenue();
  }

  // ==========================================================================
  // Mode Switcher (Deck Mode vs Scrollytelling Mode)
  // ==========================================================================
  function togglePresentationMode() {
    if (state.mode === 'deck') {
      state.mode = 'scroll';
      document.body.classList.remove('mode-deck');
      document.body.classList.add('mode-scroll');
      slides[state.currentSlide].scrollIntoView({ behavior: 'smooth' });
      showToast('📜 Switched to Continuous Scroll Mode');
    } else {
      state.mode = 'deck';
      document.body.classList.remove('mode-scroll');
      document.body.classList.add('mode-deck');
      window.scrollTo(0, 0);
      updateSlide(state.currentSlide, false);
      showToast('🎬 Switched to Slide Deck Mode');
    }
  }

  // ==========================================================================
  // Language Switcher (EN / AR)
  // ==========================================================================
  function toggleLanguage() {
    state.lang = state.lang === 'en' ? 'ar' : 'en';
    const html = document.documentElement;

    html.setAttribute('lang', state.lang);
    html.setAttribute('dir', state.lang === 'ar' ? 'rtl' : 'ltr');

    // Update active slide title
    const activeSlide = slides[state.currentSlide];
    if (activeSlide && slideTitlePreview) {
      const titleAttr = state.lang === 'ar' ? 'data-title-ar' : 'data-title-en';
      slideTitlePreview.textContent = activeSlide.getAttribute(titleAttr) || '';
    }

    // Update Hook Bait Text
    if (hookBaitPill && hookBaitCaptions[state.currentSlide]) {
      const caption = hookBaitCaptions[state.currentSlide][state.lang];
      hookBaitPill.innerHTML = `<span class="hook-bait-text">${caption}</span>`;
    }

    showToast(state.lang === 'ar' ? 'تم التبديل إلى اللغة العربية' : 'Switched to English');
  }

  // ==========================================================================
  // Audio Toggle
  // ==========================================================================
  function toggleAudio() {
    state.soundEnabled = !state.soundEnabled;
    if (audioOnIcon && audioOffIcon) {
      if (state.soundEnabled) {
        audioOnIcon.classList.remove('hidden');
        audioOffIcon.classList.add('hidden');
        showToast('🔊 Reel Sound FX: ON');
        playBiteSound();
      } else {
        audioOnIcon.classList.add('hidden');
        audioOffIcon.classList.remove('hidden');
        showToast('🔇 Reel Sound FX: MUTED');
      }
    }
  }

  // ==========================================================================
  // Fullscreen Handler
  // ==========================================================================
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  // Toast Notification
  function showToast(msg) {
    if (!soundToast) return;
    soundToast.textContent = msg;
    soundToast.classList.add('show');
    clearTimeout(soundToast._timer);
    soundToast._timer = setTimeout(() => {
      soundToast.classList.remove('show');
    }, 2000);
  }

  // ==========================================================================
  // Event Listeners & Interaction Wiring
  // ==========================================================================
  function setupEventListeners() {
    // Next & Prev Buttons
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);

    // Rail Dots
    railDots.forEach(dot => {
      dot.addEventListener('click', () => {
        const slideIndex = parseInt(dot.getAttribute('data-slide'), 10);
        updateSlide(slideIndex);
      });
    });

    // Next Slide In-Slide Triggers
    nextSlideTriggers.forEach(btn => {
      btn.addEventListener('click', nextSlide);
    });

    // Restart Deck Button
    if (restartBtn) {
      restartBtn.addEventListener('click', () => updateSlide(0));
    }

    // Header Action Buttons
    if (printDeckBtn) {
      printDeckBtn.addEventListener('click', () => {
        window.print();
      });
    }
    if (modeToggleBtn) modeToggleBtn.addEventListener('click', togglePresentationMode);
    if (langToggleBtn) langToggleBtn.addEventListener('click', toggleLanguage);
    if (audioToggleBtn) audioToggleBtn.addEventListener('click', toggleAudio);
    if (fullscreenBtn) fullscreenBtn.addEventListener('click', toggleFullscreen);

    // Help Dialog
    if (closeDialogBtn && helpDialog) {
      closeDialogBtn.addEventListener('click', () => helpDialog.close());
    }

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      // Ignore if user is interacting with an input
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
          e.preventDefault();
          nextSlide();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          prevSlide();
          break;
        case 'm':
        case 'M':
          togglePresentationMode();
          break;
        case 'l':
        case 'L':
          toggleLanguage();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case '?':
          if (helpDialog) {
            helpDialog.showModal();
          }
          break;
        case 'Home':
          updateSlide(0);
          break;
        case 'End':
          updateSlide(state.totalSlides - 1);
          break;
      }
    });

    // Mouse Wheel Navigation in Deck Mode (Debounced)
    let wheelTimeout;
    window.addEventListener('wheel', (e) => {
      if (state.mode !== 'deck') return;
      if (wheelTimeout) return;

      if (Math.abs(e.deltaY) > 40) {
        if (e.deltaY > 0) {
          nextSlide();
        } else {
          prevSlide();
        }
        wheelTimeout = setTimeout(() => {
          wheelTimeout = null;
        }, 550);
      }
    }, { passive: true });

    // Touch Swipe Navigation for Mobile / Tablet
    let touchStartX = 0;
    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      const touchEndY = e.changedTouches[0].screenY;
      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;

      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX < 0) {
          // Swipe Left -> Next (or Prev in RTL)
          state.lang === 'ar' ? prevSlide() : nextSlide();
        } else {
          // Swipe Right -> Prev (or Next in RTL)
          state.lang === 'ar' ? nextSlide() : prevSlide();
        }
      }
    }, { passive: true });

    // Scrollytelling Scroll Listener (In Scroll Mode)
    window.addEventListener('scroll', () => {
      if (state.mode !== 'scroll') return;

      const scrollPos = window.scrollY + window.innerHeight / 3;
      slides.forEach((slide, i) => {
        const top = slide.offsetTop;
        const bottom = top + slide.offsetHeight;
        if (scrollPos >= top && scrollPos < bottom) {
          if (state.currentSlide !== i) {
            state.currentSlide = i;
            railDots.forEach((dot, dotIdx) => {
              dot.classList.toggle('active', dotIdx === i);
            });
            if (slideCounter) {
              slideCounter.textContent = `${String(i + 1).padStart(2, '0')} / ${String(state.totalSlides).padStart(2, '0')}`;
            }
            updateHookPosition(i);
          }
        }
      });
    }, { passive: true });
  }

  // Launch on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

