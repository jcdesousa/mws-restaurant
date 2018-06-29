/* global document, google, window */
import lozad from 'lozad';
import '../css/index.css';
import { GoogleMapsLoader } from './bundle';
import DBHelper from './dbhelper';
import heartSvg from '../assets/heart.svg';

const observer = lozad();

window.neighborhoods = [];
window.cuisines = [];
window.map = {};
window.markers = [];
/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = window.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach((neighborhood) => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = window.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach((cuisine) => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, results) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      window.neighborhoods = results;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
  DBHelper.fetchCuisines((error, results) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      window.cuisines = results;
      fillCuisinesHTML();
    }
  });
};

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = (restaurants) => {
  // Remove all restaurants
  window.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  window.markers.forEach(m => m.setMap(null));
  window.markers = [];
  window.restaurants = restaurants;
};

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = window.restaurants) => {
  restaurants.forEach((restaurant) => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, window.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url;
    });
    window.markers.push(marker);
  });

  const map = document.getElementById('map');
  const mapPlaceholder = document.getElementById('map-placeholder');
  map.style.display = 'block';
  mapPlaceholder.style.display = 'none';
};

function handleFavoriteClick(elem, restaurant) {
  restaurant.is_favorite = restaurant.is_favorite === 'true' ? 'false' : 'true'; // eslint-disable-line no-param-reassign

  if (restaurant.is_favorite === 'true') {
    elem.classList.add('favorite');
  } else {
    elem.classList.remove('favorite');
  }

  DBHelper.favoriteRestaurant(restaurant);
}

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant, tabIndex) => {
  const restaurantImage = DBHelper.imageForRestaurant(restaurant);
  const li = document.createElement('li');

  const favoriteContainer = document.createElement('div');
  favoriteContainer.className = 'restaurant-heart';

  if (restaurant.is_favorite === 'true') {
    favoriteContainer.classList.add('favorite');
  }

  favoriteContainer.addEventListener('click', function () {
    return handleFavoriteClick(this, restaurant);
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
};


/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = window.restaurants) => {
  let tabIndex = 3;

  addMarkersToMap();

  const ul = document.getElementById('restaurants-list');
  restaurants.forEach((restaurant) => {
    ul.append(createRestaurantHTML(restaurant, tabIndex));
    tabIndex += 1;
  });

  observer.observe();
};

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  });
};

/**
 * Initialize Google map, called from HTML.
 */
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

  updateRestaurants();
});

