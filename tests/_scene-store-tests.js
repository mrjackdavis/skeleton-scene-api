var NotImplementedError = require('../lib/NotImplementedError');
var expect = require('expect.js');
var Promise = require('Promise');

var SceneStore = require('../lib/stores/SceneStore');
var appConfigGetter = require('../lib/AppConfig');
var sceneEnums = require('../lib/stores/SceneEnums');
var statusTypes = sceneEnums.StatusTypes;
var resourceTypes = sceneEnums.ResourceTypes;

var MockDynamo = require('./MockDynamo');

var DYNAMO_PORT = 4567;

describe('SceneStore',function(){
	var storeConfig;
	var mockDynamo;

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
			var tmpDir = './tmp/mockDynamo-scene-store-tests';
			mockDynamo = new MockDynamo(tmpDir);
			return mockDynamo.Start(DYNAMO_PORT);
		})
		.then(function(){
			var store = new SceneStore(storeConfig);
			return store.SetupDb();
		}).then(done).catch(done);
	});


	after(function(done){
		mockDynamo.Stop().then(done).catch(done);
	});

	describe('Scene Requests',function(){
		it('should create and retrieve new requests respectively',function(done){
			this.timeout(10000);
			var store = new SceneStore(storeConfig);

			var params = {
				resourceType:'URL',
				resourceURI:'http://la.com',
				generatorName:'Snowflake',
				tags:['testing']
			};

			store.NewRequest(params)
				.then(function(scene){
					expect(scene).to.be.ok();
					expect(scene.sceneID).to.be.a('string');
					expect(scene.createdAt).to.be.a('number');
					expect(scene.resourceType).to.be(resourceTypes.Url);
					expect(scene.resourceURI).to.be('http://la.com');
					expect(scene.status).to.be(statusTypes.Pending);
					expect(scene.tags).to.be.an(Array);
					expect(scene.tags).to.contain('testing');

					return scene;
				}).then(function(scene){
					// Recreate store to prove nothing was held in memory
					store = new SceneStore(storeConfig);

					return store
						.GetRequest({sceneID:scene.sceneID, createdAt:scene.createdAt})
						.then(function(scene2){
							// expect(scene2).to.be.ok();
							expect(scene2).to.eql(scene);
						});
				}).then(function(){
					done();
				}).catch(done);
		});
	});

	describe('SetSceneRequestStatus',function(){
		it('should update the status of a request',function(done){
			var store = new SceneStore(storeConfig);
			var params = {
				resourceType:'URL',
				resourceURI:'http://la.com',
				generatorName:'Snowflake',
				tags:['testing']
			};

			store.NewRequest(params)
				.then(function(scene){
					return store.SetSceneRequestStatus(scene,'IN_PROGRESS');
				}).then(function(scene){
					expect(scene.status).to.be('IN_PROGRESS');
				}).then(done).catch(done);
		});
	});

	describe('CompleteSceneRequest',function(){
		var params = {
			resourceType:'URL',
			resourceURI:'http://la.com',
			generatorName:'Snowflake',
			tags:['testing']
		};

		var completionStatus = 'SUCCESSFUL';
		var result = {
			type:'IMAGE',
			URI:'http://la.com'
		};
		var completedScene;

		before(function(done){
			var store = new SceneStore(storeConfig);
			store.NewRequest(params)
				.then(function(scene){
					return store.CompleteSceneRequest(scene,completionStatus,result);
				}).then(function(scene){
					completedScene = scene;
					done();
				}).catch(done);
		});

		it('should return new scene',function(){
			verifyScene(completedScene);
		});

		it('should create new scene if it was completed successfully',function(done){
			var store = new SceneStore(storeConfig);
			store.GetScene(completedScene)
				.then(function(scene){
					verifyScene(scene);
				}).then(done).catch(done);
		});

		function verifyScene(scene){
			expect(scene).to.be.ok();
			expect(scene.completedAt).to.be.a('number');
			expect(scene.generatorName).to.be(params.generatorName);
			expect(scene.resourceType).to.be(params.resourceType);
			expect(scene.resourceURI).to.be(params.resourceURI);
			expect(scene.tags).to.eql(params.tags);

			expect(scene.resultType).to.eql(result.type);
			expect(scene.resultURI).to.eql(result.URI);
		}
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

