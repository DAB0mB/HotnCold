import moment from 'moment';
import React, { useEffect } from 'react';
import { View, ScrollView, Text, TextInput, Image, StyleSheet, Dimensions, BackHandler, KeyboardAvoidingView } from 'react-native';
import Swiper from 'react-native-swiper';
import FaIcon from 'react-native-vector-icons/FontAwesome';

import { useMe } from '../../services/Auth';
import { useAlertError } from '../../services/DropdownAlert';
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
    paddingBottom: 10,
    marginLeft: 10,
    marginRight: 10,
    color: 'gray',
  }
});

const Profile = () => {
  const me = useMe();
  const alertError = useAlertError();
  const navigation = useNavigation();
  const user = navigation.getParam('user');
  const itsMe = navigation.getParam('itsMe');
  const MyText = itsMe ? TextInput : Text;

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
    <KeyboardAvoidingView style={styles.container} behavior="position" enabled>
      <View style={styles.profilePicture}>
        <Swiper showButtons loop={false}>
          {user.pictures.map((picture) => (
            <Image style={styles.profilePicture} key={picture} loadingIndicatorSource={require('./default-profile.jpg')} source={{ uri: picture }} />
          ))}
        </Swiper>
      </View>
      <View style={styles.name}>
        <MyText style={{ fontSize: styles.name.fontSize, padding: 0 }}>{[user.firstName, itsMe && user.lastName].filter(Boolean).join(' ')}</MyText>
        <Text style={{ fontSize: styles.name.fontSize }}>, </Text>
        <MyText style={{ fontSize: styles.name.fontSize, padding: 0 }}>{itsMe ? moment(user.birthDate).calendar() : user.age}</MyText>
      </View>
      <View style={styles.occupation}>
        <FaIcon name='suitcase' size={styles.occupation.fontSize} color={styles.occupation.color} style={{ marginRight: styles.occupation.marginLeft / 2 }} />
        <MyText style={{ color: styles.occupation.color, fontSize: styles.occupation.fontSize, padding: 0 }} maxLength={30}>{user.occupation}</MyText>
      </View>
      <View style={styles.bio}>
        <MyText style={{ color: styles.bio.color, padding: 0 }} scrollEnabled={false} multiline>{user.bio}</MyText>
      </View>
    </KeyboardAvoidingView>
  );
};

export default Screen.create(Profile);
