#!/bin/bash

BUNDLE_OUTPUT=./android/app/build/generated/assets/react/debug/index.android.bundle
ASSETS_DEST=./android/app/build/generated/res/react/debug

install -Dv /dev/null $BUNDLE_OUTPUT
mkdir -p $ASSETS_DEST
react-native bundle --dev false --platform android --entry-file index.js --bundle-output $BUNDLE_OUTPUT --assets-dest $ASSETS_DEST
