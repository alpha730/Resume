# Card face videos

One looping video per carousel card. Drop a file in here with the exact
name below and it is picked up automatically — no code change needed.

Current mapping (see `CARD_VIDEOS` in `src/CardCarousel.tsx`):

| Card            | Source                |
| --------------- | --------------------- |
| ABOUT           | hosted clip           |
| EDUCATION       | `EDUCATION.mp4`       |
| SKILLS          | `SKILLS.mp4`          |
| PROJECTS        | hosted clip           |
| CERTIFICATIONS  | hosted clip           |
| EXPERIENCE      | hosted clip           |
| CONTACT         | `conact.mp4`          |

To move a card onto a local file, add the file here and swap its entry
in `CARD_VIDEOS` to `local('<filename>.mp4')`.

## Specs

- MP4, H.264, `yuv420p`, `+faststart`
- 1024x640 (cards are 1.5925:1 and center-cropped via `object-cover`)
- 4-8s, seamlessly looping
- No audio track
- Under ~1 MB each; all seven load at once

```
ffmpeg -i input.mp4 \
  -vf "scale=1024:640:force_original_aspect_ratio=increase,crop=1024:640" \
  -c:v libx264 -profile:v main -pix_fmt yuv420p -crf 28 -an \
  -movflags +faststart card-01-about.mp4
```
