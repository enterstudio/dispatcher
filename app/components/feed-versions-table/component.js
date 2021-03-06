import Ember from 'ember';
import SelectableModelComponent from 'dispatcher/mixins/selectable-model-component';

export default Ember.Component.extend(SelectableModelComponent, {
  session: Ember.inject.service(),
  classNames: ['table-responsive'],
  sortKey: null,
  getSelectableModels: function() {
    return this.get('models')
  },
  actions: {
  }
});
