var NotImpementedError = require('../lib/NotImplementedError');
var request = require('supertest-as-promised');
var expect = require('expect.js');
var AppFactory = require('../lib/AppFactory');

describe('API endpoint',function(){
	var appFactory = new AppFactory();

	var app = appFactory.NewApp();

	it('should enable CORS for web application',function(done){
		request(app).get('/scene')
			.then(function(res){
				expect(res.header).to.have.keys([
					'access-control-allow-origin',
					'access-control-allow-methods',
					'access-control-allow-headers',
					'access-control-allow-credentials']);

				expect(res.header['access-control-allow-origin']).to.be('http://localhost:8080');
				expect(res.header['access-control-allow-methods']).to.be('GET, POST, OPTIONS, PUT, PATCH, DELETE');
				expect(res.header['access-control-allow-headers']).to.be('X-Requested-With,content-type');
				expect(res.header['access-control-allow-credentials']).to.be('true');

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
				expect(response.body).to.be.an(Array);
				expect(response.body.length).to.be(2);
				expect(response.body[0]._id).to.be(0);
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
					.catch(done);
			});

			// it('should create a new scene',function(){
			// 	throw new NotImpementedError();
			// });
			it('should respond with code 201 upon success',function(){
				expect(response.statusCode).to.be(201);
			});
			it('should return a `Location` header with a link to the newly-created resource',function(){
				expect(response.headers).to.have.key('location');
				expect(response.headers.location).to.be.contain('http://127.0.0.1/scene/');
			});
		});
	});
	describe('/scene/{id}/processes',function(){
		describe('POST',function(){
			var response;

			before(function(done){
				request(app)
					.post('/scene/1/processes')
					.send({
						'status':'InProgress'
					})
					.then(function(res){
						response = res;
						done();
					})
					.catch(done);
			});

			it('should create a new process for the desired scene',function(done){
				request(app).get('/scene')
					.then(function(getRes){
						expect(getRes.body[1].processes).to.be.an(Array);
						expect(getRes.body[1].processes.length).to.be(1);
						expect(getRes.body[1].processes[0].status).to.eql('InProgress');
						done();
					})
					.catch(done);
			});

			it('should return a `Location` header with a link to the newly-created resource',function(){
				expect(response.headers).to.have.key('location');
				expect(response.headers.location).to.be('http://127.0.0.1/scene/1/processes/0');
			});

			it('should respond with code 201 upon success',function(){
				expect(response.statusCode).to.be(201);
			});
		});

	});
	describe('/scene/{id}/processes/{id}',function(){
		describe('PUT',function(){
			it('should update process status',function(done){
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
								'status':'InProgress'
							});
					})
					.then(function(res){
						var loc = res.headers.location.replace('http://127.0.0.1','');
						return request(app)
							.put(loc)
							.send({
								'status':'Complete',
								'result':'http://my.awesome/result'
							});
					})
					.then(function(res){
						return request(app)
							.get('/scene');
					})
					.then(function(res){
						expect(res.body[res.body.length-1].processes[0].status).to.be('Complete');
						expect(res.body[res.body.length-1].processes[0].result).to.be('http://my.awesome/result');
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
								'status':'InProgress'
							});
					})
					.then(function(res){
						var loc = res.headers.location.replace('http://127.0.0.1','');
						return request(app)
							.put(loc)
							.send({
								'status':'Complete'
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