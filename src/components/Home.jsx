import React from 'react';
import universal from 'react-universal-component'

const UniversalComponent = universal(props => import(`./Hero`));

class Home extends React.Component {
  render() {
    return (
      <div>
      <UniversalComponent page={'Hero'} />
      </div>
    );
  }
}

export default Home;

