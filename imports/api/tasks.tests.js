import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { assert } from 'chai';
import { Accounts } from 'meteor/accounts-base';

import { Tasks } from './tasks.js';

if (Meteor.isServer) {
  describe('Tasks', function() {
    describe('methods', function() {
      const username = 'nwaogu';
      let taskId, userId;

      before(function() {
        let user = Meteor.users.findOne({username: username});
        if (!user) {
          userId = Accounts.createUser({
            'username': username,
            'email': 'a@a.com',
            'password': '12345578',
          }); 
        } else {
          userId = user._id;
        }
      });

      beforeEach(function() {
        Tasks.remove({});
        taskId = Tasks.insert({
          text: 'test task',
          createdAt: new Date(),
          owner: userId,
          username: 'tmeasday',
        });
      });

      it('can insert task', function() {
        let text = 'Hello!';
        const insert = Meteor.server.method_handlers['tasks.insert'];
        const invocation = { userId };
        insert.apply(invocation, [text]);
        assert.equal(Tasks.find().count(), 2);
      });

      it('cannot insert task if not logged in', function() {
        let text = 'Hi!';
        const insert = Meteor.server.method_handlers['tasks.insert'];
        const invocation = {};
        assert.throws(function() {
          insert.apply(invocation, [text]);
        }, Meteor.Error, /not-authorized/);

        assert.equal(Tasks.find().count(), 1);
      });

      it('can delete own task', function() {
        const deleteTask = Meteor.server.method_handlers['tasks.remove'];
        const invocation = { userId };
        deleteTask.apply(invocation, [taskId]);
        assert.equal(Tasks.find().count(), 0);
      });

      it("cannot delete someone else's task", function() {
        Tasks.update(taskId, { $set: { private: true } });
        const userId = Random.id();
        const deleteTask = Meteor.server.method_handlers['tasks.remove'];
        const invocation = { userId };
        assert.throws(function() {
          deleteTask.apply(invocation, [taskId]);
        }, Meteor.Error, /not-authorized/);
        assert.equal(Tasks.find().count(), 1);
      });

      it('can set own task checked', function() {
        const setChecked = Meteor.server.method_handlers['tasks.setChecked'];
        const invocation = { userId };
        setChecked.apply(invocation, [taskId, true]);
        assert.equal(Tasks.find({checked: true}).count(), 1);
      });

      it("cannot set someone else's task checked", function() {
        Tasks.update(taskId, { $set: { private: true } });
        const userId = Random.id();
        const setChecked = Meteor.server.method_handlers['tasks.setChecked'];
        const invocation = { userId };
        assert.throws(function() {
          setChecked.apply(invocation, [taskId, true]);
        }, Meteor.Error, /not-authorized/);
        assert.equal(Tasks.find({checked: true}).count(), 0);
      });

      it('can set own task private', function() {
        const setTaskPrivate = Meteor.server.method_handlers['tasks.setPrivate'];
        const invocation = { userId };
        setTaskPrivate.apply(invocation, [taskId, true]);
        assert.equal(Tasks.find({private: true}).count(), 1);
      });

      it("cannot set someone else's task private", function() {
        const userId = Random.id();
        const setPrivate = Meteor.server.method_handlers['tasks.setPrivate'];
        const invocation = { userId };
        assert.throws(function() {
          setPrivate.apply(invocation, [taskId, true]);
        }, Meteor.Error, /not-authorized/);
        assert.equal(Tasks.find({private: true}).count(), 0);
      });
    });
  });
}