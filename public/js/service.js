var mainApp =angular.module("TimesheetApp");
mainApp.service('timesheetStore',function($cookieStore){

	this.addItem =function(key,value){
		$cookieStore.put(key,value);
	}

	this.getItem =function(key){
		return $cookieStore.get(key);
	}
});
