import React, { Component, PropTypes } from 'react';
import connect from '../../bicycle/src/connect';
import Repo from '../components/Repo';
import User from '../components/User';
import List from '../components/List';

class RepoPage extends Component {
  constructor(props) {
    super(props);
    this.renderUser = this.renderUser.bind(this);
  }

  renderUser(user) {
    return (
      <User user={user}
            key={user.login} />
    );
  }

  render() {
    if (this.props.repoLoading) {
      return <h1><i>Loading {this.props.params.name} details...</i></h1>;
    }
    if (this.props.repoError) {
      return <div></div>;
    }

    const { stargazers } = this.props;
    const loadingLabel = `Loading stargazers of ${this.props.params.name}...`;
    return (
      <div>
        <Repo repo={this.props.repo} owner={this.props.repo.owner}
          onToggleStarred={() => this.props.onToggleStarred(repo)}
          isTogglingStarred={this.props.onToggleStarredLoading(repo)}
        />
        <hr />
        <List renderItem={this.renderUser}
              items={this.props.stargazers || []}
              loadingLabel={loadingLabel}
              onLoadMoreClick={() => this.props.stargazersNext()}
              isFetching={!!this.props.stargazersLoading}
              isLastPage={!this.props.stargazersNext}
        />
      </div>
    );
  }
}

export default connect(
  props => ({
    repo: '/repos/' + props.params.login + '/' + props.params.name,
    stargazers : '/repos/' + props.params.login + '/' + props.params.name + '/stargazers',
  }),
  (request, props) => ({
    onToggleStarred: repo => (
      request(
        'update',
        '/repos/' + repo.fullName + '/' + (
          repo.isStarred ? 'unstar' : 'star'
        )
      )
    )
  })
)(RepoPage);
