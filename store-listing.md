# Pullhub Chrome Web Store Listing Draft

## Short Description
Save visual references into boards and push them to Google Slides.

## Detailed Description
Pullhub helps designers, creatives, marketers, and researchers collect visual references while browsing and turn them into presentation-ready Google Slides.

Use Pullhub to save images into boards, capture selected areas of a page, organize references by project, export ZIP backups, and push curated boards directly into Google Slides with automatic layout.

Core features:
- Save images from webpages into visual boards
- Capture screenshots and selected page areas
- Push boards to current, selected, or new Google Slides
- Organize references with board colors and notes
- Export and import ZIP backups
- Optional board sharing
- Light and dark appearance modes

Free plan limits are designed for trying the workflow. Pullhub Pro unlocks unlimited boards, captures, and sharing.

## Permission Justification
- `contextMenus`: Adds right-click save and push actions.
- `tabs`: Detects active Google Slides tabs and current page context.
- `activeTab`: Captures or interacts with the current user-selected page.
- `storage`: Stores boards, settings, and local extension state.
- `scripting`: Injects capture and floating widget scripts when the user requests those features.
- `notifications`: Shows success/error messages for capture and push actions.
- `identity`: Signs users into Google for Slides and Drive integration.
- `sidePanel`: Provides the Pullhub side panel experience.
- `downloads`: Exports board backups as ZIP files.
- `<all_urls>`: Allows users to save references and capture content from the pages they choose.

## Suggested Category
Productivity or Workflow & Planning

## Support Email
support@debutt.studio
