#!/bin/bash
# Run once to create placeholder icons. Replace with proper PNGs before production.
# Usage: bash generate-icons.sh
# Requires: Inkscape or rsvg-convert (or just design your icons manually)

mkdir -p static/icons

cat > /tmp/mindre-icon.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#000000"/>
  <!-- Terminal border -->
  <rect x="32" y="32" width="448" height="448" rx="24" fill="none" stroke="#00e676" stroke-width="8"/>
  <!-- ~/m text -->
  <text x="80" y="200" font-family="monospace" font-size="80" fill="#3d3d3d">~/</text>
  <text x="80" y="300" font-family="monospace" font-size="120" font-weight="bold" fill="#00e676">m</text>
  <!-- Cursor -->
  <rect x="360" y="230" width="24" height="80" fill="#00e676" opacity="0.9"/>
</svg>
EOF

echo "Created SVG icon template at /tmp/mindre-icon.svg"
echo ""
echo "To convert to PNG (requires ImageMagick):"
echo "  convert -background none /tmp/mindre-icon.svg -resize 192x192 static/icons/icon-192.png"
echo "  convert -background none /tmp/mindre-icon.svg -resize 512x512 static/icons/icon-512.png"
echo ""
echo "Or use https://realfavicongenerator.net/ with the SVG."
