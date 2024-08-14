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
                <a href="./index.html?page=${blog.fileName}" class="card-title h2">${blog.title}</a>
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
        tagLink.href = `./index.html?tag=${tag}`;
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
    window.history.pushState({}, "", `./index.html?tag=${tag}`);
    const filteredBlogs = blogByTags[tag] || [];
    renderBlogPosts(filteredBlogs);
}

// Function to handle blog clicks
function handleBlogClick(event) {
    event.preventDefault();
    const blogFile = event.target.getAttribute('href').split('=')[1];
    window.history.pushState({}, "", `./index.html?page=${blogFile}`);
    fetchAndRenderBlog(blogFile);
}

// Function to fetch and render the blog content
function fetchAndRenderBlog(blogFile) {
    fetch(blogFile)
        .then(response => response.text())
        .then(data => {
            const parsedContent = md.render(data.replace(/---([\s\S]+?)---/, ''));
            blogContainer.innerHTML = `<div class="blog-card">${parsedContent}</div>`;
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
        blogByTags = await getBlogByTags("./index.md");
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
// Function to fetch blog data from index.md
async function fetchIndexData(indexMdPath) {
    try {
      const response = await fetch(indexMdPath);
      const data = await response.text();
      const frontMatter = extractFrontMatter(data);
  
      return frontMatter.blogs;
    } catch (error) {
      console.error('Error fetching index data:', error);
      return [];
    }
  }
  
  async function populateBlogByTags(blogFiles) {
    const blogByTags = {};
    for (const file of blogFiles) {
      try {
        const rawData = await fetchBlogPostData(file);
  
        // Add blog data to blogByTags object based on tags
        const { tags } = rawData;
        for (const tag of tags) {
          if (!blogByTags[tag]) {
            blogByTags[tag] = [];
          }
          blogByTags[tag].push(rawData);
        }
  
        // Add to 'All' tag
        if (!blogByTags['All']) {
          blogByTags['All'] = [];
        }
        blogByTags['All'].push(rawData);
      } catch (error) {
        console.error('Failed to load file:', error);
      }
    }
    return blogByTags;
  }
  
  // Function to fetch blog post data
  async function fetchBlogPostData(filename) {
    try {
      const response = await fetch(filename);
      const data = await response.text();
      const frontData = extractFrontMatter(data);
      const postData = parseFrontMatterData(filename, frontData);
      return postData;
    } catch (error) {
      console.error('Error fetching blog post data:', error);
    }
  }
  
  function parseFrontMatterData(filename, frontData) {
    const result = {};
    result['fileName'] = filename;
    result['title'] = frontData.title ? frontData.title : filename.split('.')[0];
    result['description'] = frontData.description ? frontData.description : '';
    result['imageUrl'] = frontData.imageurl ? frontData.imageurl : '';
    result['date'] = frontData.date ? frontData.date : 'Undated';
    result['tags'] = frontData.tags ? frontData.tags : ['Uncategorised'];
  
    return result;
  }
  
  // Main function to orchestrate the process
  async function getBlogByTags(indexMdPath) {
    try {
      const blogFiles = await fetchIndexData(indexMdPath);
      const blogByTags = await populateBlogByTags(blogFiles);
  
      return blogByTags;
      
    } catch (error) {
      console.error('Error in getBlogByTags function:', error);
    }
  }


//-----------------------------------------------------------------------------------------------------

function extractFrontMatter(mdContent) {
    const frontMatterRegex = /^---([\s\S]*?)---/m;
    const match = mdContent.match(frontMatterRegex);
    
    const frontMatter = {};
    if (!match) {
        return frontMatter; // Return null if no front matter is found
    }
   
    const frontMatterContent = match[1].trim();
    const frontMatterLines = frontMatterContent.split('\n');
    
    
    let currentKey = null;
    for (let line of frontMatterLines) {
        line = line.split('#')[0];
        line = line.trim();
        
        if (line.startsWith('- ')) {
            frontMatter[currentKey] = frontMatter[currentKey] || [];
            frontMatter[currentKey].push(line.slice(2).trim());
            
        } else if (line.includes(':')) {
            const [key, value] = line.split(/:(.*)/);
            currentKey = key.trim();
            frontMatter[currentKey] = value ? value.trim() : '';
        }
    }
    //console.log(match);
    return frontMatter; // Return the front matter as a plain JavaScript object
}