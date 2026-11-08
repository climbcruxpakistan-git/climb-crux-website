import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Product from '../src/models/Product.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const apply = process.argv.includes('--apply')

function loadEnvFile(file) {
  try {
    const text = fs.readFileSync(file, 'utf8')
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim()
      if (!line || line.startsWith('#')) continue
      const i = line.indexOf('=')
      if (i <= 0) continue
      const key = line.slice(0, i).trim()
      let val = line.slice(i + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1)
      if (process.env[key] == null) process.env[key] = val
    }
  } catch {}
}

loadEnvFile(path.join(__dirname, '..', '.env'))
loadEnvFile(path.join(__dirname, '..', '.env.local'))

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL
if (!mongoUri) {
  console.error('Missing MongoDB URI. Set MONGODB_URI (or MONGO_URI/DATABASE_URL) in backend/.env.')
  process.exit(1)
}

function cleanFeatures(features) {
  const before = Array.isArray(features) ? features : []
  const after = before.filter((f) => !/^condition:/i.test(String(f || '').trim()))
  return { before, after, changed: before.length !== after.length || before.some((f, i) => f !== after[i]) }
}

function cleanSpecs(specs) {
  const before = Array.isArray(specs) ? specs : []
  const after = before.filter((s) => !/^condition$/i.test(String(s?.key || '').trim()))
  return { before, after, changed: before.length !== after.length }
}

function oldValues(product) {
  const vals = []
  for (const f of product.features || []) if (/^condition:/i.test(String(f || ''))) vals.push(String(f))
  for (const s of product.specifications || []) if (/^condition$/i.test(String(s?.key || ''))) vals.push(`spec:${s.key}=${s.value}`)
  if (product.condition) vals.push(`condition=${product.condition}`)
  return vals
}

async function main() {
  await mongoose.connect(mongoUri)
  console.log(apply ? 'APPLY MODE: writing changes to database.' : 'DRY RUN: no database writes (pass --apply to write).')
  console.log('IMPORTANT: take a database backup before using --apply.')

  const products = await Product.find({})
  const changes = []
  for (const product of products) {
    const features = cleanFeatures(product.features)
    const specs = cleanSpecs(product.specifications)
    const condition = String(product.condition || '')
    const changed = features.changed || specs.changed || condition !== ''
    if (!changed) continue
    changes.push({ product, features, specs, old: oldValues(product) })
  }

  console.log(`Products scanned: ${products.length}`)
  console.log(`Products to change: ${changes.length}`)
  for (const c of changes) {
    console.log(`- ${c.product.name || c.product._id} (${c.product._id}): ${c.old.join(' | ') || '(set condition empty)'}`)
  }

  if (!apply) {
    console.log('\nDry run complete. No changes written.')
  } else {
    let written = 0
    for (const c of changes) {
      c.product.features = c.features.after
      c.product.specifications = c.specs.after
      c.product.condition = ''
      await c.product.save()
      written++
    }
    console.log(`\nApplied changes to ${written} product(s).`)
  }

  await mongoose.disconnect()
}

main().catch(async (err) => {
  console.error(err)
  try { await mongoose.disconnect() } catch {}
  process.exit(1)
})
