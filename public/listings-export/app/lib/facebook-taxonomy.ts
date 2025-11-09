/**
 * Centralized Facebook Marketplace taxonomy (Departments > Categories > Subcategories)
 * Keep this list aligned with Facebook. UI dropdowns should use this source.
 */

export type FacebookTaxonomy = Record<string, Record<string, string[]>>;

export const FACEBOOK_TAXONOMY: FacebookTaxonomy = {
  // Core departments (subset shown; expand as needed to match FB exactly)
  // Facebook Marketplace shows "Home Goods" as the department label
  "Home Goods": {
    "Appliances": ["Refrigerators", "Dishwashers", "Ovens", "Microwaves"],
    "Bath Products": ["Towels", "Bath Mats", "Shower Curtains"],
    "Bedding": ["Sheets", "Comforters", "Pillows", "Blankets"],
    "Cleaning Supplies": ["Vacuum Cleaners", "Steam Cleaners", "Mops", "Air Purifiers"],
    "Furniture": [
      "Bedroom Furniture",
      "Living Room Furniture",
      "Dining Room Furniture",
      "Office Furniture",
      "Outdoor Furniture",
      "Storage Furniture",
    ],
    "Home Decor": ["Wall Art", "Mirrors", "Vases", "Candles"],
    "Home Lighting": ["Lamps", "Chandeliers", "Sconces", "Light Bulbs"],
    "Kitchen & Dining Products": ["Cookware", "Dinnerware", "Kitchen Utensils", "Small Appliances"],
    "Storage & Organization": ["Closet Organizers", "Storage Bins", "Hooks", "Shelving"],
  },
  "Vehicles": {
    "Cars & Trucks": [],
    "Motorcycles": [],
    "Powersports": [],
    "RVs & Campers": [],
    "Trailers": [],
    "Boats": [],
    "Commercial & Industrial Vehicles": [],
    "Vehicle Parts & Accessories": [],
  },
  "Property Rentals": {
    "Apartments for Rent": [],
    "Houses for Rent": [],
    "Sublets & Temporary": [],
    "Vacation Rentals": [],
    "Parking & Storage": [],
  },
  "Apparel": {
    "Women’s Clothing": [],
    "Men’s Clothing": [],
    "Shoes": [],
    "Jewelry & Accessories": [],
    "Bags & Luggage": [],
  },
  "Electronics": {
    "Cell Phones": [],
    "Computers & Tablets": [],
    "Consumer Electronics": [],
    "Video Games & Consoles": [],
    "Cameras & Photo": [],
    "Audio Equipment": [],
    "TVs": [],
  },
  "Entertainment": {
    "Books, Movies & Music": [],
    "Musical Instruments": [],
    "Tickets": [],
  },
  "Family": {
    "Baby & Kids’ Items": [],
    "Health & Beauty": [],
    "Pet Supplies": [],
    "Toys & Games": [],
  },
  "Free Stuff": {
    "General": [],
  },
  "Garden & Outdoor": {
    "Garden Tools": [],
    "Outdoor Furniture": [],
    "Grills": [],
    "Plants & Seeds": [],
    "Sports & Outdoors": [],
  },
  "Hobbies": {
    "Arts & Crafts": [],
    "Collectibles": [],
    "Sewing & Needlecraft": [],
    "Sports Memorabilia": [],
  },
  "Home Improvement Supplies": {
    "Tools": [],
    "Building Materials": [],
    "Flooring": [],
    "Kitchen Cabinets": [],
    "Plumbing": [],
    "Electrical": [],
    "Hardware": [],
  },
  "Classifieds": {
    "Services": [],
    "Jobs": [],
    "Other": [],
  },
  "Furniture": {
    "Living Room": ["Sofas", "Loveseats", "Sectionals", "Coffee Tables", "Side Tables", "Console Tables"],
    "Dining Room": ["Dining Tables", "Dining Chairs", "Buffets", "China Cabinets"],
    "Bedroom": ["Beds", "Dressers", "Nightstands", "Wardrobes", "Vanities"],
    "Office": ["Desks", "Office Chairs", "Filing Cabinets", "Bookshelves"],
    "Outdoor": ["Patio Sets", "Garden Chairs", "Outdoor Tables"],
    "Storage": ["Wardrobes", "Chests", "Shelving Units", "Storage Bins"],
    "Kids": ["Children's Beds", "Kids' Desks", "Toy Storage"],
  },
  "Electronics": {
    "Computers & Tablets": ["Laptops", "Desktops", "Tablets", "Monitors", "Keyboards", "Mice"],
    "Mobile Phones": ["Smartphones", "Phone Cases", "Chargers", "Screen Protectors"],
    "Audio Equipment": ["Speakers", "Headphones", "Microphones", "Amplifiers"],
    "Cameras & Photo": ["Digital Cameras", "Lenses", "Tripods", "Camera Bags"],
    "TVs & Video": ["Televisions", "Projectors", "DVD Players", "Streaming Devices"],
    "Smart Home": ["Smart Speakers", "Security Cameras", "Smart Thermostats"],
    "Gaming": ["Gaming Consoles", "Gaming PCs", "Controllers", "Gaming Headsets"],
  },
  "Clothing & Accessories": {
    "Men's Clothing": ["Shirts", "Pants", "Jackets", "Shoes", "Accessories"],
    "Women's Clothing": ["Dresses", "Tops", "Bottoms", "Shoes", "Accessories"],
    "Kids' Clothing": ["Boys' Clothing", "Girls' Clothing", "Baby Clothes", "Shoes"],
    "Jewelry & Watches": ["Necklaces", "Rings", "Watches", "Bracelets"],
    "Bags & Purses": ["Handbags", "Backpacks", "Wallets", "Luggage"],
    "Shoes": ["Sneakers", "Boots", "Sandals", "Formal Shoes"],
  },
  "Sporting Goods": {
    "Fitness Equipment": ["Treadmills", "Weights", "Yoga Mats", "Exercise Bikes"],
    "Team Sports": ["Basketballs", "Soccer Balls", "Baseball Equipment", "Tennis Rackets"],
    "Outdoor Sports": ["Bicycles", "Camping Gear", "Hiking Equipment", "Fishing Gear"],
    "Water Sports": ["Swimming Gear", "Surfboards", "Kayaks", "Life Jackets"],
    "Winter Sports": ["Skis", "Snowboards", "Winter Clothing", "Boots"],
  },
  "Toys & Games": {
    "Board Games": ["Strategy Games", "Family Games", "Party Games", "Puzzles"],
    "Action Figures": ["Collectible Figures", "Dolls", "Plush Toys"],
    "Educational": ["Learning Toys", "Science Kits", "Art Supplies"],
    "Outdoor Toys": ["Bikes", "Scooters", "Playground Equipment"],
    "Video Games": ["Game Consoles", "Game Cartridges", "Controllers"],
  },
  "Appliances": {
    "Kitchen Appliances": ["Refrigerators", "Dishwashers", "Ovens", "Microwaves"],
    "Laundry": ["Washers", "Dryers", "Ironing Boards"],
    "Cleaning": ["Vacuum Cleaners", "Steam Cleaners", "Air Purifiers"],
    "Small Appliances": ["Blenders", "Coffee Makers", "Toasters", "Mixers"],
  },
  "Baby & Kids": {
    "Baby Gear": ["Strollers", "Car Seats", "High Chairs", "Cribs"],
    "Toys": ["Educational Toys", "Building Blocks", "Dolls", "Action Figures"],
    "Clothing": ["Onesies", "Sleepers", "Outfits", "Shoes"],
    "Feeding": ["Bottles", "Formula", "Baby Food", "Bibs"],
  },
};

