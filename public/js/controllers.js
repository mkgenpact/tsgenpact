

var TimesheetControllers = angular.module("TimesheetControllers", []);

TimesheetControllers.controller("AppController", ['$scope','$http','$location', '$rootScope','$state', 'utilFactory', 
	function($scope, $http, $location, $rootScope, $state, utilFactory)
	{    
		$rootScope.loggedIn = false;
		$rootScope.isAdmin = false;

		$http.post('/api/config').success(function(data){
			if(angular.equals('success',data.status)){
				$rootScope.config = data.config;
				$rootScope.appNameTitle = data.config.app.appName;
				} else {
				}
			}).error(function(err) {
				console.log('Error: ' + err);
		});
		
		$scope.showProfile = function(){
			$state.go("profile");
		}
	}]
);


TimesheetControllers.controller("DBEmpController", ['$scope','$http','$location', '$rootScope', '$state',
	function($scope, $http, $location, $rootScope,$state)
	{    
		$scope.user = $rootScope.user;
		$scope.login = function(model){
			console.log(model.ohrId +' '+model.pass+' '+model.userType);
			$http.post('/api/authenticate', model).success(function(data){
				console.log(model.ohrId+' Recieved from ************* '+data+': '+(angular.equals(model.ohrId,data)));
				if(angular.equals('success',data.status)){
					$rootScope.user = data;
					if(data.type == '1'){
						$state.go("dashboard" );
						//$rootScope.navigateTo("dashboard");
					} else {
						$state.go("empData" );
						//$rootScope.navigateTo("dashboardEmployee");
					}
				} else {
					console.log('Error: ' + data.err);
					alert(data.err);
				}
			}).error(function(err) {
				console.log('Error: ' + err);
			});
		}
	}]
);

