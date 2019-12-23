import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  Image,
  StyleSheet,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { ReactNativeFile } from 'apollo-upload-client';
import Swiper from 'react-native-swiper';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import DotsLoader from '../components/Loader/DotsLoader';
import Base from '../containers/Base';
import * as mutations from '../graphql/mutations';
import { useRegister } from '../services/Auth';
import { useDateTimePicker } from '../services/DateTimePicker';
import { useAlertError, useAlertSuccess } from '../services/DropdownAlert';
import { useLoading } from '../services/Loading';
import { useImagePicker } from '../services/ImagePicker';
import { useNavigation } from '../services/Navigation';
import { colors, hexToRgba } from '../theme';
import { useRenderer } from '../utils';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    flex: 1,
  },
  profilePicture: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').width,
  },
  profilePicturePlaceholder: {
    backgroundColor: colors.gray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    margin: 10,
    fontSize: 30,
    fontWeight: '900',
    color: colors.ink,
    borderBottomColor: 'silver',
    flexDirection: 'row',
  },
  bioField: {
    marginLeft: 10,
    marginRight: 10,
    fontSize: 16,
    color: 'silver',
    flexDirection: 'row',
    alignItems: 'center'
  },
  bioFieldIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 25,
  },
  bio: {
    backgroundColor: hexToRgba(colors.gray, .2),
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    borderBottomLeftRadius: 15,
    margin: 10,
    marginTop: 20,
    padding: 10,
    paddingTop: 20,
    paddingBottom: 20,
    textAlignVertical: 'top',
    fontSize: 16,
    color: 'gray',
  },
  backButton: {
    position: 'absolute',
    flexDirection: 'row',
    left: 0,
    top: 0,
    padding: 10,
  },
  picturesButtons: {
    position: 'absolute',
    flexDirection: 'row',
    right: 0,
    top: 0,
    paddingTop: 10,
  },
  profileButtons: {
    position: 'absolute',
    flexDirection: 'row',
    top: Dimensions.get('window').width,
    right: 0,
    paddingTop: 10,
  },
  loader: {
    alignItems: 'flex-end',
    margin: 15,
  },
  icon: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    marginRight: 10,
  },
  swiperDot: {
    height: 4,
    width: 4,
  }
});

