// Blog functionality JavaScript

class BlogManager {
    constructor() {
        this.posts = [];
        this.filteredPosts = [];
        this.currentTags = new Set();
        this.searchTerm = '';

        this.init();
    }

    async init() {
        await this.loadBlogData();
        this.setupSearch();
        this.setupTagFiltering();
        this.setupPagination();
        this.renderPosts();
        this.updateSidebar();
    }

    
    async loadBlogData() {
        try {
            // Load blog metadata
            const response = await fetch('metadata.json');
            const data = await response.json();
            this.posts = data.posts || [];
            this.filteredPosts = [...this.posts];

            console.log('Blog data loaded:', this.posts.length, 'posts');
        } catch (error) {
            console.error('Error loading blog data:', error);
            this.handleLoadError();
        }
    }
    


    handleLoadError() {
        // Fallback data if JSON fails to load
        this.posts = [
            {
                id: 'post-1',
                title: 'Getting Started with Modern Web Development',
                excerpt: 'A comprehensive guide to modern web development practices and tools.',
                date: '2024-01-15',
                author: 'John Doe',
                tags: ['web development', 'javascript', 'frontend'],
                readTime: '8 min read',
                slug: 'getting-started-modern-web-development'
            }
        ];
        this.filteredPosts = [...this.posts];
    }

    setupSearch() {
        const searchBox = document.querySelector('.search-box');
        if (searchBox) {
            searchBox.addEventListener('input', this.debounce((e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.filterPosts();
            }, 300));
        }
    }

    setupTagFiltering() {
        // Create tag cloud
        this.createTagCloud();

        // Handle tag clicks
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('blog-tag')) {
                this.toggleTag(e.target.textContent);
            }
        });
    }

    createTagCloud() {
        const tagContainer = document.querySelector('.tag-cloud');
        if (!tagContainer) return;

        // Get all unique tags
        const allTags = new Set();
        this.posts.forEach(post => {
            post.tags.forEach(tag => allTags.add(tag));
        });

        // Create tag elements
        const tagHTML = Array.from(allTags).map(tag => 
            `<span class="blog-tag" data-tag="${tag}">${tag}</span>`
        ).join('');

        tagContainer.innerHTML = tagHTML;
    }

    toggleTag(tag) {
        if (this.currentTags.has(tag)) {
            this.currentTags.delete(tag);
        } else {
            this.currentTags.add(tag);
        }

        this.updateTagDisplay();
        this.filterPosts();
    }

    updateTagDisplay() {
        const tagElements = document.querySelectorAll('.blog-tag');
        tagElements.forEach(el => {
            if (this.currentTags.has(el.textContent)) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });
    }

    filterPosts() {
        this.filteredPosts = this.posts.filter(post => {
            // Search filter
            const matchesSearch = !this.searchTerm || 
                post.title.toLowerCase().includes(this.searchTerm) ||
                post.excerpt.toLowerCase().includes(this.searchTerm) ||
                post.tags.some(tag => tag.toLowerCase().includes(this.searchTerm));

            // Tag filter
            const matchesTags = this.currentTags.size === 0 ||
                Array.from(this.currentTags).every(tag => 
                    post.tags.includes(tag));

            return matchesSearch && matchesTags;
        });

        this.renderPosts();
        this.updateSearchResults();
    }

    renderPosts() {
        const postsContainer = document.querySelector('.blog-posts-container');
        if (!postsContainer) return;

        if (this.filteredPosts.length === 0) {
            postsContainer.innerHTML = `
                <div class="no-results">
                    <h3>No posts found</h3>
                    <p>Try adjusting your search or filters.</p>
                </div>
            `;
            return;
        }

        const postsHTML = this.filteredPosts.map(post => this.createPostCard(post)).join('');
        postsContainer.innerHTML = postsHTML;

        // Animate in the posts
        setTimeout(() => {
            const postCards = postsContainer.querySelectorAll('.blog-post-card');
            postCards.forEach((card, index) => {
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, index * 100);
            });
        }, 50);
    }

    createPostCard(post) {
        return `
            <article class="blog-post-card">
                <h2 class="blog-post-title">
                    <a href="post/?slug=${post.slug}">${post.title}</a>
                </h2>
                <div class="blog-post-meta">
                    <span class="post-date">
                        <i class="fas fa-calendar"></i>
                        ${this.formatDate(post.date)}
                    </span>
                    <span class="post-read-time">
                        <i class="fas fa-clock"></i>
                        ${post.readTime}
                    </span>
                    <span class="post-author">
                        <i class="fas fa-user"></i>
                        ${post.author}
                    </span>
                </div>
                
                <p class="blog-post-excerpt">${post.excerpt}</p>
                <div class="blog-tags">
                    ${post.tags.map(tag => `<span class="blog-tag">${tag}</span>`).join('')}
                </div>
            </article>
        `;
    }

    updateSidebar() {
        this.updateFeaturedPosts();
        this.updateTagCloud();
    }

    updateFeaturedPosts() {
        const featuredContainer = document.querySelector('.featured-posts');
        if (!featuredContainer) return;

        // Get first 3 posts as featured
        const featured = this.posts.slice(0, 3);
        const featuredHTML = featured.map(post => `
            <li>
                <a href="post/?slug=${post.slug}">
                    ${post.title}
            </li>
        `).join('');

        featuredContainer.innerHTML = featuredHTML;
    }

    updateTagCloud() {
        // Update existing tag cloud if needed
        this.createTagCloud();
    }

    updateSearchResults() {
        const resultsContainer = document.querySelector('.search-result-count');
        if (resultsContainer) {
            resultsContainer.textContent = `${this.filteredPosts.length} post(s) found`;
        }
    }

    setupPagination() {
        // Simple pagination implementation
        this.currentPage = 1;
        this.postsPerPage = 5;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize based on page type
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.blog-container')) {
        // Blog listing page
        new BlogManager();
    }
});

// Export for external use
window.BlogManager = BlogManager;
