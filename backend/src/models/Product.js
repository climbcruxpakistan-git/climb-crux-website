import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  // ── Basic Information ──
  name: { type: String, required: true },
  slug: { type: String, default: '' },
  sku: { type: String, default: '' },
  brand: { type: String, default: '' },
  category: { type: String, default: 'Uncategorized' },

  // ── Pricing ──
  price: { type: Number, required: true },
  compareAtPrice: { type: Number, default: null },
  originalPrice: { type: Number, default: null }, // kept for backward compatibility

  // ── Description ──
  description: { type: String, default: '' },

  // ── Images ──
  imageUrl: { type: String, default: '' }, // featured image (backward compat)
  featuredImageAlt: { type: String, default: '' }, // alt text for featured image
  images: [{ type: String }], // gallery image URLs (strings for backward compat)

  // ── Inventory ──
  stockQuantity: { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 5 },
  stockStatus: {
    type: String,
    enum: ['in_stock', 'low_stock', 'out_of_stock', 'backorder'],
    default: 'in_stock',
  },
  inStock: { type: Boolean, default: true }, // kept for backward compatibility

  // ── Variants ──
  variants: [
    {
      name: { type: String, default: '' }, // e.g. "Size", "Color"
      value: { type: String, default: '' }, // e.g. "M", "Red"
      price: { type: Number, default: null },
      sku: { type: String, default: '' },
      stockQuantity: { type: Number, default: 0 },
    },
  ],

  // ── Specifications ──
  specifications: [
    {
      key: { type: String, default: '' },   // e.g. "Material"
      value: { type: String, default: '' },  // e.g. "Nylon"
    },
  ],

  // ── Features ──
  features: [{ type: String }],
  featureIcons: [{ type: String }], // icon emoji for each feature, e.g. "✓", "⚡", "🛡️"

  // ── FAQs ──
  faqs: [
    {
      question: { type: String, default: '' },
      answer: { type: String, default: '' },
    },
  ],

  // ── Shipping ──
  shipping: {
    deliveryTime: { type: String, default: '' },  // e.g. "2–3 Days"
    freeShipping: { type: Boolean, default: false },
  },

  // ── Warranty ──
  warranty: {
    period: { type: String, default: '' },    // e.g. "1 Year"
    details: { type: String, default: '' },   // e.g. "Covers manufacturer defects…"
  },

  // ── Returns ──
  returns: {
    window: { type: String, default: '' },    // e.g. "30 Days"
    policy: { type: String, default: '' },    // e.g. "Full refund within 30 days…"
  },

  // ── SEO ──
  seo: {
    title: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    canonicalUrl: { type: String, default: '' },
  },

  // ── Publish ──
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published' },

  // ── Flags ──
  featured: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },

}, { timestamps: true })

export default mongoose.model('Product', productSchema)
