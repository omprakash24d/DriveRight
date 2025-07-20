const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'pages');

function checkFileForHydrationIssues(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Check for common hydration issues
  const issues = [];

  // Look for non-deterministic values
  if (content.includes('Math.random()') || content.includes('Date.now()')) {
    issues.push('Non-deterministic value found (Math.random() or Date.now())');
  }

  // Check for useEffect without proper cleanup
  if (content.includes('useEffect') && !content.includes('return () =>')) {
    issues.push('useEffect without cleanup function');
  }

  // Check for conditional rendering that might differ
  if (content.includes('if (') || content.includes('return (')) {
    issues.push('Potential conditional rendering issue');
  }

  return issues;
}

function findHydrationIssues() {
  const files = fs.readdirSync(pagesDir);

  files.forEach(file => {
    const filePath = path.join(pagesDir, file);
    if (fs.statSync(filePath).isFile() && 
        (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx'))) {
      const issues = checkFileForHydrationIssues(filePath);
      if (issues.length > 0) {
        console.log(`Issues found in ${file}:`);
        issues.forEach(issue => console.log(` - ${issue}`));
      }
    }
  });
}

findHydrationIssues();
