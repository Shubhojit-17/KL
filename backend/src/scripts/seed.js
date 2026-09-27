'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const mongoose = require('mongoose');
const Product = require('../models/Product');

const products = [
  {
    name: 'Terracotta Urn',
    description: 'Hand-thrown terracotta urn with a sun-baked matte finish. Each piece is shaped on a potter\'s wheel and kiln-fired for three days, giving it a warm earthy tone that deepens with age.',
    price: 2499,
    stock: 15,
    category: 'Terracotta',
    images: ['/images/terracotta-urn-1.jpg'],
    isActive: true,
  },
  {
    name: 'Brass Lota Vase',
    description: 'Polished brass lota-inspired vase with a narrow neck and flared rim. The hand-hammered surface catches light in shifting patterns, a nod to traditional Indian water vessels reimagined as sculptural decor.',
    price: 3899,
    stock: 10,
    category: 'Brass',
    images: ['/images/brass-lota-1.jpg'],
    isActive: true,
  },
  {
    name: 'Ceramic Amphora',
    description: 'A matte ceramic amphora with dual handles and a speckled glaze in deep indigo. Thrown in two sections and joined by hand, the amphora silhouette recalls ancient Mediterranean forms with a modern minimalist palette.',
    price: 3299,
    stock: 12,
    category: 'Ceramic',
    images: ['/images/ceramic-amphora-1.jpg'],
    isActive: true,
  },
  {
    name: 'Copper Bud Vase',
    description: 'A slender copper bud vase with a living patina that evolves over time. Designed to hold a single stem, it works equally well as a standalone object on a mantel or windowsill.',
    price: 1899,
    stock: 20,
    category: 'Copper',
    images: ['/images/copper-bud-1.jpg'],
    isActive: true,
  },
  {
    name: 'Stoneware Floor Vase',
    description: 'A large-scale stoneware floor vase in a charcoal matte glaze. At twenty-four inches tall, it commands presence in an entryway or beside a console, with subtle throwing rings left visible as texture.',
    price: 4999,
    stock: 6,
    category: 'Stoneware',
    images: ['/images/stoneware-floor-1.jpg'],
    isActive: true,
  },
  {
    name: 'Enamel Pitcher Vase',
    description: 'A white enamel pitcher with a navy rim, cast in iron and finished with a double-coat enamel glaze. The wide belly tapers to a pinched spout, making it functional as a water pitcher or purely decorative as a vase.',
    price: 2699,
    stock: 8,
    category: 'Enamel',
    images: ['/images/enamel-pitcher-1.jpg'],
    isActive: true,
  },
  {
    name: 'Glass Apothecary Vase',
    description: 'A recycled glass apothecary bottle with a ground stopper. The subtle green tint and trapped air bubbles reveal its hand-blown origins, perfect for displaying dried botanicals or standing empty as a light-catching object.',
    price: 2199,
    stock: 18,
    category: 'Glass',
    images: ['/images/glass-apothecary-1.jpg'],
    isActive: true,
  },
  {
    name: 'Marble Column Vase',
    description: 'A honed white Makrana marble column vase with a square base tapering to a cylindrical opening. Carved from a single block by artisans in Rajasthan, the cool weight and fine grain make it a heirloom piece.',
    price: 6999,
    stock: 4,
    category: 'Marble',
    images: ['/images/marble-column-1.jpg'],
    isActive: true,
  },
  {
    name: 'Bamboo Wrap Vase',
    description: 'A ceramic cylinder wrapped in split bamboo by artisans in Assam. The natural bamboo darkens to a honey tone over time, while the inner ceramic glaze holds water without seepage.',
    price: 1599,
    stock: 22,
    category: 'Bamboo',
    images: ['/images/bamboo-wrap-1.jpg'],
    isActive: true,
  },
  {
    name: 'Oxidised Silver Tumbler',
    description: 'An oxidised silver-finish tumbler with a ribbed body and flared rim. Though sized as a drinking vessel, its sculptural form reads equally as a bud vase or desk accessory.',
    price: 3499,
    stock: 7,
    category: 'Silver',
    images: ['/images/oxidised-silver-1.jpg'],
    isActive: true,
  },
  {
    name: 'Porcelain Gourd Vase',
    description: 'A double-gourd porcelain vase in a celadon crackle glaze. Thrown in two parts and luted at the waist, the translucent glaze pools in the crevices creating a depth that shifts under different light.',
    price: 4299,
    stock: 9,
    category: 'Porcelain',
    images: ['/images/porcelain-gourd-1.jpg'],
    isActive: true,
  },
  {
    name: 'Teak Root Vase',
    description: 'A hollowed teak root vessel, sanded smooth but left in its natural organic form. Each piece is unique — shaped by decades of growth and hand-selected from sustainable plantations in Kerala.',
    price: 5599,
    stock: 3,
    category: 'Wood',
    images: ['/images/teak-root-1.jpg'],
    isActive: true,
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await Product.deleteMany({});
    console.log('Cleared existing products');

    const inserted = await Product.insertMany(products);
    console.log(`Seeded ${inserted.length} products`);

    await mongoose.disconnect();
    console.log('Disconnected');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
