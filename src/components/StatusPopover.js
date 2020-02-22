import moment from 'moment';
import React, { useCallback } from 'react';
import { View, Text, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import Popover from 'react-native-popover-view';
import MIcon from 'react-native-vector-icons/MaterialIcons';

import { colors } from '../theme';

const styles = StyleSheet.create({
  container: {
    minWidth: 150,
    maxWidth: 200,
    padding: 5,
  },
  timeView: {
    marginRight: 5,
    marginBottom: 5,
    alignSelf: 'flex-end',
  },
  timeText: {
    fontSize: 12,
  },
  text: {
    margin: 5,
    color: colors.ink,
  },
  noStatusText: {
    margin: 5,
    color: 'red',
  },
});

const StatusPopover = ({ showTime, itsMe, state, user, baseNav, status = user.status, ...props }) => {
  const [isVisible, setVisibility] = state;

  const hidePopover = useCallback(() => {
    setVisibility(false);
  }, [true]);

  const navToProfile = useCallback(() => {
    setVisibility(false);
    baseNav.push('Profile', { user, itsMe });
  }, [baseNav, user, itsMe]);

  return (
    <Popover
      {...props}
      debug={__DEV__}
      isVisible={isVisible}
      onRequestClose={hidePopover}
    >
      <TouchableWithoutFeedback onPress={navToProfile}>
        <View style={styles.container}>
          {status ? (
            <React.Fragment>
              {showTime && (
                <View style={styles.timeView}>
                  <Text style={styles.timeText}>{moment(status.updatedAt).fromNow()}</Text>
                </View>
              )}

              <View>
                <Text style={styles.text}>{status.text}</Text>
              </View>
            </React.Fragment>
          ) : (
            <Text style={styles.noStatusText}>
              <MIcon name='not-interested' color={colors.red} /> <Text>No status</Text>
            </Text>
          )}
        </View>
      </TouchableWithoutFeedback>
    </Popover>
  );
};

export default StatusPopover;
