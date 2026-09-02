// Blog content loader for Markdown files

// Load Marked.js for Markdown parsing
function loadMarkedJS() {
    return new Promise((resolve, reject) => {
        if (typeof marked !== "undefined") {
            resolve();
            return;
        }

        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Markdown loader for individual blog posts
class MarkdownLoader {
    constructor() {
        this.initializeMarked();
        this.loadPost();
    }

    async initializeMarked() {
        try {
            await loadMarkedJS();

            // Configure marked.js if available
            if (typeof marked !== "undefined") {
                marked.setOptions({
                    breaks: true,
                    gfm: true,
                });
            }
        } catch (error) {
            console.error("Error loading Marked.js:", error);
        }
    }

    async loadPost() {
        const urlParams = new URLSearchParams(window.location.search);
        const slug = urlParams.get("slug");

        if (!slug) {
            this.showError("No post specified");
            return;
        }

        try {
            // Load post metadata
            const metaResponse = await fetch("../metadata.json");
            const metadata = await metaResponse.json();
            const postMeta = metadata.posts.find((p) => p.slug === slug);

            if (!postMeta) {
                this.showError("Post not found");
                return;
            }

            // Load markdown content
            const contentResponse = await fetch(`../blogposts/${slug}.md`);
            if (!contentResponse.ok) {
                this.showError("Post content not found");
                return;
            }

            const markdownContent = await contentResponse.text();

            this.renderPost(postMeta, markdownContent);
        } catch (error) {
            console.error("Error loading post:", error);
            this.showError("Error loading post");
        }
    }

    renderPost(meta, content) {
        // Update page title
        document.title = `${meta.title} - Anand Verma Blog`;

        // Render post header
        const headerContainer = document.querySelector(".blog-post-header");
        if (headerContainer) {
            headerContainer.innerHTML = `
                <h1>${meta.title}</h1>
                <div class="blog-post-meta-header">
                    <span><i class="fas fa-calendar"></i> ${this.formatDate(meta.date)}</span>
                    <span><i class="fas fa-clock"></i> ${meta.readTime}</span>
                    <span><i class="fas fa-user"></i> ${meta.author}</span>
                </div>
            `;
        }

        // Render post content
        const contentContainer = document.querySelector(".blog-post-content");
        if (contentContainer && typeof marked !== "undefined") {
            contentContainer.innerHTML = marked.parse(content);
        } else if (contentContainer) {
            // Fallback if marked.js is not available
            contentContainer.innerHTML = `<pre>${content}</pre>`;
        }

        // Setup reading progress
        this.setupReadingProgress();
    }

    setupReadingProgress() {
        const progressBar = document.querySelector(".reading-progress");
        if (!progressBar) {
            // Create progress bar
            const bar = document.createElement("div");
            bar.className = "reading-progress";
            document.body.appendChild(bar);
        }

        window.addEventListener("scroll", () => {
            const content = document.querySelector(".blog-post-content");
            if (!content) return;

            const contentHeight = content.offsetHeight;
            const windowHeight = window.innerHeight;
            const scrolled = window.scrollY;
            const progress = (scrolled / (contentHeight - windowHeight)) * 100;

            const bar = document.querySelector(".reading-progress");
            if (bar) {
                bar.style.width = Math.min(Math.max(progress, 0), 100) + "%";
            }
        });
    }

    showError(message) {
        const container =
            document.querySelector(".blog-post-content") || document.body;
        container.innerHTML = `
            <div class="error-message">
                <h2>Error</h2>
                <p>${message}</p>
                <a href="../" class="btn btn-primary">Back to Blog</a>
            </div>
        `;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }
}


// Initialize based on page type
document.addEventListener("DOMContentLoaded", function () {
    if (document.querySelector(".blog-post-content")) {
        // Individual blog post page
        new MarkdownLoader();

    }
});

// Export for external use
window.MarkdownLoader = MarkdownLoader;