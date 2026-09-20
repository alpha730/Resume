# Card face videos

One looping video per carousel card. Drop a file in here with the exact
name below and it is picked up automatically — no code change needed.

| File                        | Card            |
| --------------------------- | --------------- |
| card-01-about.mp4           | ABOUT           |
| card-02-education.mp4       | EDUCATION       |
| card-03-skills.mp4          | SKILLS          |
| card-04-projects.mp4        | PROJECTS        |
| card-05-certifications.mp4  | CERTIFICATIONS  |
| card-06-experience.mp4      | EXPERIENCE      |
| card-07-contact.mp4         | CONTACT         |

A card with no file falls back to a plain dark face.

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
