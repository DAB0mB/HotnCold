import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  Image,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import Swiper from 'react-native-swiper';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import Base from '../containers/Base';
import * as queries from '../graphql/queries';
import { useMine } from '../services/Auth';
import { useAlertError } from '../services/DropdownAlert';
import { useBuffer } from '../services/Loading';
import { useNavigation } from '../services/Navigation';
import { colors, hexToRgba } from '../theme';

const styles = StyleSheet.create({
  container: { flexDirection: 'column', backgroundColor: 'white', flex: 1 },
  profilePicture: { width: Dimensions.get('window').width, height: Dimensions.get('window').width },
  profilePicturePlaceholder: { backgroundColor: colors.gray, alignItems: 'center', justifyContent: 'center' },
  name: { margin: 10, fontSize: 30, fontWeight: '900', color: colors.ink, borderBottomColor: 'silver', flexDirection: 'row' },
  bioField: { marginLeft: 10, marginRight: 10, fontSize: 16, color: 'silver', flexDirection: 'row', alignItems: 'center' },
  bioFieldIcon: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 25 },
  bio: { backgroundColor: hexToRgba(colors.gray, .2), borderTopRightRadius: 15, borderBottomRightRadius: 15, borderBottomLeftRadius: 15, margin: 10, marginTop: 20, padding: 10, paddingTop: 20, paddingBottom: 20, textAlignVertical: 'top', fontSize: 16, color: 'gray' },
  backButton: { position: 'absolute', flexDirection: 'row', left: 0, top: 0, padding: 10 },
  picturesButtons: { position: 'absolute', flexDirection: 'row', right: 0, top: 0, paddingTop: 10 },
  profileButtons: { position: 'absolute', flexDirection: 'row', top: Dimensions.get('window').width, right: 0, paddingTop: 10 },
  loader: { alignItems: 'flex-end', margin: 15 },
  icon: { backgroundColor: 'rgba(0, 0, 0, 0.1)', width: 50, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 999, marginRight: 10 },
  swiperDot: { height: 4, width: 4 },
});

export const $Profile = Symbol('Profile');

const MyText = React.forwardRef(function MyText({ style = {}, ...props }, ref) {
  return (
    <TextInput
      editable={false}
      autoCompleteType='off'
      importantForAutofill='no'
      autoCorrect={false}
      {...props}
      style={{ padding: 0, ...style }}
      ref={ref}
    />
  );
});

const Profile = () => {
  const baseNav = useNavigation(Base);
  const isRecipient = baseNav.getParam('isRecipient');
  const { me = {} } = useMine();
  const alertError = useAlertError();

  // User state
  const [user, setUser] = useState(() => baseNav.getParam('user'));
  const [name, setName] = useState(() => user ? user.name : '');
  const [age, setAge] = useState(() => !user ? '' : user.age);
  const [occupation, setOccupation] = useState(() => user ? user.occupation : '');
  const [bio, setBio] = useState(() => user ? user.bio : '');
  const [pictures, setPictures] = useState(() => user ? user.pictures : []);
  const itsMe = user?.id === me.id;

  queries.userProfile.use(baseNav.getParam('userId'), {
    onCompleted: useCallback((data) => {
      if (!data) return;

      const user = data.userProfile;
      setName(user.name);
      setOccupation(user.occupation);
      setBio(user.bio);
      setPictures(user.pictures);
      setAge(user.age);
      setUser(user);
    }, [true]),
    onError: alertError,
  });

  baseNav.useBackListener();

  useEffect(() => {
    if (!user) return;

    user.pictures.forEach(p => Image.prefetch(p));
  }, [true]);

  const navToChat = useCallback(async () => {
    if (isRecipient) {
      baseNav.goBack();

      return;
    }

    baseNav.push('Social', {
      $setInitialRouteState: {
        routeName: 'Chat',
        params: {
          recipientId: user.id
        }
      }
    });
  }, [baseNav, user]);

  return useBuffer(!user, () =>
    <ScrollView style={styles.container}>
      <View style={styles.profilePicture}>
        {/*react-native-swiper doesn't iterate through children properly so I have to compose the array manually*/}
        <Swiper
          showButtons
          loop={false}
          dotStyle={styles.swiperDot}
          activeDotColor='white'
          dotColor='rgba(255, 255, 255, .3)'
        >
          {pictures.length ? pictures.map((picture) => (
            <Image style={styles.profilePicture} key={picture} source={{ uri: picture }} />
          )) : (
            <Image style={styles.profilePicture} key='__default__' source={require('../assets/profile.png')} />
          )}
        </Swiper>
      </View>
      <View style={styles.name}>
        <MyText style={{ fontSize: styles.name.fontSize, fontWeight: styles.name.fontWeight, color: styles.name.color }} value={name} />
      </View>
      <View style={styles.bioField}>
        <View style={styles.bioFieldIcon}>
          <McIcon name='cake' size={styles.bioField.fontSize} color={styles.bioField.color} style={{ marginRight: styles.bioField.marginLeft / 2 }} />
        </View>
        <MyText style={{ color: styles.bioField.color, fontSize: styles.bioField.fontSize }} value={age ? `${age} years old` : 'Unspecified'} />
      </View>
      <View style={styles.bioField}>
        <View style={styles.bioFieldIcon}>
          <McIcon name='briefcase' size={styles.bioField.fontSize} color={styles.bioField.color} style={{ marginRight: styles.bioField.marginLeft / 2 }} />
        </View>
        <MyText style={{ color: styles.bioField.color, fontSize: styles.bioField.fontSize }} value={occupation ? occupation : 'Unspecified'} />
      </View>
      <View style={styles.bio}>
        <View style={{ position: 'absolute', top: -15, right: 20 }}>
          <McIcon name='format-quote-open' color={colors.ink} size={30} />
        </View>
        <View>
          <MyText style={{ color: styles.bio.color, fontSize: styles.bio.fontSize, textAlignVertical: styles.bio.textAlignVertical }} multiline value={bio || 'Unspecified'} />
        </View>
      </View>

      <View style={styles.backButton}>
        <TouchableWithoutFeedback onPress={baseNav.goBackOnceFocused}>
          <View style={styles.icon}>
            <McIcon name='arrow-left' size={25} color='white' solid />
          </View>
        </TouchableWithoutFeedback>
      </View>

      <View style={styles.profileButtons}>
        {!itsMe && (
          <TouchableWithoutFeedback onPress={navToChat}>
            <View style={[styles.icon, { backgroundColor: 'transparent' }]}>
              <McIcon name='message' size={25} color={hexToRgba(colors.ink, 0.8)} solid />
            </View>
          </TouchableWithoutFeedback>
        )}
      </View>
    </ScrollView>
  );
};

export default Base.create(Profile);
