!function(){"use strict";function n(){function n(n){t=n.appName||"(Application Root)",n.appId&&(window.appInsights.start?window.appInsights.start(n.appId):angular.isFunction(window.appInsights)?window.appInsights=window.appInsights({instrumentationKey:n.appId}):window.appInsights.config&&(window.appInsights.config.instrumentationKey=n.appId)),window.appInsights.config.instrumentationKey||console.warn("Application Insights not initialized")}this.start=function(a,t){var o;angular.isObject(a)?o=a:angular.isString(a)&&(o={appId:a,appName:t}),n(o)},this.$get=function(){return window.appInsights||o}}function a(n,a,o){n.$on("$locationChangeStart",function(){var n;try{n=t+"/"+a.path().substr(1)}finally{o.startTrackPage(n)}}),n.$on("$locationChangeSuccess",function(n,i){var r;try{r=t+"/"+a.path().substr(1)}finally{o.stopTrackPage(r,i)}})}angular.module("angular-appinsights",[]).provider("insights",n).run(["$rootScope","$location","insights",a]);var t="",o={startTrackPage:angular.noop,stopTrackPage:angular.noop,trackPageView:angular.noop,startTrackEvent:angular.noop,stopTrackEvent:angular.noop,trackEvent:angular.noop,trackDependency:angular.noop,trackException:angular.noop,trackMetric:angular.noop,trackTrace:angular.noop,flush:angular.noop,setAuthenticatedUserContext:angular.noop,clearAuthenticatedUserContext:angular.noop}}();