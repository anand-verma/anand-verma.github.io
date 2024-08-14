const blogContainer = document.getElementById("blog-list");
const tagContainer = document.getElementById("tag-list");
const tagDropdown = document.getElementById("tag-dropdown");
const md = window.markdownit();
let blogByTags = {};

// Function to render blog posts
function renderBlogPosts(blogPosts) {
    blogContainer.innerHTML = "";
    if (blogPosts.length === 0) {
        blogContainer.innerHTML = `<p>No blogs found for this tag.</p>`;
        return;
    }
    blogPosts.forEach((blog) => {
        const blogCard = document.createElement("div");
        blogCard.classList.add("card", "mb-3");
        blogCard.style.margin = "10px 0";

        const imageSection = blog.imageUrl ? `<img src="${blog.imageUrl}" class="card-img-top">` : '';
        blogCard.innerHTML = `
            ${imageSection}
            <div class="card-body">
                <a href="./?page=${blog.fileName}" class="card-title h2">${blog.title}</a>
                <p class="card-text">${blog.description}</p>
                <p class="card-text">Tags: ${blog.tags.join(', ')}</p>
            </div>
        `;
        blogContainer.appendChild(blogCard);
    });
}

// Function to render tags
function renderTags() {
    tagContainer.innerHTML = "";
    tagDropdown.innerHTML = `<option value="All">All</option>`;

    const allTags = Object.keys(blogByTags).sort();

    // Ensure 'All' tag is always on top
    if (allTags.includes("All")) {
        allTags.splice(allTags.indexOf("All"), 1);
        allTags.unshift("All");
    }

    allTags.forEach((tag) => {
        const tagLink = document.createElement("a");
        tagLink.href = `./?tag=${tag}`;
        tagLink.textContent = `${tag} (${blogByTags[tag].length})`;
        tagLink.classList.add("btn", "btn-outline-primary", "w-100", "mb-2");
        tagLink.addEventListener("click", handleTagClick);
        tagContainer.appendChild(tagLink);

        const dropdownOption = document.createElement("option");
        dropdownOption.value = tag;
        dropdownOption.textContent = `${tag} (${blogByTags[tag].length})`;
        tagDropdown.appendChild(dropdownOption);
    });

    tagDropdown.addEventListener("change", (event) => {
        const selectedTag = event.target.value.split(' ')[0];
        handleTagDropdownChange(selectedTag);
    });
}

// Function to handle tag clicks
function handleTagClick(event) {
    event.preventDefault();
    const tag = event.target.textContent.split(' ')[0];
    updateTagSelection(tag);
}

// Function to handle tag dropdown change
function handleTagDropdownChange(tag) {
    updateTagSelection(tag);
}

// Function to update tag selection and URL
function updateTagSelection(tag) {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set("tag", tag);
    window.history.pushState({}, "", `./?tag=${tag}`);
    const filteredBlogs = blogByTags[tag] || [];
    renderBlogPosts(filteredBlogs);
}

// Function to handle blog clicks
function handleBlogClick(event) {
    event.preventDefault();
    const blogFile = event.target.getAttribute('href').split('=')[1];
    window.history.pushState({}, "", `./?page=${blogFile}`);
    fetchAndRenderBlog(blogFile);
}

// Function to fetch and render the blog content
function fetchAndRenderBlog(blogFile) {
    fetch(blogFile)
        .then(response => response.text())
        .then(data => {
            const parsedContent = md.render(data.replace(/---([\s\S]+?)---/, ''));
            blogContainer.innerHTML = `<div class="blog-card p-3">${parsedContent}</div>`;
            document.getElementById("body-header").innerHTML = '';
        })
        .catch(error => console.error('Error fetching blog file:', error));
}

// Function to handle popstate event (back/forward button)
function handlePopState(event) {
    const urlParams = new URLSearchParams(window.location.search);
    const tag = urlParams.get("tag");
    const page = urlParams.get("page");

    if (page) {
        fetchAndRenderBlog(page);
    } else if (tag && blogByTags[tag]) {
        renderBlogPosts(blogByTags[tag]);
    } else {
        renderBlogPosts(blogByTags.All);
    }
}

// Main function to orchestrate the process
async function main() {
    try {
        blogByTags = await getBlogByTags("blogindex.md");
        renderTags();

        // Handle initial rendering based on URL parameters
        handlePopState();

        // Handle clicks on blog titles
        blogContainer.addEventListener("click", (event) => {
            if (event.target.tagName === 'A') {
                handleBlogClick(event);
            }
        });

        // Listen for popstate events (back/forward navigation)
        window.addEventListener('popstate', handlePopState);

    } catch (error) {
        console.error("Error in main function:", error);
    }
}

main();
