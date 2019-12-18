import React, { useCallback } from 'react';
import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';

const createRouter = (routes, options) => {
  const Navigator = createStackNavigator(routes, options);
  const Container = createAppContainer(Navigator);

  return function Router({ navigation, children }) {
    const loadNavigationState = useCallback(() => {
      // *Optional
      // Signature: https://reactnavigation.org/docs/en/stack-actions.html#replace
      const state = navigation.getParam('childNavigationState');

      if (state) {
        return {
          key: navigation.state.key + '-child',
          routeName: options && options.initialRouteName,
          ...state,
        };
      }
    }, [navigation]);

    return (
      <Container loadNavigationState={loadNavigationState}>
        {children}
      </Container>
    );
  };
};

export default createRouter;
