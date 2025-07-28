const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Hardcoded zip codes from the TypeScript file
const SELLER_ZIP_CODES = {
  "77007": "The Heights (Washington Corridor)",
  "77008": "The Heights (Timbergrove / Greater Heights)",
  "77019": "River Oaks / Upper Kirby",
  "77027": "River Oaks District / Highland Village",
  "77056": "Galleria / Tanglewood",
  "77057": "Galleria / Briargrove",
  "77024": "Memorial / Memorial Villages",
  "77079": "Memorial West / Energy Corridor",
  "77005": "West University Place",
  "77401": "Bellaire",
  "77006": "Montrose / Museum District",
  "77003": "EaDo / Eastwood",
  "77018": "Garden Oaks / Oak Forest",
  "77004": "Midtown / Museum Park",
  "77002": "Downtown / Midtown",
  "77098": "Upper Kirby / Greenway Plaza",
};

const BUYER_ZIP_CODES = {
  // The Heights Core Area
  "77007": "The Heights (Washington Corridor)",
  "77008": "The Heights (Timbergrove / Greater Heights)",
  "77009": "Near Northside / Woodland Heights",
  "77018": "Garden Oaks / Oak Forest",
  "77022": "Northside",
  "77076": "Northline",
  "77092": "Lazybrook / Timbergrove",
  "77055": "Spring Branch East",

  // River Oaks / Upper Kirby Core Area
  "77019": "River Oaks / Upper Kirby",
  "77027": "Highland Village / River Oaks",
  "77098": "Upper Kirby / Greenway Plaza",
  "77006": "Montrose",
  "77046": "Greenway Plaza",
  "77081": "Gulfton / Bellaire Junction",
  "77056": "Galleria",
  "77063": "Briarmeadow / Woodlake",

  // Galleria / Tanglewood Core Area
  "77057": "Galleria / Briargrove",
  "77024": "Memorial Villages",
  "77042": "Westchase",
  "77036": "Sharpstown",

  // Memorial / Memorial Villages Core Area
  "77079": "Memorial West / Energy Corridor",
  "77043": "Spring Branch West",
  "77041": "Jersey Village / Carverdale",
  "77080": "Spring Branch Central",
  "77077": "Briar Forest",
  "77094": "Energy Corridor (far west)",

  // West University / Bellaire Core Area
  "77005": "West University Place",
  "77401": "Bellaire",
  "77025": "Braeswood / Southside",
  "77030": "Texas Medical Center",
  "77096": "Meyerland",
  "77035": "Westbury",
  "77045": "Central Southwest",

  // Montrose / Museum District / Midtown Core Area
  "77004": "Midtown / Museum Park",
  "77002": "Downtown / Midtown",
  "77023": "Eastwood",
  "77010": "Downtown core",

  // EaDo / Eastwood Core Area
  "77003": "EaDo / Eastwood",
  "77011": "Second Ward",
  "77020": "Fifth Ward",
  "77021": "OST / South Union",
  "77012": "Magnolia Park",
  "77017": "Pecan Park",

  // Garden Oaks / Oak Forest Core Area
  "77091": "Acres Homes",
  "77088": "Inwood Forest",
};

async function migrateZipCodes() {
  try {
    console.log('Starting zip code migration...');

    // Clear existing zip codes
    await prisma.zipCode.deleteMany({});
    console.log('Cleared existing zip codes');

    // Migrate seller zip codes
    const sellerZipCodes = Object.entries(SELLER_ZIP_CODES).map(([code, area]) => ({
      code,
      area,
      type: 'seller'
    }));

    await prisma.zipCode.createMany({
      data: sellerZipCodes
    });
    console.log(`Migrated ${sellerZipCodes.length} seller zip codes`);

    // Migrate buyer zip codes
    const buyerZipCodes = Object.entries(BUYER_ZIP_CODES).map(([code, area]) => ({
      code,
      area,
      type: 'buyer'
    }));

    await prisma.zipCode.createMany({
      data: buyerZipCodes
    });
    console.log(`Migrated ${buyerZipCodes.length} buyer zip codes`);

    console.log('Zip code migration completed successfully!');
  } catch (error) {
    console.error('Error migrating zip codes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateZipCodes(); 