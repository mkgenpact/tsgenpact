
var adminManag = angular.module('adminManag',['ngFileUpload']);

adminManag.controller("DBController",
	function($scope, $http, $location, $rootScope,$state, utilFactory,Upload,$window)
	{ 
		var currentYear = new Date().getFullYear();   
		$scope.dbModel = {
			ohrId: $rootScope.user.ohrId,
			compareVal: '',
			rMonth: '',
			eMonth: '',
			rYear : currentYear,
			locations : []
		}
		$scope.config = $rootScope.config;

		$scope.viewAllEmpTimesheet = function(){
			console.log("strating to fetch all the emp timesheet data");
			 $http({
         		method : "GET",
       			url : "api/viewAllTimesheet/"
		     }).then(function mySuccess(response) {
					//$scope.empData = response.data;;
					$scope.empData;
					$scope.totalTS = Math.ceil(response.data.data.length/10);
					var paginationArray =[];
					let map = new Map();
					var mapCount =0;
					var remainItem=false;
					response.data.data.forEach(function(item, index, array) {
						if(index !=0 && index%10 ==0){
							map.set(++mapCount,paginationArray);
							paginationArray =[];
						}
						paginationArray.push(item);
					});
				//last some remaining items check
				if(mapCount != $scope.totalTS){
					map.set(++mapCount,paginationArray);
				}
				alert((mapCount) +" = " +$scope.totalTS);
				$scope.allData = map;
				$scope.empData =map.get(1);	
				$scope.paginationIndex =1;

		    }, function myError(response)  {
		       alert('failed to load all the data');
		    });

		};

		$scope.loadPage = function(page){
			if(page == 'next'){
				if($scope.paginationIndex > $scope.totalTS)
					return;
				$scope.empData =$scope.allData.get(++$scope.paginationIndex);
				//$scope.paginationIndex = $scope.paginationIndex+1;
			}else if(page == 'prev'){
				if($scope.paginationIndex ==1)
					return;
				//$scope.paginationIndex = $scope.paginationIndex-1;
				$scope.empData =$scope.allData.get(--$scope.paginationIndex);
			}else if(page == 'last'){
				$scope.empData =$scope.allData.get($scope.totalTS);
				$scope.paginationIndex =$scope.totalTS;
			}else{
				$scope.empData =$scope.allData.get(page);
				$scope.paginationIndex =1;
			}

		}

		//$scope.viewAllEmpTimesheet();


		$scope.getData = function(model){
			console.log(model.compareVal);
			$http.post('/api/graphdata/', model).success(function(data){
				if(angular.equals('success',data.status)){
					
					$scope.tech_labels = data.val;
					$scope.tech_data = data.count;
					
					
				} else {
					console.log('Error: ' + data.err);
					alert(data.err);
				}
			}).error(function(err) {
				console.log('Error: ' + err);
			});
		};
		
		$scope.getAttritionData = function(model){
			console.log(model.compareVal);
			$http.post('/api/attrdata/', model).success(function(data){
				if(angular.equals('success',data.status)){
					
					$scope.tech_labels = data.val;
					$scope.tech_data = data.count;
					
					
				} else {
					console.log('Error: ' + data.err);
					alert(data.err);
				}
			}).error(function(err) {
				console.log('Error: ' + err);
			});
		};

		$scope.type = 'line';
		$scope.toggle = function () {
		  $scope.type = $scope.type === 'line' ?
			'bar' : 'line';
		};

		$scope.cType = 'line';
		$scope.changeGraphType = function () {
			if($scope.cType === 'line')$scope.cType = 'bar';
			else if($scope.cType === 'bar')$scope.cType = 'line';
		};
		
		$scope.labels = utilFactory.monthNamesShort;
		$scope.series = ['Active', 'Inactive'];
		$scope.data = [
			[21, 21, 30, 30, 33, 33, 35, 35, 35, 35, 35, 35],
			[0, 0, 2, 2, 3, 4, 6, 6, 6, 6, 6, 6]
		];

		$scope.onClick = function (points, evt) {
			console.log(points, evt);
		};

		$scope.datasetOverride = [{ yAxisID: 'y-axis-1' }];
		$scope.options = {
			scales: {
				yAxes: [
					{
					  id: 'y-axis-1',
					  type: 'linear',
					  display: true,
					  position: 'left'
					}
				]
			}
		};
		
		$scope.tech_options = {
			responsive: false,
			legend: {display: true}
		}
		$scope.dbModel.compareVal = 'P_LANG';
		$scope.getData($scope.dbModel);
		
		$scope.sendMonthlyEmail = function(model){
			$http.post('/api/email/', model).success(function(data){
				if(angular.equals('success',data.status)){
					
				} else {
					console.log('Error: ' + data.err);
					alert(data.err);
				}
			}).error(function(err) {
				console.log('Error: ' + err);
			});
			
		}
		
		$scope.sendMonthlyReport = function(model){
			if(model.rMonth && model.rYear && model.locations){
				$http.post('/api/send-report/', model).success(function(data){
					alert(data.status);
					if(angular.equals('success',data.status)){
						alert('Report has been sent successfully');
					} else {
						console.log('Error: ' + data.err);
						alert(data.err);
					}
				}).error(function(err) {
					console.log('Error: ' + err);
				});
			} else {
				alert('please select all the mandatory filter fields');
					return;
			}
		}

		$scope.uploadTimesheet = function(){
             if ($scope.upload_form.file.$valid) { //check if from is valid
                 $scope.upload($scope.file); //call upload function
             }

         }
     
		$scope.upload =function(file){
				Upload.upload({
                 url: 'api/uploadTimesheet',
                 data:{file:file} //pass file as data, should be user ng-model
             }).then(function (resp) { //upload function returns a promise
                 if(resp.data.error_code === 0){ //validate success
                     $window.alert('Success ' + resp.config.data.file.name + 'uploaded. Response: ');
                 } else {
                     $window.alert('Error has occured :'+resp.data.err_desc);
                 }
             }, function (resp) { //catch error
                 console.log('Error status: ' + resp.status);
                 $window.alert('Error status : ' + resp.status);
             }, function (evt) { 
                 console.log(evt);
             });
		}

	}
);
