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
} from 'react-native';
import Swiper from 'react-native-swiper';
import FaIcon from 'react-native-vector-icons/FontAwesome';
import Fa5Icon from 'react-native-vector-icons/FontAwesome5';

import * as mutations from '../../graphql/mutations';
import { useAlertError, useAlertSuccess } from '../../services/DropdownAlert';
import { useDateTimePicker } from '../../services/DateTimePicker';
import { useNavigation } from '../../services/Navigation';
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
  iconsContainer: {
    position: 'absolute',
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
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(() => itsMe ? `${user.firstName} ${user.lastName}` : user.firstName);
  const [birthDate, setBirthDate] = useState(() => itsMe ? moment(user.birthDate).calendar() : user.age);
  const [occupation, setOccupation] = useState(user.occupation);
  const [bio, setBio] = useState(user.bio);
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

  return (
    <View style={styles.container}>
      {!editing && (
        <View style={styles.profilePicture}>
          <Swiper showButtons loop={false}>
            {user.pictures.map((picture) => (
              <Image style={styles.profilePicture} key={picture} loadingIndicatorSource={require('./default-profile.jpg')} source={{ uri: picture }} />
            ))}
          </Swiper>
        </View>
      )}
      <View style={styles.name}>
        <MyText style={{ fontSize: styles.name.fontSize, color: styles.name.color }} value={name} onChangeText={setName} maxLength={25} />
        <Text style={{ fontSize: styles.name.fontSize, color: styles.name.color }}>, </Text>
        <TouchableWithoutFeedback onPress={dateTimePicker.show}>
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

      <View style={styles.iconsContainer}>
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
