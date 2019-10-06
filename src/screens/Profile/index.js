import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TextInput,
  Image,
  StyleSheet,
  Dimensions,
  BackHandler,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { ReactNativeFile } from 'apollo-upload-client';
import Swiper from 'react-native-swiper';
import FaIcon from 'react-native-vector-icons/FontAwesome';
import Fa5Icon from 'react-native-vector-icons/FontAwesome5';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import * as mutations from '../../graphql/mutations';
import { useDateTimePicker } from '../../services/DateTimePicker';
import { useAlertError, useAlertSuccess } from '../../services/DropdownAlert';
import { useImagePicker } from '../../services/ImagePicker';
import { useNavigation } from '../../services/Navigation';
import { useCounter } from '../../utils';
import Screen from '../Screen';

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
    backgroundColor: 'silver',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    paddingTop: 10,
    marginLeft: 10,
    marginRight: 10,
    fontSize: 20,
    color: '#666666',
    borderBottomColor: 'silver',
    flexDirection: 'row',
  },
  occupation: {
    paddingBottom: 10,
    marginLeft: 10,
    marginRight: 10,
    fontSize: 15,
    color: 'gray',
    borderBottomColor: 'gray',
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  bio: {
    paddingTop: 10,
    paddingBottom: 20,
    marginLeft: 10,
    marginRight: 10,
    color: 'gray',
  },
  picturesButtons: {
    position: 'absolute',
    flexDirection: 'row',
    right: 0,
    top: 0,
    padding: 10,
  },
  profileButtons: {
    position: 'absolute',
    flexDirection: 'row',
    right: 0,
    bottom: 0,
    padding: 10,
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
});