TimesheetControllers.controller("NewEmployeeController", ['$scope','$http','$location', '$rootScope', '$state',
	function($scope, $http, $location, $rootScope,$state)
	{    

		$scope.registerModel = {
			ohrId: '',
			name: '',
			email: '',
			type: '',
			active: '',
			startDt: '',
			endDt: '',
			team: '',
			location: '',
			pass: ''
		}
			
		$scope.register = function(model){
			console.log(model.ohrId +' '+model.pass);
			$http.post('/api/register', model).success(function(data){
				console.log(model.ohrId+' Recieved from ************* '+data+': '+(angular.equals(model.ohrId,data)));
				if(angular.equals('success',data.status)){
					alert('Succesfully saved the data');
					$state.go("seeAllEmployee");
					//$rootScope.navigateTo("seeAllEmployee");
				} else {
					alert(data.err);
				}
			}).error(function(err) {
				console.log('Error: ' + err);
			});
		}
		  
	}]
);
TimesheetControllers.controller("TimesheetController", ['$scope','$http','$location', '$rootScope', '$state','utilFactory',
	function($scope, $http, $location, $rootScope,$state, utilFactory)
	{    

		$scope.isUpdate = false;
		$scope.showEdit = false;

		var currentMonth = new Date().getMonth()+1;
		var currentYear = new Date().getFullYear();
		$scope.tsModel = {
			ohrId: '',
			name: '',
			month: '',
			year: currentYear,
			clientDays: '',
			genpactDays: '',
			leaveTaken: ''
		}
		$scope.dataExists = false;
		
		$scope.getTotalDays = function(model){
			model.ohrId = $rootScope.user.ohrId;
			$scope.showEdit = false;
			$scope.isUpdate = false;
			$scope.dataExists = false;

			$http.post('/api/wdays', model).success(function(data){
				if(angular.equals('success',data.status)){
					$scope.dataExists = false;
					$scope.wdays = data.wdays;
					$scope.tsModel.clientDays = null;
					$scope.tsModel.genpactDays = null;
					$scope.tsModel.leaveTaken = null;
				} else if(angular.equals('EXIST',data.status)) {
					$scope.tsModel.clientDays = data.clientDays;
					$scope.tsModel.genpactDays = data.genpactDays;
					$scope.tsModel.leaveTaken = data.leaveTaken;
					$scope.wdays = data.wdays;
					$scope.dataExists = true;
					$scope.showEdit = true;
					alert('You have already submitted the data for selected Month. If you want to re-submit, click on EDIT button.');
					return;
				} else {
					
				}
			}).error(function(err) {
				console.log('Error: ' + err);
			});
		}
		$scope.edit = function(){
			$scope.dataExists = false;
			$scope.wdays = null;
			$scope.isUpdate = true;
		}
		$scope.createTS = function(model){

			/*$("#tsMCloseBtn").click();*/
			$("#myModal").removeClass("in");
	    	$(".modal-backdrop").remove();
	    	$("#myModal").hide();


			var postApi = '/api/create';
			model.name = $rootScope.user.name;
			model.ohrId = $rootScope.user.ohrId;
			console.log(model.ohrId +' '+model.name);
			if($scope.isUpdate)postApi = '/api/update/timesheet';
			$http.post(postApi, model).success(function(data){
				console.log(model.ohrId+' Recieved from ************* '+data+': '+(angular.equals(model.ohrId,data)));
				if(angular.equals('success',data.status)){
					$scope.showEdit = false;
					$rootScope.navigateTo("empData");
				} else {
					alert(data.err);
				}
			}).error(function(err) {
				console.log('Error: ' + err);
			});


			
		}

		$scope.validateTs = function(model){
			if(model.year == '' || model.year == null || model.month == '' || model.month == null || model.clientDays == '' || model.clientDays == null || model.genpactDays == '' || model.genpactDays == null){
				alert('Please fill in the fields marked mandatory!!');
				return;
			}
			if(isNaN(model.clientDays)) {
				alert('Not a Number');
				return;
			}
			if(isNaN(model.genpactDays)) {
				alert('Not a Number');
				return;
			}

			if(currentMonth<model.month.id && currentYear==model.year){
				alert('You can not fill the future timesheet!.');
				return;
			}
			
			$("#myModal").find("h4.modal-title").html("Timesheet Confirmation");
			$("#myModal").find("div.modal-body").empty();
			$("#myModal").find("div.modal-body").html("<h4>Are you sure you have validated your Nomura PPM timesheet and Genpact timesheet before submitting ?,Wrong details will be escalated. </h4>");
			$("#myModal").modal('show');

		}


		  
	}]
);
TimesheetControllers.controller("timesheetReportController", ['$scope','$http','$location', '$rootScope','$state', function($scope, $http, $location, $rootScope,$state){
	var currentMonth = new Date().getMonth() + 1;
	var currentYear = new Date().getFullYear();
	$scope.repModel = {
		month: currentMonth,
		year: currentYear
	}
	
	$scope.allData = [];
	$scope.getDetails = function(model){
		if(model.month == '' || model.month == null || model.year == '' || model.year == null){
			alert('Please select all the criteria!!');
			return;
		}

		$http.post('/api/monthdata', model).success(function(data){
			if(angular.equals('success',data.status)){
				$scope.allData = data.data;
			} else {
				alert(data.err);
				$scope.allData = [];
			}
		}).error(function(err) {
			console.log('Error: ' + err);$scope.allData = [];
		});
	}
	
	$scope.remind = function(model){
		//Email LOGIC goes here...
		$http.post('/api/reminder', model).success(function(data){
			if(angular.equals('success',data.status)){
				
			} else {
				alert(data.err);
				
			}
		}).error(function(err) {
			console.log('Error: ' + err);
		});
		alert('Reminder Email sent to '+model.name+'('+model.email+')');
	}


	
	$scope.fetchAllData = function(){
		$http.post('/api/allempdata').success(function(data){
			$scope.empData = data;
			/*if(angular.equals('success',data.status)){
				alert('Succesfully saved the Timesheet record');
			} else {
				alert(data.err);
			}*/
		}).error(function(err) {
			console.log('Error: ' + err);
		});
	}

}]);

TimesheetControllers.controller("SeeAllEmployeeController", ['$scope','$http','$location', '$rootScope','$state', function($scope, $http, $location, $rootScope,$state){

	$scope.fetchAllData = function(){
		$http.post('/api/allempdata').success(function(data){
			$scope.empData = data;
		}).error(function(err) {
			console.log('Error: ' + err);
		});
	};
	$scope.editEmployee = function(emp){
		$scope.editEnabled = true;
		$state.go("editEmp",{emp:emp});
		
	};
	$scope.removeEmployee = function(emp){
		var ret = confirm("Are you sure you want to remove this record?");
		if (ret == true) {
			$http.post('/api/remove/emp', emp).success(function(data){
				if(angular.equals('success',data.status)){
					emp.active = 0;
					//$scope.empData.splice($scope.empData.indexOf(emp),1);
					alert('Succesfully removed the record '+emp.name);
				} else {
					alert(data.err);
				}
			}).error(function(err) {
				console.log('Error: ' + err);
			});
		} else {
			return;
		}
		
	};
	$scope.updateEmployee = function(emp){
		$scope.emp = emp;
		$http.post('/api/update/emp', emp).success(function(data){
			if(angular.equals('success',data.status)){
				alert('Succesfully updated the record for '+emp.name);
			} else {
				alert(data.err);
			}
		}).error(function(err) {
			console.log('Error: ' + err);
		});
		$scope.editEnabled = false;		
	};
	$scope.cancel = function(){
		$scope.editEnabled = false;
	};
	$scope.fetchAllData();
}]);

