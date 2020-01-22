import React, { useCallback, useState, useLayoutEffect } from 'react';
import { createAppContainer, NavigationActions } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';

const createRouter = (routes, options) => {
  const Navigator = createStackNavigator(routes, options);
  const Container = createAppContainer(Navigator);

  return function Router({ navigation, children }) {
    const [routerState] = useState(() => Navigator.router.getStateForAction(NavigationActions.init()));

    useLayoutEffect(() => {
      if (!navigation) return;

      const $setState = navigation.getParam('$setState');

      if ($setState) {
        Object.assign(routerState,
          Navigator.router.getStateForAction(NavigationActions.init(), $setState),
        );
      }

      // Signature: https://reactnavigation.org/docs/en/stack-actions.html#replace
      const $setInitialRouteState = navigation.getParam('$setInitialRouteState');

      if ($setInitialRouteState) {
        Object.assign(routerState.routes[0], $setInitialRouteState);
      }

      navigation.state.router = routerState;

      return () => {
        delete navigation.state.router;
      };
    }, [true]);

    const loadNavigationState = useCallback(() => {
      return routerState;
    }, [routerState]);

    const onNavigationStateChange = useCallback((prevState, nextState) => {
      if (navigation) {
        navigation.state.router = nextState;
      }
    }, [navigation]);

    return (
      <Container loadNavigationState={loadNavigationState} onNavigationStateChange={onNavigationStateChange}>
        {children}
      </Container>
    );
  };
};

export default createRouter;
