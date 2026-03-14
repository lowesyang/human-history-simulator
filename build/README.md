# Build Resources

This directory contains app icons for Electron packaging.

## Required files

- `icon.png` — 512x512 PNG (Linux, source for conversion)
- `icon.icns` — macOS icon (generate with `iconutil` or `png2icns`)
- `icon.ico` — Windows icon (generate with ImageMagick or online converter)

## Generate platform icons from PNG

```bash
# macOS: convert PNG to icns
mkdir icon.iconset
sips -z 16 16 icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32 icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32 icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64 icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128 icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256 icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256 icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512 icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512 icon.png --out icon.iconset/icon_512x512.png
cp icon.png icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset
rm -rf icon.iconset

# Windows: convert PNG to ico (requires ImageMagick)
convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```
