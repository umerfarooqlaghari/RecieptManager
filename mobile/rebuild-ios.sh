#!/bin/bash
# Rebuild the iOS simulator app with native modules matching package.json.
# Builds to /tmp to avoid iCloud Desktop xattr CodeSign failures.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

DERIVED="${DERIVED_DATA_PATH:-/tmp/ExpenseManager-DerivedData}"
UDID="${SIMULATOR_UDID:-}"
BUNDLE_ID="com.umerfarooqlaghari.expensemanager"

if [ -z "$UDID" ]; then
  UDID="$(xcrun simctl list devices booted | awk -F'[()]' '/iPhone/{print $2; exit}')"
fi
if [ -z "$UDID" ]; then
  echo "No booted simulator. Boot one first (e.g. open -a Simulator)."
  exit 1
fi

echo "→ Ensuring CocoaPods match JS deps..."
cd ios
COCOAPODS_DISABLE_STATS=1 pod install
cd ..

echo "→ Building for simulator $UDID (derived data: $DERIVED)..."
cd ios
xcodebuild \
  -workspace ExpenseManager.xcworkspace \
  -scheme ExpenseManager \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination "platform=iOS Simulator,id=$UDID" \
  -derivedDataPath "$DERIVED" \
  ONLY_ACTIVE_ARCH=YES \
  COMPILER_INDEX_STORE_ENABLE=NO \
  build
cd ..

APP="$DERIVED/Build/Products/Debug-iphonesimulator/ExpenseManager.app"
echo "→ Installing $APP"
xcrun simctl uninstall "$UDID" "$BUNDLE_ID" 2>/dev/null || true
xcrun simctl install "$UDID" "$APP"
xcrun simctl launch "$UDID" "$BUNDLE_ID"
echo "✅ Done. Start Metro with: npx expo start --dev-client"
