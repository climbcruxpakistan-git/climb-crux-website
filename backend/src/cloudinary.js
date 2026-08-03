import { v2 as cloudinary } from 'cloudinary'

// Shared Cloudinary configuration — used by uploads.js (gallery photos) and
// membership.js (application documents).
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export default cloudinary
