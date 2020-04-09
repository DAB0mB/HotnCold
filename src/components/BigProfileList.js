import React, { useCallback } from 'react';
import { StyleSheet, View, Image, FlatList } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ripple from 'react-native-material-ripple';

const styles = StyleSheet.create({
  item: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  itemAbsolute: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
  },
});

const RippleList = ({
  data,
  onItemPress,
  keyExtractor,
  pictureExtractor,
  renderItemBody,
  ListHeaderComponent,
  rippleColor,
}) => {
  const renderItem = useCallback(({ item, index }) => {
    return (
      <Ripple rippleColor={rippleColor} onPress={() => onItemPress({ item, index })} style={styles.item}>
        <Image style={styles.itemAbsolute} source={pictureExtractor(item)} />
        <LinearGradient
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          colors={['rgba(0, 0, 0, .8)', 'rgba(0, 0, 0, 0)']}
          style={styles.itemAbsolute}
        />
        <View style={styles.itemAbsolute}>
          {renderItemBody({ item, index })}
        </View>
      </Ripple>
    );
  }, [onItemPress, rippleColor, pictureExtractor, renderItemBody]);

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
