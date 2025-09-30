// Watch public/models for changes and keep index.json updated
// Usage: node scripts/watch-models.cjs

const fs = require('fs')
const path = require('path')

const ROOT = process.cwd()
const MODELS_DIR = path.join(ROOT, 'public', 'models')
const OUTPUT = path.join(MODELS_DIR, 'index.json')

function walk(dir) {
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

function writeIndex() {
  if (!fs.existsSync(MODELS_DIR)) return
  const list = walk(MODELS_DIR)
  fs.writeFileSync(OUTPUT, JSON.stringify({ updatedAt: new Date().toISOString(), files: list }, null, 2))
  console.log(`[models] indexed ${list.length} file(s) → ${path.relative(ROOT, OUTPUT)}`)
}

// initial build
writeIndex()

// simple debounce
let timer = null
function schedule() {
  clearTimeout(timer)
  timer = setTimeout(writeIndex, 250)
}

// watch recursively (supported on Windows/macOS)
try {
  fs.watch(MODELS_DIR, { recursive: true }, () => schedule())
  console.log('[models] watching', path.relative(ROOT, MODELS_DIR))
} catch (e) {
  console.log('[models] fallback watch (non-recursive)')
  fs.watch(MODELS_DIR, () => schedule())
}


