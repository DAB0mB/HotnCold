import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, Dimensions, TextInput, TouchableWithoutFeedback } from 'react-native';
import CountryPicker, { LIGHT_THEME as SuperCountryPickerTheme } from 'react-native-country-picker-modal';
import { TextInputMask } from 'react-native-masked-text';
import { RaisedTextButton } from 'react-native-material-buttons';
import { useRobot } from 'hotncold-robot';

import Auth from '../containers/Auth';
import { HEIGHT as HEADER_HEIGHT } from '../containers/Auth/Header';
import { useRequestSignIn } from '../services/Auth';
import { useAlertError } from '../services/DropdownAlert';
import { useNavigation } from '../services/Navigation';
import { colors, hexToRgba } from '../theme';
import { validatePhone } from '../utils';

const CountryPickerTheme = {
  ...SuperCountryPickerTheme,
  backgroundColor: colors.lightGray,
  primaryColorVariant: colors.gray,
};

const COUNTRIES = ['US', 'IL', 'KR'];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    maxHeight: Dimensions.get('window').height - (HEADER_HEIGHT * 2),
  },
  instructions: {
    textAlign: 'center',
  },
  inputsContainer: {
    marginTop: 20,
  },
  countryPickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
    borderBottomWidth: 1,
  },
  countryPicker: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center'
  },
  countryPickerArrow: {
    color: 'black',
  },
  phoneContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'stretch',
    marginTop: 10,
  },
  ccode: {
    padding: 0,
    marginRight: 10,
    borderBottomWidth: 1,
  },
  ccodeText: {
    color: 'black',
    fontSize: 15,
    padding: 0,
    minWidth: 50,
  },
  localPhone: {
    padding: 0,
    borderBottomWidth: 1,
  },
  localPhoneText: {
    fontSize: 15,
    minWidth: 150,
    padding: 0,
  },
  smsNote: {
    alignSelf: 'flex-start',
    marginTop: 10,
    fontSize: 10,
  },
});

export const $Phone = Symbol('Phone');

const Phone = () => {
  const { useTrap } = useRobot();
  const authNav = useNavigation(Auth);
  const alertError = useAlertError();
  const [loading, setLoading] = useState(false);
  const [testing, setTestState] = useState(false);
  const ccodePrefix = useMemo(() => testing ? '-' : '+', [testing]);
  const [localPhone, setLocalPhone] = useState('');
  const [country, setCountry] = useState(null);
  const callingCode = useMemo(() =>
    (country && country.callingCode.length) ? `${ccodePrefix}${country.callingCode[0]}` : ''
  , [country, ccodePrefix]);
  const phone = useMemo(() => `${callingCode}${localPhone.replace(/[^\d]/g, '')}`, [callingCode, localPhone]);
  const isPhoneValid = useMemo(() => validatePhone(phone), [phone]);
  const [ccodeTapCount, setCcodeTapCount] = useState(0);
  const [countryPickerOpened, setCountryPickerOpened] = useState(false);
  const superRequestSignIn = useRequestSignIn(phone, {
    onCompleted: useCallback((contract) => {
      setLoading(false);

      const didBlurListener = authNav.addListener('didBlur', () => {
        didBlurListener.remove();
        setLocalPhone('');
        setCountry(null);
        setTestState(false);
      });

      authNav.push('Verify', {
        phone: `+${phone.slice(1)}`,
        contract,
      });
    }, [authNav, phone]),
    onError: useCallback((error) => {
      setLoading(false);

      alertError(error);
    }, [alertError]),
  });

  const requestSignIn = useCallback(() => {
    if (loading) return;

    setLoading(true);

    superRequestSignIn();
  }, [loading, superRequestSignIn]);

  useEffect(() => {
    if (!ccodeTapCount) return;

    const timeout = setTimeout(() => {
      setCcodeTapCount(0);
    }, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, [ccodeTapCount]);

  const updateCcodeTapCount = useCallback(() => {
    if (ccodeTapCount == 4) {
      setCcodeTapCount(0);
      setTestState(t => t + 1);
      setCountry({ callingCode: ['0'] });
    }
    else {
      setCcodeTapCount(ccodeTapCount + 1);
    }
  }, [ccodeTapCount]);

  const resetLocalPhone = useCallback((localPhone) => {
    setLocalPhone(localPhone);
  }, [true]);

  const openCountryPicker = useCallback(() => {
    if (loading) return;

    setCountryPickerOpened(true);
  }, [loading]);

  const closeCountryPicker = useCallback(() => {
    setCountryPickerOpened(false);
  }, [true]);

  useTrap($Phone, {
    requestSignIn,
    setTestState,
    setCountry,
    setLocalPhone,
    phone,
  });

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.instructions}>Please enter your phone number. A verification code will be sent to you shortly after.</Text>
      </View>
      <View style={styles.inputsContainer}>
        <TouchableWithoutFeedback onPress={openCountryPicker}>
          <View style={styles.countryPickerContainer}>
            <View style={styles.countryPicker}>
              <CountryPicker
                key={testing}
                withFlag
                withCountryNameButton
                visible={countryPickerOpened}
                countryCodes={COUNTRIES}
                theme={CountryPickerTheme}
                containerButtonStyle={{ marginBottom: (country && country.cca2) ? 0 : 3 }}
                countryCode={country && country.cca2}
                onSelect={setCountry}
                onClose={closeCountryPicker}
                onOpen={openCountryPicker}
              />
            </View>
            <Text style={styles.countryPickerArrow}>▼</Text>
          </View>
        </TouchableWithoutFeedback>
        <View style={styles.phoneContainer}>
          <TouchableWithoutFeedback onPress={updateCcodeTapCount}>
            <View style={styles.ccode}>
              <TextInput
                editable={false}
                textAlign='right'
                placeholder={ccodePrefix}
                style={styles.ccodeText}
                placeholderTextColor={hexToRgba('#000', .5)}
              >
                {callingCode}
              </TextInput>
            </View>
          </TouchableWithoutFeedback>
          <View style={styles.localPhone}>
            <TextInputMask
              editable={!loading}
              importantForAutofill='no'
              autoCompleteType='off'
              placeholder='phone number'
              type='cel-phone'
              value={localPhone}
              onChangeText={resetLocalPhone}
              style={styles.localPhoneText}
              placeholderTextColor={hexToRgba('#000', .5)}
            />
          </View>
        </View>
        <Text style={styles.smsNote}>Carrier SMS charges may apply.</Text>
      </View>
      <RaisedTextButton
        style={{ marginTop: 30 }}
        onPress={requestSignIn}
        color={colors.hot}
        title='send'
        titleColor='white'
        key={!isPhoneValid}
        disabled={!isPhoneValid}
      />
    </View>
  );
};

export default Auth.create(Phone);
