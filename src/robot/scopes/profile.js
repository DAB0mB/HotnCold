import { useEffect } from 'react';
import { Alert } from 'react-native';

import { $Discovery } from '../../containers/Discovery';
import { $Inbox } from '../../screens/Inbox';
import { $Map } from '../../screens/Map';
import { $Phone } from '../../screens/Phone';
import { $Profile } from '../../screens/Profile';
import { $Verify } from '../../screens/Verify';
import { assert, scope, flow, trap, pass } from '../runner';

export default () => {
  scope('Profile', () => {
    flow('Profile registration', () => {
      flow.timeout(2 * 60 * 1000);

      trap($Phone, ({ setTestState, setCountry, setLocalPhone, phone, requestSignIn }) => {
        useEffect(() => {
          setTimeout(() => {
            setTestState(true);
            setCountry({ callingCode: ['0'] });
            setLocalPhone('000000000');
          }, 1000);
        }, [true]);

        useEffect(() => {
          if (phone !== '-0000000000') return;

          if (phone) {
            setTimeout(() => {
              requestSignIn();
            }, 1000);
          }
        }, [phone]);
      });

      trap($Verify, ({ passcodeHint, setPasscode, verifySignIn, passcode }) => {
        useEffect(() => {
          setTimeout(() => {
            setPasscode(passcodeHint);
          }, 1000);
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
          setTimeout(() => {
            setName('C3P-O');
            setBirthDate(new Date('1/1/2000'));
            setBio('I am a robot');
            setOccupation('Tester');
            setPictures(['https://cdn.shopify.com/s/files/1/0105/9022/products/afaf4cec5d4ba6f0915d4d8b39c26eb9ef60f88a_512x512.jpg']);
          }, 1000);
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
                'Profile successfully registered',
                [{ text: 'OK', onPress: pass }],
                { cancelable: false },
              );
            }, 1500);
          }
        }, [loaded]);
      });
    });

    flow('Profile editing', () => {
      flow.timeout(1 * 60 * 1000);

      trap($Discovery.Header, ({ navToInbox }) => {
        useEffect(() => {
          setTimeout(() => {
            navToInbox();
          }, 1500);
        }, [true]);
      });

      trap($Inbox.Header, ({ editProfile }) => {
        useEffect(() => {
          setTimeout(() => {
            editProfile();
          }, 1000);
        }, [true]);
      });

      trap($Profile, ({ setName, name, save, saveResponse }) => {
        const newName = 'R2D2';

        useEffect(() => {
          setTimeout(() => {
            setName(newName);
          }, 1000);
        }, [true]);

        useEffect(() => {
          if (name !== newName) return;

          setTimeout(() => {
            save();
          }, 1000);
        }, [name]);

        useEffect(() => {
          if (!saveResponse) return;

          assert(saveResponse.name, newName);

          setTimeout(() => {
            Alert.alert(
              'Success',
              'Profile successfully edited',
              [{ text: 'OK', onPress: pass }],
              { cancelable: false },
            );
          }, 1000);
        }, [saveResponse]);
      });
    });
  });
};
