# CLAUDE.md

Static one-page site, no build step. Read README.md first; it has the data format, scoring rules, platforms per country and known limits.

- User-facing text is Korean. Reply to the user in Korean.
- Daily content lives only in `data.js`; keep rendering logic in `app.js` and styles in `styles.css`.
- Colors are tokens on `:root` with dark-mode overrides under `prefers-color-scheme` and `[data-theme]`; add new colors as tokens in all three blocks.
- Scoring: 화제성/파급력/시의성/지속성 each /10, averaged; drop items under 6.0 into the country's `cut` list. Max 10 per field.
- Never present scores as measured SNS volume; they are judgments based on cited sources. Every item needs a source key in `S`.
- 문화·사회 should favor what 10~20대 are just starting to like (KR: Reels/Threads, JP: X/TikTok) and set the 7th arg to 1 for those.
