import React, { Component } from 'react';
import {render} from 'react-dom';
import Hello from './components/Hello';
class App extends Component {
 render() {
 return (
 <Hello />
 )
 }
}
render(<App />, document.getElementById('root'));

// CSS and SASS files
import './main.css';

import './jqueryload';

import './Reviews';

import './Realtime';

import './WebPushManager';

import './Firebase';

require('lightgallery');
require('lazysizes');
require('svg4everybody');
require('default-passive-events');
require('anchor-js');
