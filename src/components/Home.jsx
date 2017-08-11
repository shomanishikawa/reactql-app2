import React from 'react';
import universal from 'react-universal-component'

const UniversalComponent = universal((props) => {
  console.log(props.page);
  return import(`./${props.page}`)
});


class Home extends React.Component {

  render() {
    return (
      <div>

        <div>
          <h1>You&apos;re on the home page - click another link above</h1>

          <UniversalComponent page={'Hero'} />
        </div>


      </div>

    );
  }
}

export default Home;

