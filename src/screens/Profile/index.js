import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, BackHandler } from 'react-native';
import Swiper from 'react-native-swiper';
import FaIcon from 'react-native-vector-icons/FontAwesome';

import { useMe } from '../../services/Auth';
import { useNavigation } from '../../services/Navigation';
import Screen from '../Screen';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
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
  },
  occupation: {
    paddingBottom: 10,
    marginLeft: 10,
    marginRight: 10,
    fontSize: 15,
    color: 'gray',
    borderBottomColor: 'gray',
    borderBottomWidth: 1,
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
  const navigation = useNavigation();
  const user = navigation.getParam('user');

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
      <View style={styles.profilePicture}>
        <Swiper showButtons loop={false}>
          {user.pictures.map((picture) => (
            <Image style={styles.profilePicture} key={picture} loadingIndicatorSource={require('./default-profile.jpg')} source={{ uri: picture }} />
          ))}
        </Swiper>
      </View>
      <View style={styles.name}><Text style={{ fontSize: styles.name.fontSize }}>{user.firstName}, {user.age}</Text></View>
      <View style={styles.occupation}><Text style={{ color: styles.occupation.color, fontSize: styles.occupation.fontSize }}><FaIcon name='suitcase' size={styles.occupation.fontSize} color={styles.occupation.color} /> {user.occupation}</Text></View>
      <View style={styles.bio}><Text style={{ color: styles.bio.color }}>{user.bio}</Text></View>
    </View>
  );
};

export default Screen.create(Profile);
