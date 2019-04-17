var empTimesheetViewModule = angular.module('empTimesheetView',[]);

empTimesheetViewModule.controller("EmpDataController", function($scope, $http, $location, $rootScope,$state)
{    
		$scope.user = $rootScope.user;
		var userModel = {
			ohrId: $scope.user.ohrId
		}
		$scope.getEmpData = function(model){
			$http.post('/api/empTSdata', model).success(function(data){
				console.log(data)
				if(angular.equals('success',data.status)){
					$scope.empData = data;
				} else {
					console.log('Error: ' + data.err);
					alert(data.err);
				}
			}).error(function(err) {
				console.log('Error: ' + err);
			});
		};
		$scope.getEmpData(userModel);
	}
);
