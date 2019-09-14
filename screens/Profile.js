import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, BackHandler } from 'react-native';
import Swiper from 'react-native-swiper';
import Icon from 'react-native-vector-icons/FontAwesome';

import { useNavigation } from '../Navigation';
import Screen from './Screen';

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
  job: {
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
  const navigation = useNavigation();

  useEffect(() => {
    const backHandler = () => {
      navigation.navigate('Chat');

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
          <Image style={styles.profilePicture} source={require('../assets/default-profile.jpg')} />
          <Image style={styles.profilePicture} source={require('../assets/default-profile.jpg')} />
        </Swiper>
      </View>
      <View style={styles.name}><Text style={{ fontSize: styles.name.fontSize }}>Eytan Manor, 25</Text></View>
      <View style={styles.job}><Text style={{ color: styles.job.color, fontSize: styles.job.fontSize }}><Icon name='suitcase' size={styles.job.fontSize} color={styles.job.color} /> Software Engineer</Text></View>
      <View style={styles.bio}><Text style={{ color: styles.bio.color }}>Looking for an advantures person, who's into self developmnt and sports</Text></View>
    </View>
  );
};

export default Screen.create(Profile);
