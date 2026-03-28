#!/bin/bash
# AutoHue Site — Safe Deploy Script
# Builds clean _site directory and runs smoke tests after deployment
set -e

SITE_URL="https://autohue.app"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "═══════════════════════════════════════"
echo "  AutoHue Site — Safe Deploy"
echo "═══════════════════════════════════════"
echo ""

# ── Step 1: Validate files exist ──
echo -e "${YELLOW}[1/4] Checking required files...${NC}"
REQUIRED=("index.html" "checkout/index.html" "checkout/success/index.html" "checkout/cancel/index.html" "checkout/credits/index.html")
MISSING=0
for f in "${REQUIRED[@]}"; do
  if [ -f "$f" ]; then
    echo -e "  ${GREEN}✓${NC} ${f}"
  else
    echo -e "  ${RED}✗${NC} ${f} MISSING"
    MISSING=$((MISSING + 1))
  fi
done
if [ $MISSING -gt 0 ]; then
  echo -e "${RED}✗ ${MISSING} required files missing. Aborting.${NC}"
  exit 1
fi
echo ""

# ── Step 2: Build clean _site ──
echo -e "${YELLOW}[2/4] Building _site directory...${NC}"
rm -rf _site
mkdir -p _site
cp index.html _site/
cp -r checkout _site/
cp favicon.svg favicon-32.png apple-touch-icon.png og-image.png logo.svg _site/ 2>/dev/null || true
cp _redirects _site/ 2>/dev/null || true
FILE_COUNT=$(find _site -type f | wc -l)
echo -e "  ${GREEN}✓${NC} ${FILE_COUNT} files in _site/"
echo ""

# ── Step 3: Deploy ──
echo -e "${YELLOW}[3/4] Deploying to Cloudflare Pages...${NC}"
npx wrangler pages deploy _site --project-name=autohue-site --branch=master 2>&1 | tail -3
echo ""

# ── Step 4: Smoke test ──
echo -e "${YELLOW}[4/4] Running smoke tests...${NC}"
sleep 5
PAGES=(
  "/"
  "/checkout/"
  "/checkout/credits/"
  "/checkout/success/"
  "/checkout/cancel/"
)
FAILED=0
for page in "${PAGES[@]}"; do
  STATUS=$(curl -sL -o /dev/null -w "%{http_code}" "${SITE_URL}${page}" 2>/dev/null)
  if [ "$STATUS" = "200" ]; then
    echo -e "  ${GREEN}✓${NC} ${page} → ${STATUS}"
  else
    echo -e "  ${RED}✗${NC} ${page} → ${STATUS}"
    FAILED=$((FAILED + 1))
  fi
done

# Content checks
PRICING=$(curl -sL "${SITE_URL}/" 2>/dev/null | grep -c "billing-toggle")
if [ "$PRICING" -gt 0 ]; then
  echo -e "  ${GREEN}✓${NC} Pricing toggle present"
else
  echo -e "  ${RED}✗${NC} Pricing toggle missing from homepage"
  FAILED=$((FAILED + 1))
fi

CHECKOUT=$(curl -sL "${SITE_URL}/checkout/" 2>/dev/null | grep -c "PayPal")
if [ "$CHECKOUT" -gt 0 ]; then
  echo -e "  ${GREEN}✓${NC} PayPal button on checkout"
else
  echo -e "  ${RED}✗${NC} PayPal button missing from checkout"
  FAILED=$((FAILED + 1))
fi

echo ""
if [ $FAILED -gt 0 ]; then
  echo -e "${RED}═══════════════════════════════════════${NC}"
  echo -e "${RED}  ✗ ${FAILED} SMOKE TEST(S) FAILED${NC}"
  echo -e "${RED}═══════════════════════════════════════${NC}"
  exit 1
else
  echo -e "${GREEN}═══════════════════════════════════════${NC}"
  echo -e "${GREEN}  ✓ All pages healthy after deploy${NC}"
  echo -e "${GREEN}═══════════════════════════════════════${NC}"
fi
