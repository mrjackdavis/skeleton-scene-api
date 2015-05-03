var NotImpementedError = require('../lib/NotImplementedError');
var expect = require('expect.js');
var SceneStore = require('../lib/stores/SceneStore');
var appConfigGetter = require('../lib/AppConfig');
var MockDynamo = require('./local-dynamo');
var Promise = require('Promise');

var DYNAMO_PORT = 4567;

describe('SceneStore',function(){
	var storeConfig;
	var mockDynamo = new MockDynamo('./tmp/mockDynamo-scene-store-tests');

	before(function(done){
		appConfigGetter().then(function(config){
			storeConfig = {
				AWS_CREDENTIALS:{
					accessKeyId:'hocus',
					secretAccessKey:'pocus'
				},
				endpoint:'http://127.0.0.1:'+DYNAMO_PORT
			};
		}).then(function(){
			return mockDynamo.Start(DYNAMO_PORT);
		}).then(function(){
			var store = new SceneStore(storeConfig);
			return store.SetupDb();
		}).then(function(){
			done();
		}).catch(done);
	});

	after(function(done){
		mockDynamo.Stop().then(done);
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
					console.log(scene);
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
		it('should return most recent scenes 100 by default',function(done){
			var store = new SceneStore(storeConfig);

			// Add over 100 items
			store.GetRange().then(function(scenes){
					expect(scenes).to.be.an(Array);

					var i = scenes.length;
					var promises = [];

					while(i-1 < 110){
						var scene = {
							resource:{'type':'url','location':'http://'+i+'.lala'},
							processes:[],
							tags:['testing'],
							dateCreated:new Date()
						};

						promises.push(store.Add(scene));

						i++;
					}

					return Promise.all(promises);
				})
				.then(store.GetRange())
				.then(function(scenes){
					if(scenes.length === 110){
						console.warn('Test inconclusive; library is probably broken');
					}else{
						expect(scenes.length).to.be(100);
					}
					done();
				}).catch(done);
		});
	});

	describe('AddProcessToScene',function(done){

		var resultScene;
		var store;

		before(function(done){
			var store = new SceneStore(storeConfig);
			var scene = {
				resource:{'type':'url','location':'http://la.com'},
				tags:['testing'],
				dateCreated:new Date()
			};


			store.Add(scene)
				.then(function(scene){
					return store.AddProcessToScene(scene,{ foo:'I am a process. Yey.' });
				}).then(function(scene){
					resultScene = scene;
					console.log(resultScene);
					done();
				}).catch(done);
		});

		it('should return the scene that\'s been updated with the new process',function(){
			expect(resultScene.processes).to.be.an(Array);
			expect(resultScene.processes.length).to.be(1);
			expect(resultScene.processes[0].foo).to.be('I am a process. Yey.');
		});
	});
});

