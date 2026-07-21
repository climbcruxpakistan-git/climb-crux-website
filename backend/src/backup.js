/**
 * Database backup — exports all collections to JSON files
 * in the /backend/backups/ directory.
 *
 * Usage: npm run db:backup
 *        npm run db:backup -- --label before-migration
 *
 * The backup files are plain JSON, safe to commit to git.
 * Restore with: npm run db:restore [filename]
 */
import 'dotenv/config'
import dns from 'dns'
import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BACKUPS_DIR = path.join(__dirname, '..', 'backups')

// Handle custom DNS
const dnsServers = process.env.DNS_SERVERS
  ? process.env.DNS_SERVERS.split(',').map((s) => s.trim())
  : null
if (dnsServers) dns.setServers(dnsServers)

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/climb-crux'

// Import all models
import Session from './models/Session.js'
import Plan from './models/Plan.js'
import TeamMember from './models/TeamMember.js'
import GalleryItem from './models/GalleryItem.js'
import Booking from './models/Booking.js'
import About from './models/About.js'
import HomeContent from './models/HomeContent.js'
import SessionContent from './models/SessionContent.js'
import Photo from './models/Photo.js'

async function backup() {
  await mongoose.connect(MONGODB_URI)
  console.log(`Connected to MongoDB\n`)

  if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true })

  const label = process.argv.includes('--label')
    ? process.argv[process.argv.indexOf('--label') + 1]
    : ''

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const filename = label
    ? `backup-${timestamp}-${label}.json`
    : `backup-${timestamp}.json`

  const filepath = path.join(BACKUPS_DIR, filename)

  const models = [
    { name: 'sessions', model: Session },
    { name: 'plans', model: Plan },
    { name: 'teamMembers', model: TeamMember },
    { name: 'galleryItems', model: GalleryItem },
    { name: 'bookings', model: Booking },
    { name: 'about', model: About },
    { name: 'homeContent', model: HomeContent },
    { name: 'sessionContent', model: SessionContent },
    { name: 'photos', model: Photo },
  ]

  const dump = {}

  for (const { name, model } of models) {
    const docs = await model.find({}).lean()
    dump[name] = docs
    console.log(`  ${name.padEnd(16)} ${docs.length} documents`)
  }

  fs.writeFileSync(filepath, JSON.stringify(dump, null, 2))
  console.log(`\n✅ Backup saved to: ${filepath}`)

  await mongoose.disconnect()
}

backup().catch((err) => {
  console.error('Backup failed:', err)
  process.exit(1)
})
