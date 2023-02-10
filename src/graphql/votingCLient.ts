import { ApolloClient, createHttpLink } from '@apollo/client'
import { InMemoryCache } from '@apollo/client/cache'

export const votingClient = new ApolloClient({
  link: createHttpLink({
    uri: process.env.REACT_APP_VOTING_API,
  }),
  cache: new InMemoryCache(),
})
