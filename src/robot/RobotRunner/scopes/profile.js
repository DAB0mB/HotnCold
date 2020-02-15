import { useState } from 'react';
import { Alert } from 'react-native';

import { $Discovery } from '../../../containers/Discovery';
import { $Agreement } from '../../../screens/Agreement';
import { $Inbox } from '../../../screens/Inbox';
import { $Map } from '../../../screens/Map';
import { $Phone } from '../../../screens/Phone';
import { $ProfileEditor } from '../../../screens/ProfileEditor';
import { $Verify } from '../../../screens/Verify';
import { useDelayedEffect } from '../../../utils';
import { useRobot } from '../../context';

export default () => {
  const { assert, scope, flow, trap, pass } = useRobot();

  scope('Profile', () => {
    flow('Profile registration', () => {
      flow.timeout(2 * 60 * 1000);

      let agreed;
      let setAgreed;

      trap($Agreement, ({ agree }) => {
        useDelayedEffect(() => {
          if (agreed) return;

          return () => {
            agree();
            setAgreed(true);
          };
        }, 3000, [agree, agreed]);
      });

      trap($Phone, ({ setTestState, setCountry, setLocalPhone, phone, requestSignIn }) => {
        [agreed, setAgreed] = useState(false);

        useDelayedEffect(() => {
          if (!agreed) return;

          return () => {
            setTestState(true);
            setCountry({ callingCode: ['0'] });
            setLocalPhone('000000000');
          };
        }, 1000, [agreed]);

        useDelayedEffect(() => {
          if (phone !== '-0000000000') return;

          return () => {
            requestSignIn();
          };
        }, 1000, [phone, requestSignIn]);
      });

      trap($Verify, ({ passcodeHint, setPasscode, verifySignIn, passcode }) => {
        useDelayedEffect(() => () => {
          setPasscode(passcodeHint);
        }, 1000, [true]);

        useDelayedEffect(() => {
          if (!passcode) return;

          return () => {
            verifySignIn();
          };
        }, 1000, [passcode, verifySignIn]);
      });

      trap($ProfileEditor, ({ name, setName, setBirthDate, setBio, setOccupation, setPictures, save }) => {
        useDelayedEffect(() => () => {
          setName('C3P-O');
          setBirthDate(new Date('1/1/2000'));
          setBio('I am a robot');
          setOccupation('Tester');
          setPictures(['https://cdn.shopify.com/s/files/1/0105/9022/products/afaf4cec5d4ba6f0915d4d8b39c26eb9ef60f88a_512x512.jpg']);
        }, 1000, [true]);

        useDelayedEffect(() => {
          if (!name) return;

          return () => {
            save();
          };
        }, 1000, [name, save]);
      });

      trap($Map, ({ loaded }) => {
        useDelayedEffect(() => {
          if (!loaded) return;

          return () => {
            Alert.alert(
              'Success',
              'Profile successfully registered',
              [{ text: 'OK', onPress: pass }],
              { cancelable: false },
            );
          };
        }, 1500, [loaded]);
      });
    });

    flow('Profile editing', () => {
      flow.timeout(1 * 60 * 1000);

      trap($Discovery.Frame, ({ navToInbox }) => {
        useDelayedEffect(() => () => {
          navToInbox();
        }, 2500, [true]);
      });

      trap($Inbox.Header, ({ editProfile }) => {
        useDelayedEffect(() => () => {
          editProfile();
        }, 1500, [true]);
      });

      trap($ProfileEditor, ({ setName, name, save, saveResponse }) => {
        const newName = 'R2D2';

        useDelayedEffect(() => () => {
          setName(newName);
        }, 1000, [true]);

        useDelayedEffect(() => {
          if (name !== newName) return;

          return () => {
            save();
          };
        }, 1000, [name, save]);

        useDelayedEffect(() => {
          if (!saveResponse) return;

          assert(saveResponse.name, newName);

          return () => {
            Alert.alert(
              'Success',
              'Profile successfully edited',
              [{ text: 'OK', onPress: pass }],
              { cancelable: false },
            );
          };
        }, 1000, [saveResponse]);
      });
    });
  });
};
