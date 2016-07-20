(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.hashPersistencePlugin = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* global App */

/**
 * The notebook triggers a load id middleware event to get the starting id.
 *
 * @param {String}   id
 * @param {Function} next
 * @param {Function} done
 */
var configurePlugin = function (config, next) {
  if (!config.id) {
    config.id = window.location.hash.substr(1);
  }

  return next();
};

/**
 * The notebook will trigger an id sync middleware event when the id changes.
 *
 * @param {String}   id
 * @param {Function} next
 * @param {Function} done
 */
App.config.on('change:id', function (_, id) {
  id = (id == null ? '' : String(id));

  window.location.hash = id;
});

/**
 * A user can use the forward and back buttons to navigate between notebooks.
 */
window.addEventListener('hashchange', function () {
  var id  = window.location.hash.substr(1);
  var url = window.location.href;

  App.config.set('id',      id);
  App.config.set('url',     url);
  App.config.set('fullUrl', url);
});

/**
 * Export the plugin architecture for direct use.
 *
 * @type {Object}
 */
module.exports = {
  'application:config': configurePlugin
};

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvc2NyaXB0cy9wbHVnaW5zL2hhc2gtcGVyc2lzdGVuY2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyogZ2xvYmFsIEFwcCAqL1xuXG4vKipcbiAqIFRoZSBub3RlYm9vayB0cmlnZ2VycyBhIGxvYWQgaWQgbWlkZGxld2FyZSBldmVudCB0byBnZXQgdGhlIHN0YXJ0aW5nIGlkLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSAgIGlkXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBuZXh0XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBkb25lXG4gKi9cbnZhciBjb25maWd1cmVQbHVnaW4gPSBmdW5jdGlvbiAoY29uZmlnLCBuZXh0KSB7XG4gIGlmICghY29uZmlnLmlkKSB7XG4gICAgY29uZmlnLmlkID0gd2luZG93LmxvY2F0aW9uLmhhc2guc3Vic3RyKDEpO1xuICB9XG5cbiAgcmV0dXJuIG5leHQoKTtcbn07XG5cbi8qKlxuICogVGhlIG5vdGVib29rIHdpbGwgdHJpZ2dlciBhbiBpZCBzeW5jIG1pZGRsZXdhcmUgZXZlbnQgd2hlbiB0aGUgaWQgY2hhbmdlcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gICBpZFxuICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZG9uZVxuICovXG5BcHAuY29uZmlnLm9uKCdjaGFuZ2U6aWQnLCBmdW5jdGlvbiAoXywgaWQpIHtcbiAgaWQgPSAoaWQgPT0gbnVsbCA/ICcnIDogU3RyaW5nKGlkKSk7XG5cbiAgd2luZG93LmxvY2F0aW9uLmhhc2ggPSBpZDtcbn0pO1xuXG4vKipcbiAqIEEgdXNlciBjYW4gdXNlIHRoZSBmb3J3YXJkIGFuZCBiYWNrIGJ1dHRvbnMgdG8gbmF2aWdhdGUgYmV0d2VlbiBub3RlYm9va3MuXG4gKi9cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdoYXNoY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuICB2YXIgaWQgID0gd2luZG93LmxvY2F0aW9uLmhhc2guc3Vic3RyKDEpO1xuICB2YXIgdXJsID0gd2luZG93LmxvY2F0aW9uLmhyZWY7XG5cbiAgQXBwLmNvbmZpZy5zZXQoJ2lkJywgICAgICBpZCk7XG4gIEFwcC5jb25maWcuc2V0KCd1cmwnLCAgICAgdXJsKTtcbiAgQXBwLmNvbmZpZy5zZXQoJ2Z1bGxVcmwnLCB1cmwpO1xufSk7XG5cbi8qKlxuICogRXhwb3J0IHRoZSBwbHVnaW4gYXJjaGl0ZWN0dXJlIGZvciBkaXJlY3QgdXNlLlxuICpcbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuICAnYXBwbGljYXRpb246Y29uZmlnJzogY29uZmlndXJlUGx1Z2luXG59O1xuIl19
