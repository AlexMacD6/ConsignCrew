## Changelog

- Upgraded Facebook Shop Export from CSV to XLSX format with photos and videos
  - Replaced CSV export with professional Excel file generation
  - Added xlsx (SheetJS) library for Excel file creation
  - Added jszip library for creating zip archives
  - Changed file format from .csv to .zip containing XLSX + all media
  - Updated exportToCSV function to exportToXLSX (now async)
- Enhanced visual aesthetics with professional formatting
  - **Poppins font** used throughout the entire spreadsheet
  - **Larger text sizes** - Title (18pt), Headers (13pt), Data (11pt)
  - **Bold headers** with TreasureHub gold background (#D4AF3D) and white text
  - **Grid pattern** with light gray borders on all cells
  - **Reorganized structure** - Removed empty rows for cleaner layout:
    - Row 1: TreasureHub title
    - Row 2: Instructions
    - Row 3: Header requirements (light yellow background)
    - Row 4: Column headers (bold, gold background)
    - Row 5+: Data listings
  - Medium-weight borders on header row for emphasis
  - Alternating row colors (white/light gray) for data rows
  - Increased column widths (55 for title, 70 for description)
  - Increased row heights for better readability (32pt title, 48pt requirements)
- Added comprehensive photo and video download
  - Downloads all photos (hero, back, proof, additional) from each listing
  - Downloads all videos from each listing using CloudFront CDN
  - Organizes files by listing: [itemId]-[title]/photos/ and [itemId]-[title]/videos/
  - Uses server-side API endpoints to avoid CORS issues
  - Fetches files as blobs for reliable downloading
  - Automatically detects file extensions from URLs
- Enhanced user experience
  - Added loading state with spinner during export
  - Disabled button while exporting to prevent duplicate requests
  - Shows success message with counts (listings, photos, videos)
  - All files packaged in a single ZIP download for convenience
- Updated dependencies
  - Added xlsx v0.18.5 to package.json dependencies
  - Added jszip library to package.json dependencies
  - Documented dependencies in requirements file
- Updated Listing interface
  - Added photos.proof and photos.additional fields
  - Added videos array with id, videoUrl, processedVideoKey, rawVideoKey

---

## Testing Instructions

1. Pull this branch
2. Run `npm install` to install the xlsx and jszip libraries
3. Start the development server with `npm run dev`
4. Navigate to the admin panel and select "Facebook Shop Export"
5. Select one or more listings from the list (choose listings with photos and videos for best testing)
6. Click the "Export" button
7. Verify that:
   - Button shows "Exporting..." with a spinner while processing
   - Button is disabled during export
   - A .zip file is downloaded (not .xlsx or .csv)
   - File name follows format: TreasureHub-Facebook-Export-YYYY-MM-DD.zip
8. Extract the ZIP file and verify:
   - Contains "Facebook-Marketplace-Template.xlsx" in the root
   - Contains folders for each listing (e.g., "ITEM123-Product_Title/")
   - Each listing folder contains a "photos" subfolder with all photos
   - Each listing folder contains a "videos" subfolder with videos (if applicable)
   - All photos are properly named (photo-1.jpg, photo-2.jpg, etc.)
   - All videos are properly named (video-1.mp4, etc.)
9. Open the XLSX file and verify **professional formatting**:
   - **Row 1**: "TreasureHub - Facebook Marketplace Bulk Upload Template" in Poppins 18pt bold, gold text
   - **Row 2**: Instructions in Poppins 11pt with light gray background
   - **Row 3**: Header requirements in Poppins 9pt italic with **light yellow background**
   - **Row 4**: Column headers in Poppins 13pt **bold** with **gold background (#D4AF3D)** and white text
   - **Row 5+**: Data rows in Poppins 11pt with alternating white/light gray backgrounds
   - **Grid borders** visible on all cells (light gray, thin lines)
   - **Medium-weight black borders** on header row for emphasis
   - Title column is 55 characters wide
   - Description column is 70 characters wide with text wrapping enabled
   - All text left-aligned for readability
   - Data is properly formatted and matches the selected listings
   - **No empty rows** - clean, professional layout
10. Test with different scenarios:
    - Single listing
    - Multiple listings (3-5)
    - Listings with many photos
    - Listings with videos
    - Listings without videos
11. Verify the spreadsheet looks **professional and polished** (not like amateur work)
12. Verify the file can be used for Facebook Marketplace bulk upload

---

## Visual Verification

The exported ZIP file should contain:
- A **professionally formatted** XLSX file with TreasureHub branding
- All photos organized by listing in separate folders
- All videos organized by listing in separate folders
- Clean folder structure for easy navigation

The XLSX file should look **extremely professional**:
- **Poppins font** throughout (modern, clean)
- **Larger, readable text** (no squinting needed)
- **Bold, prominent headers** with gold background
- **Clean grid pattern** with visible borders
- **Light yellow highlight** on requirements row for easy identification
- **No wasted space** - no unnecessary empty rows
- **Proper hierarchy** - title → instructions → requirements → headers → data
- **Easy to read** with good contrast and spacing
- **Alternating row colors** make it easy to follow rows
- **Column widths** appropriate for content
- All required Facebook Marketplace fields present and correctly formatted
- Overall appearance: **Corporate-quality spreadsheet** suitable for business use

