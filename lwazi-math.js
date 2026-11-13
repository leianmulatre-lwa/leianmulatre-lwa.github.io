/* BIG LWA L'wazi: deterministic instant math, no eval, no model, no network. */
(function(root){'use strict';
  const LIMIT=160,MAX_ABS=1e14;
  const format=x=>{
    if(!Number.isFinite(x))return 'Undefined';
    if(Math.abs(x)<1e-12)x=0;
    if(Number.isInteger(x)&&Math.abs(x)<1e12)return x.toLocaleString('en-US');
    return Number(x.toPrecision(11)).toLocaleString('en-US',{maximumFractionDigits:11});
  };
  function normalize(query){
    let s=String(query||'').trim().slice(0,LIMIT).toLowerCase()
      .replace(/[−–]/g,'-').replace(/[×·]/g,'*').replace(/÷/g,'/').replace(/[π]/g,'pi');
    s=s.replace(/^(?:what(?:'s| is)|calculate|compute|evaluate|solve(?: for x)?|find the value of|how much is|how many is)\s*:?\s*/,'');
    s=s.replace(/[?=]\s*$/g,m=>m==='?'?'':m).trim();
    s=s.replace(/(\d+(?:\.\d+)?)\s*%\s+of\s+/g,'$1%*');
    return s;
  }
  function tokenize(text){
    const parts=[];let i=0;
    while(i<text.length){
      if(/\s/.test(text[i])){i++;continue}
      const m=text.slice(i).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|^[a-z]+|^[()+*/^%!\-=]/i);
      if(!m)return null;
      const t=m[0];i+=t.length;
      if(parts.length>65)return null;
      parts.push(/^(?:\d|\.)/.test(t)?{type:'num',value:Number(t)}:{type:t});
    }
    return parts;
  }
  function evaluate(expr,x){
    const input=tokenize(expr);if(!input||!input.length)return null;
    let pos=0;
    const peek=()=>input[pos]?.type;
    const accept=t=>{if(peek()===t){pos++;return true}return false};
    const parsePrimary=()=>{
      const t=input[pos];if(!t)throw Error('incomplete');
      if(accept('+'))return parsePrimary();
      if(accept('-'))return -parsePrimary();
      if(accept('(')){
        const v=parseSum();if(!accept(')'))throw Error('closing parenthesis');return v;
      }
      if(t.type==='num'){pos++;return t.value}
      if(t.type==='pi'){pos++;return Math.PI}
      if(t.type==='e'){pos++;return Math.E}
      if(t.type==='x'){pos++;if(x===null)throw Error('variable');return x}
      const funcs={sqrt:Math.sqrt,abs:Math.abs,sin:Math.sin,cos:Math.cos,tan:Math.tan,ln:Math.log,log:Math.log10};
      if(funcs[t.type]){
        pos++;if(!accept('('))throw Error('function parentheses');
        const value=parseSum();if(!accept(')'))throw Error('function closing');
        return funcs[t.type](value);
      }
      throw Error('unsupported');
    };
    const parsePostfix=()=>{
      let a=parsePrimary();
      while(peek()==='%'||peek()==='!'){
        if(accept('%'))a/=100;
        else{accept('!');if(!Number.isInteger(a)||a<0||a>170)throw Error('factorial');
          let v=1;for(let i=2;i<=a;i++)v*=i;a=v;
        }
      }
      return a;
    };
    const parsePower=()=>{let a=parsePostfix();if(accept('^'))a=Math.pow(a,parsePower());return a};
    const parseProduct=()=>{
      let a=parsePower();
      while(true){
        if(accept('*'))a*=parsePower();
        else if(accept('/')){const b=parsePower();a/=b}
        else if(['(','x','pi','e','sqrt','abs','sin','cos','tan','ln','log','num'].includes(peek()))a*=parsePower();
        else break;
      }
      return a;
    };
    const parseSum=()=>{
      let a=parseProduct();
      while(true){if(accept('+'))a+=parseProduct();else if(accept('-'))a-=parseProduct();else break}
      return a;
    };
    try{
      const answer=parseSum();
      if(pos!==input.length||!Number.isFinite(answer)||Math.abs(answer)>MAX_ABS)return null;
      return answer;
    }catch{return null}
  }
  function solve(raw){
    const normalized=normalize(raw);
    if(!normalized||normalized.length>LIMIT)return null;
    const expression=normalized.replace(/\s+/g,'');
    // A math query must have an equation or operator; don't interpret an
    // ordinary sentence, URL, currency name, or arbitrary identifier as math.
    if(!/[+\-*/^%=!]/.test(expression)&&!/(?:sqrt|sin|cos|tan|ln|log|abs)\(/.test(expression))return null;
    if(/[^0-9a-z.+\-*/^%=!()]/.test(expression))return null;
    const sides=expression.split('=');
    if(sides.length>2||sides.some(v=>!v))return null;
    if(sides.length===2&&expression.includes('x')){
      const f=x=>{
        const l=evaluate(sides[0],x),r=evaluate(sides[1],x);
        return l===null||r===null?null:l-r;
      };
      const a=f(0),atOne=f(1),atTwo=f(2);
      if(a===null||atOne===null||atTwo===null)return null;
      const slope=atOne-a;
      // No guessing roots of nonlinear equations.
      if(Math.abs((atTwo-atOne)-slope)>1e-7*Math.max(1,Math.abs(slope)))return null;
      if(Math.abs(slope)<1e-12)return {expression:raw,result:Math.abs(a)<1e-12?'Infinitely many solutions':'No solution',detail:'Linear equation'};
      const answer=-a/slope;
      if(!Number.isFinite(answer)||Math.abs(answer)>MAX_ABS||Math.abs(f(answer))>1e-6*Math.max(1,Math.abs(a)))return null;
      return {expression:raw,result:'x = '+format(answer),detail:'Solved for x',value:answer};
    }
    if(expression.includes('x'))return null;
    const n=evaluate(sides[0],null);
    if(n===null)return null;
    if(sides.length===2){const rhs=evaluate(sides[1],null);
      if(rhs===null)return null;
      return {expression:raw,result:Math.abs(n-rhs)<1e-10?'True':'False',detail:format(n)+' = '+format(rhs)};
    }
    return {expression:raw,result:format(n),detail:'Instant calculation · on your device',value:n};
  }
  root.BigLWAMath={solve};
})(typeof window!=='undefined'?window:globalThis);
