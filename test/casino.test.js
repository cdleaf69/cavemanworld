import test from 'node:test';
import assert from 'node:assert/strict';
import {CasinoSession,handValue,makeDeck} from '../src/casino.js';
import {CASINO_BUILDING,BUILDING_PORTALS,CASINO_FIXTURES,canWalk,nearestPortal,portalDestination,casinoActivityAt} from '../src/world.js';
const card=rank=>({rank,suit:'♠'});
test('casino has solid walls and furniture, reachable activities, and a return passage',()=>{
  const portal=BUILDING_PORTALS[0];
  for(const layer of ['surface','casino']){const p=portal[layer];assert.ok(canWalk(p.x,p.y,layer));assert.equal(nearestPortal(p.x,p.y,layer).id,portal.id);}
  assert.equal(portalDestination(portal,'surface'),'casino');assert.equal(portalDestination(portal,'casino'),'surface');
  assert.equal(canWalk(CASINO_BUILDING.x,CASINO_BUILDING.y,'surface'),false);assert.equal(canWalk(50,200,'casino'),false);
  for(const f of CASINO_FIXTURES){assert.equal(canWalk(f.x,f.y,'casino'),false);assert.ok(canWalk(f.activity.x,f.activity.y,'casino'));assert.equal(casinoActivityAt(f.activity.x,f.activity.y).id,f.id);}
  for(const [a,b] of [[[550,755],[550,300]],[[550,300],[320,300]],[[320,300],[550,300]],[[550,300],[550,550]],[[550,550],[780,550]]])for(let i=0;i<=100;i++){const t=i/100;assert.ok(canWalk(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,'casino'));}
});
test('slot results deduct bets, pay triples and pairs, and cannot spend unavailable chips',()=>{
  const jackpot=new CasinoSession(()=>0);assert.equal(jackpot.spin(10).payout,40);assert.equal(jackpot.balance,130);
  const values=[0,.4,.99],loss=new CasinoSession(()=>values.shift());assert.equal(loss.spin(10).payout,0);assert.equal(loss.balance,90);
  const pairValues=[0,0,.99],pair=new CasinoSession(()=>pairValues.shift());assert.equal(pair.spin(20).payout,20);assert.equal(pair.balance,100);
  assert.throws(()=>pair.spin(-10));pair.balance=0;assert.throws(()=>pair.spin(10));assert.ok(pair.refill());assert.equal(pair.balance,100);assert.equal(pair.refill(),false);
});
test('blackjack values aces correctly, deals without duplicates, and conceals an active hand',()=>{
  assert.equal(handValue(['A','A','9'].map(card)),21);assert.equal(handValue(['A','K','5'].map(card)),16);
  const deck=makeDeck(()=>.51);assert.equal(new Set(deck.map(c=>c.rank+c.suit)).size,52);
  const session=new CasinoSession(()=>.999),hand=session.deal(20);assert.equal(hand.player.length,2);assert.equal(hand.dealer.length,2);assert.equal(hand.status,'playing');assert.equal(session.balance,80);
  assert.equal(new Set([...hand.player,...hand.dealer].map(c=>c.rank+c.suit)).size,4);
  assert.throws(()=>session.spin(10));assert.throws(()=>session.deal(10));
});
test('dealer stands on soft 17, pushes return bets, and settlement cannot pay twice',()=>{
  const session=new CasinoSession();session.balance=80;
  session.hand={bet:20,status:'playing',player:['10','7'].map(card),dealer:['A','6'].map(card),deck:['K'].map(card)};
  session.stand();assert.equal(session.hand.dealer.length,2);assert.equal(session.balance,100);session.stand();session.settle(999,'duplicate');assert.equal(session.balance,100);
  session.hand={bet:20,status:'playing',player:['10','9'].map(card),dealer:['10','6'].map(card),deck:['K'].map(card)};session.balance=80;
  session.stand();assert.equal(session.balance,120);assert.equal(session.hand.payout,40);
});
test('hitting to bust loses the bet and natural blackjack pays three to two',()=>{
  const session=new CasinoSession();session.balance=80;session.hand={bet:20,status:'playing',player:['K','6'].map(card),dealer:['9','7'].map(card),deck:['K'].map(card)};
  session.hit();assert.equal(session.balance,80);assert.equal(session.hand.status,'finished');assert.equal(session.hit(),false);
  // Search a fixed sequence of reproducible shuffled shoes for a natural hand.
  let found=false;
  for(let seed=1;seed<200;seed++){let state=seed;const natural=new CasinoSession(()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;});const h=natural.deal(20);if(handValue(h.player)===21&&handValue(h.dealer)!==21){assert.equal(h.payout,50);assert.equal(natural.balance,130);found=true;break;}}
  assert.ok(found);
});
