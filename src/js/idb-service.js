import idb from 'idb';

export default class IDBService {
  constructor() {
    this.openDatabase();
  }

  /**
   * Create IDB if does not exist
   */
  openDatabase() {
    this.dbPromise = idb.open('restaurant-reviews-idb', 1, (upgradeDb) => {
      if (!upgradeDb.objectStoreNames.contains('restaurants')) {
        upgradeDb.createObjectStore('restaurants', {
          keyPath: 'id',
        });
      }

      if (!upgradeDb.objectStoreNames.contains('restaurants-reviews')) {
        const store = upgradeDb.createObjectStore('restaurants-reviews', {
          keyPath: 'id',
        });

        store.createIndex('restaurantID', ['restaurant_id'], { unique: false });
      }
    });
  }

  /**
   * Get all restaurants info
   */
  getRestaurants() {
    return this.dbPromise.then(db => db.transaction('restaurants', 'readonly')
      .objectStore('restaurants').getAll());
  }

  /**
   * Get restaurant info by id
   *
   * @param  {} id
   */
  getRestaurantById(id) {
    return this.dbPromise.then(db => db.transaction('restaurants', 'readonly')
      .objectStore('restaurants').get(id));
  }

  /**
   * Save Restaurants in database

   * @param  {} restaurants
   */
  saveRestaurants(restaurants) {
    return this.dbPromise.then((db) => {
      const tx = db.transaction('restaurants', 'readwrite');
      const store = tx.objectStore('restaurants');

      for (let i = 0; i < restaurants.length; i += 1) {
        store.put(restaurants[i]);
      }

      return tx.complete;
    }).then(() => console.log('Succefully added restaurants to database'))
      .catch(() => console.error('Failed adding restaurants to database'));
  }


  /**
   * Get restaurant reviews by retaurant id
   *
   * @param  {} id
   */
  getRestaurantReviewsById(id) {
    return this.dbPromise.then(db => db.transaction('restaurants-reviews')
      .objectStore('restaurants-reviews').index('restaurantID').getAll([Number.parseInt(id, 10)]));
  }


  /**
   * Save restaurant review.
   *
   * @param  {} review
   */
  saveRestaurantReview(review) {
    return this.dbPromise.then((db) => {
      const tx = db.transaction('restaurants-reviews', 'readwrite');
      const store = tx.objectStore('restaurants-reviews');

      store.put(review);

      return tx.complete;
    }).then(() => {
      console.log('Succefully added reviews to database');
      return review;
    }).catch(() => console.error('Error saving reviews'));
  }
}
