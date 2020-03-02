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
  detailsContainer: {
    flex: 1,
    flexDirection: 'row',
    marginBottom: 5,
    marginHorizontal: 5,
  },
  nameView: {
    marginTop: -5,
    marginLeft: -5,
  },
  timeView: {
    width: 120,
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    textAlign: 'right',
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
  showName,
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
        <View style={[styles.container, showTime && showName && { minWidth: 200, maxWidth: 300 }].filter(Boolean)}>
          {status ? (
            <React.Fragment>
              {(showTime || showName) && (
                <View style={styles.detailsContainer}>
                  {showName && (
                    <View style={styles.nameView}>
                      <Text style={[styles.text, { fontWeight: '900' }]}>{user.name}</Text>
                    </View>
                  )}

                  {showTime && (
                    <View style={styles.timeView}>
                      <Text style={styles.timeText}>{moment(status.updatedAt).format('HH:mm')}</Text>
                    </View>
                  )}
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