const Profile = () => {
  const navigation = useNavigation();
  const user = navigation.getParam('user');
  const itsMe = navigation.getParam('itsMe');
  const alertError = useAlertError();
  const alertSuccess = useAlertSuccess();
  const [swiperKey, renderSwiper] = useCounter();
  const [pictureIndex, setPictureIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(() => itsMe ? `${user.firstName} ${user.lastName}` : user.firstName);
  const [birthDate, setBirthDate] = useState(() => itsMe ? moment(user.birthDate).calendar() : user.age);
  const [occupation, setOccupation] = useState(user.occupation);
  const [bio, setBio] = useState(user.bio);
  // TODO: Pick and drop function
  const [pictures, setPictures] = useState(user.pictures);
  const dateTimePicker = useDateTimePicker({
    mode: 'date',
    maximumDate: useMemo(() => new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000), [true]),
    minimumDate: useMemo(() => new Date(Date.now() - 100 * 365 * 24 * 60 * 60 * 1000), [true]),
    date: useMemo(() => new Date(user.birthDate), [user.birthDate]),
    onConfirm: useCallback((birthDate) => {
      setBirthDate(moment(birthDate).calendar());
    }, [setBirthDate])
  });
  const [updateMyProfile] = mutations.updateMyProfile.use({
    bio,
    occupation,
    pictures,
    birthDate: useMemo(() => new Date(birthDate), [birthDate]),
    ...useMemo(() => {
      const [firstName, ...lastName] = name.split(/ +/);

      return {
        firstName,
        lastName: lastName.join(' '),
      };
    }, [name])
  }, {
    onError: alertError,
    onCompleted: useCallback(() => alertSuccess('Profile successfully updated'), [alertSuccess]),
  });
  const [uploadPicture] = mutations.uploadPicture.use({
    onError: alertError,
    onCompleted: useCallback((data) => {
      const url = data.uploadPicture;

      renderSwiper();
      // TODO: Upload only when saving, before that we can show only local images
      setPictures(
        [...pictures.slice(0, pictureIndex), url, ...pictures.slice(pictureIndex)]
      );
    }, [setPictures, pictures, pictureIndex])
  });
  const imagePicker = useImagePicker({
    mediaType: 'photo',
    maxWidth: 512,
    maxHeight: 512,
  }, useCallback((image) => {
    const file = new ReactNativeFile({
      uri: image.uri,
      name: image.fileName,
      type: image.type,
    });

    uploadPicture(file);
  }, [uploadPicture]));

  const MyText = useCallback(React.forwardRef(({ style = {}, ...props }, ref) => (
    <TextInput
      editable={itsMe}
      {...props}
      style={{ padding: 0, ...style }}
      ref={ref}
    />
  )), [true]);

  useEffect(() => {
    const keyboardShowHandler = () => {
      setEditing(true);
    };

    const keyboardHideHandler = () => {
      Keyboard.dismiss();
      setEditing(false);
    };

    Keyboard.addListener('keyboardDidShow', keyboardShowHandler);
    Keyboard.addListener('keyboardDidHide', keyboardHideHandler);

    return () => {
      Keyboard.removeListener('keyboardDidShow', keyboardShowHandler);
      Keyboard.removeListener('keyboardDidHide', keyboardHideHandler);
    };
  }, [setEditing]);

  useEffect(() => {
    const backHandler = () => {
      navigation.goBack();

      return true;
    };

    BackHandler.addEventListener('hardwareBackPress', backHandler);

    return () => {
      BackHandler.removeEventListener('hardwareBackPress', backHandler);
    };
  }, [true]);

  const deletePicture = useCallback(() => {
    setPictures(
      [...pictures.slice(0, pictureIndex), ...pictures.slice(pictureIndex + 1)]
    );
    renderSwiper();
  }, [pictureIndex, pictures, setPictures]);

  return (
    <View style={styles.container}>
      {!editing && (
        <View style={styles.profilePicture}>
          <Swiper showButtons loop={false} onIndexChanged={setPictureIndex} key={swiperKey}>
            {pictures.map((picture) => (
              <Image style={styles.profilePicture} key={picture} loadingIndicatorSource={require('./default-profile.jpg')} source={{ uri: picture }} />
            ))}
            {itsMe && (
              <TouchableWithoutFeedback onPress={() => imagePicker.showImagePicker()}>
                <View style={[styles.profilePicture, styles.profilePicturePlaceholder]} key='_'>
                  <McIcon name='image-plus' size={100} color='rgba(0, 0, 0, 0.8)' solid />
                </View>
              </TouchableWithoutFeedback>
            )}
          </Swiper>
        </View>
      )}
      <View style={styles.name}>
        <MyText style={{ fontSize: styles.name.fontSize, color: styles.name.color }} value={name} onChangeText={setName} maxLength={25} />
        <Text style={{ fontSize: styles.name.fontSize, color: styles.name.color }}>, </Text>
        <TouchableWithoutFeedback onPress={() => dateTimePicker.show()}>
          <View>
            <MyText style={{ fontSize: styles.name.fontSize, color: styles.name.color }} value={birthDate} onChangeText={setBirthDate} editable={false} />
          </View>
        </TouchableWithoutFeedback>
      </View>
      <View style={styles.occupation}>
        <FaIcon name='suitcase' size={styles.occupation.fontSize} color={styles.occupation.color} style={{ marginRight: styles.occupation.marginLeft / 2 }} />
        <MyText style={{ color: styles.occupation.color, fontSize: styles.occupation.fontSize }} value={occupation} onChangeText={setOccupation} maxLength={30} />
      </View>
      <ScrollView style={styles.bio}>
        <MyText style={{ color: styles.bio.color, paddingBottom: styles.bio.paddingBottom }} multiline value={bio} onChangeText={setBio} maxLength={512} />
      </ScrollView>

      {pictureIndex < pictures.length && (
        <View style={styles.picturesButtons}>
          <TouchableWithoutFeedback onPress={() => imagePicker.showImagePicker()}>
            <View style={styles.icon}>
              <McIcon name='image-plus' size={25} color='rgba(0, 0, 0, 0.8)' solid />
            </View>
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback onPress={deletePicture}>
            <View style={styles.icon}>
              <McIcon name='delete' size={25} color='rgba(0, 0, 0, 0.8)' solid />
            </View>
          </TouchableWithoutFeedback>
        </View>
      )}

      <View style={styles.profileButtons}>
        <TouchableWithoutFeedback onPress={updateMyProfile}>
          <View style={styles.icon}>
            <Fa5Icon name='save' size={25} color='rgba(0, 0, 0, 0.8)' solid />
          </View>
        </TouchableWithoutFeedback>
      </View>
    </View>
  );
};

export default Screen.create(Profile);
