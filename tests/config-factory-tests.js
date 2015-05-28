var expect = require('expect.js');
var appConfigGetter = require('../lib/AppConfig');

describe('Config factory',function(){
	var originalEnv = process.env;

	beforeEach(function(){
		process.env = {};
	});

	it('should get AWS credentials from environment',function(){
		process.env.AWS_ACCESSKEYID = 'anAccessKey';
		process.env.AWS_SECRETACCESSKEY = 'aSecretKey';
		process.env.MYSQL_CONNECTION_URL = 'aConnectionString';
		return appConfigGetter().then(function(config){
			expect(config).to.be.ok();
			expect(config).to.only.have.keys(['AWS_CREDENTIALS','MYSQL_CONNECTION_URL']);
			expect(config.AWS_CREDENTIALS).to.only.have.keys(['accessKeyId','secretAccessKey']);
		});
	});

	it('should fail if AWS_ACCESSKEYID doesn\'t exist',function(){
		return appConfigGetter().then(function(config){
			throw new Error('Expected failure');
		}).catch(function(err){
			expect(err.message).to.be('Expect environment variable "AWS_ACCESSKEYID"');
		});
	});

	it('should fail if AWS_SECRETACCESSKEY doesn\'t exist',function(){
		process.env.AWS_ACCESSKEYID = 'anAccessKey';
		return appConfigGetter().then(function(config){
			throw new Error('Expected failure');
		}).catch(function(err){
			expect(err.message).to.be('Expect environment variable "AWS_SECRETACCESSKEY"');
		});
	});

	it('should fail if MYSQL_CONNECTION_URL doesn\'t exist (and another connection is not specified)',function(){
		process.env.AWS_ACCESSKEYID = 'anAccessKey';
		process.env.AWS_SECRETACCESSKEY = 'aSecretKey';
		return appConfigGetter().then(function(config){
			throw new Error('Expected failure');
		}).catch(function(err){
			expect(err.message).to.be('Unable to get MySQL connection information, try using the environment variable "MYSQL_CONNECTION_URL". Or consult the documentation for more connection options');
		});
	});
});