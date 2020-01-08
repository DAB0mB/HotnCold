import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, Dimensions, TextInput, TouchableWithoutFeedback, Keyboard } from 'react-native';
import CountryPicker, { DARK_THEME as SuperCountryPickerTheme } from 'react-native-country-picker-modal';
import { TextInputMask } from 'react-native-masked-text';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import DotsLoader from '../components/Loader/DotsLoader';
import Auth from '../containers/Auth';
import { HEIGHT as HEADER_HEIGHT } from '../containers/Auth/Header';
import * as mutations from '../graphql/mutations';
import { useAlertError } from '../services/DropdownAlert';
import { useNavigation } from '../services/Navigation';
import { colors } from '../theme';
import { validatePhone } from '../utils';

const CountryPickerTheme = {
  ...SuperCountryPickerTheme,
  backgroundColor: colors.ink,
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
    color: 'white',
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
    borderBottomWidth: 1.5,
    borderBottomColor: 'white',
  },
  countryPicker: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center'
  },
  countryPickerArrow: {
    color: 'white',
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
    borderBottomWidth: 1.5,
    borderBottomColor: 'white',
  },
  ccodeText: {
    fontSize: 15,
    color: 'white',
    padding: 0,
    minWidth: 50,
  },
  localPhone: {
    padding: 0,
    borderBottomWidth: 1.5,
    borderBottomColor: 'white',
  },
  localPhoneText: {
    fontSize: 15,
    color: 'white',
    minWidth: 150,
    padding: 0,
  },
  smsNote: {
    alignSelf: 'flex-start',
    color: 'white',
    marginTop: 10,
    fontSize: 10,
  },
  next: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    fontSize: 20,
    color: 'white',
  },
});

const Phone = () => {
  const authNav = useNavigation(Auth);
  const alertError = useAlertError();
  const [testing, setTestState] = useState(false);
  const ccodePrefix = useMemo(() => testing ? '-' : '+', [testing]);
  const [localPhone, setLocalPhone] = useState('');
  const [country, setCountry] = useState(null);
  const callingCode = useMemo(() =>
    (country && country.callingCode.length) ? `${ccodePrefix}${country.callingCode[0]}` : ''
  , [country, ccodePrefix]);
  const phone = useMemo(() => `${callingCode}${localPhone.replace(/[^\d]/g, '')}`, [callingCode, localPhone]);
  const [ccodeTapCount, setCcodeTapCount] = useState(0);
  const [countryPickerOpened, setCountryPickerOpened] = useState(false);
  const [findOrCreateContract, findOrCreateContractMutation] = mutations.findOrCreateContract.use(phone, {
    onCompleted: useCallback((data) => {
      Keyboard.dismiss();

      const didBlurListener = authNav.addListener('didBlur', () => {
        didBlurListener.remove();
        setLocalPhone('');
        setCountry(null);
        setTestState(false);
      });

      authNav.push('Verify', {
        phone: `+${phone.slice(1)}`,
        contract: data.findOrCreateContract,
      });
    }, [authNav, phone]),
    onError: alertError
  });

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
    if (findOrCreateContractMutation.loading) return;

    setCountryPickerOpened(true);
  }, [findOrCreateContractMutation]);

  const closeCountryPicker = useCallback(() => {
    setCountryPickerOpened(false);
  }, [true]);

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
                placeholderTextColor='rgba(255, 255, 255, .2)'
                style={styles.ccodeText}
              >
                {callingCode}
              </TextInput>
            </View>
          </TouchableWithoutFeedback>
          <View style={styles.localPhone}>
            <TextInputMask
              editable={!findOrCreateContractMutation.loading}
              importantForAutofill='no'
              autoCompleteType='off'
              placeholder='phone number'
              type='cel-phone'
              value={localPhone}
              onChangeText={resetLocalPhone}
              placeholderTextColor='rgba(255, 255, 255, .2)'
              style={styles.localPhoneText}
            />
          </View>
        </View>
        <Text style={styles.smsNote}>Carrier SMS charges may apply.</Text>
      </View>
      {validatePhone(phone) && (
        findOrCreateContractMutation.loading ? (
          <View style={styles.next}>
            <DotsLoader size={10} betweenSpace={10} />
          </View>
        ) : (
          <TouchableWithoutFeedback onPress={findOrCreateContract}>
            <Text style={styles.next}>
              <Text>Next</Text> <McIcon name='arrow-right' color='white' size={20} />
            </Text>
          </TouchableWithoutFeedback>
        )
      )}
    </View>
  );
};

export default Auth.create(Phone);
