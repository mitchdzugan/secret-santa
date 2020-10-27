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
      let slsCode = window.localStorage.getItem('sls-code-2020');
      slsCode = slsCode === "null" ? null : slsCode;
    this.state = {
        slsCode
    };

      this.processCode();

    this.unsubYou = () => {};
    this.unsubTo = () => {};
  }

    processCode (code) {
        const slsCode = code || this.state.slsCode;
        if (!slsCode) {
            return;
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
      window.localStorage.setItem('sls-code-2020', this.state.slsCode);
    if (this.state.slsCode && !this.state.code) {
      return (
        <div style={{ display: 'flex', textAlign: 'center', flexDirection: 'column', margin: 'auto' }}>
          <img className="loader" width="100px" height="100px" style={{ margin: 'auto' }} src="https://cdn3.iconfinder.com/data/icons/christmas-flatroom/512/santa_claus_old_beard_costume-512.png" />
          <span> loading... </span>
        </div>
      );
    }

    if (!this.state.code || !this.state.code.personId) {
      return (
              <div>
              <div>
              The North Pole Postal Service is running behind, please ask <strong>@mitchdzugan</strong> for your connection code and input below to get your computer connected to Santa HQ.
              </div>
              <input style={{ marginTop: "10px" }} value={this.state.slsCode || ""} onChange={e => {
                  this.setState({ slsCode: e.target.value });
                  this.processCode(e.target.value);
              }} />
        </div>
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
              <div style={{ marginTop: "10px" }}>
              You are the Santa for <strong>{this.state.to.Name}</strong>, you will be able to see their wish list and anonymously chat with them once you both have submitted yours.
          </div>
        </div>
      );
		}

    const { Address, Name, Wishes, RName } = this.state.to;

    if (!Wishes) {
      return (
        <div>
          <p>
            You will be getting a gift for:
          </p>
          <p
              style={{ textAlign: 'center', fontSize: '20px', marginTop: '-15px',  }}
          >
            <span style={{ fontWeight: 'bold' }} >
              {Name}&nbsp;
            </span>
          </p>
          <p>
            We are still waiting to receive their letter to you. It will show up here as soon as its available.
          </p>
        </div>
      );
    }


    return (
      <div>
        <p>Dear Santa <strong>{this.state.you.Name}</strong>,</p>
        <p style={{ marginLeft: '20px' }}>
            My name is <strong>{Name}</strong>, this year I wore a mask whenever I was in public, resisted the urge to break quarantine to get kbbq,
        and only took advantage of wfh when I was feeling extremely lazy so I think I deserve to be on the nice list. If you
          agree please get me something from this list:
        </p>
        <p style={{ marginLeft: '20px' }}
           dangerouslySetInnerHTML={{ __html: markdown.toHTML(Wishes) }}
        />
        <p style={{ marginLeft: '20px' }}>My chimney is currently out of order so you can just send my gift to <strong>{Address}</strong></p>
        <p style={{ marginTop: '40px' }}>-Merry Christmas,</p>
        <p style={{ marginTop: '-5px', marginLeft: '5px' }}> {Name} </p>
      </div>
    );
  }

	renderChat (p, id, personId, title) {
		if (!this.state.you || !this.state.you.Wishes || !this.state.to || !this.state.to.Wishes) {
			return null;
		}

    const messages = p.messages || [];
    const messagesEl = !messages.length ?
      <div className="emptyMessages">no messages</div> :
      messages.map(
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
