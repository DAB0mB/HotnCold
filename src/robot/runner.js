const rootScope = {
  type: 'scope',
  before: () => {},
  beforeEach: [],
  after: () => {},
  afterEach: [],
  nodes: [],
};

let route = [];
let activeScope = rootScope;
let activeFlow = null;
let bootstrapState = 0;

export const scope = (description, handler) => {
  let prevActiveScope = activeScope;
  let prevBootstrapState = bootstrapState;

  if (prevBootstrapState == 0) {
    bootstrapState++;
  }

  try {
    route.push(description);

    activeScope = {
      type: 'scope',
      route: route.slice(),
      before: () => {},
      beforeEach: activeScope.beforeEach.slice(),
      after: () => {},
      afterEach: activeScope.afterEach.slice(),
      nodes: [],
    };

    if (bootstrapState != 2) {
      prevActiveScope.nodes.push(activeScope);
    }

    handler();
  }
  finally {
    route.pop();
    activeScope = prevActiveScope;

    if (prevBootstrapState == 0) {
      bootstrapState++;
    }
  }
};

export const flow = (description, handler) => {
  const prevActiveFlow = activeFlow;

  try {
    route.push(description);

    activeFlow = {
      type: 'flow',
      route: route.slice(),
      timeout: 5 * 1000,
      nodes: [],
    };

    if (bootstrapState != 2) {
      activeScope.nodes.push(activeFlow);
    }

    handler();
  }
  finally {
    route.pop();
    activeFlow = prevActiveFlow;
  }
};

flow.timeout = (timeout) => {
  activeFlow.timeout = timeout;
};

export const trap = (key, handler) => {
  if (bootstrapState != 2) {
    activeFlow.nodes.push({
      type: 'trap',
      key,
      handler,
    });
  }
};

trap.use = (key, controller = {}) => {
  if (!activeFlow) return;

  const trap = activeFlow.nodes.find(n => n.key === key);

  if (!trap) return;

  trap.handler(controller);
};

export const pass = (payload) => {
  activeFlow.resolve({
    payload,
    date: new Date(),
    route: activeFlow.route.slice(),
  });
};

export const fail = (payload) => {
  activeFlow.reject({
    payload,
    date: new Date(),
    route: activeFlow.route.slice(),
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
  await activeScope.before();

  loopingNodes:
  for (let node of activeScope.nodes) {
    if (node.type == 'scope') {
      const prevActiveScope = activeScope;
      activeScope = node;

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
        activeScope = prevActiveScope;
      }

      continue loopingNodes;
    }

    if (node.type == 'flow') {
      const prevActiveFlow = activeFlow;
      activeFlow = node;

      try {
        for (let before of activeScope.beforeEach) {
          await before();
        }

        const flowResolution = new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            fail({
              code: 'TIMEOUT',
              message: `Timeout (${activeFlow.timeout}ms).`,
              timeout: activeFlow.timeout,
            });
          }, activeFlow.timeout);

          activeFlow.resolve = (message) => {
            clearTimeout(timeout);
            resolve(message);
          };

          activeFlow.reject = (e) => {
            clearTimeout(timeout);
            reject(e);
          };
        });

        yield activeFlow.route.join(' -> ');

        try {
          const message = await flowResolution;

          onPass(message);
        }
        catch (e) {
          onFail(e);
        }

        for (let after of activeScope.afterEach) {
          await after();
        }
      }
      finally {
        // eslint-disable-next-line
        activeFlow = prevActiveFlow;
      }

      continue loopingNodes;
    }
  }

  await activeScope.after();
};

export const before = (handler) => {
  if (bootstrapState != 2) {
    activeScope.before = handler;
  }
};

export const beforeEach = (handler) => {
  if (bootstrapState != 2) {
    activeScope.beforeEach.push(handler);
  }
};

export const after = (handler) => {
  if (bootstrapState != 2) {
    activeScope.after = handler;
  }
};

export const afterEach = (handler) => {
  if (bootstrapState != 2) {
    activeScope.afterEach.push(handler);
  }
};
