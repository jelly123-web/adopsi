const fs = require('fs');
let css = fs.readFileSync('frontend/src/App.css', 'utf8');

// Split by lines
const lines = css.split(/\r?\n/);

// Find the broken .sidebar block start around line 773
let sidebarStart = -1;
let sidebarEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === '.sidebar {') {
    // Check if it's followed by broken content (background: transparent)
    if (i + 5 < lines.length && lines[i+5] && lines[i+5].includes('background: transparent')) {
      sidebarStart = i;
    }
  }
  if (sidebarStart !== -1 && i > sidebarStart && lines[i].trim() === '}') {
    sidebarEnd = i;
    break;
  }
}

console.log('Sidebar block found at lines:', sidebarStart, 'to', sidebarEnd);

if (sidebarStart !== -1 && sidebarEnd !== -1) {
  const replacement = [
    '.sidebar {',
    '  width: 260px;',
    '  background: var(--white);',
    '  border-right: 1px solid var(--border);',
    '  display: flex;',
    '  flex-direction: column;',
    '  position: fixed;',
    '  top: 0;',
    '  left: 0;',
    '  height: 100vh;',
    '  z-index: 90;',
    '  transition: transform 0.3s ease;',
    '  overflow: hidden;',
    '}',
    '',
    '.sidebar.closed {',
    '  transform: translateX(-100%);',
    '}',
    '',
    '.sidebar-brand {',
    '  padding: 20px 22px;',
    '  border-bottom: 1px solid var(--border);',
    '  display: flex;',
    '  align-items: center;',
    '  gap: 8px;',
    '  justify-content: flex-start;',
    '}'
  ];
  lines.splice(sidebarStart, sidebarEnd - sidebarStart + 1, ...replacement);
  console.log('Fixed sidebar block!');
}

// Remove broken duplicate .sidebar-toggle block
const fixedCss = lines.join('\n');
const cleaned = fixedCss.replace(/\.sidebar-toggle \{isplay:[^\}]*\}/g, '');
if (cleaned !== fixedCss) console.log('Removed broken sidebar-toggle duplicate!');

fs.writeFileSync('frontend/src/App.css', cleaned);
console.log('Done! File size:', cleaned.length);
