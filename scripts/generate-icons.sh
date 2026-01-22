#!/bin/bash
# Generate PWA icons from SVG source
# Requires: ImageMagick (convert) or librsvg (rsvg-convert)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ICONS_DIR="$PROJECT_ROOT/apps/web/public/icons"
SVG_SOURCE="$ICONS_DIR/icon.svg"

# Icon sizes required for PWA
SIZES=(72 96 128 144 152 192 384 512)

echo "Generating PWA icons..."

# Check for available conversion tool
if command -v rsvg-convert &> /dev/null; then
    CONVERTER="rsvg-convert"
elif command -v convert &> /dev/null; then
    CONVERTER="imagemagick"
else
    echo "Error: Neither rsvg-convert nor ImageMagick found."
    echo "Install with: sudo apt install librsvg2-bin  OR  sudo apt install imagemagick"
    exit 1
fi

# Generate each size
for size in "${SIZES[@]}"; do
    output="$ICONS_DIR/icon-${size}x${size}.png"
    echo "  Creating $output..."

    if [ "$CONVERTER" = "rsvg-convert" ]; then
        rsvg-convert -w "$size" -h "$size" "$SVG_SOURCE" -o "$output"
    else
        convert -background none -resize "${size}x${size}" "$SVG_SOURCE" "$output"
    fi
done

# Generate Apple Touch Icon
echo "  Creating apple-touch-icon.png..."
if [ "$CONVERTER" = "rsvg-convert" ]; then
    rsvg-convert -w 180 -h 180 "$SVG_SOURCE" -o "$ICONS_DIR/apple-touch-icon.png"
else
    convert -background none -resize "180x180" "$SVG_SOURCE" "$ICONS_DIR/apple-touch-icon.png"
fi

# Generate favicon
echo "  Creating favicon.ico..."
if [ "$CONVERTER" = "rsvg-convert" ]; then
    rsvg-convert -w 32 -h 32 "$SVG_SOURCE" -o "$ICONS_DIR/favicon-32.png"
    rsvg-convert -w 16 -h 16 "$SVG_SOURCE" -o "$ICONS_DIR/favicon-16.png"
else
    convert -background none -resize "32x32" "$SVG_SOURCE" "$ICONS_DIR/favicon-32.png"
    convert -background none -resize "16x16" "$SVG_SOURCE" "$ICONS_DIR/favicon-16.png"
fi

# Create ICO file if ImageMagick available
if command -v convert &> /dev/null; then
    convert "$ICONS_DIR/favicon-16.png" "$ICONS_DIR/favicon-32.png" "$ICONS_DIR/../favicon.ico"
fi

# Generate shortcut icons
echo "  Creating shortcut icons..."
for shortcut in analyze history; do
    if [ "$CONVERTER" = "rsvg-convert" ]; then
        rsvg-convert -w 96 -h 96 "$SVG_SOURCE" -o "$ICONS_DIR/shortcut-${shortcut}.png"
    else
        convert -background none -resize "96x96" "$SVG_SOURCE" "$ICONS_DIR/shortcut-${shortcut}.png"
    fi
done

echo "Done! Icons generated in $ICONS_DIR"
echo ""
echo "Note: For best results, create custom icons in a design tool and replace these generated ones."
