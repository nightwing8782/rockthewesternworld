const fs = require('fs');
const path = require('path');

const targetDir = 'C:\\Users\\danbi\\OneDrive\\Documents\\Ebooks';

function scanDirectory(dir, fileList = []) {
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        scanDirectory(fullPath, fileList);
      } else if (item.isFile()) {
        const ext = path.extname(item.name).toLowerCase();
        if (['.cbz', '.cbr', '.zip', '.epub', '.pdf'].includes(ext)) {
          const stats = fs.statSync(fullPath);
          fileList.push({
            name: item.name,
            fullPath,
            ext,
            size: stats.size,
            relPath: path.relative(targetDir, fullPath),
          });
        }
      }
    }
  } catch (err) {
    console.error('Error scanning dir:', dir, err.message);
  }
  return fileList;
}

console.log('Scanning', targetDir, '...');
const files = scanDirectory(targetDir);

const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
const totalGB = (totalBytes / (1024 * 1024 * 1024)).toFixed(2);

const countsByExt = files.reduce((acc, f) => {
  acc[f.ext] = (acc[f.ext] || 0) + 1;
  return acc;
}, {});

console.log('-------------------------------------------');
console.log(`Found ${files.length} total books & comics (${totalGB} GB):`);
console.log(countsByExt);
console.log('-------------------------------------------');

// Sample folders / series
const folders = new Set();
files.forEach((f) => {
  const parts = f.relPath.split(path.sep);
  if (parts.length > 1) {
    folders.add(parts.slice(0, parts.length - 1).join(' / '));
  }
});

console.log(`Organized across ${folders.size} folder collections. Sample collections:`);
Array.from(folders).slice(0, 15).forEach((fol) => console.log('  •', fol));
