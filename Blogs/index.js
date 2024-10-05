const blogContainer = document.getElementById("blog-list");
const tagContainer = document.getElementById("tag-list");
const tagDropdown = document.getElementById("tag-dropdown");
const md = window.markdownit();
let blogByTags = {};

// Function to create blog card
function createBlogCard(blog) {
    const blogCard = document.createElement("div");
    blogCard.classList.add("card", "mb-3");
    blogCard.style.margin = "10px 0";
    
    const imageSection = blog.imageUrl ? `<img src="${blog.imageUrl}" class="card-img-top">` : '';
    blogCard.innerHTML = `
        ${imageSection}
        <div class="card-body">
            <p><a href="./index.html?page=${blog.fileName}" class="card-title h2 blog-link">${blog.title}</a></p>
            <p class="card-text">${blog.description}</p>
            <h6 class="card-text">Tags: ${blog.tags.map(tag => `<a href="./index.html?tag=${tag.replace(/\s+/g, '-')}" class="tag-link">${tag}</a>`).join(', ')}</h6>
        </div>
    `;
    return blogCard;
}

// Render blog posts
function renderBlogPosts(blogPosts) {
    blogContainer.innerHTML = "";
    if (blogPosts.length === 0) {
        blogContainer.innerHTML = `<p>No blogs found for this tag.</p>`;
        return;
    }
    blogPosts.forEach((blog) => {
        const blogCard = createBlogCard(blog);
        blogContainer.appendChild(blogCard);
    });
}

// Fetch and render blog content
function fetchAndRenderBlog(blogFile) {
    fetch(blogFile)
        .then(response => response.text())
        .then(data => {
            const parsedContent = md.render(data.replace(/---([\s\S]+?)---/, ''));
            blogContainer.innerHTML = `<div class="blog-card">${parsedContent}</div>`;
            document.getElementById("body-header").innerHTML = '';
            renderTags(); // Re-render tags after fetching a blog
        })
        .catch(error => console.error('Error fetching blog file:', error));
}

// Handle tag selection and update URL
function handleTagClick(event) {
    event.preventDefault();
    const tag = event.target.textContent;
    updateTagSelection(tag);
}

// Handle blog click and navigation
function handleBlogClick(event) {
    event.preventDefault();
    const blogFile = event.target.getAttribute('href').split('=')[1];
    window.history.pushState({ page: blogFile }, "", `./index.html?page=${blogFile}`);
    fetchAndRenderBlog(blogFile);
}

// Update header based on tag selection
function updateBlogHeader(tag) {
    const headerText = tag === "All" || tag === "" ? "Perspectives through My Lens" : `${tag} through My Lens`;
    document.getElementById("body-header").innerHTML = `
        <h3 class="text-center mb-4">${headerText}</h3>
        <hr>
    `;
}

// Update tag selection and blog posts
function updateTagSelection(tag) {
    const urlFriendlyTag = tag.replace(/\s+/g, '-');
    window.history.pushState({ tag }, "", `./index.html?tag=${urlFriendlyTag}`);
    const filteredBlogs = blogByTags[tag] || [];
    updateBlogHeader(tag);
    renderBlogPosts(filteredBlogs);
}

// Handle back/forward navigation
function handlePopState(event) {
    const urlParams = new URLSearchParams(window.location.search);
    const tag = urlParams.get("tag")?.replace(/-/g, ' ') || "All";
    const page = urlParams.get("page");

    if (page) {
        fetchAndRenderBlog(page);
    } else {
        updateTagSelection(tag);
    }
}

// Render tags as clickable links
function renderTags() {
    tagContainer.innerHTML = "";
    tagDropdown.innerHTML = `<option value="All">Select Tag</option>`;

    const allTags = Object.keys(blogByTags).sort();

    // Ensure 'All' tag is on top
    if (allTags.includes("All")) {
        allTags.splice(allTags.indexOf("All"), 1);
        allTags.unshift("All");
    }

    allTags.forEach((tag) => {
        const urlFriendlyTag = tag.replace(/\s+/g, '-');

        // Tag links
        const tagLink = document.createElement("a");
        tagLink.href = `./index.html?tag=${urlFriendlyTag}`;
        tagLink.textContent = `${tag} (${blogByTags[tag].length})`;
        tagLink.classList.add("btn", "btn-outline-primary", "w-100", "mb-2");
        tagContainer.appendChild(tagLink);

        // Dropdown options
        const dropdownOption = document.createElement("option");
        dropdownOption.value = urlFriendlyTag;
        dropdownOption.textContent = `${tag} (${blogByTags[tag].length})`;
        tagDropdown.appendChild(dropdownOption);
    });

    tagDropdown.addEventListener("change", (event) => {
        const selectedTag = event.target.value.split(' ')[0];
        updateTagSelection(selectedTag.replace(/-/g, ' '));
    });
}

// Initialize and orchestrate the process
async function main() {
    try {
        blogByTags = await getBlogByTags("./index.json");
        renderTags();

        // Handle initial rendering based on URL parameters
        handlePopState();

        // Listen for popstate events (back/forward navigation)
        window.addEventListener('popstate', handlePopState);
    } catch (error) {
        console.error("Error in main function:", error);
    }
}

main();

// Fetch blog data from index.json
async function fetchIndexData(indexJsonPath) {
    try {
        const response = await fetch(indexJsonPath);
        const data = await response.json();
        return data.blogs;
    } catch (error) {
        console.error('Error fetching index data:', error);
        return [];
    }
}

// Populate blogByTags from index.json
async function populateBlogByTags(blogFiles) {
    const blogByTags = {};
    blogFiles.forEach((blog) => {
        blog.tags.forEach((tag) => {
            if (!blogByTags[tag]) blogByTags[tag] = [];
            blogByTags[tag].push(blog);
        });

        if (!blogByTags['All']) blogByTags['All'] = [];
        blogByTags['All'].push(blog);
    });
    return blogByTags;
}

// Fetch and organize blogs by tags
async function getBlogByTags(indexJsonPath) {
    const blogFiles = await fetchIndexData(indexJsonPath);
    return populateBlogByTags(blogFiles);
}
