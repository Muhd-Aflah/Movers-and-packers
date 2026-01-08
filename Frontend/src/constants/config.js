export const APP_CONFIG = {
  name: "SwiftMove Logistics",
  description: "Quick & reliable warehousing and logistics solution",
  version: "1.0.0",
  author: "SwiftMove Team",
  
  // SEO Configuration
  seo: {
    title: "SwiftMove - Quick & Reliable Logistics Solutions",
    description: "ShipUp delivers unparalleled customer service through dedicated teams and global footprint",
    keywords: ["logistics", "warehousing", "shipping", "freight", "supply chain"],
    ogImage: "/og-image.png",
  },

  // Contact Information
  contact: {
    email: "info@swiftmove.ng",
    phone: "+234-XXX-XXXX-XXX",
    address: "Lagos, Nigeria",
  },

  // Social Media Links
  social: {
    twitter: "https://twitter.com/swiftmove",
    facebook: "https://facebook.com/swiftmove",
    linkedin: "https://linkedin.com/company/swiftmove",
    instagram: "https://instagram.com/swiftmove",
  },

  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || "https://api.swiftmove.ng",
    timeout: 10000,
  },

  // Analytics
  analytics: {
    googleAnalyticsId: import.meta.env.VITE_GA_ID,
    hotjarId: import.meta.env.VITE_HOTJAR_ID,
  },

  // Feature Flags
  features: {
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === "true",
    enableChat: import.meta.env.VITE_ENABLE_CHAT === "true",
    enableDemo: import.meta.env.VITE_ENABLE_DEMO === "true",
  },
};
