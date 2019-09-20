import gql from 'graphql-tag';

const usersLocationsInArea = gql `
  query UsersLocationsInArea($center: Vector2D!, $bounds: Box2D!) {
    usersLocationsInArea(center: $center, bounds: $bounds)
  }
`;

export default usersLocationsInArea;
