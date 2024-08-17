const websiteForm = document.getElementById('websiteForm');
const progressBar = document.getElementById('progress-bar');
const progressBarElement = progressBar.querySelector('.progress-bar');
const createWebsiteButton = document.getElementById('createWebsiteButton');
const downloadButton = document.getElementById('downloadButton');
const iframe = document.getElementById('myIframe');
let websiteContent = null;

websiteForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    createWebsiteButton.disabled = true;
    progressBar.style.display = 'block';

    const formData = new FormData(websiteForm);
    const websiteTitle = formData.get('websiteTitle');
    const introduction = formData.get('intro');
    const profilePicture = formData.get('profilePicture');

    const filePaths = [
        "index.html",
        "style.css",
        ".nojekyll",
        "Blogs/index.html",
        "Blogs/index.js",
        "Blogs/index.md",
        "Blogs/markdownuseguide.md",
        "Blogs/sample-blog.md",
        "Blogs/loremipsum.md",
        "About/index.html",
        "About/index.md"
    ];

    try {
        
        websiteContent = await createWebsite(websiteTitle, introduction, profilePicture, filePaths);

        // Update progress bar and display message
        progressBarElement.style.width = '100%';
        progressBarElement.setAttribute('aria-valuenow', 100);
        progressBar.style.display = 'none';
        const messageElement = document.createElement('p');
        messageElement.textContent = 'Your website is ready to download!';

        downloadButton.parentElement.appendChild(messageElement);
        downloadButton.disabled = false;

        fetchAndRender('./SampleTheme/index.html', './SampleTheme/style.css', websiteTitle, introduction, profilePicture );

    } catch (error) {
        console.error('Error:', error);
        // Handle error, e.g., display an error message to the user
        createWebsiteButton.disabled = false;
        progressBar.style.display = 'none';
    }
});

function fetchAndRender(htmlPath, cssPath, websiteTitle, introduction, profilePicture) {
  
  const photoURL = URL.createObjectURL(profilePicture);
  const data = { websiteTitle, introduction };
   
  
  Promise.all([
    fetch(htmlPath),
    fetch(cssPath)
  ])
  .then(([htmlResponse, cssResponse]) => Promise.all([htmlResponse.text(), cssResponse.text()]))
  .then(([htmlContent, cssContent]) => {
    // Encode CSS to Base64
    const base64Css = btoa(cssContent);

    // Inject Base64 encoded CSS into HTML
    const styleTag = `<link rel="stylesheet" href="data:text/css;base64,${base64Css}">`;
    htmlContent = htmlContent.replace(/<head>/i, `<head>${styleTag}`);
    htmlContent = htmlContent.replace('./Images/profile.jpg', photoURL);
    const modifiedContent = Mustache.render(htmlContent, data);

    // Render HTML within iframe
    iframe.srcdoc = modifiedContent;
  })
  .catch(error => {
    console.error('Error fetching or processing content:', error);
  });
}



downloadButton.addEventListener('click', () => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(websiteContent);
    link.download = 'MyWebsite.zip';
    link.click();
});

async function createWebsite(websiteTitle, introduction, profilePicture, filePaths) {
    const zip = new JSZip();
    const mainDir = zip.folder("MyWebsite");
    const imagesDir = mainDir.folder("Images");
  
    await addProfilePicture(imagesDir, profilePicture);
    await processFiles(mainDir, filePaths, websiteTitle, introduction);
  
    const content = await zip.generateAsync({ type: "blob" });
    return content;
  }
  
  async function addProfilePicture(imagesDir, profilePicture) {
    imagesDir.file("profile.jpg", await profilePicture.arrayBuffer());
  }
  
  async function processFiles(mainDir, filePaths, websiteTitle, introduction) {
    for (const filePath of filePaths) {
      const { dirPath, fileName } = parseFilePath(filePath);
      const targetDir = createDirectoryStructure(mainDir, dirPath);
      const absoluteFilePath = `./SampleTheme/${filePath}`;
      const fileRawContent = await fetch(absoluteFilePath);
  
      if (fileName.endsWith('.html')) {
        const text = await fileRawContent.text();
        const modifiedContent = await processHtml(text, websiteTitle, introduction);
        targetDir.file(fileName, modifiedContent);
      } else {
        const fileContent = await fileRawContent.arrayBuffer();
        targetDir.file(fileName, fileContent);
      }
    }
  }
  
  function parseFilePath(filePath) {
    const parts = filePath.split('/');
    const fileName = parts.pop();
    const dirPath = parts.join('/');
    return { dirPath, fileName };
  }
  
  
  async function processHtml(htmlContent, websiteTitle, introduction) {
    const data = { websiteTitle, introduction };
    const modifiedContent = Mustache.render(htmlContent, data);
    return modifiedContent;
  }
  
  function createDirectoryStructure(mainDir, dirPath) {
    const parts = dirPath.split('/');
    let currentDir = mainDir;
  
    for (const part of parts) {
      currentDir = currentDir.folder(part);
    }
  
    return currentDir;
  }
   
