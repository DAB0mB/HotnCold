import { useEffect } from 'react';
import { Alert } from 'react-native';

import { $Phone } from '../../screens/Phone';
import { $Profile } from '../../screens/Profile';
import { $Verify } from '../../screens/Verify';
import { $Map } from '../../screens/Map';
import { useSignOut } from '../../services/Auth';
import { scope, flow, trap, pass, beforeEach } from '../runner';

export default () => {
  scope('Hot&Cold', () => {
    const signOut = useSignOut();

    beforeEach(async () => {
      await signOut();
    });

    flow('Navigation to Map screen', () => {
      flow.timeout(2 * 60 * 1000);

      trap($Phone, ({ setTestState, setCountry, setLocalPhone, phone, requestSignIn }) => {
        useEffect(() => {
          setTestState(true);
          setCountry({ callingCode: ['0'] });
          setLocalPhone('000000000');
        }, [true]);

        useEffect(() => {
          if (phone) {
            setTimeout(() => {
              requestSignIn();
            }, 1000);
          }
        }, [phone]);
      });

      trap($Verify, ({ passcodeHint, setPasscode, verifySignIn, passcode }) => {
        useEffect(() => {
          setPasscode(passcodeHint);
        }, [true]);

        useEffect(() => {
          if (passcode) {
            setTimeout(() => {
              verifySignIn();
            }, 1000);
          }
        }, [passcode]);
      });

      trap($Profile, ({ name, setName, setBirthDate, setBio, setOccupation, setPictures, save }) => {
        useEffect(() => {
          setName('R2D2');
          setBirthDate(new Date('1/1/2000'));
          setBio('I am a robot');
          setOccupation('Tester');
          setPictures(['https://cdn.shopify.com/s/files/1/0105/9022/products/afaf4cec5d4ba6f0915d4d8b39c26eb9ef60f88a_512x512.jpg']);
        }, [true]);

        useEffect(() => {
          if (name) {
            setTimeout(() => {
              save();
            }, 1000);
          }
        }, [name]);
      });

      trap($Map, ({ loaded }) => {
        useEffect(() => {
          if (loaded) {
            setTimeout(() => {
              Alert.alert(
                'Success',
                'Navigated to Map screen successfully',
                [{ text: 'OK', onPress: pass }],
              );
            }, 1500);
          }
        }, [loaded]);
      });
    });
  });
};
