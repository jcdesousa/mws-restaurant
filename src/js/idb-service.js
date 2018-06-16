import idb from 'idb';

export default class IDBService {
  constructor() {
    this.openDatabase();
  }
  /**
   * Create IDB if does not exist.
   */
  openDatabase() {
    this.dbPromise = idb.open('restaurant-reviews-idb', 1, (upgradeDb) => {
      if (!upgradeDb.objectStoreNames.contains('restaurants')) {
        upgradeDb.createObjectStore('restaurants', {
          keyPath: 'id',
        });
      }
    });
  }

  /**
   * Get all restaurants
   */
  getRestaurants() {
    return this.dbPromise.then(db => db.transaction('restaurants', 'readonly')
      .objectStore('restaurants').getAll());
  }

  /**
   * Get restaurant by id
   */
  getRestaurantById(id) {
    return this.dbPromise.then(db => db.transaction('restaurants', 'readonly')
      .objectStore('restaurants').get(id));
  }

  /**
   * Save Restaurants
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
}
