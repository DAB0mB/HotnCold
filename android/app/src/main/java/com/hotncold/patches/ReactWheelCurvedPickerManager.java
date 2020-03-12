// Source: react-native-wheel-datepicker
package com.hotncold.patches;

import android.graphics.Color;

import com.facebook.react.uimanager.ThemedReactContext;

public class ReactWheelCurvedPickerManager extends com.zyu.ReactWheelCurvedPickerManager {
    private static final int DEFAULT_TEXT_SIZE = 25 * 2;
    private static final int DEFAULT_ITEM_SPACE = 14 * 2;

    @Override
    protected ReactWheelCurvedPicker createViewInstance(ThemedReactContext reactContext) {
        ReactWheelCurvedPicker picker = new ReactWheelCurvedPicker(reactContext);
        picker.setTextColor(Color.LTGRAY);
        picker.setCurrentTextColor(Color.WHITE);
        picker.setTextSize(DEFAULT_TEXT_SIZE);
        picker.setItemSpace(DEFAULT_ITEM_SPACE);

        return picker;
    }
}
