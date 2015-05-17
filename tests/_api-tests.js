var NotImpementedError = require('../lib/NotImplementedError');
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
		request(app).get('/scene')
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

	describe('/scene',function(){
		describe('GET',function(){
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
				expect(response.body).to.be.an(Array);
				expect(response.body.length).to.be(1);
				expect(response.body[0].sceneID).to.be.a('string');
				expect(response.body[0].dateCreated).to.be.a('number');
				expect(response.body[0].resource).to.be.ok();
				expect(response.body[0].resource.type).to.be('url');
				expect(response.body[0].resource.location).to.be('http://www.google.com');
				expect(response.body[0].processes).to.be.an(Array);
				expect(response.body[0].processes.length).to.be(0);
			});

			it('should respond with code 200 upon success',function(){
				expect(response.statusCode).to.be(200);
			});
		});
	});
	
	describe('/v0-2/scene-requests/ POST',function(){
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

	describe('/scene/{hash}/{timestamp}',function(){
		describe('GET',function(){
			var getRes;
			before(function(done){
				request(app)
					.post('/scene')
					.send({
						resource:{
							type:'url',
							location:'http://www.lahlah.com'
						}
					})
					.then(function(res){
						return request(app)
							.get(res.headers.location.replace('http://127.0.0.1',''));
					})
					.then(function(res){
						getRes = res;
						done();
					})
					.catch(done);
			});

			it('should return scene in body',function(){
				expect(getRes.body).to.be.ok();
				expect(getRes.body.dateCreated).to.be.a('number');
				expect(getRes.body.resource).to.be.ok();
				expect(getRes.body.resource.location).to.be('http://www.lahlah.com');
			});

			it('should return 200 statusCode',function(){
				expect(getRes.statusCode).to.be(200);
			});
		});
	});

	describe('/scene/{hash}/{timestamp}/processes',function(){
		describe('POST',function(){
			var response;
			var sceneLocation;

			before(function(done){
				request(app)
					.post('/scene')
					.send({
						resource:{
							type:'url',
							location:'http://www.helloworld.com'
						}
					})
					.then(function(res){
						sceneLocation = res.headers.location.replace('http://127.0.0.1','');
						var location = sceneLocation+'/processes';
						return request(app)
							.post(location)
							.send({
								'status':'IN_PROGRESS'
							});
					})
					.then(function(res){
						response = res;
						expect(res.statusCode).to.be(201);
						done();
					})
					.catch(done);
			});

			it('should create a new process for the desired scene',function(done){
				request(app).get(sceneLocation)
					.then(function(getRes){
						expect(getRes.statusCode).to.be(200);
						expect(getRes.body.processes).to.be.an(Array);
						expect(getRes.body.processes.length).to.be(1);
						expect(getRes.body.processes[0].status).to.eql('IN_PROGRESS');
						done();
					})
					.catch(done);
			});

			it('should return a `Location` header with a link to the newly-created resource',function(){
				expect(response.headers).to.have.key('location');
				expect(response.headers.location).to.match(/^(:?http:\/\/127.0.0.1\/scene\/)[\w\d]{8}-[\w\d]{4}-[\w\d]{4}-[\w\d]{4}-[\w\d]{12}\/\d{13}\/processes\/0$/);
			});

			it('should respond with code 201 upon success',function(){
				expect(response.statusCode).to.be(201);
			});
		});

	});
	describe('/scene/{hash}/{timestamp}/processes/{id}',function(){
		describe('PUT',function(){
			it('should update process status',function(done){
				var sceneLocation;
				request(app)
					.post('/scene')
					.send({
						resource:{
							type:'url',
							location:'http://www.trioxis.com'
						}
					})
					.then(function(res){
						sceneLocation = res.headers.location.replace('http://127.0.0.1','');
						var loc = sceneLocation+'/processes';
						return request(app)
							.post(loc)
							.send({
								'status':'IN_PROGRESS'
							});
					})
					.then(function(res){
						var loc = res.headers.location.replace('http://127.0.0.1','');
						return request(app)
							.put(loc)
							.send({
								'status':'COMPLETE',
								'result':'http://my.awesome/result'
							});
					})
					.then(function(res){
						return request(app)
							.get(sceneLocation);
					})
					.then(function(res){
						expect(res.body.processes[0].status).to.be('COMPLETE');
						expect(res.body.processes[0].result).to.be('http://my.awesome/result');
						done();
					})
					.catch(done);
			});
			it('should require result if complete',function(done){
				request(app)
					.post('/scene')
					.send({
						resource:{
							type:'url',
							location:'http://www.trioxis.com'
						}
					})
					.then(function(res){
						var loc = res.headers.location.replace('http://127.0.0.1','')+'/processes';
						return request(app)
							.post(loc)
							.send({
								'status':'IN_PROGRESS'
							});
					})
					.then(function(res){
						var loc = res.headers.location.replace('http://127.0.0.1','');
						return request(app)
							.put(loc)
							.send({
								'status':'COMPLETE'
							});
					})
					.then(function(res){
						expect(res.statusCode).to.be(400);
						expect(res.body).to.have.key('message');

						done();
					})
					.catch(done);
			});
		});
	});
});