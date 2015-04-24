/**
 * Minds::mobile
 * Notifications controller
 * 
 * @author Mark Harding
 */

define(function () {
    'use strict';

    function ctrl($rootScope, $scope, $state, $ionicScrollDelegate, Cacher, Client, storage, $ionicPopover, $ionicLoading, $ionicModal, $ionicPopup, $timeout, push) {

		$scope.inprogress = false;

    	$scope.$on('$ionicView.beforeEnter', function(){
			$rootScope.newNotification = false;
			$scope.refresh();
    	});
    	
    	push.listen('notification', function(params){
    		if($state.current.name == 'tab.notifications'){
    			$rootScope.newNotification = false;
				$scope.refresh();
			}
		});
    	
		/** Cached or fresh **/
		if(Cacher.get('notification.items')){
			$scope.notificationItems = Cacher.get('notification.items');
		}else{
    		$scope.notificationItems =  [];
    	}
    	
    	/** What to load next **/
    	if(Cacher.get('notification.next'))
    		$scope.next = Cacher.get('notification.next');
    	else
    		$scope.next  = "";
    	
    	$scope.hasMoreData = true;
    	
    	/** The cache breaker **/
    	if(Cacher.get('notification.cachebreaker')){
    		$scope.cachebreaker = Cacher.get('notification.cachebreaker');
    	} else {
    		$scope.cachebreaker = 0;
    	}

    	/** Load more notifications **/
    	$scope.loadMore = function(){
    	
    		if($scope.inprogress)
    			return false;
    			
    		$scope.inprogress = true;
    	
    		console.log('==== loading more notifications ====');
    	
    		if(!$scope.hasMoreData)
    			return;
    		
    		Client.get('api/v1/notifications', { limit: 12, offset: $scope.next, cachebreaker: $scope.cachebreaker }, 
    			function(data){
    				
    				$scope.inprogress = false;
    				
	    			if(!data.notifications){
	    				$scope.hasMoreData = false;
	    				$scope.$broadcast('scroll.infiniteScrollComplete');
	    				return false;
	    			} else {
	    				$scope.hasMoreData = true;
	    			};
	    			
	    			$scope.notificationItems = $scope.notificationItems.concat(data.notifications);
	    			Cacher.put('notification.items', $scope.notificationItems);
	    		
	
	    			$scope.next = data['load-next'];
	    			if(!$scope.next)
	    				$scope.hasMoreData = false;
	    			Cacher.put('notification.next', $scope.next);
	    			
	    			$scope.$broadcast('scroll.infiniteScrollComplete');
	
	    		}, 
	    		function(error){ 
	    			$scope.inprogress = false;
	    			$scope.$broadcast('scroll.infiniteScrollComplete');
	    		});
	    		
    	};
		
		$scope.refresh = function(){
		
			if($scope.inprogress)
				return false;
				
			$scope.inprogress = true;
		
			$rootScope.newNotification = false;
			Client.get('api/v1/notifications', { limit: 12, offset: '', cache_break: Date.now() }, 
				function(data){
				    		
	    			$scope.notificationItems = data.notifications;
	    			Cacher.put('notification.items', $scope.notificationItems);
	
	    			$scope.next = data['load-next'];
	    			
	    			Cacher.put('notification.cachebreaker', Date.now);
	    			
	    			$scope.$broadcast('scroll.refreshComplete');
	    			
	    			$scope.inprogress = false;
	
	    		}, 
	    		function(error){ 
	    			$scope.inprogress = false;
	    		});
			
		};
		
		$scope.subscribe = function(notification){
			notification.ownerObj.subscribed = true;
			//subscribe to the user
			Client.post('api/v1/subscribe/' + notification.ownerObj.guid, {},
					function(){
						
					},
					function(){
					});
			
			//show a quick ui confirmation
			$ionicLoading.show({
				template: '<i class="icon ion-person" style="font-size:90px"></i>'
				});
			$timeout(function(){
				$ionicLoading.hide();
				}, 300);
				
			if(notification.ownerObj.subscriber && notification.ownerObj.subscribed){
				$ionicPopup.alert({
				     title: 'Match!',
				     subTitle: notification.ownerObj.name + ' subscribed to you too!',
				     buttons: [
		               
		               {
		                 text: '<b>Send Message</b>',
		                 type: 'button-positive',
		                 onTap: function(e) {
		                	 window.location.href = "#/tab/gatherings/conversations/" + notification.ownerObj.guid + '/' + notification.ownerObj.name;
		                 }
		               },
		               
		               { text: 'Continue...' },
		             ]
				   });
			}
		};
		
		
		$scope.loadBoostReview = function(guid){
			$scope.guid = guid;
			$ionicModal.fromTemplateUrl('templates/wallet/review_boost.html', {
	 		    scope: $scope,
	 		    animation: 'slide-in-up'
	 		  }).then(function(modal) {
	 		    $scope.modal = modal;
	 		    $scope.guid = guid;
	 		    $scope.modal.show();
	 		  });
		};
		
		
    }

    ctrl.$inject = ['$rootScope', '$scope', '$state', '$ionicScrollDelegate', 'Cacher', 'Client', 'storage', '$ionicPopover', '$ionicLoading', '$ionicModal', '$ionicPopup', '$timeout', 'push'];
    return ctrl;
    
});