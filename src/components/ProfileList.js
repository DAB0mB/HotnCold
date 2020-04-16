import React, { useCallback } from 'react';
import { StyleSheet, View, Image, FlatList } from 'react-native';
import Ripple from 'react-native-material-ripple';

import { hexToRgba, colors } from '../theme';

const styles = StyleSheet.create({
  item: {
    paddingLeft: 10,
    paddingRight: 10,
    flexDirection: 'row',
  },
  avatar: {
    width: 60,
    height: '100%',
    justifyContent: 'center',
  },
  avatarImage: {
    resizeMode: 'contain',
    height: 50,
    marginRight: 10,
    borderRadius: 999,
  },
  body: {
    flex: 1,
    flexDirection: 'column',
    paddingTop: 10,
    paddingBottom: 10,
  },
  bodyBorder: {
    borderBottomWidth: 1,
    borderBottomColor: hexToRgba(colors.gray, .5),
  },
});

const RippleList = ({
  data,
  rippeColor,
  onItemPress,
  keyExtractor,
  pictureExtractor,
  renderItemBody,
  ListHeaderComponent,
}) => {
  const renderItem = useCallback(({ item, index }) => {
    return (
      <Ripple rippeColor={rippeColor} onPress={() => onItemPress({ item, index })}>
        <View style={styles.item}>
          <View style={styles.avatar}>
            <Image style={styles.avatarImage} source={pictureExtractor(item)} />
          </View>

          <View style={[styles.body, index && styles.bodyBorder].filter(Boolean)}>
            {renderItemBody({ item, index })}
          </View>
        </View>
      </Ripple>
    );
  }, [onItemPress, rippeColor, pictureExtractor, renderItemBody]);

  return (
    <FlatList
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListHeaderComponent={ListHeaderComponent}
    />
  );
};

export default RippleList;