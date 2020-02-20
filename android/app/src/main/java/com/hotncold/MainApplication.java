package com.hotncold;

import android.app.Application;

import com.facebook.react.ReactApplication;
import com.oblador.vectoricons.VectorIconsPackage;
import io.invertase.firebase.notifications.RNFirebaseNotificationsPackage;
import io.invertase.firebase.RNFirebasePackage;
import io.invertase.firebase.messaging.RNFirebaseMessagingPackage;
import com.marianhello.bgloc.react.BackgroundGeolocationPackage;
import com.reactnativecommunity.rnpermissions.RNPermissionsPackage;
import de.patwoz.rn.bluetoothstatemanager.RNBluetoothStateManagerPackage;
import br.com.dopaminamob.gpsstate.GPSStatePackage;
import com.BV.LinearGradient.LinearGradientPackage;
import com.agontuk.RNFusedLocation.RNFusedLocationPackage;
import com.reactnativecommunity.asyncstorage.AsyncStoragePackage;
import im.shimo.react.cookie.CookieManagerPackage;
import com.imagepicker.ImagePickerPackage;
import it.innove.BleManagerPackage;
import com.himelbrand.ble.peripheral.RNBLEPackage;
import com.mapbox.rctmgl.RCTMGLPackage;
import com.lugg.ReactNativeConfig.ReactNativeConfigPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import com.swmansion.reanimated.ReanimatedPackage;
import com.swmansion.rnscreens.RNScreensPackage;
import com.swmansion.gesturehandler.react.RNGestureHandlerPackage;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {
  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
            new VectorIconsPackage(),
            new RNFirebasePackage(),
            new RNFirebaseNotificationsPackage(),
            new RNFirebaseMessagingPackage(),
            new BackgroundGeolocationPackage(),
            new RNPermissionsPackage(),
            new RNBluetoothStateManagerPackage(),
            new GPSStatePackage(),
            new LinearGradientPackage(),
            new RNFusedLocationPackage(),
            new AsyncStoragePackage(),
            new CookieManagerPackage(),
            new ImagePickerPackage(),
            new BleManagerPackage(),
            new RNBLEPackage(),
          new RCTMGLPackage(),
          new ReactNativeConfigPackage(),
          new ReanimatedPackage(),
          new RNGestureHandlerPackage(),
          new RNScreensPackage()
      );
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
  }
}
