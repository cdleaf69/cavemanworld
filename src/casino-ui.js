import {CasinoSession,SLOT_SYMBOLS,handValue} from './casino.js';
const $=id=>document.getElementById(id);
export function slotIcon(id){
  const shapes={berry:'<rect x="10" y="12" width="9" height="9" fill="#ea759d"/><rect x="21" y="16" width="9" height="9" fill="#dc577b"/><rect x="15" y="24" width="9" height="9" fill="#f697ae"/><path d="M13 10h12V6H13z" fill="#8fc86c"/>',leaf:'<path d="M10 29V17h7V10h18v11h-7v8z" fill="#76ca77"/><path d="m13 29 17-15" stroke="#ddedac" stroke-width="3"/>',fish:'<path d="M8 21 17 12h14l8 9-8 10H17L8 24 2 31V14z" fill="#83cbd5"/><rect x="29" y="17" width="3" height="3" fill="#38525c"/>',crystal:'<path d="m13 27 1-15 7-9 9 12v16l-9 5z" fill="#bba5ed"/><path d="M21 7v25" stroke="#eaf2ff" stroke-width="3"/>',sun:'<path d="M17 2h6v8h-6zM17 32h6v8h-6zM2 17h8v6H2zM32 17h8v6h-8zM12 12h16v16H12z" fill="#efc969"/><rect x="16" y="16" width="8" height="8" fill="#ffefad"/>'};
  return `<svg viewBox="0 0 42 42" aria-label="${SLOT_SYMBOLS.find(s=>s.id===id)?.name||id}" role="img">${shapes[id]}</svg>`;
}
function cardHtml(card){if(!card)return '<div class="playing-card card-back" aria-label="Face down card"><span>✦</span></div>';return `<div class="playing-card ${['♥','♦'].includes(card.suit)?'red-suit':''}" aria-label="${card.rank} ${card.suit}"><b>${card.rank}</b><span>${card.suit}</span><small>${card.rank}</small></div>`;}
export class CasinoUI {
  constructor({openModal,onInteraction}){
    this.session=new CasinoSession();this.openModal=openModal;this.onInteraction=onInteraction;this.spinning=false;this.game='slots';
    $('slotReels').innerHTML=['berry','leaf','crystal'].map(id=>`<div class="slot-reel">${slotIcon(id)}</div>`).join('');
    $('slotRules').innerHTML=SLOT_SYMBOLS.map(s=>`<span>${slotIcon(s.id)}<b>×${s.payout}</b></span>`).join('');
    for(const game of ['slots','blackjack'])$(`${game}Tab`).addEventListener('click',()=>this.open(game));
    $('spinSlots').addEventListener('click',()=>this.spin());
    $('dealBlackjack').addEventListener('click',()=>this.act(()=>this.session.deal(this.bet())));
    $('hitBlackjack').addEventListener('click',()=>this.act(()=>this.session.hit()));
    $('standBlackjack').addEventListener('click',()=>this.act(()=>this.session.stand()));
    $('casinoRefill').addEventListener('click',()=>{if(!this.spinning&&this.session.refill()){this.render();$('casinoFeedback').textContent='Here are 100 fresh play chips.';}});
    $('casinoBet').addEventListener('change',()=>this.render());
  }
  bet(){return Number($('casinoBet').value);}
  open(game,title=this.title||'The Lucky Hearth'){this.title=title;this.game=game;this.openModal();document.querySelector('#casinoModal .eyebrow').textContent=`${title.toUpperCase()} · FREE PLAY`;for(const id of ['slots','blackjack']){$(`${id}View`).classList.toggle('hidden',id!==game);$(`${id}Tab`).classList.toggle('active',id===game);$(`${id}Tab`).setAttribute('aria-selected',String(id===game));}this.render();$('casinoFeedback').textContent=this.session.playing?'Finish your blackjack hand before placing another bet.':'Chips are free and last for this play session.';}
  act(action){if(this.spinning)return;try{action();this.render();$('casinoFeedback').textContent='Chips are free and last for this play session.';this.onInteraction({kind:'casino-blackjack',balance:this.session.balance,status:this.session.hand?.status});}catch(error){$('casinoFeedback').textContent=error.message;}}
  async spin(){
    if(this.spinning)return;let result;
    try{result=this.session.spin(this.bet());}catch(error){$('casinoFeedback').textContent=error.message;return;}
    this.spinning=true;this.render();$('casinoFeedback').textContent='Reels rolling…';$('slotReels').classList.add('spinning');
    for(let i=0;i<3;i++){
      await new Promise(resolve=>setTimeout(resolve,300));
      $('slotReels').children[i].innerHTML=slotIcon(result.reels[i]);$('slotReels').children[i].classList.add('stopped');
    }
    $('slotReels').classList.remove('spinning');for(const reel of $('slotReels').children)reel.classList.remove('stopped');
    this.spinning=false;this.render();$('casinoFeedback').textContent=result.multiplier>1?`Three of a kind! ${result.payout} chips returned.`:result.multiplier===1?'A pair · your bet is returned.':'No match. Try another spin.';
    this.onInteraction({kind:'casino-slots',...result});
  }
  render(){
    $('casinoBalance').textContent=`${this.session.balance} play chips`;
    const busy=this.spinning||this.session.playing;
    $('casinoBet').disabled=busy;$('spinSlots').disabled=busy||this.session.balance<this.bet();$('dealBlackjack').disabled=busy||this.session.balance<this.bet();
    $('hitBlackjack').disabled=!this.session.playing||this.spinning;$('standBlackjack').disabled=!this.session.playing||this.spinning;$('casinoRefill').classList.toggle('hidden',this.session.balance>=10||busy);
    const hand=this.session.hand;
    $('playerCards').innerHTML=hand?hand.player.map(cardHtml).join(''):'';
    $('dealerCards').innerHTML=hand?hand.dealer.map((card,i)=>cardHtml(i===1&&this.session.playing?null:card)).join(''):'';
    $('playerTotal').textContent=hand?handValue(hand.player):'—';$('dealerTotal').textContent=hand?(this.session.playing?'?':handValue(hand.dealer)):'—';
    $('blackjackStatus').textContent=hand?.message||'Place your bet to deal. Dealer stands on all 17s. Blackjack pays 3:2.';
  }
}
