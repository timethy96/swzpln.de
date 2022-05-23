import {initMap, initSearch} from "./mapFunctions.js";
import {initUI} from "./UIFunctions.js";

// initialize the map view, by passing the ID of the map container to the function
map = initMap('map');
initSearch('#search_form'); //init search by passing search-form id

initUI();