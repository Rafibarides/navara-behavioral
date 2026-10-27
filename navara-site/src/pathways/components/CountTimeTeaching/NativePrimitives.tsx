import React,{useId} from 'react';
export const FileCard=({children})=><div className="ct-teaching">{children}</div>;
export const Header=({title,fact,intro})=><header><h2>{title}</h2><p className="eyebrow">{fact}</p><p>{intro}</p></header>;
export const Paragraph=({children})=><p>{children}</p>;
export const Group=({label,children})=><section className="ct-group"><h3>{label}</h3>{children}</section>;
export const Callout=({title,children})=><aside className="ct-callout" aria-live="polite"><h4>{title}</h4>{children}</aside>;
export const Closing=({children})=><p className="ct-closing">{children}</p>;
export const FileButton=({variant,children,...props})=><button type="button" className={'btn '+(variant==='secondary'?'btn-ghost':'btn-navy')} {...props}>{children}</button>;
export function ChoiceRow({label,value,onChange,options}){return <fieldset className="ct-choice"><legend>{label}</legend><div>{options.map(o=><button type="button" key={o.value} aria-pressed={value===o.value} className={'btn '+(value===o.value?'btn-navy':'btn-ghost')} onClick={()=>onChange(o.value)}>{o.label}</button>)}</div></fieldset>}
export function Slider({label,min,max,value,onChange,describe}){const id=useId();return <div className="ct-slider"><label htmlFor={id}>{label}: {describe(value)}</label><input id={id} type="range" min={min} max={max} step="1" value={value} aria-valuetext={describe(value)} onChange={e=>onChange(Number(e.target.value))}/></div>}
export const Facts=({items})=><dl className="ct-facts">{items.map(x=><div key={x.label}><dt>{x.label}</dt><dd>{x.value}</dd></div>)}</dl>;
export const Link=({to,children})=><a href={to}>{children}</a>;
