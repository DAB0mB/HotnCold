import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';

const RobotContext = createContext();

export const RobotProvider = ({ children }) => {
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
  }, [true]);

  const robot = useMemo(() => {
    const rootScope = {
      type: 'scope',
      before: () => {},
      beforeEach: [],
      after: () => {},
      afterEach: [],
      nodes: new Map(),
    };

    let affectedFlow = null;
    let affectedScope = rootScope;
    let rejectRun = null;
    let resolveRun = null;
    let routeBuilder = [];
    let runningFlow = null;
    let runningScope = rootScope;

    const scope = (key, handler) => {
      const parentAffectedScope = affectedScope;

      try {
        routeBuilder.push(key);

        affectedScope = {
          type: 'scope',
          route: routeBuilder.slice(),
          before: () => {},
          beforeEach: affectedScope.beforeEach.slice(),
          after: () => {},
          afterEach: affectedScope.afterEach.slice(),
        };

        if (mountedRef.current) {
          const existingScope = parentAffectedScope.nodes.get(key);
          affectedScope = Object.assign(existingScope, affectedScope);
        }
        else {
          affectedScope.nodes = new Map();
          parentAffectedScope.nodes.set(key, affectedScope);
        }

        handler();
      }
      finally {
        routeBuilder.pop();
        affectedScope = parentAffectedScope;
      }
    };

    const flow = (key, handler) => {
      const prevAffectedFlow = affectedFlow;

      try {
        routeBuilder.push(key);

        affectedFlow = {
          type: 'flow',
          route: routeBuilder.slice(),
          timeout: 5 * 1000,
        };

        if (mountedRef.current) {
          const existingFlow = affectedScope.nodes.get(key);
          affectedFlow = Object.assign(existingFlow, affectedFlow);
        }
        else {
          affectedFlow.nodes = new Map();
          affectedScope.nodes.set(key, affectedFlow);
        }

        handler();
      }
      finally {
        routeBuilder.pop();
        affectedFlow = prevAffectedFlow;
      }
    };

    flow.timeout = (timeout) => {
      affectedFlow.timeout = timeout;
    };

    const trap = (key, handler) => {
      let affectedTrap = {
        type: 'trap',
        handler,
      };

      if (mountedRef.current) {
        const existingTrap = affectedFlow.nodes.get(key);
        affectedTrap = Object.assign(existingTrap, affectedTrap);
      }
      else {
        affectedFlow.nodes.set(key, affectedTrap);
      }
    };

    const useTrap = (key, controller = {}) => {
      if (!runningFlow) return;

      const trap = runningFlow.nodes.get(key);

      if (!trap) return;

      trap.handler(controller);
    };

    const pass = (payload) => {
      if (typeof resolveRun != 'function') {
        throw Error('pass() called without any flow being run');
      }

      resolveRun({
        payload,
        date: new Date(),
        route: runningFlow.route.slice(),
      });
    };

    const fail = (payload) => {
      if (typeof rejectRun != 'function') {
        throw Error('fail() called without any flow being run');
      }

      rejectRun({
        payload,
        date: new Date(),
        route: runningFlow.route.slice(),
      });
    };

    const assert = (actual, expected) => {
      if (actual !== expected) {
        fail({
          code: 'ASSERT',
          message: `Expected "${actual}" to equal "${expected}".`,
          actual,
          expected,
        });
      }
    };

    const run = async function* ({ onPass = () => {}, onFail = () => {} } = {}) {
      await runningScope.before();

      loopingNodes:
      for (const [, node] of runningScope.nodes) {
        if (node.type == 'scope') {
          const prevRunningScope = runningScope;
          runningScope = node;

          try {
            const running = run({ onPass, onFail });
            let result = await running.next();

            // For some reason yield* would trap finally {} earlier than it should
            while (!result.done) {
              yield result.value;
              result = await running.next();
            }
          }
          finally {
            // eslint-disable-next-line
            runningScope = prevRunningScope;
          }

          continue loopingNodes;
        }

        if (node.type == 'flow') {
          const prevRunningFlow = runningFlow;
          runningFlow = node;

          try {
            for (let before of runningScope.beforeEach) {
              await before();
            }

            const flowResolution = new Promise((resolve, reject) => {
              const timeout = setTimeout(() => {
                fail({
                  code: 'TIMEOUT',
                  message: `Timeout (${runningFlow.timeout}ms).`,
                  timeout: runningFlow.timeout,
                });
              }, runningFlow.timeout);

              resolveRun = (message) => {
                clearTimeout(timeout);
                resolve(message);
              };

              rejectRun = (e) => {
                clearTimeout(timeout);
                reject(e);
              };
            });

            yield runningFlow.route.join(' -> ');

            try {
              const message = await flowResolution;

              onPass(message);
            }
            catch (e) {
              onFail(e);
            }
            finally {
              resolveRun = null;
              rejectRun = null;
            }

            for (let after of runningScope.afterEach) {
              await after();
            }
          }
          finally {
            // eslint-disable-next-line
            runningFlow = prevRunningFlow;
          }

          continue loopingNodes;
        }
      }

      await runningScope.after();
    };

    const before = (handler) => {
      affectedScope.before = handler;
    };

    const beforeEach = (handler) => {
      affectedScope.beforeEach.push(handler);
    };

    const after = (handler) => {
      affectedScope.after = handler;
    };

    const afterEach = (handler) => {
      affectedScope.afterEach.push(handler);
    };

    return {
      scope,
      flow,
      trap,
      useTrap,
      pass,
      fail,
      assert,
      run,
      before,
      beforeEach,
      after,
      afterEach,
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
