/* global google, fetch, window */
/* eslint-disable global-require, eqeqeq, import/no-unresolved */

import IdbService from './idb-service';

const appDb = new IdbService();

/**
 * Common database helper functions.
 */
// Server url
const restaurantImages = {
  placeholder: require('../assets/images/placeholder.jpg?sizes[]=100,sizes[]=300,sizes[]=600'),
  1: require('../assets/images/1.jpg?sizes[]=100,sizes[]=300,sizes[]=600'),
  2: require('../assets/images/2.jpg?sizes[]=100,sizes[]=300,sizes[]=600'),
  3: require('../assets/images/3.jpg?sizes[]=100,sizes[]=300,sizes[]=600'),
  4: require('../assets/images/4.jpg?sizes[]=100,sizes[]=300,sizes[]=600'),
  5: require('../assets/images/5.jpg?sizes[]=100,sizes[]=300,sizes[]=600'),
  6: require('../assets/images/6.jpg?sizes[]=100,sizes[]=300,sizes[]=600'),
  7: require('../assets/images/7.jpg?sizes[]=100,sizes[]=300,sizes[]=600'),
  8: require('../assets/images/8.jpg?sizes[]=100,sizes[]=300,sizes[]=600'),
  9: require('../assets/images/9.jpg?sizes[]=100,sizes[]=300,sizes[]=600'),
  10: require('../assets/images/10.jpg?sizes[]=100,sizes[]=300,sizes[]=600'),
};


const url = 'http://localhost';

// Server port
const port = 1337; // Change this to your server port

export default class DBHelper {
  static get url() {
    return url;
  }

  static get port() {
    return port;
  }
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    return `${DBHelper.url}:${DBHelper.port}`;
  }

  /**
   * Restaurant Route
   */
  static get RESTAURANT_URL() {
    return 'restaurants';
  }

  /**
   * Reviews Route
   */
  static get REVIEWS_URL() {
    return 'reviews';
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants() {
    return fetch(`${DBHelper.DATABASE_URL}/${DBHelper.RESTAURANT_URL}`)
      .then((response) => {
        if (response.status === 200) {
          return response.json()
            .then((restaurants) => {
              appDb.saveRestaurants(restaurants);
              return restaurants;
            });
        }

        throw new Error(`Request failed. ${response.status}`);
      }).catch(() =>
        // if any error ocours resolve restaurants from database
        appDb.getRestaurants()
          .then(restaurants => restaurants)
          .catch(error => console.error(error)));
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id) {
    // fetch all restaurants with proper error handling.
    return DBHelper.fetchRestaurants().then((restaurants) => {
      const restaurant = restaurants.find(r => r.id == id);

      if (restaurant) { // Got the restaurant
        return restaurant;
      } // Restaurant does not exist in the database

      throw new Error('Restaurant does not exist');
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine) {
    // Fetch all restaurants  with proper error handling
    return DBHelper.fetchRestaurants()
      .then((restaurants) => {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);

        return results;
      });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood) {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants()
      .then((restaurants) => {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);

        return results;
      });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants()
      .then((restaurants) => {
        let results = restaurants;
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }

        return results;
      });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods() {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants()
      .then((restaurants) => {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);

        return uniqueNeighborhoods;
      });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines() {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants()
      .then((restaurants) => {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);

        return uniqueCuisines;
      });
  }

  /**
   * Get restaurant reviews by id from API.
   */
  static fetchRestaurantReviewsById(id) {
    return fetch(`${DBHelper.DATABASE_URL}/${DBHelper.REVIEWS_URL}/?restaurant_id=${id}`)
      .then(response => response.json())
      .then((reviews) => {
        // save reviews on IDB
        for (let i = 0; i < reviews.length; i += 1) {
          appDb.saveRestaurantReview(reviews[i]);
        }

        console.log(`Reviews data from API for restaurant: ${id}`);
        console.log(reviews);

        return reviews;
      });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image
   */
  static imageForRestaurant(restaurant) {
    const imageId = restaurant.photograph ? restaurant.photograph : 'placeholder';
    const image = restaurantImages[imageId];

    return image;
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map,
      animation: google.maps.Animation.DROP,
    });

    return marker;
  }

  /**
   *  Favorite restaurant
   */
  static favoriteRestaurant(restaurant) {
    if (!restaurant) {
      return null;
    }

    return fetch(
      `${DBHelper.DATABASE_URL}/${DBHelper.RESTAURANT_URL}/${restaurant.id}/?is_favorite=${restaurant.is_favorite}`,
      {
        method: 'PUT',
      },
    )
      .then(response => response.json())
      .then((data) => {
        appDb.saveRestaurants(window.restaurants);

        return data;
      })
      .catch(e => console.error(`${e}: Could not update.`));
  }

  /**
   * Save restaurant reviews by id.
   */
  static saveRestaurantReview(review) {
    return fetch(`${DBHelper.DATABASE_URL}/${DBHelper.REVIEWS_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(review),
    }).then(response => response.json())
      .then(data => appDb.saveRestaurantReview(data));
  }
}
