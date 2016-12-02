var mongodb = require('./db');
var markdown = require('markdown').markdown;
var ObjectID = require('mongodb').ObjectID;

function Post(name, title, tags, post) {
	this.name = name;
	this.title = title;
	this.tags = tags;
	this.post = post;
}
module.exports = Post;
//存储一篇文章及其相关信息
Post.prototype.save = function (callback) {
	var time = new Date();
	//要存入数据库的文档
	var post = {
		name: this.name,
		time: time,
		title: this.title,
		post: this.post,
		tags: this.tags,
		pv: 0,
		comments: []
	};
	//打开数据库
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		}
		//读取 posts 集合
		db.collection('posts', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			//将文档插入 posts 集合
			collection.insert(post, {
				safe: true
			}, function (err) {
				mongodb.close();
				if (err) {
					return callback(err); //失败！返回 err
				}
				callback(null); //返回 err 为 null
			});
		});
	});
};
//读取文章及其相关信息
Post.getAll = function (name, callback) {
	//打开数据库
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		}
		//读取 posts 集合
		db.collection('posts', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			var query = {};
			if (name) {
				query.name = name;
			}
			//根据 query 对象查询文章
			collection.find(query).sort({
				time: -1
			}).toArray(
				function (err, docs) {
					mongodb.close();
					if (err) {
						return callback(err); //失败！返回 err;
					}
					docs.forEach(function (doc) {
						doc.post = markdown.toHTML(doc.post);
						if (doc.tags == null) doc.tags = [];
						if (doc.comments == null) doc.comments = [];
						if (doc.pv == null) doc.pv = 0;
					});
					callback(null, docs); //成功！以数组形式返回查询的结果
				});
		});
	});
};
Post.getOne = function (id, callback) {
	//打开数据库
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		}
		//读取 posts 集合
		db.collection('posts', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			//根据 id 进行查询
			collection.findOne({
				_id: new ObjectID(id)
			}, function (err, doc) {
				if (err) {
					mongodb.close();
					return callback(err);
				}
				if (doc) {
					if (doc.pv == undefined || doc.pv == null) {
						collection.update({
							_id: new ObjectID(id)
						}, {
							$set: {
								"pv": 1
							}
						}, function (err) {
							mongodb.close();
							if (err) return callback(err);
						});
					} else {
						collection.update({
							_id: new ObjectID(id)
						}, {
							$inc: {
								"pv": 1
							}
						}, function (err) {
							mongodb.close();
							if (err) {
								return callback(err);
							}
						});
					}
					//解析 markdown 为 html
					doc.post = markdown.toHTML(doc.post);
					if (doc.comments == null) doc.comments = [];
					if (doc.tags == null) doc.tags = [];
					doc.comments.forEach(function (comment) {
						comment.content = markdown.toHTML(comment.content);
					});
					callback(null, doc); //返回查询的一篇文章
				}
				else {
					mongodb.close();
					err = '找不到相关数据';
					callback(err);
				}
			});
		});
	});
}
Post.edit = function (id, callback) {
	mongodb.open(function (err, db) {
		if (err) return callback(err);
		db.collection('posts', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			collection.findOne({
				_id: new ObjectID(id)
			}, function (err, doc) {
				mongodb.close();
				if (err) return callback(err);
				callback(null, doc);
			});
		});
	});
};

Post.update = function (id, post, callback) {
	mongodb.open(function (err, db) {
		if (err) return callback(err);
		db.collection('posts', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			collection.update({
				_id: new ObjectID(id)
			}, {
				$set: {
					post: post
				}
			}, function (err) {
				mongodb.close();
				if (err) return callback(err);
				callback(null);
			});
		});
	});
};

Post.remove = function (id, callback) {
	mongodb.open(function (err, db) {
		if (err) return callback(err);
		db.collection('posts', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			collection.remove({
				_id: new ObjectID(id)
			}, function (err) {
				mongodb.close();
				if (err) return callback(err);
				callback(null);
			});
		});
	});
};

Post.getUserName = function (id, callback) {
	//打开数据库
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		}
		//读取 posts 集合
		db.collection('posts', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			//根据 id 进行查询
			collection.findOne({
				_id: new ObjectID(id)
			}, function (err, doc) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null, doc.name); //返回查询的一篇文章
			});
		});
	});
}

//返回所有文章存档信息
Post.getArchive = function (callback) {
	//打开数据库
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		}
		//读取 posts 集合
		db.collection('posts', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			//返回只包含 name、 time、 title 属性的文档组成的存档数组
			collection.find({}, {
				"name": 1,
				"time": 1,
				"title": 1
			}).sort({
				time: -1
			}).toArray(function (err, docs) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null, docs);
			});
		});
	});
};

//返回所有标签
Post.getTags = function (callback) {
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			//distinct 用来找出给定键的所有不同值
			collection.distinct("tags", function (err, docs) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null, docs);
			});
		});
	});
};

//返回含有特定标签的所有文章
Post.getFromTag = function (tag, callback) {
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			//查询所有 tags 数组内包含 tag 的文档
			//并返回只含有 name、 time、 title 组成的数组
			collection.find({
				"tags": tag
			}, {
				"name": 1,
				"time": 1,
				"title": 1
			}).sort({
				time: -1
			}).toArray(function (err, docs) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null, docs);
			});
		});
	});
};

//返回通过标题关键字查询的所有文章信息
Post.search = function (keyword, callback) {
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			var pattern = new RegExp(keyword, "i");
			collection.find({
				"title": pattern
			}, {
				"name": 1,
				"time": 1,
				"title": 1
			}).sort({
				time: -1
			}).toArray(function (err, docs) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null, docs);
			});
		});
	});
};