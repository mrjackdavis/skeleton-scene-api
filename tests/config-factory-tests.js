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

	it('should construct MYSQL_CONNECTION_URL from docker container link',function(){
		process.env.AWS_ACCESSKEYID = 'anAccessKey';
		process.env.AWS_SECRETACCESSKEY = 'aSecretKey';

		// Docker vars when using --link someMysqlDB:mysql
		process.env.MYSQL_PORT='tcp://172.17.0.8:3306';
		process.env.MYSQL_PORT_3306_TCP='tcp://172.17.0.8:3306';
		process.env.MYSQL_PORT_3306_TCP_ADDR='172.17.0.8';
		process.env.MYSQL_PORT_3306_TCP_PORT='3306';
		process.env.MYSQL_PORT_3306_TCP_PROTO='tcp';
		process.env.MYSQL_NAME='/test/db';
		process.env.MYSQL_ENV_MYSQL_ROOT_PASSWORD='lePassword';
		process.env.MYSQL_ENV_MYSQL_MAJOR='5.6';
		process.env.MYSQL_ENV_MYSQL_VERSION='5.6.22';

		process.env.MYSQL_DB_NAME='a_test_db';
		
		return appConfigGetter().then(function(config){
			expect(config.MYSQL_CONNECTION_URL).to.be('mysql://root:lePassword@172.17.0.8:3306/a_test_db');
		});
	});

	it('should throw an error if the database name is not set when mysql container is linked',function(){
		process.env.AWS_ACCESSKEYID = 'anAccessKey';
		process.env.AWS_SECRETACCESSKEY = 'aSecretKey';

		// Docker vars when using --link someMysqlDB:mysql
		process.env.MYSQL_PORT='tcp://172.17.0.8:3306';
		process.env.MYSQL_PORT_3306_TCP='tcp://172.17.0.8:3306';
		process.env.MYSQL_PORT_3306_TCP_ADDR='172.17.0.8';
		process.env.MYSQL_PORT_3306_TCP_PORT='3306';
		process.env.MYSQL_PORT_3306_TCP_PROTO='tcp';
		process.env.MYSQL_NAME='/test/db';
		process.env.MYSQL_ENV_MYSQL_ROOT_PASSWORD='lePassword';
		process.env.MYSQL_ENV_MYSQL_MAJOR='5.6';
		process.env.MYSQL_ENV_MYSQL_VERSION='5.6.22';
		
		return appConfigGetter().then(function(config){
			throw new Error('Expected failure');
		}).catch(function(err){
			expect(err.message).to.be('Expect environment variable "MYSQL_DB_NAME"');
		});
	});
});