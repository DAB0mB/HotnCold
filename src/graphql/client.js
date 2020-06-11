import { IntrospectionFragmentMatcher, InMemoryCache } from 'apollo-cache-inmemory';
import ApolloClient from 'apollo-client';
import { ApolloLink, split } from 'apollo-link';
import { onError } from 'apollo-link-error';
import { WebSocketLink } from 'apollo-link-ws';
import { createUploadLink } from 'apollo-upload-client';
import { getMainDefinition } from 'apollo-utilities';
import EventEmitter from 'events';
import CONFIG from 'react-native-config';
import CookieManager from 'react-native-cookie';

import introspectionQueryResultData from './fragmentTypes.json';

const events = new EventEmitter();

const fragmentMatcher = new IntrospectionFragmentMatcher({
  introspectionQueryResultData
});

const cache = new InMemoryCache({ fragmentMatcher });

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.warn(
        `[GraphQL error]: Message: ${message}, Location: ` +
          `${locations}, Path: ${path}`,
      ),
    );
  }
  if (networkError) {
    console.warn(`[Network error]: ${networkError}`);
  }

  events.emit('error', { graphQLErrors, networkError });
});

const httpLink = createUploadLink({
  uri: CONFIG.GRAPHQL_ENDPOINT,
  credentials: 'include',
});

const wsLink = new WebSocketLink({
  uri: CONFIG.GRAPHQL_ENDPOINT.replace(/^https?/, 'ws'),
  // TODO: Handle reconnection of subscription on network error
  // "reconnect: true" options has a leak! Beware
  options: {
    async connectionParams() {
      return {
        cookie: await CookieManager.get(CONFIG.SERVER_URI),
      };
    },
  },
});

const terminatingLink = split(
  ({ query }) => {
    const { kind, operation } = getMainDefinition(query);
    // If this is a subscription query, use wsLink, otherwise use httpLink
    return kind === 'OperationDefinition' && operation === 'subscription';
  },
  wsLink,
  httpLink
);

// Cookies should be managed automatically by the device. I left the code snippet below
// as an example of how to write a link middleware

// import { serialize as serializeCookie } from 'cookie';
// import Observable from 'zen-observable';

// import { parseRawCookie } from '../utils';

// const authLink = new ApolloLink((operation, forward) => new Observable(async (observable) => {
//   const cookie = await CookieManager.get(CONFIG.SERVER_URI);

//   operation.setContext({
//     headers: {
//       cookie: serializeCookie('authToken', cookie.authToken),
//     },
//   });

//   let pendingJobs = 0;
//   let completed = false;

//   forward(operation).subscribe({
//     async next(response) {
//       pendingJobs++;
//       const { response: { headers } } = operation.getContext();

//       if (headers) {
//         const cookie = headers.get('Set-Cookie');

//         if (cookie) {
//           await CookieManager.set(CONFIG.SERVER_URI, ...parseRawCookie(cookie));
//         }
//       }

//       observable.next(response);

//       if (!--pendingJobs && completed) {
//         await Promise.resolve();
//         observable.complete();
//       }
//     },
//     complete() {
//       completed = true;

//       if (!pendingJobs) {
//         observable.complete();
//       }
//     },
//     error(error) {
//       observable.error(error);
//     },
//   });
// }));

import Observable from 'zen-observable';

const emitLink = new ApolloLink((operation, forward) => new Observable((observable) => {
  forward(operation).subscribe({
    next(response) {
      events.emit('response', {
        operationName: operation.operationName,
        variables: operation.variables,
        data: response.data,
      });

      observable.next(response);
    },

    complete() {
      observable.complete();
    },

    error(error) {
      observable.error(error);
    }
  });
}));

const link = ApolloLink.from([errorLink, emitLink, terminatingLink]);

const client = new ApolloClient({
  cache,
  link,
});

client.subscription = wsLink.subscriptionClient;
client.events = events;

export default client;
