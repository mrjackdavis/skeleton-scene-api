var NotImpementedError = require('../lib/NotImplementedError');
var expect = require('expect.js');
var SceneStore = require('../lib/stores/SceneStore');
var appConfigGetter = require('../lib/AppConfig');

describe('SceneStore',function(){
	var appConfig;
	before(function(done){
		appConfigGetter().then(function(config){
			appConfig = config;
			done();
		}).catch(done);
	});

	describe('Add and get',function(){
		it('should create and retrieve a new item respectively',function(done){
			this.timeout(8000);
			var store = new SceneStore({
				accessKeyId:appConfig.TEST_AWS_CREDENTIALS.accessKeyId,
				secretAccessKey:appConfig.TEST_AWS_CREDENTIALS.secretAccessKey
			});

			var scene = {
				resource:{'type':'url','location':'http://la.com'},
				processes:[],
				tags:['testing'],
				dateCreated:(new Date()).getTime()
			};

			store.Add(scene)
				.then(function(scene){
					expect(scene).to.be.ok();
					expect(scene.sceneID).to.be.a('number');
					expect(scene.dateCreated).to.be.a('number');
					expect(scene.resource).to.be.an(Object);
					expect(scene.processes).to.be.an(Array);
					expect(scene.tags).to.be.an(Array);
					expect(scene.resource.location).to.be('http://la.com');

					return scene;
				}).then(function(scene){
					// Recreate store to prove nothing was held in memory
					store = new SceneStore({
						accessKeyId:appConfig.TEST_AWS_CREDENTIALS.accessKeyId,
						secretAccessKey:appConfig.TEST_AWS_CREDENTIALS.secretAccessKey
					});

					return store
						.Get({sceneID:scene.sceneID, dateCreated:scene.dateCreated})
						.then(function(scene2){
							expect(scene2).to.be.ok();
							expect(scene2.sceneID).to.be(scene.sceneID);
							expect(scene2.dateCreated).to.be(scene.dateCreated);
							expect(scene2.resource).to.be.an(Object);
							expect(scene2.tags).to.contain('testing');
							expect(scene2.processes).to.be.an(Array);
							expect(scene2.resource.location).to.be(scene.resource.location);
						});
				}).then(function(){
					done();
				}).catch(done);
		});
	});
	describe('GetRange',function(done){
		it('should return most recent scenes 100 by default',function(done){
			this.timeout(8000);
			var store = new SceneStore({
				accessKeyId:appConfig.TEST_AWS_CREDENTIALS.accessKeyId,
				secretAccessKey:appConfig.TEST_AWS_CREDENTIALS.secretAccessKey
			});

			store.GetRange().then(function(scenes){
				expect(scenes).to.be.an(Array);
				expect(scenes.length).to.be.greaterThan(1);
				done();
			}).catch(done);
		});
	});
});

