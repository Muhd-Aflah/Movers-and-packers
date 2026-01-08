export const NAVIGATION_ITEMS = [
  {
    label: "Services",
    href: "/services",
    hasDropdown: true,
    children: [
      { label: "Warehousing", href: "/services/warehousing" },
      { label: "Freight", href: "/services/freight" },
      { label: "Packaging", href: "/services/packaging" },
    ],
  },
  {
    label: "Solutions",
    href: "/solutions",
    hasDropdown: true,
    children: [
      { label: "E-commerce", href: "/solutions/ecommerce" },
      { label: "Enterprise", href: "/solutions/enterprise" },
    ],
  },
  {
    label: "Industries",
    href: "/industries",
    hasDropdown: true,
    children: [
      { label: "Retail", href: "/industries/retail" },
      { label: "Manufacturing", href: "/industries/manufacturing" },
    ],
  },
  {
    label: "Insights",
    href: "/insights",
    hasDropdown: false,
  },
  
];

export const FOOTER_LINKS = {
  explore: [
    { label: "About Us", href: "/about" },
    { label: "Our Warehouses", href: "/warehouses" },
    { label: "Blog", href: "/blog" },
    { label: "News and Media", href: "/news" },
  ],
  legal: [
    { label: "Terms", href: "/terms" },
    { label: "Privacy", href: "/privacy" },
  ],
};

export const SERVICES = [
  {
    id: "warehousing",
    icon: "/group-6920.png",
    title: "Warehousing Services",
    description:
      "A pay as-you-go solution for: pallet storage, inventory management, fulfillment(e.g. pick and pack), in/out-bound solutions, and more.",
  },
  {
    id: "freight",
    icon: "/group-6921.png",
    title: "Global Freight",
    description:
      "Search and compare the best shipping rates among dozens of trusted logistic partners for the last mile delivery and freight.",
  },
  {
    id: "packaging",
    icon: "/group-6921-1.png",
    title: "Packaging Solutions",
    description:
      "Our packaging solutions are optimized for each individual customer and are selected based on on the customer's specific needs and requirements.",
  },
];

export const OPERATION_STEPS = [
  {
    number: "1",
    title: "Connect",
    titleColor: "text-[#00c8b3]",
    description:
      "You're currently running your store on Shopify, WooCommerce, or any other platform. As a first step, you'll connect your store with our platform.",
    imageSrc: "/image-3.png",
    imageAlt: "Image connection process",
  },
  {
    number: "2",
    title: "Store",
    titleColor: "text-[#00c0e8]",
    description:
      "Then, you can send us your inventory and the fun begins. We'll choose a delivery day together so your fulfilment is not interrupted.",
    imageSrc: "/rectangle-1314.png",
    imageAlt: "Warehouse storage",
  },
  {
    number: "3",
    title: "Ship",
    titleColor: "text-[#00c3d0]",
    description:
      "We pick, pack and ship all incoming orders directly from our own warehouse until 12pm on the same day,",
    imageSrc: "/91fa59e6781adbdced82e349bb595d99-1-1.png",
    imageAlt: "Shipping process",
  },
];

export const LOCATION_DATA = [
  {
    id: "india",
    top: "top-[20%] sm:top-[25%] lg:top-[133px]",
    left: "left-[60%] sm:left-[65%] lg:left-[984px]",
    flag: "/group-7028.png",
    country: "India",
    count: "25,000",
  },
  {
    id: "berlin",
    top: "top-[50%] sm:top-[55%] lg:top-[323px]",
    left: "left-[60%] sm:left-[65%] lg:left-[982px]",
    flag: "/group-7028-1.png",
    country: "Berlin",
    count: "25,000",
  },
  {
    id: "italy",
    top: "top-[35%] sm:top-[40%] lg:top-[218px]",
    left: "left-[20%] sm:left-[25%] lg:left-[191px]",
    flag: "/group-7028-2.png",
    country: "Italy",
    count: "25,000",
  },
];

export const FORM_FIELDS = [
  {
    id: "origin",
    label: "Origin",
    placeholder: "Enter Location",
    icon: "/location.svg",
    iconType: "bg",
  },
  {
    id: "destination",
    label: "Destination",
    placeholder: "Enter Location",
    icon: "/location.svg",
    iconType: "bg",
  },
  {
    id: "weight",
    label: "Weight",
    placeholder: "Weight (kg)",
    icon: "/iconly-bold-bag-2.svg",
    iconType: "img",
  },
];

export const BREAKPOINTS = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

export const ANIMATION_DURATION = {
  fast: "150ms",
  normal: "300ms",
  slow: "500ms",
};
