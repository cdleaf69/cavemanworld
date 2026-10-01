export const SLOT_SYMBOLS=[{id:'berry',name:'Berries',weight:35,payout:4},{id:'leaf',name:'Leaf',weight:28,payout:6},{id:'fish',name:'Fish',weight:20,payout:8},{id:'crystal',name:'Crystal',weight:12,payout:12},{id:'sun',name:'Sun',weight:5,payout:20}];
export function handValue(cards){let value=0,aces=0;for(const card of cards){if(card.rank==='A'){value+=11;aces++;}else value+=['J','Q','K'].includes(card.rank)?10:Number(card.rank);}while(value>21&&aces-->0)value-=10;return value;}
export function makeDeck(rng=Math.random){const deck=[];for(const suit of ['♠','♥','♦','♣'])for(const rank of ['A','2','3','4','5','6','7','8','9','10','J','Q','K'])deck.push({rank,suit});for(let i=deck.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}return deck;}

// Session-only free play chips. A future server should validate bets and deal cards.
export class CasinoSession {
  constructor(rng=Math.random){this.rng=rng;this.balance=100;this.hand=null;this.lastSpin=null;}
  get playing(){return this.hand?.status==='playing';}
  wager(bet){if(this.playing)throw new Error('Finish your blackjack hand first.');if(![10,20,50].includes(bet))throw new Error('Choose a 10, 20, or 50 chip bet.');if(bet>this.balance)throw new Error('Not enough play chips.');this.balance-=bet;}
  refill(){if(this.playing||this.balance>=10)return false;this.balance+=100;return true;}
  spin(bet){
    this.wager(bet);
    const reels=Array.from({length:3},()=>{let roll=this.rng()*100;for(const symbol of SLOT_SYMBOLS){roll-=symbol.weight;if(roll<0)return symbol.id;}return 'sun';});
    const counts=new Map();for(const reel of reels)counts.set(reel,(counts.get(reel)||0)+1);
    const triple=reels.every(r=>r===reels[0]),pair=[...counts.values()].includes(2);
    const multiplier=triple?SLOT_SYMBOLS.find(s=>s.id===reels[0]).payout:pair?1:0,payout=bet*multiplier;
    this.balance+=payout;this.lastSpin={reels,bet,payout,multiplier};return this.lastSpin;
  }
  deal(bet){
    this.wager(bet);const deck=makeDeck(this.rng);
    const hand=this.hand={bet,deck,player:[deck.pop()],dealer:[deck.pop()],status:'playing',message:'Hit for a card, or stand.',payout:0};
    hand.player.push(deck.pop());hand.dealer.push(deck.pop());
    if(handValue(hand.player)===21||handValue(hand.dealer)===21){
      const player21=handValue(hand.player)===21,dealer21=handValue(hand.dealer)===21;
      this.settle(player21&&dealer21?bet:player21?bet*2.5:0,player21&&dealer21?'Both have blackjack · push.':player21?'Blackjack! Pays 3:2.':'Dealer blackjack.');
    }
    return hand;
  }
  hit(){if(!this.playing)return false;this.hand.player.push(this.hand.deck.pop());const value=handValue(this.hand.player);if(value>21)this.settle(0,'You busted.');else if(value===21)this.stand();return true;}
  stand(){
    if(!this.playing)return false;
    while(handValue(this.hand.dealer)<17)this.hand.dealer.push(this.hand.deck.pop());
    const player=handValue(this.hand.player),dealer=handValue(this.hand.dealer),bet=this.hand.bet;
    if(dealer>21||player>dealer)this.settle(bet*2,dealer>21?'Dealer busted · you win!':'You beat the dealer!');
    else if(player===dealer)this.settle(bet,'Same total · push.');
    else this.settle(0,'Dealer wins this hand.');return true;
  }
  settle(payout,message){if(!this.playing)return;this.hand.status='finished';this.hand.payout=payout;this.hand.message=message;this.balance+=payout;}
}
