document.addEventListener('DOMContentLoaded', () => {
    
    // Lock scrolling on page load while preloading is active
    document.body.style.overflow = 'hidden';

    // --- Hero Background Scroll Animation Engine ---
    // Instead of loading all 241 frames in parallel (which saturates the server and blocks browser),
    // we load a subset of 81 frames sequentially in the background.
    // We load the very first frame immediately to display the site instantly, then load the rest.
    const totalFrames = 241;
    const frameStep = 4; // Load every 4th frame for optimal balance of smooth scroll and fast load
    
    const frameIndices = [];
    for (let i = 1; i <= totalFrames; i += frameStep) {
        frameIndices.push(i);
    }
    if (frameIndices[frameIndices.length - 1] !== totalFrames) {
        frameIndices.push(totalFrames);
    }
    
    const preloadedImages = {}; // Map of frameIndex -> Image object
    let loadedCount = 0;
    
    const preloaderEl = document.getElementById('preloader');
    const progressBarEl = document.getElementById('progress-bar');
    const progressPctEl = document.getElementById('progress-percentage');
    
    const pad = (num, size) => {
        let s = num + "";
        while (s.length < size) s = "0" + s;
        return s;
    };

    const canvas = document.getElementById('hero-canvas');
    let targetFrame = 1;
    let currentFrame = 1;
    let lastDrawnFrame = -1;
    
    let isRendering = false;
    
    const scrollContainer = document.querySelector('.hero-scroll-container');
    const scene1 = document.querySelector('.hero-scene-1');
    const scene2 = document.querySelector('.hero-scene-2');
    const scene3 = document.querySelector('.hero-scene-3');
    const indicator = document.querySelector('.hero-scroll-indicator');

    // Load first frame immediately to show page
    const firstFrameIndex = frameIndices[0];
    const firstImg = new Image();
    firstImg.src = `assets/hero-frames/ezgif-frame-${pad(firstFrameIndex, 3)}.jpg`;
    
    firstImg.onload = () => {
        preloadedImages[firstFrameIndex] = firstImg;
        loadedCount++;
        
        // First frame loaded
        
        // Show 100% on loader quickly and fade out
        if (progressBarEl) progressBarEl.style.width = '100%';
        if (progressPctEl) progressPctEl.textContent = '100%';
        
        setTimeout(() => {
            if (preloaderEl) {
                preloaderEl.classList.add('fade-out');
            }
            document.body.style.overflow = '';
            
            // Initial draw
            resizeCanvas();
            
            // Start background parallel loading of remaining frames shortly after page is visible
            setTimeout(loadRemainingFrames, 100);
            
            // Start render loop
            isRendering = true;
            requestAnimationFrame(renderLoop);
        }, 150);
    };

    firstImg.onerror = () => {
        // Fallback if first frame fails
        if (preloaderEl) preloaderEl.classList.add('fade-out');
        document.body.style.overflow = '';
        setTimeout(loadRemainingFrames, 100);
        requestAnimationFrame(renderLoop);
    };

    function loadRemainingFrames() {
        const concurrency = 6;
        let index = 1; // Start from index 1 as index 0 (first frame) is preloaded
        
        function loadNext() {
            if (index >= frameIndices.length) return;
            const currentIndex = index++;
            const frameIndex = frameIndices[currentIndex];
            
            const img = new Image();
            img.src = `assets/hero-frames/ezgif-frame-${pad(frameIndex, 3)}.jpg`;
            
            const onFrameLoaded = () => {
                preloadedImages[frameIndex] = img;
                loadedCount++;
                // Frame loaded
                
                if (canvas && !isRendering) {
                    drawFrame(Math.round(currentFrame));
                }
                loadNext();
            };
            
            if (typeof img.decode === 'function') {
                img.decode().then(onFrameLoaded).catch(() => {
                    img.onload = onFrameLoaded;
                    img.onerror = onFrameLoaded;
                });
            } else {
                img.onload = onFrameLoaded;
                img.onerror = onFrameLoaded;
            }
        }
        
        for (let i = 0; i < concurrency; i++) {
            loadNext();
        }
    }

    if (canvas) {
        const context = canvas.getContext('2d');
        
        function drawFrame(frameIndex) {
            // Find the closest loaded frame that is <= frameIndex
            let closestIdx = 1;
            for (let i = frameIndex; i >= 1; i--) {
                if (preloadedImages[i]) {
                    closestIdx = i;
                    break;
                }
            }
            if (!preloadedImages[closestIdx]) return;
            
            const img = preloadedImages[closestIdx];
            if (!img.complete) return;
            
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const imgWidth = img.naturalWidth || img.width;
            const imgHeight = img.naturalHeight || img.height;
            
            if (!imgWidth || !imgHeight) return;
            
            const imgRatio = imgWidth / imgHeight;
            const canvasRatio = canvasWidth / canvasHeight;
            
            let drawWidth, drawHeight, drawX, drawY;
            
            if (canvasRatio > imgRatio) {
                drawWidth = canvasWidth;
                drawHeight = canvasWidth / imgRatio;
                drawX = 0;
                drawY = 0; // Top-align image
            } else {
                drawWidth = canvasHeight * imgRatio;
                drawHeight = canvasHeight;
                drawX = (canvasWidth - drawWidth) / 2;
                drawY = 0;
            }
            
            context.clearRect(0, 0, canvasWidth, canvasHeight);
            context.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        }
        
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            drawFrame(Math.round(currentFrame));
        }
        window.addEventListener('resize', resizeCanvas);
        
        // Listen to scroll to update target frame and scenes
        window.addEventListener('scroll', () => {
            if (!scrollContainer) return;
            
            const rect = scrollContainer.getBoundingClientRect();
            const containerHeight = scrollContainer.offsetHeight;
            const viewportHeight = window.innerHeight;
            
            const scrollTop = -rect.top;
            const scrollRange = containerHeight - viewportHeight;
            
            let fraction = scrollTop / scrollRange;
            fraction = Math.max(0, Math.min(1, fraction));
            
            targetFrame = 1 + fraction * (totalFrames - 1);
            
            // Wake up rendering loop if not currently drawing
            if (!isRendering) {
                isRendering = true;
                requestAnimationFrame(renderLoop);
            }
            
            // Dynamic text overlays
            if (scene1 && scene2 && scene3) {
                if (fraction <= 0.28) {
                    scene1.classList.add('active-scene');
                } else {
                    scene1.classList.remove('active-scene');
                }
                
                if (fraction >= 0.32 && fraction <= 0.65) {
                    scene2.classList.add('active-scene');
                } else {
                    scene2.classList.remove('active-scene');
                }
                
                if (fraction >= 0.69) {
                    scene3.classList.add('active-scene');
                } else {
                    scene3.classList.remove('active-scene');
                }
            }
            
            if (indicator) {
                if (fraction > 0.1) {
                    indicator.classList.add('hide');
                } else {
                    indicator.classList.remove('hide');
                }
            }
        });
        
        function renderLoop() {
            const diff = targetFrame - currentFrame;
            if (Math.abs(diff) < 0.005) {
                currentFrame = targetFrame;
                isRendering = false; // Stop rendering once animations settle
            } else {
                currentFrame += diff * 0.035; // Smooth ease-out factor
            }
            
            const frameToDraw = Math.round(currentFrame);
            if (frameToDraw !== lastDrawnFrame) {
                drawFrame(frameToDraw);
                lastDrawnFrame = frameToDraw;
            }
            
            if (isRendering) {
                requestAnimationFrame(renderLoop);
            }
        }
    }

    // ==========================================================================
    // --- Dynamic CMS Content Loader & Database Fetcher ---
    // ==========================================================================
    let siteContent = {
        heroTitle1: "FORGE YOUR LEGACY.",
        heroSubtitle1: "Premium equipment. Elite trainers. The ultimate fitness experience in Kurla, Mumbai.",
        heroTitle2: "BUILT ON RAW POWER.",
        heroSubtitle2: "Precision machinery and specialized platforms for max effort strength training.",
        heroTitle3: "JOIN THE FITNESS HUB.",
        heroSubtitle3: "Unleash your potential today. Book a session with our championship-grade coaching team.",
        aboutHeading: "THE PHILOSOPHY",
        aboutPhoto: "assets/about_img.jpg",
        aboutSubtitle: "We don't build gym memberships. We forge relentless athletic capability and physical fortitude.",
        aboutStory1: "Founded in Kurla, Mumbai, THE FITNESS HUB was established to bridge the gap between commercialized fitness franchises and hardcore strength athletics. We set out to create a sanctuary where physical potential is realized through raw science, top-tier infrastructure, and unyielding discipline.",
        aboutStory2: "Every bar, platform, and program at the Hub is curated for serious results. We offer a high-intensity, zero-compromise environment designed to push you past your boundaries.",
        galleryImages: [
            { "src": "assets/hero_bg.png", "caption": "MAIN STRENGTH ROOM" },
            { "src": "assets/crossfit.png", "caption": "METABOLIC CONDITIONING FLOOR" },
            { "src": "assets/bodybuilding.png", "caption": "FREE WEIGHT EQUIPMENT RACK" },
            { "src": "assets/gallery_1.png", "caption": "POWERLIFTING PLATFORM" },
            { "src": "assets/gallery_2.png", "caption": "CHAMPIONSHIP GRADE DUMBBELLS" },
            { "src": "assets/gallery_3.png", "caption": "PULL-UP RIG AND RIGGING AREA" }
        ],
        testimonials: [
            {
                "id": "1",
                "rating": 5,
                "quote": "Amazing atmosphere, top-quality equipment, and highly supportive trainers.",
                "authorName": "Anshuman S.",
                "authorTitle": "Verified Member",
                "avatar": "AS"
            },
            {
                "id": "2",
                "rating": 5,
                "quote": "Perfect place for both beginners and experienced people.",
                "authorName": "Rahul K.",
                "authorTitle": "Powerlifter",
                "avatar": "RK"
            },
            {
                "id": "3",
                "rating": 5,
                "quote": "Environment, proper and good condition machine.",
                "authorName": "Pratik D.",
                "authorTitle": "Bodybuilder",
                "avatar": "PD"
            }
        ],
        membershipPlans: [
            {
                "id": "1",
                "name": "BASIC STRENGTH",
                "price": "$49",
                "period": "MONTH",
                "features": [
                    "Access to Strength Floor",
                    "Standard Locker Room access",
                    "1 Coach Consultation/mo"
                ],
                "ctaText": "JOIN NOW",
                "badge": ""
            },
            {
                "id": "2",
                "name": "ELITE ATHLETE",
                "price": "$89",
                "period": "MONTH",
                "features": [
                    "24/7 Facility Access",
                    "CrossFit & HIIT classes",
                    "Unrestricted platforms",
                    "Custom Macro program",
                    "Monthly body composition scan"
                ],
                "ctaText": "GO ELITE",
                "badge": "POPULAR"
            },
            {
                "id": "3",
                "name": "CHAMPIONSHIP ELITE",
                "price": "$199",
                "period": "MONTH",
                "features": [
                    "All Elite Athlete benefits",
                    "Weekly 1-on-1 coaching (1hr)",
                    "Access to Recovery Spa",
                    "Complimentary post-workout shakes",
                    "Priority platform reservation"
                ],
                "ctaText": "START CHAMPION",
                "badge": "ULTIMATE"
            }
        ]
    };

    function fetchContent() {
        return fetch('/api/content')
            .then(res => {
                if (!res.ok) throw new Error('API not available');
                return res.json();
            })
            .then(data => {
                siteContent = data;
                applyContentToDOM();
                
                // If we are on membership page, render plans
                if (document.getElementById('dynamic-pricing-grid')) {
                    renderPricingPlans();
                }
            })
            .catch(err => {
                console.warn('Backend API not available, loading content from localStorage fallback:', err);
                const localContent = localStorage.getItem('the_fitness_hub_content');
                if (localContent) {
                    try {
                        siteContent = JSON.parse(localContent);
                    } catch (e) {
                        console.error('Error parsing local storage content:', e);
                    }
                }
                applyContentToDOM();
                
                // If we are on membership page, render plans
                if (document.getElementById('dynamic-pricing-grid')) {
                    renderPricingPlans();
                }
            });
    }

    function applyContentToDOM() {
        const elIds = [
            'dyn-heroTitle1', 'dyn-heroSubtitle1',
            'dyn-heroTitle2', 'dyn-heroSubtitle2',
            'dyn-heroTitle3', 'dyn-heroSubtitle3',
            'dyn-aboutSubtitle', 'dyn-aboutStory1', 'dyn-aboutStory2'
        ];
        elIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const key = id.replace('dyn-', '');
                if (siteContent[key] !== undefined) {
                    if (key === 'aboutStory1' || key === 'aboutStory2') {
                        el.innerHTML = siteContent[key];
                    } else {
                        el.textContent = siteContent[key];
                    }
                }
            }
        });
        
        // Update About photo
        const aboutPhotoEl = document.getElementById('dyn-aboutPhoto');
        if (aboutPhotoEl && siteContent.aboutPhoto) {
            aboutPhotoEl.src = siteContent.aboutPhoto;
        }
        
        // Update About heading
        const aboutHeadingEl = document.getElementById('dyn-aboutHeading');
        if (aboutHeadingEl && siteContent.aboutHeading) {
            aboutHeadingEl.textContent = siteContent.aboutHeading;
        }

        renderGallery();
        renderTestimonials();
    }

    function saveContentToServer() {
        localStorage.setItem('the_fitness_hub_content', JSON.stringify(siteContent));
        return fetch('/api/content', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(siteContent)
        })
        .then(res => {
            if (!res.ok) throw new Error('API not available');
            return res.json();
        })
        .catch(err => {
            console.warn('Backend API not available, content saved to localStorage only:', err);
            return { status: 'success', storage: 'local' };
        });
    }

    // Apply default content immediately for instant paint
    applyContentToDOM();

    // Fetch server database content in the background
    fetchContent();

    // --- Dynamic Gallery Engine & Data ---
    function getGalleryImages() {
        return siteContent.galleryImages || [];
    }

    let galleryExpanded = false;

    function renderGallery() {
        const grid = document.getElementById('dynamic-gallery-grid');
        if (!grid) return;
        
        const images = getGalleryImages();
        grid.innerHTML = '';
        
        const maxCollapsed = 6;
        const needsCollapsing = images.length > maxCollapsed && !galleryExpanded;
        const imagesToRender = needsCollapsing ? images.slice(0, maxCollapsed) : images;
        
        imagesToRender.forEach((img, index) => {
            const figure = document.createElement('figure');
            
            // Render 6th image with 'VIEW MORE' overlay if collapsed
            if (needsCollapsing && index === maxCollapsed - 1) {
                figure.className = 'gallery-item reveal visible view-more-overlay';
                figure.setAttribute('tabindex', '0');
                figure.setAttribute('role', 'button');
                figure.setAttribute('aria-label', 'View more gallery photos');
                figure.innerHTML = `
                    <img src="${img.src}" alt="${img.caption}" loading="lazy">
                    <div class="gallery-overlay">
                        <div class="gallery-view-more-text">VIEW MORE</div>
                    </div>
                `;
                
                const expandGallery = () => {
                    galleryExpanded = true;
                    renderGallery();
                    // Move focus to first newly loaded element for accessibility
                    setTimeout(() => {
                        const newItems = grid.querySelectorAll('.gallery-item');
                        if (newItems.length > maxCollapsed) {
                            newItems[maxCollapsed].focus();
                        }
                    }, 50);
                };

                figure.addEventListener('click', expandGallery);
                figure.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        expandGallery();
                    }
                });
            } else {
                figure.className = 'gallery-item reveal visible';
                figure.innerHTML = `
                    <img src="${img.src}" alt="${img.caption}" loading="lazy">
                    <div class="gallery-overlay">
                        <figcaption class="gallery-caption">${img.caption}</figcaption>
                    </div>
                `;
            }
            grid.appendChild(figure);
        });
    }

    // --- Mobile Navigation Menu Toggle ---
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    const navLinkItems = document.querySelectorAll('.nav-link');
    
    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', () => {
            const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
            
            navLinks.classList.toggle('active');
            mobileToggle.setAttribute('aria-expanded', !isExpanded);
            
            const bars = mobileToggle.querySelectorAll('.bar');
            if (navLinks.classList.contains('active')) {
                bars[0].style.transform = 'translateY(8px) rotate(45deg)';
                bars[1].style.opacity = '0';
                bars[2].style.transform = 'translateY(-8px) rotate(-45deg)';
            } else {
                bars[0].style.transform = 'none';
                bars[1].style.opacity = '1';
                bars[2].style.transform = 'none';
            }
        });

        navLinkItems.forEach(item => {
            item.addEventListener('click', () => {
                if (navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    mobileToggle.setAttribute('aria-expanded', 'false');
                    
                    const bars = mobileToggle.querySelectorAll('.bar');
                    bars[0].style.transform = 'none';
                    bars[1].style.opacity = '1';
                    bars[2].style.transform = 'none';
                }
            });
        });
    }

    // --- Intersection Observer for Scroll Fade-In ---
    const revealElements = document.querySelectorAll('.reveal');
    const revealOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, revealOptions);

    revealElements.forEach(element => {
        revealObserver.observe(element);
    });

    // --- Dynamic Header State on Scroll ---
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.backgroundColor = 'rgba(10, 10, 10, 0.98)';
            header.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';
        } else {
            header.style.backgroundColor = 'rgba(10, 10, 10, 0.95)';
            header.style.boxShadow = 'none';
        }
    });

    // --- Contact Form Submission Handler (Saves to server bookings.json) ---
    const contactForm = document.getElementById('gym-contact-form');
    const successOverlay = document.getElementById('success-overlay');
    const closeSuccessBtn = document.getElementById('close-success');

    if (contactForm && successOverlay) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('contact-name').value.trim();
            const email = document.getElementById('contact-email').value.trim();
            const phone = document.getElementById('contact-phone').value.trim() || 'N/A';
            const service = document.getElementById('contact-service').value;
            const message = document.getElementById('contact-message').value.trim();

            if (name && email && message) {
                const newBooking = {
                    id: Date.now().toString(),
                    name,
                    email,
                    phone,
                    service,
                    message,
                    date: new Date().toLocaleString()
                };

                fetch('/api/bookings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(newBooking)
                })
                .then(res => {
                    if (!res.ok) throw new Error('API not available');
                    return res.json();
                })
                .then(() => {
                    successOverlay.style.display = 'flex';
                    contactForm.reset();
                })
                .catch(err => {
                    console.warn('Backend API not available, saving booking to localStorage:', err);
                    try {
                        const localBookings = localStorage.getItem('the_fitness_hub_bookings');
                        let bookings = localBookings ? JSON.parse(localBookings) : [];
                        bookings.push(newBooking);
                        localStorage.setItem('the_fitness_hub_bookings', JSON.stringify(bookings));
                    } catch (e) {
                        console.error('Error saving booking to localStorage:', e);
                    }
                    successOverlay.style.display = 'flex';
                    contactForm.reset();
                });
            }
        });

        if (closeSuccessBtn) {
            closeSuccessBtn.addEventListener('click', () => {
                successOverlay.style.display = 'none';
            });
        }

        successOverlay.addEventListener('click', (e) => {
            if (e.target === successOverlay) {
                successOverlay.style.display = 'none';
            }
        });
    }

    // --- Scroll Spy to Update Nav Link Active Class ---
    const sections = document.querySelectorAll('section[id], .hero-scroll-container[id]');
    const navLinksList = document.querySelectorAll('.nav-link');

    function scrollSpy() {
        const scrollPosition = window.scrollY + 120;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinksList.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    window.addEventListener('scroll', scrollSpy);

    // ==========================================================================
    // --- Admin Panel Operations Engine ---
    // ==========================================================================
    const adminTrigger = document.getElementById('admin-trigger-link');
    const adminOverlay = document.getElementById('admin-overlay');
    const adminClose = document.getElementById('admin-close-btn');
    
    const setupView = document.getElementById('admin-setup-view');
    const loginView = document.getElementById('admin-login-view');
    const dashboardView = document.getElementById('admin-dashboard-view');
    
    const setupForm = document.getElementById('admin-setup-form');
    const loginForm = document.getElementById('admin-login-form');
    const logoutBtn = document.getElementById('admin-logout-btn');
    
    const setupError = document.getElementById('setup-error');
    const loginError = document.getElementById('login-error');

    // Tab buttons and containers
    const tabBookingsBtn = document.getElementById('tab-bookings-btn');
    const tabGalleryBtn = document.getElementById('tab-gallery-btn');
    const tabTestimonialsBtn = document.getElementById('tab-testimonials-btn');
    const tabMembershipBtn = document.getElementById('tab-membership-btn');
    const tabContentBtn = document.getElementById('tab-content-btn');
    
    const tabBookingsContent = document.getElementById('tab-bookings-content');
    const tabGalleryContent = document.getElementById('tab-gallery-content');
    const tabTestimonialsContent = document.getElementById('tab-testimonials-content');
    const tabMembershipContent = document.getElementById('tab-membership-content');
    const tabContentContent = document.getElementById('tab-content-content');
    
    // Forms
    const contentForm = document.getElementById('admin-content-form');
    const addPhotoForm = document.getElementById('admin-add-photo-form');
    
    // Booking elements
    const bookingsList = document.getElementById('bookings-list');
    const bookingsCount = document.getElementById('bookings-count');
    const clearBookingsBtn = document.getElementById('clear-bookings-btn');
    const downloadBookingsBtn = document.getElementById('download-bookings-btn');
    
    // Gallery elements
    const galleryManagerGrid = document.getElementById('gallery-manager-grid');
    const photoSourceRadios = document.getElementsByName('photo-source');
    const photoFileGroup = document.getElementById('photo-file-group');
    const photoUrlGroup = document.getElementById('photo-url-group');

    // Target Admin Info
    const TARGET_ADMIN_ID = "The Fitness Hub";
    const TARGET_ADMIN_PW = "thefitnesshub@25";

    // Toggle overlay visibility
    if (adminTrigger && adminOverlay) {
        adminTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            adminOverlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            initAdminOverlayView();
        });
    }

    if (adminClose) {
        adminClose.addEventListener('click', () => {
            adminOverlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    }

    adminOverlay.addEventListener('click', (e) => {
        if (e.target === adminOverlay) {
            adminOverlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    function initAdminOverlayView() {
        const isRegistered = localStorage.getItem('adminRegistered') === 'true';
        const isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';

        setupView.style.display = 'none';
        loginView.style.display = 'none';
        dashboardView.style.display = 'none';

        if (isLoggedIn) {
            dashboardView.style.display = 'block';
            loadAdminDashboard();
        } else if (!isRegistered) {
            setupView.style.display = 'block';
        } else {
            loginView.style.display = 'block';
        }
    }

    // --- Admin Registration Form ---
    if (setupForm) {
        setupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            setupError.style.display = 'none';

            const userVal = document.getElementById('setup-username').value.trim();
            const passVal = document.getElementById('setup-password').value.trim();

            if (userVal === TARGET_ADMIN_ID && passVal === TARGET_ADMIN_PW) {
                localStorage.setItem('adminRegistered', 'true');
                localStorage.setItem('adminCredentials', JSON.stringify({ username: userVal, password: passVal }));
                
                sessionStorage.setItem('adminLoggedIn', 'true');
                setupForm.reset();
                initAdminOverlayView();
            } else {
                setupError.textContent = `Only ID "${TARGET_ADMIN_ID}" and password "${TARGET_ADMIN_PW}" are allowed for the single admin slot.`;
                setupError.style.display = 'block';
            }
        });
    }

    // --- Admin Login Form ---
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            loginError.style.display = 'none';

            const userVal = document.getElementById('login-username').value.trim();
            const passVal = document.getElementById('login-password').value.trim();
            const storedCreds = JSON.parse(localStorage.getItem('adminCredentials'));

            if (storedCreds && userVal === storedCreds.username && passVal === storedCreds.password) {
                sessionStorage.setItem('adminLoggedIn', 'true');
                loginForm.reset();
                initAdminOverlayView();
            } else {
                loginError.textContent = 'Access Denied: Invalid Admin ID or Password.';
                loginError.style.display = 'block';
            }
        });
    }

    // --- Admin Logout ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('adminLoggedIn');
            initAdminOverlayView();
        });
    }

    // --- Dashboard Tabs Navigation ---
    const allTabButtons = [tabBookingsBtn, tabGalleryBtn, tabTestimonialsBtn, tabMembershipBtn, tabContentBtn];
    const allTabContents = [tabBookingsContent, tabGalleryContent, tabTestimonialsContent, tabMembershipContent, tabContentContent];
    
    function switchTab(activeBtn, activeContent) {
        allTabButtons.forEach(btn => {
            if (btn) {
                btn.style.borderBottomColor = 'transparent';
                btn.style.color = 'var(--color-text-gray)';
            }
        });
        allTabContents.forEach(content => {
            if (content) {
                content.style.display = 'none';
            }
        });
        if (activeBtn) {
            activeBtn.style.borderBottomColor = 'var(--color-text-white)';
            activeBtn.style.color = 'var(--color-text-white)';
        }
        if (activeContent) {
            activeContent.style.display = 'block';
        }
    }
    
    if (tabBookingsBtn) {
        tabBookingsBtn.addEventListener('click', () => {
            switchTab(tabBookingsBtn, tabBookingsContent);
            renderBookingsTab();
        });
    }
    if (tabGalleryBtn) {
        tabGalleryBtn.addEventListener('click', () => {
            switchTab(tabGalleryBtn, tabGalleryContent);
            renderGalleryManagerTab();
        });
    }
    if (tabTestimonialsBtn) {
        tabTestimonialsBtn.addEventListener('click', () => {
            switchTab(tabTestimonialsBtn, tabTestimonialsContent);
            renderTestimonialsManagerTab();
        });
    }
    if (tabMembershipBtn) {
        tabMembershipBtn.addEventListener('click', () => {
            switchTab(tabMembershipBtn, tabMembershipContent);
            loadPlansToEditorForm();
        });
    }
    if (tabContentBtn) {
        tabContentBtn.addEventListener('click', () => {
            switchTab(tabContentBtn, tabContentContent);
            loadContentToEditorForm();
        });
    }
 
    // --- Load Admin Dashboard Data ---
    function loadAdminDashboard() {
        switchTab(tabBookingsBtn, tabBookingsContent);
        renderBookingsTab();
        renderGalleryManagerTab();
        renderTestimonialsManagerTab();
        loadPlansToEditorForm();
    }

    // --- Tab 1: Bookings Management ---
    function renderBookingsTab() {
        if (!bookingsList) return;
        
        fetch('/api/bookings')
            .then(res => {
                if (!res.ok) throw new Error('API not available');
                return res.json();
            })
            .then(bookings => {
                displayBookings(bookings);
            })
            .catch(err => {
                console.warn('Backend API not available, loading bookings from localStorage fallback:', err);
                const localBookings = localStorage.getItem('the_fitness_hub_bookings');
                let bookings = [];
                if (localBookings) {
                    try {
                        bookings = JSON.parse(localBookings);
                    } catch (e) {
                        console.error('Error parsing local storage bookings:', e);
                    }
                }
                displayBookings(bookings);
            });
    }

    function displayBookings(bookings) {
        bookingsCount.textContent = bookings.length;
        bookingsList.innerHTML = '';

        if (bookings.length === 0) {
            bookingsList.innerHTML = '<div class="no-bookings">NO REGISTRATIONS RECORDED</div>';
            return;
        }

        bookings.forEach(booking => {
            const card = document.createElement('div');
            card.className = 'booking-card';
            card.innerHTML = `
                <div class="booking-header">
                   <span class="booking-name">${escapeHTML(booking.name)}</span>
                   <span class="booking-date">${booking.date}</span>
                </div>
                <div class="booking-details-row">
                   <div class="booking-detail-item">
                       <strong>EMAIL</strong>
                       <a href="mailto:${escapeHTML(booking.email)}">${escapeHTML(booking.email)}</a>
                   </div>
                   <div class="booking-detail-item">
                       <strong>PHONE</strong>
                       <span>${escapeHTML(booking.phone)}</span>
                   </div>
                   <div class="booking-detail-item">
                       <strong>INTEREST</strong>
                       <span>${escapeHTML(booking.service)}</span>
                   </div>
                </div>
                <div class="booking-message">
                   <strong>MESSAGE / INTENT:</strong><br>
                   ${escapeHTML(booking.message).replace(/\n/g, '<br>')}
                </div>
                <button class="booking-delete-btn" data-id="${booking.id}">DELETE ENTRY</button>
            `;
            bookingsList.appendChild(card);
        });

        const delButtons = bookingsList.querySelectorAll('.booking-delete-btn');
        delButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                deleteBooking(id);
            });
        });
    }

    function deleteBooking(id) {
        fetch('/api/delete-booking', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id })
        })
        .then(res => {
            if (!res.ok) throw new Error('API not available');
            return res.json();
        })
        .then(() => {
            renderBookingsTab();
        })
        .catch(err => {
            console.warn('Backend API not available, deleting booking from localStorage:', err);
            const localBookings = localStorage.getItem('the_fitness_hub_bookings');
            if (localBookings) {
                try {
                    let bookings = JSON.parse(localBookings);
                    bookings = bookings.filter(b => b.id !== id);
                    localStorage.setItem('the_fitness_hub_bookings', JSON.stringify(bookings));
                } catch (e) {
                    console.error('Error parsing local bookings for deletion:', e);
                }
            }
            renderBookingsTab();
        });
    }

    if (downloadBookingsBtn) {
        downloadBookingsBtn.addEventListener('click', () => {
            fetch('/api/bookings')
                .then(res => res.json())
                .then(bookings => {
                    if (bookings.length === 0) {
                        alert('No registrations available to download.');
                        return;
                    }
                    
                    const headers = ['ID', 'Name', 'Email', 'Phone', 'Service of Interest', 'Message', 'Submission Date'];
                    const rows = bookings.map(b => [
                        b.id,
                        b.name,
                        b.email,
                        b.phone,
                        b.service,
                        b.message,
                        b.date
                    ]);
                    
                    const escapeCSV = (val) => {
                        if (val === undefined || val === null) return '';
                        let stringVal = val.toString();
                        stringVal = stringVal.replace(/"/g, '""');
                        if (stringVal.includes(',') || stringVal.includes('\n') || stringVal.includes('"') || stringVal.includes('\r')) {
                            stringVal = `"${stringVal}"`;
                        }
                        return stringVal;
                    };
                    
                    const headerString = headers.map(escapeCSV).join(',');
                    const rowStrings = rows.map(r => r.map(escapeCSV).join(',')).join('\n');
                    const csvData = headerString + '\n' + rowStrings;
                    
                    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.setAttribute("href", url);
                    link.setAttribute("download", `bookings_${new Date().toISOString().slice(0,10)}.csv`);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                });
        });
    }

    if (clearBookingsBtn) {
        clearBookingsBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all registrations? This action is permanent.')) {
                fetch('/api/clear-bookings', { method: 'POST' })
                    .then(res => {
                        if (!res.ok) throw new Error('API not available');
                        return res.json();
                    })
                    .then(() => {
                        renderBookingsTab();
                    })
                    .catch(err => {
                        console.warn('Backend API not available, clearing localStorage bookings:', err);
                        localStorage.removeItem('the_fitness_hub_bookings');
                        renderBookingsTab();
                    });
            }
        });
    }

    // --- Tab 2: Gallery Manager Management ---
    if (photoSourceRadios) {
        photoSourceRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.value === 'file') {
                    photoFileGroup.style.display = 'block';
                    photoUrlGroup.style.display = 'none';
                    document.getElementById('photo-url').required = false;
                    document.getElementById('photo-file').required = true;
                } else {
                    photoFileGroup.style.display = 'none';
                    photoUrlGroup.style.display = 'block';
                    document.getElementById('photo-url').required = true;
                    document.getElementById('photo-file').required = false;
                }
            });
        });
    }

    function renderGalleryManagerTab() {
        if (!galleryManagerGrid) return;
        const images = getGalleryImages();
        galleryManagerGrid.innerHTML = '';

        images.forEach((img, index) => {
            const div = document.createElement('div');
            div.className = 'gallery-manager-item';
            div.innerHTML = `
                <img src="${img.src}" alt="${img.caption}">
                <button class="gallery-manager-delete-btn" data-index="${index}">DELETE</button>
            `;
            galleryManagerGrid.appendChild(div);
        });

        const delButtons = galleryManagerGrid.querySelectorAll('.gallery-manager-delete-btn');
        delButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'), 10);
                deleteGalleryImage(index);
            });
        });
    }

    function deleteGalleryImage(index) {
        if (!siteContent.galleryImages) siteContent.galleryImages = [];
        siteContent.galleryImages.splice(index, 1);
        saveContentToServer().then(() => {
            renderGalleryManagerTab();
            renderGallery();
        });
    }

    if (addPhotoForm) {
        addPhotoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const caption = document.getElementById('photo-caption').value.trim();
            const source = document.querySelector('input[name="photo-source"]:checked').value;
            
            if (source === 'url') {
                const url = document.getElementById('photo-url').value.trim();
                if (url && caption) {
                    addGalleryImage(url, caption);
                }
            } else {
                const fileInput = document.getElementById('photo-file');
                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        addGalleryImage(event.target.result, caption);
                    };
                    reader.readAsDataURL(file);
                }
            }
        });
    }

    function addGalleryImage(src, caption) {
        if (!siteContent.galleryImages) siteContent.galleryImages = [];
        siteContent.galleryImages.push({ src, caption });
        saveContentToServer().then(() => {
            addPhotoForm.reset();
            photoFileGroup.style.display = 'block';
            photoUrlGroup.style.display = 'none';
            renderGalleryManagerTab();
            renderGallery();
        });
    }

    // --- Dynamic Testimonials Engine ---
    function getTestimonials() {
        return siteContent.testimonials || [];
    }

    function renderTestimonials() {
        const grid = document.getElementById('dynamic-testimonials-grid');
        if (!grid) return;
        
        const testimonials = getTestimonials();
        grid.innerHTML = '';
        
        testimonials.forEach(t => {
            const article = document.createElement('article');
            article.className = 'testimonial-card reveal visible';
            
            let starsHTML = '';
            for (let i = 0; i < t.rating; i++) starsHTML += '⭐';
            
            article.innerHTML = `
                <div class="testimonial-rating" aria-label="${t.rating} out of 5 stars">${starsHTML}</div>
                <blockquote class="testimonial-quote">
                    "${escapeHTML(t.quote)}"
                </blockquote>
                <div class="testimonial-author">
                    <span class="author-avatar" aria-hidden="true">${escapeHTML(t.avatar)}</span>
                    <div>
                        <h4 class="author-name">${escapeHTML(t.authorName)}</h4>
                        <p class="author-title">${escapeHTML(t.authorTitle)}</p>
                    </div>
                </div>
            `;
            grid.appendChild(article);
        });
    }

    // Testimonials Tab Logic
    const addTestimonialForm = document.getElementById('admin-add-testimonial-form');
    const testimonialsManagerList = document.getElementById('testimonials-manager-list');
    
    function renderTestimonialsManagerTab() {
        if (!testimonialsManagerList) return;
        const testimonials = getTestimonials();
        testimonialsManagerList.innerHTML = '';
        
        if (testimonials.length === 0) {
            testimonialsManagerList.innerHTML = '<div style="color: var(--color-text-muted); font-size: 0.85rem; padding: 1rem 0;">NO TESTIMONIALS ADDED</div>';
            return;
        }
        
        testimonials.forEach((t, index) => {
            const div = document.createElement('div');
            div.className = 'testimonial-manager-card';
            div.style.border = '1px solid var(--color-border-dim)';
            div.style.padding = '1rem';
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.alignItems = 'center';
            div.style.background = 'var(--color-bg-pure)';
            div.style.marginBottom = '0.5rem';
            
            div.innerHTML = `
                <div style="flex-grow: 1; padding-right: 1rem;">
                    <strong style="font-size: 0.85rem; color: white;">${escapeHTML(t.authorName)} (${escapeHTML(t.authorTitle)})</strong>
                    <p style="font-size: 0.75rem; color: var(--color-text-gray); margin-top: 0.2rem; line-height: 1.4;">${escapeHTML(t.quote)}</p>
                </div>
                <button class="btn btn-secondary btn-small testimonial-delete-btn" data-index="${index}" style="padding: 0.4rem 0.8rem; font-size: 0.65rem;">DELETE</button>
            `;
            testimonialsManagerList.appendChild(div);
        });
        
        const delButtons = testimonialsManagerList.querySelectorAll('.testimonial-delete-btn');
        delButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'), 10);
                deleteTestimonial(index);
            });
        });
    }
    
    function deleteTestimonial(index) {
        if (!siteContent.testimonials) siteContent.testimonials = [];
        siteContent.testimonials.splice(index, 1);
        saveContentToServer().then(() => {
            renderTestimonialsManagerTab();
            renderTestimonials();
        });
    }
    
    if (addTestimonialForm) {
        addTestimonialForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const quote = document.getElementById('test-quote').value.trim();
            const authorName = document.getElementById('test-author').value.trim();
            const authorTitle = document.getElementById('test-title').value.trim();
            const avatar = document.getElementById('test-avatar').value.trim().toUpperCase();
            const rating = parseInt(document.getElementById('test-rating').value, 10);
            
            if (quote && authorName && authorTitle && avatar) {
                if (!siteContent.testimonials) siteContent.testimonials = [];
                siteContent.testimonials.push({
                    id: Date.now().toString(),
                    rating,
                    quote,
                    authorName,
                    authorTitle,
                    avatar
                });
                
                saveContentToServer().then(() => {
                    addTestimonialForm.reset();
                    renderTestimonialsManagerTab();
                    renderTestimonials();
                });
            }
        });
    }

    // --- Dynamic Pricing Engine ---
    function getMembershipPlans() {
        return siteContent.membershipPlans || [];
    }
    
    function renderPricingPlans() {
        const grid = document.getElementById('dynamic-pricing-grid');
        if (!grid) return;
        
        const plans = getMembershipPlans();
        grid.innerHTML = '';
        
        plans.forEach(plan => {
            const card = document.createElement('div');
            const isPopular = plan.badge && (plan.badge.toUpperCase() === 'POPULAR' || plan.badge.toUpperCase() === 'RECOMMENDED' || plan.badge.toUpperCase() === 'ULTIMATE');
            card.className = `pricing-card ${isPopular ? 'popular-card' : ''}`;
            
            let badgeHTML = plan.badge ? `<div class="pricing-badge">${escapeHTML(plan.badge)}</div>` : '';
            
            let featuresHTML = '';
            if (plan.features && Array.isArray(plan.features)) {
                plan.features.forEach(f => {
                    featuresHTML += `<li>${escapeHTML(f)}</li>`;
                });
            }
            
            card.innerHTML = `
                ${badgeHTML}
                <div>
                    <h3 class="pricing-plan-name">${escapeHTML(plan.name)}</h3>
                    <div class="pricing-price-container">
                        <span class="pricing-price">${escapeHTML(plan.price)}</span>
                        <span class="pricing-period">/ ${escapeHTML(plan.period)}</span>
                    </div>
                    <ul class="pricing-features-list">
                        ${featuresHTML}
                    </ul>
                </div>
                <a href="index.html#contact" class="btn ${isPopular ? 'btn-primary' : 'btn-secondary'}">${escapeHTML(plan.ctaText || 'GET STARTED')}</a>
            `;
            grid.appendChild(card);
        });
    }

    // Membership Plans Editor Tab
    const membershipPlansForm = document.getElementById('admin-membership-form');
    
    function loadPlansToEditorForm() {
        const plans = getMembershipPlans();
        if (plans.length < 3) return;
        
        for (let i = 1; i <= 3; i++) {
            const plan = plans[i - 1];
            if (!plan) continue;
            
            const nameInput = document.getElementById(`edit-plan${i}-name`);
            const priceInput = document.getElementById(`edit-plan${i}-price`);
            const periodInput = document.getElementById(`edit-plan${i}-period`);
            const featuresInput = document.getElementById(`edit-plan${i}-features`);
            const ctaInput = document.getElementById(`edit-plan${i}-cta`);
            const badgeInput = document.getElementById(`edit-plan${i}-badge`);
            
            if (nameInput) nameInput.value = plan.name || '';
            if (priceInput) priceInput.value = plan.price || '';
            if (periodInput) periodInput.value = plan.period || '';
            if (featuresInput) featuresInput.value = plan.features ? plan.features.join('\n') : '';
            if (ctaInput) ctaInput.value = plan.ctaText || '';
            if (badgeInput) badgeInput.value = plan.badge || '';
        }
    }
    
    if (membershipPlansForm) {
        membershipPlansForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (!siteContent.membershipPlans) siteContent.membershipPlans = [];
            
            for (let i = 1; i <= 3; i++) {
                const name = document.getElementById(`edit-plan${i}-name`).value.trim();
                const price = document.getElementById(`edit-plan${i}-price`).value.trim();
                const period = document.getElementById(`edit-plan${i}-period`).value.trim();
                const features = document.getElementById(`edit-plan${i}-features`).value.trim().split('\n').filter(f => f.trim() !== '');
                const ctaText = document.getElementById(`edit-plan${i}-cta`).value.trim();
                const badge = document.getElementById(`edit-plan${i}-badge`).value.trim();
                
                siteContent.membershipPlans[i - 1] = {
                    id: i.toString(),
                    name,
                    price,
                    period,
                    features,
                    ctaText,
                    badge
                };
            }
            
            saveContentToServer().then(() => {
                alert('Membership plans successfully updated and saved to server!');
                renderPricingPlans();
            });
        });
    }

    // --- Tab 5: Content Editor Management ---
    const aboutPhotoSourceRadios = document.getElementsByName('about-photo-source');
    const aboutPhotoFileGroup = document.getElementById('about-photo-file-group');
    const aboutPhotoUrlGroup = document.getElementById('about-photo-url-group');
    
    if (aboutPhotoSourceRadios) {
        aboutPhotoSourceRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.value === 'file') {
                    if (aboutPhotoFileGroup) aboutPhotoFileGroup.style.display = 'block';
                    if (aboutPhotoUrlGroup) aboutPhotoUrlGroup.style.display = 'none';
                    const editUrl = document.getElementById('edit-aboutPhotoUrl');
                    if (editUrl) editUrl.required = false;
                } else {
                    if (aboutPhotoFileGroup) aboutPhotoFileGroup.style.display = 'none';
                    if (aboutPhotoUrlGroup) aboutPhotoUrlGroup.style.display = 'block';
                    const editUrl = document.getElementById('edit-aboutPhotoUrl');
                    if (editUrl) editUrl.required = true;
                }
            });
        });
    }

    function loadContentToEditorForm() {
        const keys = [
            'heroTitle1', 'heroSubtitle1',
            'heroTitle2', 'heroSubtitle2',
            'heroTitle3', 'heroSubtitle3',
            'aboutHeading', 'aboutSubtitle', 'aboutStory1', 'aboutStory2'
        ];
        keys.forEach(key => {
            const input = document.getElementById(`edit-${key}`);
            if (input && siteContent[key] !== undefined) {
                input.value = siteContent[key];
            }
        });
        
        const urlInput = document.getElementById('edit-aboutPhotoUrl');
        if (urlInput && siteContent.aboutPhoto) {
            urlInput.value = siteContent.aboutPhoto.startsWith('data:') ? '' : siteContent.aboutPhoto;
        }
    }

    if (contentForm) {
        contentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const keys = [
                'heroTitle1', 'heroSubtitle1',
                'heroTitle2', 'heroSubtitle2',
                'heroTitle3', 'heroSubtitle3',
                'aboutHeading', 'aboutSubtitle', 'aboutStory1', 'aboutStory2'
            ];
            
            keys.forEach(key => {
                const input = document.getElementById(`edit-${key}`);
                if (input) {
                    siteContent[key] = input.value.trim();
                }
            });
            
            const saveAndRender = () => {
                saveContentToServer().then(() => {
                    alert('Website content successfully updated and saved to server!');
                    applyContentToDOM();
                });
            };
            
            const checkedSource = document.querySelector('input[name="about-photo-source"]:checked');
            const photoSource = checkedSource ? checkedSource.value : 'file';
            
            if (photoSource === 'url') {
                const urlInput = document.getElementById('edit-aboutPhotoUrl');
                const url = urlInput ? urlInput.value.trim() : '';
                if (url) {
                    siteContent.aboutPhoto = url;
                }
                saveAndRender();
            } else {
                const fileInput = document.getElementById('edit-aboutPhotoFile');
                if (fileInput && fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        siteContent.aboutPhoto = event.target.result;
                        saveAndRender();
                    };
                    reader.readAsDataURL(file);
                } else {
                    saveAndRender();
                }
            }
        });
    }

    // Check if query parameter requests admin view
    if (window.location.search.includes('admin=true')) {
        if (adminOverlay) {
            adminOverlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            initAdminOverlayView();
        }
    }

    // Simple HTML escaping helper for security
    function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    // Check if on membership page during init to trigger initial render
    if (document.getElementById('dynamic-pricing-grid')) {
        renderPricingPlans();
    }

});
