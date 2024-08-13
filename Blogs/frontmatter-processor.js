

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
  result['imageurl'] = frontData.imageurl ? frontData.imageurl : '';
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


