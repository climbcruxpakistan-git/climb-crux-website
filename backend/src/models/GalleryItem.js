import mongoose from 'mongoose'

const galleryItemSchema = new mongoose.Schema({
  tag: { type: String, required: true },
  cat: { type: String, required: true },
  imageUrl: { type: String, default: '' },
  caption: { type: String, default: '' },
  photoSlug: { type: String, default: '' },
}, { timestamps: true })

export default mongoose.model('GalleryItem', galleryItemSchema)
