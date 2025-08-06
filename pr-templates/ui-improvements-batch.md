# UI Improvements Batch

## Changelog

- **Newly Listed Badge**: Changed from 7 days to 72 hours for more accurate "new" item indication
  - Updated calculation from days to hours in listings page
  - More precise timing for "newly listed" status

- **AI Form Generation Status Bar**: Added progress indication to loading screen
  - Added progress bar showing Phase 1 completion (60%) and Phase 2 in progress
  - Updated status indicators with color-coded completion states
  - Green dots for completed tasks, gold pulsing for current task, gray for pending

- **AI Phase 1 JSON Output**: Updated to output capitalized values for product specifications
  - Modified AI prompt to explicitly request "CAPITALIZE" for color, material, pattern, and style
  - Updated examples to show capitalized values (e.g., "Blue" instead of "blue")
  - Improved data consistency across product specifications

- **Video Preview**: Made collapsible with show/hide functionality
  - Added `showVideoPreview` state for collapsible behavior
  - Added "+ Show" / "− Hide" button similar to video keyframes section
  - Removed "5 frames" comment from video preview section
  - Video preview now starts minimized and can be expanded on demand

- **AI Confidence Summaries**: Added comprehensive confidence scoring for product specifications
  - Added confidence scoring instructions to AI prompt
  - Defined confidence levels: High (clear visual evidence), Medium (reasonable inference), Low (limited information)
  - Added confidence scores structure to JSON output format
  - Included all product specification fields in confidence scoring
  - Added reasoning requirement for each confidence level

---

## Testing Instructions

1. Pull this branch.
2. Run `npm install` to ensure all dependencies are up to date.
3. Start the application with `npm run dev`.

### Test Newly Listed Badge
4. Navigate to `/listings` and verify "Newly Listed" badge appears only for items posted in last 72 hours.
5. Check that older items don't show the badge.

### Test AI Form Generation
6. Navigate to `/list-item` and start creating a new listing.
7. Upload photos and proceed to step 3 (AI generation).
8. Verify progress bar shows 60% completion with Phase 1/Phase 2 labels.
9. Confirm status indicators show proper color coding (green/gold/gray).

### Test AI Output Capitalization
10. Complete AI form generation and verify product specifications show capitalized values.
11. Check that color, material, pattern, and style fields are properly capitalized.

### Test Video Preview
12. Upload a video during listing creation.
13. Verify video preview section is minimized by default with "+ Show" button.
14. Click "+ Show" to expand video preview.
15. Click "− Hide" to collapse video preview.
16. Confirm "5 frames" comment is removed from video preview section.

### Test Confidence Scores
17. Complete AI form generation and verify confidence scores appear for all product specification fields.
18. Check that confidence levels (High/Medium/Low) are displayed with reasoning.
19. Verify confidence scores appear for: Age Group, Color, Material, Pattern, Style, Tags, etc. 