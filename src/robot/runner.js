import { useEffect } from 'react';

const rootScope = {
  type: 'scope',
  before: () => {},
  beforeEach: [],
  after: () => {},
  afterEach: [],
  nodes: [],
};

let affectedFlow = null;
let affectedScope = rootScope;
let rejectRun = null;
let resolveRun = null;
let routeBuilder = [];
let runningFlow = null;
let runningScope = rootScope;
let mounted = false;

export const scope = (description, handler) => {
  if (!routeBuilder.length) {
    useEffect(() => {
      mounted = true;
    }, [true]);
  }

  const parentAffectedScope = affectedScope;

  try {
    routeBuilder.push(description);

    affectedScope = {
      type: 'scope',
      key: description,
      route: routeBuilder.slice(),
      before: () => {},
      beforeEach: affectedScope.beforeEach.slice(),
      after: () => {},
      afterEach: affectedScope.afterEach.slice(),
    };

    if (mounted) {
      const existingScope = parentAffectedScope.nodes.find(n => n.key == description);
      affectedScope = Object.assign(existingScope, affectedScope);
    }
    else {
      affectedScope.nodes = [];
      parentAffectedScope.nodes.push(affectedScope);
    }

    handler();
  }
  finally {
    routeBuilder.pop();
    affectedScope = parentAffectedScope;
  }
};

export const flow = (description, handler) => {
  const prevAffectedFlow = affectedFlow;

  try {
    routeBuilder.push(description);

    affectedFlow = {
      type: 'flow',
      key: description,
      route: routeBuilder.slice(),
      timeout: 5 * 1000,
    };

    if (mounted) {
      const existingFlow = affectedScope.nodes.find(n => n.key == description);
      affectedFlow = Object.assign(existingFlow, affectedFlow);
    }
    else {
      affectedFlow.nodes = [];
      affectedScope.nodes.push(affectedFlow);
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

export const trap = (key, handler) => {
  let affectedTrap = {
    type: 'trap',
    key,
    handler,
  };

  if (mounted) {
    const existingTrap = affectedFlow.nodes.find(n => n.key == key);
    affectedTrap = Object.assign(existingTrap, affectedTrap);
  }
  else {
    affectedFlow.nodes.push(affectedTrap);
  }
};

trap.use = (key, controller = {}) => {
  if (!runningFlow) return;

  const trap = runningFlow.nodes.find(n => n.key === key);

  if (!trap) return;

  trap.handler(controller);
};

export const pass = (payload) => {
  if (typeof resolveRun != 'function') {
    throw Error('pass() called without any flow being run');
  }

  resolveRun({
    payload,
    date: new Date(),
    route: runningFlow.route.slice(),
  });
};

export const fail = (payload) => {
  if (typeof rejectRun != 'function') {
    throw Error('fail() called without any flow being run');
  }

  rejectRun({
    payload,
    date: new Date(),
    route: runningFlow.route.slice(),
  });
};

export const assert = (actual, expected) => {
  if (actual !== expected) {
    fail({
      code: 'ASSERT',
      message: `Expected "${actual}" to equal "${expected}".`,
      actual,
      expected,
    });
  }
};

export const run = async function* ({ onPass = () => {}, onFail = () => {} } = {}) {
  await runningScope.before();

  loopingNodes:
  for (let node of runningScope.nodes) {
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

        yield runningFlow.route.join(' --> ');

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

export const before = (handler) => {
  affectedScope.before = handler;
};

export const beforeEach = (handler) => {
  affectedScope.beforeEach.push(handler);
};

export const after = (handler) => {
  affectedScope.after = handler;
};

export const afterEach = (handler) => {
  affectedScope.afterEach.push(handler);
};
