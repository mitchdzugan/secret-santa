import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

const firebase = window.firebase;

firebase.initializeApp({
  apiKey: 'AIzaSyBIwH-TaElo0hGA5z5m38dv_gNgf4DSWsM',
  authDomain: 'sls-secretsanta.firebaseapp.com',
  projectId: 'sls-secretsanta'
});

// Initialize Cloud Firestore through Firebase
var db = firebase.firestore();

// Disable deprecated features
db.settings({
  timestampsInSnapshots: true
});

const makeId = () => {
  var text = "";
  var possible = "abcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 13; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

class App extends Component {
  constructor (props) {
    super(props);
    const slsCode = window.localStorage.getItem('sls-code') || makeId();
    window.localStorage.setItem('sls-code', slsCode);
    this.state = {
      slsCode
    }

    db.collection("Codes").doc(slsCode)
    .onSnapshot((doc) => {
        if (!doc.data()) {
          db.collection("Codes").doc(slsCode).set({
            slsCode
          })
        } else {
          this.setState({ code: doc.data() })
        }
    });

    this.unsubYou = () => {};
    this.unsubTo = () => {};
  }

  componentDidUpdate(prevProps, prevState) {
    const currState = this.state;
    const prevYouId = prevState.code && prevState.code.personId;
    const currYouId = currState.code && currState.code.personId;
    const prevToId = prevState.code && prevState.code.toId;
    const currToId = currState.code && currState.code.toId;
    
    if (currYouId !== prevYouId) {
      this.unsubYou();
      this.unsubYou = db.collection('People').doc(currYouId).onSnapshot(doc => {
        this.setState({ you: doc.data() })
      })
    } 

    if (currToId !== prevToId) {
      this.unsubTo();
      this.unsubTo = db.collection('People').doc(currToId).onSnapshot(doc => {
        this.setState({ to: doc.data() })
      })
    }
  }

  renderContent() {
    if (!this.state.code) {
      return (
        <div style={{ display: 'flex', textAlign: 'center', flexDirection: 'column', margin: 'auto' }}>
          <img className="loader" width="100px" height="100px" style={{ margin: 'auto' }} src="https://cdn3.iconfinder.com/data/icons/christmas-flatroom/512/santa_claus_old_beard_costume-512.png" />
          <span> loading... </span>
        </div>
      );
    }

    if (!this.state.code.personId) {
      return (
        <span>
          The North Pole Postal Service is running behind, please send <strong>@mitchdzugan</strong> this code: <strong>{this.state.code.slsCode}</strong> to receive your letter to Santa.
        </span>
      );
    }

    if (!this.state.you || !this.state.to) {
      return (
        <div style={{ display: 'flex', textAlign: 'center', flexDirection: 'column', margin: 'auto' }}>
          <img className="loader" width="100px" height="100px" style={{ margin: 'auto' }} src="https://cdn3.iconfinder.com/data/icons/christmas-flatroom/512/santa_claus_old_beard_costume-512.png" />
          <span> loading... </span>
        </div>
      );
    }

    const { Address, Name, Wishes } = this.state.to;

    return (
      <div>
        <p>Dear Santa <strong>{this.state.you.Name}</strong>,</p>
        <p style={{ marginLeft: '20px' }}>
          My name is <strong>{Name}</strong>, this year I tried to wfh as little as possible and only raged at 
          leads when I was really triggered so I think I deserve to be on the nice list. If you
          agree please get me something from this list:
        </p>
        <p style={{ marginLeft: '20px' }}>{Wishes}</p>
        <p style={{ marginLeft: '20px' }}>My chimney is currently out of order so you can just send my gift to <strong>{Address}</strong></p>
        <p style={{ marginTop: '40px' }}>-Merry Christmas, {Name}</p>
      </div>
    );
  }

  render () {
    return <div className="letter"> {this.renderContent()} </div>;
  }
}

export default App;
