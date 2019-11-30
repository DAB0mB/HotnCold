import { IntrospectionFragmentMatcher, InMemoryCache } from 'apollo-cache-inmemory';
import ApolloClient from 'apollo-client';
import { ApolloLink, split } from 'apollo-link';
import { onError } from 'apollo-link-error';
import { WebSocketLink } from 'apollo-link-ws';
import { createUploadLink } from 'apollo-upload-client';
import { getMainDefinition } from 'apollo-utilities';
import CONFIG from 'react-native-config';
import CookieManager from 'react-native-cookie';

import introspectionQueryResultData from './fragmentTypes.json';

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
});

const httpLink = createUploadLink({
  uri: CONFIG.GRAPHQL_ENDPOINT,
  credentials: 'include',
});

const wsLink = new WebSocketLink({
  uri: CONFIG.GRAPHQL_ENDPOINT.replace(/^https?/, 'ws'),
  options: {
    // Automatic reconnect in case of connection error
    reconnect: true,
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

/* Custom asyn middleware example */

// const authLink = new ApolloLink((operation, forward) => new Observable(async (observable) => {
//   const cookie = await CookieManager.get(CONFIG.STORAGE_KEY);

//   operation.setContext({
//     headers: {
//       cookie,
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
//           await CookieManager.setFromResponse(CONFIG.STORAGE_KEY, cookie)
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
//     error(error) { observable.error(error) },
//   });
// }));

const link = ApolloLink.from([errorLink, terminatingLink]);

const client = new ApolloClient({
  cache,
  link,
});

export default client;
