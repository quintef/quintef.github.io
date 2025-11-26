const THEME_STORAGE_KEY = 'preferred-theme';

document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle();
    initRevealAnimations();
    initContactForm();
    initParticleTrail();
});

function initThemeToggle() {
    const toggleButton = document.getElementById('themeToggle');
    const root = document.documentElement;

    if (!toggleButton || !root) {
        return;
    }

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    const storedTheme = getStoredTheme();
    let hasUserPreference = storedTheme !== null;
    const initialTheme = storedTheme || (prefersDark.matches ? 'dark' : 'light');

    setTheme(initialTheme, false);

    toggleButton.addEventListener('click', () => {
        const nextTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
    });

    if (typeof prefersDark.addEventListener === 'function') {
        prefersDark.addEventListener('change', (event) => {
            if (hasUserPreference) {
                return;
            }
            setTheme(event.matches ? 'dark' : 'light', false);
        });
    }

    function setTheme(theme, persist = true) {
        root.dataset.theme = theme;

        if (persist) {
            hasUserPreference = true;
            saveTheme(theme);
        }

        updateToggleUI(theme);
    }

    function updateToggleUI(theme) {
        const label = toggleButton.querySelector('.theme-toggle__label');
        const icon = toggleButton.querySelector('i');
        const isDark = theme === 'dark';

        toggleButton.setAttribute('aria-pressed', String(isDark));
        toggleButton.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`);

        if (label) {
            label.textContent = isDark ? 'Dark' : 'Light';
        }

        if (icon) {
            icon.className = isDark ? 'bi bi-moon-stars-fill' : 'bi bi-sun-fill';
        }

        toggleButton.classList.toggle('btn-outline-light', isDark);
        toggleButton.classList.toggle('btn-outline-dark', !isDark);
    }
}

function getStoredTheme() {
    try {
        return localStorage.getItem(THEME_STORAGE_KEY);
    } catch (error) {
        console.warn('Theme preference unavailable:', error);
        return null;
    }
}

function saveTheme(theme) {
    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
        console.warn('Unable to persist theme preference:', error);
    }
}

function initParticleTrail() {
    const canvas = document.getElementById('particleCanvas');
    const container = document.querySelector('.particle-trail');
    if (!canvas || !container) {
        return;
    }

    const ctx = canvas.getContext('2d');
    const particles = [];
    const particleCount = 40;
    let animationFrameId;
    let isEnabled = window.innerWidth >= 768;

    function setupCanvas() {
        const { width, height } = container.getBoundingClientRect();
        canvas.width = width;
        canvas.height = height;
    }

    function initParticles() {
        particles.length = 0;
        for (let i = 0; i < particleCount; i++) {
            particles.push(createParticle());
        }
    }

    function createParticle() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 2 + 1,
            speed: Math.random() * 0.6 + 0.2,
            drift: Math.random() * 0.4 - 0.2,
            alpha: Math.random() * 0.4 + 0.3,
        };
    }

    function getParticleColor() {
        const isDarkMode = document.documentElement.dataset.theme !== 'light';
        return isDarkMode ? 'rgba(61, 155, 238, ALPHA)' : 'rgba(15, 23, 42, ALPHA)';
    }

    function drawParticles(scrollFactor) {
        const colorTemplate = getParticleColor();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((particle) => {
            particle.y += particle.speed + scrollFactor * 0.8;
            particle.x += particle.drift;

            if (particle.y > canvas.height + 10) {
                particle.y = -10;
                particle.x = Math.random() * canvas.width;
            }
            if (particle.x > canvas.width + 10) {
                particle.x = -10;
            }
            if (particle.x < -10) {
                particle.x = canvas.width + 10;
            }

            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2, false);
            ctx.fillStyle = colorTemplate.replace('ALPHA', particle.alpha.toFixed(2));
            ctx.fill();
            ctx.closePath();
        });
    }

    function animate() {
        const scrollFactor = Math.min(window.scrollY / (document.body.scrollHeight - window.innerHeight), 1);
        drawParticles(scrollFactor);
        animationFrameId = requestAnimationFrame(animate);
    }

    function enableParticles() {
        if (isEnabled) {
            return;
        }
        isEnabled = true;
        setupCanvas();
        initParticles();
        animate();
    }

    function disableParticles() {
        if (!isEnabled) {
            return;
        }
        isEnabled = false;
        cancelAnimationFrame(animationFrameId);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function handleResize() {
        const shouldEnable = window.innerWidth >= 768;
        if (shouldEnable) {
            setupCanvas();
            initParticles();
            if (!isEnabled) {
                isEnabled = true;
                animate();
            }
        } else {
            disableParticles();
        }
    }

    function onVisibilityChange() {
        if (document.hidden) {
            cancelAnimationFrame(animationFrameId);
        } else if (isEnabled) {
            animate();
        }
    }

    setupCanvas();
    initParticles();

    if (isEnabled) {
        animate();
    }

    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('scroll', () => {
        if (!isEnabled) {
            return;
        }
        // scroll factor handled inside animate loop; this listener keeps wake lock active
    }, { passive: true });
}

function initRevealAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
            } else {
                entry.target.classList.remove('show');
            }
        });
    });

    document.querySelectorAll('.hidden').forEach((el) => observer.observe(el));
}

function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) {
        return;
    }

    const submitButton = document.getElementById('submitButton');
    const successMessage = document.getElementById('submitSuccessMessage');
    const errorMessage = document.getElementById('submitErrorMessage');
    const endpoint = 'https://formsubmit.co/ajax/quintef.romero@gmail.com';

    contactForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (!contactForm.checkValidity()) {
            contactForm.classList.add('was-validated');
            return;
        }

        contactForm.classList.remove('was-validated');
        toggleMessage(successMessage, false);
        toggleMessage(errorMessage, false);

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Sending...';
        }

        try {
            const data = Object.fromEntries(new FormData(contactForm));
            data._subject = 'New portfolio inquiry';
            data._template = 'table';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            contactForm.reset();
            toggleMessage(successMessage, true);
        } catch (error) {
            console.error('Contact form error:', error);
            toggleMessage(errorMessage, true);
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Submit';
            }
        }
    });
}

function toggleMessage(element, shouldShow) {
    if (!element) {
        return;
    }
    element.classList.toggle('d-none', !shouldShow);
}
