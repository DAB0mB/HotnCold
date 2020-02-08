import OTPInputView from '@twotalltotems/react-native-otp-input';
import { useRobot } from 'hotncold-robot';
import React, { useCallback, useState } from 'react';
import { Dimensions, StyleSheet, View, Text, TouchableWithoutFeedback } from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import DotsLoader from '../components/Loader/DotsLoader';
import Auth from '../containers/Auth';
import { HEIGHT as HEADER_HEIGHT } from '../containers/Auth/Header';
import Base from '../containers/Base';
import { useVerifySignIn } from '../services/Auth';
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
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '80%',
  },
  otp: {
    width: '100%',
    height: 100,
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
  resend: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    fontSize: 20,
    color: 'white',
  },
  next: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    fontSize: 20,
    color: 'white',
  },
});

export const $Verify = Symbol('Verify');

const Verify = () => {
  const { useTrap } = useRobot();
  const baseNav = useNavigation(Base);
  const authNav = useNavigation(Auth);
  const phone = authNav.getParam('phone');
  const contract = authNav.getParam('contract');
  const [loading, setLoading] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeHint] = useState(contract.isTest ? contract.passcode : null);
  const alertError = useAlertError();
  const superVerifySignIn = useVerifySignIn(contract, passcode, {
    onCompleted: useCallback((contract) => {
      setLoading(false);

      if (contract.signed) {
        baseNav.terminalPush('Discovery');
      }
      else {
        baseNav.terminalPush('Profile');
      }
    }, [baseNav]),
    onError(error) {
      setLoading(false);

      alertError(error);
    },
  });

  const verifySignIn = useCallback(() => {
    setLoading(true);

    superVerifySignIn();
  }, [superVerifySignIn]);

  authNav.useBackListener();

  useTrap($Verify, {
    passcodeHint,
    setPasscode,
    passcode,
    verifySignIn,
  });

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.instructions}>A verification code has just been sent to {phone}. Please enter it.</Text>
      </View>
      <View>
        <View style={styles.otpContainer}>
          <OTPInputView
            style={styles.otp}
            codeInputFieldStyle={styles.otpInput}
            pinCount={4}
            code={passcode}
            onCodeChanged={setPasscode}
            autoFocusOnLoad
          />
        </View>
        {passcodeHint && (
          <Text style={styles.passcodeHint}>[TEST] Your passcode is {passcodeHint}.</Text>
        )}
      </View>
      <TouchableWithoutFeedback onPress={authNav.goBackOnceFocused}>
        <Text style={styles.resend}>
          <McIcon name='cellphone-message' color='white' size={20} /> <Text>Resend</Text>
        </Text>
      </TouchableWithoutFeedback>
      {passcode.length == 4 && (
        loading ? (
          <View style={styles.next}>
            <DotsLoader size={10} betweenSpace={10} />
          </View>
        ) : (
          <TouchableWithoutFeedback onPress={verifySignIn}>
            <Text style={styles.next}>
              <Text>Next</Text> <McIcon name='arrow-right' color='white' size={20} />
            </Text>
          </TouchableWithoutFeedback>
        )
      )}
    </View>
  );
};

export default Auth.create(Verify);
