package com.hotncold;

import android.app.Application;
import android.content.Context;
import com.facebook.react.modules.i18nmanager.I18nUtil;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import org.devio.rn.splashscreen.SplashScreenReactPackage;
import com.hotncold.patches.ReactNativeWheelPickerPackage;
import com.mapbox.rctmgl.RCTMGLPackage;
import com.reactnativecommunity.clipboard.ClipboardPackage;
import com.reactnativecommunity.art.ARTPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import io.invertase.firebase.notifications.RNFirebaseNotificationsPackage;
import io.invertase.firebase.RNFirebasePackage;
import io.invertase.firebase.messaging.RNFirebaseMessagingPackage;
import com.reactnativecommunity.rnpermissions.RNPermissionsPackage;
import br.com.dopaminamob.gpsstate.GPSStatePackage;
import com.BV.LinearGradient.LinearGradientPackage;
import com.agontuk.RNFusedLocation.RNFusedLocationPackage;
import im.shimo.react.cookie.CookieManagerPackage;
import com.imagepicker.ImagePickerPackage;
import com.lugg.ReactNativeConfig.ReactNativeConfigPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import com.swmansion.reanimated.ReanimatedPackage;
import com.swmansion.rnscreens.RNScreensPackage;
import com.swmansion.gesturehandler.react.RNGestureHandlerPackage;

import java.lang.reflect.InvocationTargetException;
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
          new ClipboardPackage(),
          new SplashScreenReactPackage(),
          new ReactNativeWheelPickerPackage(),
          new RCTMGLPackage(),
          new ARTPackage(),
          new VectorIconsPackage(),
          new RNFirebasePackage(),
          new RNFirebaseNotificationsPackage(),
          new RNFirebaseMessagingPackage(),
          new RNPermissionsPackage(),
          new GPSStatePackage(),
          new LinearGradientPackage(),
          new RNFusedLocationPackage(),
          new CookieManagerPackage(),
          new ImagePickerPackage(),
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

    // FORCE LTR
    I18nUtil sharedI18nUtilInstance = I18nUtil.getInstance();
    sharedI18nUtilInstance.allowRTL(getApplicationContext(), false);

    SoLoader.init(this, /* native exopackage */ false);
    initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
  }

  /**
   * Loads Flipper in React Native templates. Call this in the onCreate method with something like
   * initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
   *
   * @param context
   * @param reactInstanceManager
   */
  private static void initializeFlipper(
      Context context, ReactInstanceManager reactInstanceManager) {
    if (BuildConfig.DEBUG) {
      try {
        /*
         We use reflection here to pick up the class that initializes Flipper,
        since Flipper library is not available in release mode
        */
        Class<?> aClass = Class.forName("com.hotncold.ReactNativeFlipper");
        aClass
            .getMethod("initializeFlipper", Context.class, ReactInstanceManager.class)
            .invoke(null, context, reactInstanceManager);
      } catch (ClassNotFoundException e) {
        e.printStackTrace();
      } catch (NoSuchMethodException e) {
        e.printStackTrace();
      } catch (IllegalAccessException e) {
        e.printStackTrace();
      } catch (InvocationTargetException e) {
        e.printStackTrace();
      }
    }
  }
}
