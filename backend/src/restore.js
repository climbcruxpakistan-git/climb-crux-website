/**
 * Database restore — imports data from a backup JSON file.
 *
 * Usage: npm run db:restore
 *        npm run db:restore -- backup-2026-07-21T12-00-00.json
 *        npm run db:restore -- --list                 (list available backups)
 *
 * Without a filename, restores from the most recent backup.
 * WARNING: This replaces all current data with the backup data.
 */
import 'dotenv/config'
import dns from 'dns'
import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BACKUPS_DIR = path.join(__dirname, '..', 'backups')

const dnsServers = process.env.DNS_SERVERS
  ? process.env.DNS_SERVERS.split(',').map((s) => s.trim())
  : null
if (dnsServers) dns.setServers(dnsServers)

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/climb-crux'

import Session from './models/Session.js'
import Plan from './models/Plan.js'
import TeamMember from './models/TeamMember.js'
import GalleryItem from './models/GalleryItem.js'
import Booking from './models/Booking.js'
import About from './models/About.js'
import HomeContent from './models/HomeContent.js'
import SessionContent from './models/SessionContent.js'
import Photo from './models/Photo.js'

const MODELS = {
  sessions: Session,
  plans: Plan,
  teamMembers: TeamMember,
  galleryItems: GalleryItem,
  bookings: Booking,
  about: About,
  homeContent: HomeContent,
  sessionContent: SessionContent,
  photos: Photo,
}

async function restore() {
  // List mode
  if (process.argv.includes('--list')) {
    if (!fs.existsSync(BACKUPS_DIR)) {
      console.log('No backups directory found.')
      return
    }
    const files = fs.readdirSync(BACKUPS_DIR).filter((f) => f.endsWith('.json'))
    if (files.length === 0) {
      console.log('No backup files found.')
      return
    }
    console.log('Available backups:')
    for (const f of files.sort().reverse()) {
      const stat = fs.statSync(path.join(BACKUPS_DIR, f))
      console.log(`  ${f}  (${(stat.size / 1024).toFixed(1)} KB)`)
    }
    return
  }

  await mongoose.connect(MONGODB_URI)
  console.log(`Connected to MongoDB\n`)

  // Resolve file
  if (!fs.existsSync(BACKUPS_DIR)) {
    console.error('No backups/ directory found. Run npm run db:backup first.')
    process.exit(1)
  }

  let filename = process.argv.find((a) => a.endsWith('.json') && !a.startsWith('-'))

  if (!filename) {
    const files = fs.readdirSync(BACKUPS_DIR).filter((f) => f.endsWith('.json'))
    if (files.length === 0) {
      console.error('No backup files found.')
      process.exit(1)
    }
    filename = files.sort().reverse()[0]
    console.log(`Using most recent backup: ${filename}\n`)
  }

  const filepath = path.join(BACKUPS_DIR, filename)

  if (!fs.existsSync(filepath)) {
    console.error(`Backup not found: ${filepath}`)
    process.exit(1)
  }

  const dump = JSON.parse(fs.readFileSync(filepath, 'utf-8'))

  // Confirm
  if (!process.argv.includes('--yes')) {
    console.log('⚠️  This will REPLACE all current data with the backup.')
    console.log('   Run with --yes to proceed.\n')
    for (const [key, docs] of Object.entries(dump)) {
      console.log(`  ${key.padEnd(16)} ${docs.length} documents`)
    }
    console.log()
    process.exit(0)
  }

  // Restore each collection
  for (const [key, docs] of Object.entries(dump)) {
    const Model = MODELS[key]
    if (!Model) {
      console.log(`  Skipping unknown collection: ${key}`)
      continue
    }
    await Model.deleteMany({})
    if (docs.length > 0) await Model.insertMany(docs)
    console.log(`  ${key.padEnd(16)} ${docs.length} documents restored`)
  }

  console.log(`\n✅ Restored from: ${filename}`)
  await mongoose.disconnect()
}

restore().catch((err) => {
  console.error('Restore failed:', err)
  process.exit(1)
})
