# Hot&Cold

Built for both Android and iOS, currently known to support Android only.

## Setup

Configure the following services:

- [MapBox](https://www.mapbox.com/).
- [Hot&Cold Server](https://github.com/DAB0mB/HotnCold-server).

Define environment variables in `.env` file (NEVER COMMIT):

    # A public access token to MapBox's API
    MAPBOX_ACCESS_TOKEN
    # The map style URL given by MapBox's API
    MAPBOX_STYLE_URL
    # The name of the Bluetooth service that will be created by Hot&Cold
    BLUETOOTH_ADAPTER_NAME
    # URL to Hot&Cold's server
    SERVER_URI
    # URL to Hot&Cold's server GraphQL endpoint
    GRAPHQL_ENDPOINT
    # *Optional: The auth token of the user we would like to log-in with
    INITIAL_USER_TOKEN

Run the following commands in series:

    $ yarn
    $ yarn codegen

Make sure you have a device connected with `adb devices`.

## Dev

Run the packager in one tab:

    $ yarn start

Trigger the app on a second tab:

    $ yarn android

## Test

Create a new user or edit the user's profile name to be `__TEST__` and you should be able to see at least one fake user on the map and on the radar. To get a feedback from a fake user when chatting with it, you can send the word `echo` to get a response. Alternatively, you can specify a delay time (in seconds) by concatenating a parameter e.g. `echo 5`.

## Prod

First, follow these instructions:

- [Generate an upload key](https://facebook.github.io/react-native/docs/signed-apk-android#generating-an-upload-key).
- [Setup gradle variables](https://facebook.github.io/react-native/docs/signed-apk-android#setting-up-gradle-variables).
- [Add signing config to gradle config](https://facebook.github.io/react-native/docs/signed-apk-android#adding-signing-config-to-your-apps-gradle-config).

Assemble an `.apk` file:

    # Output: android/app/build/outputs/apk/release/app-release.apk
    $ android/gradlew assembleRelease

The app can be distributed as is or installed with `adb`:

    $ adb install <path>
