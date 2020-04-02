import React, { createContext, useContext, useMemo } from 'react';

import { noop, noopGen } from '../utils';

const RobotContext = createContext();

export const RobotProvider = ({ children }) => {
  const robot = useMemo(() => {
    const scope = noop;
    const flow = noop;
    const trap = noop;
    const useTrap = noop;
    const pass = noop;
    const fail = noop;
    const assert = noop;
    const before = noop;
    const beforeEach = noop;
    const after = noop;
    const afterEach = noop;
    const run = noopGen;

    return {
      scope,
      flow,
      trap,
      useTrap,
      pass,
      fail,
      assert,
      before,
      beforeEach,
      after,
      afterEach,
      run,
    };
  }, [true]);

  return (
    <RobotContext.Provider value={robot}>
      {children}
    </RobotContext.Provider>
  );
};

export const useRobot = () => {
  return useContext(RobotContext);
};

export const RobotRunner = RobotProvider;
