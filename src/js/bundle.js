import 'normalize.css';
import '../css/core.css';
import GoogleMapsLoader from 'google-maps';
import registerServiceWorker from './sw-register';

GoogleMapsLoader.KEY = 'AIzaSyDiRsB2-0W-Xvg4-mntbBG3DHYusvpBeCc';

registerServiceWorker();

export { GoogleMapsLoader };
