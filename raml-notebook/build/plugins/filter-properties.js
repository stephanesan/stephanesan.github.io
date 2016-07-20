(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.filterPropertiesPlugin = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;

module.exports = function forEach (obj, fn, ctx) {
    if (toString.call(fn) !== '[object Function]') {
        throw new TypeError('iterator must be a function');
    }
    var l = obj.length;
    if (l === +l) {
        for (var i = 0; i < l; i++) {
            fn.call(ctx, obj[i], i, obj);
        }
    } else {
        for (var k in obj) {
            if (hasOwn.call(obj, k)) {
                fn.call(ctx, obj[k], k, obj);
            }
        }
    }
};


},{}],2:[function(require,module,exports){
var each = require('foreach');

/**
 * Simple function to transform an array into an object. This is useful for
 * certain types of data and where it would be unreasonable to loop constantly
 * though an array we can do constant time lookups on an object.
 *
 * @param  {Array|String|Object} array
 * @return {Object}
 */
module.exports = function (array) {
  var obj = {};

  each(array, function (value) {
    obj[value] = true;
  });

  return obj;
};

},{"foreach":1}],3:[function(require,module,exports){
var toObj = require('../lib/objectify');

// Keep a reference to all the keys defined on the root object prototype.
var objectPrototypeKeys = toObj(Object.getOwnPropertyNames(Object.prototype));

// Keep a reference to all the keys on a function created by the function.
var functionPropertyKeys = toObj(Object.getOwnPropertyNames(function () {}));

/**
 * Check if the object has a direct property on it. Uses
 * `Object.prototype.hasOwnProperty` since the object we check against could
 * have been created using `Object.create(null)` which means it wouldn't have
 * `hasOwnProperty` on its prototype.
 *
 * @param  {Object}  object
 * @param  {String}  property
 * @return {Boolean}
 */
var _hasOwnProperty = function (object, property) {
  return Object.prototype.hasOwnProperty.call(object, property);
};

/**
 * Check if the property of the object was inherited from `Object.prototype`.
 * Please note: We can't just compare to `Object.prototype` since objects in an
 * iFrame will have inherited from a different prototype.
 *
 * @param  {Object} object
 * @param  {String} property
 * @return {Boolean}
 */
var isObjectProperty = function (object, property) {
  /**
   * Check whether the object has own property.
   *
   * @param  {String}  property
   * @return {Boolean}
   */
  var objectHasOwnProperty = function (property) {
    return _hasOwnProperty(object, property);
  };

  do {
    // Use `hasOwnProperty` from the Object's prototype since the object might
    // not have a property on it called
    if (objectHasOwnProperty(property)) {
      // Do a quick check to see if we are at the end of the prototype chain. If
      // we are, we need to compare the current object properties with
      // `Object.prototype` since we could just be at the end of a chain started
      // with `Object.create(null)`.
      if (Object.getPrototypeOf(object)) { return false; }
      // Don't check for an exact match of keys since if the prototype is from
      // an iFrame, it could have been modified by one of those irritating JS
      // developers that mess with prototypes directly.
      for (var key in objectPrototypeKeys) {
        if (_hasOwnProperty(objectPrototypeKeys, key)) {
          if (!objectHasOwnProperty(key)) {
            return false;
          }
        }
      }
      return true;
    }
  } while (object = Object.getPrototypeOf(object));

  return false;
};

/**
 * Check if the property of a function was inherited by the creation of the
 * function.
 *
 * @param  {Function} fn
 * @param  {String}   property
 * @return {Boolean}
 */
var isFunctionProperty = function (fn, property) {
  if (_hasOwnProperty(functionPropertyKeys, property)) { return true; }

  return !_hasOwnProperty(fn, property);
};

/**
 * Sets whether the property should be filter from autocompletion suggestions.
 *
 * @param  {Object}   data
 * @param  {Function} next
 */
var completionFilterPlugin = function (data, next, done) {
  var value   = data.result.value;
  var context = Object(data.context);

  if (typeof context === 'object' && isObjectProperty(context, value)) {
    return done(null, false);
  }

  if (typeof context === 'function' && isFunctionProperty(context, value)) {
    return done(null, false);
  }

  return next();
};

/**
 * Filters properties from being shown in the inspector.
 *
 * @param  {Object}   data
 * @param  {Function} next
 */
var inspectorFilterPlugin = function (data, next, done) {
  if (data.internal === '[[Prototype]]') {
    return done(null, false);
  }

  return next();
};

/**
 * A { key: function } map of all middleware used in the plugin.
 *
 * @type {Object}
 */
module.exports = {
  'inspector:filter':  inspectorFilterPlugin,
  'completion:filter': completionFilterPlugin
};

},{"../lib/objectify":2}]},{},[3])(3)
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZm9yZWFjaC9pbmRleC5qcyIsInNyYy9zY3JpcHRzL2xpYi9vYmplY3RpZnkuanMiLCJzcmMvc2NyaXB0cy9wbHVnaW5zL2ZpbHRlci1wcm9wZXJ0aWVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXG52YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZm9yRWFjaCAob2JqLCBmbiwgY3R4KSB7XG4gICAgaWYgKHRvU3RyaW5nLmNhbGwoZm4pICE9PSAnW29iamVjdCBGdW5jdGlvbl0nKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2l0ZXJhdG9yIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuICAgIH1cbiAgICB2YXIgbCA9IG9iai5sZW5ndGg7XG4gICAgaWYgKGwgPT09ICtsKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICBmbi5jYWxsKGN0eCwgb2JqW2ldLCBpLCBvYmopO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZm9yICh2YXIgayBpbiBvYmopIHtcbiAgICAgICAgICAgIGlmIChoYXNPd24uY2FsbChvYmosIGspKSB7XG4gICAgICAgICAgICAgICAgZm4uY2FsbChjdHgsIG9ialtrXSwgaywgb2JqKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbiIsInZhciBlYWNoID0gcmVxdWlyZSgnZm9yZWFjaCcpO1xuXG4vKipcbiAqIFNpbXBsZSBmdW5jdGlvbiB0byB0cmFuc2Zvcm0gYW4gYXJyYXkgaW50byBhbiBvYmplY3QuIFRoaXMgaXMgdXNlZnVsIGZvclxuICogY2VydGFpbiB0eXBlcyBvZiBkYXRhIGFuZCB3aGVyZSBpdCB3b3VsZCBiZSB1bnJlYXNvbmFibGUgdG8gbG9vcCBjb25zdGFudGx5XG4gKiB0aG91Z2ggYW4gYXJyYXkgd2UgY2FuIGRvIGNvbnN0YW50IHRpbWUgbG9va3VwcyBvbiBhbiBvYmplY3QuXG4gKlxuICogQHBhcmFtICB7QXJyYXl8U3RyaW5nfE9iamVjdH0gYXJyYXlcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoYXJyYXkpIHtcbiAgdmFyIG9iaiA9IHt9O1xuXG4gIGVhY2goYXJyYXksIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIG9ialt2YWx1ZV0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gb2JqO1xufTtcbiIsInZhciB0b09iaiA9IHJlcXVpcmUoJy4uL2xpYi9vYmplY3RpZnknKTtcblxuLy8gS2VlcCBhIHJlZmVyZW5jZSB0byBhbGwgdGhlIGtleXMgZGVmaW5lZCBvbiB0aGUgcm9vdCBvYmplY3QgcHJvdG90eXBlLlxudmFyIG9iamVjdFByb3RvdHlwZUtleXMgPSB0b09iaihPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhPYmplY3QucHJvdG90eXBlKSk7XG5cbi8vIEtlZXAgYSByZWZlcmVuY2UgdG8gYWxsIHRoZSBrZXlzIG9uIGEgZnVuY3Rpb24gY3JlYXRlZCBieSB0aGUgZnVuY3Rpb24uXG52YXIgZnVuY3Rpb25Qcm9wZXJ0eUtleXMgPSB0b09iaihPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhmdW5jdGlvbiAoKSB7fSkpO1xuXG4vKipcbiAqIENoZWNrIGlmIHRoZSBvYmplY3QgaGFzIGEgZGlyZWN0IHByb3BlcnR5IG9uIGl0LiBVc2VzXG4gKiBgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eWAgc2luY2UgdGhlIG9iamVjdCB3ZSBjaGVjayBhZ2FpbnN0IGNvdWxkXG4gKiBoYXZlIGJlZW4gY3JlYXRlZCB1c2luZyBgT2JqZWN0LmNyZWF0ZShudWxsKWAgd2hpY2ggbWVhbnMgaXQgd291bGRuJ3QgaGF2ZVxuICogYGhhc093blByb3BlcnR5YCBvbiBpdHMgcHJvdG90eXBlLlxuICpcbiAqIEBwYXJhbSAge09iamVjdH0gIG9iamVjdFxuICogQHBhcmFtICB7U3RyaW5nfSAgcHJvcGVydHlcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cbnZhciBfaGFzT3duUHJvcGVydHkgPSBmdW5jdGlvbiAob2JqZWN0LCBwcm9wZXJ0eSkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpO1xufTtcblxuLyoqXG4gKiBDaGVjayBpZiB0aGUgcHJvcGVydHkgb2YgdGhlIG9iamVjdCB3YXMgaW5oZXJpdGVkIGZyb20gYE9iamVjdC5wcm90b3R5cGVgLlxuICogUGxlYXNlIG5vdGU6IFdlIGNhbid0IGp1c3QgY29tcGFyZSB0byBgT2JqZWN0LnByb3RvdHlwZWAgc2luY2Ugb2JqZWN0cyBpbiBhblxuICogaUZyYW1lIHdpbGwgaGF2ZSBpbmhlcml0ZWQgZnJvbSBhIGRpZmZlcmVudCBwcm90b3R5cGUuXG4gKlxuICogQHBhcmFtICB7T2JqZWN0fSBvYmplY3RcbiAqIEBwYXJhbSAge1N0cmluZ30gcHJvcGVydHlcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cbnZhciBpc09iamVjdFByb3BlcnR5ID0gZnVuY3Rpb24gKG9iamVjdCwgcHJvcGVydHkpIHtcbiAgLyoqXG4gICAqIENoZWNrIHdoZXRoZXIgdGhlIG9iamVjdCBoYXMgb3duIHByb3BlcnR5LlxuICAgKlxuICAgKiBAcGFyYW0gIHtTdHJpbmd9ICBwcm9wZXJ0eVxuICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgKi9cbiAgdmFyIG9iamVjdEhhc093blByb3BlcnR5ID0gZnVuY3Rpb24gKHByb3BlcnR5KSB7XG4gICAgcmV0dXJuIF9oYXNPd25Qcm9wZXJ0eShvYmplY3QsIHByb3BlcnR5KTtcbiAgfTtcblxuICBkbyB7XG4gICAgLy8gVXNlIGBoYXNPd25Qcm9wZXJ0eWAgZnJvbSB0aGUgT2JqZWN0J3MgcHJvdG90eXBlIHNpbmNlIHRoZSBvYmplY3QgbWlnaHRcbiAgICAvLyBub3QgaGF2ZSBhIHByb3BlcnR5IG9uIGl0IGNhbGxlZFxuICAgIGlmIChvYmplY3RIYXNPd25Qcm9wZXJ0eShwcm9wZXJ0eSkpIHtcbiAgICAgIC8vIERvIGEgcXVpY2sgY2hlY2sgdG8gc2VlIGlmIHdlIGFyZSBhdCB0aGUgZW5kIG9mIHRoZSBwcm90b3R5cGUgY2hhaW4uIElmXG4gICAgICAvLyB3ZSBhcmUsIHdlIG5lZWQgdG8gY29tcGFyZSB0aGUgY3VycmVudCBvYmplY3QgcHJvcGVydGllcyB3aXRoXG4gICAgICAvLyBgT2JqZWN0LnByb3RvdHlwZWAgc2luY2Ugd2UgY291bGQganVzdCBiZSBhdCB0aGUgZW5kIG9mIGEgY2hhaW4gc3RhcnRlZFxuICAgICAgLy8gd2l0aCBgT2JqZWN0LmNyZWF0ZShudWxsKWAuXG4gICAgICBpZiAoT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iamVjdCkpIHsgcmV0dXJuIGZhbHNlOyB9XG4gICAgICAvLyBEb24ndCBjaGVjayBmb3IgYW4gZXhhY3QgbWF0Y2ggb2Yga2V5cyBzaW5jZSBpZiB0aGUgcHJvdG90eXBlIGlzIGZyb21cbiAgICAgIC8vIGFuIGlGcmFtZSwgaXQgY291bGQgaGF2ZSBiZWVuIG1vZGlmaWVkIGJ5IG9uZSBvZiB0aG9zZSBpcnJpdGF0aW5nIEpTXG4gICAgICAvLyBkZXZlbG9wZXJzIHRoYXQgbWVzcyB3aXRoIHByb3RvdHlwZXMgZGlyZWN0bHkuXG4gICAgICBmb3IgKHZhciBrZXkgaW4gb2JqZWN0UHJvdG90eXBlS2V5cykge1xuICAgICAgICBpZiAoX2hhc093blByb3BlcnR5KG9iamVjdFByb3RvdHlwZUtleXMsIGtleSkpIHtcbiAgICAgICAgICBpZiAoIW9iamVjdEhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSB3aGlsZSAob2JqZWN0ID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iamVjdCkpO1xuXG4gIHJldHVybiBmYWxzZTtcbn07XG5cbi8qKlxuICogQ2hlY2sgaWYgdGhlIHByb3BlcnR5IG9mIGEgZnVuY3Rpb24gd2FzIGluaGVyaXRlZCBieSB0aGUgY3JlYXRpb24gb2YgdGhlXG4gKiBmdW5jdGlvbi5cbiAqXG4gKiBAcGFyYW0gIHtGdW5jdGlvbn0gZm5cbiAqIEBwYXJhbSAge1N0cmluZ30gICBwcm9wZXJ0eVxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqL1xudmFyIGlzRnVuY3Rpb25Qcm9wZXJ0eSA9IGZ1bmN0aW9uIChmbiwgcHJvcGVydHkpIHtcbiAgaWYgKF9oYXNPd25Qcm9wZXJ0eShmdW5jdGlvblByb3BlcnR5S2V5cywgcHJvcGVydHkpKSB7IHJldHVybiB0cnVlOyB9XG5cbiAgcmV0dXJuICFfaGFzT3duUHJvcGVydHkoZm4sIHByb3BlcnR5KTtcbn07XG5cbi8qKlxuICogU2V0cyB3aGV0aGVyIHRoZSBwcm9wZXJ0eSBzaG91bGQgYmUgZmlsdGVyIGZyb20gYXV0b2NvbXBsZXRpb24gc3VnZ2VzdGlvbnMuXG4gKlxuICogQHBhcmFtICB7T2JqZWN0fSAgIGRhdGFcbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSBuZXh0XG4gKi9cbnZhciBjb21wbGV0aW9uRmlsdGVyUGx1Z2luID0gZnVuY3Rpb24gKGRhdGEsIG5leHQsIGRvbmUpIHtcbiAgdmFyIHZhbHVlICAgPSBkYXRhLnJlc3VsdC52YWx1ZTtcbiAgdmFyIGNvbnRleHQgPSBPYmplY3QoZGF0YS5jb250ZXh0KTtcblxuICBpZiAodHlwZW9mIGNvbnRleHQgPT09ICdvYmplY3QnICYmIGlzT2JqZWN0UHJvcGVydHkoY29udGV4dCwgdmFsdWUpKSB7XG4gICAgcmV0dXJuIGRvbmUobnVsbCwgZmFsc2UpO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBjb250ZXh0ID09PSAnZnVuY3Rpb24nICYmIGlzRnVuY3Rpb25Qcm9wZXJ0eShjb250ZXh0LCB2YWx1ZSkpIHtcbiAgICByZXR1cm4gZG9uZShudWxsLCBmYWxzZSk7XG4gIH1cblxuICByZXR1cm4gbmV4dCgpO1xufTtcblxuLyoqXG4gKiBGaWx0ZXJzIHByb3BlcnRpZXMgZnJvbSBiZWluZyBzaG93biBpbiB0aGUgaW5zcGVjdG9yLlxuICpcbiAqIEBwYXJhbSAge09iamVjdH0gICBkYXRhXG4gKiBAcGFyYW0gIHtGdW5jdGlvbn0gbmV4dFxuICovXG52YXIgaW5zcGVjdG9yRmlsdGVyUGx1Z2luID0gZnVuY3Rpb24gKGRhdGEsIG5leHQsIGRvbmUpIHtcbiAgaWYgKGRhdGEuaW50ZXJuYWwgPT09ICdbW1Byb3RvdHlwZV1dJykge1xuICAgIHJldHVybiBkb25lKG51bGwsIGZhbHNlKTtcbiAgfVxuXG4gIHJldHVybiBuZXh0KCk7XG59O1xuXG4vKipcbiAqIEEgeyBrZXk6IGZ1bmN0aW9uIH0gbWFwIG9mIGFsbCBtaWRkbGV3YXJlIHVzZWQgaW4gdGhlIHBsdWdpbi5cbiAqXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgJ2luc3BlY3RvcjpmaWx0ZXInOiAgaW5zcGVjdG9yRmlsdGVyUGx1Z2luLFxuICAnY29tcGxldGlvbjpmaWx0ZXInOiBjb21wbGV0aW9uRmlsdGVyUGx1Z2luXG59O1xuIl19
