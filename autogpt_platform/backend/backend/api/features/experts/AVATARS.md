# Expert avatars: professional portraits

## One identity per Expert

`avatar_catalog.json` lists the 33 built-in Experts, General and Otto. Each identity has one portrait under `/experts/professional/`, used at every display size. The catalog test checks frontend/backend parity and opens each image. Otto uses `office-assistant.webp`; his separate transparent email artwork is not an expert portrait. The saved URL determines the image, not the name, role or active filter.

## Palette

`palette` carries the registry's material anchors: Marketing terracotta `#C47F5C`, Sales ochre `#C9A35B`, Finance sage `#A5B09A`, Support muted coral `#CB9182`, Operations slate blue `#98AFC6`, Research olive `#AAA77A`, Content muted teal `#81AAA6`, Development charcoal `#777570`, General warm stone `#B5ADA0`, and Otto's reserved mineral lavender `#B6A4C8`, which no specialist may use. The eight stored category values are unchanged; `general` and `otto` exist only in the appearance registry.

## Legacy defaults and seeding

`legacy` maps retired roster SVGs, Notion defaults, clay sheets, transparent cutouts and versioned tiles to their replacements. PNG/WebP sizes share the legacy 128 px lookup key. Shared category sheets and unknown Notion picks resolve to General; uploads and generated URLs pass through unchanged, even with a built-in filename. A failed portrait shows initials, not another face.

API reads and the shared renderer resolve saved URLs without a database migration. Next.js also redirects direct requests for cataloged legacy paths. The roster seed updates a hired copy only if its URL was one of its source template's defaults.

## Custom Experts

The raise flow offers a ready-made professional portrait from the selected category without calling the image provider. Confirmation saves the displayed `/experts/professional/<identity>.webp` URL. Chat proposals and requests without a selected avatar use the dedicated General portrait. Regeneration and upload are optional: the current preview can be kept while a generation is pending or if it fails. From the Team page the owner can keep the saved appearance, upload a picture (PNG/JPEG/WebP, 5 MB), or generate a new candidate.

## Generation

`ExpertAvatarRequest` keeps the existing fields, accepted values and defaults. The category (`general` by default) supplies work context for clothing or a prop; `expression` and `tilt` guide the face and pose. Legacy `shape`, `base` and `inlay` values remain valid but do not affect the portrait.

Every image edit includes the Maria, Mina and Devon WebPs from `frontend/public/experts/professional/`, copied into `avatar_references/` so the backend does not need a frontend checkout at runtime. The provider uses them for illustration style and framing, not identity: each candidate should depict a distinct adult in a close head-and-shoulders portrait. The provider-request test compares the uploaded files to the marketplace originals byte for byte.

Set `EXPERT_AVATAR_BASE_URL`, `EXPERT_AVATAR_API_KEY` and `EXPERT_AVATAR_MODEL` in `backend/.env` to select an image provider without changing chat credentials. Only when both dedicated connection settings are empty does generation use `OPENAI_BASE_URL` and `OPENAI_API_KEY`. Restart the backend after configuration changes. The gateway must support `/images/edits` with multiple WebP references. The server requests one 1024 px opaque PNG at medium quality, checks format, dimensions, the 5 MB limit, opacity and visible artwork, and downsamples larger square responses up to 2048 px to 1024 px. Generation uploads a preview; it does not update the Expert or add an identity to the library.

## Before release

Deploy the portrait files and both catalogs together. Run the roster seed if stored defaults should be refreshed as well. Confirm a real provider request with deployment credentials and the pinned model, then an authenticated create/edit flow; automated tests mock the provider.
