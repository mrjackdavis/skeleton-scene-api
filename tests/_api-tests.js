var NotImplementedError = require('../lib/NotImplementedError');
var request = require('supertest-as-promised');
var expect = require('expect.js');
var AppFactory = require('../lib/AppFactory');
var appConfigGetter = require('../lib/AppConfig');
var MockDynamo = require('./MockDynamo');

var DYNAMO_PORT = 4567;

describe('API endpoint',function(){
	var appFactory = new AppFactory();
	var mockDynamo = new MockDynamo('./tmp/mockDynamo-API-tests');

	var app;

	before(function(done){
		this.timeout(5000);
		mockDynamo.Start(DYNAMO_PORT)
			.then(function(){
				return appConfigGetter();
			})
			.then(function(config){
				return appFactory.NewApp({
					// AWS_CREDENTIALS: config.TEST_AWS_CREDENTIALS,
					AWS_CREDENTIALS:{
						accessKeyId:'hocus',
						secretAccessKey:'pocus'
					},
					endpoint:'http://127.0.0.1:'+DYNAMO_PORT
				});
			}).then(function(newApp){
				app = newApp;
			}).then(function(){
				done();
			}).catch(done);
	});

	after(function(done){
		this.timeout(8000);
		mockDynamo.Stop().then(done);
	});

	it('should enable CORS for web application',function(done){
		request(app).get('/v0-2/scenes')
			.then(function(res){
				expect(res.header).to.have.keys([
					'access-control-allow-origin',
					'access-control-allow-methods',
					'access-control-allow-headers']);

				expect(res.header['access-control-allow-origin']).to.be('*');
				expect(res.header['access-control-allow-methods']).to.be('GET, POST, OPTIONS, PUT, PATCH, DELETE');
				expect(res.header['access-control-allow-headers']).to.be('X-Requested-With,content-type');
				expect(res.header['access-control-allow-credentials']).to.be(undefined);

				done();
			}).catch(function(err){
				done(err);
			});
	});
	
	describe('/v0-2/scene-requests/',function(){
		describe('POST',function(){
			var response;

			before(function(done){
				request(app)
					.post('/v0-2/scene-requests')
					.send({
						resourceType:'URL',
						resourceURI:'http://www.youtube.com',
						generatorName:'Bob Marley'
					})
					.then(function(res){
						response = res;
						done();
					})
					.catch(done);
			});

			it('should respond with code 201 upon success',function(){
				expect(response.statusCode).to.be(201);
			});
			it('should return a `Location` header with a link to the newly-created resource',function(){
				expect(response.headers).to.have.key('location');
				expect(response.headers.location).to.match(/^(:?http:\/\/127.0.0.1\/v0-2\/scene-requests\/)[\w\d]{8}-[\w\d]{4}-[\w\d]{4}-[\w\d]{4}-[\w\d]{12}\/\d{13}$/);
			});
		});

		describe('GET',function(){
			var response;

			before(function(done){
				request(app)
					.post('/v0-2/scene-requests')
					.send({
						resourceType:'URL',
						resourceURI:'http://www.youtube.com',
						generatorName:'Bob Marley'
					})
					.then(function(){
						return request(app).get('/v0-2/scene-requests');
					})
					.then(function(res){
						response = res;
						done();
					})
					.catch(done);
			});

			it('should respond with code 200 upon success',function(){
				expect(response.statusCode).to.be(200);
			});
			it('should contain an array of scene requests',function(){
				expect(response.body).to.be.an(Array);
				expect(response.body.length).to.be.greaterThan(0);
			});
		});
	});

	describe('/v0-2/scene-requests/:sceneID/:createdAt',function(){
		describe('GET',function(){
			var response;

			before(function(done){
				request(app)
					.post('/v0-2/scene-requests')
					.send({
						resourceType:'URL',
						resourceURI:'http://www.one.com',
						generatorName:'Bob Marley'
					})
					.then(function(res){
						var url = res.headers.location.replace('http://127.0.0.1','');
						return request(app).get(url);
					})
					.then(function(res){
						response = res;
						done();
					})
					.catch(done);
			});

			it('should respond with code 200 upon success',function(){
				expect(response.statusCode).to.be(200);
			});
			it('should return payload of single scene',function(){
				expect(response.body).to.be.ok();
				expect(response.body).to.only.have.keys(
					['sceneID',
					'createdAt',
					'generatorName',
					'resourceURI',
					'resourceType',
					'status']);
			});
		});

		describe('PUT',function(){
			var sceneRequestURL;

			before(function(done){
				request(app)
					.post('/v0-2/scene-requests')
					.send({
						resourceType:'URL',
						resourceURI:'http://www.one.com',
						generatorName:'Bob Marley'
					})
					.then(function(res){
						sceneRequestURL = res.headers.location.replace('http://127.0.0.1','');
						done();
					})
					.catch(done);
			});

			it('should update the status of the request',function(done){
				request(app)
					.put(sceneRequestURL)
					.send({
						status:'IN_PROGRESS'
					})
					.then(function(res){
						expect(res.statusCode).to.be(200);
						return request(app).get(sceneRequestURL);
					})
					.then(function(res){
						//assert
						expect(res.body.status).to.be('IN_PROGRESS');
						done();
					}).catch(done);
			});
		});
	});

	describe('/v0-2/scenes/',function(){
		describe('POST',function(){

			var response;

			before(function(done){
				request(app)
					.post('/v0-2/scene-requests')
					.send({
						resourceType:'URL',
						resourceURI:'http://www.hipstertown.com',
						generatorName:'Bob Marley'
					})
					.then(function(res){
						var splitURL = res.headers.location.split('/');

						return request(app)
							.post('/v0-2/scenes')
							.send({
								request:{
									sceneID:splitURL[(splitURL.length - 2)],
									createdAt:splitURL[(splitURL.length - 1)]
								},
								result:{
									URI:'http://awesomeresult.com/lala',
									type:'IMAGE'
								}
							});
					})
					.then(function(res){
						response = res;
						done();
					}).catch(done);
			});

			it('should return 201 and header location of resource',function(){
				expect(response.status).to.be(201);
				expect(response.headers.location).to.match(/^(:?http:\/\/127.0.0.1\/v0-2\/scenes\/)[\w\d]{8}-[\w\d]{4}-[\w\d]{4}-[\w\d]{4}-[\w\d]{12}\/\d{13}$/);
			});
		});

		describe('GET',function(){

			var response;

			before(function(done){
				request(app)
					.post('/v0-2/scene-requests')
					.send({
						resourceType:'URL',
						resourceURI:'http://www.hipstertown.com',
						generatorName:'Bob Marley'
					})
					.then(function(res){
						var splitURL = res.headers.location.split('/');

						return request(app)
							.post('/v0-2/scenes')
							.send({
								request:{
									sceneID:splitURL[(splitURL.length - 2)],
									createdAt:splitURL[(splitURL.length - 1)]
								},
								result:{
									URI:'http://awesomeresult.com/lala',
									type:'IMAGE'
								}
							});
					})
					.then(function(res){
						return request(app).get('/v0-2/scenes/');
					}).then(function(res){
						response = res;
						done();
					}).catch(done);
			});

			it('should return payload of scenes',function(){
				expect(response.body).to.be.ok();
				expect(response.body).to.be.an(Array);
				expect(response.status).to.be(200);

				expect(response.body[0]).to.only.have.keys(
					['sceneID',
					'completedAt',
					'requestedAt',
					'generatorName',
					'resourceURI',
					'resourceType',
					'resultURI',
					'resultType']);
			});
		});
	});

	describe('/v0-2/scenes/:hash/:timestamp GET',function(){
		var response;

		before(function(done){
			request(app)
				.post('/v0-2/scene-requests')
				.send({
					resourceType:'URL',
					resourceURI:'http://www.hipstertown.com',
					generatorName:'Bob Marley'
				})
				.then(function(res){
					var splitURL = res.headers.location.split('/');

					return request(app)
						.post('/v0-2/scenes')
						.send({
							request:{
								sceneID:splitURL[(splitURL.length - 2)],
								createdAt:splitURL[(splitURL.length - 1)]
							},
							result:{
								URI:'http://awesomeresult.com/lala',
								type:'IMAGE'
							}
						});
				})
				.then(function(res){
					response = res;
					done();
				}).catch(done);
		});

		it('should return a single scene',function(done){
			request(app)
				.get(response.headers.location.replace('http://127.0.0.1',''))
				.then(function(res){
					expect(res.body).to.be.ok();
					expect(res.body).to.only.have.keys(
						['sceneID',
						'completedAt',
						'requestedAt',
						'generatorName',
						'resourceURI',
						'resourceType',
						'resultURI',
						'resultType']);
					done();
				}).catch(done);
		});
	});
});