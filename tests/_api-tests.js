var NotImpementedError = require('../lib/NotImplementedError');
var request = require('supertest-as-promised');
var expect = require('expect.js');
var AppFactory = require('../AppFactory');

describe('API endpoint',function(){
	var appFactory = new AppFactory();

	var app = appFactory.NewApp();

	describe('/scene',function(){
		describe('POST',function(){
			var response;

			before(function(done){
				request(app)
					.post('/scene')
					.send({
						resource:{
							type:'url',
							location:'http://www.google.com'
						}
					})
					.then(function(res){
						return request(app)
							.post('/scene')
							.send({
								resource:{
									type:'url',
									location:'http://www.github.com'
								}
							});
					})
					.then(function(res){
						return request(app).get('/scene');
					})
					.then(function(res){
						response = res;
						done();
					})
					.catch(function(err){
						done(err);
					});
			});

			it('should return all scenes in JSON',function(){
				expect(response.body).to.be.ok();
				expect(response.body).to.eql([
					{
						_id:0,
						resource:{
							type:'url',
							location:'http://www.google.com'
						}
					}, {
						_id:1,
						resource:{
							type:'url',
							location:'http://www.github.com'
						}
					}]);
			});

			it('should respond with code 200 upon success',function(){
				expect(response.statusCode).to.be(200);
			});
		});
		describe('POST',function(){
			var response;

			before(function(done){
				request(app)
					.post('/scene')
					.send({
						resource:{
							type:'url',
							location:'http://www.youtube.com'
						}
					})
					.then(function(res){
						response = res;
						done();
					})
					.catch(function(err){
						done(err);
					});
			});

			// it('should create a new scene',function(){
			// 	throw new NotImpementedError();
			// });
			it('should respond with code 201 upon success',function(){
				expect(response.statusCode).to.be(201);
			});
			it('should return a `Location` header with a link to the newly-created resource',function(){
				expect(response.headers.location).to.be.ok();
				expect(response.headers.location).to.be.contain('http://127.0.0.1:8080/scene/');
				console.log(response.headers.location);
			});
		});
	});
});