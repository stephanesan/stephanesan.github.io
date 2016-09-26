(function(angular) {
      'use strict';
angular
.module('headerApp', [])
.controller('headerController', 

    function ($scope, $http, $q, $sce) {

        function updateHeader() {

            var p1 = $http({method: "get", url: "https://"+searchObject['gitApi'] + "repos/" + searchObject['gitRepo'], cache: true});
            var p2 = $http({method: "get", url: "https://"+searchObject['gitApi'] + "repos/" + searchObject['gitRepo'] + "/branches", cache: true});
            var p3 = $http({method: "get", url: "https://"+searchObject['gitApi'] + "repos/" + searchObject['gitRepo'] + "/tags", cache: true});

            $q.all([p1, p2, p3]).then(function(responses) {
                var resp1 = responses[0];
                $scope.gitHubAvatar = resp1.data.owner.avatar_url;
                $scope.gitHubOwnerHtmlURL = resp1.data.owner.html_url; 
                $scope.gitHubOwnerType = resp1.data.owner.type; 
                $scope.gitHubOwnerLogin = resp1.data.owner.login;
                $scope.gitHubRepoName = resp1.data.name;
                $scope.gitHubRepoPath = searchObject['gitPath'];
                $scope.gitHubHtmlUrl = resp1.data.html_url;

                // Build the select element
                $scope.refs = {};
                $scope.refs.availableOptions = [];
                // Set the branch options 
                var branches = filterArray(responses[1].data, headerConfig.branches);
                var found = false;
                var replacement = null;
                if(branches.length != 0) {
                    $scope.refs.availableOptions.push({id: "branches", name: "branches", disabled: true});
                    branches.forEach(function(branch){
                        $scope.refs.availableOptions.push({id: branch.name, name: branch.name});
                        if(branch.name === searchObject['gitRef']) found=true;
                        else replacement = branch.name;
                    });
                }
                // Set the tag options
                var tags = filterArray(responses[2].data, headerConfig.tags); 
                if(tags.length != 0) {
                    $scope.refs.availableOptions.push({id: "tags", name: "tags", disabled: true});
                    tags.forEach(function(tag){
                        $scope.refs.availableOptions.push({id: tag.name, name: tag.name});
                        if(tag.name === searchObject['gitRef']) found=true;
                        else replacement = tag.name;
                    });
                }
                
                if(!found) {
                    // bad ref, force it to the last matching entry;
                    searchObject['gitRef'] = replacement;
                    console.log("Default ");
                    history.pushState(
                            null, 
                            null, 
                            window.location.search.replace(/^\?.*/, querryString(searchObject)));
                }


                // Set the selected option
                $scope.refs.selectedOption= {id: searchObject['gitRef']};
                $scope.refs.changed = function() {
                    searchObject['gitRef'] = $scope.refs.selectedOption.id; 
                    history.pushState(
                            null, 
                            null, 
                            window.location.search.replace(/^\?.*/, querryString(searchObject)));
                    updateIframe();
                };

                // We're done, display load the iframe and display the header
                updateIframe();
                $scope.gitHeader=true;
            });
        }

        function filterArray(array, config) {
            var out = [];
            if(config == undefined) {
                // all pass if no filter defined.
                return array;
            }
            if(config.pattern == undefined ||
               config.flags == undefined ) {
                   // all fail if no pattern or no flags defined.
                   return out;
            }
            var regExp = new RegExp(config.pattern, config.flags); 
            array.forEach(function(el){
                if(regExp.test(el.name)) {
                    out.push(el);
                }
            });
            return out;
        }

        function getHeaderConfig() {
            var configFile = "config/"+searchObject['gitRepo'].replace(/\//, '_')+".json"; 
            console.log("Load config from "+configFile);
            $http(
                    {
                        method: "get", 
                        url: configFile,  
                        cache: true
                    }
                ).then(
                    function(response) 
                    {
                        console.log("Filter: "+JSON.stringify(response.data));
                        headerConfig= response.data;
                        if(undefined == searchObject['gitRef'] && undefined != headerConfig.ref) {
                            searchObject['gitRef'] = headerConfig.ref;
                        }
                        updateHeader();
                    }, 
                    function(response) 
                    {
                        console.log("Default filter: "+JSON.stringify(headerConfig));
                        updateHeader();
                    }
                );
        }
        
        function updateIframe() {
            console.log(querryString(searchObject));
            $scope.ramlLocation = $sce.trustAsResourceUrl("./content.html"+ querryString(searchObject));
        }

        var searchObject = getParams();
        var headerConfig = { };
        getHeaderConfig(); 

    });


})(window.angular);
