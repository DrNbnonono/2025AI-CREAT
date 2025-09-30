// Scan public/models recursively for .glb/.gltf and write index.json
// Usage: node scripts/scan-models.js

const fs = require('fs')
const path = require('path')

const ROOT = process.cwd()
const MODELS_DIR = path.join(ROOT, 'public', 'models')
const OUTPUT = path.join(MODELS_DIR, 'index.json')

/** @param {string} dir */
function walk(dir) {
  /** @type {string[]} */
  const results = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...walk(full))
    } else if (/\.(glb|gltf)$/i.test(entry.name)) {
      const rel = path.relative(path.join(ROOT, 'public'), full).replace(/\\/g, '/')
      results.push('/' + rel)
    }
  }
  return results
}

if (!fs.existsSync(MODELS_DIR)) {
  console.error('models directory not found:', MODELS_DIR)
  process.exit(1)
}

const list = walk(MODELS_DIR)
fs.writeFileSync(OUTPUT, JSON.stringify({ updatedAt: new Date().toISOString(), files: list }, null, 2))
console.log(`Scanned ${list.length} file(s). Wrote`, OUTPUT)


