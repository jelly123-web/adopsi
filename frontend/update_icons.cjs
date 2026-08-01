const fs = require('fs');
const path = require('path');
const dir = 'C:/Users/HP/Downloads/laravel/hosting/adopsi/adopsi/frontend/src/pages';

const files = [
  'Dashboard.jsx', 'HistoryLogs.jsx', 'ManageAnimals.jsx',
  'ManageCategories.jsx', 'ManageUsers.jsx', 'PengaturanSistem.jsx',
  'Reports.jsx', 'Restore.jsx', 'AdminDashboard.jsx'
];

files.forEach(file => {
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  
  content = content.replace(/fa-angle-double-left/g, 'fa-bars');
  content = content.replace(/fa-angle-double-right/g, 'fa-bars');
  content = content.replace(/<i className=\{`fas \$\{sidebarOpen \? 'fa-bars' : 'fa-bars'\}`\}><\/i>/g, '<i className="fas fa-bars"></i>');
  content = content.replace(/<i className=\{`fas \$\{sidebarOpen \? 'fa-bars' :\s+'fa-bars'\}`\}><\/i>/g, '<i className="fas fa-bars"></i>');
  content = content.replace(/<i className=\{`fas \$\{sidebarOpen \? 'fa-bars' :\n\s+'fa-bars'\}`\}><\/i>/g, '<i className="fas fa-bars"></i>');

  fs.writeFileSync(filePath, content);
  console.log('Updated ' + file);
});