const Profile = () => {
  const baseNav = useNavigation(Base);
  const isRecipient = baseNav.getParam('isRecipient');
  const itsMe = baseNav.getParam('itsMe');
  const userParam = baseNav.getParam('user');
  const [user, setUser] = useState(userParam.id && userParam);
  const editMode = !!(!user || itsMe);
  const alertError = useAlertError();
  const alertSuccess = useAlertSuccess();
  const [swiperKey, renderSwiper] = useRenderer();
  const [pictureIndex, setPictureIndex] = useState(0);
  const [typing, setTyping] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [name, setName] = useState(() => user ? user.name : '');
  const [birthDate, setBirthDate] = useState(() => !user ? '' : itsMe ? user.birthDate : user.age);
  const [occupation, setOccupation] = useState(() => user ? user.occupation : '');
  const [bio, setBio] = useState(() => user ? user.bio : '');
  // TODO: Implement changePicturePosition() function
  const [pictures, setPictures] = useState(() => user ? user.pictures : []);
  if (typeof userParam == 'function') {
    // Async hook. NEVER me
    const user = userParam();
    useEffect(() => {
      if (user) {
        setName(user.name);
        setOccupation(user.occupation);
        setBio(user.bio);
        setPictures(user.pictures);
        setBirthDate(user.age);
        setUser(user);
      }
    }, [user]);
  }
  const [pendingPictures, setPendingPictures] = useState(pictures);
  const dateTimePicker = useDateTimePicker({
    mode: 'date',
    maximumDate: useMemo(() => new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000), [true]),
    minimumDate: useMemo(() => new Date(Date.now() - 100 * 365 * 24 * 60 * 60 * 1000), [true]),
    date: useMemo(() => new Date(birthDate ? birthDate : '1/1/2000'), [birthDate]),
    onConfirm: useCallback((birthDate) => {
      setBirthDate(birthDate);
    }, [setBirthDate])
  });
  const useProfileMutation = itsMe ? mutations.updateMyProfile.use : useRegister;
  const [mutateProfile] = useProfileMutation({
    name,
    bio,
    occupation,
    pictures,
    birthDate: useMemo(() => new Date(birthDate), [birthDate]),
  }, {
    onError: useCallback((e) => {
      setSaving(false);
      alertError(e);
    }, [alertError, saving]),
    onCompleted: useCallback(() => {
      setSaving(false);

      if (itsMe) {
        alertSuccess('Profile successfully updated');
      }
      else {
        baseNav.replace('Discovery');
      }
    }, [itsMe, alertSuccess, baseNav, saving]),
  });
  const [uploadPicture] = mutations.uploadPicture.use({
    onError: alertError,
  });
  const [findOrCreateChat] = mutations.findOrCreateChat.use([user && user.id], {
    onError: alertError,
  });
  const imagePicker = useImagePicker({
    mediaType: 'photo',
    maxWidth: 512,
    maxHeight: 512,
  }, useCallback((image) => {
    setPictures(
      [...pictures.slice(0, pictureIndex), image.uri, ...pictures.slice(pictureIndex)]
    );
    setUploadCount(c => ++c);
    renderSwiper();

    const file = new ReactNativeFile({
      uri: image.uri,
      name: image.fileName,
      type: image.type,
    });

    uploadPicture(file).then(({ data }) => {
      setPendingPictures(pendingPictures => [
        ...pendingPictures.slice(0, pictureIndex), data.uploadPicture, ...pendingPictures.slice(pictureIndex)
      ]);
      setUploadCount(c => --c);
    });
  }, [pictureIndex, uploadPicture, pictures]));

  useEffect(() => {
    if (!saving) return;
    if (uploadCount) return;

    mutateProfile({ pictures: pendingPictures });
  }, [saving, uploadCount]);

  useEffect(() => {
    if (itsMe) return;
    if (!user) return;

    user.pictures.forEach(p => Image.prefetch(p));
  }, [true]);

  const MyText = useCallback(React.forwardRef(function MyText({ style = {}, ...props }, ref) {
    return (
      <TextInput
        editable={editMode}
        autoCompleteType='off'
        importantForAutofill='no'
        autoCorrect={false}
        {...props}
        style={{ padding: 0, ...style }}
        ref={ref}
      />
    );
  }), [true]);

  useEffect(() => {
    if (!editMode) return;

    const keyboardShowHandler = () => {
      setTyping(true);
    };

    const keyboardHideHandler = () => {
      Keyboard.dismiss();
      setTyping(false);
    };

    Keyboard.addListener('keyboardDidShow', keyboardShowHandler);
    Keyboard.addListener('keyboardDidHide', keyboardHideHandler);

    return () => {
      Keyboard.removeListener('keyboardDidShow', keyboardShowHandler);
      Keyboard.removeListener('keyboardDidHide', keyboardHideHandler);
    };
  }, [setTyping]);

  if (baseNav.getParam('user')) {
    baseNav.useBackListener();
  }

  const deletePicture = useCallback(() => {
    setPictures(
      [...pictures.slice(0, pictureIndex), ...pictures.slice(pictureIndex + 1)]
    );
    setPendingPictures(
      [...pendingPictures.slice(0, pictureIndex), ...pendingPictures.slice(pictureIndex + 1)]
    );
    renderSwiper();
  }, [pictureIndex, pictures, pendingPictures]);

  const navToChat = useCallback(async () => {
    if (isRecipient) {
      baseNav.goBack();

      return;
    }

    const result = await findOrCreateChat();

    // Probably validation issue
    if (!result || !result.data) return;

    baseNav.push('Social', {
      childNavigationState: {
        routeName: 'Chat',
        params: {
          chat: result.data.findOrCreateChat
        }
      }
    });
  }, [baseNav, findOrCreateChat, user]);

  return useLoading(!user, !user ? null :
    <ScrollView style={styles.container}>
      {!typing && (
        <View style={styles.profilePicture}>
          {/*react-native-swiper doesn't iterate through children properly so I have to compose the array manually*/}
          <Swiper
            showButtons
            loop={false}
            onIndexChanged={setPictureIndex}
            key={swiperKey}
            index={Math.min(pictureIndex, pictures.length - 1)}
            dotStyle={styles.swiperDot}
            activeDotColor='white'
            dotColor='rgba(255, 255, 255, .3)'
          >
            {pictures.map((picture) => (
              <Image style={styles.profilePicture} key={picture} source={{ uri: picture }} />
            )).concat(editMode && (
              <TouchableWithoutFeedback onPress={() => imagePicker.showImagePicker()} key='_'>
                <View style={[styles.profilePicture, styles.profilePicturePlaceholder]}>
                  <McIcon name='image-plus' size={100} color='white' solid />
                </View>
              </TouchableWithoutFeedback>
            )).filter(Boolean)}
          </Swiper>
        </View>
      )}
      <View style={styles.name}>
        <MyText style={{ fontSize: styles.name.fontSize, fontWeight: styles.name.fontWeight, color: styles.name.color }} value={name} onChangeText={setName} maxLength={25} placeholder={name ? '' : 'Full Name'} />
      </View>
      <TouchableWithoutFeedback onPress={() => editMode ? dateTimePicker.show() : () => {}}>
        <View style={styles.bioField}>
          <View style={styles.bioFieldIcon}>
            <McIcon name='account' size={styles.bioField.fontSize} color={styles.bioField.color} style={{ marginRight: styles.bioField.marginLeft / 2 }} />
          </View>
          <MyText style={{ color: styles.bioField.color, fontSize: styles.bioField.fontSize }} value={birthDate && (editMode ? moment(birthDate).format('MMMM Do YYYY') : `${birthDate} years old`)} editable={false} placeholder='Birthday' />
        </View>
      </TouchableWithoutFeedback>
      <View style={styles.bioField}>
        <View style={styles.bioFieldIcon}>
          <McIcon name='briefcase' size={styles.bioField.fontSize} color={styles.bioField.color} style={{ marginRight: styles.bioField.marginLeft / 2 }} />
        </View>
        <MyText style={{ color: styles.bioField.color, fontSize: styles.bioField.fontSize }} value={occupation} onChangeText={setOccupation} maxLength={30} placeholder='Occupation' />
      </View>
      <View style={styles.bio}>
        <View style={{ position: 'absolute', top: -15, right: 20 }}>
          <McIcon name='format-quote-open' color={colors.ink} size={30} />
        </View>
        <View>
          <MyText style={{ color: styles.bio.color, fontSize: styles.bio.fontSize, textAlignVertical: styles.bio.textAlignVertical }} multiline value={bio} onChangeText={setBio} maxLength={512} placeholder='A short description of yourself: what do you like to do, what do you like to eat, where do you like to go, etc.' />
        </View>
      </View>

      {user && !typing && (
        <View style={styles.backButton}>
          <TouchableWithoutFeedback onPress={baseNav.goBackOnceFocused}>
            <View style={styles.icon}>
              <McIcon name='arrow-left' size={25} color='white' solid />
            </View>
          </TouchableWithoutFeedback>
        </View>
      )}

      {editMode && !typing && pictureIndex < pictures.length && (
        <View style={styles.picturesButtons}>
          {pictures.length < 6 && (
            <TouchableWithoutFeedback onPress={() => imagePicker.showImagePicker()}>
              <View style={styles.icon}>
                <McIcon name='image-plus' size={25} color='white' solid />
              </View>
            </TouchableWithoutFeedback>
          )}
          <TouchableWithoutFeedback onPress={deletePicture}>
            <View style={styles.icon}>
              <McIcon name='delete' size={25} color='white' solid />
            </View>
          </TouchableWithoutFeedback>
        </View>
      )}

      {editMode && !typing && (
        <View style={styles.profileButtons}>
          {saving ? (
            <View style={styles.loader}>
              <DotsLoader size={10} betweenSpace={10} />
            </View>
          ) : (
            <TouchableWithoutFeedback onPress={() => setSaving(true)}>
              <View style={styles.icon}>
                <McIcon name='floppy' size={25} color={hexToRgba(colors.ink, 0.8)} solid />
              </View>
            </TouchableWithoutFeedback>
          )}
        </View>
      )}

      {!editMode && !itsMe && (
        <View style={styles.profileButtons}>
          <TouchableWithoutFeedback onPress={navToChat}>
            <View style={styles.icon}>
              <McIcon name='message' size={25} color={hexToRgba(colors.ink, 0.8)} solid />
            </View>
          </TouchableWithoutFeedback>
        </View>
      )}
    </ScrollView>
  );
};

export default Base.create(Profile);
