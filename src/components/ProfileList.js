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
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    resizeMode: 'contain',
    height: 50,
    width: 50,
    marginRight: 10,
    borderRadius: 999,
  },
  body: {
    flex: 1,
    flexDirection: 'column',
    paddingTop: 20,
    paddingBottom: 15,
  },
  bodyBorder: {
    borderTopWidth: 1,
    borderTopColor: hexToRgba(colors.gray, .5),
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
  ListFooterComponent,
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
      ListFooterComponent={ListFooterComponent}
    />
  );
};

export default RippleList;
