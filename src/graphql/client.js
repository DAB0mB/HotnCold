import { ApolloLink } from 'apollo-link';
import { onError } from 'apollo-link-error';
import { IntrospectionFragmentMatcher, InMemoryCache } from 'apollo-cache-inmemory';
import ApolloClient from 'apollo-client';
import { createUploadLink } from 'apollo-upload-client';
import CONFIG from 'react-native-config';

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

const link = ApolloLink.from([errorLink, httpLink]);

const client = new ApolloClient({
  cache,
  link,
});

export default client;
