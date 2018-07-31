/* global window, document, navigator */
import StarRating from 'star-rating.js/';
import 'star-rating.js/dist/star-rating.css';

import '../css/restaurant.css';
import { GoogleMapsLoader } from './bundle';
import DBHelper from './dbhelper';

class RestaurantInfo {
  constructor() {
    this.restaurant = null;
    this.map = {};
    this.markers = [];
  }

  /**
   * Create review HTML and add it to the webpage.
   */
  static createReviewHTML(review) {
    const li = document.createElement('li');
    const name = document.createElement('p');
    name.innerHTML = review.name;
    li.appendChild(name);

    const date = document.createElement('p');
    date.innerHTML = new Date(review.createdAt).toDateString();
    li.appendChild(date);

    const rating = document.createElement('p');
    rating.innerHTML = `Rating: ${review.rating}`;
    li.appendChild(rating);

    const comments = document.createElement('p');
    comments.innerHTML = review.comments;
    li.appendChild(comments);

    return li;
  }

  /**
   * Create all reviews HTML and add them to the webpage.
   */
  static fillReviewsHTML(reviews) {
    const container = document.getElementById('reviews-container');

    if (!reviews) {
      const noReviews = document.createElement('p');
      noReviews.innerHTML = 'No reviews yet!';
      container.appendChild(noReviews);
      return;
    }
    const ul = document.getElementById('reviews-list');

    reviews.forEach((review) => {
      ul.appendChild(RestaurantInfo.createReviewHTML(review));
    });
    container.appendChild(ul);
  }

  /**
   * Add restaurant name to the breadcrumb navigation menu
   */
  static fillBreadcrumb(restaurant) {
    const breadcrumb = document.getElementById('breadcrumb');
    const li = document.createElement('li');
    li.innerHTML = restaurant.name;

    breadcrumb.appendChild(li);
  }

  /**
   * Create restaurant operating hours HTML table and add it to the webpage.
   */
  static fillRestaurantHoursHTML(operatingHours) {
    const hours = document.getElementById('restaurant-hours');
    for (const key in operatingHours) { // eslint-disable-line no-restricted-syntax, guard-for-in
      const row = document.createElement('tr');

      const day = document.createElement('td');
      day.innerHTML = key;
      row.appendChild(day);

      const time = document.createElement('td');
      time.innerHTML = operatingHours[key];
      row.appendChild(time);

      hours.appendChild(row);
    }
  }

  /**
   * Create restaurant HTML and add it to the webpage
   */
  fillRestaurantHTML(restaurant) {
    const name = document.getElementById('restaurant-name');
    name.innerHTML = restaurant.name;

    const address = document.getElementById('restaurant-address');
    address.innerHTML = restaurant.address;

    const restaurantImage = DBHelper.imageForRestaurant(restaurant);


    const image = document.getElementById('restaurant-img');
    image.className = 'restaurant-img';
    image.setAttribute('srcset', restaurantImage.srcSet);
    image.setAttribute('src', restaurantImage.src);
    image.alt = `${restaurant.name} Main Image`;

    const cuisine = document.getElementById('restaurant-cuisine');
    cuisine.innerHTML = restaurant.cuisine_type;

    // fill operating hours
    if (restaurant.operating_hours) {
      RestaurantInfo.fillRestaurantHoursHTML(this.restaurant.operating_hours);
    }
  }

  /**
   * Get a parameter by name from page URL.
   */
  static getParameterByName(name, url = window.location.href) {
    const nameSanitized = name.replace(/[[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${nameSanitized}(=([^&#]*)|&|#|$)`);
    const results = regex.exec(url);
    if (!results) { return null; }
    if (!results[2]) { return ''; }
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  }

  /**
   * Get reviews by id
   */
  getRestaurantReviews() {
    if (this.reviews) {
      return Promise.resolve(this.reviews);
    }

    const id = RestaurantInfo.getParameterByName('id');
    if (!id) {
      throw new Error('Could not get parameter id');
    } else {
      return Promise.all([
        DBHelper.fetchRestaurantReviewsById(id),
        DBHelper.getPendingRestaurantReviewsById(id),
      ]).then(([reviews, pendingReviews]) => {
        console.log(reviews);
        this.reviews = reviews;

        // fill reviews
        RestaurantInfo.fillReviewsHTML(this.reviews);
        RestaurantInfo.fillReviewsHTML(pendingReviews);
      }).catch(console.error);
    }
  }

  /**
   * Get current restaurant from page URL.
   */
  fetchRestaurantFromURL() {
    if (this.restaurant) { // restaurant already fetched!
      return Promise.resolve(this.restaurant);
    }
    const id = RestaurantInfo.getParameterByName('id');

    if (!id) { // no id found in URL
      throw new Error('No restaurant id in URL');
    } else {
      return DBHelper.fetchRestaurantById(id).then((restaurant) => {
        this.restaurant = restaurant;

        this.getRestaurantReviews();
        this.fillRestaurantHTML(this.restaurant);
        return this.restaurant;
      });
    }
  }

  static handleReviewSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const restaurant_id = Number.parseInt(RestaurantInfo.getParameterByName('id'), 10); // eslint-disable-line
    // eslint-disable-line
    const name = form.name.value;
    const rating = Number.parseInt(form.rating.value, 10);
    const comments = form.review.value;
    const updatedAt = new Date();

    DBHelper.saveRestaurantReview({
      restaurant_id,
      name,
      rating,
      comments,
      updatedAt,
    }).then((review) => {
      const ul = document.getElementById('reviews-list');
      ul.appendChild(RestaurantInfo.createReviewHTML(review));

      form.reset();
      return false;
    });
  }
}


/**
 * Initialize Google map, called from HTML.
 */
GoogleMapsLoader.load((google) => {
  const restaurantInfo = new RestaurantInfo();
  const starRatingControls = new StarRating('.star-rating'); // eslint-disable-line

  const form = document.getElementById('reviews-form');
  form.onsubmit = RestaurantInfo.handleReviewSubmit;

  restaurantInfo.fetchRestaurantFromURL()
    .then((restaurant) => {
      restaurantInfo.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false,
      });

      RestaurantInfo.fillBreadcrumb(restaurant);
      DBHelper.mapMarkerForRestaurant(restaurant, restaurantInfo.map);

      const map = document.getElementById('map');
      const mapPlaceholder = document.getElementById('map-placeholder');
      map.style.display = 'block';
      mapPlaceholder.style.display = 'none';
    })
    .catch(console.err);
});


window.addEventListener('load', () => {
  function updateOnlineStatus() {
    if (navigator.onLine) {
      // handle online status
      DBHelper.savePendingRestaurantReviews();
      console.log('online');
    }
  }

  window.addEventListener('online', updateOnlineStatus);
});
