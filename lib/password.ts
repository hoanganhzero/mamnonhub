const enc=new TextEncoder();
const hex=(b:ArrayBuffer)=>Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,"0")).join("");
export function makeSalt(){return hex(crypto.getRandomValues(new Uint8Array(16)).buffer)}
export async function hashPassword(password:string,salt:string){const key=await crypto.subtle.importKey("raw",enc.encode(password),"PBKDF2",false,["deriveBits"]);return "v2$"+hex(await crypto.subtle.deriveBits({name:"PBKDF2",salt:enc.encode(salt),iterations:30000,hash:"SHA-256"},key,256))}
export async function verifyPassword(password:string,salt:string,stored:string){if(!stored.startsWith("v2$"))return false;return await hashPassword(password,salt)===stored}
export function makeToken(){return hex(crypto.getRandomValues(new Uint8Array(32)).buffer)}
