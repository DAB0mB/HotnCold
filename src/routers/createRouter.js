import React, { useCallback } from 'react';
import { createAppContainer, NavigationActions } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';

const createRouter = (routes, options) => {
  const Navigator = createStackNavigator(routes, options);
  const Container = createAppContainer(Navigator);

  return function Router({ navigation, children }) {
    const loadNavigationState = useCallback(() => {
      // Signature: https://reactnavigation.org/docs/en/stack-actions.html#replace
      const $initialChildRoute = navigation.getParam('$initialChildRoute');

      if ($initialChildRoute) {
        const state = Navigator.router.getStateForAction(NavigationActions.init());
        Object.assign(state.routes[0], $initialChildRoute);

        return state;
      }

      const $childState = navigation.getParam('$childState');

      if ($childState) {
        return Navigator.router.getStateForAction(NavigationActions.init(), $childState);
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
