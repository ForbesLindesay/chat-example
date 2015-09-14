import React, { Component, PropTypes } from 'react';

export default class List extends Component {
  renderLoadMore() {
    const { isFetching, onLoadMoreClick } = this.props;
    return (
      <button style={{ fontSize: '150%' }}
              onClick={onLoadMoreClick}
              disabled={isFetching}>
        {isFetching ? 'Loading...' : 'Load More'}
      </button>
    );
  }

  render() {
    const {
      isFetching, isLastPage,
      items, renderItem, loadingLabel
    } = this.props;

    const isEmpty = items.length === 0;
    if (isEmpty && isFetching) {
      return <h2><i>{loadingLabel}</i></h2>;
    }

    if (isEmpty && isLastPage) {
      return <h1><i>Nothing here!</i></h1>;
    }

    return (
      <div>
        {items.map(renderItem)}
        {!isLastPage && this.renderLoadMore()}
      </div>
    );
  }
}

List.propTypes = {
  loadingLabel: PropTypes.string.isRequired,
  renderItem: PropTypes.func.isRequired,
  items: PropTypes.array.isRequired,
  onLoadMoreClick: PropTypes.func.isRequired,
  isFetching: PropTypes.bool.isRequired,
  isLastPage: PropTypes.bool.isRequired
};

List.defaultProps = {
  isFetching: true,
  loadingLabel: 'Loading...'
};
