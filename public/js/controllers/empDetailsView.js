var empDetailsView = angular.module('empDetailsView',[]);

empDetailsView.controller("ProfileController",
	function($scope, $http, $location, $rootScope, $state, utilFactory)
	{    
		$scope.employeData
		$scope.loginModel = {
			ohrId: '',
			pass: '',
			userType: ''
		}
		
		
		$scope.pLangDetails = utilFactory.getValueFromArray($rootScope.config.techSkills.languages, 'id', $rootScope.user.pLang, 'details');
		$scope.sLangDetails = utilFactory.getValueFromArray($rootScope.config.techSkills.languages, 'id', $rootScope.user.sLang, 'details');

		$scope.editProfile =function(){
			$state.go("editEmp",{emp:$rootScope.user});
		}

		
		$scope.save = function(model){
			console.log(model.ohrId +' '+model.pass+' '+model.userType);
			if(model.ohrId == undefined || model.ohrId == '' || model.pass == '' || model.pass == undefined){
				return;
			}
			$http.post('/api/authenticate', model).success(function(data){
				console.log(model.ohrId+' Recieved from ************* '+data+': '+(angular.equals(model.ohrId,data)));
				if(angular.equals('success',data.status)){
					if(data.active != '1'){
						alert('Cannot login because you are not active. Please talk to the Admin.');
						return;
					}
					$rootScope.user = data;
					$rootScope.loggedIn = true;
					if(data.type == '1'){
						//$state.go("dashboard" );
						//$rootScope.navigateTo("dashboard");
						$state.go("dashboard");
					} else {
						//$rootScope.navigateTo("dashboardEmployee");
						//$state.go("dashboardEmployee" );
						$state.go("dashboardEmployee");
					}
				} else {
					$rootScope.user = null;
					console.lo
					g('Error: ' + data.err);
					$scope.loginModel.ohrId = '';
					$scope.loginModel.pass = '';
					$scope.loginModel.userType = '';
					alert(data.err);
				}
			}).error(function(err) {
				console.log('Error: ' + err);
			});
		}
		$scope.register = function(){
			//$rootScope.navigateTo("register");
			$state.go("register");
		}
	}
);
