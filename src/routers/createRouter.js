import React, { useCallback } from 'react';
import { createAppContainer, NavigationActions } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';

const createRouter = (routes, options) => {
  const Navigator = createStackNavigator(routes, options);
  const Container = createAppContainer(Navigator);

  return function Router({ navigation, children }) {
    const loadNavigationState = useCallback(() => {
      // Signature: https://reactnavigation.org/docs/en/stack-actions.html#replace
      const routeState = navigation.getParam('childNavigationState');

      if (routeState) {
        const rootState = Navigator.router.getStateForAction(NavigationActions.init());
        Object.assign(rootState.routes[0], routeState);

        return rootState;
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
