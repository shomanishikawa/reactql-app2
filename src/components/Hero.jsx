import React from 'react';
import styles from './Hero.css';
import { graphql } from 'react-apollo';

import allMessages from 'src/queries/all_messages.gql';

const Hero = ({data}) => (
  <div className={styles.container}>
    <h1>HERO</h1>
    <div>{data.messages && data.messages[0]}</div>
  </div>
);

export default graphql(allMessages)(Hero);

