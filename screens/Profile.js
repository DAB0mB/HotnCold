import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import Swiper from 'react-native-swiper';

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
    paddingBottom: 10,
    marginLeft: 10,
    marginRight: 10,
    fontSize: 20,
    borderBottomColor: 'silver',
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
  return (
    <View style={styles.container}>
      <View style={styles.profilePicture}>
        <Swiper showButtons loop={false}>
          <Image style={styles.profilePicture} source={require('../assets/default-profile.jpg')} />
          <Image style={styles.profilePicture} source={require('../assets/default-profile.jpg')} />
        </Swiper>
      </View>
      <View style={styles.name}><Text style={{ fontSize: styles.name.fontSize }}>Eytan Manor, 25</Text></View>
      <View style={styles.bio}><Text style={{ color: styles.bio.color }}>Looking for an advantures person, who's into self developmnt and sports</Text></View>
    </View>
  );
};

export default Profile;
