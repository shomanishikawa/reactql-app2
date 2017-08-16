import React from 'react';
import universal from 'react-universal-component'
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import modules from 'src/queries/modules.gql';

const UniversalComponent = universal(({module}) => import(`./components/${module}`));

const Home = ({data}) => {
  const { modules } = data;

  return (
    <div>
      {modules && modules.map(module => (
        <UniversalComponent module={module} key={module} />
      ))}
    </div>
  )
};

export default graphql(modules)(Home);

