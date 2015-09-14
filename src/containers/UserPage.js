import React, { Component, PropTypes } from 'react';
import connect from '../../bicycle/src/connect';
import User from '../components/User';
import Repo from '../components/Repo';
import List from '../components/List';


class UserPage extends Component {
  constructor(props) {
    super(props);
    this.renderRepo = this.renderRepo.bind(this);
  }

  renderRepo(repo) {
    return (
      <Repo repo={repo}
            owner={repo.owner}
            onToggleStarred={() => this.props.onToggleStarred(repo.fullName)}
            key={repo.fullName} />
    );
  }

  render() {
    const { user } = this.props;
    const login = this.props.params.login;

    if (this.props.userLoading) {
      return <h1><i>Loading {login}’s profile...</i></h1>;
    }
    if (this.props.userError) {
      return <div></div>;
    }
    if (!this.props.user) {
      return <div>WTF</div>;
    }

    //const { starredRepos, starredRepoOwners, starredPagination } = this.props;
    const loadingLabel = `Loading ${login}’s starred...`;
    return (
      <div>
        <User user={user} />
        <hr />
        <List renderItem={this.renderRepo}
              items={(this.props.starredRepos || [])}
              loadingLabel={loadingLabel}
              onLoadMoreClick={() => this.props.starredReposNext()}
              isFetching={!!this.props.starredReposLoading}
              isLastPage={!this.props.starredReposNext}
        />
      </div>
    );
  }
}
/*
UserPage.propTypes = {
  login: PropTypes.string.isRequired,
  user: PropTypes.object,
  starredPagination: PropTypes.object,
  starredRepos: PropTypes.array.isRequired,
  starredRepoOwners: PropTypes.array.isRequired,
  loadUser: PropTypes.func.isRequired,
  loadStarred: PropTypes.func.isRequired
};
*/


export default connect(
  props => ({
    user: '/users/' + props.params.login,
    starredRepos: '/users/' + props.params.login + '/starred',
  }),
  (request, props) => ({
    onToggleStarred: (fullName) => (
      request(
        'update',
        '/repos/' + fullName + '/' + (
          props.starredRepos.filter(r => r.fullName === fullName)[0].isStarred ? 'star' : 'unstar'
        )
      )
    )
  })
)(UserPage);
