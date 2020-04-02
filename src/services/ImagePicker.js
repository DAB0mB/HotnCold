import React, { createContext, useContext, useCallback, useMemo } from 'react';
import ImagePicker from 'react-native-image-picker';

import { useAlertError } from './DropdownAlert';
import { empty, noop } from '../utils';

const ImagePickerContext = createContext(null);

export const ImagePickerProvider = ({ imagePicker = ImagePicker, children }) => {
  return (
    <ImagePickerContext.Provider value={imagePicker}>
      {children}
    </ImagePickerContext.Provider>
  );
};

export const useImagePicker = (defaultOptions, defaultCallback) => {
  if (typeof defaultOptions == 'function') {
    defaultCallback = defaultOptions;
    defaultOptions = empty;
  }

  if (!defaultOptions) {
    defaultOptions = empty;
  }

  if (!defaultCallback) {
    defaultCallback = noop;
  }

  const imagePicker = useContext(ImagePickerContext);
  const alertError = useAlertError();

  const createImagePickerHandler = useCallback((callback = defaultCallback) => (res) => {
    if (res.error) return alertError(res.error);

    if (res.uri) {
      callback(res);
    }
  }, [defaultCallback, alertError]);

  const createOptions = useCallback((options = {}) => {
    return {
      noData: true,
      ...defaultOptions,
      ...options,
    };
  }, [...Object.values(defaultOptions)]);

  return useMemo(() => ({
    showImagePicker(options, callback) {
      imagePicker.showImagePicker(createOptions(options), createImagePickerHandler(callback));
    },

    launchCamera(options, callback) {
      imagePicker.launchCamera(createOptions(options), createImagePickerHandler(callback));
    },

    launchImageLibrary(options, callback) {
      imagePicker.launchImageLibrary(createOptions(options), createImagePickerHandler(callback));
    },
  }), [imagePicker, createImagePickerHandler, createOptions]);
};
