import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import { markdown } from 'markdown';

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
          The North Pole Postal Service is running behind, please send <strong>@mitchdzugan</strong> this code: <strong>{this.state.code.slsCode}</strong> to get your computer connected to Santa HQ.
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
    const setAddress = () => {
      db.collection('People').doc(this.state.code.personId).set({
        ...this.state.you,
        Address: this.state.youAddress || this.state.you.Address
      });
    };
    const submit = () => {
      db.collection('People').doc(this.state.code.personId).set({
        ...this.state.you,
        Address: this.state.youAddress || this.state.you.Address,
        Wishes: this.state.youWishes || this.state.you.Wishes
      }).then(() => this.setState({ youAddress: null, youWishes: null, editWishList: false }));
    };
		if (!this.state.you.Wishes || this.state.editWishList) {
			return ( 
        <div style={{ display: 'flex', flexDirection: 'column' }} >
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }} >
            <div>
              <input 
                value={this.state.youAddress || this.state.you.Address}
                onChange={e => this.setState({ youAddress: e.target.value })}
              />
              <button onClick={setAddress} style={{ marginLeft: '10px' }} >Save Address</button>
            </div>
            <div>
              <button onClick={() => this.setState({ isPreview: !this.state.isPreview })} >
                {this.state.isPreview ? "Edit" : "Preview"}
              </button>
            </div> 
          </div>
          <div style={{ textAlign: 'center', fontSize: '20px', fontWeight: 'bold', margin: '15px' }} >Enter Your Wish List</div>
          {this.state.isPreview ? null : <textarea value={this.state.youWishes || this.state.you.Wishes} 
                                                   onChange={e => this.setState({ youWishes: e.target.value })} 
                                                   style={{ minHeight: '50vh' }}
                                         />}
          {!this.state.isPreview ? null : <div dangerouslySetInnerHTML={{ __html: markdown.toHTML(this.state.youWishes || this.state.you.Wishes || '') }} />}
          <div style={{ textAlign: 'center', marginTop: '20px' }} > <button onClick={submit} >Submit</button> </div> 
        </div>
      );
		}

    const { Address, Name, Wishes } = this.state.to;

    if (!Wishes) {
      return (
        <span>
          The North Pole Postal Service is running behind, we are still waiting to receive your letter to Santa. It will show up here as soon as its available.
        </span>
      );
    }


    return (
      <div>
        <p>Dear Santa <strong>{this.state.you.Name}</strong>,</p>
        <p style={{ marginLeft: '20px' }}>
          My name is <strong>{Name}</strong>, this year I tried to wfh as little as possible and only raged at 
          leads when I was really triggered so I think I deserve to be on the nice list. If you
          agree please get me something from this list:
        </p>
        <p style={{ marginLeft: '20px' }}
           dangerouslySetInnerHTML={{ __html: markdown.toHTML(Wishes) }}
        />
        <p style={{ marginLeft: '20px' }}>My chimney is currently out of order so you can just send my gift to <strong>{Address}</strong></p>
        <p style={{ marginTop: '40px' }}>-Merry Christmas,</p>
        <p style={{ marginTop: '-5px', marginLeft: '5px' }}>{Name} <span style={{ fontSize: '9px' }} >(aka {this.state.you.RName})</span></p>
      </div>
    );
  }

	renderChat (p, id, personId, title) {
		if (!this.state.you || !this.state.you.Wishes || !this.state.to || !this.state.to.Wishes) {
			return null;
		}

    const messages = p.messages || [];
    const messagesEl = !messages.length ?
      <div className="emptyMessages">no messages</div> : messages.map(
        ({ from, body }, ind) => (
          <div key={ind} className={`message ${from === personId ? 'fromMe' : 'fromOther'}`}>
            <div className="messageSpacer" />
            <div className="messageBody" >
              {body}
            </div>
          </div>
        )
      );

    const send = () => {
      const message = {
        from: personId,
        body: this[id].value,
      };
      db.collection('People').doc(id).set({
        ...p,
        messages: [
          ...messages,
          message
        ]
      }).then(() => {
        this[id].value = '';
      });
    };

    const onKeyDown = e => {
      if (e.keyCode === 13) {
        send();
      }
    }

		return (
			<div className="chat">
				<div className="header">
          Chat with <strong>{title || p.Name}</strong>
				</div>
				<div className="messages">
          {messagesEl}
				</div>
				<div className="input">
          <input
            onKeyDown={onKeyDown}
            ref={ref => {this[id] = ref;}} 
          />
          <button onClick={send} >send</button>
				</div>
			</div>
		);
	}

  render () {
		const fullyLoaded = this.state.to && this.state.you;
    const hasWishes = this.state.you && this.state.you.Wishes
    const wishEditButton = (
      <div style={{ position: 'fixed', bottom: '50px', width: '100vw', textAlign: 'center' }} >
        <button style={{ filter: 'drop-shadow(10px 10px 4px #444444)', padding: '5px' }}
                onClick={() => this.setState({ editWishList: true })}
                className="ewlb"
        >
          Edit Your Wishlist
        </button>
      </div>
    );
    return (
			<div>
        {!hasWishes || this.state.editWishList ? null : wishEditButton}
				<div className="letter">
					{this.renderContent()}
				</div>
				{fullyLoaded && (
					<div className="chatsHolder">
            {this.renderChat(this.state.you, this.state.code.personId, this.state.code.personId, 'your santa')}
            {this.renderChat(this.state.to, this.state.code.toId, this.state.code.personId)}
					</div>
				)}
			</div>
		);
  }
}

export default App;
