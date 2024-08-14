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

// Example usage:
const markdownContent = `
abcs
---
title: My Blog Posts  
description: A collection of my blog posts on various topics.  
author: John Doe 
date: 2024-09-13  
tags:  
  - programming
  - javascript
blogs:  
  - blog1
  - blog2
  - another-post
imageurl: "https://cdn.example.net/banner.jpg"
relativeurl: "./images/banner.jpg"
---
# My Blog Post
Content goes here...
`;

//const frontMatter = extractFrontMatter(markdownContent);
//const MdPath = 'index.md'
//async function getFrontmatter(MdPath) {
//    const response = await fetch(MdPath);
//    const data = await response.text();
//    const frontMatter = extractFrontMatter(data);
//    console.log(frontMatter);
//}

//getFrontmatter(MdPath);


