import Ember from 'ember';

export default Ember.Controller.extend({
  selected: false,

  getChanges: function() {
    let thisIssue = this.model.issues.get('firstObject');
    var ret = {};
    ret['action'] = 'createUpdate';
    ret['issuesResolved'] = [ Number(thisIssue.get('id')) ];
    ret['feed'] = { onestopId: this.model.feed.get('onestop_id'),  url: this.model.feed.get('url') };
    return [ret];
  },

  pollChangesetApply: function(url, applicationAdapter) {
    var self = this;
    applicationAdapter.ajax(url, 'post').then(function(response){
      if (response.status === 'complete') {
        self.set('applyMessage', {show: true, status: response.status, newIssues: [], message: 'Successfully resolved issue ' + self.model.issues.get('firstObject') });
      }
      else if (response.status === 'error') {
        self.set('applyMessage', {show: true, status: response.status, message: 'Error resolving issue ' + self.model.issues.get('firstObject') + '. ' + response.errors});
      }
      else {
        Ember.run.later(self.pollChangesetApply.bind(self, url, applicationAdapter), 5000);
      }
    }).catch(function(error){
      self.set('applyMessage', {show: true, status: 'error', message: 'Error resolving issue ' + self.model.issues.get('firstObject') + '. ' + error.errors.map(function(e){ return e.message}).join('. ')});
    });
  },

  actions: {
    showChangeset: function() {
      var payload = {changes: this.getChanges()};
      this.model.changeset.get('change_payloads').get('firstObject').set('payload', payload);
      this.set('showChangeset', true);
    },
    hideChangeset: function() {
      this.set('showChangeset', false);
    },
    saveChangeset: function() {
      var self = this;
      return self.model.changeset.save()
        .then(function(changeset) {
          self.set('applyingSpinner', true);
          return changeset.apply_async();
        }).then(function(response) {
          self.set('applyingSpinner', false);
          self.set('showChangeset', false);
          self.set('applyMessage', {show: true, status: response.status, newIssues: [], message: 'Applying changeset to resolve issue ' + self.model.issues.get('firstObject').get('id') });
        }).catch(function(error) {

        });
    },
    toggleApplyMessage: function() {
      this.set('applyMessage.show', false);
      if (this.get('applyMessage').status === 'complete') {
        let queryParamsObject = this.queryParamsObject();
        this.transitionToRoute('feeds.show', { queryParams: queryParamsObject });
      }
      if (this.get('applyMessage').status === 'queued') {
        var applicationAdapter = this.store.adapterFor('changeset');
        var modelUrl = applicationAdapter.buildURL('changeset', this.model.changeset.id);
        var applyUrl = modelUrl + '/apply_async';
        this.pollChangesetApply(applyUrl, applicationAdapter);
      }
      if (this.get('applyMessage').status === 'error') {
        // clean the changeset, but leave edits.
        let changeset = this.store.createRecord('changeset', {
          notes: 'Issue resolution:'
        });
        changeset.get('change_payloads').createRecord();
        this.set('model.changeset', changeset);
      }
    },
    closeDialog: function() {
      this.set('closeMessage', {show: true, message: 'Close issue ' + this.model.issues.get('firstObject')});
    },
    closeIssue: function() {
      let thisIssue = this.model.issues.get('firstObject');
      thisIssue.set('open', false);
      var self = this;
      thisIssue.save().then(function(){
        self.set('closeMessage.show', false);
        let queryParamsObject = self.queryParamsObject();
        self.transitionToRoute('feeds.show', { queryParams: queryParamsObject });
      }).catch(function(error){
        self.set('closeMessage', {show: true, error: true, message: 'Error closing issue ' + thisIssue.id + '. ' + error.message});
      });
    },
    toggleCloseMessage: function() {
      this.set('closeMessage.show', false);
    },
    issueClicked: function() {
      this.set('selected', !this.get('selected'));
    }
  }
});
