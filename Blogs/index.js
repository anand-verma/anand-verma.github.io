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
                <p><a href="./index.html?page=${blog.fileName}" class="card-title h2 blog-link">${blog.title}</a></p>
                
                <p class="card-text">${blog.description}</p>

                <p class="card-text">Tags: ${blog.tags.join(', ')}</p>
            </div>
        `;
        blogContainer.appendChild(blogCard);
    });

    // Attach blog click handler specifically to blog links
    document.querySelectorAll(".blog-link").forEach(link => {
        link.addEventListener("click", handleBlogClick);
    });

    // Attach tag click handler specifically to tag links
    document.querySelectorAll(".tag-link").forEach(link => {
        link.addEventListener("click", handleTagClick);
    });
}

// Function to handle tag clicks
function handleTagClick(event) {
    event.preventDefault();
    const urlFriendlyTag = event.target.getAttribute('href').split('=')[1];
    const tag = urlFriendlyTag.replace(/-/g, ' '); // Convert hyphens back to spaces
    updateTagSelection(tag);
}

// Function to handle blog clicks
function handleBlogClick(event) {
    event.preventDefault();
    const blogFile = event.target.getAttribute('href').split('=')[1];
    window.history.pushState({}, "", `./index.html?page=${blogFile}`);
    fetchAndRenderBlog(blogFile);
}

function updateBlogHeader(tag){
    if (tag == "" || tag=="All"){
        document.getElementById("body-header").innerHTML = `
            <h2 class="text-center mb-4">Perspectives from My Lens</h2>
            <hr>
        `
    }
    else {
        document.getElementById("body-header").innerHTML = `
            <h2 class="text-center mb-4">Perspectives from My Lens: ${tag}</h2>
            <hr>
        `;
    }
}

// Function to update tag selection and URL
function updateTagSelection(tag) {
    const urlFriendlyTag = tag.replace(/\s+/g, '-'); // Convert spaces to hyphens for URL
    window.history.pushState({}, "", `./index.html?tag=${urlFriendlyTag}`);
    const filteredBlogs = blogByTags[tag] || [];
    updateBlogHeader(tag);
    renderBlogPosts(filteredBlogs);
}

// Function to fetch and render the blog content
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

// Function to handle popstate event (back/forward button)
function handlePopState(event) {
    const urlParams = new URLSearchParams(window.location.search);
    const urlFriendlyTag = urlParams.get("tag");
    const page = urlParams.get("page");

    if (page) {
        fetchAndRenderBlog(page);
    } else if (urlFriendlyTag) {
        const tag = urlFriendlyTag.replace(/-/g, ' '); // Convert hyphens back to spaces
        updateBlogHeader(tag);
        renderBlogPosts(blogByTags[tag] || []);
    } else {
        updateBlogHeader("");
        renderBlogPosts(blogByTags.All);
    }
}

// Function to render tags
function renderTags() {
    tagContainer.innerHTML = "";
    tagDropdown.innerHTML = `<option value="All">Select Tag</option>`;

    const allTags = Object.keys(blogByTags).sort();

    // Ensure 'All' tag is always on top
    if (allTags.includes("All")) {
        allTags.splice(allTags.indexOf("All"), 1);
        allTags.unshift("All");
    }

    allTags.forEach((tag) => {
        const urlFriendlyTag = tag.replace(/\s+/g, '-'); // Convert spaces to hyphens for URL

        // Tag Links
        const tagLink = document.createElement("a");
        tagLink.href = `./index.html?tag=${urlFriendlyTag}`;
        tagLink.textContent = `${tag} (${blogByTags[tag].length})`;
        tagLink.classList.add("btn", "btn-outline-primary", "w-100", "mb-2");
        tagLink.addEventListener("click", handleTagClick);
        tagContainer.appendChild(tagLink);

        // Dropdown options
        const dropdownOption = document.createElement("option");
        dropdownOption.value = urlFriendlyTag;
        dropdownOption.textContent = `${tag} (${blogByTags[tag].length})`;
        tagDropdown.appendChild(dropdownOption);
    });

    tagDropdown.addEventListener("change", (event) => {
        const selectedTag = event.target.value.split(' ')[0];
        handleTagDropdownChange(selectedTag);
    });
}

// Function to handle tag dropdown change
function handleTagDropdownChange(urlFriendlyTag) {
    const tag = urlFriendlyTag.replace(/-/g, ' '); // Convert hyphens back to spaces
    updateTagSelection(tag);
}

// Main function to orchestrate the process
async function main() {
    try {
        blogByTags = await getBlogByTags("./index.json");
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

//-----------------------------------------------------------------------------------------------------

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

// Populate blogByTags from blog files in index.json
async function populateBlogByTags(blogFiles) {
    const blogByTags = {};
    for (const blog of blogFiles) {
        const { tags } = blog;
        for (const tag of tags) {
            if (!blogByTags[tag]) {
                blogByTags[tag] = [];
            }
            blogByTags[tag].push(blog);
        }

        // Add to 'All' tag
        if (!blogByTags['All']) {
            blogByTags['All'] = [];
        }
        blogByTags['All'].push(blog);
    }
    return blogByTags;
}

// Main function to orchestrate the process of fetching blog by tags from index.json
async function getBlogByTags(indexJsonPath) {
    try {
        const blogFiles = await fetchIndexData(indexJsonPath);
        const blogByTags = await populateBlogByTags(blogFiles);
        return blogByTags;
    } catch (error) {
        console.error('Error in getBlogByTags function:', error);
    }
}
