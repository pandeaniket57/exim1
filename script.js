/**
 * CONFIGURATION
 * Replace with your actual Blogger credentials.
 */
const CONFIG = {
    apiKey: 'AIzaSyD03Dnav03Nc3IHx2nLeKIWGxVqiV56EAI', 
    blogId: '5524582742200010737',
    whatsappNumber: '917447560011'
};

const postCache = {}; // Cache to store post data for modal

// --- Mobile Menu Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.nav-links');

    if(toggle) {
        toggle.addEventListener('click', () => {
            nav.classList.toggle('active');
        });
    }
});

/**
 * CORE FUNCTION: Fetch Data from Blogger
 * @param {string} label - The Blogger label to filter by (e.g., "Products", "News")
 * @param {string} containerId - The HTML ID where cards should be injected
 * @param {number} maxResults - How many items to show
 * @param {boolean} isBlog - Whether this is a blog section (hides Quote button)
 */
async function loadBloggerContent(label, containerId, maxResults = 6, isBlog = false) {
    const container = document.getElementById(containerId);
    if (!container) return; // Exit if container doesn't exist on this page

    container.innerHTML = '<p>Loading content...</p>';

    const url = `https://www.googleapis.com/blogger/v3/blogs/${CONFIG.blogId}/posts?labels=${label}&key=${CONFIG.apiKey}&fetchBodies=true&maxResults=${maxResults}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            // If API Key or Blog ID is wrong, show the actual error from Google
            throw new Error(data.error ? data.error.message : response.statusText);
        }

        container.innerHTML = ''; // Clear loading message

        if (!data.items || data.items.length === 0) {
            container.innerHTML = `<p style="text-align:center; width:100%;">No posts found with label "<strong>${label}</strong>".<br>Please go to Blogger and add the label <strong>${label}</strong> to your posts (Case Sensitive).</p>`;
            return;
        }

        data.items.forEach(post => {
            post.isBlog = isBlog; // Store flag for modal logic
            postCache[post.id] = post; // Store post in cache
            const card = createCardHTML(post, isBlog);
            container.insertAdjacentHTML('beforeend', card);
        });

        // Observe newly added cards for animation
        if (window.globalObserver) {
            const cards = container.querySelectorAll('.card');
            cards.forEach(card => window.globalObserver.observe(card));
        }

    } catch (error) {
        console.error('Fetch Error:', error);
        container.innerHTML = `<p style="color:red; text-align:center;">System Error: ${error.message}</p>`;
    }
}

/**
 * Helper: Generate HTML for a single card
 */
function createCardHTML(post, isBlog) {
    // Extract image
    let imgUrl = 'https://via.placeholder.com/400x250?text=Pande+EXIM';
    if (post.images && post.images.length > 0) {
        imgUrl = post.images[0].url;
    } else {
        // Fallback: regex to find img src in content
        const imgMatch = post.content.match(/<img[^>]+src="([^">]+)"/);
        if (imgMatch) imgUrl = imgMatch[1];
    }

    // Extract H1 tag from content to use as title
    let displayTitle = post.title;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = post.content;
    const h1Tag = tempDiv.querySelector('h1');
    if (h1Tag) {
        displayTitle = h1Tag.textContent || h1Tag.innerText;
    }

    // WhatsApp Link for "Get Quote"
    const message = encodeURIComponent(`Hi, I am interested in ${post.title}`);
    const whatsappUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${message}`;

    let buttonsHTML = '';
    if (isBlog) {
        buttonsHTML = `<button onclick="openModal('${post.id}')" class="card-btn outline" style="background:none; cursor:pointer; font-family:inherit; font-size:0.9rem;">Read More</button>`;
    } else {
        buttonsHTML = `<button onclick="openModal('${post.id}')" class="card-btn outline" style="background:none; cursor:pointer; font-family:inherit; font-size:0.9rem;">Details</button>
                       <a href="${whatsappUrl}" target="_blank" class="card-btn fill">Get Quote</a>`;
    }

    return `
        <article class="card reveal">
            <img src="${imgUrl}" alt="${displayTitle}" class="card-img" loading="lazy" onclick="openModal('${post.id}')" style="cursor:pointer;">
            <div class="card-body">
                <h3 class="card-title" style="text-align:center;">${displayTitle}</h3>
                <div class="card-actions">
                </div>
                    ${buttonsHTML}
                </div>
            </div>
        </article>
    `;
}

// --- Modal Logic ---
function injectModal() {
    const modalHTML = `
        <div id="postModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="modalTitle" class="modal-title"></h2>
                    <span class="close-modal">&times;</span>
                </div>
                <div id="modalBody" class="modal-body"></div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById('postModal');
    const span = document.querySelector('.close-modal');

    if (span) {
        span.onclick = function() {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
}

function openModal(postId) {
    const post = postCache[postId];
    if (!post) return;

    document.getElementById('modalTitle').innerText = post.title;
    
    let contentHTML = post.content;
    
    // Add Quote button to modal
    const message = encodeURIComponent(`Hi, I am interested in ${post.title}`);
    const whatsappUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${message}`;
    const btnHtml = `<div style="margin-top:20px; text-align:center;"><a href="${whatsappUrl}" target="_blank" style="display:inline-block; background:#25D366; color:white; padding:10px 20px; text-decoration:none; border-radius:5px; font-weight:bold;">Get Quote</a></div>`;
    contentHTML += btnHtml;
    
    document.getElementById('modalBody').innerHTML = contentHTML;
    
    const modal = document.getElementById('postModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

/**
 * Initialize Scroll Animations
 */
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, { threshold: 0.1 });

    window.globalObserver = observer;

    // Target static elements
    document.querySelectorAll('.hero, .section-title, .contact-wrapper, .map-container, .card').forEach(el => {
        el.classList.add('reveal');
        observer.observe(el);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    injectModal();
    initScrollAnimations();
});

/**
 * Search Functionality
 */
function initSearch(inputId, containerId) {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.addEventListener('input', function() {
        const filter = this.value.toLowerCase();
        const container = document.getElementById(containerId);
        const cards = container.getElementsByClassName('card');

        Array.from(cards).forEach(card => {
            const title = card.querySelector('.card-title').textContent || card.querySelector('.card-title').innerText;
            if (title.toLowerCase().indexOf(filter) > -1) {
                card.style.display = "";
            } else {
                card.style.display = "none";
            }
        });
    });
}
