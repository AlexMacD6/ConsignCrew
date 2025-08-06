# Facebook Shop Microdata Setup

## Changelog

### Product Structured Data Implementation
- **New Component**: Created `ProductStructuredData.tsx` for Schema.org JSON-LD markup
  - Generates Schema.org Product structured data for catalog ingestion
  - Maps listing fields to required Facebook Shop parameters
  - Includes product ID, name, description, price, availability, condition
  - Supports brand information and product category hierarchy
  - Properly formatted image arrays for product galleries
- **Automatic Integration**: Added to product detail pages for catalog detection
  - Renders JSON-LD script tag with product information
  - Dynamically populates from listing data
  - Ensures all required fields are present for Facebook Shop

### Open Graph Meta Tags Enhancement
- **New Utility**: Created `ProductMetaTags.tsx` for dynamic metadata generation
  - Generates product-specific Open Graph tags
  - Includes required Facebook product properties
  - Maps listing status to proper availability values
  - Supports Twitter Card meta tags for social sharing
  - SEO-optimized meta descriptions and titles
- **Dynamic Metadata**: Implemented `generateMetadata` function in listing pages
  - Server-side metadata generation for each product
  - Fetches listing data for accurate meta information
  - Fallback handling for missing or invalid products
  - Proper canonical URL generation

### Required Field Mappings
- **Product ID**: Maps `listing.item_id` to Schema.org `productID` and `sku`
- **Availability**: Maps listing status to Facebook-compatible values
  - `LISTED/ACTIVE` → `"in stock"` / `https://schema.org/InStock`
  - `SOLD` → `"out of stock"` / `https://schema.org/OutOfStock`
  - `PENDING` → `"pending"` / `https://schema.org/LimitedAvailability`
  - `DISCONTINUED` → `"discontinued"` / `https://schema.org/Discontinued`
- **Price**: Maps `listing.list_price` with `USD` currency specification
- **Product Details**: Comprehensive mapping of listing fields
  - Brand information from `listing.brand`
  - Category hierarchy from department/category/subCategory
  - Condition mapping to Schema.org condition types
  - Image arrays with proper hero image prioritization

### Meta Tag Integration
- **Product-Specific Tags**: Added Open Graph product properties
  ```html
  <meta property="product:price:amount" content="299.99" />
  <meta property="product:price:currency" content="USD" />
  <meta property="product:availability" content="in stock" />
  <meta property="product:condition" content="used" />
  <meta property="product:brand" content="Brand Name" />
  ```
- **Social Media Optimization**: Enhanced sharing appearance
  - Twitter Card support with large image display
  - Product-specific titles and descriptions
  - High-quality hero image integration
  - Proper canonical URL structure

---

## Technical Implementation

### Schema.org Product Structure
```json
{
  "@context": "https://schema.org/",
  "@type": "Product", 
  "productID": "ITEM_ID",
  "sku": "ITEM_ID",
  "name": "Product Title",
  "description": "Product Description",
  "category": "Department > Category > SubCategory",
  "brand": { "@type": "Brand", "name": "Brand Name" },
  "offers": {
    "@type": "Offer",
    "price": "299.99",
    "priceCurrency": "USD", 
    "availability": "https://schema.org/InStock",
    "itemCondition": "https://schema.org/UsedCondition",
    "url": "https://treasurehub.club/list-item/ITEM_ID"
  },
  "image": ["hero_image_url", "additional_images"],
  "url": "https://treasurehub.club/list-item/ITEM_ID"
}
```

### Metadata Generation Flow
1. **Server-Side**: `generateMetadata` fetches listing data during page generation
2. **Data Transformation**: Maps listing fields to metadata-compatible format
3. **Meta Tag Generation**: Creates Open Graph, Twitter, and SEO meta tags
4. **Structured Data**: Renders JSON-LD script for search engines
5. **Error Handling**: Graceful fallbacks for missing or invalid data

---

## Testing Instructions

1. Pull this branch and run `npm install`
2. Start the application with `npm run dev`
3. Navigate to any product listing page (e.g., `/list-item/ITEM_ID`)
4. **Facebook Debugger Testing**:
   - Go to [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
   - Enter your product URL: `https://treasurehub.club/list-item/ITEM_ID`
   - Click "Debug" to see parsed metadata
   - Verify all required fields are detected:
     - ✅ Product ID present
     - ✅ Availability status shown
     - ✅ Price information included
     - ✅ Product images displayed
5. **Schema.org Validation**:
   - Use [Google's Rich Results Test](https://search.google.com/test/rich-results)
   - Enter product URL to validate structured data
   - Verify Product schema is properly detected
6. **Meta Tag Verification**:
   - View page source and locate `<script type="application/ld+json">` 
   - Verify JSON-LD contains all product information
   - Check Open Graph tags in `<head>` section
7. **Social Media Testing**:
   - Share product URL on Facebook/Twitter
   - Verify rich product preview appears
   - Check image, title, and description display

## Expected Facebook Shop Behavior

- **Automatic Detection**: Products should now be automatically detected by Facebook Shop
- **Catalog Ingestion**: Product information flows into Meta catalog without manual upload
- **Error Resolution**: Previous errors should be resolved:
  - ❌ ~~A required field is missing: id~~ → ✅ Product ID now included
  - ❌ ~~A required field is missing: availability~~ → ✅ Availability status mapped
  - ❌ ~~A required field is missing: price~~ → ✅ Price with currency included
- **Enhanced Performance**: Better ad campaign performance with complete product data

## Benefits

- **Automated Catalog Sync**: Products automatically appear in Facebook Shop
- **Improved Ad Performance**: Complete product data enhances targeting
- **Better SEO**: Rich snippets in search results
- **Social Media Optimization**: Enhanced sharing appearance
- **Quality Assurance**: Structured validation prevents data issues