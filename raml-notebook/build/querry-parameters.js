function getParams() {
    var queries = window.location.search.replace(/^\?/, '').split('&');
    var searchObject = {};
    for(var i = 0; i < queries.length; i++ ) {
        var split = queries[i].split('=');
        searchObject[split[0]] = decodeURIComponent(split[1]);
    }
    return searchObject;
}

function querryString(searchObject) {
    var keys = Object.getOwnPropertyNames(searchObject);
    if(keys.length<1) return "";
    var querry = '?'+keys[0]+'='+encodeURIComponent(searchObject[keys[0]]);
    for(var i=1; i<keys.length; i++) {
        querry+='&'+keys[i]+'='+encodeURIComponent(searchObject[keys[i]]);
    }
    return querry;
}

var assemblePath = function (segments) {
    if(0==segments.length) return "";
    
    path = segments[0].replace(/\/$/, "").replace(/^\//, "");
    for(var i=1; i<segments.length; i++) {
        path += '/'+ segments[i].replace(/\/$/, "").replace(/^\//, "");
    }
    return path;
};


