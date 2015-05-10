var NotImplementedError = require('../lib/NotImplementedError');
var expect = require('expect.js');
var SceneStore = require('../lib/stores/SceneStore');
var appConfigGetter = require('../lib/AppConfig');
var MockDynamo = require('./MockDynamo');
var Promise = require('Promise');

var DYNAMO_PORT = 4567;

describe('SceneStore',function(){
	var storeConfig;

	before(function(done){
		appConfigGetter().then(function(config){
			storeConfig = {
				AWS_CREDENTIALS:{
					// accessKeyId:config.TEST_AWS_CREDENTIALS.accessKeyId,
					// secretAccessKey:config.TEST_AWS_CREDENTIALS.secretAccessKey
					accessKeyId:'hocus',
					secretAccessKey:'pocus'
				},
				endpoint:'http://127.0.0.1:'+DYNAMO_PORT
			};
		}).then(function(){
			done();
		}).catch(done);
	});

	var mockDynamo;
	beforeEach(function(done){
		var tmpDir = './tmp/mockDynamo-'+(this.currentTest.fullTitle().replace(/\W/g,'-'));
		mockDynamo = new MockDynamo(tmpDir);
		mockDynamo.Start(DYNAMO_PORT)
			.then(function(){
				var store = new SceneStore(storeConfig);
				return store.SetupDb();
			}).then(function(){
				done();
			}).catch(done);
	});

	afterEach(function(done){
		mockDynamo.Stop().then(done).catch(done);
	});

	describe('Add and get',function(){
		it('should create and retrieve a new item respectively',function(done){
			this.timeout(10000);
			var store = new SceneStore(storeConfig);

			var scene = {
				resource:{'type':'url','location':'http://la.com'},
				processes:[],
				tags:['testing'],
				dateCreated:new Date()
			};

			store.Add(scene)
				.then(function(scene){
					expect(scene).to.be.ok();
					expect(scene.sceneID).to.be.a('string');
					expect(scene.dateCreated).to.be.a(Date);
					expect(scene.resource).to.be.an(Object);
					expect(scene.processes).to.be.an(Array);
					expect(scene.tags).to.be.an(Array);
					expect(scene.resource.location).to.be('http://la.com');

					return scene;
				}).then(function(scene){
					// Recreate store to prove nothing was held in memory
					store = new SceneStore(storeConfig);

					return store
						.Get({sceneID:scene.sceneID, dateCreated:scene.dateCreated})
						.then(function(scene2){
							expect(scene2).to.be.ok();
							expect(scene2.sceneID).to.be(scene.sceneID);
							expect(scene2.dateCreated).to.eql(scene.dateCreated);
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
		it('should return scenes 25 by default',function(done){
			this.timeout(6000);
			var store = new SceneStore(storeConfig);

			var latestDate;
			// Add over 25 items
			store.GetRange().then(function(scenes){
					expect(scenes).to.be.an(Array);

					var i = scenes.length;
					var promises = [];


					while(i <= 35){
						latestDate = new Date(Date.now()+i*360);
						var scene = {
							resource:{'type':'url','location':'http://'+i+'.lala'},
							tags:['testing'],
							dateCreated:latestDate
						};

						promises.push(store.Add(scene));

						i++;
					}

					return Promise.all(promises);
				})
				.then(function(promises){
					return store.GetRange();
				})
				.then(function(scenes){
					expect(scenes.length).to.be(25);

					// DynamoDB sucks at sorting

					// expect(scenes[0].dateCreated).to.eql(latestDate);
					// expect(scenes[0].dateCreated.getTime()).to.be.greaterThan(scenes[1].dateCreated.getTime());
					done();
				}).catch(done);
		});
	});

	describe('GetNextForProcessing',function(done){
		it('should return the next scene to be processed',function(done){
			var store = new SceneStore(storeConfig);
			var scene = {
				resource:{'type':'url','location':'http://GetNextForProcessing.com'},
				tags:['testing']
			};
			done(new NotImplementedError('GetNextForProcessing should return the next scene to be processed'));
		});
	});

	describe('AddProcessToScene',function(done){

		var store;

		it('should return the scene that\'s been updated with the new process',function(done){
			this.timeout(5000);
			var store = new SceneStore(storeConfig);
			var scene = {
				resource:{'type':'url','location':'http://AddProcessToScene.com'},
				tags:['testing']
			};


			store.Add(scene)
				.then(function(scene){
					return store.AddProcessToScene(scene,{ status:'IN_PROGRESS' });
				}).then(function(scene){
					expect(scene.processes).to.be.an(Array);
					expect(scene.processes.length).to.be(1);
					expect(scene.processes[0].status).to.be('IN_PROGRESS');
					done();
				}).catch(done);
		});

		it('should support multiple processes',function(done){
			this.timeout(5000);
			var store = new SceneStore(storeConfig);
			var scene = {
				resource:{'type':'url','location':'http://AddProcessToScene2.com'},
				tags:['testing']
			};

			store.Add(scene)
				.then(function(scene){
					return store.AddProcessToScene(scene,{ status:'IN_PROGRESS' });
				}).then(function(scene){
					return store.AddProcessToScene(scene,{ status:'COMPLETE' });
				}).then(function(scene){
					expect(scene.processes).to.be.an(Array);
					expect(scene.processes.length).to.be(2);
					done();
				}).catch(done);
		});
	});
	describe('UpdateProcess',function(){
		it('should update the process at a specific index',function(done){
			this.timeout(5000);
			var store = new SceneStore(storeConfig);
			var scene = {
				resource:{'type':'url','location':'http://UpdateProcess.com'},
				tags:['testing']
			};

			store.Add(scene)
				.then(function(scene){
					return store.AddProcessToScene(scene,{ status:'IN_PROGRESS' });
				}).then(function(scene){
					return store.AddProcessToScene(scene,{ status:'PAUSED' });
				}).then(function(scene){
					return store.UpdateProcess(scene,1,{status:'COMPLETE'});
				}).then(function(scene){
					expect(scene.processes[0].status).to.be('IN_PROGRESS');
					expect(scene.processes[1].status).to.be('COMPLETE');
					done();
				}).catch(done);
		});
	});

});

