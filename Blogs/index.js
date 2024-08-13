const blogContainer = document.getElementById("blog-list");
const tagContainer = document.getElementById("tag-list");
const md = window.markdownit();
let blogByTags = {};

function renderBlogPosts(blogPosts) {
    blogContainer.innerHTML = "";
    blogPosts.forEach((blog) => {
        const blogCard = document.createElement("div");
        blogCard.classList.add("card", "mb-3");
        blogCard.innerHTML = `
        <div class="card-body">
          <h5 class="card-title">${blog.title}</h5>
          <p class="card-text">${blog.description}</p>
          <p class="card-text">Tags: ${blog.tags.join(', ')}</p>
          <a href="#" class="card-link">Read More</a>
        </div>
      `;
        blogContainer.appendChild(blogCard);
    });
}

// Function to render tags
function renderTags() {
    tagContainer.innerHTML = "";
    const allTags = Object.keys(blogByTags);
    allTags.forEach((tag) => {
        const tagLink = document.createElement("a");
        tagLink.href = `./?tag=${tag}`;
        tagLink.textContent = tag;
        tagLink.classList.add("btn", "btn-outline-primary", "me-2");
        tagContainer.appendChild(tagLink);
    });
}

// Function to handle tag clicks
function handleTagClick(event) {
    const tag = event.target.textContent;
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set("tag", tag);
    window.history.pushState({}, "", `./?tag=${tag}`);
    const filteredBlogs = blogByTags[tag] || [];
    renderBlogPosts(filteredBlogs);
}

// Main function to orchestrate the process
async function main() {
    try {
        blogByTags = await getBlogByTags("index.md");

        console.log(blogByTags); // Output: Object with tags as keys and blog metadata arrays as values
        tagContainer.addEventListener("click", handleTagClick);

        // Render initial blog posts (all blogs)
        renderBlogPosts(blogByTags.All);
        renderTags();

        // Handle URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const tag = urlParams.get("tag");
        if (tag) {
            const filteredBlogs = blogByTags[tag] || [];
            renderBlogPosts(filteredBlogs);
        }
        // ... further logic using blogByTags
    } catch (error) {
        console.error("Error in main function:", error);
    }
}

main();
