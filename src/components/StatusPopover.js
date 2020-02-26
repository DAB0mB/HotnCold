import moment from 'moment';
import React, { useCallback, useEffect } from 'react';
import { View, Text, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import Popover from 'react-native-popover-view';
import MIcon from 'react-native-vector-icons/MaterialIcons';

import * as queries from '../graphql/queries';
import { useAlertError } from '../services/DropdownAlert';
import { colors } from '../theme';
import { useSelf } from '../utils';

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

const StatusPopover = ({
  showTime,
  itsMe,
  state,
  user,
  baseNav,
  isPartial,
  status = user?.status,
  ...props,
}) => {
  const self = useSelf();
  const alertError = useAlertError();
  const [isVisible, setVisibility] = state;

  const tryNavToUserProfile = useCallback(() => {
    if (self.shouldNav && self.fullUser) {
      const user = self.fullUser;
      delete self.shouldNav;
      delete self.fullUser;

      baseNav.push('Profile', { user, itsMe });
    }
  }, [itsMe, baseNav]);

  const [queryUserProfile] = queries.userProfile.use.lazy({
    onCompleted: useCallback((data) => {
      self.fullUser = data.userProfile;
      tryNavToUserProfile();
    }, [baseNav, itsMe]),
    onError: alertError,
  });

  const hidePopover = useCallback(() => {
    setVisibility(false);
  }, [true]);

  const handlePopoverPress = useCallback(() => {
    setVisibility(false);
    self.shouldNav = true;
    tryNavToUserProfile();
  }, [tryNavToUserProfile]);

  useEffect(() => {
    if (!isVisible) return;

    if (isPartial) {
      queryUserProfile({
        variables: { userId: user.id }
      });
    }
    else {
      self.fullUser = user;
    }
  }, [queryUserProfile, isVisible, isPartial, user]);

  return (
    <Popover
      {...props}
      debug={__DEV__}
      isVisible={isVisible}
      onRequestClose={hidePopover}
    >
      <TouchableWithoutFeedback onPress={handlePopoverPress}>
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
