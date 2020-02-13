# Hot&Cold

Built for both Android and iOS, currently known to support Android only.

## Setup

Configure the following services:

- [MapBox](https://www.mapbox.com/).
- [Firebase](firebase.google.com).
- [Hot&Cold Server](https://github.com/DAB0mB/HotnCold-server).

Define environment variables in `.env.{ENV_NAME}` file (NEVER COMMIT):

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
    # Test phone number regexp for local testing
    TEST_PHONE_LOCAL
    # Phone number regexp for testing with phone
    TEST_PHONE_SMS
    # If specified, pressed notifications will remain
    PERSIST_NOTIFICATIONS
    # Use fake data for heatmap (long load time)
    FAKE_HEATMAP
    # Run app with Robot. Robot files will not be bundled if this var is provided
    USE_ROBOT
    # *Optional: The auth token of the user you would like to log-in with
    INITIAL_USER_TOKEN

To enable push notifications, download `google-services.json` file from Firebase console to `android/app` directory. Later on when there's official iOS support, you would also need to download a file called `GoogleService-Info.plist`. See [further instructions](https://support.google.com/firebase/answer/7015592?hl=en).

Run the following commands in series:

    $ yarn
    $ yarn codegen

Make sure you have a device connected with `adb devices`.

## Dev

Run the packager in one tab:

    $ yarn start

Trigger the app on a second tab:

    $ yarn android

You can also bundle a debug-apk file with warnings remaining (Android only, useful for troubleshooting issues). First, make sure that you have the following extension defined in your `android/app/build.gradle` file:

```gradle
project.ext.react = [
    // ...
    bundleInDebug: true
]
```

And then run the following:

    # Output: android/app/build/outputs/apk/debug/app-debug.apk
    $ yarn bundledebug
    $ android/gradlew assembleDebug

*Make sure to remove `bundleInDebug` option from your `build.gradle` file for continues work!*

## Test

### Hidden inputs

When signing-in, you can unlock test mode by spam-tapping on the country code field. At some point you it should turn into `-0`, which indicates you've just activated test mode successfully.

There's 2 methods to proceed from this point on: The first one is by filling-out the phone field with 0s, or you can select your country code and fill-out your real number. With the first method you won't receive any text message, authentication will only be done locally, and with the second method, you'll receive an actual text message. Either way, the verification code will appear on screen for testing purposes. Once you continue, the app should function normally; only difference you'll be able to see users-mocks only.

Each supported geographical area should have at least 1 user-mock that should be detectable on the map or by the radar.To get a feedback from a fake user when chatting with it, you can send the word `echo` to get a response. Alternatively, you can specify a delay time (in seconds) by concatenating a parameter e.g. `echo 5`.

### E2E

Hot&Cold uses [Firebase Test Lab](https://firebase.google.com/docs/test-lab/) in conjunction with an internal module called [Robot](./src/robot). The paradigm is that [Robo](https://firebase.google.com/docs/test-lab/android/robo-ux-test) (notice the lack of T), a tool that Firebase uses to simulate input on real Android devices, doesn't work with React-Native. This is because React-Native wraps native Android view elements in a unique way that is not accessible to Robo, hence Robot was created. See this [Meidum post](https://medium.com/@eytanmanor/4bc475f4bb2) about Bobcat (aka Robot) for further info.

RoboT scripts are located under the [`robot/scopes`](./src/robot/scopes) and have direct control over React elements. In addition to having Robot scripts, you need to record a [Robo script](https://firebase.google.com/docs/test-lab/android/robo-ux-test) with Android-Studio, so you can press native modals, such as alerts, date-time pickers, and permissions. *It's required* that the RoboT script will end end with any native modal, so it will be used as an anchor for Robo, otherwise the tests will be aborted mid-session.

Robot `.apk` can be assembled with `yarn assemble robot` and it will override the `app-release.apk` file.

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
