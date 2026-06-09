# Pullhub Launch Checklist

## Website
- Publish `index.html`, `privacy.html`, `terms.html`, and `support.html`.
- Use `debutt.studio` or a subpath/subdomain such as `debutt.studio/pullhub`.
- Add the privacy policy URL to Chrome Web Store Developer Dashboard.

## Google Cloud
- OAuth consent screen app name: Pullhub.
- Support email: support@debutt.studio.
- Authorized domain: debutt.studio.
- Chrome extension OAuth client should use the final Chrome Web Store extension ID.
- Keep a separate development OAuth client for unpacked testing if the unpacked ID differs.

## Firebase
- Confirm Firestore rules match intended sharing behavior.
- If Firebase Auth federated sign-in is used, add the final Chrome extension ID / authorized domain required by Firebase.
- Keep development and production IDs documented.

## ExtensionPay
- Product name: Pullhub.
- Trial: 14 days.
- Recommended plans: USD 6.99 monthly, USD 60 annual.
- If changing the ExtensionPay ID from `smart-reference`, verify migration/subscription continuity before changing code.

## Chrome Web Store
- Upload `pullhub-webstore.zip`.
- Add store icon and screenshots.
- Add homepage, privacy policy, and support links.
- Fill data practices consistently with the privacy policy.
- Explain why `<all_urls>` is needed for user-selected saving and capture.

## Before Publish
- Test Google sign-in with the final extension ID.
- Test push to Google Slides.
- Test Drive fallback upload.
- Test screenshot capture.
- Test ZIP export/import.
- Test paid/trial state.
- Test board sharing if enabled.
