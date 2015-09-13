import React, { Component, PropTypes } from 'react';
import connect from '../../bicycle/src/connect';
import User from '../components/User';
import Repo from '../components/Repo';
import List from '../components/List';


class UserPage extends Component {
  constructor(props) {
    super(props);
    this.renderRepo = this.renderRepo.bind(this);
    this.handleLoadMoreClick = this.handleLoadMoreClick.bind(this);
  }

  handleLoadMoreClick() {
    this.props.loadStarred(this.props.login, true);
  }

  renderRepo(repo) {
    return (
      <Repo repo={repo}
            owner={repo.owner}
            key={repo.fullName} />
    );
  }

  render() {
    const { user } = this.props;
    const login = this.props.params.login;

    if (!user) {
      return <h1><i>Loading {login}’s profile...</i></h1>;
    }

    //const { starredRepos, starredRepoOwners, starredPagination } = this.props;
    return (
      <div>
        <User user={user} />
        <hr />
        <List renderItem={this.renderRepo}
              items={(this.props.starredRepos || [])}
              onLoadMoreClick={this.handleLoadMoreClick}
              loadingLabel={`Loading ${login}’s starred...`} />
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
  })
)(UserPage);