export const getDepartments = () => Object.keys(FACEBOOK_TAXONOMY);
export const getCategories = (department: string) =>
  department && FACEBOOK_TAXONOMY[department]
    ? Object.keys(FACEBOOK_TAXONOMY[department])
    : [];
export const getSubCategories = (department: string, category: string) =>
  department && category && FACEBOOK_TAXONOMY[department] && FACEBOOK_TAXONOMY[department][category]
    ? FACEBOOK_TAXONOMY[department][category]
    : [];

/**
 * Reverse lookup: Find the department and category for a given subcategory
 * This ensures proper hierarchy when AI returns a correct subcategory but missing parent categories
 */
export function findParentCategories(subCategory: string): {
  department: string | null;
  category: string | null;
} {
  const subCategoryLower = subCategory.toLowerCase();
  
  for (const [department, categories] of Object.entries(FACEBOOK_TAXONOMY)) {
    for (const [category, subCategories] of Object.entries(categories)) {
      const foundSub = subCategories.find((sub) => sub.toLowerCase() === subCategoryLower);
      if (foundSub) {
        return { department, category };
      }
    }
  }
  
  return { department: null, category: null };
}

/**
 * Ensures complete and valid Facebook taxonomy hierarchy
 * If subcategory is valid but parents are missing, fills them in
 */
export function validateCategoryHierarchy(
  department: string,
  category: string, 
  subCategory: string
): {
  department: string;
  category: string;
  subCategory: string;
} {
  // If we have a subcategory, try to find its parents
  if (subCategory && (!department || !category)) {
    const parents = findParentCategories(subCategory);
    if (parents.department && parents.category) {
      return {
        department: parents.department,
        category: parents.category,
        subCategory: subCategory
      };
    }
  }
  
  // If all fields are provided, validate they make sense together
  if (department && category && subCategory) {
    const validSubCategories = getSubCategories(department, category);
    const subExists = validSubCategories.some(sub => sub.toLowerCase() === subCategory.toLowerCase());
    
    if (!subExists) {
      // If subcategory doesn't belong to this department/category, find the right parents
      const parents = findParentCategories(subCategory);
      if (parents.department && parents.category) {
        return {
          department: parents.department,
          category: parents.category,
          subCategory: subCategory
        };
      }
    }
  }
  
  // Return as-is if validation passes or if we can't fix it
  return {
    department: department || "Home Goods",
    category: category || "Appliances", 
    subCategory: subCategory || ""
  };
}


