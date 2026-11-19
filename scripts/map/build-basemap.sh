#!/usr/bin/env bash
# Gera o basemap do Sentinela: recorte PMTiles de João Pessoa + Cabedelo a partir
# de um build diário da Protomaps (dados © OpenStreetMap, ODbL) e as fontes de
# rótulo usadas pelo estilo. Tudo é servido pelo próprio app em public/map/.
#
# Uso: scripts/map/build-basemap.sh [YYYYMMDD]
# Regenerar só por decisão de plano: cada versão fica no histórico do git.
set -euo pipefail

BUILD_DATE="${1:-20261118}"
PMTILES_VERSION="1.31.2"
# Igual ao digest que o GitHub registra no asset da release.
PMTILES_SHA256="3ed7dbf4ec2e6dfe5e25b6f70d1ffc932729f93c86db353bf514dd71010a312f"
ASSETS_COMMIT="028c18f713baecad011301ff7a69acc39bcc2ae7" # protomaps/basemaps-assets
# Limites de JP + Cabedelo (malha IBGE da migration 20261001185320) com ~3 km de margem.
BBOX="-35.00,-7.28,-34.76,-6.93"
MAXZOOM=15
MAX_BYTES=$((30 * 1024 * 1024))

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUT_DIR="$ROOT/public/map"
CONST_FILE="$ROOT/src/lib/map/basemap-file.ts"
FONT_SUMS="$ROOT/scripts/map/fonts.sha256"
NAME="jp-cabedelo-$BUILD_DATE.pmtiles"
SOURCE_URL="https://build.protomaps.com/$BUILD_DATE.pmtiles"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "→ go-pmtiles $PMTILES_VERSION"
tarball="go-pmtiles_${PMTILES_VERSION}_Linux_x86_64.tar.gz"
curl -fsSL -o "$WORK/$tarball" \
  "https://github.com/protomaps/go-pmtiles/releases/download/v$PMTILES_VERSION/$tarball"
echo "$PMTILES_SHA256  $WORK/$tarball" | sha256sum -c --quiet -
tar -xzf "$WORK/$tarball" -C "$WORK" pmtiles

echo "→ recorte $BBOX (z0–$MAXZOOM) de $SOURCE_URL"
"$WORK/pmtiles" extract "$SOURCE_URL" "$WORK/$NAME" --bbox="$BBOX" --maxzoom="$MAXZOOM"
size=$(stat -c %s "$WORK/$NAME")
if (( size > MAX_BYTES )); then
  echo "✗ $NAME tem $size bytes (> 30 MB). Reduza MAXZOOM e registre no plano." >&2
  exit 1
fi

echo "→ fontes (basemaps-assets@$ASSETS_COMMIT)"
mkdir -p "$WORK/fonts"
while read -r _ path; do
  mkdir -p "$WORK/$(dirname "$path")"
  url_path="${path#fonts/}"
  curl -fsSL -o "$WORK/$path" \
    "https://raw.githubusercontent.com/protomaps/basemaps-assets/$ASSETS_COMMIT/fonts/${url_path// /%20}"
done < "$FONT_SUMS"
(cd "$WORK" && sha256sum -c --quiet "$FONT_SUMS")

echo "→ instalando em public/map/"
mkdir -p "$OUT_DIR"
find "$OUT_DIR" -maxdepth 1 -name 'jp-cabedelo-*.pmtiles' ! -name "$NAME" -delete
rm -rf "$OUT_DIR/fonts"
cp "$WORK/$NAME" "$OUT_DIR/$NAME"
cp -r "$WORK/fonts" "$OUT_DIR/fonts"
sha=$(sha256sum "$OUT_DIR/$NAME" | cut -d' ' -f1)

cat > "$CONST_FILE" <<TS
// Gerado por scripts/map/build-basemap.sh — não editar à mão.
export const BASEMAP_FILE = "/map/$NAME";
TS

cat > "$OUT_DIR/ATTRIBUTION.md" <<MD
# Basemap do Sentinela

Contém dados do © OpenStreetMap contributors, disponíveis sob a Open Database
License (ODbL) 1.0: https://www.openstreetmap.org/copyright.
Este arquivo é um recorte (banco de dados derivado) e é oferecido sob a mesma
licença. Tiles gerados pelo projeto Protomaps (https://protomaps.com), fontes
Noto Sans (SIL OFL 1.1) via protomaps/basemaps-assets.

| Campo | Valor |
|---|---|
| Arquivo | \`$NAME\` |
| Origem | $SOURCE_URL |
| Ferramenta | go-pmtiles $PMTILES_VERSION |
| BBox (lon/lat) | $BBOX |
| Zoom | 0–$MAXZOOM |
| Tamanho | $size bytes |
| SHA-256 | \`$sha\` |
| Fontes | basemaps-assets@$ASSETS_COMMIT (ver scripts/map/fonts.sha256) |

Regenerar: \`scripts/map/build-basemap.sh [YYYYMMDD]\`.
MD

echo "✓ $NAME ($size bytes, sha256 $sha)"
