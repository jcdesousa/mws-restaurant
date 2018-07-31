/* global document, google, window */
import lozad from 'lozad';
import '../css/index.css';
import { GoogleMapsLoader } from './bundle';
import DBHelper from './dbhelper';
import heartSvg from '../assets/heart.svg';

const observer = lozad();

class RestaurantsMain {
  constructor() {
    this.restaurants = [];
    this.neighborhoods = [];
    this.cuisines = [];
    this.map = {};
    this.markers = [];

    this.loadRestaurants();
  }

  /**
   * Set neighborhoods HTML.
   */
  fillNeighborhoodsHTML() {
    const select = document.getElementById('neighborhoods-select');
    this.neighborhoods.forEach((neighborhood) => {
      const option = document.createElement('option');
      option.innerHTML = neighborhood;
      option.value = neighborhood;
      select.append(option);
    });
  }

  /**
   * Set cuisines HTML.
   */
  fillCuisinesHTML() {
    const select = document.getElementById('cuisines-select');

    this.cuisines.forEach((cuisine) => {
      const option = document.createElement('option');
      option.innerHTML = cuisine;
      option.value = cuisine;
      select.append(option);
    });
  }

  /**
   * Fetch all neighborhoods and set their HTML.
   */
  fetchNeighborhoods() {
    return DBHelper.fetchNeighborhoods()
      .then((neighborhoods) => {
        this.neighborhoods = neighborhoods;
        this.fillNeighborhoodsHTML();
      }).catch(console.error);
  }

  /**
   * Fetch all cuisines and set their HTML.
   */
  fetchCuisines() {
    return DBHelper.fetchCuisines()
      .then((cuisines) => {
        this.cuisines = cuisines;
        this.fillCuisinesHTML();
      }).catch(console.error);
  }


  /**
   * Clear current restaurants, their HTML and remove their map markers.
   */
  resetRestaurants(restaurants) {
    // Remove all restaurants
    this.restaurants = [];
    const ul = document.getElementById('restaurants-list');
    ul.innerHTML = '';

    // Remove all map markers
    this.markers.forEach(m => m.setMap(null));
    this.markers = [];
    this.restaurants = restaurants;
  }

  /**
   * Add markers for current restaurants to the map.
   */
  addMarkersToMap() {
    this.restaurants.forEach((restaurant) => {
      // Add marker to the map
      const marker = DBHelper.mapMarkerForRestaurant(restaurant, window.map);
      google.maps.event.addListener(marker, 'click', () => {
        window.location.href = marker.url;
      });
      this.markers.push(marker);
    });

    const map = document.getElementById('map');
    const mapPlaceholder = document.getElementById('map-placeholder');
    map.style.display = 'block';
    mapPlaceholder.style.display = 'none';
  }

  static handleFavoriteClick(elem, restaurant) {
    restaurant.is_favorite = restaurant.is_favorite === 'true' ? 'false' : 'true'; // eslint-disable-line no-param-reassign

    if (restaurant.is_favorite === 'true') {
      elem.classList.add('favorite');
    } else {
      elem.classList.remove('favorite');
    }

    DBHelper.favoriteRestaurant(restaurant);
  }

  loadStaticMap() {
    const staticUrl = ["https://maps.googleapis.com/maps/api/staticmap?center=40.722216,-73.987501&zoom=12&size=636x132&maptype=roadmap&key=AIzaSyDiRsB2-0W-Xvg4-mntbBG3DHYusvpBeCc"];
    this.restaurants.forEach((restaurant) => {
      // Add marker to the map
      const { latlng } = restaurant;
      if (latlng) {
        staticUrl.push(`&markers=size:small%7Ccolor:red%7C${latlng.lat},${latlng.lng}`);
      }
    });

    const map = document.getElementById('map-placeholder');

    const image = document.createElement('img');
    image.src = staticUrl.join("");
    image.alt = `An image of google maps with restaurant markers`;
    
    const self = this;

    image.addEventListener('click', function () {
      self.loadGoogleMap();
    });

    map.append(image);
  }

  /**
   * Create restaurant HTML.
   */
  static createRestaurantHTML(restaurant, tabIndex) {
    const restaurantImage = DBHelper.imageForRestaurant(restaurant);
    const li = document.createElement('li');

    const favoriteContainer = document.createElement('div');
    favoriteContainer.className = 'restaurant-heart';

    if (restaurant.is_favorite === 'true') {
      favoriteContainer.classList.add('favorite');
    }

    favoriteContainer.addEventListener('click', function () {
      return RestaurantsMain.handleFavoriteClick(this, restaurant);
    });

    favoriteContainer.innerHTML = heartSvg;

    li.appendChild(favoriteContainer);

    const image = document.createElement('img');
    image.className = 'restaurant-img lozad';
    image.setAttribute('data-srcset', restaurantImage.srcSet);
    image.setAttribute('data-src', restaurantImage.src);
    image.alt = `An image of ${restaurant.name} Restaurant`;

    li.append(image);


    const name = document.createElement('h2');
    name.innerHTML = restaurant.name;
    li.append(name);

    const neighborhood = document.createElement('p');
    neighborhood.innerHTML = restaurant.neighborhood;
    li.append(neighborhood);

    const address = document.createElement('p');
    address.innerHTML = restaurant.address;
    li.append(address);

    const more = document.createElement('a');
    more.innerHTML = 'View Details';
    more.href = DBHelper.urlForRestaurant(restaurant);
    more.setAttribute('tabindex', tabIndex.toString());
    more.setAttribute('aria-label', `View Details for ${restaurant.name}`);
    li.append(more);

    return li;
  }


  /**
   * Create all restaurants HTML and add them to the webpage.
   */
  fillRestaurantsHTML() {
    let tabIndex = 3;

    this.loadStaticMap();

    const ul = document.getElementById('restaurants-list');
    this.restaurants.forEach((restaurant) => {
      ul.append(RestaurantsMain.createRestaurantHTML(restaurant, tabIndex));
      tabIndex += 1;
    });

    observer.observe();
  }

  /**
   * load page and map for current restaurants.
   */
  loadRestaurants() {
    const cSelect = document.getElementById('cuisines-select');
    const nSelect = document.getElementById('neighborhoods-select');

    const cIndex = cSelect.selectedIndex;
    const nIndex = nSelect.selectedIndex;

    const cuisine = cSelect[cIndex].value;
    const neighborhood = nSelect[nIndex].value;

    return DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood)
      .then((restaurants) => {
        this.resetRestaurants(restaurants);
        this.fillRestaurantsHTML(restaurants);
      }).catch(console.error);
  }

  /**
 * Initialize Google map, called from HTML.
 */

  loadGoogleMap() {
    GoogleMapsLoader.load((google) => {
      const loc = {
        lat: 40.722216,
        lng: -73.987501,
      };
      window.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: loc,
        scrollwheel: false,
      });

      this.addMarkersToMap();
    });
  }
}



document.addEventListener("DOMContentLoaded", function (event) {
  const restaurantsMain = new RestaurantsMain();

  restaurantsMain.fetchNeighborhoods();
  restaurantsMain.fetchCuisines();
});