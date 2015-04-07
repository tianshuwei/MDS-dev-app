function htpLogin(user, pwd) {
	$http.post('/login', { username: user, password: pwd }).
	success(function (data, status, headers, config) {
		alert("login success");

	}).
	error(function (data, status, headers, config) {
		alert("login failed");
	});
}