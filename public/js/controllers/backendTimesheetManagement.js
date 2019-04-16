var backendTimesheetModule = angular.module('backendTimesheetModule',[]);

backendTimesheetModule.controller('backendTimesheetController',function($scope, $http, $location, $rootScope,$state){
	$scope.user = $rootScope.user;

		$scope.backendTsData ={'ohrId' : $scope.user.ohrId,
								userName : $scope.user.name,
								'tsData' : [],
								'action' : '',
								'email' : $scope.user.email
							   };

		$scope.addToBackendTS = function(backendts){

			//validate the date, if he has added
			var ts ={
				ohrId : $scope.user.ohrId,
				projectCode : backendts.projectCode,
                expenditureType :backendts.expenditureType,
                taskDetail : backendts.taskDetail,
                date : backendts.date,
                hour : backendts.hour
			};
			var duplicate = false;
			for(var i=0;i<$scope.backendTsData.tsData.length;i++){
				var tse = $scope.backendTsData.tsData[i];
				if(ts.date == tse.date){
					duplicate = true;
					break;
				}
			}
			if(!duplicate){
				$scope.backendTsData.tsData.push(ts);
			}else{
				alert('Timesheet for this date has been already added in below Table, Please change the details.');
			}
			
		}

		$scope.sendToPMO = function(backendTsData){
			backendTsData.action ="sendtopmo";

			if(backendTsData.tsData.length == 0){
				return;
			}
			$http({
		        url: '/api/sendPMOToBackendUpdate',
		        method: "POST",
		        headers: {'Content-type': 'application/json'},
		        data: backendTsData
			}).success(function(response, status, headers){
               if(response.status ='success'){
                alert('Timesheet has been sent to pmo , please check your email')
               }else{
                 alert('something gone wrong while sending the TSC to PMO');
               }
			}).error(function(err) {
				console.log('Error: ' + err);
			});
		}

	 $scope.exportExcel = function(backendTsData){
	 	backendTsData.action ="exportExcel";
	 	if(backendTsData.tsData.length == 0){
				return;
			}
	 	$http({
		        url: '/api/sendPMOToBackendUpdate',
		        method: "POST",
		        headers: {'Content-type': 'application/json'},
		        data: backendTsData,
		        responseType: 'arraybuffer'
			}).success(function(data, status, headers){
               var file = new Blob([ data ], { type : 'application/vnd.ms-excel'});
               var defaultFileName ="TSC-"+$scope.user.name+"-"+$scope.user.ohrId+".xlsx";
               saveAs(file,defaultFileName);
			}).error(function(err) {
				console.log('Error: ' + err);
			});
	 }
});