TimesheetControllers.controller("EditController", ['$scope','$http','$location', '$rootScope','$state','$stateParams', function($scope, $http, $location, $rootScope,$state,$stateParams){

	$scope.emp = $stateParams.emp;
	
	$scope.updateEmp = function(emp){

		$http.post('/api/update/emp', emp).success(function(data){
			if(angular.equals('success',data.status)){
				alert('Succesfully updated the record for '+emp.name);
				if($rootScope.isAdmin){
					$rootScope.navigateTo('seeAllEmployee');
				}else{
					$rootScope.navigateTo('profile');
				}
				
			} else {
				alert(data.err);
			}
		}).error(function(err) {
			console.log('Error: ' + err);
		});
	};

	$scope.cancelEdit =function(){
		if($rootScope.isAdmin){
			$rootScope.navigateTo('seeAllEmployee');
		}else{
			$rootScope.navigateTo('profile');
		}
	}

}]);



TimesheetControllers.run(['$rootScope','$location','$state','$window','timesheetStore',function($rootScope, $location,$state,$window,timesheetStore) {
	$rootScope.navigateTo = function(value) {
		//add current path to cookie
		timesheetStore.addItem("routePath",value);

		if(value === 'empData'){ $state.go("empData" );}
		else if(value === 'createTimesheet'){ $state.go("createTimesheet" );}
		else if(value === 'dashboardEmployee'){ $state.go("dashboardEmployee" );}
		else if(value === 'dashboard'){ $state.go("dashboard" );}
		else if(value === 'newEmployee'){ $state.go("newEmployee" );}
		else if(value === 'seeAllEmployee'){ $state.go("seeAllEmployee" );}
		else if(value === 'timesheetReport'){ $state.go("timesheetReport" );}
		else if(value === 'profile'){ $state.go("profile" );}
		else if(value === 'newAdmin'){ $state.go("register-admin" );}
		else if(value === 'editEmp'){ $state.go("editEmp" );}
		else if(value === 'editProfile'){ $state.go("editProfile" );}
		else if(value == 'viewAllEmpTs'){ $state.go("viewAllEmpTs");}
		else if(value == 'updateTimesheetBackend'){ $state.go("backendTimesheetForm");}
		else { $state.go("genpact" );}

	};

	$rootScope.logout = function() {
		$rootScope.user = null;
		$rootScope.loggedIn = false;
		$rootScope.isAdmin =false;
		$state.go("genpact" );
	};

}]);

TimesheetControllers.directive('calendar', function () {
	return {
		require: 'ngModel',
		link: function (scope, el, attr, ngModel) {
			$(el).datepicker({
				dateFormat: 'yy-mm-dd',
				onSelect: function (dateText) {
					scope.$apply(function () {
						ngModel.$setViewValue(dateText);
					});
				}
			});
		}
	};
});

TimesheetControllers.directive('datePicker', function () {
	return {
		restrict: "A",
		require: "ngModel",
		link: function (scope, element, attrs, ngModelCtrl) {
			$(element).datepicker();
		}
	};
})
TimesheetControllers.factory('utilFactory',function() {
	return {
		/*
		 * Method's first paramter is array of objects and
		 * second param is key of object
		 */
		sort : function(array, key) {
			if (angular.isUndefined(array))
				return [];
			if (angular.isUndefined(key))
				return array;
			array.sort(function(objA, objB) {
				var valA = objA[key].toUpperCase();
				var valB = objB[key].toUpperCase();
				if (valA < valB)
					return -1;
				if (valA > valB)
					return 1;
				return 0;
			});
			return array;
		},
		getValueFromArray : function (array, key, match, valKey){
			if(angular.isUndefined(array)){
				return '';
			}
			if(angular.isUndefined(match) || match == null || angular.isUndefined(key) || key==null){
				return '';
			}
			for(var i=0; i < array.length; i++ ){
				if((array[i][key] == match)){
					return array[i][valKey];
				}
			}
			
		},
	    changeDateFormat : function (s) {
	    	var months = {
	    		jan:0, feb:1, mar:2, apr:3, may:4, jun:5, jul:6, aug:7, sep:8, oct:9, nov:10, dec:11
	    	};
			var p = s.split('-');
			return new Date(p[2], months[p[1].toLowerCase()], p[0]);
		},
		
		isNull : function(text){
			if ((angular.isUndefined(text) || text == null || text.length==0)){
				return true;
			} 
			return false;
		},
		getMonthName : function (id) {
	    	var monthNames = ["January", "February", "March", "April", "May", "June","July", "August", "September", "October", "November", "December"];
			return monthNames[id];
		},
		monthNamesShort : ["Jan", "Feb", "Mar", "Apr", "May", "Jun","Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
		numberPattern : /^[1-9]\d*$/
	};
});
