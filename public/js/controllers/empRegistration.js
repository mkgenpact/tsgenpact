var empRegistratioan = angular.module('empRegistratioanMang',[]);

empRegistratioan.controller("registerController",function($scope, $http, $location, $rootScope, $state)
	{   
		$scope.activePane = ["1"];
		$scope.registerModel = {
			ohrId: '',
			name: '',
			pass: '',
			confirmPass: '',
			team: '',
			email: '',
			location: '',
			contactMobile: '',
			startDt: '',
			endDt: '',
			role: '',
			priLang: '',
			otherLang: '',
			tools: '',
			otherTools: '',
			domain: '',
			os: '',
			otherRoles: '',
			otherDomains: '',
			otherTools: ''
		}


		$scope.registerUser = function(model){

			//validate form data
			var valid =$scope.validateForm(model);
			if(!valid){
				alert('Please fill the mandatory field');
				return;
			}

			console.log(model.ohrId +' '+model.pass);
			model.email = model.email+"@"+$rootScope.config.emailgroup;
			$http.post('/api/register/emp', model).success(function(data){
				if(angular.equals('success',data.status)){
					alert('You are successfully registered! Please try to login')
					$state.go("genpact");
				} else {
					alert(data.err);
				}
			}).error(function(err) {
				console.log('Error: ' + err);
			});
		}


		$scope.registerAdminUser = function(model){
			alert("i will get registered");
			$http.post('/api/register/admin', model).success(function(data){
				if(angular.equals('success',data.status)){
					alert('You are successfully registered! Please try to login')
					$state.go("genpact");
				} else {
					alert(data.err);
				}
			}).error(function(err) {
				console.log('Error: ' + err);
			});
		}
		$scope.validatePwd = function(pwd){
			var re = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
			if(re.test(pwd)){
				$scope.warning = '';
				return;
			} else {
				$scope.warning = 'Password must be at least six characters long with at least one number, one lowercase and one uppercase letter';
				return;
			}
		}
		$scope.confirmPwd = function(model){
			if(model.pass != model.confirmPass){
				$scope.warningcnfm = 'Passwords do not match';
				alert($scope.warningcnfm);
				return;
			} else {
				$scope.warningcnfm = '';
				return;
			}
		}
		$scope.disablePrev = true;
		$scope.next = function(){
			var currentPane = $scope.activePane[0];
			if(currentPane == 3)return;
			$scope.activePane = [];
			$scope.activePane[0] = ++currentPane;
			$scope.disablePrev = false;
			if(currentPane == 3)$scope.disableNext = true;
		}
		$scope.previous = function(){
			var currentPane = $scope.activePane[0];
			if(currentPane == 1)return;
			$scope.activePane = [];
			$scope.activePane[0] = --currentPane;
			$scope.disableNext = false;
			if(currentPane == 1)$scope.disablePrev = true;
		}
		$scope.validateForm = function(model){
			alert(model.ohrId);
			if(model.ohrId == '' || model.name == '' || model.pass == '' || model.confirmPass == '' || model.team == '' || model.email == '' 
			|| model.location  == '' || model.role == '' || model.priLang.id == '' || model.domain == '' 
			|| model.os  == '' || model.contactMobile == '' || model.pass != model.confirmPass || model.startDt ==''){
				return false;
			} else return true;
		}
	}
);
