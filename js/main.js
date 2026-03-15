/* ============================================
   OPIK | Nuage d'Opik
   JavaScript interactions
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // --- Scroll fade-in animations ---
    const initScrollAnimations = () => {
        const sections = document.querySelectorAll(
            '.accordions, .reviews'
        );

        sections.forEach(section => {
            section.classList.add('fade-in');
        });

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -40px 0px'
        });

        sections.forEach(section => observer.observe(section));
    };

    // --- Sticky bottom bar ---
    const initStickyBar = () => {
        const bar = document.getElementById('stickyBar');
        if (!bar) return;

        // Show after scrolling 30% past hero
        const hero = document.querySelector('.hero');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) {
                    bar.classList.add('is-visible');
                } else {
                    bar.classList.remove('is-visible');
                }
            });
        }, { threshold: 0.4 });

        if (hero) observer.observe(hero);
    };

    // --- Modal ---
    const initModal = () => {
        const modal = document.getElementById('waitlistModal');
        const overlay = document.getElementById('modalOverlay');
        const closeBtn = document.getElementById('modalClose');
        const stickyBtn = document.getElementById('stickyBtn');

        if (!modal) return;

        const openModal = () => {
            modal.classList.add('is-open');
            document.body.style.overflow = 'hidden';
        };

        const closeModal = () => {
            modal.classList.remove('is-open');
            document.body.style.overflow = '';
        };

        if (stickyBtn) stickyBtn.addEventListener('click', openModal);
        if (overlay) overlay.addEventListener('click', closeModal);
        if (closeBtn) closeBtn.addEventListener('click', closeModal);

        // ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('is-open')) {
                closeModal();
            }
        });
    };

    // --- Waitlist counter (base 19, +2/week, persisted) ---
    const getWaitlistCount = () => {
        const BASE_COUNT = 19;
        const LAUNCH_DATE = new Date('2026-03-15'); // date de lancement
        const INCREMENT_PER_WEEK = 2;

        const now = new Date();
        const diffMs = now - LAUNCH_DATE;
        const diffWeeks = Math.max(0, Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)));
        const weeklyBonus = diffWeeks * INCREMENT_PER_WEEK;

        // Signups stored in localStorage
        const signups = parseInt(localStorage.getItem('opik_signups') || '0', 10);

        return BASE_COUNT + weeklyBonus + signups;
    };

    const animateCounter = () => {
        const counterEl = document.getElementById('waitlistCount');
        if (!counterEl) return;

        const target = getWaitlistCount();
        counterEl.textContent = target;

        const duration = 1500;

        const runAnimation = () => {
            const start = performance.now();
            const update = (now) => {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                counterEl.textContent = Math.floor(eased * target);
                if (progress < 1) {
                    requestAnimationFrame(update);
                } else {
                    counterEl.textContent = target;
                }
            };
            counterEl.textContent = '0';
            requestAnimationFrame(update);
        };

        // Animate when modal opens
        const modal = document.getElementById('waitlistModal');
        if (modal) {
            const obs = new MutationObserver(() => {
                if (modal.classList.contains('is-open')) {
                    // Refresh count each time modal opens
                    const newTarget = getWaitlistCount();
                    counterEl.textContent = newTarget;
                    runAnimation();
                }
            });
            obs.observe(modal, { attributes: true, attributeFilter: ['class'] });
        }
    };

    // --- EmailJS config ---
    // Replace these with your actual EmailJS IDs from https://dashboard.emailjs.com
    const EMAILJS_PUBLIC_KEY = 'wKj_9D8jdsL0eHBXb';
    const EMAILJS_SERVICE_ID = 'service_00drizi';
    const EMAILJS_TEMPLATE_CONFIRMATION = 'template_8j8lhd8';
    const EMAILJS_TEMPLATE_NOTIFICATION = 'template_s4olwvr';

    // Initialize EmailJS
    if (typeof emailjs !== 'undefined') {
        emailjs.init(EMAILJS_PUBLIC_KEY);
    }

    // --- Generate waitlist code (2 letters + 3 digits) ---
    function generateWaitlistCode() {
        const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        const l1 = letters[Math.floor(Math.random() * letters.length)];
        const l2 = letters[Math.floor(Math.random() * letters.length)];
        const num = String(Math.floor(Math.random() * 900) + 100);
        return l1 + l2 + num;
    }

    // --- Preorder form ---
    const initPreorderForm = () => {
        const form = document.getElementById('preorderForm');
        const btn = document.getElementById('preorderBtn');
        const nameInput = document.getElementById('nameInput');
        const emailInput = document.getElementById('emailInput');
        const stickyBtn = document.getElementById('stickyBtn');
        const thanksEl = document.getElementById('modalThanks');
        const noteEl = document.querySelector('.modal__note');
        const codeEl = document.getElementById('waitlistCode');

        if (!form) return;

        // Check if already signed up
        if (localStorage.getItem('opik_signed_up')) {
            showThanksState(localStorage.getItem('opik_waitlist_code'));
        }

        function showThanksState(code) {
            form.style.display = 'none';
            if (noteEl) noteEl.style.display = 'none';
            if (thanksEl) thanksEl.classList.add('is-visible');
            if (codeEl && code) codeEl.textContent = code;
            if (stickyBtn) {
                stickyBtn.querySelector('.sticky-bar__btn-text').textContent = 'Sur la liste ✓';
                stickyBtn.classList.add('sticky-bar__btn--confirmed');
            }
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            if (!name || !email) return;

            // Generate unique waitlist code
            const waitlistCode = generateWaitlistCode();

            // Disable button while sending
            btn.disabled = true;
            btn.textContent = 'Envoi...';

            try {
                // Send confirmation email to the customer
                await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_CONFIRMATION, {
                    to_email: email,
                    to_name: name,
                    product_name: "Nuage d'Opik",
                    brand: 'OPIK',
                    waitlist_code: waitlistCode
                });

                // Send notification email to owner
                await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_NOTIFICATION, {
                    customer_name: name,
                    customer_email: email,
                    signup_date: new Date().toLocaleDateString('fr-FR'),
                    waitlist_count: getWaitlistCount() + 1,
                    waitlist_code: waitlistCode
                });
            } catch (err) {
                console.warn('EmailJS error:', err);
                // Continue even if email fails, the signup still counts
            }

            // Save code & signup to localStorage
            localStorage.setItem('opik_waitlist_code', waitlistCode);
            const signups = parseInt(localStorage.getItem('opik_signups') || '0', 10);
            localStorage.setItem('opik_signups', signups + 1);
            localStorage.setItem('opik_signed_up', 'true');

            // Update counter display
            const counterEl = document.getElementById('waitlistCount');
            if (counterEl) {
                counterEl.textContent = getWaitlistCount();
            }

            // Show thank you message with code
            showThanksState(waitlistCode);
        });
    };

    // --- Accordion toggle ---
    const initAccordions = () => {
        document.querySelectorAll('.accordion__header').forEach(btn => {
            btn.addEventListener('click', () => {
                const accordion = btn.parentElement;
                const isOpen = accordion.classList.contains('is-open');
                
                // Toggle current
                accordion.classList.toggle('is-open');
                btn.setAttribute('aria-expanded', !isOpen);
            });
        });
    };

    // --- Gallery Slider ---
    const initGallerySlider = () => {
        const track = document.getElementById('galleryTrack');
        const dotsContainer = document.getElementById('galleryDots');
        if (!track || !dotsContainer) return;

        const slides = track.querySelectorAll('.gallery__slide');
        const total = slides.length;
        if (total === 0) return;

        let current = 0;
        let startX = 0;
        let deltaX = 0;
        let isDragging = false;
        let autoplayInterval;

        // Create dots
        slides.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.classList.add('gallery__dot');
            if (i === 0) dot.classList.add('is-active');
            dot.setAttribute('aria-label', `Image ${i + 1}`);
            dot.addEventListener('click', () => goTo(i));
            dotsContainer.appendChild(dot);
        });

        const dots = dotsContainer.querySelectorAll('.gallery__dot');

        const goTo = (index) => {
            current = ((index % total) + total) % total;
            track.style.transform = `translateX(-${current * 100}%)`;
            dots.forEach((d, i) => d.classList.toggle('is-active', i === current));
        };

        const next = () => goTo(current + 1);

        // Autoplay
        const startAutoplay = () => {
            stopAutoplay();
            autoplayInterval = setInterval(next, 3500);
        };
        const stopAutoplay = () => clearInterval(autoplayInterval);

        // Touch events
        let touchStartY = 0;
        let isHorizontalSwipe = null;

        track.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            isDragging = true;
            isHorizontalSwipe = null;
            deltaX = 0;
            stopAutoplay();
            track.style.transition = 'none';
        }, { passive: true });

        track.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const dx = e.touches[0].clientX - startX;
            const dy = e.touches[0].clientY - touchStartY;

            // Determine swipe direction on first significant move
            if (isHorizontalSwipe === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
                isHorizontalSwipe = Math.abs(dx) > Math.abs(dy);
            }

            if (!isHorizontalSwipe) return;

            // Prevent vertical scroll during horizontal swipe
            e.preventDefault();
            deltaX = dx;
            const offset = -(current * 100) + (deltaX / track.offsetWidth) * 100;
            track.style.transform = `translateX(${offset}%)`;
        }, { passive: false });

        track.addEventListener('touchend', () => {
            isDragging = false;
            track.style.transition = '';
            if (Math.abs(deltaX) > 40) {
                deltaX < 0 ? goTo(current + 1) : goTo(current - 1);
            } else {
                goTo(current);
            }
            deltaX = 0;
            startAutoplay();
        });

        // Mouse drag
        track.addEventListener('mousedown', (e) => {
            startX = e.clientX;
            isDragging = true;
            stopAutoplay();
            track.style.transition = 'none';
            e.preventDefault();
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            deltaX = e.clientX - startX;
            const offset = -(current * 100) + (deltaX / track.offsetWidth) * 100;
            track.style.transform = `translateX(${offset}%)`;
        });

        window.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            track.style.transition = '';
            if (Math.abs(deltaX) > 40) {
                deltaX < 0 ? goTo(current + 1) : goTo(current - 1);
            } else {
                goTo(current);
            }
            deltaX = 0;
            startAutoplay();
        });

        startAutoplay();
    };

    // --- Init ---
    initScrollAnimations();
    initStickyBar();
    initModal();
    animateCounter();
    initPreorderForm();
    initAccordions();
    initGallerySlider();
});
