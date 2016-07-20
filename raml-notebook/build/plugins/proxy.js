(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.proxyPlugin = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* global App */
var _         = App.Library._;
var url       = App.Library.url;
var PROXY_URL = {"github":{"clientId":"stephanesan","clientSecret":"..."}}.proxy && {"github":{"clientId":"stephanesan","clientSecret":"..."}}.proxy.url;

/**
 * Augment the ajax middleware with proxy urls when we make requests to a
 * recognised API endpoint.
 *
 * @param  {Object}   data
 * @param  {Function} next
 */
var ajaxPlugin = function (data, next) {
  // Allow the proxy to be bypassed completely.
  if (data.proxy === false) {
    return next();
  }

  var uri   = url.parse(data.url);
  var proxy = _.isString(data.proxy) ? data.proxy : PROXY_URL;

  // Attach the proxy if the url is not a relative url.
  if (proxy && uri.protocol && uri.host) {
    data.url = url.resolve(window.location.href, proxy) + '/' + data.url;
  }

  return next();
};

/**
 * A { key: function } map of all middleware used in the plugin.
 *
 * @type {Object}
 */
module.exports = {
  'ajax': ajaxPlugin
};

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvc2NyaXB0cy9wbHVnaW5zL3Byb3h5LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiBnbG9iYWwgQXBwICovXG52YXIgXyAgICAgICAgID0gQXBwLkxpYnJhcnkuXztcbnZhciB1cmwgICAgICAgPSBBcHAuTGlicmFyeS51cmw7XG52YXIgUFJPWFlfVVJMID0ge1wiZ2l0aHViXCI6e1wiY2xpZW50SWRcIjpcInN0ZXBoYW5lc2FuXCIsXCJjbGllbnRTZWNyZXRcIjpcIi4uLlwifX0ucHJveHkgJiYge1wiZ2l0aHViXCI6e1wiY2xpZW50SWRcIjpcInN0ZXBoYW5lc2FuXCIsXCJjbGllbnRTZWNyZXRcIjpcIi4uLlwifX0ucHJveHkudXJsO1xuXG4vKipcbiAqIEF1Z21lbnQgdGhlIGFqYXggbWlkZGxld2FyZSB3aXRoIHByb3h5IHVybHMgd2hlbiB3ZSBtYWtlIHJlcXVlc3RzIHRvIGFcbiAqIHJlY29nbmlzZWQgQVBJIGVuZHBvaW50LlxuICpcbiAqIEBwYXJhbSAge09iamVjdH0gICBkYXRhXG4gKiBAcGFyYW0gIHtGdW5jdGlvbn0gbmV4dFxuICovXG52YXIgYWpheFBsdWdpbiA9IGZ1bmN0aW9uIChkYXRhLCBuZXh0KSB7XG4gIC8vIEFsbG93IHRoZSBwcm94eSB0byBiZSBieXBhc3NlZCBjb21wbGV0ZWx5LlxuICBpZiAoZGF0YS5wcm94eSA9PT0gZmFsc2UpIHtcbiAgICByZXR1cm4gbmV4dCgpO1xuICB9XG5cbiAgdmFyIHVyaSAgID0gdXJsLnBhcnNlKGRhdGEudXJsKTtcbiAgdmFyIHByb3h5ID0gXy5pc1N0cmluZyhkYXRhLnByb3h5KSA/IGRhdGEucHJveHkgOiBQUk9YWV9VUkw7XG5cbiAgLy8gQXR0YWNoIHRoZSBwcm94eSBpZiB0aGUgdXJsIGlzIG5vdCBhIHJlbGF0aXZlIHVybC5cbiAgaWYgKHByb3h5ICYmIHVyaS5wcm90b2NvbCAmJiB1cmkuaG9zdCkge1xuICAgIGRhdGEudXJsID0gdXJsLnJlc29sdmUod2luZG93LmxvY2F0aW9uLmhyZWYsIHByb3h5KSArICcvJyArIGRhdGEudXJsO1xuICB9XG5cbiAgcmV0dXJuIG5leHQoKTtcbn07XG5cbi8qKlxuICogQSB7IGtleTogZnVuY3Rpb24gfSBtYXAgb2YgYWxsIG1pZGRsZXdhcmUgdXNlZCBpbiB0aGUgcGx1Z2luLlxuICpcbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuICAnYWpheCc6IGFqYXhQbHVnaW5cbn07XG4iXX0=
