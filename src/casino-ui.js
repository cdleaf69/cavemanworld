import {CasinoSession,SLOT_SYMBOLS,handValue,BLACKJACK_RULES} from './casino.js';
const $=id=>document.getElementById(id);
export function slotIcon(id){
  const shapes={berry:'<rect x="10" y="12" width="9" height="9" fill="#ea759d"/><rect x="21" y="16" width="9" height="9" fill="#dc577b"/><rect x="15" y="24" width="9" height="9" fill="#f697ae"/><path d="M13 10h12V6H13z" fill="#8fc86c"/>',leaf:'<path d="M10 29V17h7V10h18v11h-7v8z" fill="#76ca77"/><path d="m13 29 17-15" stroke="#ddedac" stroke-width="3"/>',fish:'<path d="M8 21 17 12h14l8 9-8 10H17L8 24 2 31V14z" fill="#83cbd5"/><rect x="29" y="17" width="3" height="3" fill="#38525c"/>',crystal:'<path d="m13 27 1-15 7-9 9 12v16l-9 5z" fill="#bba5ed"/><path d="M21 7v25" stroke="#eaf2ff" stroke-width="3"/>',sun:'<path d="M17 2h6v8h-6zM17 32h6v8h-6zM2 17h8v6H2zM32 17h8v6h-8zM12 12h16v16H12z" fill="#efc969"/><rect x="16" y="16" width="8" height="8" fill="#ffefad"/>'};
  return `<svg viewBox="0 0 42 42" aria-label="${SLOT_SYMBOLS.find(s=>s.id===id)?.name||id}" role="img">${shapes[id]}</svg>`;
}
function cardHtml(card){if(!card)return '<div class="playing-card card-back" aria-label="Face down card"><span>✦</span></div>';return `<div class="playing-card ${['♥','♦'].includes(card.suit)?'red-suit':''}" aria-label="${card.rank} ${card.suit}"><b>${card.rank}</b><span>${card.suit}</span><small>${card.rank}</small></div>`;}
export class CasinoUI{
 constructor({inventory,openModal,onInteraction}){
  this.session=new CasinoSession(Math.random,inventory);this.openModal=openModal;this.onInteraction=onInteraction;this.spinning=false;this.game='slots';this.held=new Set();
  $('slotReels').innerHTML=['berry','leaf','crystal'].map(id=>`<div class="slot-reel">${slotIcon(id)}</div>`).join('');
  $('slotRules').innerHTML=SLOT_SYMBOLS.map(s=>`<span>${slotIcon(s.id)}<b>×${s.payout}</b></span>`).join('');
  for(const game of ['slots','blackjack','poker','roulette'])$(`${game}Tab`).addEventListener('click',()=>this.open(game));
  $('spinSlots').addEventListener('click',()=>this.spin());
  for(const [id,action] of Object.entries({dealBlackjack:()=>this.session.deal(this.bet()),hitBlackjack:()=>this.session.hit(),standBlackjack:()=>this.session.stand(),doubleBlackjack:()=>this.session.double(),splitBlackjack:()=>this.session.split(),surrenderBlackjack:()=>this.session.surrender(),takeInsurance:()=>this.session.insurance(true),declineInsurance:()=>this.session.insurance(false),dealPoker:()=>{this.held.clear();this.session.dealPoker(this.bet());},drawPoker:()=>this.session.drawPoker([...this.held]),spinRoulette:()=>{const r=this.session.roulette(this.bet(),$('rouletteChoice').value);$('rouletteStatus').textContent=`${r.number} · ${r.color} · ${r.payout} coins returned`;}}))$(id).addEventListener('click',()=>this.act(action));
  $('casinoBet').addEventListener('change',()=>this.render());$('blackjackRules').textContent=BLACKJACK_RULES;
 }
 bet(){return Number($('casinoBet').value);}
 open(game,title=this.title||'The Lucky Hearth'){this.title=title;this.game=game;this.openModal();document.querySelector('#casinoModal .eyebrow').textContent=`${title.toUpperCase()} · COINS`;for(const id of ['slots','blackjack','poker','roulette']){$(`${id}View`).classList.toggle('hidden',id!==game);$(`${id}Tab`).classList.toggle('active',id===game);$(`${id}Tab`).setAttribute('aria-selected',String(id===game));}this.render();$('casinoFeedback').textContent=this.session.busy?'Finish your card game before placing another bet.':'Earn coins by selling resources at a general shop.';}
 act(action){if(this.spinning)return;try{action();this.render();$('casinoFeedback').textContent='All games use the coins in your pouch.';this.onInteraction({kind:`casino-${this.game}`,balance:this.session.balance,status:this.session.hand?.status});}catch(error){$('casinoFeedback').textContent=error.message;}}
 async spin(){if(this.spinning)return;let result;try{result=this.session.spin(this.bet());}catch(e){$('casinoFeedback').textContent=e.message;return;}this.spinning=true;this.render();$('slotReels').classList.add('spinning');for(let i=0;i<3;i++){await new Promise(r=>setTimeout(r,230));$('slotReels').children[i].innerHTML=slotIcon(result.reels[i]);}$('slotReels').classList.remove('spinning');this.spinning=false;this.render();$('casinoFeedback').textContent=`${result.payout} coins returned`;this.onInteraction({kind:'casino-slots',...result});}
 render(){
  const s=this.session,busy=this.spinning||s.busy,hand=s.hand,insurance=hand?.status==='insurance';$('casinoBalance').textContent=`${s.balance} coins`;$('casinoBet').disabled=busy;
  for(const id of ['spinSlots','dealBlackjack','dealPoker','spinRoulette'])$(id).disabled=busy||s.balance<this.bet();
  for(const id of ['hitBlackjack','standBlackjack'])$(id).disabled=hand?.status!=='playing'||this.spinning;
  $('doubleBlackjack').disabled=!s.canDouble;$('splitBlackjack').disabled=!s.canSplit;$('surrenderBlackjack').disabled=!s.canSurrender;
  $('insuranceActions').classList.toggle('hidden',!insurance);$('takeInsurance').disabled=!insurance||s.balance<hand.bet/2;
  $('playerCards').innerHTML=hand?hand.hands.map((a,i)=>`<div class="split-hand ${i===hand.active&&s.playing?'active-hand':''}"><small>Hand ${i+1} · ${a.bet} coins · ${handValue(a.cards)}${a.status!=='playing'?' · '+a.status:''}</small><div class="card-hand">${a.cards.map(cardHtml).join('')}</div></div>`).join(''):'';
  $('dealerCards').innerHTML=hand?hand.dealer.map((c,i)=>cardHtml(i===1&&s.playing?null:c)).join(''):'';
  $('playerTotal').textContent=hand?handValue(hand.player):'—';$('dealerTotal').textContent=hand?(s.playing?'?':handValue(hand.dealer)):'—';$('blackjackStatus').textContent=hand?.message||'Place a bet to deal.';
  const p=s.poker;$('pokerCards').replaceChildren();if(p)p.cards.forEach((c,i)=>{const b=document.createElement('button');b.className=`poker-card ${this.held.has(i)?'held':''}`;b.innerHTML=cardHtml(c)+`<small>${this.held.has(i)?'HELD':'Hold'}</small>`;b.disabled=p.status!=='drawing';b.addEventListener('click',()=>{this.held.has(i)?this.held.delete(i):this.held.add(i);this.render();});$('pokerCards').append(b);});$('drawPoker').disabled=p?.status!=='drawing';$('pokerStatus').textContent=p?.status==='finished'?`${p.name} · ${p.payout} coins returned`:'Five-card draw: click cards to hold, then draw once. Jacks or better pays. No opponent.';
 }
}
