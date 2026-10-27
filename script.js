document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Initialize Lenis Inertial Smooth Scroll
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential decay easing
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 1.5,
    });

    // RequestAnimationFrame Render Loop for Lenis
    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // 2. Intercept All Anchor Click Events to Use Lenis Engine
    document.querySelectorAll('.scroll-link').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = anchor.getAttribute('href');
            if (targetId && targetId !== '#') {
                lenis.scrollTo(targetId, {
                    offset: 0,
                    immediate: false,
                    duration: 1.2
                });
            }
        });
    });

    // 3. High-Performance IntersectionObserver for Element Reveals
    const observerOptions = {
        root: null,
        rootMargin: "0px",
        threshold: 0.12
    };

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                obs.unobserve(entry.target); 
            }
        });
    }, observerOptions);

    document.querySelectorAll(".fade-element").forEach(el => observer.observe(el));

    // 4. Touch & Drag Handling for Bookshelf (Non-interfering with Lenis)
    const slider = document.getElementById('bookshelf-container');
    if (slider) {
        let isDown = false;
        let startX;
        let scrollLeft;

        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            slider.style.cursor = 'grabbing';
            slider.style.scrollSnapType = 'none'; 
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
        });

        slider.addEventListener('mouseleave', () => {
            isDown = false;
            slider.style.cursor = 'grab';
            slider.style.scrollSnapType = 'x mandatory';
        });

        slider.addEventListener('mouseup', () => {
            isDown = false;
            slider.style.cursor = 'grab';
            slider.style.scrollSnapType = 'x mandatory'; 
        });

        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 1.5; 
            slider.scrollLeft = scrollLeft - walk;
        });
    }
});
