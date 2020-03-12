// Source: react-native-wheel-datepicker
package com.hotncold.patches;

import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Shader;
import com.facebook.react.bridge.ReactContext;

public class ReactWheelCurvedPicker extends com.zyu.ReactWheelCurvedPicker {
    public ReactWheelCurvedPicker(ReactContext reactContext) {
        super(reactContext);
    }

    @Override
    protected void drawForeground(Canvas canvas) {
        super.drawForeground(canvas);

        Paint paint = new Paint();
        paint.setColor(Color.WHITE);
        int colorFrom = 0x00FFFFFF;
        int colorTo = 0xFFEC58AE;
        LinearGradient linearGradientShader = new LinearGradient(rectCurItem.left, rectCurItem.top, rectCurItem.right/2, rectCurItem.top, colorFrom, colorTo, Shader.TileMode.MIRROR);
        paint.setShader(linearGradientShader);
        canvas.drawLine(rectCurItem.left, rectCurItem.top, rectCurItem.right, rectCurItem.top, paint);
        canvas.drawLine(rectCurItem.left, rectCurItem.bottom, rectCurItem.right, rectCurItem.bottom, paint);
    }
}
