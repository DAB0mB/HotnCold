import OTPInputView from '@twotalltotems/react-native-otp-input';
import React, { useCallback, useState } from 'react';
import { Dimensions, StyleSheet, View, Text, TouchableWithoutFeedback, Keyboard } from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import Auth from '../containers/Auth';
import { HEIGHT as HEADER_HEIGHT } from '../containers/Auth/Header';
import Base from '../containers/Base';
import * as mutations from '../graphql/mutations';
import { useAlertError } from '../services/DropdownAlert';
import { useNavigation } from '../services/Navigation';

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
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '80%',
  },
  otp: {
    width: '100%',
    height: 200,
  },
  otpInput: {
    color: 'white',
    fontSize: 20,
    fontWeight: '900',
    borderWidth: 0,
    borderBottomWidth: 1,
  },
  passcodeHint: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    color: 'white',
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

const Verify = () => {
  const baseNav = useNavigation(Base);
  const authNav = useNavigation(Auth);
  const phone = authNav.getParam('phone');
  const contract = authNav.getParam('contract');
  const [passcode, setPasscode] = useState('');
  const [passcodeHint] = useState(contract.isTest ? contract.passcode : null);
  const alertError = useAlertError();
  const [verifyContract] = mutations.verifyContract.use(contract.id, passcode, {
    onCompleted: useCallback(() => {
      Keyboard.dismiss();

      baseNav.terminalPush('Profile');
    }, [baseNav]),
    onError: alertError,
  });

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.instructions}>A verification code has just been sent to {phone}. Please enter it.</Text>
      </View>
      <View style={styles.inputsContianer}>
        <View style={styles.otpContainer}>
          <OTPInputView
            style={styles.otp}
            codeInputFieldStyle={styles.otpInput}
            pinCount={4}
            onCodeChanged={setPasscode}
            autoFocusOnLoad
          />
        </View>
        {passcodeHint && (
          <Text style={styles.passcodeHint}>Your passcode is {passcodeHint}.</Text>
        )}
      </View>
      {passcode.length == 4 && (
        <TouchableWithoutFeedback onPress={verifyContract}>
          <Text style={styles.next}>
            <Text>Next</Text> <McIcon name='arrow-right' color='white' size={20} />
          </Text>
        </TouchableWithoutFeedback>
      )}
    </View>
  );
};

export default Auth.create(Verify);
