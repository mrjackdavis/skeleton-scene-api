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

	describe('Add',function(){
		it('should create a new item',function(done){
			this.timeout(8000);
			var store = new SceneStore({
				accessKeyId:appConfig.TEST_AWS_CREDENTIALS.accessKeyId,
				secretAccessKey:appConfig.TEST_AWS_CREDENTIALS.secretAccessKey
			});

			var scene = {
				resource:{'type':'url','location':'http://la.com'},
				processes:[],
				dateCreated:(new Date()).getTime()
			};

			store.Add(scene).then(function(scene){
				expect(scene).to.be.ok();
				expect(scene.sceneID).to.be.ok();

				done();
			}).catch(function(err){
				done(err);
			});
		});
	});
});

