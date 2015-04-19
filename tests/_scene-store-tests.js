var NotImpementedError = require('../lib/NotImplementedError');
var expect = require('expect.js');
var SceneStore = require('../lib/stores/SceneStore');

describe('SceneStore',function(){
	describe('Add',function(){
		it('should create a new item',function(){
			var store = new SceneStore({

			});

			var scene = {'resource':{'type':'url','location':'http://la.com'},'processes':[]};

			store.add(scene).then(function(scene){
				expect(scene).to.be.ok();
				done();
			}).catch(function(err){
				done(err);
			});
		});
	});
});