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
	var store;

	before(function(done){
		appConfigGetter().then(function(config){
			storeConfig = {
				MYSQL_CONNECTION_URL:config.MYSQL_CONNECTION_URL,	
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
		}).then(function(){
			store = new SceneStore(storeConfig);
			done();
		}).catch(done);
	});


	after(function(done){
		mockDynamo.Stop().then(done).catch(done);
	});

	beforeEach(function(done){
		this.timeout(3000);
		store.SetupDb().then(done).catch(done);
	});

	afterEach(function(done){
		this.timeout(3000);
		store.TeardownDb().then(done).catch(done);
	});

	describe('.NewRequest() & .GetRequest()',function(){
		it('should create and retrieve new requests respectively',function(done){

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
			URI:'http://la.com',
			completedAt:new Date().getTime()
		};
		var requestedScene;

		beforeEach(function(){
			return store.NewRequest(params)
				.then(function(scene){
					requestedScene = scene;
				});
		});

		it('should return new scene',function(){
			return store.CompleteSceneRequest(requestedScene,completionStatus,result)
				.then(function(scene){
					verifyScene(scene);
				});
		});

		it('should create new scene if it was completed successfully',function(){
			return store.CompleteSceneRequest(requestedScene,completionStatus,result)
				.then(function(scene){
					return store.GetScene(scene);
				})
				.then(function(scene){
					verifyScene(scene);
				});
		});

		it('should delete requested scene',function(){
			return store.CompleteSceneRequest(requestedScene,completionStatus,result)
				.then(function(scene){
					return store.GetRequest({
						sceneID:scene.sceneID,
						createdAt:scene.requestedAt
					});
				})
				.then(function(scene){
					expect(scene).to.be(null);
				});
		});

		function verifyScene(scene){
			expect(scene).to.be.ok();
			expect(scene.completedAt).to.be.a('number');
			expect(scene.completedAt.toPrecision(9)).to.be(result.completedAt.toPrecision(9));
			expect(scene.generatorName).to.be(params.generatorName);
			expect(scene.resourceType).to.be(params.resourceType);
			expect(scene.resourceURI).to.be(params.resourceURI);
			expect(scene.tags).to.eql(params.tags);

			expect(scene.resultType).to.eql(result.type);
			expect(scene.resultURI).to.eql(result.URI);
		}
	});

	describe('GetScenes',function(done){
		var params = {
			resourceType:'URL',
			resourceURI:'http://la.com',
			generatorName:'Snowflake',
			tags:['testing']
		};

		var result = {
			type:'IMAGE',
			URI:'http://la.com'
		};

		beforeEach(function(){
			var promises = [];
			var i = 0;
			var theTime = new Date().getTime();

			// Filthy stupid nested function for incrementing time
			var fnCompleteScene = function(inc){
				return function(scene){
					result.completedAt = theTime+(inc*5000);
					return store.CompleteSceneRequest(scene,'SUCCESSFUL',result);
				};
			};

			while (i<30){
				var inc = i;
				promises.push(store.NewRequest(params)
					.then(fnCompleteScene(inc)));
				i++;
			}
			return Promise.all(promises);
		});

		it('should return up to 25 scenes',function(){
			return store.GetScenes()
				.then(function(scenes){
					expect(scenes.length).to.be(25);
				});
		});

		it('should be ordered by most recent completedAt',function(){
			return store.GetScenes()
				.then(function(scenes){
					expect(scenes[0].completedAt).to.be.greaterThan(scenes[24].completedAt);
				});
		});

		it('should support alternate limit',function(){
			return store.GetScenes(23)
				.then(function(scenes){
					expect(scenes.length).to.be(23);
				});
		});

		it('should support pagination',function(){
			return store.GetScenes(13,2)
				.then(function(scenes){
					expect(scenes.length).to.be(4);
				});
		});
	});

	describe('GetRequests',function(done){
		var params = {
			resourceType:'URL',
			resourceURI:'http://la.com',
			generatorName:'Snowflake',
			tags:['testing']
		};

		it('should return multiple scenes',function(done){

			var promises = [];
			var i = 0;

			while (i<10){
				promises.push(store.NewRequest(params));
				i++;
			}

			Promise.all(promises)
				.then(function(){
					return store.GetRequests();
				}).then(function(requests){
					expect(requests.length).to.be(10);
					done();
				}).catch(done);
		});
	});
});

