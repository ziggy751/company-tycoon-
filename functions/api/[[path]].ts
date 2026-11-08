import {api,type Env} from '../../worker/index';
// Cloudflare Pages Functions run on Workers and use the same D1/auth code.
export function onRequest(context:{request:Request;env:Env}){return api(context.request,context.env);}
