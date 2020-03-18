import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { $Discovery } from '../../../containers/Discovery';
import { $Agreement } from '../../../screens/Agreement';
import { $Map } from '../../../screens/Map';
import { $Phone } from '../../../screens/Phone';
import { $ProfileEditor } from '../../../screens/ProfileEditor';
import { $Verify } from '../../../screens/Verify';
import { useRenderer, useDelayedEffect } from '../../../utils';
import { useRobot } from '../../context';

export default () => {
  const { assert, scope, flow, trap, pass } = useRobot();

  scope('Profile', () => {
    flow('Profile registration', () => {
      flow.timeout(2 * 60 * 1000);

      let agreed;
      let setAgreed;
      let updateAgreement = () => {};

      trap($Agreement, ({ agree }) => {
        [, updateAgreement] = useRenderer();

        useDelayedEffect(() => {
          if (!setAgreed) return;

          return () => {
            agree();
            setAgreed(true);
          };
        }, 2000, [setAgreed]);
      });

      trap($Phone, ({ setTestState, setCountry, setLocalPhone, phone, requestSignIn }) => {
        [agreed, setAgreed] = useState(false);

        useEffect(updateAgreement, [true]);

        useDelayedEffect(() => {
          if (!agreed) return;

          return () => {
            setTestState(true);
            setCountry({ callingCode: ['0'] });
            setLocalPhone('(00) 0000-000');
          };
        }, 1000, [agreed]);

        useDelayedEffect(() => {
          if (phone !== '-0000000000') return;

          return () => {
            requestSignIn();
          };
        }, 1000, [phone]);
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
        }, 1000, [passcode]);
      });

      trap($ProfileEditor, ({
        name,
        birthDate,
        bio,
        occupation,
        pictures,
        setName,
        setBirthDate,
        setBio,
        setOccupation,
        setPictures,
        save,
      }) => {
        useDelayedEffect(() => () => {
          setName('C3P-O');
          setBirthDate(new Date('1/1/2000'));
          setBio('I am a robot');
          setOccupation('Tester');
          setPictures(['https://cdn.shopify.com/s/files/1/0105/9022/products/afaf4cec5d4ba6f0915d4d8b39c26eb9ef60f88a_512x512.jpg']);
        }, 1000, [true]);

        useDelayedEffect(() => {
          if (!name) return;
          if (!birthDate) return;
          if (!bio) return;
          if (!occupation) return;
          if (!pictures.length) return;

          return () => {
            save();
          };
        }, 1000, [name, birthDate, bio, occupation, pictures]);
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

      let mapLoaded;
      let setMapLoaded;

      trap($Map, ({ loaded }) => {
        useDelayedEffect(() => {
          if (!loaded) return;

          return () => {
            setMapLoaded(true);
          };
        }, 1000, [loaded]);
      });

      trap($Discovery.Frame, ({ openSideMenu }) => {
        [mapLoaded, setMapLoaded] = useState(false);

        useDelayedEffect(() => {
          if (!mapLoaded) return;

          return () => {
            openSideMenu();
          };
        }, 1000, [mapLoaded]);
      });

      trap($Discovery.SideMenu, ({ opened, navToProfileEditor }) => {
        useDelayedEffect(() => {
          if (!opened) return;

          return () => {
            navToProfileEditor();
          };
        }, 1500, [opened]);
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
        }, 1000, [name]);

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
