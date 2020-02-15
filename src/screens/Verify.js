import OTPInputView from '@twotalltotems/react-native-otp-input';
import { useRobot } from 'hotncold-robot';
import React, { useCallback, useState, useMemo } from 'react';
import { Dimensions, StyleSheet, View, Text, TouchableWithoutFeedback } from 'react-native';
import { RaisedTextButton } from 'react-native-material-buttons';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import Auth from '../containers/Auth';
import { HEIGHT as HEADER_HEIGHT } from '../containers/Auth/Header';
import Base from '../containers/Base';
import { useVerifySignIn } from '../services/Auth';
import { useAlertError } from '../services/DropdownAlert';
import { useNavigation } from '../services/Navigation';
import { colors } from '../theme';

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
    color: 'black',
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
    fontSize: 20,
    fontWeight: '900',
    borderWidth: 0,
    borderBottomWidth: 1,
    borderColor: 'black',
  },
  passcodeHint: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    fontSize: 10,
    color: 'black',
  },
  resend: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    fontSize: 20,
    color: 'black',
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
  const isPasscodeReady = useMemo(() => passcode.length == 4, [passcode]);
  const alertError = useAlertError();
  const superVerifySignIn = useVerifySignIn(contract, passcode, {
    onCompleted: useCallback((contract) => {
      setLoading(false);

      if (contract.signed) {
        baseNav.terminalPush('Discovery');
      }
      else {
        baseNav.terminalPush('ProfileEditor');
      }
    }, [baseNav]),
    onError(error) {
      setLoading(false);

      alertError(error);
    },
  });

  const verifySignIn = useCallback(() => {
    if (loading) return;

    setLoading(true);

    superVerifySignIn();
  }, [superVerifySignIn, loading]);

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
      <RaisedTextButton
        style={{ marginTop: 30 }}
        onPress={verifySignIn}
        color={colors.hot}
        title='verify'
        titleColor='white'
        key={!isPasscodeReady}
        disabled={!isPasscodeReady}
      />
      <TouchableWithoutFeedback onPress={authNav.goBackOnceFocused}>
        <Text style={styles.resend}>
          <McIcon name='cellphone-message' size={20} color='black' /> <Text>Resend</Text>
        </Text>
      </TouchableWithoutFeedback>
    </View>
  );
};

export default Auth.create(Verify);
