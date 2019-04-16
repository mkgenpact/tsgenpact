
var TimesheetApp = angular.module('TimesheetApp', [ 'ngRoute',
													'ui.router',
													'TimesheetControllers',
													'empTimesheetView',
													'empDetailsView',
													'empLoginMang',
													'empRegistratioanMang',
													'adminManag',
													'backendTimesheetModule',
													'chart.js',
													'720kb.datepicker',
													'ngCookies'
												  ]);

TimesheetApp.config(['$stateProvider','$urlRouterProvider','$locationProvider', function($stateProvider,$urlRouterProvider,$locationProvider) {
	$locationProvider.html5Mode({
		enabled : true,
		requireBase : false
	});
	
	$stateProvider.state('genpact', {
		url : "/genpact",
		templateUrl: 'views/home.html',
		controller: 'LoginController'
	}).state('dashboard', {
		templateUrl: 'views/dashboard.html',
		controller: 'DBController'
	}).state('viewAllEmpTs', {
		templateUrl: 'views/allEmpTimesheetView.html',
		controller: 'DBController'
	}).state('profile', {
		templateUrl: 'views/profile.html',
		controller: 'ProfileController'
	}).state('register', {
		templateUrl: 'views/register.html',
		controller: 'registerController'
	}).state('register-admin', {
		templateUrl: 'views/register-admin.html',
		controller: 'registerController'
	}).state('newEmployee', {
		templateUrl: 'views/newEmployee.html',
		controller: 'NewEmployeeController'
	}).state('seeAllEmployee', {
		templateUrl: 'views/seeAllEmployee.html',
		controller: 'SeeAllEmployeeController'
	}).state('timesheetReport', {
		templateUrl: 'views/timesheetReport.html',
		controller: 'timesheetReportController'
	}).state('dashboardEmployee', {
		templateUrl: 'views/dashboardEmployee.html',
		controller: 'DBEmpController'
	}).state('createTimesheet', {
		templateUrl: 'views/creatTs.html',
		controller: 'TimesheetController'
	}).state('empData', {
		templateUrl: 'views/empData.html',
		controller: 'EmpDataController'
	}).state('editEmp', {
		params: {emp: null},
		templateUrl: 'views/edit-employee.html',
		controller: 'EditController'
	}).state('editProfile', {
		params: {emp: null},
		templateUrl: 'views/editProfile.html',
		controller: 'EditController'
	}).state('backendTimesheetForm',{
		templateUrl: 'views/backendTimesheetForm.html',
		controller: 'backendTimesheetController'
	});
	$urlRouterProvider.otherwise('/genpact');
  
}]);
