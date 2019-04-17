var empLoginMang = angular.module('empLoginMang',[]);

empLoginMang.controller("LoginController", 
	function($scope, $http, $location, $rootScope, $state, utilFactory,$cookieStore,timesheetStore)
	{   

		$scope.loginModel = {
			ohrId: '',
			pass: '',
			userType: 0,
			registeredEmail: ''
		}

		$scope.showRessetDiv=false; //variable to show on click on forgot password

		$scope.loginFormDiv =true; //default  true to show login form 
		
		$scope.login = function(model){
			console.log(model.ohrId +' '+model.pass+' '+model.userType);
			if(utilFactory.isNull(model.ohrId) || utilFactory.isNull(model.pass)){
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
					//add to cookies to maintain authentication
					//storeRoom.storeData('userObj',data);
					timesheetStore.addItem('userObj',data);
					
					if(data.type == '1'){
						$rootScope.isAdmin = true;
						$state.go("dashboard");
					} else {
						$state.go("empData");
					}
				} else {
					$rootScope.user = null;
					console.log('Error: ' + data.err);
					$scope.loginModel.ohrId = '';
					$scope.loginModel.pass = '';
					$scope.loginModel.userType = '';
					alert(data.err);
				}
			}).error(function(err) {
				console.log('Error: ' + err);
			});
		}

		$scope.forgotPassword= function(){
			$scope.loginFormDiv =false;
			$scope.showRessetDiv =true;
		}

		$scope.register = function(){
			$state.go("register");
		}

		$scope.submitEmail =function(){

			var email =$scope.loginModel.registeredEmail;
			var regx = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

			if(regx.test(email)){
				alert($scope.loginModel.registeredEmail);
				var model ={};
				model.ohrId=$scope.loginModel.ohrId;
				model.email=$scope.loginModel.registeredEmail;
				$http.post('/api/resetPasswordEmail',model).success(function(resp){

					if(resp.status == 'success'){
							alert('password has been sent to your registered email id');
							$scope.loginFormDiv =true;
							$scope.showRessetDiv =false;
					}else{
						alert('Input OHRID/Email id not found');
					}

				}).error(function(err){
					console.log('Error has occured while sending the email to reset the passowrd ' +err);
				})

			}else{
				alert('Incorrect Email ID');
			}
		}

		$scope.cancelPassRst =function(){
			$scope.loginFormDiv =true;
			$scope.showRessetDiv =false;
		}
	}
);
