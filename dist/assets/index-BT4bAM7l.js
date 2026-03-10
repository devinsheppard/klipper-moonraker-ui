(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))i(r);new MutationObserver(r=>{for(const s of r)if(s.type==="childList")for(const o of s.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&i(o)}).observe(document,{childList:!0,subtree:!0});function t(r){const s={};return r.integrity&&(s.integrity=r.integrity),r.referrerPolicy&&(s.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?s.credentials="include":r.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(r){if(r.ep)return;r.ep=!0;const s=t(r);fetch(r.href,s)}})();const vh=["debug","info","warn","error"],Pl={debug:10,info:20,warn:30,error:40},Sh="ui_log_level";function gu(n){if(!n)return null;const e=String(n).trim().toLowerCase();return vh.includes(e)?e:null}function Eh(){if(typeof window>"u")return null;const n=new URLSearchParams(window.location.search||"");return gu(n.get("log"))}function Mh(){if(typeof window>"u"||!window.localStorage)return null;try{return gu(window.localStorage.getItem(Sh))}catch{return null}}let Th=Eh()||Mh()||"info";function Ch(n){return Pl[n]>=Pl[Th]}function ps(n,e,t,i){if(!Ch(n))return;const s=console[n==="debug"?"debug":n==="info"?"info":n==="warn"?"warn":"error"]||console.log,o=`[${e}] [${n.toUpperCase()}] ${t}`;if(typeof i>"u"){s(o);return}s(o,i)}function xu(n){return{debug(e,t){ps("debug",n,e,t)},info(e,t){ps("info",n,e,t)},warn(e,t){ps("warn",n,e,t)},error(e,t){ps("error",n,e,t)}}}const wh="2.0",Ah=xu("moonraker");function Sn(n){return String(n||"").replace(/^\/+/,"").split("/").filter(Boolean)}function Oa(n){return Sn(n).map(e=>encodeURIComponent(e)).join("/")}function Lh(n){const e=Sn(n);if(!e.length)return{directory:"",filename:""};const t=e[e.length-1];return{directory:e.slice(0,-1).join("/"),filename:t}}class Rh{constructor(e){this.baseUrl=e.replace(/\/$/,""),this.ws=null,this.requestId=0,this.wsCallbacks=new Set,this.stateCallbacks=new Set}onMessage(e){return this.wsCallbacks.add(e),()=>this.wsCallbacks.delete(e)}onConnectionState(e){return this.stateCallbacks.add(e),()=>this.stateCallbacks.delete(e)}setConnectionState(e){this.stateCallbacks.forEach(t=>t(e))}async rpc(e,t={}){const i=await fetch(`${this.baseUrl}/printer/${e}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...t})});if(!i.ok)throw new Error(`Moonraker call failed: ${e}`);return i.json()}async call(e,t={}){const i=await fetch(`${this.baseUrl}${e}`,t);if(!i.ok){const s=await i.text().catch(()=>""),o=s?`: ${s.slice(0,200)}`:"",c=new Error(`Moonraker call failed (${i.status}): ${e}${o}`);throw c.status=i.status,c}if(i.status===204)return null;const r=await i.text();if(!r)return null;try{return JSON.parse(r)}catch{return r}}connectWebSocket(){const e=this.baseUrl.replace("http://","ws://").replace("https://","wss://")+"/websocket";this.ws=new WebSocket(e),this.ws.addEventListener("open",()=>{this.setConnectionState("connected"),this.send({method:"printer.objects.subscribe",params:{objects:{print_stats:null,virtual_sdcard:null,gcode_move:null,motion_report:null,extruder:null,heater_bed:null,toolhead:null}}})}),this.ws.addEventListener("close",()=>this.setConnectionState("disconnected")),this.ws.addEventListener("error",()=>this.setConnectionState("error")),this.ws.addEventListener("message",t=>{try{const i=JSON.parse(t.data);this.wsCallbacks.forEach(r=>r(i))}catch(i){Ah.error("Invalid websocket payload",i)}})}send({method:e,params:t={}}){!this.ws||this.ws.readyState!==WebSocket.OPEN||this.ws.send(JSON.stringify({jsonrpc:wh,method:e,params:t,id:++this.requestId}))}async runGcode(e){return this.call("/printer/gcode/script",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({script:e})})}async getMacros(){return this.call("/printer/objects/query?configfile")}async getFiles(){return this.call("/server/files/list")}async getFilesByRoot(e){const t=String(e||"").trim();if(!t)throw new Error("A file root is required.");return this.call(`/server/files/list?root=${encodeURIComponent(t)}`)}async getConfigFiles(){return this.getFilesByRoot("config")}async getLogFiles(){return this.getFilesByRoot("logs")}async getGcodeFiles(){return this.getFilesByRoot("gcodes")}async getFileMetadata(e){const t=Sn(e).join("/");if(!t)throw new Error("A file path is required.");return this.call(`/server/files/metadata?filename=${encodeURIComponent(t)}`)}async startPrint(e){const t=Sn(e).join("/");if(!t)throw new Error("A print file path is required.");const i=[{path:"/printer/print/start",method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filename:t})},{path:`/printer/print/start?filename=${encodeURIComponent(t)}`,method:"POST"}];let r=null;for(const s of i)try{if((await fetch(`${this.baseUrl}${s.path}`,{method:s.method,headers:s.headers,body:s.body})).ok)return!0;r=new Error(`Moonraker call failed: ${s.method} ${s.path}`)}catch(o){r=o}try{return await this.runGcode(`SDCARD_PRINT_FILE FILENAME="${t.replace(/\"/g,'\\"')}"`),!0}catch(s){r=s}throw r instanceof Error?r:new Error(`Failed to start print: ${t}`)}async pausePrint(){try{return await this.call("/printer/print/pause",{method:"POST"}),!0}catch{return await this.runGcode("PAUSE"),!0}}async resumePrint(){try{return await this.call("/printer/print/resume",{method:"POST"}),!0}catch{return await this.runGcode("RESUME"),!0}}async cancelPrint(){try{return await this.call("/printer/print/cancel",{method:"POST"}),!0}catch{return await this.runGcode("CANCEL_PRINT"),!0}}async getServerInfo(){return this.call("/server/info")}async getMachineSystemInfo(){return this.call("/machine/system_info")}async getMachineProcStats(){return this.call("/machine/proc_stats")}async getMcuAndSystemStats(){return this.call("/printer/objects/query?mcu&system_stats")}async getEndstopsStatus(){return this.call("/printer/query_endstops/status")}async getMachineUpdateStatus(){return this.call("/machine/update/status")}async refreshMachineUpdates(e=null){const t=e?{name:String(e).trim()}:{};return this.call("/machine/update/refresh",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)})}async upgradeMachineUpdates(e=null){const t=e?{name:String(e).trim()}:{};try{return await this.call("/machine/update/upgrade",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)})}catch(i){const r=Number(i?.status);if(!Number.isFinite(r)||![404,405,501].includes(r))throw i;const s=String(e||"").trim().toLowerCase();return s?s==="system"||s==="moonraker"||s==="klipper"?this.call(`/machine/update/${s}`,{method:"POST"}):this.call("/machine/update/client",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:s})}):this.call("/machine/update/full",{method:"POST"})}}async recoverMachineUpdater(e,{hard:t=!1}={}){const i=String(e||"").trim();if(!i)throw new Error("An updater name is required for recover.");return this.call("/machine/update/recover",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:i,hard:!!t})})}async rollbackMachineUpdater(e){const t=String(e||"").trim();if(!t)throw new Error("An updater name is required for rollback.");return this.call("/machine/update/rollback",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:t})})}async getFileText(e,t){const i=String(e||"").trim(),r=Oa(t);if(!i||!r)throw new Error("A file root and path are required.");const s=await fetch(`${this.baseUrl}/server/files/${encodeURIComponent(i)}/${r}`,{cache:"no-store"});if(!s.ok)throw new Error(`Moonraker call failed: /server/files/${i}/${r}`);return s.text()}async getFileBlob(e,t){const i=String(e||"").trim(),r=Oa(t);if(!i||!r)throw new Error("A file root and path are required.");const s=await fetch(`${this.baseUrl}/server/files/${encodeURIComponent(i)}/${r}`,{cache:"no-store"});if(!s.ok)throw new Error(`Moonraker call failed: /server/files/${i}/${r}`);return s.blob()}async getConfigFileText(e){return this.getFileText("config",e)}async uploadFile(e,t,i="",r=""){const s=new FormData;s.append("root",e);const o=Sn(i).join("/");o&&s.append("path",o);const c=r||t?.name||"upload.txt";return s.append("file",t,c),this.call("/server/files/upload",{method:"POST",body:s})}async createDirectory(e,t){const i=String(e||"").trim(),r=Sn(t).join("/");if(!i||!r)throw new Error("A file root and directory path are required.");const s=`${i}/${r}`,o=[{path:`/server/files/directory?path=${encodeURIComponent(s)}`,method:"POST"},{path:"/server/files/directory",method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:s})},{path:`/server/files/mkdir?path=${encodeURIComponent(s)}`,method:"POST"},{path:"/server/files/mkdir",method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:s})}];let c=null;for(const l of o)try{if((await fetch(`${this.baseUrl}${l.path}`,{method:l.method,headers:l.headers,body:l.body})).ok)return!0;c=new Error(`Moonraker call failed: ${l.method} ${l.path}`)}catch(d){c=d}throw c instanceof Error?c:new Error(`Failed to create directory: ${s}`)}async moveFile(e,t,i){const r=String(e||"").trim(),s=Sn(t).join("/"),o=Sn(i).join("/");if(!r||!s||!o)throw new Error("A file root, source path, and destination path are required.");const c=`${r}/${s}`,l=`${r}/${o}`,d=[{path:"/server/files/move",method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({source:c,dest:l})},{path:"/server/files/move",method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({source:s,dest:o,root:r})},{path:"/server/files/move",method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({src:c,dst:l})},{path:`/server/files/move?source=${encodeURIComponent(c)}&dest=${encodeURIComponent(l)}`,method:"POST"},{path:`/server/files/move?source=${encodeURIComponent(s)}&dest=${encodeURIComponent(o)}&root=${encodeURIComponent(r)}`,method:"POST"}];let f=null;for(const p of d)try{if((await fetch(`${this.baseUrl}${p.path}`,{method:p.method,headers:p.headers,body:p.body})).ok)return!0;f=new Error(`Moonraker call failed: ${p.method} ${p.path}`)}catch(h){f=h}throw f instanceof Error?f:new Error(`Failed to move path: ${c} -> ${l}`)}async deleteDirectory(e,t,{force:i=!0}={}){const r=String(e||"").trim(),s=Sn(t).join("/");if(!r||!s)throw new Error("A file root and directory path are required.");const o=`${r}/${s}`,c=i?"&force=true":"",l=[{path:`/server/files/directory?path=${encodeURIComponent(o)}${c}`,method:"DELETE"},{path:`/server/files/delete_directory?path=${encodeURIComponent(o)}${c}`,method:"DELETE"},{path:`/server/files/delete_directory?path=${encodeURIComponent(o)}${c}`,method:"POST"},{path:"/server/files/delete_directory",method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:o,force:!!i})},{path:"/server/files/directory",method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:o,force:!!i})},{path:"/server/files/directory",method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:o,action:"delete",force:!!i})}];let d=null;for(const f of l)try{if((await fetch(`${this.baseUrl}${f.path}`,{method:f.method,headers:f.headers,body:f.body})).ok)return!0;d=new Error(`Moonraker call failed: ${f.method} ${f.path}`)}catch(p){d=p}throw d instanceof Error?d:new Error(`Failed to delete directory: ${o}`)}async saveConfigFileText(e,t){const{directory:i,filename:r}=Lh(e);if(!r)throw new Error("A config file path is required.");const s=new Blob([t??""],{type:"text/plain"});return this.uploadFile("config",s,i.length?i:"",r)}async deleteFile(e,t){const i=String(e||"").trim(),r=Sn(t).join("/");if(!i||!r)throw new Error("A file root and path are required.");const s=Oa(r),o=`${i}/${r}`,c=[{path:`/server/files/${encodeURIComponent(i)}/${s}`,method:"DELETE"},{path:`/server/files/${encodeURIComponent(i)}/${s}`,method:"POST"},{path:`/server/files/delete_file?path=${encodeURIComponent(r)}`,method:"DELETE"},{path:`/server/files/delete_file?path=${encodeURIComponent(o)}`,method:"DELETE"},{path:`/server/files/delete?path=${encodeURIComponent(r)}`,method:"DELETE"},{path:`/server/files/delete?path=${encodeURIComponent(o)}`,method:"DELETE"},{path:`/server/files/delete_file?path=${encodeURIComponent(r)}`,method:"POST"},{path:`/server/files/delete_file?path=${encodeURIComponent(o)}`,method:"POST"},{path:`/server/files/delete?path=${encodeURIComponent(r)}`,method:"POST"},{path:`/server/files/delete?path=${encodeURIComponent(o)}`,method:"POST"}];let l=null;for(const d of c)try{if((await fetch(`${this.baseUrl}${d.path}`,{method:d.method})).ok)return!0;l=new Error(`Moonraker call failed: ${d.method} ${d.path}`)}catch(f){l=f}throw l instanceof Error?l:new Error(`Failed to delete file: ${i}/${r}`)}async deleteConfigFile(e){return this.deleteFile("config",e)}async deleteLogFile(e){return this.deleteFile("logs",e)}}const Nc="181",ar={ROTATE:0,DOLLY:1,PAN:2},nr={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},Ph=0,Il=1,Ih=2,_u=1,Dh=2,Bn=3,ai=0,Xt=1,Mn=2,Vn=0,or=1,Dl=2,Fl=3,Nl=4,Fh=5,yi=100,Nh=101,Uh=102,Oh=103,Bh=104,Gh=200,kh=201,zh=202,Vh=203,Lo=204,Ro=205,Hh=206,Wh=207,jh=208,$h=209,Xh=210,qh=211,Yh=212,Kh=213,Jh=214,Po=0,Io=1,Do=2,ur=3,Fo=4,No=5,Uo=6,Oo=7,bu=0,Zh=1,Qh=2,ri=0,ep=1,tp=2,np=3,ip=4,rp=5,sp=6,ap=7,yu=300,fr=301,hr=302,Bo=303,Go=304,Ea=306,ko=1e3,kn=1001,zo=1002,en=1003,op=1004,ms=1005,cn=1006,Ba=1007,Si=1008,Ln=1009,vu=1010,Su=1011,Kr=1012,Uc=1013,Ci=1014,zn=1015,br=1016,Oc=1017,Bc=1018,Jr=1020,Eu=35902,Mu=35899,Tu=1021,Cu=1022,xn=1023,Zr=1026,Qr=1027,wu=1028,Gc=1029,kc=1030,zc=1031,Vc=1033,Xs=33776,qs=33777,Ys=33778,Ks=33779,Vo=35840,Ho=35841,Wo=35842,jo=35843,$o=36196,Xo=37492,qo=37496,Yo=37808,Ko=37809,Jo=37810,Zo=37811,Qo=37812,ec=37813,tc=37814,nc=37815,ic=37816,rc=37817,sc=37818,ac=37819,oc=37820,cc=37821,lc=36492,dc=36494,uc=36495,fc=36283,hc=36284,pc=36285,mc=36286,cp=3200,lp=3201,Au=0,dp=1,ti="",sn="srgb",pr="srgb-linear",fa="linear",at="srgb",Bi=7680,Ul=519,up=512,fp=513,hp=514,Lu=515,pp=516,mp=517,gp=518,xp=519,Ol=35044,Bl="300 es",Cn=2e3,ha=2001;function Ru(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function pa(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function _p(){const n=pa("canvas");return n.style.display="block",n}const Gl={};function kl(...n){const e="THREE."+n.shift();console.log(e,...n)}function Fe(...n){const e="THREE."+n.shift();console.warn(e,...n)}function Mt(...n){const e="THREE."+n.shift();console.error(e,...n)}function es(...n){const e=n.join(" ");e in Gl||(Gl[e]=!0,Fe(...n))}function bp(n,e,t){return new Promise(function(i,r){function s(){switch(n.clientWaitSync(e,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:r();break;case n.TIMEOUT_EXPIRED:setTimeout(s,t);break;default:i()}}setTimeout(s,t)})}class Ii{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){const i=this._listeners;return i===void 0?!1:i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){const i=this._listeners;if(i===void 0)return;const r=i[e];if(r!==void 0){const s=r.indexOf(t);s!==-1&&r.splice(s,1)}}dispatchEvent(e){const t=this._listeners;if(t===void 0)return;const i=t[e.type];if(i!==void 0){e.target=this;const r=i.slice(0);for(let s=0,o=r.length;s<o;s++)r[s].call(this,e);e.target=null}}}const Nt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Js=Math.PI/180,gc=180/Math.PI;function ss(){const n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Nt[n&255]+Nt[n>>8&255]+Nt[n>>16&255]+Nt[n>>24&255]+"-"+Nt[e&255]+Nt[e>>8&255]+"-"+Nt[e>>16&15|64]+Nt[e>>24&255]+"-"+Nt[t&63|128]+Nt[t>>8&255]+"-"+Nt[t>>16&255]+Nt[t>>24&255]+Nt[i&255]+Nt[i>>8&255]+Nt[i>>16&255]+Nt[i>>24&255]).toLowerCase()}function We(n,e,t){return Math.max(e,Math.min(t,n))}function yp(n,e){return(n%e+e)%e}function Ga(n,e,t){return(1-t)*n+t*e}function Lr(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("Invalid component type.")}}function jt(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("Invalid component type.")}}const vp={DEG2RAD:Js};class Oe{constructor(e=0,t=0){Oe.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,i=this.y,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6],this.y=r[1]*t+r[4]*i+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=We(this.x,e.x,t.x),this.y=We(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=We(this.x,e,t),this.y=We(this.y,e,t),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(We(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const i=this.dot(e)/t;return Math.acos(We(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const i=Math.cos(t),r=Math.sin(t),s=this.x-e.x,o=this.y-e.y;return this.x=s*i-o*r+e.x,this.y=s*r+o*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class wi{constructor(e=0,t=0,i=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=r}static slerpFlat(e,t,i,r,s,o,c){let l=i[r+0],d=i[r+1],f=i[r+2],p=i[r+3],h=s[o+0],m=s[o+1],_=s[o+2],b=s[o+3];if(c<=0){e[t+0]=l,e[t+1]=d,e[t+2]=f,e[t+3]=p;return}if(c>=1){e[t+0]=h,e[t+1]=m,e[t+2]=_,e[t+3]=b;return}if(p!==b||l!==h||d!==m||f!==_){let x=l*h+d*m+f*_+p*b;x<0&&(h=-h,m=-m,_=-_,b=-b,x=-x);let g=1-c;if(x<.9995){const w=Math.acos(x),T=Math.sin(w);g=Math.sin(g*w)/T,c=Math.sin(c*w)/T,l=l*g+h*c,d=d*g+m*c,f=f*g+_*c,p=p*g+b*c}else{l=l*g+h*c,d=d*g+m*c,f=f*g+_*c,p=p*g+b*c;const w=1/Math.sqrt(l*l+d*d+f*f+p*p);l*=w,d*=w,f*=w,p*=w}}e[t]=l,e[t+1]=d,e[t+2]=f,e[t+3]=p}static multiplyQuaternionsFlat(e,t,i,r,s,o){const c=i[r],l=i[r+1],d=i[r+2],f=i[r+3],p=s[o],h=s[o+1],m=s[o+2],_=s[o+3];return e[t]=c*_+f*p+l*m-d*h,e[t+1]=l*_+f*h+d*p-c*m,e[t+2]=d*_+f*m+c*h-l*p,e[t+3]=f*_-c*p-l*h-d*m,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,r){return this._x=e,this._y=t,this._z=i,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const i=e._x,r=e._y,s=e._z,o=e._order,c=Math.cos,l=Math.sin,d=c(i/2),f=c(r/2),p=c(s/2),h=l(i/2),m=l(r/2),_=l(s/2);switch(o){case"XYZ":this._x=h*f*p+d*m*_,this._y=d*m*p-h*f*_,this._z=d*f*_+h*m*p,this._w=d*f*p-h*m*_;break;case"YXZ":this._x=h*f*p+d*m*_,this._y=d*m*p-h*f*_,this._z=d*f*_-h*m*p,this._w=d*f*p+h*m*_;break;case"ZXY":this._x=h*f*p-d*m*_,this._y=d*m*p+h*f*_,this._z=d*f*_+h*m*p,this._w=d*f*p-h*m*_;break;case"ZYX":this._x=h*f*p-d*m*_,this._y=d*m*p+h*f*_,this._z=d*f*_-h*m*p,this._w=d*f*p+h*m*_;break;case"YZX":this._x=h*f*p+d*m*_,this._y=d*m*p+h*f*_,this._z=d*f*_-h*m*p,this._w=d*f*p-h*m*_;break;case"XZY":this._x=h*f*p-d*m*_,this._y=d*m*p-h*f*_,this._z=d*f*_+h*m*p,this._w=d*f*p+h*m*_;break;default:Fe("Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const i=t/2,r=Math.sin(i);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,i=t[0],r=t[4],s=t[8],o=t[1],c=t[5],l=t[9],d=t[2],f=t[6],p=t[10],h=i+c+p;if(h>0){const m=.5/Math.sqrt(h+1);this._w=.25/m,this._x=(f-l)*m,this._y=(s-d)*m,this._z=(o-r)*m}else if(i>c&&i>p){const m=2*Math.sqrt(1+i-c-p);this._w=(f-l)/m,this._x=.25*m,this._y=(r+o)/m,this._z=(s+d)/m}else if(c>p){const m=2*Math.sqrt(1+c-i-p);this._w=(s-d)/m,this._x=(r+o)/m,this._y=.25*m,this._z=(l+f)/m}else{const m=2*Math.sqrt(1+p-i-c);this._w=(o-r)/m,this._x=(s+d)/m,this._y=(l+f)/m,this._z=.25*m}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<1e-8?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(We(this.dot(e),-1,1)))}rotateTowards(e,t){const i=this.angleTo(e);if(i===0)return this;const r=Math.min(1,t/i);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const i=e._x,r=e._y,s=e._z,o=e._w,c=t._x,l=t._y,d=t._z,f=t._w;return this._x=i*f+o*c+r*d-s*l,this._y=r*f+o*l+s*c-i*d,this._z=s*f+o*d+i*l-r*c,this._w=o*f-i*c-r*l-s*d,this._onChangeCallback(),this}slerp(e,t){if(t<=0)return this;if(t>=1)return this.copy(e);let i=e._x,r=e._y,s=e._z,o=e._w,c=this.dot(e);c<0&&(i=-i,r=-r,s=-s,o=-o,c=-c);let l=1-t;if(c<.9995){const d=Math.acos(c),f=Math.sin(d);l=Math.sin(l*d)/f,t=Math.sin(t*d)/f,this._x=this._x*l+i*t,this._y=this._y*l+r*t,this._z=this._z*l+s*t,this._w=this._w*l+o*t,this._onChangeCallback()}else this._x=this._x*l+i*t,this._y=this._y*l+r*t,this._z=this._z*l+s*t,this._w=this._w*l+o*t,this.normalize();return this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){const e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),r=Math.sqrt(1-i),s=Math.sqrt(i);return this.set(r*Math.sin(e),r*Math.cos(e),s*Math.sin(t),s*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class k{constructor(e=0,t=0,i=0){k.prototype.isVector3=!0,this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(zl.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(zl.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[3]*i+s[6]*r,this.y=s[1]*t+s[4]*i+s[7]*r,this.z=s[2]*t+s[5]*i+s[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,i=this.y,r=this.z,s=e.elements,o=1/(s[3]*t+s[7]*i+s[11]*r+s[15]);return this.x=(s[0]*t+s[4]*i+s[8]*r+s[12])*o,this.y=(s[1]*t+s[5]*i+s[9]*r+s[13])*o,this.z=(s[2]*t+s[6]*i+s[10]*r+s[14])*o,this}applyQuaternion(e){const t=this.x,i=this.y,r=this.z,s=e.x,o=e.y,c=e.z,l=e.w,d=2*(o*r-c*i),f=2*(c*t-s*r),p=2*(s*i-o*t);return this.x=t+l*d+o*p-c*f,this.y=i+l*f+c*d-s*p,this.z=r+l*p+s*f-o*d,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[4]*i+s[8]*r,this.y=s[1]*t+s[5]*i+s[9]*r,this.z=s[2]*t+s[6]*i+s[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=We(this.x,e.x,t.x),this.y=We(this.y,e.y,t.y),this.z=We(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=We(this.x,e,t),this.y=We(this.y,e,t),this.z=We(this.z,e,t),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(We(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const i=e.x,r=e.y,s=e.z,o=t.x,c=t.y,l=t.z;return this.x=r*l-s*c,this.y=s*o-i*l,this.z=i*c-r*o,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return ka.copy(this).projectOnVector(e),this.sub(ka)}reflect(e){return this.sub(ka.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const i=this.dot(e)/t;return Math.acos(We(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,i=this.y-e.y,r=this.z-e.z;return t*t+i*i+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){const r=Math.sin(t)*e;return this.x=r*Math.sin(i),this.y=Math.cos(t)*e,this.z=r*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const ka=new k,zl=new wi;class Ge{constructor(e,t,i,r,s,o,c,l,d){Ge.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,r,s,o,c,l,d)}set(e,t,i,r,s,o,c,l,d){const f=this.elements;return f[0]=e,f[1]=r,f[2]=c,f[3]=t,f[4]=s,f[5]=l,f[6]=i,f[7]=o,f[8]=d,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const i=e.elements,r=t.elements,s=this.elements,o=i[0],c=i[3],l=i[6],d=i[1],f=i[4],p=i[7],h=i[2],m=i[5],_=i[8],b=r[0],x=r[3],g=r[6],w=r[1],T=r[4],L=r[7],R=r[2],M=r[5],A=r[8];return s[0]=o*b+c*w+l*R,s[3]=o*x+c*T+l*M,s[6]=o*g+c*L+l*A,s[1]=d*b+f*w+p*R,s[4]=d*x+f*T+p*M,s[7]=d*g+f*L+p*A,s[2]=h*b+m*w+_*R,s[5]=h*x+m*T+_*M,s[8]=h*g+m*L+_*A,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],o=e[4],c=e[5],l=e[6],d=e[7],f=e[8];return t*o*f-t*c*d-i*s*f+i*c*l+r*s*d-r*o*l}invert(){const e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],o=e[4],c=e[5],l=e[6],d=e[7],f=e[8],p=f*o-c*d,h=c*l-f*s,m=d*s-o*l,_=t*p+i*h+r*m;if(_===0)return this.set(0,0,0,0,0,0,0,0,0);const b=1/_;return e[0]=p*b,e[1]=(r*d-f*i)*b,e[2]=(c*i-r*o)*b,e[3]=h*b,e[4]=(f*t-r*l)*b,e[5]=(r*s-c*t)*b,e[6]=m*b,e[7]=(i*l-d*t)*b,e[8]=(o*t-i*s)*b,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,r,s,o,c){const l=Math.cos(s),d=Math.sin(s);return this.set(i*l,i*d,-i*(l*o+d*c)+o+e,-r*d,r*l,-r*(-d*o+l*c)+c+t,0,0,1),this}scale(e,t){return this.premultiply(za.makeScale(e,t)),this}rotate(e){return this.premultiply(za.makeRotation(-e)),this}translate(e,t){return this.premultiply(za.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,i=e.elements;for(let r=0;r<9;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){const i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}}const za=new Ge,Vl=new Ge().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Hl=new Ge().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Sp(){const n={enabled:!0,workingColorSpace:pr,spaces:{},convert:function(r,s,o){return this.enabled===!1||s===o||!s||!o||(this.spaces[s].transfer===at&&(r.r=Hn(r.r),r.g=Hn(r.g),r.b=Hn(r.b)),this.spaces[s].primaries!==this.spaces[o].primaries&&(r.applyMatrix3(this.spaces[s].toXYZ),r.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===at&&(r.r=cr(r.r),r.g=cr(r.g),r.b=cr(r.b))),r},workingToColorSpace:function(r,s){return this.convert(r,this.workingColorSpace,s)},colorSpaceToWorking:function(r,s){return this.convert(r,s,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===ti?fa:this.spaces[r].transfer},getToneMappingMode:function(r){return this.spaces[r].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(r,s=this.workingColorSpace){return r.fromArray(this.spaces[s].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,s,o){return r.copy(this.spaces[s].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(r,s){return es("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),n.workingToColorSpace(r,s)},toWorkingColorSpace:function(r,s){return es("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),n.colorSpaceToWorking(r,s)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],i=[.3127,.329];return n.define({[pr]:{primaries:e,whitePoint:i,transfer:fa,toXYZ:Vl,fromXYZ:Hl,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:sn},outputColorSpaceConfig:{drawingBufferColorSpace:sn}},[sn]:{primaries:e,whitePoint:i,transfer:at,toXYZ:Vl,fromXYZ:Hl,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:sn}}}),n}const Qe=Sp();function Hn(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function cr(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}let Gi;class Ep{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let i;if(e instanceof HTMLCanvasElement)i=e;else{Gi===void 0&&(Gi=pa("canvas")),Gi.width=e.width,Gi.height=e.height;const r=Gi.getContext("2d");e instanceof ImageData?r.putImageData(e,0,0):r.drawImage(e,0,0,e.width,e.height),i=Gi}return i.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=pa("canvas");t.width=e.width,t.height=e.height;const i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);const r=i.getImageData(0,0,e.width,e.height),s=r.data;for(let o=0;o<s.length;o++)s[o]=Hn(s[o]/255)*255;return i.putImageData(r,0,0),t}else if(e.data){const t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(Hn(t[i]/255)*255):t[i]=Hn(t[i]);return{data:t,width:e.width,height:e.height}}else return Fe("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let Mp=0;class Hc{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Mp++}),this.uuid=ss(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){const t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):t instanceof VideoFrame?e.set(t.displayHeight,t.displayWidth,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const i={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let o=0,c=r.length;o<c;o++)r[o].isDataTexture?s.push(Va(r[o].image)):s.push(Va(r[o]))}else s=Va(r);i.url=s}return t||(e.images[this.uuid]=i),i}}function Va(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?Ep.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(Fe("Texture: Unable to serialize Texture."),{})}let Tp=0;const Ha=new k;class zt extends Ii{constructor(e=zt.DEFAULT_IMAGE,t=zt.DEFAULT_MAPPING,i=kn,r=kn,s=cn,o=Si,c=xn,l=Ln,d=zt.DEFAULT_ANISOTROPY,f=ti){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Tp++}),this.uuid=ss(),this.name="",this.source=new Hc(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=r,this.magFilter=s,this.minFilter=o,this.anisotropy=d,this.format=c,this.internalFormat=null,this.type=l,this.offset=new Oe(0,0),this.repeat=new Oe(1,1),this.center=new Oe(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ge,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=f,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0}get width(){return this.source.getSize(Ha).x}get height(){return this.source.getSize(Ha).y}get depth(){return this.source.getSize(Ha).z}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(const t in e){const i=e[t];if(i===void 0){Fe(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}const r=this[t];if(r===void 0){Fe(`Texture.setValues(): property '${t}' does not exist.`);continue}r&&i&&r.isVector2&&i.isVector2||r&&i&&r.isVector3&&i.isVector3||r&&i&&r.isMatrix3&&i.isMatrix3?r.copy(i):this[t]=i}}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==yu)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case ko:e.x=e.x-Math.floor(e.x);break;case kn:e.x=e.x<0?0:1;break;case zo:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case ko:e.y=e.y-Math.floor(e.y);break;case kn:e.y=e.y<0?0:1;break;case zo:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}zt.DEFAULT_IMAGE=null;zt.DEFAULT_MAPPING=yu;zt.DEFAULT_ANISOTROPY=1;class vt{constructor(e=0,t=0,i=0,r=1){vt.prototype.isVector4=!0,this.x=e,this.y=t,this.z=i,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,r){return this.x=e,this.y=t,this.z=i,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,i=this.y,r=this.z,s=this.w,o=e.elements;return this.x=o[0]*t+o[4]*i+o[8]*r+o[12]*s,this.y=o[1]*t+o[5]*i+o[9]*r+o[13]*s,this.z=o[2]*t+o[6]*i+o[10]*r+o[14]*s,this.w=o[3]*t+o[7]*i+o[11]*r+o[15]*s,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,r,s;const l=e.elements,d=l[0],f=l[4],p=l[8],h=l[1],m=l[5],_=l[9],b=l[2],x=l[6],g=l[10];if(Math.abs(f-h)<.01&&Math.abs(p-b)<.01&&Math.abs(_-x)<.01){if(Math.abs(f+h)<.1&&Math.abs(p+b)<.1&&Math.abs(_+x)<.1&&Math.abs(d+m+g-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const T=(d+1)/2,L=(m+1)/2,R=(g+1)/2,M=(f+h)/4,A=(p+b)/4,F=(_+x)/4;return T>L&&T>R?T<.01?(i=0,r=.707106781,s=.707106781):(i=Math.sqrt(T),r=M/i,s=A/i):L>R?L<.01?(i=.707106781,r=0,s=.707106781):(r=Math.sqrt(L),i=M/r,s=F/r):R<.01?(i=.707106781,r=.707106781,s=0):(s=Math.sqrt(R),i=A/s,r=F/s),this.set(i,r,s,t),this}let w=Math.sqrt((x-_)*(x-_)+(p-b)*(p-b)+(h-f)*(h-f));return Math.abs(w)<.001&&(w=1),this.x=(x-_)/w,this.y=(p-b)/w,this.z=(h-f)/w,this.w=Math.acos((d+m+g-1)/2),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=We(this.x,e.x,t.x),this.y=We(this.y,e.y,t.y),this.z=We(this.z,e.z,t.z),this.w=We(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=We(this.x,e,t),this.y=We(this.y,e,t),this.z=We(this.z,e,t),this.w=We(this.w,e,t),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(We(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Cp extends Ii{constructor(e=1,t=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:cn,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1},i),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=i.depth,this.scissor=new vt(0,0,e,t),this.scissorTest=!1,this.viewport=new vt(0,0,e,t);const r={width:e,height:t,depth:i.depth},s=new zt(r);this.textures=[];const o=i.count;for(let c=0;c<o;c++)this.textures[c]=s.clone(),this.textures[c].isRenderTargetTexture=!0,this.textures[c].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview}_setTextureOptions(e={}){const t={minFilter:cn,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let r=0,s=this.textures.length;r<s;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=i,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,i=e.textures.length;t<i;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;const r=Object.assign({},e.textures[t].image);this.textures[t].source=new Hc(r)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Ai extends Cp{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}}class Pu extends zt{constructor(e=null,t=1,i=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=en,this.minFilter=en,this.wrapR=kn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class wp extends zt{constructor(e=null,t=1,i=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=en,this.minFilter=en,this.wrapR=kn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class as{constructor(e=new k(1/0,1/0,1/0),t=new k(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(fn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(fn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const i=fn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const i=e.geometry;if(i!==void 0){const s=i.getAttribute("position");if(t===!0&&s!==void 0&&e.isInstancedMesh!==!0)for(let o=0,c=s.count;o<c;o++)e.isMesh===!0?e.getVertexPosition(o,fn):fn.fromBufferAttribute(s,o),fn.applyMatrix4(e.matrixWorld),this.expandByPoint(fn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),gs.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),gs.copy(i.boundingBox)),gs.applyMatrix4(e.matrixWorld),this.union(gs)}const r=e.children;for(let s=0,o=r.length;s<o;s++)this.expandByObject(r[s],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,fn),fn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Rr),xs.subVectors(this.max,Rr),ki.subVectors(e.a,Rr),zi.subVectors(e.b,Rr),Vi.subVectors(e.c,Rr),Xn.subVectors(zi,ki),qn.subVectors(Vi,zi),hi.subVectors(ki,Vi);let t=[0,-Xn.z,Xn.y,0,-qn.z,qn.y,0,-hi.z,hi.y,Xn.z,0,-Xn.x,qn.z,0,-qn.x,hi.z,0,-hi.x,-Xn.y,Xn.x,0,-qn.y,qn.x,0,-hi.y,hi.x,0];return!Wa(t,ki,zi,Vi,xs)||(t=[1,0,0,0,1,0,0,0,1],!Wa(t,ki,zi,Vi,xs))?!1:(_s.crossVectors(Xn,qn),t=[_s.x,_s.y,_s.z],Wa(t,ki,zi,Vi,xs))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,fn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(fn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(In[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),In[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),In[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),In[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),In[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),In[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),In[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),In[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(In),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}}const In=[new k,new k,new k,new k,new k,new k,new k,new k],fn=new k,gs=new as,ki=new k,zi=new k,Vi=new k,Xn=new k,qn=new k,hi=new k,Rr=new k,xs=new k,_s=new k,pi=new k;function Wa(n,e,t,i,r){for(let s=0,o=n.length-3;s<=o;s+=3){pi.fromArray(n,s);const c=r.x*Math.abs(pi.x)+r.y*Math.abs(pi.y)+r.z*Math.abs(pi.z),l=e.dot(pi),d=t.dot(pi),f=i.dot(pi);if(Math.max(-Math.max(l,d,f),Math.min(l,d,f))>c)return!1}return!0}const Ap=new as,Pr=new k,ja=new k;class Ma{constructor(e=new k,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const i=this.center;t!==void 0?i.copy(t):Ap.setFromPoints(e).getCenter(i);let r=0;for(let s=0,o=e.length;s<o;s++)r=Math.max(r,i.distanceToSquared(e[s]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Pr.subVectors(e,this.center);const t=Pr.lengthSq();if(t>this.radius*this.radius){const i=Math.sqrt(t),r=(i-this.radius)*.5;this.center.addScaledVector(Pr,r/i),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(ja.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Pr.copy(e.center).add(ja)),this.expandByPoint(Pr.copy(e.center).sub(ja))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}}const Dn=new k,$a=new k,bs=new k,Yn=new k,Xa=new k,ys=new k,qa=new k;class Wc{constructor(e=new k,t=new k(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Dn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=Dn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Dn.copy(this.origin).addScaledVector(this.direction,t),Dn.distanceToSquared(e))}distanceSqToSegment(e,t,i,r){$a.copy(e).add(t).multiplyScalar(.5),bs.copy(t).sub(e).normalize(),Yn.copy(this.origin).sub($a);const s=e.distanceTo(t)*.5,o=-this.direction.dot(bs),c=Yn.dot(this.direction),l=-Yn.dot(bs),d=Yn.lengthSq(),f=Math.abs(1-o*o);let p,h,m,_;if(f>0)if(p=o*l-c,h=o*c-l,_=s*f,p>=0)if(h>=-_)if(h<=_){const b=1/f;p*=b,h*=b,m=p*(p+o*h+2*c)+h*(o*p+h+2*l)+d}else h=s,p=Math.max(0,-(o*h+c)),m=-p*p+h*(h+2*l)+d;else h=-s,p=Math.max(0,-(o*h+c)),m=-p*p+h*(h+2*l)+d;else h<=-_?(p=Math.max(0,-(-o*s+c)),h=p>0?-s:Math.min(Math.max(-s,-l),s),m=-p*p+h*(h+2*l)+d):h<=_?(p=0,h=Math.min(Math.max(-s,-l),s),m=h*(h+2*l)+d):(p=Math.max(0,-(o*s+c)),h=p>0?s:Math.min(Math.max(-s,-l),s),m=-p*p+h*(h+2*l)+d);else h=o>0?-s:s,p=Math.max(0,-(o*h+c)),m=-p*p+h*(h+2*l)+d;return i&&i.copy(this.origin).addScaledVector(this.direction,p),r&&r.copy($a).addScaledVector(bs,h),m}intersectSphere(e,t){Dn.subVectors(e.center,this.origin);const i=Dn.dot(this.direction),r=Dn.dot(Dn)-i*i,s=e.radius*e.radius;if(r>s)return null;const o=Math.sqrt(s-r),c=i-o,l=i+o;return l<0?null:c<0?this.at(l,t):this.at(c,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){const i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,r,s,o,c,l;const d=1/this.direction.x,f=1/this.direction.y,p=1/this.direction.z,h=this.origin;return d>=0?(i=(e.min.x-h.x)*d,r=(e.max.x-h.x)*d):(i=(e.max.x-h.x)*d,r=(e.min.x-h.x)*d),f>=0?(s=(e.min.y-h.y)*f,o=(e.max.y-h.y)*f):(s=(e.max.y-h.y)*f,o=(e.min.y-h.y)*f),i>o||s>r||((s>i||isNaN(i))&&(i=s),(o<r||isNaN(r))&&(r=o),p>=0?(c=(e.min.z-h.z)*p,l=(e.max.z-h.z)*p):(c=(e.max.z-h.z)*p,l=(e.min.z-h.z)*p),i>l||c>r)||((c>i||i!==i)&&(i=c),(l<r||r!==r)&&(r=l),r<0)?null:this.at(i>=0?i:r,t)}intersectsBox(e){return this.intersectBox(e,Dn)!==null}intersectTriangle(e,t,i,r,s){Xa.subVectors(t,e),ys.subVectors(i,e),qa.crossVectors(Xa,ys);let o=this.direction.dot(qa),c;if(o>0){if(r)return null;c=1}else if(o<0)c=-1,o=-o;else return null;Yn.subVectors(this.origin,e);const l=c*this.direction.dot(ys.crossVectors(Yn,ys));if(l<0)return null;const d=c*this.direction.dot(Xa.cross(Yn));if(d<0||l+d>o)return null;const f=-c*Yn.dot(qa);return f<0?null:this.at(f/o,s)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class St{constructor(e,t,i,r,s,o,c,l,d,f,p,h,m,_,b,x){St.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,r,s,o,c,l,d,f,p,h,m,_,b,x)}set(e,t,i,r,s,o,c,l,d,f,p,h,m,_,b,x){const g=this.elements;return g[0]=e,g[4]=t,g[8]=i,g[12]=r,g[1]=s,g[5]=o,g[9]=c,g[13]=l,g[2]=d,g[6]=f,g[10]=p,g[14]=h,g[3]=m,g[7]=_,g[11]=b,g[15]=x,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new St().fromArray(this.elements)}copy(e){const t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){const t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){const t=this.elements,i=e.elements,r=1/Hi.setFromMatrixColumn(e,0).length(),s=1/Hi.setFromMatrixColumn(e,1).length(),o=1/Hi.setFromMatrixColumn(e,2).length();return t[0]=i[0]*r,t[1]=i[1]*r,t[2]=i[2]*r,t[3]=0,t[4]=i[4]*s,t[5]=i[5]*s,t[6]=i[6]*s,t[7]=0,t[8]=i[8]*o,t[9]=i[9]*o,t[10]=i[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,i=e.x,r=e.y,s=e.z,o=Math.cos(i),c=Math.sin(i),l=Math.cos(r),d=Math.sin(r),f=Math.cos(s),p=Math.sin(s);if(e.order==="XYZ"){const h=o*f,m=o*p,_=c*f,b=c*p;t[0]=l*f,t[4]=-l*p,t[8]=d,t[1]=m+_*d,t[5]=h-b*d,t[9]=-c*l,t[2]=b-h*d,t[6]=_+m*d,t[10]=o*l}else if(e.order==="YXZ"){const h=l*f,m=l*p,_=d*f,b=d*p;t[0]=h+b*c,t[4]=_*c-m,t[8]=o*d,t[1]=o*p,t[5]=o*f,t[9]=-c,t[2]=m*c-_,t[6]=b+h*c,t[10]=o*l}else if(e.order==="ZXY"){const h=l*f,m=l*p,_=d*f,b=d*p;t[0]=h-b*c,t[4]=-o*p,t[8]=_+m*c,t[1]=m+_*c,t[5]=o*f,t[9]=b-h*c,t[2]=-o*d,t[6]=c,t[10]=o*l}else if(e.order==="ZYX"){const h=o*f,m=o*p,_=c*f,b=c*p;t[0]=l*f,t[4]=_*d-m,t[8]=h*d+b,t[1]=l*p,t[5]=b*d+h,t[9]=m*d-_,t[2]=-d,t[6]=c*l,t[10]=o*l}else if(e.order==="YZX"){const h=o*l,m=o*d,_=c*l,b=c*d;t[0]=l*f,t[4]=b-h*p,t[8]=_*p+m,t[1]=p,t[5]=o*f,t[9]=-c*f,t[2]=-d*f,t[6]=m*p+_,t[10]=h-b*p}else if(e.order==="XZY"){const h=o*l,m=o*d,_=c*l,b=c*d;t[0]=l*f,t[4]=-p,t[8]=d*f,t[1]=h*p+b,t[5]=o*f,t[9]=m*p-_,t[2]=_*p-m,t[6]=c*f,t[10]=b*p+h}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Lp,e,Rp)}lookAt(e,t,i){const r=this.elements;return Jt.subVectors(e,t),Jt.lengthSq()===0&&(Jt.z=1),Jt.normalize(),Kn.crossVectors(i,Jt),Kn.lengthSq()===0&&(Math.abs(i.z)===1?Jt.x+=1e-4:Jt.z+=1e-4,Jt.normalize(),Kn.crossVectors(i,Jt)),Kn.normalize(),vs.crossVectors(Jt,Kn),r[0]=Kn.x,r[4]=vs.x,r[8]=Jt.x,r[1]=Kn.y,r[5]=vs.y,r[9]=Jt.y,r[2]=Kn.z,r[6]=vs.z,r[10]=Jt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const i=e.elements,r=t.elements,s=this.elements,o=i[0],c=i[4],l=i[8],d=i[12],f=i[1],p=i[5],h=i[9],m=i[13],_=i[2],b=i[6],x=i[10],g=i[14],w=i[3],T=i[7],L=i[11],R=i[15],M=r[0],A=r[4],F=r[8],E=r[12],v=r[1],P=r[5],O=r[9],B=r[13],W=r[2],H=r[6],X=r[10],Q=r[14],$=r[3],ie=r[7],ne=r[11],xe=r[15];return s[0]=o*M+c*v+l*W+d*$,s[4]=o*A+c*P+l*H+d*ie,s[8]=o*F+c*O+l*X+d*ne,s[12]=o*E+c*B+l*Q+d*xe,s[1]=f*M+p*v+h*W+m*$,s[5]=f*A+p*P+h*H+m*ie,s[9]=f*F+p*O+h*X+m*ne,s[13]=f*E+p*B+h*Q+m*xe,s[2]=_*M+b*v+x*W+g*$,s[6]=_*A+b*P+x*H+g*ie,s[10]=_*F+b*O+x*X+g*ne,s[14]=_*E+b*B+x*Q+g*xe,s[3]=w*M+T*v+L*W+R*$,s[7]=w*A+T*P+L*H+R*ie,s[11]=w*F+T*O+L*X+R*ne,s[15]=w*E+T*B+L*Q+R*xe,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],i=e[4],r=e[8],s=e[12],o=e[1],c=e[5],l=e[9],d=e[13],f=e[2],p=e[6],h=e[10],m=e[14],_=e[3],b=e[7],x=e[11],g=e[15];return _*(+s*l*p-r*d*p-s*c*h+i*d*h+r*c*m-i*l*m)+b*(+t*l*m-t*d*h+s*o*h-r*o*m+r*d*f-s*l*f)+x*(+t*d*p-t*c*m-s*o*p+i*o*m+s*c*f-i*d*f)+g*(-r*c*f-t*l*p+t*c*h+r*o*p-i*o*h+i*l*f)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){const r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=i),this}invert(){const e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],o=e[4],c=e[5],l=e[6],d=e[7],f=e[8],p=e[9],h=e[10],m=e[11],_=e[12],b=e[13],x=e[14],g=e[15],w=p*x*d-b*h*d+b*l*m-c*x*m-p*l*g+c*h*g,T=_*h*d-f*x*d-_*l*m+o*x*m+f*l*g-o*h*g,L=f*b*d-_*p*d+_*c*m-o*b*m-f*c*g+o*p*g,R=_*p*l-f*b*l-_*c*h+o*b*h+f*c*x-o*p*x,M=t*w+i*T+r*L+s*R;if(M===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const A=1/M;return e[0]=w*A,e[1]=(b*h*s-p*x*s-b*r*m+i*x*m+p*r*g-i*h*g)*A,e[2]=(c*x*s-b*l*s+b*r*d-i*x*d-c*r*g+i*l*g)*A,e[3]=(p*l*s-c*h*s-p*r*d+i*h*d+c*r*m-i*l*m)*A,e[4]=T*A,e[5]=(f*x*s-_*h*s+_*r*m-t*x*m-f*r*g+t*h*g)*A,e[6]=(_*l*s-o*x*s-_*r*d+t*x*d+o*r*g-t*l*g)*A,e[7]=(o*h*s-f*l*s+f*r*d-t*h*d-o*r*m+t*l*m)*A,e[8]=L*A,e[9]=(_*p*s-f*b*s-_*i*m+t*b*m+f*i*g-t*p*g)*A,e[10]=(o*b*s-_*c*s+_*i*d-t*b*d-o*i*g+t*c*g)*A,e[11]=(f*c*s-o*p*s-f*i*d+t*p*d+o*i*m-t*c*m)*A,e[12]=R*A,e[13]=(f*b*r-_*p*r+_*i*h-t*b*h-f*i*x+t*p*x)*A,e[14]=(_*c*r-o*b*r-_*i*l+t*b*l+o*i*x-t*c*x)*A,e[15]=(o*p*r-f*c*r+f*i*l-t*p*l-o*i*h+t*c*h)*A,this}scale(e){const t=this.elements,i=e.x,r=e.y,s=e.z;return t[0]*=i,t[4]*=r,t[8]*=s,t[1]*=i,t[5]*=r,t[9]*=s,t[2]*=i,t[6]*=r,t[10]*=s,t[3]*=i,t[7]*=r,t[11]*=s,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,r))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const i=Math.cos(t),r=Math.sin(t),s=1-i,o=e.x,c=e.y,l=e.z,d=s*o,f=s*c;return this.set(d*o+i,d*c-r*l,d*l+r*c,0,d*c+r*l,f*c+i,f*l-r*o,0,d*l-r*c,f*l+r*o,s*l*l+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,r,s,o){return this.set(1,i,s,0,e,1,o,0,t,r,1,0,0,0,0,1),this}compose(e,t,i){const r=this.elements,s=t._x,o=t._y,c=t._z,l=t._w,d=s+s,f=o+o,p=c+c,h=s*d,m=s*f,_=s*p,b=o*f,x=o*p,g=c*p,w=l*d,T=l*f,L=l*p,R=i.x,M=i.y,A=i.z;return r[0]=(1-(b+g))*R,r[1]=(m+L)*R,r[2]=(_-T)*R,r[3]=0,r[4]=(m-L)*M,r[5]=(1-(h+g))*M,r[6]=(x+w)*M,r[7]=0,r[8]=(_+T)*A,r[9]=(x-w)*A,r[10]=(1-(h+b))*A,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,i){const r=this.elements;let s=Hi.set(r[0],r[1],r[2]).length();const o=Hi.set(r[4],r[5],r[6]).length(),c=Hi.set(r[8],r[9],r[10]).length();this.determinant()<0&&(s=-s),e.x=r[12],e.y=r[13],e.z=r[14],hn.copy(this);const d=1/s,f=1/o,p=1/c;return hn.elements[0]*=d,hn.elements[1]*=d,hn.elements[2]*=d,hn.elements[4]*=f,hn.elements[5]*=f,hn.elements[6]*=f,hn.elements[8]*=p,hn.elements[9]*=p,hn.elements[10]*=p,t.setFromRotationMatrix(hn),i.x=s,i.y=o,i.z=c,this}makePerspective(e,t,i,r,s,o,c=Cn,l=!1){const d=this.elements,f=2*s/(t-e),p=2*s/(i-r),h=(t+e)/(t-e),m=(i+r)/(i-r);let _,b;if(l)_=s/(o-s),b=o*s/(o-s);else if(c===Cn)_=-(o+s)/(o-s),b=-2*o*s/(o-s);else if(c===ha)_=-o/(o-s),b=-o*s/(o-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+c);return d[0]=f,d[4]=0,d[8]=h,d[12]=0,d[1]=0,d[5]=p,d[9]=m,d[13]=0,d[2]=0,d[6]=0,d[10]=_,d[14]=b,d[3]=0,d[7]=0,d[11]=-1,d[15]=0,this}makeOrthographic(e,t,i,r,s,o,c=Cn,l=!1){const d=this.elements,f=2/(t-e),p=2/(i-r),h=-(t+e)/(t-e),m=-(i+r)/(i-r);let _,b;if(l)_=1/(o-s),b=o/(o-s);else if(c===Cn)_=-2/(o-s),b=-(o+s)/(o-s);else if(c===ha)_=-1/(o-s),b=-s/(o-s);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+c);return d[0]=f,d[4]=0,d[8]=0,d[12]=h,d[1]=0,d[5]=p,d[9]=0,d[13]=m,d[2]=0,d[6]=0,d[10]=_,d[14]=b,d[3]=0,d[7]=0,d[11]=0,d[15]=1,this}equals(e){const t=this.elements,i=e.elements;for(let r=0;r<16;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){const i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}}const Hi=new k,hn=new St,Lp=new k(0,0,0),Rp=new k(1,1,1),Kn=new k,vs=new k,Jt=new k,Wl=new St,jl=new wi;class Rn{constructor(e=0,t=0,i=0,r=Rn.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,r=this._order){return this._x=e,this._y=t,this._z=i,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){const r=e.elements,s=r[0],o=r[4],c=r[8],l=r[1],d=r[5],f=r[9],p=r[2],h=r[6],m=r[10];switch(t){case"XYZ":this._y=Math.asin(We(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-f,m),this._z=Math.atan2(-o,s)):(this._x=Math.atan2(h,d),this._z=0);break;case"YXZ":this._x=Math.asin(-We(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(c,m),this._z=Math.atan2(l,d)):(this._y=Math.atan2(-p,s),this._z=0);break;case"ZXY":this._x=Math.asin(We(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(-p,m),this._z=Math.atan2(-o,d)):(this._y=0,this._z=Math.atan2(l,s));break;case"ZYX":this._y=Math.asin(-We(p,-1,1)),Math.abs(p)<.9999999?(this._x=Math.atan2(h,m),this._z=Math.atan2(l,s)):(this._x=0,this._z=Math.atan2(-o,d));break;case"YZX":this._z=Math.asin(We(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-f,d),this._y=Math.atan2(-p,s)):(this._x=0,this._y=Math.atan2(c,m));break;case"XZY":this._z=Math.asin(-We(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(h,d),this._y=Math.atan2(c,s)):(this._x=Math.atan2(-f,m),this._y=0);break;default:Fe("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return Wl.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Wl,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return jl.setFromEuler(this),this.setFromQuaternion(jl,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Rn.DEFAULT_ORDER="XYZ";class Iu{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let Pp=0;const $l=new k,Wi=new wi,Fn=new St,Ss=new k,Ir=new k,Ip=new k,Dp=new wi,Xl=new k(1,0,0),ql=new k(0,1,0),Yl=new k(0,0,1),Kl={type:"added"},Fp={type:"removed"},ji={type:"childadded",child:null},Ya={type:"childremoved",child:null};class Ft extends Ii{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Pp++}),this.uuid=ss(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Ft.DEFAULT_UP.clone();const e=new k,t=new Rn,i=new wi,r=new k(1,1,1);function s(){i.setFromEuler(t,!1)}function o(){t.setFromQuaternion(i,void 0,!1)}t._onChange(s),i._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new St},normalMatrix:{value:new Ge}}),this.matrix=new St,this.matrixWorld=new St,this.matrixAutoUpdate=Ft.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Ft.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Iu,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Wi.setFromAxisAngle(e,t),this.quaternion.multiply(Wi),this}rotateOnWorldAxis(e,t){return Wi.setFromAxisAngle(e,t),this.quaternion.premultiply(Wi),this}rotateX(e){return this.rotateOnAxis(Xl,e)}rotateY(e){return this.rotateOnAxis(ql,e)}rotateZ(e){return this.rotateOnAxis(Yl,e)}translateOnAxis(e,t){return $l.copy(e).applyQuaternion(this.quaternion),this.position.add($l.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Xl,e)}translateY(e){return this.translateOnAxis(ql,e)}translateZ(e){return this.translateOnAxis(Yl,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Fn.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?Ss.copy(e):Ss.set(e,t,i);const r=this.parent;this.updateWorldMatrix(!0,!1),Ir.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Fn.lookAt(Ir,Ss,this.up):Fn.lookAt(Ss,Ir,this.up),this.quaternion.setFromRotationMatrix(Fn),r&&(Fn.extractRotation(r.matrixWorld),Wi.setFromRotationMatrix(Fn),this.quaternion.premultiply(Wi.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(Mt("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Kl),ji.child=e,this.dispatchEvent(ji),ji.child=null):Mt("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Fp),Ya.child=e,this.dispatchEvent(Ya),Ya.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Fn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Fn.multiply(e.parent.matrixWorld)),e.applyMatrix4(Fn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Kl),ji.child=e,this.dispatchEvent(ji),ji.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,r=this.children.length;i<r;i++){const o=this.children[i].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);const r=this.children;for(let s=0,o=r.length;s<o;s++)r[s].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ir,e,Ip),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ir,Dp,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t){const i=this.parent;if(e===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){const r=this.children;for(let s=0,o=r.length;s<o;s++)r[s].updateWorldMatrix(!1,!0)}}toJSON(e){const t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const r={};r.uuid=this.uuid,r.type=this.type,this.name!==""&&(r.name=this.name),this.castShadow===!0&&(r.castShadow=!0),this.receiveShadow===!0&&(r.receiveShadow=!0),this.visible===!1&&(r.visible=!1),this.frustumCulled===!1&&(r.frustumCulled=!1),this.renderOrder!==0&&(r.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(r.matrixAutoUpdate=!1),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(c=>({...c,boundingBox:c.boundingBox?c.boundingBox.toJSON():void 0,boundingSphere:c.boundingSphere?c.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(c=>({...c})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function s(c,l){return c[l.uuid]===void 0&&(c[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=s(e.geometries,this.geometry);const c=this.geometry.parameters;if(c!==void 0&&c.shapes!==void 0){const l=c.shapes;if(Array.isArray(l))for(let d=0,f=l.length;d<f;d++){const p=l[d];s(e.shapes,p)}else s(e.shapes,l)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const c=[];for(let l=0,d=this.material.length;l<d;l++)c.push(s(e.materials,this.material[l]));r.material=c}else r.material=s(e.materials,this.material);if(this.children.length>0){r.children=[];for(let c=0;c<this.children.length;c++)r.children.push(this.children[c].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let c=0;c<this.animations.length;c++){const l=this.animations[c];r.animations.push(s(e.animations,l))}}if(t){const c=o(e.geometries),l=o(e.materials),d=o(e.textures),f=o(e.images),p=o(e.shapes),h=o(e.skeletons),m=o(e.animations),_=o(e.nodes);c.length>0&&(i.geometries=c),l.length>0&&(i.materials=l),d.length>0&&(i.textures=d),f.length>0&&(i.images=f),p.length>0&&(i.shapes=p),h.length>0&&(i.skeletons=h),m.length>0&&(i.animations=m),_.length>0&&(i.nodes=_)}return i.object=r,i;function o(c){const l=[];for(const d in c){const f=c[d];delete f.metadata,l.push(f)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){const r=e.children[i];this.add(r.clone())}return this}}Ft.DEFAULT_UP=new k(0,1,0);Ft.DEFAULT_MATRIX_AUTO_UPDATE=!0;Ft.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const pn=new k,Nn=new k,Ka=new k,Un=new k,$i=new k,Xi=new k,Jl=new k,Ja=new k,Za=new k,Qa=new k,eo=new vt,to=new vt,no=new vt;class gn{constructor(e=new k,t=new k,i=new k){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,r){r.subVectors(i,t),pn.subVectors(e,t),r.cross(pn);const s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(e,t,i,r,s){pn.subVectors(r,t),Nn.subVectors(i,t),Ka.subVectors(e,t);const o=pn.dot(pn),c=pn.dot(Nn),l=pn.dot(Ka),d=Nn.dot(Nn),f=Nn.dot(Ka),p=o*d-c*c;if(p===0)return s.set(0,0,0),null;const h=1/p,m=(d*l-c*f)*h,_=(o*f-c*l)*h;return s.set(1-m-_,_,m)}static containsPoint(e,t,i,r){return this.getBarycoord(e,t,i,r,Un)===null?!1:Un.x>=0&&Un.y>=0&&Un.x+Un.y<=1}static getInterpolation(e,t,i,r,s,o,c,l){return this.getBarycoord(e,t,i,r,Un)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(s,Un.x),l.addScaledVector(o,Un.y),l.addScaledVector(c,Un.z),l)}static getInterpolatedAttribute(e,t,i,r,s,o){return eo.setScalar(0),to.setScalar(0),no.setScalar(0),eo.fromBufferAttribute(e,t),to.fromBufferAttribute(e,i),no.fromBufferAttribute(e,r),o.setScalar(0),o.addScaledVector(eo,s.x),o.addScaledVector(to,s.y),o.addScaledVector(no,s.z),o}static isFrontFacing(e,t,i,r){return pn.subVectors(i,t),Nn.subVectors(e,t),pn.cross(Nn).dot(r)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,r){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,i,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return pn.subVectors(this.c,this.b),Nn.subVectors(this.a,this.b),pn.cross(Nn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return gn.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return gn.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,r,s){return gn.getInterpolation(e,this.a,this.b,this.c,t,i,r,s)}containsPoint(e){return gn.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return gn.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const i=this.a,r=this.b,s=this.c;let o,c;$i.subVectors(r,i),Xi.subVectors(s,i),Ja.subVectors(e,i);const l=$i.dot(Ja),d=Xi.dot(Ja);if(l<=0&&d<=0)return t.copy(i);Za.subVectors(e,r);const f=$i.dot(Za),p=Xi.dot(Za);if(f>=0&&p<=f)return t.copy(r);const h=l*p-f*d;if(h<=0&&l>=0&&f<=0)return o=l/(l-f),t.copy(i).addScaledVector($i,o);Qa.subVectors(e,s);const m=$i.dot(Qa),_=Xi.dot(Qa);if(_>=0&&m<=_)return t.copy(s);const b=m*d-l*_;if(b<=0&&d>=0&&_<=0)return c=d/(d-_),t.copy(i).addScaledVector(Xi,c);const x=f*_-m*p;if(x<=0&&p-f>=0&&m-_>=0)return Jl.subVectors(s,r),c=(p-f)/(p-f+(m-_)),t.copy(r).addScaledVector(Jl,c);const g=1/(x+b+h);return o=b*g,c=h*g,t.copy(i).addScaledVector($i,o).addScaledVector(Xi,c)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}const Du={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Jn={h:0,s:0,l:0},Es={h:0,s:0,l:0};function io(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}class ze{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){const r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=sn){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Qe.colorSpaceToWorking(this,t),this}setRGB(e,t,i,r=Qe.workingColorSpace){return this.r=e,this.g=t,this.b=i,Qe.colorSpaceToWorking(this,r),this}setHSL(e,t,i,r=Qe.workingColorSpace){if(e=yp(e,1),t=We(t,0,1),i=We(i,0,1),t===0)this.r=this.g=this.b=i;else{const s=i<=.5?i*(1+t):i+t-i*t,o=2*i-s;this.r=io(o,s,e+1/3),this.g=io(o,s,e),this.b=io(o,s,e-1/3)}return Qe.colorSpaceToWorking(this,r),this}setStyle(e,t=sn){function i(s){s!==void 0&&parseFloat(s)<1&&Fe("Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let s;const o=r[1],c=r[2];switch(o){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(c))return i(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,t);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(c))return i(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,t);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(c))return i(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,t);break;default:Fe("Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){const s=r[1],o=s.length;if(o===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(s,16),t);Fe("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=sn){const i=Du[e.toLowerCase()];return i!==void 0?this.setHex(i,t):Fe("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Hn(e.r),this.g=Hn(e.g),this.b=Hn(e.b),this}copyLinearToSRGB(e){return this.r=cr(e.r),this.g=cr(e.g),this.b=cr(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=sn){return Qe.workingToColorSpace(Ut.copy(this),e),Math.round(We(Ut.r*255,0,255))*65536+Math.round(We(Ut.g*255,0,255))*256+Math.round(We(Ut.b*255,0,255))}getHexString(e=sn){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Qe.workingColorSpace){Qe.workingToColorSpace(Ut.copy(this),t);const i=Ut.r,r=Ut.g,s=Ut.b,o=Math.max(i,r,s),c=Math.min(i,r,s);let l,d;const f=(c+o)/2;if(c===o)l=0,d=0;else{const p=o-c;switch(d=f<=.5?p/(o+c):p/(2-o-c),o){case i:l=(r-s)/p+(r<s?6:0);break;case r:l=(s-i)/p+2;break;case s:l=(i-r)/p+4;break}l/=6}return e.h=l,e.s=d,e.l=f,e}getRGB(e,t=Qe.workingColorSpace){return Qe.workingToColorSpace(Ut.copy(this),t),e.r=Ut.r,e.g=Ut.g,e.b=Ut.b,e}getStyle(e=sn){Qe.workingToColorSpace(Ut.copy(this),e);const t=Ut.r,i=Ut.g,r=Ut.b;return e!==sn?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(r*255)})`}offsetHSL(e,t,i){return this.getHSL(Jn),this.setHSL(Jn.h+e,Jn.s+t,Jn.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(Jn),e.getHSL(Es);const i=Ga(Jn.h,Es.h,t),r=Ga(Jn.s,Es.s,t),s=Ga(Jn.l,Es.l,t);return this.setHSL(i,r,s),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,i=this.g,r=this.b,s=e.elements;return this.r=s[0]*t+s[3]*i+s[6]*r,this.g=s[1]*t+s[4]*i+s[7]*r,this.b=s[2]*t+s[5]*i+s[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Ut=new ze;ze.NAMES=Du;let Np=0;class yr extends Ii{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Np++}),this.uuid=ss(),this.name="",this.type="Material",this.blending=or,this.side=ai,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Lo,this.blendDst=Ro,this.blendEquation=yi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new ze(0,0,0),this.blendAlpha=0,this.depthFunc=ur,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Ul,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Bi,this.stencilZFail=Bi,this.stencilZPass=Bi,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const i=e[t];if(i===void 0){Fe(`Material: parameter '${t}' has value of undefined.`);continue}const r=this[t];if(r===void 0){Fe(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(i):r&&r.isVector3&&i&&i.isVector3?r.copy(i):this[t]=i}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==or&&(i.blending=this.blending),this.side!==ai&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==Lo&&(i.blendSrc=this.blendSrc),this.blendDst!==Ro&&(i.blendDst=this.blendDst),this.blendEquation!==yi&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==ur&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Ul&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Bi&&(i.stencilFail=this.stencilFail),this.stencilZFail!==Bi&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==Bi&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function r(s){const o=[];for(const c in s){const l=s[c];delete l.metadata,o.push(l)}return o}if(t){const s=r(e.textures),o=r(e.images);s.length>0&&(i.textures=s),o.length>0&&(i.images=o)}return i}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let i=null;if(t!==null){const r=t.length;i=new Array(r);for(let s=0;s!==r;++s)i[s]=t[s].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}class jc extends yr{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new ze(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Rn,this.combine=bu,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const Tt=new k,Ms=new Oe;let Up=0;class wn{constructor(e,t,i=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Up++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=Ol,this.updateRanges=[],this.gpuType=zn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[e+r]=t.array[i+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)Ms.fromBufferAttribute(this,t),Ms.applyMatrix3(e),this.setXY(t,Ms.x,Ms.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)Tt.fromBufferAttribute(this,t),Tt.applyMatrix3(e),this.setXYZ(t,Tt.x,Tt.y,Tt.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)Tt.fromBufferAttribute(this,t),Tt.applyMatrix4(e),this.setXYZ(t,Tt.x,Tt.y,Tt.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)Tt.fromBufferAttribute(this,t),Tt.applyNormalMatrix(e),this.setXYZ(t,Tt.x,Tt.y,Tt.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)Tt.fromBufferAttribute(this,t),Tt.transformDirection(e),this.setXYZ(t,Tt.x,Tt.y,Tt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=Lr(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=jt(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Lr(t,this.array)),t}setX(e,t){return this.normalized&&(t=jt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Lr(t,this.array)),t}setY(e,t){return this.normalized&&(t=jt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Lr(t,this.array)),t}setZ(e,t){return this.normalized&&(t=jt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Lr(t,this.array)),t}setW(e,t){return this.normalized&&(t=jt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=jt(t,this.array),i=jt(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,r){return e*=this.itemSize,this.normalized&&(t=jt(t,this.array),i=jt(i,this.array),r=jt(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this}setXYZW(e,t,i,r,s){return e*=this.itemSize,this.normalized&&(t=jt(t,this.array),i=jt(i,this.array),r=jt(r,this.array),s=jt(s,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this.array[e+3]=s,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==Ol&&(e.usage=this.usage),e}}class Fu extends wn{constructor(e,t,i){super(new Uint16Array(e),t,i)}}class Nu extends wn{constructor(e,t,i){super(new Uint32Array(e),t,i)}}class Vt extends wn{constructor(e,t,i){super(new Float32Array(e),t,i)}}let Op=0;const rn=new St,ro=new Ft,qi=new k,Zt=new as,Dr=new as,Rt=new k;class dn extends Ii{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Op++}),this.uuid=ss(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Ru(e)?Nu:Fu)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const i=this.attributes.normal;if(i!==void 0){const s=new Ge().getNormalMatrix(e);i.applyNormalMatrix(s),i.needsUpdate=!0}const r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return rn.makeRotationFromQuaternion(e),this.applyMatrix4(rn),this}rotateX(e){return rn.makeRotationX(e),this.applyMatrix4(rn),this}rotateY(e){return rn.makeRotationY(e),this.applyMatrix4(rn),this}rotateZ(e){return rn.makeRotationZ(e),this.applyMatrix4(rn),this}translate(e,t,i){return rn.makeTranslation(e,t,i),this.applyMatrix4(rn),this}scale(e,t,i){return rn.makeScale(e,t,i),this.applyMatrix4(rn),this}lookAt(e){return ro.lookAt(e),ro.updateMatrix(),this.applyMatrix4(ro.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(qi).negate(),this.translate(qi.x,qi.y,qi.z),this}setFromPoints(e){const t=this.getAttribute("position");if(t===void 0){const i=[];for(let r=0,s=e.length;r<s;r++){const o=e[r];i.push(o.x,o.y,o.z||0)}this.setAttribute("position",new Vt(i,3))}else{const i=Math.min(e.length,t.count);for(let r=0;r<i;r++){const s=e[r];t.setXYZ(r,s.x,s.y,s.z||0)}e.length>t.count&&Fe("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new as);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Mt("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new k(-1/0,-1/0,-1/0),new k(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,r=t.length;i<r;i++){const s=t[i];Zt.setFromBufferAttribute(s),this.morphTargetsRelative?(Rt.addVectors(this.boundingBox.min,Zt.min),this.boundingBox.expandByPoint(Rt),Rt.addVectors(this.boundingBox.max,Zt.max),this.boundingBox.expandByPoint(Rt)):(this.boundingBox.expandByPoint(Zt.min),this.boundingBox.expandByPoint(Zt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Mt('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Ma);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Mt("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new k,1/0);return}if(e){const i=this.boundingSphere.center;if(Zt.setFromBufferAttribute(e),t)for(let s=0,o=t.length;s<o;s++){const c=t[s];Dr.setFromBufferAttribute(c),this.morphTargetsRelative?(Rt.addVectors(Zt.min,Dr.min),Zt.expandByPoint(Rt),Rt.addVectors(Zt.max,Dr.max),Zt.expandByPoint(Rt)):(Zt.expandByPoint(Dr.min),Zt.expandByPoint(Dr.max))}Zt.getCenter(i);let r=0;for(let s=0,o=e.count;s<o;s++)Rt.fromBufferAttribute(e,s),r=Math.max(r,i.distanceToSquared(Rt));if(t)for(let s=0,o=t.length;s<o;s++){const c=t[s],l=this.morphTargetsRelative;for(let d=0,f=c.count;d<f;d++)Rt.fromBufferAttribute(c,d),l&&(qi.fromBufferAttribute(e,d),Rt.add(qi)),r=Math.max(r,i.distanceToSquared(Rt))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&Mt('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){Mt("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const i=t.position,r=t.normal,s=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new wn(new Float32Array(4*i.count),4));const o=this.getAttribute("tangent"),c=[],l=[];for(let F=0;F<i.count;F++)c[F]=new k,l[F]=new k;const d=new k,f=new k,p=new k,h=new Oe,m=new Oe,_=new Oe,b=new k,x=new k;function g(F,E,v){d.fromBufferAttribute(i,F),f.fromBufferAttribute(i,E),p.fromBufferAttribute(i,v),h.fromBufferAttribute(s,F),m.fromBufferAttribute(s,E),_.fromBufferAttribute(s,v),f.sub(d),p.sub(d),m.sub(h),_.sub(h);const P=1/(m.x*_.y-_.x*m.y);isFinite(P)&&(b.copy(f).multiplyScalar(_.y).addScaledVector(p,-m.y).multiplyScalar(P),x.copy(p).multiplyScalar(m.x).addScaledVector(f,-_.x).multiplyScalar(P),c[F].add(b),c[E].add(b),c[v].add(b),l[F].add(x),l[E].add(x),l[v].add(x))}let w=this.groups;w.length===0&&(w=[{start:0,count:e.count}]);for(let F=0,E=w.length;F<E;++F){const v=w[F],P=v.start,O=v.count;for(let B=P,W=P+O;B<W;B+=3)g(e.getX(B+0),e.getX(B+1),e.getX(B+2))}const T=new k,L=new k,R=new k,M=new k;function A(F){R.fromBufferAttribute(r,F),M.copy(R);const E=c[F];T.copy(E),T.sub(R.multiplyScalar(R.dot(E))).normalize(),L.crossVectors(M,E);const P=L.dot(l[F])<0?-1:1;o.setXYZW(F,T.x,T.y,T.z,P)}for(let F=0,E=w.length;F<E;++F){const v=w[F],P=v.start,O=v.count;for(let B=P,W=P+O;B<W;B+=3)A(e.getX(B+0)),A(e.getX(B+1)),A(e.getX(B+2))}}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new wn(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let h=0,m=i.count;h<m;h++)i.setXYZ(h,0,0,0);const r=new k,s=new k,o=new k,c=new k,l=new k,d=new k,f=new k,p=new k;if(e)for(let h=0,m=e.count;h<m;h+=3){const _=e.getX(h+0),b=e.getX(h+1),x=e.getX(h+2);r.fromBufferAttribute(t,_),s.fromBufferAttribute(t,b),o.fromBufferAttribute(t,x),f.subVectors(o,s),p.subVectors(r,s),f.cross(p),c.fromBufferAttribute(i,_),l.fromBufferAttribute(i,b),d.fromBufferAttribute(i,x),c.add(f),l.add(f),d.add(f),i.setXYZ(_,c.x,c.y,c.z),i.setXYZ(b,l.x,l.y,l.z),i.setXYZ(x,d.x,d.y,d.z)}else for(let h=0,m=t.count;h<m;h+=3)r.fromBufferAttribute(t,h+0),s.fromBufferAttribute(t,h+1),o.fromBufferAttribute(t,h+2),f.subVectors(o,s),p.subVectors(r,s),f.cross(p),i.setXYZ(h+0,f.x,f.y,f.z),i.setXYZ(h+1,f.x,f.y,f.z),i.setXYZ(h+2,f.x,f.y,f.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)Rt.fromBufferAttribute(e,t),Rt.normalize(),e.setXYZ(t,Rt.x,Rt.y,Rt.z)}toNonIndexed(){function e(c,l){const d=c.array,f=c.itemSize,p=c.normalized,h=new d.constructor(l.length*f);let m=0,_=0;for(let b=0,x=l.length;b<x;b++){c.isInterleavedBufferAttribute?m=l[b]*c.data.stride+c.offset:m=l[b]*f;for(let g=0;g<f;g++)h[_++]=d[m++]}return new wn(h,f,p)}if(this.index===null)return Fe("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new dn,i=this.index.array,r=this.attributes;for(const c in r){const l=r[c],d=e(l,i);t.setAttribute(c,d)}const s=this.morphAttributes;for(const c in s){const l=[],d=s[c];for(let f=0,p=d.length;f<p;f++){const h=d[f],m=e(h,i);l.push(m)}t.morphAttributes[c]=l}t.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let c=0,l=o.length;c<l;c++){const d=o[c];t.addGroup(d.start,d.count,d.materialIndex)}return t}toJSON(){const e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const d in l)l[d]!==void 0&&(e[d]=l[d]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const i=this.attributes;for(const l in i){const d=i[l];e.data.attributes[l]=d.toJSON(e.data)}const r={};let s=!1;for(const l in this.morphAttributes){const d=this.morphAttributes[l],f=[];for(let p=0,h=d.length;p<h;p++){const m=d[p];f.push(m.toJSON(e.data))}f.length>0&&(r[l]=f,s=!0)}s&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));const c=this.boundingSphere;return c!==null&&(e.data.boundingSphere=c.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const i=e.index;i!==null&&this.setIndex(i.clone());const r=e.attributes;for(const d in r){const f=r[d];this.setAttribute(d,f.clone(t))}const s=e.morphAttributes;for(const d in s){const f=[],p=s[d];for(let h=0,m=p.length;h<m;h++)f.push(p[h].clone(t));this.morphAttributes[d]=f}this.morphTargetsRelative=e.morphTargetsRelative;const o=e.groups;for(let d=0,f=o.length;d<f;d++){const p=o[d];this.addGroup(p.start,p.count,p.materialIndex)}const c=e.boundingBox;c!==null&&(this.boundingBox=c.clone());const l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Zl=new St,mi=new Wc,Ts=new Ma,Ql=new k,Cs=new k,ws=new k,As=new k,so=new k,Ls=new k,ed=new k,Rs=new k;class Pn extends Ft{constructor(e=new dn,t=new jc){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){const r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=r.length;s<o;s++){const c=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[c]=s}}}}getVertexPosition(e,t){const i=this.geometry,r=i.attributes.position,s=i.morphAttributes.position,o=i.morphTargetsRelative;t.fromBufferAttribute(r,e);const c=this.morphTargetInfluences;if(s&&c){Ls.set(0,0,0);for(let l=0,d=s.length;l<d;l++){const f=c[l],p=s[l];f!==0&&(so.fromBufferAttribute(p,e),o?Ls.addScaledVector(so,f):Ls.addScaledVector(so.sub(t),f))}t.add(Ls)}return t}raycast(e,t){const i=this.geometry,r=this.material,s=this.matrixWorld;r!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Ts.copy(i.boundingSphere),Ts.applyMatrix4(s),mi.copy(e.ray).recast(e.near),!(Ts.containsPoint(mi.origin)===!1&&(mi.intersectSphere(Ts,Ql)===null||mi.origin.distanceToSquared(Ql)>(e.far-e.near)**2))&&(Zl.copy(s).invert(),mi.copy(e.ray).applyMatrix4(Zl),!(i.boundingBox!==null&&mi.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,mi)))}_computeIntersections(e,t,i){let r;const s=this.geometry,o=this.material,c=s.index,l=s.attributes.position,d=s.attributes.uv,f=s.attributes.uv1,p=s.attributes.normal,h=s.groups,m=s.drawRange;if(c!==null)if(Array.isArray(o))for(let _=0,b=h.length;_<b;_++){const x=h[_],g=o[x.materialIndex],w=Math.max(x.start,m.start),T=Math.min(c.count,Math.min(x.start+x.count,m.start+m.count));for(let L=w,R=T;L<R;L+=3){const M=c.getX(L),A=c.getX(L+1),F=c.getX(L+2);r=Ps(this,g,e,i,d,f,p,M,A,F),r&&(r.faceIndex=Math.floor(L/3),r.face.materialIndex=x.materialIndex,t.push(r))}}else{const _=Math.max(0,m.start),b=Math.min(c.count,m.start+m.count);for(let x=_,g=b;x<g;x+=3){const w=c.getX(x),T=c.getX(x+1),L=c.getX(x+2);r=Ps(this,o,e,i,d,f,p,w,T,L),r&&(r.faceIndex=Math.floor(x/3),t.push(r))}}else if(l!==void 0)if(Array.isArray(o))for(let _=0,b=h.length;_<b;_++){const x=h[_],g=o[x.materialIndex],w=Math.max(x.start,m.start),T=Math.min(l.count,Math.min(x.start+x.count,m.start+m.count));for(let L=w,R=T;L<R;L+=3){const M=L,A=L+1,F=L+2;r=Ps(this,g,e,i,d,f,p,M,A,F),r&&(r.faceIndex=Math.floor(L/3),r.face.materialIndex=x.materialIndex,t.push(r))}}else{const _=Math.max(0,m.start),b=Math.min(l.count,m.start+m.count);for(let x=_,g=b;x<g;x+=3){const w=x,T=x+1,L=x+2;r=Ps(this,o,e,i,d,f,p,w,T,L),r&&(r.faceIndex=Math.floor(x/3),t.push(r))}}}}function Bp(n,e,t,i,r,s,o,c){let l;if(e.side===Xt?l=i.intersectTriangle(o,s,r,!0,c):l=i.intersectTriangle(r,s,o,e.side===ai,c),l===null)return null;Rs.copy(c),Rs.applyMatrix4(n.matrixWorld);const d=t.ray.origin.distanceTo(Rs);return d<t.near||d>t.far?null:{distance:d,point:Rs.clone(),object:n}}function Ps(n,e,t,i,r,s,o,c,l,d){n.getVertexPosition(c,Cs),n.getVertexPosition(l,ws),n.getVertexPosition(d,As);const f=Bp(n,e,t,i,Cs,ws,As,ed);if(f){const p=new k;gn.getBarycoord(ed,Cs,ws,As,p),r&&(f.uv=gn.getInterpolatedAttribute(r,c,l,d,p,new Oe)),s&&(f.uv1=gn.getInterpolatedAttribute(s,c,l,d,p,new Oe)),o&&(f.normal=gn.getInterpolatedAttribute(o,c,l,d,p,new k),f.normal.dot(i.direction)>0&&f.normal.multiplyScalar(-1));const h={a:c,b:l,c:d,normal:new k,materialIndex:0};gn.getNormal(Cs,ws,As,h.normal),f.face=h,f.barycoord=p}return f}class os extends dn{constructor(e=1,t=1,i=1,r=1,s=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:r,heightSegments:s,depthSegments:o};const c=this;r=Math.floor(r),s=Math.floor(s),o=Math.floor(o);const l=[],d=[],f=[],p=[];let h=0,m=0;_("z","y","x",-1,-1,i,t,e,o,s,0),_("z","y","x",1,-1,i,t,-e,o,s,1),_("x","z","y",1,1,e,i,t,r,o,2),_("x","z","y",1,-1,e,i,-t,r,o,3),_("x","y","z",1,-1,e,t,i,r,s,4),_("x","y","z",-1,-1,e,t,-i,r,s,5),this.setIndex(l),this.setAttribute("position",new Vt(d,3)),this.setAttribute("normal",new Vt(f,3)),this.setAttribute("uv",new Vt(p,2));function _(b,x,g,w,T,L,R,M,A,F,E){const v=L/A,P=R/F,O=L/2,B=R/2,W=M/2,H=A+1,X=F+1;let Q=0,$=0;const ie=new k;for(let ne=0;ne<X;ne++){const xe=ne*P-B;for(let je=0;je<H;je++){const tt=je*v-O;ie[b]=tt*w,ie[x]=xe*T,ie[g]=W,d.push(ie.x,ie.y,ie.z),ie[b]=0,ie[x]=0,ie[g]=M>0?1:-1,f.push(ie.x,ie.y,ie.z),p.push(je/A),p.push(1-ne/F),Q+=1}}for(let ne=0;ne<F;ne++)for(let xe=0;xe<A;xe++){const je=h+xe+H*ne,tt=h+xe+H*(ne+1),nt=h+(xe+1)+H*(ne+1),it=h+(xe+1)+H*ne;l.push(je,tt,it),l.push(tt,nt,it),$+=6}c.addGroup(m,$,E),m+=$,h+=Q}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new os(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}function mr(n){const e={};for(const t in n){e[t]={};for(const i in n[t]){const r=n[t][i];r&&(r.isColor||r.isMatrix3||r.isMatrix4||r.isVector2||r.isVector3||r.isVector4||r.isTexture||r.isQuaternion)?r.isRenderTargetTexture?(Fe("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=r.clone():Array.isArray(r)?e[t][i]=r.slice():e[t][i]=r}}return e}function Gt(n){const e={};for(let t=0;t<n.length;t++){const i=mr(n[t]);for(const r in i)e[r]=i[r]}return e}function Gp(n){const e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function Uu(n){const e=n.getRenderTarget();return e===null?n.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:Qe.workingColorSpace}const kp={clone:mr,merge:Gt};var zp=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Vp=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class jn extends yr{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=zp,this.fragmentShader=Vp,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=mr(e.uniforms),this.uniformsGroups=Gp(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const r in this.uniforms){const o=this.uniforms[r].value;o&&o.isTexture?t.uniforms[r]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[r]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[r]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[r]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[r]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[r]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[r]={type:"m4",value:o.toArray()}:t.uniforms[r]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const i={};for(const r in this.extensions)this.extensions[r]===!0&&(i[r]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}}class Ou extends Ft{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new St,this.projectionMatrix=new St,this.projectionMatrixInverse=new St,this.coordinateSystem=Cn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const Zn=new k,td=new Oe,nd=new Oe;class an extends Ou{constructor(e=50,t=1,i=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=gc*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(Js*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return gc*2*Math.atan(Math.tan(Js*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){Zn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Zn.x,Zn.y).multiplyScalar(-e/Zn.z),Zn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(Zn.x,Zn.y).multiplyScalar(-e/Zn.z)}getViewSize(e,t){return this.getViewBounds(e,td,nd),t.subVectors(nd,td)}setViewOffset(e,t,i,r,s,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(Js*.5*this.fov)/this.zoom,i=2*t,r=this.aspect*i,s=-.5*r;const o=this.view;if(this.view!==null&&this.view.enabled){const l=o.fullWidth,d=o.fullHeight;s+=o.offsetX*r/l,t-=o.offsetY*i/d,r*=o.width/l,i*=o.height/d}const c=this.filmOffset;c!==0&&(s+=e*c/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,t,t-i,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}const Yi=-90,Ki=1;class Hp extends Ft{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;const r=new an(Yi,Ki,e,t);r.layers=this.layers,this.add(r);const s=new an(Yi,Ki,e,t);s.layers=this.layers,this.add(s);const o=new an(Yi,Ki,e,t);o.layers=this.layers,this.add(o);const c=new an(Yi,Ki,e,t);c.layers=this.layers,this.add(c);const l=new an(Yi,Ki,e,t);l.layers=this.layers,this.add(l);const d=new an(Yi,Ki,e,t);d.layers=this.layers,this.add(d)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[i,r,s,o,c,l]=t;for(const d of t)this.remove(d);if(e===Cn)i.up.set(0,1,0),i.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),c.up.set(0,1,0),c.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===ha)i.up.set(0,-1,0),i.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),c.up.set(0,-1,0),c.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const d of t)this.add(d),d.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:i,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[s,o,c,l,d,f]=this.children,p=e.getRenderTarget(),h=e.getActiveCubeFace(),m=e.getActiveMipmapLevel(),_=e.xr.enabled;e.xr.enabled=!1;const b=i.texture.generateMipmaps;i.texture.generateMipmaps=!1,e.setRenderTarget(i,0,r),e.render(t,s),e.setRenderTarget(i,1,r),e.render(t,o),e.setRenderTarget(i,2,r),e.render(t,c),e.setRenderTarget(i,3,r),e.render(t,l),e.setRenderTarget(i,4,r),e.render(t,d),i.texture.generateMipmaps=b,e.setRenderTarget(i,5,r),e.render(t,f),e.setRenderTarget(p,h,m),e.xr.enabled=_,i.texture.needsPMREMUpdate=!0}}class Bu extends zt{constructor(e=[],t=fr,i,r,s,o,c,l,d,f){super(e,t,i,r,s,o,c,l,d,f),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class Wp extends Ai{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const i={width:e,height:e,depth:1},r=[i,i,i,i,i,i];this.texture=new Bu(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new os(5,5,5),s=new jn({name:"CubemapFromEquirect",uniforms:mr(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Xt,blending:Vn});s.uniforms.tEquirect.value=t;const o=new Pn(r,s),c=t.minFilter;return t.minFilter===Si&&(t.minFilter=cn),new Hp(1,10,this).update(e,o),t.minFilter=c,o.geometry.dispose(),o.material.dispose(),this}clear(e,t=!0,i=!0,r=!0){const s=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,i,r);e.setRenderTarget(s)}}class ir extends Ft{constructor(){super(),this.isGroup=!0,this.type="Group"}}const jp={type:"move"};class ao{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new ir,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new ir,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new k,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new k),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new ir,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new k,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new k),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let r=null,s=null,o=null;const c=this._targetRay,l=this._grip,d=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(d&&e.hand){o=!0;for(const b of e.hand.values()){const x=t.getJointPose(b,i),g=this._getHandJoint(d,b);x!==null&&(g.matrix.fromArray(x.transform.matrix),g.matrix.decompose(g.position,g.rotation,g.scale),g.matrixWorldNeedsUpdate=!0,g.jointRadius=x.radius),g.visible=x!==null}const f=d.joints["index-finger-tip"],p=d.joints["thumb-tip"],h=f.position.distanceTo(p.position),m=.02,_=.005;d.inputState.pinching&&h>m+_?(d.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!d.inputState.pinching&&h<=m-_&&(d.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(s=t.getPose(e.gripSpace,i),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1));c!==null&&(r=t.getPose(e.targetRaySpace,i),r===null&&s!==null&&(r=s),r!==null&&(c.matrix.fromArray(r.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,r.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(r.linearVelocity)):c.hasLinearVelocity=!1,r.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(r.angularVelocity)):c.hasAngularVelocity=!1,this.dispatchEvent(jp)))}return c!==null&&(c.visible=r!==null),l!==null&&(l.visible=s!==null),d!==null&&(d.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const i=new ir;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}}class $p extends Ft{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Rn,this.environmentIntensity=1,this.environmentRotation=new Rn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}}class Xp extends zt{constructor(e=null,t=1,i=1,r,s,o,c,l,d=en,f=en,p,h){super(null,o,c,l,d,f,r,s,p,h),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const oo=new k,qp=new k,Yp=new Ge;class ei{constructor(e=new k(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,r){return this.normal.set(e,t,i),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){const r=oo.subVectors(i,t).cross(qp.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){const i=e.delta(oo),r=this.normal.dot(i);if(r===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const s=-(e.start.dot(this.normal)+this.constant)/r;return s<0||s>1?null:t.copy(e.start).addScaledVector(i,s)}intersectsLine(e){const t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const i=t||Yp.getNormalMatrix(e),r=this.coplanarPoint(oo).applyMatrix4(e),s=this.normal.applyMatrix3(i).normalize();return this.constant=-r.dot(s),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const gi=new Ma,Kp=new Oe(.5,.5),Is=new k;class $c{constructor(e=new ei,t=new ei,i=new ei,r=new ei,s=new ei,o=new ei){this.planes=[e,t,i,r,s,o]}set(e,t,i,r,s,o){const c=this.planes;return c[0].copy(e),c[1].copy(t),c[2].copy(i),c[3].copy(r),c[4].copy(s),c[5].copy(o),this}copy(e){const t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=Cn,i=!1){const r=this.planes,s=e.elements,o=s[0],c=s[1],l=s[2],d=s[3],f=s[4],p=s[5],h=s[6],m=s[7],_=s[8],b=s[9],x=s[10],g=s[11],w=s[12],T=s[13],L=s[14],R=s[15];if(r[0].setComponents(d-o,m-f,g-_,R-w).normalize(),r[1].setComponents(d+o,m+f,g+_,R+w).normalize(),r[2].setComponents(d+c,m+p,g+b,R+T).normalize(),r[3].setComponents(d-c,m-p,g-b,R-T).normalize(),i)r[4].setComponents(l,h,x,L).normalize(),r[5].setComponents(d-l,m-h,g-x,R-L).normalize();else if(r[4].setComponents(d-l,m-h,g-x,R-L).normalize(),t===Cn)r[5].setComponents(d+l,m+h,g+x,R+L).normalize();else if(t===ha)r[5].setComponents(l,h,x,L).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),gi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),gi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(gi)}intersectsSprite(e){gi.center.set(0,0,0);const t=Kp.distanceTo(e.center);return gi.radius=.7071067811865476+t,gi.applyMatrix4(e.matrixWorld),this.intersectsSphere(gi)}intersectsSphere(e){const t=this.planes,i=e.center,r=-e.radius;for(let s=0;s<6;s++)if(t[s].distanceToPoint(i)<r)return!1;return!0}intersectsBox(e){const t=this.planes;for(let i=0;i<6;i++){const r=t[i];if(Is.x=r.normal.x>0?e.max.x:e.min.x,Is.y=r.normal.y>0?e.max.y:e.min.y,Is.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(Is)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class Xc extends yr{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new ze(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}}const ma=new k,ga=new k,id=new St,Fr=new Wc,Ds=new Ma,co=new k,rd=new k;class Jp extends Ft{constructor(e=new dn,t=new Xc){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,i=[0];for(let r=1,s=t.count;r<s;r++)ma.fromBufferAttribute(t,r-1),ga.fromBufferAttribute(t,r),i[r]=i[r-1],i[r]+=ma.distanceTo(ga);e.setAttribute("lineDistance",new Vt(i,1))}else Fe("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){const i=this.geometry,r=this.matrixWorld,s=e.params.Line.threshold,o=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Ds.copy(i.boundingSphere),Ds.applyMatrix4(r),Ds.radius+=s,e.ray.intersectsSphere(Ds)===!1)return;id.copy(r).invert(),Fr.copy(e.ray).applyMatrix4(id);const c=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=c*c,d=this.isLineSegments?2:1,f=i.index,h=i.attributes.position;if(f!==null){const m=Math.max(0,o.start),_=Math.min(f.count,o.start+o.count);for(let b=m,x=_-1;b<x;b+=d){const g=f.getX(b),w=f.getX(b+1),T=Fs(this,e,Fr,l,g,w,b);T&&t.push(T)}if(this.isLineLoop){const b=f.getX(_-1),x=f.getX(m),g=Fs(this,e,Fr,l,b,x,_-1);g&&t.push(g)}}else{const m=Math.max(0,o.start),_=Math.min(h.count,o.start+o.count);for(let b=m,x=_-1;b<x;b+=d){const g=Fs(this,e,Fr,l,b,b+1,b);g&&t.push(g)}if(this.isLineLoop){const b=Fs(this,e,Fr,l,_-1,m,_-1);b&&t.push(b)}}}updateMorphTargets(){const t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){const r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=r.length;s<o;s++){const c=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[c]=s}}}}}function Fs(n,e,t,i,r,s,o){const c=n.geometry.attributes.position;if(ma.fromBufferAttribute(c,r),ga.fromBufferAttribute(c,s),t.distanceSqToSegment(ma,ga,co,rd)>i)return;co.applyMatrix4(n.matrixWorld);const d=e.ray.origin.distanceTo(co);if(!(d<e.near||d>e.far))return{distance:d,point:rd.clone().applyMatrix4(n.matrixWorld),index:o,face:null,faceIndex:null,barycoord:null,object:n}}const sd=new k,ad=new k;class Zs extends Jp{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,i=[];for(let r=0,s=t.count;r<s;r+=2)sd.fromBufferAttribute(t,r),ad.fromBufferAttribute(t,r+1),i[r]=r===0?0:i[r-1],i[r+1]=i[r]+sd.distanceTo(ad);e.setAttribute("lineDistance",new Vt(i,1))}else Fe("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class Gu extends zt{constructor(e,t,i=Ci,r,s,o,c=en,l=en,d,f=Zr,p=1){if(f!==Zr&&f!==Qr)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const h={width:e,height:t,depth:p};super(h,r,s,o,c,l,f,i,d),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Hc(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}}class ku extends zt{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}}class qc extends dn{constructor(e=1,t=1,i=1,r=32,s=1,o=!1,c=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:i,radialSegments:r,heightSegments:s,openEnded:o,thetaStart:c,thetaLength:l};const d=this;r=Math.floor(r),s=Math.floor(s);const f=[],p=[],h=[],m=[];let _=0;const b=[],x=i/2;let g=0;w(),o===!1&&(e>0&&T(!0),t>0&&T(!1)),this.setIndex(f),this.setAttribute("position",new Vt(p,3)),this.setAttribute("normal",new Vt(h,3)),this.setAttribute("uv",new Vt(m,2));function w(){const L=new k,R=new k;let M=0;const A=(t-e)/i;for(let F=0;F<=s;F++){const E=[],v=F/s,P=v*(t-e)+e;for(let O=0;O<=r;O++){const B=O/r,W=B*l+c,H=Math.sin(W),X=Math.cos(W);R.x=P*H,R.y=-v*i+x,R.z=P*X,p.push(R.x,R.y,R.z),L.set(H,A,X).normalize(),h.push(L.x,L.y,L.z),m.push(B,1-v),E.push(_++)}b.push(E)}for(let F=0;F<r;F++)for(let E=0;E<s;E++){const v=b[E][F],P=b[E+1][F],O=b[E+1][F+1],B=b[E][F+1];(e>0||E!==0)&&(f.push(v,P,B),M+=3),(t>0||E!==s-1)&&(f.push(P,O,B),M+=3)}d.addGroup(g,M,0),g+=M}function T(L){const R=_,M=new Oe,A=new k;let F=0;const E=L===!0?e:t,v=L===!0?1:-1;for(let O=1;O<=r;O++)p.push(0,x*v,0),h.push(0,v,0),m.push(.5,.5),_++;const P=_;for(let O=0;O<=r;O++){const W=O/r*l+c,H=Math.cos(W),X=Math.sin(W);A.x=E*X,A.y=x*v,A.z=E*H,p.push(A.x,A.y,A.z),h.push(0,v,0),M.x=H*.5+.5,M.y=X*.5*v+.5,m.push(M.x,M.y),_++}for(let O=0;O<r;O++){const B=R+O,W=P+O;L===!0?f.push(W,W+1,B):f.push(W+1,W,B),F+=3}d.addGroup(g,F,L===!0?1:2),g+=F}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new qc(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class Yc extends qc{constructor(e=1,t=1,i=32,r=1,s=!1,o=0,c=Math.PI*2){super(0,e,t,i,r,s,o,c),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:i,heightSegments:r,openEnded:s,thetaStart:o,thetaLength:c}}static fromJSON(e){return new Yc(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class cs extends dn{constructor(e=1,t=1,i=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:r};const s=e/2,o=t/2,c=Math.floor(i),l=Math.floor(r),d=c+1,f=l+1,p=e/c,h=t/l,m=[],_=[],b=[],x=[];for(let g=0;g<f;g++){const w=g*h-o;for(let T=0;T<d;T++){const L=T*p-s;_.push(L,-w,0),b.push(0,0,1),x.push(T/c),x.push(1-g/l)}}for(let g=0;g<l;g++)for(let w=0;w<c;w++){const T=w+d*g,L=w+d*(g+1),R=w+1+d*(g+1),M=w+1+d*g;m.push(T,L,M),m.push(L,R,M)}this.setIndex(m),this.setAttribute("position",new Vt(_,3)),this.setAttribute("normal",new Vt(b,3)),this.setAttribute("uv",new Vt(x,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new cs(e.width,e.height,e.widthSegments,e.heightSegments)}}class Zp extends yr{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new ze(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new ze(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Au,this.normalScale=new Oe(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Rn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class Qp extends yr{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=cp,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class em extends yr{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}class zu extends Ft{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new ze(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}}const lo=new St,od=new k,cd=new k;class tm{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Oe(512,512),this.mapType=Ln,this.map=null,this.mapPass=null,this.matrix=new St,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new $c,this._frameExtents=new Oe(1,1),this._viewportCount=1,this._viewports=[new vt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){const t=this.camera,i=this.matrix;od.setFromMatrixPosition(e.matrixWorld),t.position.copy(od),cd.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(cd),t.updateMatrixWorld(),lo.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(lo,t.coordinateSystem,t.reversedDepth),t.reversedDepth?i.set(.5,0,0,.5,0,.5,0,.5,0,0,1,0,0,0,0,1):i.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),i.multiply(lo)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}class Vu extends Ou{constructor(e=-1,t=1,i=1,r=-1,s=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=r,this.near=s,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,r,s,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,r=(this.top+this.bottom)/2;let s=i-e,o=i+e,c=r+t,l=r-t;if(this.view!==null&&this.view.enabled){const d=(this.right-this.left)/this.view.fullWidth/this.zoom,f=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=d*this.view.offsetX,o=s+d*this.view.width,c-=f*this.view.offsetY,l=c-f*this.view.height}this.projectionMatrix.makeOrthographic(s,o,c,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}class nm extends tm{constructor(){super(new Vu(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class ld extends zu{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Ft.DEFAULT_UP),this.updateMatrix(),this.target=new Ft,this.shadow=new nm}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}}class im extends zu{constructor(e,t){super(e,t),this.isAmbientLight=!0,this.type="AmbientLight"}}class rm extends an{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}}class dd{constructor(e=1,t=0,i=0){this.radius=e,this.phi=t,this.theta=i}set(e,t,i){return this.radius=e,this.phi=t,this.theta=i,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=We(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,i){return this.radius=Math.sqrt(e*e+t*t+i*i),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,i),this.phi=Math.acos(We(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}}class Hu extends Zs{constructor(e=10,t=10,i=4473924,r=8947848){i=new ze(i),r=new ze(r);const s=t/2,o=e/t,c=e/2,l=[],d=[];for(let h=0,m=0,_=-c;h<=t;h++,_+=o){l.push(-c,0,_,c,0,_),l.push(_,0,-c,_,0,c);const b=h===s?i:r;b.toArray(d,m),m+=3,b.toArray(d,m),m+=3,b.toArray(d,m),m+=3,b.toArray(d,m),m+=3}const f=new dn;f.setAttribute("position",new Vt(l,3)),f.setAttribute("color",new Vt(d,3));const p=new Xc({vertexColors:!0,toneMapped:!1});super(f,p),this.type="GridHelper"}dispose(){this.geometry.dispose(),this.material.dispose()}}class sm extends Ii{constructor(e,t=null){super(),this.object=e,this.domElement=t,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(e){if(e===void 0){Fe("Controls: connect() now requires an element.");return}this.domElement!==null&&this.disconnect(),this.domElement=e}disconnect(){}dispose(){}update(){}}function ud(n,e,t,i){const r=am(i);switch(t){case Tu:return n*e;case wu:return n*e/r.components*r.byteLength;case Gc:return n*e/r.components*r.byteLength;case kc:return n*e*2/r.components*r.byteLength;case zc:return n*e*2/r.components*r.byteLength;case Cu:return n*e*3/r.components*r.byteLength;case xn:return n*e*4/r.components*r.byteLength;case Vc:return n*e*4/r.components*r.byteLength;case Xs:case qs:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case Ys:case Ks:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Ho:case jo:return Math.max(n,16)*Math.max(e,8)/4;case Vo:case Wo:return Math.max(n,8)*Math.max(e,8)/2;case $o:case Xo:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case qo:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Yo:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Ko:return Math.floor((n+4)/5)*Math.floor((e+3)/4)*16;case Jo:return Math.floor((n+4)/5)*Math.floor((e+4)/5)*16;case Zo:return Math.floor((n+5)/6)*Math.floor((e+4)/5)*16;case Qo:return Math.floor((n+5)/6)*Math.floor((e+5)/6)*16;case ec:return Math.floor((n+7)/8)*Math.floor((e+4)/5)*16;case tc:return Math.floor((n+7)/8)*Math.floor((e+5)/6)*16;case nc:return Math.floor((n+7)/8)*Math.floor((e+7)/8)*16;case ic:return Math.floor((n+9)/10)*Math.floor((e+4)/5)*16;case rc:return Math.floor((n+9)/10)*Math.floor((e+5)/6)*16;case sc:return Math.floor((n+9)/10)*Math.floor((e+7)/8)*16;case ac:return Math.floor((n+9)/10)*Math.floor((e+9)/10)*16;case oc:return Math.floor((n+11)/12)*Math.floor((e+9)/10)*16;case cc:return Math.floor((n+11)/12)*Math.floor((e+11)/12)*16;case lc:case dc:case uc:return Math.ceil(n/4)*Math.ceil(e/4)*16;case fc:case hc:return Math.ceil(n/4)*Math.ceil(e/4)*8;case pc:case mc:return Math.ceil(n/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function am(n){switch(n){case Ln:case vu:return{byteLength:1,components:1};case Kr:case Su:case br:return{byteLength:2,components:1};case Oc:case Bc:return{byteLength:2,components:4};case Ci:case Uc:case zn:return{byteLength:4,components:1};case Eu:case Mu:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${n}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Nc}}));typeof window<"u"&&(window.__THREE__?Fe("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Nc);function Wu(){let n=null,e=!1,t=null,i=null;function r(s,o){t(s,o),i=n.requestAnimationFrame(r)}return{start:function(){e!==!0&&t!==null&&(i=n.requestAnimationFrame(r),e=!0)},stop:function(){n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(s){t=s},setContext:function(s){n=s}}}function om(n){const e=new WeakMap;function t(c,l){const d=c.array,f=c.usage,p=d.byteLength,h=n.createBuffer();n.bindBuffer(l,h),n.bufferData(l,d,f),c.onUploadCallback();let m;if(d instanceof Float32Array)m=n.FLOAT;else if(typeof Float16Array<"u"&&d instanceof Float16Array)m=n.HALF_FLOAT;else if(d instanceof Uint16Array)c.isFloat16BufferAttribute?m=n.HALF_FLOAT:m=n.UNSIGNED_SHORT;else if(d instanceof Int16Array)m=n.SHORT;else if(d instanceof Uint32Array)m=n.UNSIGNED_INT;else if(d instanceof Int32Array)m=n.INT;else if(d instanceof Int8Array)m=n.BYTE;else if(d instanceof Uint8Array)m=n.UNSIGNED_BYTE;else if(d instanceof Uint8ClampedArray)m=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+d);return{buffer:h,type:m,bytesPerElement:d.BYTES_PER_ELEMENT,version:c.version,size:p}}function i(c,l,d){const f=l.array,p=l.updateRanges;if(n.bindBuffer(d,c),p.length===0)n.bufferSubData(d,0,f);else{p.sort((m,_)=>m.start-_.start);let h=0;for(let m=1;m<p.length;m++){const _=p[h],b=p[m];b.start<=_.start+_.count+1?_.count=Math.max(_.count,b.start+b.count-_.start):(++h,p[h]=b)}p.length=h+1;for(let m=0,_=p.length;m<_;m++){const b=p[m];n.bufferSubData(d,b.start*f.BYTES_PER_ELEMENT,f,b.start,b.count)}l.clearUpdateRanges()}l.onUploadCallback()}function r(c){return c.isInterleavedBufferAttribute&&(c=c.data),e.get(c)}function s(c){c.isInterleavedBufferAttribute&&(c=c.data);const l=e.get(c);l&&(n.deleteBuffer(l.buffer),e.delete(c))}function o(c,l){if(c.isInterleavedBufferAttribute&&(c=c.data),c.isGLBufferAttribute){const f=e.get(c);(!f||f.version<c.version)&&e.set(c,{buffer:c.buffer,type:c.type,bytesPerElement:c.elementSize,version:c.version});return}const d=e.get(c);if(d===void 0)e.set(c,t(c,l));else if(d.version<c.version){if(d.size!==c.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(d.buffer,c,l),d.version=c.version}}return{get:r,remove:s,update:o}}var cm=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,lm=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,dm=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,um=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,fm=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,hm=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,pm=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,mm=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,gm=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,xm=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,_m=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,bm=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,ym=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,vm=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Sm=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Em=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,Mm=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Tm=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Cm=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,wm=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Am=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Lm=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,Rm=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,Pm=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Im=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Dm=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,Fm=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Nm=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Um=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Om=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Bm="gl_FragColor = linearToOutputTexel( gl_FragColor );",Gm=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,km=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,zm=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,Vm=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Hm=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Wm=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,jm=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,$m=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Xm=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,qm=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Ym=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Km=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Jm=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Zm=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Qm=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,eg=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,tg=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,ng=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,ig=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,rg=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,sg=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,ag=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 uv = vec2( roughness, dotNV );
	return texture2D( dfgLUT, uv ).rg;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
vec3 BRDF_GGX_Multiscatter( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 singleScatter = BRDF_GGX( lightDir, viewDir, normal, material );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 dfgV = DFGApprox( vec3(0.0, 0.0, 1.0), vec3(sqrt(1.0 - dotNV * dotNV), 0.0, dotNV), material.roughness );
	vec2 dfgL = DFGApprox( vec3(0.0, 0.0, 1.0), vec3(sqrt(1.0 - dotNL * dotNL), 0.0, dotNL), material.roughness );
	vec3 FssEss_V = material.specularColor * dfgV.x + material.specularF90 * dfgV.y;
	vec3 FssEss_L = material.specularColor * dfgL.x + material.specularF90 * dfgL.y;
	float Ess_V = dfgV.x + dfgV.y;
	float Ess_L = dfgL.x + dfgL.y;
	float Ems_V = 1.0 - Ess_V;
	float Ems_L = 1.0 - Ess_L;
	vec3 Favg = material.specularColor + ( 1.0 - material.specularColor ) * 0.047619;
	vec3 Fms = FssEss_V * FssEss_L * Favg / ( 1.0 - Ems_V * Ems_L * Favg * Favg + EPSILON );
	float compensationFactor = Ems_V * Ems_L;
	vec3 multiScatter = Fms * compensationFactor;
	return singleScatter + multiScatter;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX_Multiscatter( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,og=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,cg=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,lg=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,dg=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,ug=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,fg=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,hg=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,pg=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,mg=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,gg=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,xg=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,_g=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,bg=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,yg=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,vg=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Sg=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Eg=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Mg=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Tg=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Cg=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,wg=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Ag=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Lg=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Rg=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Pg=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Ig=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Dg=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Fg=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Ng=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Ug=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,Og=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Bg=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Gg=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,kg=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,zg=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Vg=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Hg=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		float depth = unpackRGBAToDepth( texture2D( depths, uv ) );
		#ifdef USE_REVERSED_DEPTH_BUFFER
			return step( depth, compare );
		#else
			return step( compare, depth );
		#endif
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow( sampler2D shadow, vec2 uv, float compare ) {
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		#ifdef USE_REVERSED_DEPTH_BUFFER
			float hard_shadow = step( distribution.x, compare );
		#else
			float hard_shadow = step( compare, distribution.x );
		#endif
		if ( hard_shadow != 1.0 ) {
			float distance = compare - distribution.x;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,Wg=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,jg=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,$g=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Xg=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,qg=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Yg=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Kg=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Jg=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Zg=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Qg=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,e0=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,t0=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,n0=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,i0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,r0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,s0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,a0=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const o0=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,c0=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,l0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,d0=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,u0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,f0=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,h0=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,p0=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,m0=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,g0=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,x0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,_0=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,b0=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,y0=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,v0=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,S0=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,E0=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,M0=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,T0=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,C0=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,w0=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,A0=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,L0=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,R0=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,P0=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,I0=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,D0=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,F0=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,N0=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,U0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,O0=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,B0=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,G0=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,k0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Ve={alphahash_fragment:cm,alphahash_pars_fragment:lm,alphamap_fragment:dm,alphamap_pars_fragment:um,alphatest_fragment:fm,alphatest_pars_fragment:hm,aomap_fragment:pm,aomap_pars_fragment:mm,batching_pars_vertex:gm,batching_vertex:xm,begin_vertex:_m,beginnormal_vertex:bm,bsdfs:ym,iridescence_fragment:vm,bumpmap_pars_fragment:Sm,clipping_planes_fragment:Em,clipping_planes_pars_fragment:Mm,clipping_planes_pars_vertex:Tm,clipping_planes_vertex:Cm,color_fragment:wm,color_pars_fragment:Am,color_pars_vertex:Lm,color_vertex:Rm,common:Pm,cube_uv_reflection_fragment:Im,defaultnormal_vertex:Dm,displacementmap_pars_vertex:Fm,displacementmap_vertex:Nm,emissivemap_fragment:Um,emissivemap_pars_fragment:Om,colorspace_fragment:Bm,colorspace_pars_fragment:Gm,envmap_fragment:km,envmap_common_pars_fragment:zm,envmap_pars_fragment:Vm,envmap_pars_vertex:Hm,envmap_physical_pars_fragment:eg,envmap_vertex:Wm,fog_vertex:jm,fog_pars_vertex:$m,fog_fragment:Xm,fog_pars_fragment:qm,gradientmap_pars_fragment:Ym,lightmap_pars_fragment:Km,lights_lambert_fragment:Jm,lights_lambert_pars_fragment:Zm,lights_pars_begin:Qm,lights_toon_fragment:tg,lights_toon_pars_fragment:ng,lights_phong_fragment:ig,lights_phong_pars_fragment:rg,lights_physical_fragment:sg,lights_physical_pars_fragment:ag,lights_fragment_begin:og,lights_fragment_maps:cg,lights_fragment_end:lg,logdepthbuf_fragment:dg,logdepthbuf_pars_fragment:ug,logdepthbuf_pars_vertex:fg,logdepthbuf_vertex:hg,map_fragment:pg,map_pars_fragment:mg,map_particle_fragment:gg,map_particle_pars_fragment:xg,metalnessmap_fragment:_g,metalnessmap_pars_fragment:bg,morphinstance_vertex:yg,morphcolor_vertex:vg,morphnormal_vertex:Sg,morphtarget_pars_vertex:Eg,morphtarget_vertex:Mg,normal_fragment_begin:Tg,normal_fragment_maps:Cg,normal_pars_fragment:wg,normal_pars_vertex:Ag,normal_vertex:Lg,normalmap_pars_fragment:Rg,clearcoat_normal_fragment_begin:Pg,clearcoat_normal_fragment_maps:Ig,clearcoat_pars_fragment:Dg,iridescence_pars_fragment:Fg,opaque_fragment:Ng,packing:Ug,premultiplied_alpha_fragment:Og,project_vertex:Bg,dithering_fragment:Gg,dithering_pars_fragment:kg,roughnessmap_fragment:zg,roughnessmap_pars_fragment:Vg,shadowmap_pars_fragment:Hg,shadowmap_pars_vertex:Wg,shadowmap_vertex:jg,shadowmask_pars_fragment:$g,skinbase_vertex:Xg,skinning_pars_vertex:qg,skinning_vertex:Yg,skinnormal_vertex:Kg,specularmap_fragment:Jg,specularmap_pars_fragment:Zg,tonemapping_fragment:Qg,tonemapping_pars_fragment:e0,transmission_fragment:t0,transmission_pars_fragment:n0,uv_pars_fragment:i0,uv_pars_vertex:r0,uv_vertex:s0,worldpos_vertex:a0,background_vert:o0,background_frag:c0,backgroundCube_vert:l0,backgroundCube_frag:d0,cube_vert:u0,cube_frag:f0,depth_vert:h0,depth_frag:p0,distanceRGBA_vert:m0,distanceRGBA_frag:g0,equirect_vert:x0,equirect_frag:_0,linedashed_vert:b0,linedashed_frag:y0,meshbasic_vert:v0,meshbasic_frag:S0,meshlambert_vert:E0,meshlambert_frag:M0,meshmatcap_vert:T0,meshmatcap_frag:C0,meshnormal_vert:w0,meshnormal_frag:A0,meshphong_vert:L0,meshphong_frag:R0,meshphysical_vert:P0,meshphysical_frag:I0,meshtoon_vert:D0,meshtoon_frag:F0,points_vert:N0,points_frag:U0,shadow_vert:O0,shadow_frag:B0,sprite_vert:G0,sprite_frag:k0},ce={common:{diffuse:{value:new ze(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Ge},alphaMap:{value:null},alphaMapTransform:{value:new Ge},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Ge}},envmap:{envMap:{value:null},envMapRotation:{value:new Ge},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Ge}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Ge}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Ge},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Ge},normalScale:{value:new Oe(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Ge},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Ge}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Ge}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Ge}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new ze(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new ze(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Ge},alphaTest:{value:0},uvTransform:{value:new Ge}},sprite:{diffuse:{value:new ze(16777215)},opacity:{value:1},center:{value:new Oe(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Ge},alphaMap:{value:null},alphaMapTransform:{value:new Ge},alphaTest:{value:0}}},En={basic:{uniforms:Gt([ce.common,ce.specularmap,ce.envmap,ce.aomap,ce.lightmap,ce.fog]),vertexShader:Ve.meshbasic_vert,fragmentShader:Ve.meshbasic_frag},lambert:{uniforms:Gt([ce.common,ce.specularmap,ce.envmap,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.fog,ce.lights,{emissive:{value:new ze(0)}}]),vertexShader:Ve.meshlambert_vert,fragmentShader:Ve.meshlambert_frag},phong:{uniforms:Gt([ce.common,ce.specularmap,ce.envmap,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.fog,ce.lights,{emissive:{value:new ze(0)},specular:{value:new ze(1118481)},shininess:{value:30}}]),vertexShader:Ve.meshphong_vert,fragmentShader:Ve.meshphong_frag},standard:{uniforms:Gt([ce.common,ce.envmap,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.roughnessmap,ce.metalnessmap,ce.fog,ce.lights,{emissive:{value:new ze(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ve.meshphysical_vert,fragmentShader:Ve.meshphysical_frag},toon:{uniforms:Gt([ce.common,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.gradientmap,ce.fog,ce.lights,{emissive:{value:new ze(0)}}]),vertexShader:Ve.meshtoon_vert,fragmentShader:Ve.meshtoon_frag},matcap:{uniforms:Gt([ce.common,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.fog,{matcap:{value:null}}]),vertexShader:Ve.meshmatcap_vert,fragmentShader:Ve.meshmatcap_frag},points:{uniforms:Gt([ce.points,ce.fog]),vertexShader:Ve.points_vert,fragmentShader:Ve.points_frag},dashed:{uniforms:Gt([ce.common,ce.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ve.linedashed_vert,fragmentShader:Ve.linedashed_frag},depth:{uniforms:Gt([ce.common,ce.displacementmap]),vertexShader:Ve.depth_vert,fragmentShader:Ve.depth_frag},normal:{uniforms:Gt([ce.common,ce.bumpmap,ce.normalmap,ce.displacementmap,{opacity:{value:1}}]),vertexShader:Ve.meshnormal_vert,fragmentShader:Ve.meshnormal_frag},sprite:{uniforms:Gt([ce.sprite,ce.fog]),vertexShader:Ve.sprite_vert,fragmentShader:Ve.sprite_frag},background:{uniforms:{uvTransform:{value:new Ge},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ve.background_vert,fragmentShader:Ve.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Ge}},vertexShader:Ve.backgroundCube_vert,fragmentShader:Ve.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ve.cube_vert,fragmentShader:Ve.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ve.equirect_vert,fragmentShader:Ve.equirect_frag},distanceRGBA:{uniforms:Gt([ce.common,ce.displacementmap,{referencePosition:{value:new k},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ve.distanceRGBA_vert,fragmentShader:Ve.distanceRGBA_frag},shadow:{uniforms:Gt([ce.lights,ce.fog,{color:{value:new ze(0)},opacity:{value:1}}]),vertexShader:Ve.shadow_vert,fragmentShader:Ve.shadow_frag}};En.physical={uniforms:Gt([En.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Ge},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Ge},clearcoatNormalScale:{value:new Oe(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Ge},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Ge},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Ge},sheen:{value:0},sheenColor:{value:new ze(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Ge},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Ge},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Ge},transmissionSamplerSize:{value:new Oe},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Ge},attenuationDistance:{value:0},attenuationColor:{value:new ze(0)},specularColor:{value:new ze(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Ge},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Ge},anisotropyVector:{value:new Oe},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Ge}}]),vertexShader:Ve.meshphysical_vert,fragmentShader:Ve.meshphysical_frag};const Ns={r:0,b:0,g:0},xi=new Rn,z0=new St;function V0(n,e,t,i,r,s,o){const c=new ze(0);let l=s===!0?0:1,d,f,p=null,h=0,m=null;function _(T){let L=T.isScene===!0?T.background:null;return L&&L.isTexture&&(L=(T.backgroundBlurriness>0?t:e).get(L)),L}function b(T){let L=!1;const R=_(T);R===null?g(c,l):R&&R.isColor&&(g(R,1),L=!0);const M=n.xr.getEnvironmentBlendMode();M==="additive"?i.buffers.color.setClear(0,0,0,1,o):M==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,o),(n.autoClear||L)&&(i.buffers.depth.setTest(!0),i.buffers.depth.setMask(!0),i.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function x(T,L){const R=_(L);R&&(R.isCubeTexture||R.mapping===Ea)?(f===void 0&&(f=new Pn(new os(1,1,1),new jn({name:"BackgroundCubeMaterial",uniforms:mr(En.backgroundCube.uniforms),vertexShader:En.backgroundCube.vertexShader,fragmentShader:En.backgroundCube.fragmentShader,side:Xt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),f.geometry.deleteAttribute("normal"),f.geometry.deleteAttribute("uv"),f.onBeforeRender=function(M,A,F){this.matrixWorld.copyPosition(F.matrixWorld)},Object.defineProperty(f.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(f)),xi.copy(L.backgroundRotation),xi.x*=-1,xi.y*=-1,xi.z*=-1,R.isCubeTexture&&R.isRenderTargetTexture===!1&&(xi.y*=-1,xi.z*=-1),f.material.uniforms.envMap.value=R,f.material.uniforms.flipEnvMap.value=R.isCubeTexture&&R.isRenderTargetTexture===!1?-1:1,f.material.uniforms.backgroundBlurriness.value=L.backgroundBlurriness,f.material.uniforms.backgroundIntensity.value=L.backgroundIntensity,f.material.uniforms.backgroundRotation.value.setFromMatrix4(z0.makeRotationFromEuler(xi)),f.material.toneMapped=Qe.getTransfer(R.colorSpace)!==at,(p!==R||h!==R.version||m!==n.toneMapping)&&(f.material.needsUpdate=!0,p=R,h=R.version,m=n.toneMapping),f.layers.enableAll(),T.unshift(f,f.geometry,f.material,0,0,null)):R&&R.isTexture&&(d===void 0&&(d=new Pn(new cs(2,2),new jn({name:"BackgroundMaterial",uniforms:mr(En.background.uniforms),vertexShader:En.background.vertexShader,fragmentShader:En.background.fragmentShader,side:ai,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),d.geometry.deleteAttribute("normal"),Object.defineProperty(d.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(d)),d.material.uniforms.t2D.value=R,d.material.uniforms.backgroundIntensity.value=L.backgroundIntensity,d.material.toneMapped=Qe.getTransfer(R.colorSpace)!==at,R.matrixAutoUpdate===!0&&R.updateMatrix(),d.material.uniforms.uvTransform.value.copy(R.matrix),(p!==R||h!==R.version||m!==n.toneMapping)&&(d.material.needsUpdate=!0,p=R,h=R.version,m=n.toneMapping),d.layers.enableAll(),T.unshift(d,d.geometry,d.material,0,0,null))}function g(T,L){T.getRGB(Ns,Uu(n)),i.buffers.color.setClear(Ns.r,Ns.g,Ns.b,L,o)}function w(){f!==void 0&&(f.geometry.dispose(),f.material.dispose(),f=void 0),d!==void 0&&(d.geometry.dispose(),d.material.dispose(),d=void 0)}return{getClearColor:function(){return c},setClearColor:function(T,L=1){c.set(T),l=L,g(c,l)},getClearAlpha:function(){return l},setClearAlpha:function(T){l=T,g(c,l)},render:b,addToRenderList:x,dispose:w}}function H0(n,e){const t=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},r=h(null);let s=r,o=!1;function c(v,P,O,B,W){let H=!1;const X=p(B,O,P);s!==X&&(s=X,d(s.object)),H=m(v,B,O,W),H&&_(v,B,O,W),W!==null&&e.update(W,n.ELEMENT_ARRAY_BUFFER),(H||o)&&(o=!1,L(v,P,O,B),W!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(W).buffer))}function l(){return n.createVertexArray()}function d(v){return n.bindVertexArray(v)}function f(v){return n.deleteVertexArray(v)}function p(v,P,O){const B=O.wireframe===!0;let W=i[v.id];W===void 0&&(W={},i[v.id]=W);let H=W[P.id];H===void 0&&(H={},W[P.id]=H);let X=H[B];return X===void 0&&(X=h(l()),H[B]=X),X}function h(v){const P=[],O=[],B=[];for(let W=0;W<t;W++)P[W]=0,O[W]=0,B[W]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:P,enabledAttributes:O,attributeDivisors:B,object:v,attributes:{},index:null}}function m(v,P,O,B){const W=s.attributes,H=P.attributes;let X=0;const Q=O.getAttributes();for(const $ in Q)if(Q[$].location>=0){const ne=W[$];let xe=H[$];if(xe===void 0&&($==="instanceMatrix"&&v.instanceMatrix&&(xe=v.instanceMatrix),$==="instanceColor"&&v.instanceColor&&(xe=v.instanceColor)),ne===void 0||ne.attribute!==xe||xe&&ne.data!==xe.data)return!0;X++}return s.attributesNum!==X||s.index!==B}function _(v,P,O,B){const W={},H=P.attributes;let X=0;const Q=O.getAttributes();for(const $ in Q)if(Q[$].location>=0){let ne=H[$];ne===void 0&&($==="instanceMatrix"&&v.instanceMatrix&&(ne=v.instanceMatrix),$==="instanceColor"&&v.instanceColor&&(ne=v.instanceColor));const xe={};xe.attribute=ne,ne&&ne.data&&(xe.data=ne.data),W[$]=xe,X++}s.attributes=W,s.attributesNum=X,s.index=B}function b(){const v=s.newAttributes;for(let P=0,O=v.length;P<O;P++)v[P]=0}function x(v){g(v,0)}function g(v,P){const O=s.newAttributes,B=s.enabledAttributes,W=s.attributeDivisors;O[v]=1,B[v]===0&&(n.enableVertexAttribArray(v),B[v]=1),W[v]!==P&&(n.vertexAttribDivisor(v,P),W[v]=P)}function w(){const v=s.newAttributes,P=s.enabledAttributes;for(let O=0,B=P.length;O<B;O++)P[O]!==v[O]&&(n.disableVertexAttribArray(O),P[O]=0)}function T(v,P,O,B,W,H,X){X===!0?n.vertexAttribIPointer(v,P,O,W,H):n.vertexAttribPointer(v,P,O,B,W,H)}function L(v,P,O,B){b();const W=B.attributes,H=O.getAttributes(),X=P.defaultAttributeValues;for(const Q in H){const $=H[Q];if($.location>=0){let ie=W[Q];if(ie===void 0&&(Q==="instanceMatrix"&&v.instanceMatrix&&(ie=v.instanceMatrix),Q==="instanceColor"&&v.instanceColor&&(ie=v.instanceColor)),ie!==void 0){const ne=ie.normalized,xe=ie.itemSize,je=e.get(ie);if(je===void 0)continue;const tt=je.buffer,nt=je.type,it=je.bytesPerElement,q=nt===n.INT||nt===n.UNSIGNED_INT||ie.gpuType===Uc;if(ie.isInterleavedBufferAttribute){const J=ie.data,me=J.stride,De=ie.offset;if(J.isInstancedInterleavedBuffer){for(let ve=0;ve<$.locationSize;ve++)g($.location+ve,J.meshPerAttribute);v.isInstancedMesh!==!0&&B._maxInstanceCount===void 0&&(B._maxInstanceCount=J.meshPerAttribute*J.count)}else for(let ve=0;ve<$.locationSize;ve++)x($.location+ve);n.bindBuffer(n.ARRAY_BUFFER,tt);for(let ve=0;ve<$.locationSize;ve++)T($.location+ve,xe/$.locationSize,nt,ne,me*it,(De+xe/$.locationSize*ve)*it,q)}else{if(ie.isInstancedBufferAttribute){for(let J=0;J<$.locationSize;J++)g($.location+J,ie.meshPerAttribute);v.isInstancedMesh!==!0&&B._maxInstanceCount===void 0&&(B._maxInstanceCount=ie.meshPerAttribute*ie.count)}else for(let J=0;J<$.locationSize;J++)x($.location+J);n.bindBuffer(n.ARRAY_BUFFER,tt);for(let J=0;J<$.locationSize;J++)T($.location+J,xe/$.locationSize,nt,ne,xe*it,xe/$.locationSize*J*it,q)}}else if(X!==void 0){const ne=X[Q];if(ne!==void 0)switch(ne.length){case 2:n.vertexAttrib2fv($.location,ne);break;case 3:n.vertexAttrib3fv($.location,ne);break;case 4:n.vertexAttrib4fv($.location,ne);break;default:n.vertexAttrib1fv($.location,ne)}}}}w()}function R(){F();for(const v in i){const P=i[v];for(const O in P){const B=P[O];for(const W in B)f(B[W].object),delete B[W];delete P[O]}delete i[v]}}function M(v){if(i[v.id]===void 0)return;const P=i[v.id];for(const O in P){const B=P[O];for(const W in B)f(B[W].object),delete B[W];delete P[O]}delete i[v.id]}function A(v){for(const P in i){const O=i[P];if(O[v.id]===void 0)continue;const B=O[v.id];for(const W in B)f(B[W].object),delete B[W];delete O[v.id]}}function F(){E(),o=!0,s!==r&&(s=r,d(s.object))}function E(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:c,reset:F,resetDefaultState:E,dispose:R,releaseStatesOfGeometry:M,releaseStatesOfProgram:A,initAttributes:b,enableAttribute:x,disableUnusedAttributes:w}}function W0(n,e,t){let i;function r(d){i=d}function s(d,f){n.drawArrays(i,d,f),t.update(f,i,1)}function o(d,f,p){p!==0&&(n.drawArraysInstanced(i,d,f,p),t.update(f,i,p))}function c(d,f,p){if(p===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,d,0,f,0,p);let m=0;for(let _=0;_<p;_++)m+=f[_];t.update(m,i,1)}function l(d,f,p,h){if(p===0)return;const m=e.get("WEBGL_multi_draw");if(m===null)for(let _=0;_<d.length;_++)o(d[_],f[_],h[_]);else{m.multiDrawArraysInstancedWEBGL(i,d,0,f,0,h,0,p);let _=0;for(let b=0;b<p;b++)_+=f[b]*h[b];t.update(_,i,1)}}this.setMode=r,this.render=s,this.renderInstances=o,this.renderMultiDraw=c,this.renderMultiDrawInstances=l}function j0(n,e,t,i){let r;function s(){if(r!==void 0)return r;if(e.has("EXT_texture_filter_anisotropic")===!0){const A=e.get("EXT_texture_filter_anisotropic");r=n.getParameter(A.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function o(A){return!(A!==xn&&i.convert(A)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function c(A){const F=A===br&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(A!==Ln&&i.convert(A)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE)&&A!==zn&&!F)}function l(A){if(A==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";A="mediump"}return A==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let d=t.precision!==void 0?t.precision:"highp";const f=l(d);f!==d&&(Fe("WebGLRenderer:",d,"not supported, using",f,"instead."),d=f);const p=t.logarithmicDepthBuffer===!0,h=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control"),m=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),_=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),b=n.getParameter(n.MAX_TEXTURE_SIZE),x=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),g=n.getParameter(n.MAX_VERTEX_ATTRIBS),w=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),T=n.getParameter(n.MAX_VARYING_VECTORS),L=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),R=_>0,M=n.getParameter(n.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:c,precision:d,logarithmicDepthBuffer:p,reversedDepthBuffer:h,maxTextures:m,maxVertexTextures:_,maxTextureSize:b,maxCubemapSize:x,maxAttributes:g,maxVertexUniforms:w,maxVaryings:T,maxFragmentUniforms:L,vertexTextures:R,maxSamples:M}}function $0(n){const e=this;let t=null,i=0,r=!1,s=!1;const o=new ei,c=new Ge,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(p,h){const m=p.length!==0||h||i!==0||r;return r=h,i=p.length,m},this.beginShadows=function(){s=!0,f(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(p,h){t=f(p,h,0)},this.setState=function(p,h,m){const _=p.clippingPlanes,b=p.clipIntersection,x=p.clipShadows,g=n.get(p);if(!r||_===null||_.length===0||s&&!x)s?f(null):d();else{const w=s?0:i,T=w*4;let L=g.clippingState||null;l.value=L,L=f(_,h,T,m);for(let R=0;R!==T;++R)L[R]=t[R];g.clippingState=L,this.numIntersection=b?this.numPlanes:0,this.numPlanes+=w}};function d(){l.value!==t&&(l.value=t,l.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function f(p,h,m,_){const b=p!==null?p.length:0;let x=null;if(b!==0){if(x=l.value,_!==!0||x===null){const g=m+b*4,w=h.matrixWorldInverse;c.getNormalMatrix(w),(x===null||x.length<g)&&(x=new Float32Array(g));for(let T=0,L=m;T!==b;++T,L+=4)o.copy(p[T]).applyMatrix4(w,c),o.normal.toArray(x,L),x[L+3]=o.constant}l.value=x,l.needsUpdate=!0}return e.numPlanes=b,e.numIntersection=0,x}}function X0(n){let e=new WeakMap;function t(o,c){return c===Bo?o.mapping=fr:c===Go&&(o.mapping=hr),o}function i(o){if(o&&o.isTexture){const c=o.mapping;if(c===Bo||c===Go)if(e.has(o)){const l=e.get(o).texture;return t(l,o.mapping)}else{const l=o.image;if(l&&l.height>0){const d=new Wp(l.height);return d.fromEquirectangularTexture(n,o),e.set(o,d),o.addEventListener("dispose",r),t(d.texture,o.mapping)}else return null}}return o}function r(o){const c=o.target;c.removeEventListener("dispose",r);const l=e.get(c);l!==void 0&&(e.delete(c),l.dispose())}function s(){e=new WeakMap}return{get:i,dispose:s}}const ni=4,fd=[.125,.215,.35,.446,.526,.582],vi=20,q0=256,Nr=new Vu,hd=new ze;let uo=null,fo=0,ho=0,po=!1;const Y0=new k;class pd{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._sigmas=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,i=.1,r=100,s={}){const{size:o=256,position:c=Y0}=s;uo=this._renderer.getRenderTarget(),fo=this._renderer.getActiveCubeFace(),ho=this._renderer.getActiveMipmapLevel(),po=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(o);const l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,i,r,l,c),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=xd(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=gd(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(uo,fo,ho),this._renderer.xr.enabled=po,e.scissorTest=!1,Ji(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===fr||e.mapping===hr?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),uo=this._renderer.getRenderTarget(),fo=this._renderer.getActiveCubeFace(),ho=this._renderer.getActiveMipmapLevel(),po=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:cn,minFilter:cn,generateMipmaps:!1,type:br,format:xn,colorSpace:pr,depthBuffer:!1},r=md(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=md(e,t,i);const{_lodMax:s}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods,sigmas:this._sigmas}=K0(s)),this._blurMaterial=Z0(s,e,t),this._ggxMaterial=J0(s,e,t)}return r}_compileMaterial(e){const t=new Pn(new dn,e);this._renderer.compile(t,Nr)}_sceneToCubeUV(e,t,i,r,s){const l=new an(90,1,t,i),d=[1,-1,1,1,1,1],f=[1,1,1,-1,-1,-1],p=this._renderer,h=p.autoClear,m=p.toneMapping;p.getClearColor(hd),p.toneMapping=ri,p.autoClear=!1,p.state.buffers.depth.getReversed()&&(p.setRenderTarget(r),p.clearDepth(),p.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new Pn(new os,new jc({name:"PMREM.Background",side:Xt,depthWrite:!1,depthTest:!1})));const b=this._backgroundBox,x=b.material;let g=!1;const w=e.background;w?w.isColor&&(x.color.copy(w),e.background=null,g=!0):(x.color.copy(hd),g=!0);for(let T=0;T<6;T++){const L=T%3;L===0?(l.up.set(0,d[T],0),l.position.set(s.x,s.y,s.z),l.lookAt(s.x+f[T],s.y,s.z)):L===1?(l.up.set(0,0,d[T]),l.position.set(s.x,s.y,s.z),l.lookAt(s.x,s.y+f[T],s.z)):(l.up.set(0,d[T],0),l.position.set(s.x,s.y,s.z),l.lookAt(s.x,s.y,s.z+f[T]));const R=this._cubeSize;Ji(r,L*R,T>2?R:0,R,R),p.setRenderTarget(r),g&&p.render(b,l),p.render(e,l)}p.toneMapping=m,p.autoClear=h,e.background=w}_textureToCubeUV(e,t){const i=this._renderer,r=e.mapping===fr||e.mapping===hr;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=xd()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=gd());const s=r?this._cubemapMaterial:this._equirectMaterial,o=this._lodMeshes[0];o.material=s;const c=s.uniforms;c.envMap.value=e;const l=this._cubeSize;Ji(t,0,0,3*l,2*l),i.setRenderTarget(t),i.render(o,Nr)}_applyPMREM(e){const t=this._renderer,i=t.autoClear;t.autoClear=!1;const r=this._lodMeshes.length;for(let s=1;s<r;s++)this._applyGGXFilter(e,s-1,s);t.autoClear=i}_applyGGXFilter(e,t,i){const r=this._renderer,s=this._pingPongRenderTarget,o=this._ggxMaterial,c=this._lodMeshes[i];c.material=o;const l=o.uniforms,d=i/(this._lodMeshes.length-1),f=t/(this._lodMeshes.length-1),p=Math.sqrt(d*d-f*f),h=.05+d*.95,m=p*h,{_lodMax:_}=this,b=this._sizeLods[i],x=3*b*(i>_-ni?i-_+ni:0),g=4*(this._cubeSize-b);l.envMap.value=e.texture,l.roughness.value=m,l.mipInt.value=_-t,Ji(s,x,g,3*b,2*b),r.setRenderTarget(s),r.render(c,Nr),l.envMap.value=s.texture,l.roughness.value=0,l.mipInt.value=_-i,Ji(e,x,g,3*b,2*b),r.setRenderTarget(e),r.render(c,Nr)}_blur(e,t,i,r,s){const o=this._pingPongRenderTarget;this._halfBlur(e,o,t,i,r,"latitudinal",s),this._halfBlur(o,e,i,i,r,"longitudinal",s)}_halfBlur(e,t,i,r,s,o,c){const l=this._renderer,d=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&Mt("blur direction must be either latitudinal or longitudinal!");const f=3,p=this._lodMeshes[r];p.material=d;const h=d.uniforms,m=this._sizeLods[i]-1,_=isFinite(s)?Math.PI/(2*m):2*Math.PI/(2*vi-1),b=s/_,x=isFinite(s)?1+Math.floor(f*b):vi;x>vi&&Fe(`sigmaRadians, ${s}, is too large and will clip, as it requested ${x} samples when the maximum is set to ${vi}`);const g=[];let w=0;for(let A=0;A<vi;++A){const F=A/b,E=Math.exp(-F*F/2);g.push(E),A===0?w+=E:A<x&&(w+=2*E)}for(let A=0;A<g.length;A++)g[A]=g[A]/w;h.envMap.value=e.texture,h.samples.value=x,h.weights.value=g,h.latitudinal.value=o==="latitudinal",c&&(h.poleAxis.value=c);const{_lodMax:T}=this;h.dTheta.value=_,h.mipInt.value=T-i;const L=this._sizeLods[r],R=3*L*(r>T-ni?r-T+ni:0),M=4*(this._cubeSize-L);Ji(t,R,M,3*L,2*L),l.setRenderTarget(t),l.render(p,Nr)}}function K0(n){const e=[],t=[],i=[];let r=n;const s=n-ni+1+fd.length;for(let o=0;o<s;o++){const c=Math.pow(2,r);e.push(c);let l=1/c;o>n-ni?l=fd[o-n+ni-1]:o===0&&(l=0),t.push(l);const d=1/(c-2),f=-d,p=1+d,h=[f,f,p,f,p,p,f,f,p,p,f,p],m=6,_=6,b=3,x=2,g=1,w=new Float32Array(b*_*m),T=new Float32Array(x*_*m),L=new Float32Array(g*_*m);for(let M=0;M<m;M++){const A=M%3*2/3-1,F=M>2?0:-1,E=[A,F,0,A+2/3,F,0,A+2/3,F+1,0,A,F,0,A+2/3,F+1,0,A,F+1,0];w.set(E,b*_*M),T.set(h,x*_*M);const v=[M,M,M,M,M,M];L.set(v,g*_*M)}const R=new dn;R.setAttribute("position",new wn(w,b)),R.setAttribute("uv",new wn(T,x)),R.setAttribute("faceIndex",new wn(L,g)),i.push(new Pn(R,null)),r>ni&&r--}return{lodMeshes:i,sizeLods:e,sigmas:t}}function md(n,e,t){const i=new Ai(n,e,t);return i.texture.mapping=Ea,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Ji(n,e,t,i,r){n.viewport.set(e,t,i,r),n.scissor.set(e,t,i,r)}function J0(n,e,t){return new jn({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:q0,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Ta(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 3.2: Transform view direction to hemisphere configuration
				vec3 Vh = normalize(vec3(alpha * V.x, alpha * V.y, V.z));

				// Section 4.1: Orthonormal basis
				float lensq = Vh.x * Vh.x + Vh.y * Vh.y;
				vec3 T1 = lensq > 0.0 ? vec3(-Vh.y, Vh.x, 0.0) / sqrt(lensq) : vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(Vh, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + Vh.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * Vh;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:Vn,depthTest:!1,depthWrite:!1})}function Z0(n,e,t){const i=new Float32Array(vi),r=new k(0,1,0);return new jn({name:"SphericalGaussianBlur",defines:{n:vi,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:r}},vertexShader:Ta(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Vn,depthTest:!1,depthWrite:!1})}function gd(){return new jn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Ta(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Vn,depthTest:!1,depthWrite:!1})}function xd(){return new jn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Ta(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Vn,depthTest:!1,depthWrite:!1})}function Ta(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function Q0(n){let e=new WeakMap,t=null;function i(c){if(c&&c.isTexture){const l=c.mapping,d=l===Bo||l===Go,f=l===fr||l===hr;if(d||f){let p=e.get(c);const h=p!==void 0?p.texture.pmremVersion:0;if(c.isRenderTargetTexture&&c.pmremVersion!==h)return t===null&&(t=new pd(n)),p=d?t.fromEquirectangular(c,p):t.fromCubemap(c,p),p.texture.pmremVersion=c.pmremVersion,e.set(c,p),p.texture;if(p!==void 0)return p.texture;{const m=c.image;return d&&m&&m.height>0||f&&m&&r(m)?(t===null&&(t=new pd(n)),p=d?t.fromEquirectangular(c):t.fromCubemap(c),p.texture.pmremVersion=c.pmremVersion,e.set(c,p),c.addEventListener("dispose",s),p.texture):null}}}return c}function r(c){let l=0;const d=6;for(let f=0;f<d;f++)c[f]!==void 0&&l++;return l===d}function s(c){const l=c.target;l.removeEventListener("dispose",s);const d=e.get(l);d!==void 0&&(e.delete(l),d.dispose())}function o(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:i,dispose:o}}function ex(n){const e={};function t(i){if(e[i]!==void 0)return e[i];const r=n.getExtension(i);return e[i]=r,r}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){const r=t(i);return r===null&&es("WebGLRenderer: "+i+" extension not supported."),r}}}function tx(n,e,t,i){const r={},s=new WeakMap;function o(p){const h=p.target;h.index!==null&&e.remove(h.index);for(const _ in h.attributes)e.remove(h.attributes[_]);h.removeEventListener("dispose",o),delete r[h.id];const m=s.get(h);m&&(e.remove(m),s.delete(h)),i.releaseStatesOfGeometry(h),h.isInstancedBufferGeometry===!0&&delete h._maxInstanceCount,t.memory.geometries--}function c(p,h){return r[h.id]===!0||(h.addEventListener("dispose",o),r[h.id]=!0,t.memory.geometries++),h}function l(p){const h=p.attributes;for(const m in h)e.update(h[m],n.ARRAY_BUFFER)}function d(p){const h=[],m=p.index,_=p.attributes.position;let b=0;if(m!==null){const w=m.array;b=m.version;for(let T=0,L=w.length;T<L;T+=3){const R=w[T+0],M=w[T+1],A=w[T+2];h.push(R,M,M,A,A,R)}}else if(_!==void 0){const w=_.array;b=_.version;for(let T=0,L=w.length/3-1;T<L;T+=3){const R=T+0,M=T+1,A=T+2;h.push(R,M,M,A,A,R)}}else return;const x=new(Ru(h)?Nu:Fu)(h,1);x.version=b;const g=s.get(p);g&&e.remove(g),s.set(p,x)}function f(p){const h=s.get(p);if(h){const m=p.index;m!==null&&h.version<m.version&&d(p)}else d(p);return s.get(p)}return{get:c,update:l,getWireframeAttribute:f}}function nx(n,e,t){let i;function r(h){i=h}let s,o;function c(h){s=h.type,o=h.bytesPerElement}function l(h,m){n.drawElements(i,m,s,h*o),t.update(m,i,1)}function d(h,m,_){_!==0&&(n.drawElementsInstanced(i,m,s,h*o,_),t.update(m,i,_))}function f(h,m,_){if(_===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,m,0,s,h,0,_);let x=0;for(let g=0;g<_;g++)x+=m[g];t.update(x,i,1)}function p(h,m,_,b){if(_===0)return;const x=e.get("WEBGL_multi_draw");if(x===null)for(let g=0;g<h.length;g++)d(h[g]/o,m[g],b[g]);else{x.multiDrawElementsInstancedWEBGL(i,m,0,s,h,0,b,0,_);let g=0;for(let w=0;w<_;w++)g+=m[w]*b[w];t.update(g,i,1)}}this.setMode=r,this.setIndex=c,this.render=l,this.renderInstances=d,this.renderMultiDraw=f,this.renderMultiDrawInstances=p}function ix(n){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(s,o,c){switch(t.calls++,o){case n.TRIANGLES:t.triangles+=c*(s/3);break;case n.LINES:t.lines+=c*(s/2);break;case n.LINE_STRIP:t.lines+=c*(s-1);break;case n.LINE_LOOP:t.lines+=c*s;break;case n.POINTS:t.points+=c*s;break;default:Mt("WebGLInfo: Unknown draw mode:",o);break}}function r(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:r,update:i}}function rx(n,e,t){const i=new WeakMap,r=new vt;function s(o,c,l){const d=o.morphTargetInfluences,f=c.morphAttributes.position||c.morphAttributes.normal||c.morphAttributes.color,p=f!==void 0?f.length:0;let h=i.get(c);if(h===void 0||h.count!==p){let v=function(){F.dispose(),i.delete(c),c.removeEventListener("dispose",v)};var m=v;h!==void 0&&h.texture.dispose();const _=c.morphAttributes.position!==void 0,b=c.morphAttributes.normal!==void 0,x=c.morphAttributes.color!==void 0,g=c.morphAttributes.position||[],w=c.morphAttributes.normal||[],T=c.morphAttributes.color||[];let L=0;_===!0&&(L=1),b===!0&&(L=2),x===!0&&(L=3);let R=c.attributes.position.count*L,M=1;R>e.maxTextureSize&&(M=Math.ceil(R/e.maxTextureSize),R=e.maxTextureSize);const A=new Float32Array(R*M*4*p),F=new Pu(A,R,M,p);F.type=zn,F.needsUpdate=!0;const E=L*4;for(let P=0;P<p;P++){const O=g[P],B=w[P],W=T[P],H=R*M*4*P;for(let X=0;X<O.count;X++){const Q=X*E;_===!0&&(r.fromBufferAttribute(O,X),A[H+Q+0]=r.x,A[H+Q+1]=r.y,A[H+Q+2]=r.z,A[H+Q+3]=0),b===!0&&(r.fromBufferAttribute(B,X),A[H+Q+4]=r.x,A[H+Q+5]=r.y,A[H+Q+6]=r.z,A[H+Q+7]=0),x===!0&&(r.fromBufferAttribute(W,X),A[H+Q+8]=r.x,A[H+Q+9]=r.y,A[H+Q+10]=r.z,A[H+Q+11]=W.itemSize===4?r.w:1)}}h={count:p,texture:F,size:new Oe(R,M)},i.set(c,h),c.addEventListener("dispose",v)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(n,"morphTexture",o.morphTexture,t);else{let _=0;for(let x=0;x<d.length;x++)_+=d[x];const b=c.morphTargetsRelative?1:1-_;l.getUniforms().setValue(n,"morphTargetBaseInfluence",b),l.getUniforms().setValue(n,"morphTargetInfluences",d)}l.getUniforms().setValue(n,"morphTargetsTexture",h.texture,t),l.getUniforms().setValue(n,"morphTargetsTextureSize",h.size)}return{update:s}}function sx(n,e,t,i){let r=new WeakMap;function s(l){const d=i.render.frame,f=l.geometry,p=e.get(l,f);if(r.get(p)!==d&&(e.update(p),r.set(p,d)),l.isInstancedMesh&&(l.hasEventListener("dispose",c)===!1&&l.addEventListener("dispose",c),r.get(l)!==d&&(t.update(l.instanceMatrix,n.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,n.ARRAY_BUFFER),r.set(l,d))),l.isSkinnedMesh){const h=l.skeleton;r.get(h)!==d&&(h.update(),r.set(h,d))}return p}function o(){r=new WeakMap}function c(l){const d=l.target;d.removeEventListener("dispose",c),t.remove(d.instanceMatrix),d.instanceColor!==null&&t.remove(d.instanceColor)}return{update:s,dispose:o}}const ju=new zt,_d=new Gu(1,1),$u=new Pu,Xu=new wp,qu=new Bu,bd=[],yd=[],vd=new Float32Array(16),Sd=new Float32Array(9),Ed=new Float32Array(4);function vr(n,e,t){const i=n[0];if(i<=0||i>0)return n;const r=e*t;let s=bd[r];if(s===void 0&&(s=new Float32Array(r),bd[r]=s),e!==0){i.toArray(s,0);for(let o=1,c=0;o!==e;++o)c+=t,n[o].toArray(s,c)}return s}function At(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function Lt(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function Ca(n,e){let t=yd[e];t===void 0&&(t=new Int32Array(e),yd[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function ax(n,e){const t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function ox(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(At(t,e))return;n.uniform2fv(this.addr,e),Lt(t,e)}}function cx(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(At(t,e))return;n.uniform3fv(this.addr,e),Lt(t,e)}}function lx(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(At(t,e))return;n.uniform4fv(this.addr,e),Lt(t,e)}}function dx(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(At(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),Lt(t,e)}else{if(At(t,i))return;Ed.set(i),n.uniformMatrix2fv(this.addr,!1,Ed),Lt(t,i)}}function ux(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(At(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),Lt(t,e)}else{if(At(t,i))return;Sd.set(i),n.uniformMatrix3fv(this.addr,!1,Sd),Lt(t,i)}}function fx(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(At(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),Lt(t,e)}else{if(At(t,i))return;vd.set(i),n.uniformMatrix4fv(this.addr,!1,vd),Lt(t,i)}}function hx(n,e){const t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function px(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(At(t,e))return;n.uniform2iv(this.addr,e),Lt(t,e)}}function mx(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(At(t,e))return;n.uniform3iv(this.addr,e),Lt(t,e)}}function gx(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(At(t,e))return;n.uniform4iv(this.addr,e),Lt(t,e)}}function xx(n,e){const t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function _x(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(At(t,e))return;n.uniform2uiv(this.addr,e),Lt(t,e)}}function bx(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(At(t,e))return;n.uniform3uiv(this.addr,e),Lt(t,e)}}function yx(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(At(t,e))return;n.uniform4uiv(this.addr,e),Lt(t,e)}}function vx(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r);let s;this.type===n.SAMPLER_2D_SHADOW?(_d.compareFunction=Lu,s=_d):s=ju,t.setTexture2D(e||s,r)}function Sx(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture3D(e||Xu,r)}function Ex(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTextureCube(e||qu,r)}function Mx(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture2DArray(e||$u,r)}function Tx(n){switch(n){case 5126:return ax;case 35664:return ox;case 35665:return cx;case 35666:return lx;case 35674:return dx;case 35675:return ux;case 35676:return fx;case 5124:case 35670:return hx;case 35667:case 35671:return px;case 35668:case 35672:return mx;case 35669:case 35673:return gx;case 5125:return xx;case 36294:return _x;case 36295:return bx;case 36296:return yx;case 35678:case 36198:case 36298:case 36306:case 35682:return vx;case 35679:case 36299:case 36307:return Sx;case 35680:case 36300:case 36308:case 36293:return Ex;case 36289:case 36303:case 36311:case 36292:return Mx}}function Cx(n,e){n.uniform1fv(this.addr,e)}function wx(n,e){const t=vr(e,this.size,2);n.uniform2fv(this.addr,t)}function Ax(n,e){const t=vr(e,this.size,3);n.uniform3fv(this.addr,t)}function Lx(n,e){const t=vr(e,this.size,4);n.uniform4fv(this.addr,t)}function Rx(n,e){const t=vr(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function Px(n,e){const t=vr(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function Ix(n,e){const t=vr(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function Dx(n,e){n.uniform1iv(this.addr,e)}function Fx(n,e){n.uniform2iv(this.addr,e)}function Nx(n,e){n.uniform3iv(this.addr,e)}function Ux(n,e){n.uniform4iv(this.addr,e)}function Ox(n,e){n.uniform1uiv(this.addr,e)}function Bx(n,e){n.uniform2uiv(this.addr,e)}function Gx(n,e){n.uniform3uiv(this.addr,e)}function kx(n,e){n.uniform4uiv(this.addr,e)}function zx(n,e,t){const i=this.cache,r=e.length,s=Ca(t,r);At(i,s)||(n.uniform1iv(this.addr,s),Lt(i,s));for(let o=0;o!==r;++o)t.setTexture2D(e[o]||ju,s[o])}function Vx(n,e,t){const i=this.cache,r=e.length,s=Ca(t,r);At(i,s)||(n.uniform1iv(this.addr,s),Lt(i,s));for(let o=0;o!==r;++o)t.setTexture3D(e[o]||Xu,s[o])}function Hx(n,e,t){const i=this.cache,r=e.length,s=Ca(t,r);At(i,s)||(n.uniform1iv(this.addr,s),Lt(i,s));for(let o=0;o!==r;++o)t.setTextureCube(e[o]||qu,s[o])}function Wx(n,e,t){const i=this.cache,r=e.length,s=Ca(t,r);At(i,s)||(n.uniform1iv(this.addr,s),Lt(i,s));for(let o=0;o!==r;++o)t.setTexture2DArray(e[o]||$u,s[o])}function jx(n){switch(n){case 5126:return Cx;case 35664:return wx;case 35665:return Ax;case 35666:return Lx;case 35674:return Rx;case 35675:return Px;case 35676:return Ix;case 5124:case 35670:return Dx;case 35667:case 35671:return Fx;case 35668:case 35672:return Nx;case 35669:case 35673:return Ux;case 5125:return Ox;case 36294:return Bx;case 36295:return Gx;case 36296:return kx;case 35678:case 36198:case 36298:case 36306:case 35682:return zx;case 35679:case 36299:case 36307:return Vx;case 35680:case 36300:case 36308:case 36293:return Hx;case 36289:case 36303:case 36311:case 36292:return Wx}}class $x{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=Tx(t.type)}}class Xx{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=jx(t.type)}}class qx{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){const r=this.seq;for(let s=0,o=r.length;s!==o;++s){const c=r[s];c.setValue(e,t[c.id],i)}}}const mo=/(\w+)(\])?(\[|\.)?/g;function Md(n,e){n.seq.push(e),n.map[e.id]=e}function Yx(n,e,t){const i=n.name,r=i.length;for(mo.lastIndex=0;;){const s=mo.exec(i),o=mo.lastIndex;let c=s[1];const l=s[2]==="]",d=s[3];if(l&&(c=c|0),d===void 0||d==="["&&o+2===r){Md(t,d===void 0?new $x(c,n,e):new Xx(c,n,e));break}else{let p=t.map[c];p===void 0&&(p=new qx(c),Md(t,p)),t=p}}}class Qs{constructor(e,t){this.seq=[],this.map={};const i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let r=0;r<i;++r){const s=e.getActiveUniform(t,r),o=e.getUniformLocation(t,s.name);Yx(s,o,this)}}setValue(e,t,i,r){const s=this.map[t];s!==void 0&&s.setValue(e,i,r)}setOptional(e,t,i){const r=t[i];r!==void 0&&this.setValue(e,i,r)}static upload(e,t,i,r){for(let s=0,o=t.length;s!==o;++s){const c=t[s],l=i[c.id];l.needsUpdate!==!1&&c.setValue(e,l.value,r)}}static seqWithValue(e,t){const i=[];for(let r=0,s=e.length;r!==s;++r){const o=e[r];o.id in t&&i.push(o)}return i}}function Td(n,e,t){const i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}const Kx=37297;let Jx=0;function Zx(n,e){const t=n.split(`
`),i=[],r=Math.max(e-6,0),s=Math.min(e+6,t.length);for(let o=r;o<s;o++){const c=o+1;i.push(`${c===e?">":" "} ${c}: ${t[o]}`)}return i.join(`
`)}const Cd=new Ge;function Qx(n){Qe._getMatrix(Cd,Qe.workingColorSpace,n);const e=`mat3( ${Cd.elements.map(t=>t.toFixed(4))} )`;switch(Qe.getTransfer(n)){case fa:return[e,"LinearTransferOETF"];case at:return[e,"sRGBTransferOETF"];default:return Fe("WebGLProgram: Unsupported color space: ",n),[e,"LinearTransferOETF"]}}function wd(n,e,t){const i=n.getShaderParameter(e,n.COMPILE_STATUS),s=(n.getShaderInfoLog(e)||"").trim();if(i&&s==="")return"";const o=/ERROR: 0:(\d+)/.exec(s);if(o){const c=parseInt(o[1]);return t.toUpperCase()+`

`+s+`

`+Zx(n.getShaderSource(e),c)}else return s}function e_(n,e){const t=Qx(e);return[`vec4 ${n}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function t_(n,e){let t;switch(e){case ep:t="Linear";break;case tp:t="Reinhard";break;case np:t="Cineon";break;case ip:t="ACESFilmic";break;case sp:t="AgX";break;case ap:t="Neutral";break;case rp:t="Custom";break;default:Fe("WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}const Us=new k;function n_(){Qe.getLuminanceCoefficients(Us);const n=Us.x.toFixed(4),e=Us.y.toFixed(4),t=Us.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function i_(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(kr).join(`
`)}function r_(n){const e=[];for(const t in n){const i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function s_(n,e){const t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){const s=n.getActiveAttrib(e,r),o=s.name;let c=1;s.type===n.FLOAT_MAT2&&(c=2),s.type===n.FLOAT_MAT3&&(c=3),s.type===n.FLOAT_MAT4&&(c=4),t[o]={type:s.type,location:n.getAttribLocation(e,o),locationSize:c}}return t}function kr(n){return n!==""}function Ad(n,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Ld(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const a_=/^[ \t]*#include +<([\w\d./]+)>/gm;function xc(n){return n.replace(a_,c_)}const o_=new Map;function c_(n,e){let t=Ve[e];if(t===void 0){const i=o_.get(e);if(i!==void 0)t=Ve[i],Fe('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("Can not resolve #include <"+e+">")}return xc(t)}const l_=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Rd(n){return n.replace(l_,d_)}function d_(n,e,t,i){let r="";for(let s=parseInt(e);s<parseInt(t);s++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function Pd(n){let e=`precision ${n.precision} float;
	precision ${n.precision} int;
	precision ${n.precision} sampler2D;
	precision ${n.precision} samplerCube;
	precision ${n.precision} sampler3D;
	precision ${n.precision} sampler2DArray;
	precision ${n.precision} sampler2DShadow;
	precision ${n.precision} samplerCubeShadow;
	precision ${n.precision} sampler2DArrayShadow;
	precision ${n.precision} isampler2D;
	precision ${n.precision} isampler3D;
	precision ${n.precision} isamplerCube;
	precision ${n.precision} isampler2DArray;
	precision ${n.precision} usampler2D;
	precision ${n.precision} usampler3D;
	precision ${n.precision} usamplerCube;
	precision ${n.precision} usampler2DArray;
	`;return n.precision==="highp"?e+=`
#define HIGH_PRECISION`:n.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function u_(n){let e="SHADOWMAP_TYPE_BASIC";return n.shadowMapType===_u?e="SHADOWMAP_TYPE_PCF":n.shadowMapType===Dh?e="SHADOWMAP_TYPE_PCF_SOFT":n.shadowMapType===Bn&&(e="SHADOWMAP_TYPE_VSM"),e}function f_(n){let e="ENVMAP_TYPE_CUBE";if(n.envMap)switch(n.envMapMode){case fr:case hr:e="ENVMAP_TYPE_CUBE";break;case Ea:e="ENVMAP_TYPE_CUBE_UV";break}return e}function h_(n){let e="ENVMAP_MODE_REFLECTION";return n.envMap&&n.envMapMode===hr&&(e="ENVMAP_MODE_REFRACTION"),e}function p_(n){let e="ENVMAP_BLENDING_NONE";if(n.envMap)switch(n.combine){case bu:e="ENVMAP_BLENDING_MULTIPLY";break;case Zh:e="ENVMAP_BLENDING_MIX";break;case Qh:e="ENVMAP_BLENDING_ADD";break}return e}function m_(n){const e=n.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:i,maxMip:t}}function g_(n,e,t,i){const r=n.getContext(),s=t.defines;let o=t.vertexShader,c=t.fragmentShader;const l=u_(t),d=f_(t),f=h_(t),p=p_(t),h=m_(t),m=i_(t),_=r_(s),b=r.createProgram();let x,g,w=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(x=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(kr).join(`
`),x.length>0&&(x+=`
`),g=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(kr).join(`
`),g.length>0&&(g+=`
`)):(x=[Pd(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+f:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(kr).join(`
`),g=[Pd(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+d:"",t.envMap?"#define "+f:"",t.envMap?"#define "+p:"",h?"#define CUBEUV_TEXEL_WIDTH "+h.texelWidth:"",h?"#define CUBEUV_TEXEL_HEIGHT "+h.texelHeight:"",h?"#define CUBEUV_MAX_MIP "+h.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==ri?"#define TONE_MAPPING":"",t.toneMapping!==ri?Ve.tonemapping_pars_fragment:"",t.toneMapping!==ri?t_("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Ve.colorspace_pars_fragment,e_("linearToOutputTexel",t.outputColorSpace),n_(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(kr).join(`
`)),o=xc(o),o=Ad(o,t),o=Ld(o,t),c=xc(c),c=Ad(c,t),c=Ld(c,t),o=Rd(o),c=Rd(c),t.isRawShaderMaterial!==!0&&(w=`#version 300 es
`,x=[m,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+x,g=["#define varying in",t.glslVersion===Bl?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Bl?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+g);const T=w+x+o,L=w+g+c,R=Td(r,r.VERTEX_SHADER,T),M=Td(r,r.FRAGMENT_SHADER,L);r.attachShader(b,R),r.attachShader(b,M),t.index0AttributeName!==void 0?r.bindAttribLocation(b,0,t.index0AttributeName):t.morphTargets===!0&&r.bindAttribLocation(b,0,"position"),r.linkProgram(b);function A(P){if(n.debug.checkShaderErrors){const O=r.getProgramInfoLog(b)||"",B=r.getShaderInfoLog(R)||"",W=r.getShaderInfoLog(M)||"",H=O.trim(),X=B.trim(),Q=W.trim();let $=!0,ie=!0;if(r.getProgramParameter(b,r.LINK_STATUS)===!1)if($=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(r,b,R,M);else{const ne=wd(r,R,"vertex"),xe=wd(r,M,"fragment");Mt("THREE.WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(b,r.VALIDATE_STATUS)+`

Material Name: `+P.name+`
Material Type: `+P.type+`

Program Info Log: `+H+`
`+ne+`
`+xe)}else H!==""?Fe("WebGLProgram: Program Info Log:",H):(X===""||Q==="")&&(ie=!1);ie&&(P.diagnostics={runnable:$,programLog:H,vertexShader:{log:X,prefix:x},fragmentShader:{log:Q,prefix:g}})}r.deleteShader(R),r.deleteShader(M),F=new Qs(r,b),E=s_(r,b)}let F;this.getUniforms=function(){return F===void 0&&A(this),F};let E;this.getAttributes=function(){return E===void 0&&A(this),E};let v=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return v===!1&&(v=r.getProgramParameter(b,Kx)),v},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(b),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Jx++,this.cacheKey=e,this.usedTimes=1,this.program=b,this.vertexShader=R,this.fragmentShader=M,this}let x_=0;class __{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){const t=e.vertexShader,i=e.fragmentShader,r=this._getShaderStage(t),s=this._getShaderStage(i),o=this._getShaderCacheForMaterial(e);return o.has(r)===!1&&(o.add(r),r.usedTimes++),o.has(s)===!1&&(o.add(s),s.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){const t=this.shaderCache;let i=t.get(e);return i===void 0&&(i=new b_(e),t.set(e,i)),i}}class b_{constructor(e){this.id=x_++,this.code=e,this.usedTimes=0}}function y_(n,e,t,i,r,s,o){const c=new Iu,l=new __,d=new Set,f=[],p=r.logarithmicDepthBuffer,h=r.vertexTextures;let m=r.precision;const _={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function b(E){return d.add(E),E===0?"uv":`uv${E}`}function x(E,v,P,O,B){const W=O.fog,H=B.geometry,X=E.isMeshStandardMaterial?O.environment:null,Q=(E.isMeshStandardMaterial?t:e).get(E.envMap||X),$=Q&&Q.mapping===Ea?Q.image.height:null,ie=_[E.type];E.precision!==null&&(m=r.getMaxPrecision(E.precision),m!==E.precision&&Fe("WebGLProgram.getParameters:",E.precision,"not supported, using",m,"instead."));const ne=H.morphAttributes.position||H.morphAttributes.normal||H.morphAttributes.color,xe=ne!==void 0?ne.length:0;let je=0;H.morphAttributes.position!==void 0&&(je=1),H.morphAttributes.normal!==void 0&&(je=2),H.morphAttributes.color!==void 0&&(je=3);let tt,nt,it,q;if(ie){const rt=En[ie];tt=rt.vertexShader,nt=rt.fragmentShader}else tt=E.vertexShader,nt=E.fragmentShader,l.update(E),it=l.getVertexShaderID(E),q=l.getFragmentShaderID(E);const J=n.getRenderTarget(),me=n.state.buffers.depth.getReversed(),De=B.isInstancedMesh===!0,ve=B.isBatchedMesh===!0,$e=!!E.map,It=!!E.matcap,He=!!Q,ht=!!E.aoMap,I=!!E.lightMap,Xe=!!E.bumpMap,qe=!!E.normalMap,lt=!!E.displacementMap,ye=!!E.emissiveMap,gt=!!E.metalnessMap,Te=!!E.roughnessMap,Ue=E.anisotropy>0,C=E.clearcoat>0,y=E.dispersion>0,G=E.iridescence>0,Y=E.sheen>0,Z=E.transmission>0,j=Ue&&!!E.anisotropyMap,Ee=C&&!!E.clearcoatMap,le=C&&!!E.clearcoatNormalMap,Ce=C&&!!E.clearcoatRoughnessMap,Se=G&&!!E.iridescenceMap,ee=G&&!!E.iridescenceThicknessMap,se=Y&&!!E.sheenColorMap,Re=Y&&!!E.sheenRoughnessMap,Ae=!!E.specularMap,he=!!E.specularColorMap,Ie=!!E.specularIntensityMap,D=Z&&!!E.transmissionMap,de=Z&&!!E.thicknessMap,ae=!!E.gradientMap,oe=!!E.alphaMap,te=E.alphaTest>0,K=!!E.alphaHash,_e=!!E.extensions;let Ne=ri;E.toneMapped&&(J===null||J.isXRRenderTarget===!0)&&(Ne=n.toneMapping);const ft={shaderID:ie,shaderType:E.type,shaderName:E.name,vertexShader:tt,fragmentShader:nt,defines:E.defines,customVertexShaderID:it,customFragmentShaderID:q,isRawShaderMaterial:E.isRawShaderMaterial===!0,glslVersion:E.glslVersion,precision:m,batching:ve,batchingColor:ve&&B._colorsTexture!==null,instancing:De,instancingColor:De&&B.instanceColor!==null,instancingMorph:De&&B.morphTexture!==null,supportsVertexTextures:h,outputColorSpace:J===null?n.outputColorSpace:J.isXRRenderTarget===!0?J.texture.colorSpace:pr,alphaToCoverage:!!E.alphaToCoverage,map:$e,matcap:It,envMap:He,envMapMode:He&&Q.mapping,envMapCubeUVHeight:$,aoMap:ht,lightMap:I,bumpMap:Xe,normalMap:qe,displacementMap:h&&lt,emissiveMap:ye,normalMapObjectSpace:qe&&E.normalMapType===dp,normalMapTangentSpace:qe&&E.normalMapType===Au,metalnessMap:gt,roughnessMap:Te,anisotropy:Ue,anisotropyMap:j,clearcoat:C,clearcoatMap:Ee,clearcoatNormalMap:le,clearcoatRoughnessMap:Ce,dispersion:y,iridescence:G,iridescenceMap:Se,iridescenceThicknessMap:ee,sheen:Y,sheenColorMap:se,sheenRoughnessMap:Re,specularMap:Ae,specularColorMap:he,specularIntensityMap:Ie,transmission:Z,transmissionMap:D,thicknessMap:de,gradientMap:ae,opaque:E.transparent===!1&&E.blending===or&&E.alphaToCoverage===!1,alphaMap:oe,alphaTest:te,alphaHash:K,combine:E.combine,mapUv:$e&&b(E.map.channel),aoMapUv:ht&&b(E.aoMap.channel),lightMapUv:I&&b(E.lightMap.channel),bumpMapUv:Xe&&b(E.bumpMap.channel),normalMapUv:qe&&b(E.normalMap.channel),displacementMapUv:lt&&b(E.displacementMap.channel),emissiveMapUv:ye&&b(E.emissiveMap.channel),metalnessMapUv:gt&&b(E.metalnessMap.channel),roughnessMapUv:Te&&b(E.roughnessMap.channel),anisotropyMapUv:j&&b(E.anisotropyMap.channel),clearcoatMapUv:Ee&&b(E.clearcoatMap.channel),clearcoatNormalMapUv:le&&b(E.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Ce&&b(E.clearcoatRoughnessMap.channel),iridescenceMapUv:Se&&b(E.iridescenceMap.channel),iridescenceThicknessMapUv:ee&&b(E.iridescenceThicknessMap.channel),sheenColorMapUv:se&&b(E.sheenColorMap.channel),sheenRoughnessMapUv:Re&&b(E.sheenRoughnessMap.channel),specularMapUv:Ae&&b(E.specularMap.channel),specularColorMapUv:he&&b(E.specularColorMap.channel),specularIntensityMapUv:Ie&&b(E.specularIntensityMap.channel),transmissionMapUv:D&&b(E.transmissionMap.channel),thicknessMapUv:de&&b(E.thicknessMap.channel),alphaMapUv:oe&&b(E.alphaMap.channel),vertexTangents:!!H.attributes.tangent&&(qe||Ue),vertexColors:E.vertexColors,vertexAlphas:E.vertexColors===!0&&!!H.attributes.color&&H.attributes.color.itemSize===4,pointsUvs:B.isPoints===!0&&!!H.attributes.uv&&($e||oe),fog:!!W,useFog:E.fog===!0,fogExp2:!!W&&W.isFogExp2,flatShading:E.flatShading===!0&&E.wireframe===!1,sizeAttenuation:E.sizeAttenuation===!0,logarithmicDepthBuffer:p,reversedDepthBuffer:me,skinning:B.isSkinnedMesh===!0,morphTargets:H.morphAttributes.position!==void 0,morphNormals:H.morphAttributes.normal!==void 0,morphColors:H.morphAttributes.color!==void 0,morphTargetsCount:xe,morphTextureStride:je,numDirLights:v.directional.length,numPointLights:v.point.length,numSpotLights:v.spot.length,numSpotLightMaps:v.spotLightMap.length,numRectAreaLights:v.rectArea.length,numHemiLights:v.hemi.length,numDirLightShadows:v.directionalShadowMap.length,numPointLightShadows:v.pointShadowMap.length,numSpotLightShadows:v.spotShadowMap.length,numSpotLightShadowsWithMaps:v.numSpotLightShadowsWithMaps,numLightProbes:v.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:E.dithering,shadowMapEnabled:n.shadowMap.enabled&&P.length>0,shadowMapType:n.shadowMap.type,toneMapping:Ne,decodeVideoTexture:$e&&E.map.isVideoTexture===!0&&Qe.getTransfer(E.map.colorSpace)===at,decodeVideoTextureEmissive:ye&&E.emissiveMap.isVideoTexture===!0&&Qe.getTransfer(E.emissiveMap.colorSpace)===at,premultipliedAlpha:E.premultipliedAlpha,doubleSided:E.side===Mn,flipSided:E.side===Xt,useDepthPacking:E.depthPacking>=0,depthPacking:E.depthPacking||0,index0AttributeName:E.index0AttributeName,extensionClipCullDistance:_e&&E.extensions.clipCullDistance===!0&&i.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(_e&&E.extensions.multiDraw===!0||ve)&&i.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:E.customProgramCacheKey()};return ft.vertexUv1s=d.has(1),ft.vertexUv2s=d.has(2),ft.vertexUv3s=d.has(3),d.clear(),ft}function g(E){const v=[];if(E.shaderID?v.push(E.shaderID):(v.push(E.customVertexShaderID),v.push(E.customFragmentShaderID)),E.defines!==void 0)for(const P in E.defines)v.push(P),v.push(E.defines[P]);return E.isRawShaderMaterial===!1&&(w(v,E),T(v,E),v.push(n.outputColorSpace)),v.push(E.customProgramCacheKey),v.join()}function w(E,v){E.push(v.precision),E.push(v.outputColorSpace),E.push(v.envMapMode),E.push(v.envMapCubeUVHeight),E.push(v.mapUv),E.push(v.alphaMapUv),E.push(v.lightMapUv),E.push(v.aoMapUv),E.push(v.bumpMapUv),E.push(v.normalMapUv),E.push(v.displacementMapUv),E.push(v.emissiveMapUv),E.push(v.metalnessMapUv),E.push(v.roughnessMapUv),E.push(v.anisotropyMapUv),E.push(v.clearcoatMapUv),E.push(v.clearcoatNormalMapUv),E.push(v.clearcoatRoughnessMapUv),E.push(v.iridescenceMapUv),E.push(v.iridescenceThicknessMapUv),E.push(v.sheenColorMapUv),E.push(v.sheenRoughnessMapUv),E.push(v.specularMapUv),E.push(v.specularColorMapUv),E.push(v.specularIntensityMapUv),E.push(v.transmissionMapUv),E.push(v.thicknessMapUv),E.push(v.combine),E.push(v.fogExp2),E.push(v.sizeAttenuation),E.push(v.morphTargetsCount),E.push(v.morphAttributeCount),E.push(v.numDirLights),E.push(v.numPointLights),E.push(v.numSpotLights),E.push(v.numSpotLightMaps),E.push(v.numHemiLights),E.push(v.numRectAreaLights),E.push(v.numDirLightShadows),E.push(v.numPointLightShadows),E.push(v.numSpotLightShadows),E.push(v.numSpotLightShadowsWithMaps),E.push(v.numLightProbes),E.push(v.shadowMapType),E.push(v.toneMapping),E.push(v.numClippingPlanes),E.push(v.numClipIntersection),E.push(v.depthPacking)}function T(E,v){c.disableAll(),v.supportsVertexTextures&&c.enable(0),v.instancing&&c.enable(1),v.instancingColor&&c.enable(2),v.instancingMorph&&c.enable(3),v.matcap&&c.enable(4),v.envMap&&c.enable(5),v.normalMapObjectSpace&&c.enable(6),v.normalMapTangentSpace&&c.enable(7),v.clearcoat&&c.enable(8),v.iridescence&&c.enable(9),v.alphaTest&&c.enable(10),v.vertexColors&&c.enable(11),v.vertexAlphas&&c.enable(12),v.vertexUv1s&&c.enable(13),v.vertexUv2s&&c.enable(14),v.vertexUv3s&&c.enable(15),v.vertexTangents&&c.enable(16),v.anisotropy&&c.enable(17),v.alphaHash&&c.enable(18),v.batching&&c.enable(19),v.dispersion&&c.enable(20),v.batchingColor&&c.enable(21),v.gradientMap&&c.enable(22),E.push(c.mask),c.disableAll(),v.fog&&c.enable(0),v.useFog&&c.enable(1),v.flatShading&&c.enable(2),v.logarithmicDepthBuffer&&c.enable(3),v.reversedDepthBuffer&&c.enable(4),v.skinning&&c.enable(5),v.morphTargets&&c.enable(6),v.morphNormals&&c.enable(7),v.morphColors&&c.enable(8),v.premultipliedAlpha&&c.enable(9),v.shadowMapEnabled&&c.enable(10),v.doubleSided&&c.enable(11),v.flipSided&&c.enable(12),v.useDepthPacking&&c.enable(13),v.dithering&&c.enable(14),v.transmission&&c.enable(15),v.sheen&&c.enable(16),v.opaque&&c.enable(17),v.pointsUvs&&c.enable(18),v.decodeVideoTexture&&c.enable(19),v.decodeVideoTextureEmissive&&c.enable(20),v.alphaToCoverage&&c.enable(21),E.push(c.mask)}function L(E){const v=_[E.type];let P;if(v){const O=En[v];P=kp.clone(O.uniforms)}else P=E.uniforms;return P}function R(E,v){let P;for(let O=0,B=f.length;O<B;O++){const W=f[O];if(W.cacheKey===v){P=W,++P.usedTimes;break}}return P===void 0&&(P=new g_(n,v,E,s),f.push(P)),P}function M(E){if(--E.usedTimes===0){const v=f.indexOf(E);f[v]=f[f.length-1],f.pop(),E.destroy()}}function A(E){l.remove(E)}function F(){l.dispose()}return{getParameters:x,getProgramCacheKey:g,getUniforms:L,acquireProgram:R,releaseProgram:M,releaseShaderCache:A,programs:f,dispose:F}}function v_(){let n=new WeakMap;function e(o){return n.has(o)}function t(o){let c=n.get(o);return c===void 0&&(c={},n.set(o,c)),c}function i(o){n.delete(o)}function r(o,c,l){n.get(o)[c]=l}function s(){n=new WeakMap}return{has:e,get:t,remove:i,update:r,dispose:s}}function S_(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.z!==e.z?n.z-e.z:n.id-e.id}function Id(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function Dd(){const n=[];let e=0;const t=[],i=[],r=[];function s(){e=0,t.length=0,i.length=0,r.length=0}function o(p,h,m,_,b,x){let g=n[e];return g===void 0?(g={id:p.id,object:p,geometry:h,material:m,groupOrder:_,renderOrder:p.renderOrder,z:b,group:x},n[e]=g):(g.id=p.id,g.object=p,g.geometry=h,g.material=m,g.groupOrder=_,g.renderOrder=p.renderOrder,g.z=b,g.group=x),e++,g}function c(p,h,m,_,b,x){const g=o(p,h,m,_,b,x);m.transmission>0?i.push(g):m.transparent===!0?r.push(g):t.push(g)}function l(p,h,m,_,b,x){const g=o(p,h,m,_,b,x);m.transmission>0?i.unshift(g):m.transparent===!0?r.unshift(g):t.unshift(g)}function d(p,h){t.length>1&&t.sort(p||S_),i.length>1&&i.sort(h||Id),r.length>1&&r.sort(h||Id)}function f(){for(let p=e,h=n.length;p<h;p++){const m=n[p];if(m.id===null)break;m.id=null,m.object=null,m.geometry=null,m.material=null,m.group=null}}return{opaque:t,transmissive:i,transparent:r,init:s,push:c,unshift:l,finish:f,sort:d}}function E_(){let n=new WeakMap;function e(i,r){const s=n.get(i);let o;return s===void 0?(o=new Dd,n.set(i,[o])):r>=s.length?(o=new Dd,s.push(o)):o=s[r],o}function t(){n=new WeakMap}return{get:e,dispose:t}}function M_(){const n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new k,color:new ze};break;case"SpotLight":t={position:new k,direction:new k,color:new ze,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new k,color:new ze,distance:0,decay:0};break;case"HemisphereLight":t={direction:new k,skyColor:new ze,groundColor:new ze};break;case"RectAreaLight":t={color:new ze,position:new k,halfWidth:new k,halfHeight:new k};break}return n[e.id]=t,t}}}function T_(){const n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Oe};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Oe};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Oe,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}let C_=0;function w_(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function A_(n){const e=new M_,t=T_(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let d=0;d<9;d++)i.probe.push(new k);const r=new k,s=new St,o=new St;function c(d){let f=0,p=0,h=0;for(let E=0;E<9;E++)i.probe[E].set(0,0,0);let m=0,_=0,b=0,x=0,g=0,w=0,T=0,L=0,R=0,M=0,A=0;d.sort(w_);for(let E=0,v=d.length;E<v;E++){const P=d[E],O=P.color,B=P.intensity,W=P.distance,H=P.shadow&&P.shadow.map?P.shadow.map.texture:null;if(P.isAmbientLight)f+=O.r*B,p+=O.g*B,h+=O.b*B;else if(P.isLightProbe){for(let X=0;X<9;X++)i.probe[X].addScaledVector(P.sh.coefficients[X],B);A++}else if(P.isDirectionalLight){const X=e.get(P);if(X.color.copy(P.color).multiplyScalar(P.intensity),P.castShadow){const Q=P.shadow,$=t.get(P);$.shadowIntensity=Q.intensity,$.shadowBias=Q.bias,$.shadowNormalBias=Q.normalBias,$.shadowRadius=Q.radius,$.shadowMapSize=Q.mapSize,i.directionalShadow[m]=$,i.directionalShadowMap[m]=H,i.directionalShadowMatrix[m]=P.shadow.matrix,w++}i.directional[m]=X,m++}else if(P.isSpotLight){const X=e.get(P);X.position.setFromMatrixPosition(P.matrixWorld),X.color.copy(O).multiplyScalar(B),X.distance=W,X.coneCos=Math.cos(P.angle),X.penumbraCos=Math.cos(P.angle*(1-P.penumbra)),X.decay=P.decay,i.spot[b]=X;const Q=P.shadow;if(P.map&&(i.spotLightMap[R]=P.map,R++,Q.updateMatrices(P),P.castShadow&&M++),i.spotLightMatrix[b]=Q.matrix,P.castShadow){const $=t.get(P);$.shadowIntensity=Q.intensity,$.shadowBias=Q.bias,$.shadowNormalBias=Q.normalBias,$.shadowRadius=Q.radius,$.shadowMapSize=Q.mapSize,i.spotShadow[b]=$,i.spotShadowMap[b]=H,L++}b++}else if(P.isRectAreaLight){const X=e.get(P);X.color.copy(O).multiplyScalar(B),X.halfWidth.set(P.width*.5,0,0),X.halfHeight.set(0,P.height*.5,0),i.rectArea[x]=X,x++}else if(P.isPointLight){const X=e.get(P);if(X.color.copy(P.color).multiplyScalar(P.intensity),X.distance=P.distance,X.decay=P.decay,P.castShadow){const Q=P.shadow,$=t.get(P);$.shadowIntensity=Q.intensity,$.shadowBias=Q.bias,$.shadowNormalBias=Q.normalBias,$.shadowRadius=Q.radius,$.shadowMapSize=Q.mapSize,$.shadowCameraNear=Q.camera.near,$.shadowCameraFar=Q.camera.far,i.pointShadow[_]=$,i.pointShadowMap[_]=H,i.pointShadowMatrix[_]=P.shadow.matrix,T++}i.point[_]=X,_++}else if(P.isHemisphereLight){const X=e.get(P);X.skyColor.copy(P.color).multiplyScalar(B),X.groundColor.copy(P.groundColor).multiplyScalar(B),i.hemi[g]=X,g++}}x>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=ce.LTC_FLOAT_1,i.rectAreaLTC2=ce.LTC_FLOAT_2):(i.rectAreaLTC1=ce.LTC_HALF_1,i.rectAreaLTC2=ce.LTC_HALF_2)),i.ambient[0]=f,i.ambient[1]=p,i.ambient[2]=h;const F=i.hash;(F.directionalLength!==m||F.pointLength!==_||F.spotLength!==b||F.rectAreaLength!==x||F.hemiLength!==g||F.numDirectionalShadows!==w||F.numPointShadows!==T||F.numSpotShadows!==L||F.numSpotMaps!==R||F.numLightProbes!==A)&&(i.directional.length=m,i.spot.length=b,i.rectArea.length=x,i.point.length=_,i.hemi.length=g,i.directionalShadow.length=w,i.directionalShadowMap.length=w,i.pointShadow.length=T,i.pointShadowMap.length=T,i.spotShadow.length=L,i.spotShadowMap.length=L,i.directionalShadowMatrix.length=w,i.pointShadowMatrix.length=T,i.spotLightMatrix.length=L+R-M,i.spotLightMap.length=R,i.numSpotLightShadowsWithMaps=M,i.numLightProbes=A,F.directionalLength=m,F.pointLength=_,F.spotLength=b,F.rectAreaLength=x,F.hemiLength=g,F.numDirectionalShadows=w,F.numPointShadows=T,F.numSpotShadows=L,F.numSpotMaps=R,F.numLightProbes=A,i.version=C_++)}function l(d,f){let p=0,h=0,m=0,_=0,b=0;const x=f.matrixWorldInverse;for(let g=0,w=d.length;g<w;g++){const T=d[g];if(T.isDirectionalLight){const L=i.directional[p];L.direction.setFromMatrixPosition(T.matrixWorld),r.setFromMatrixPosition(T.target.matrixWorld),L.direction.sub(r),L.direction.transformDirection(x),p++}else if(T.isSpotLight){const L=i.spot[m];L.position.setFromMatrixPosition(T.matrixWorld),L.position.applyMatrix4(x),L.direction.setFromMatrixPosition(T.matrixWorld),r.setFromMatrixPosition(T.target.matrixWorld),L.direction.sub(r),L.direction.transformDirection(x),m++}else if(T.isRectAreaLight){const L=i.rectArea[_];L.position.setFromMatrixPosition(T.matrixWorld),L.position.applyMatrix4(x),o.identity(),s.copy(T.matrixWorld),s.premultiply(x),o.extractRotation(s),L.halfWidth.set(T.width*.5,0,0),L.halfHeight.set(0,T.height*.5,0),L.halfWidth.applyMatrix4(o),L.halfHeight.applyMatrix4(o),_++}else if(T.isPointLight){const L=i.point[h];L.position.setFromMatrixPosition(T.matrixWorld),L.position.applyMatrix4(x),h++}else if(T.isHemisphereLight){const L=i.hemi[b];L.direction.setFromMatrixPosition(T.matrixWorld),L.direction.transformDirection(x),b++}}}return{setup:c,setupView:l,state:i}}function Fd(n){const e=new A_(n),t=[],i=[];function r(f){d.camera=f,t.length=0,i.length=0}function s(f){t.push(f)}function o(f){i.push(f)}function c(){e.setup(t)}function l(f){e.setupView(t,f)}const d={lightsArray:t,shadowsArray:i,camera:null,lights:e,transmissionRenderTarget:{}};return{init:r,state:d,setupLights:c,setupLightsView:l,pushLight:s,pushShadow:o}}function L_(n){let e=new WeakMap;function t(r,s=0){const o=e.get(r);let c;return o===void 0?(c=new Fd(n),e.set(r,[c])):s>=o.length?(c=new Fd(n),o.push(c)):c=o[s],c}function i(){e=new WeakMap}return{get:t,dispose:i}}const R_=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,P_=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function I_(n,e,t){let i=new $c;const r=new Oe,s=new Oe,o=new vt,c=new Qp({depthPacking:lp}),l=new em,d={},f=t.maxTextureSize,p={[ai]:Xt,[Xt]:ai,[Mn]:Mn},h=new jn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Oe},radius:{value:4}},vertexShader:R_,fragmentShader:P_}),m=h.clone();m.defines.HORIZONTAL_PASS=1;const _=new dn;_.setAttribute("position",new wn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const b=new Pn(_,h),x=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=_u;let g=this.type;this.render=function(M,A,F){if(x.enabled===!1||x.autoUpdate===!1&&x.needsUpdate===!1||M.length===0)return;const E=n.getRenderTarget(),v=n.getActiveCubeFace(),P=n.getActiveMipmapLevel(),O=n.state;O.setBlending(Vn),O.buffers.depth.getReversed()===!0?O.buffers.color.setClear(0,0,0,0):O.buffers.color.setClear(1,1,1,1),O.buffers.depth.setTest(!0),O.setScissorTest(!1);const B=g!==Bn&&this.type===Bn,W=g===Bn&&this.type!==Bn;for(let H=0,X=M.length;H<X;H++){const Q=M[H],$=Q.shadow;if($===void 0){Fe("WebGLShadowMap:",Q,"has no shadow.");continue}if($.autoUpdate===!1&&$.needsUpdate===!1)continue;r.copy($.mapSize);const ie=$.getFrameExtents();if(r.multiply(ie),s.copy($.mapSize),(r.x>f||r.y>f)&&(r.x>f&&(s.x=Math.floor(f/ie.x),r.x=s.x*ie.x,$.mapSize.x=s.x),r.y>f&&(s.y=Math.floor(f/ie.y),r.y=s.y*ie.y,$.mapSize.y=s.y)),$.map===null||B===!0||W===!0){const xe=this.type!==Bn?{minFilter:en,magFilter:en}:{};$.map!==null&&$.map.dispose(),$.map=new Ai(r.x,r.y,xe),$.map.texture.name=Q.name+".shadowMap",$.camera.updateProjectionMatrix()}n.setRenderTarget($.map),n.clear();const ne=$.getViewportCount();for(let xe=0;xe<ne;xe++){const je=$.getViewport(xe);o.set(s.x*je.x,s.y*je.y,s.x*je.z,s.y*je.w),O.viewport(o),$.updateMatrices(Q,xe),i=$.getFrustum(),L(A,F,$.camera,Q,this.type)}$.isPointLightShadow!==!0&&this.type===Bn&&w($,F),$.needsUpdate=!1}g=this.type,x.needsUpdate=!1,n.setRenderTarget(E,v,P)};function w(M,A){const F=e.update(b);h.defines.VSM_SAMPLES!==M.blurSamples&&(h.defines.VSM_SAMPLES=M.blurSamples,m.defines.VSM_SAMPLES=M.blurSamples,h.needsUpdate=!0,m.needsUpdate=!0),M.mapPass===null&&(M.mapPass=new Ai(r.x,r.y)),h.uniforms.shadow_pass.value=M.map.texture,h.uniforms.resolution.value=M.mapSize,h.uniforms.radius.value=M.radius,n.setRenderTarget(M.mapPass),n.clear(),n.renderBufferDirect(A,null,F,h,b,null),m.uniforms.shadow_pass.value=M.mapPass.texture,m.uniforms.resolution.value=M.mapSize,m.uniforms.radius.value=M.radius,n.setRenderTarget(M.map),n.clear(),n.renderBufferDirect(A,null,F,m,b,null)}function T(M,A,F,E){let v=null;const P=F.isPointLight===!0?M.customDistanceMaterial:M.customDepthMaterial;if(P!==void 0)v=P;else if(v=F.isPointLight===!0?l:c,n.localClippingEnabled&&A.clipShadows===!0&&Array.isArray(A.clippingPlanes)&&A.clippingPlanes.length!==0||A.displacementMap&&A.displacementScale!==0||A.alphaMap&&A.alphaTest>0||A.map&&A.alphaTest>0||A.alphaToCoverage===!0){const O=v.uuid,B=A.uuid;let W=d[O];W===void 0&&(W={},d[O]=W);let H=W[B];H===void 0&&(H=v.clone(),W[B]=H,A.addEventListener("dispose",R)),v=H}if(v.visible=A.visible,v.wireframe=A.wireframe,E===Bn?v.side=A.shadowSide!==null?A.shadowSide:A.side:v.side=A.shadowSide!==null?A.shadowSide:p[A.side],v.alphaMap=A.alphaMap,v.alphaTest=A.alphaToCoverage===!0?.5:A.alphaTest,v.map=A.map,v.clipShadows=A.clipShadows,v.clippingPlanes=A.clippingPlanes,v.clipIntersection=A.clipIntersection,v.displacementMap=A.displacementMap,v.displacementScale=A.displacementScale,v.displacementBias=A.displacementBias,v.wireframeLinewidth=A.wireframeLinewidth,v.linewidth=A.linewidth,F.isPointLight===!0&&v.isMeshDistanceMaterial===!0){const O=n.properties.get(v);O.light=F}return v}function L(M,A,F,E,v){if(M.visible===!1)return;if(M.layers.test(A.layers)&&(M.isMesh||M.isLine||M.isPoints)&&(M.castShadow||M.receiveShadow&&v===Bn)&&(!M.frustumCulled||i.intersectsObject(M))){M.modelViewMatrix.multiplyMatrices(F.matrixWorldInverse,M.matrixWorld);const B=e.update(M),W=M.material;if(Array.isArray(W)){const H=B.groups;for(let X=0,Q=H.length;X<Q;X++){const $=H[X],ie=W[$.materialIndex];if(ie&&ie.visible){const ne=T(M,ie,E,v);M.onBeforeShadow(n,M,A,F,B,ne,$),n.renderBufferDirect(F,null,B,ne,M,$),M.onAfterShadow(n,M,A,F,B,ne,$)}}}else if(W.visible){const H=T(M,W,E,v);M.onBeforeShadow(n,M,A,F,B,H,null),n.renderBufferDirect(F,null,B,H,M,null),M.onAfterShadow(n,M,A,F,B,H,null)}}const O=M.children;for(let B=0,W=O.length;B<W;B++)L(O[B],A,F,E,v)}function R(M){M.target.removeEventListener("dispose",R);for(const F in d){const E=d[F],v=M.target.uuid;v in E&&(E[v].dispose(),delete E[v])}}}const D_={[Po]:Io,[Do]:Uo,[Fo]:Oo,[ur]:No,[Io]:Po,[Uo]:Do,[Oo]:Fo,[No]:ur};function F_(n,e){function t(){let D=!1;const de=new vt;let ae=null;const oe=new vt(0,0,0,0);return{setMask:function(te){ae!==te&&!D&&(n.colorMask(te,te,te,te),ae=te)},setLocked:function(te){D=te},setClear:function(te,K,_e,Ne,ft){ft===!0&&(te*=Ne,K*=Ne,_e*=Ne),de.set(te,K,_e,Ne),oe.equals(de)===!1&&(n.clearColor(te,K,_e,Ne),oe.copy(de))},reset:function(){D=!1,ae=null,oe.set(-1,0,0,0)}}}function i(){let D=!1,de=!1,ae=null,oe=null,te=null;return{setReversed:function(K){if(de!==K){const _e=e.get("EXT_clip_control");K?_e.clipControlEXT(_e.LOWER_LEFT_EXT,_e.ZERO_TO_ONE_EXT):_e.clipControlEXT(_e.LOWER_LEFT_EXT,_e.NEGATIVE_ONE_TO_ONE_EXT),de=K;const Ne=te;te=null,this.setClear(Ne)}},getReversed:function(){return de},setTest:function(K){K?J(n.DEPTH_TEST):me(n.DEPTH_TEST)},setMask:function(K){ae!==K&&!D&&(n.depthMask(K),ae=K)},setFunc:function(K){if(de&&(K=D_[K]),oe!==K){switch(K){case Po:n.depthFunc(n.NEVER);break;case Io:n.depthFunc(n.ALWAYS);break;case Do:n.depthFunc(n.LESS);break;case ur:n.depthFunc(n.LEQUAL);break;case Fo:n.depthFunc(n.EQUAL);break;case No:n.depthFunc(n.GEQUAL);break;case Uo:n.depthFunc(n.GREATER);break;case Oo:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}oe=K}},setLocked:function(K){D=K},setClear:function(K){te!==K&&(de&&(K=1-K),n.clearDepth(K),te=K)},reset:function(){D=!1,ae=null,oe=null,te=null,de=!1}}}function r(){let D=!1,de=null,ae=null,oe=null,te=null,K=null,_e=null,Ne=null,ft=null;return{setTest:function(rt){D||(rt?J(n.STENCIL_TEST):me(n.STENCIL_TEST))},setMask:function(rt){de!==rt&&!D&&(n.stencilMask(rt),de=rt)},setFunc:function(rt,vn,un){(ae!==rt||oe!==vn||te!==un)&&(n.stencilFunc(rt,vn,un),ae=rt,oe=vn,te=un)},setOp:function(rt,vn,un){(K!==rt||_e!==vn||Ne!==un)&&(n.stencilOp(rt,vn,un),K=rt,_e=vn,Ne=un)},setLocked:function(rt){D=rt},setClear:function(rt){ft!==rt&&(n.clearStencil(rt),ft=rt)},reset:function(){D=!1,de=null,ae=null,oe=null,te=null,K=null,_e=null,Ne=null,ft=null}}}const s=new t,o=new i,c=new r,l=new WeakMap,d=new WeakMap;let f={},p={},h=new WeakMap,m=[],_=null,b=!1,x=null,g=null,w=null,T=null,L=null,R=null,M=null,A=new ze(0,0,0),F=0,E=!1,v=null,P=null,O=null,B=null,W=null;const H=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let X=!1,Q=0;const $=n.getParameter(n.VERSION);$.indexOf("WebGL")!==-1?(Q=parseFloat(/^WebGL (\d)/.exec($)[1]),X=Q>=1):$.indexOf("OpenGL ES")!==-1&&(Q=parseFloat(/^OpenGL ES (\d)/.exec($)[1]),X=Q>=2);let ie=null,ne={};const xe=n.getParameter(n.SCISSOR_BOX),je=n.getParameter(n.VIEWPORT),tt=new vt().fromArray(xe),nt=new vt().fromArray(je);function it(D,de,ae,oe){const te=new Uint8Array(4),K=n.createTexture();n.bindTexture(D,K),n.texParameteri(D,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(D,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let _e=0;_e<ae;_e++)D===n.TEXTURE_3D||D===n.TEXTURE_2D_ARRAY?n.texImage3D(de,0,n.RGBA,1,1,oe,0,n.RGBA,n.UNSIGNED_BYTE,te):n.texImage2D(de+_e,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,te);return K}const q={};q[n.TEXTURE_2D]=it(n.TEXTURE_2D,n.TEXTURE_2D,1),q[n.TEXTURE_CUBE_MAP]=it(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),q[n.TEXTURE_2D_ARRAY]=it(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),q[n.TEXTURE_3D]=it(n.TEXTURE_3D,n.TEXTURE_3D,1,1),s.setClear(0,0,0,1),o.setClear(1),c.setClear(0),J(n.DEPTH_TEST),o.setFunc(ur),Xe(!1),qe(Il),J(n.CULL_FACE),ht(Vn);function J(D){f[D]!==!0&&(n.enable(D),f[D]=!0)}function me(D){f[D]!==!1&&(n.disable(D),f[D]=!1)}function De(D,de){return p[D]!==de?(n.bindFramebuffer(D,de),p[D]=de,D===n.DRAW_FRAMEBUFFER&&(p[n.FRAMEBUFFER]=de),D===n.FRAMEBUFFER&&(p[n.DRAW_FRAMEBUFFER]=de),!0):!1}function ve(D,de){let ae=m,oe=!1;if(D){ae=h.get(de),ae===void 0&&(ae=[],h.set(de,ae));const te=D.textures;if(ae.length!==te.length||ae[0]!==n.COLOR_ATTACHMENT0){for(let K=0,_e=te.length;K<_e;K++)ae[K]=n.COLOR_ATTACHMENT0+K;ae.length=te.length,oe=!0}}else ae[0]!==n.BACK&&(ae[0]=n.BACK,oe=!0);oe&&n.drawBuffers(ae)}function $e(D){return _!==D?(n.useProgram(D),_=D,!0):!1}const It={[yi]:n.FUNC_ADD,[Nh]:n.FUNC_SUBTRACT,[Uh]:n.FUNC_REVERSE_SUBTRACT};It[Oh]=n.MIN,It[Bh]=n.MAX;const He={[Gh]:n.ZERO,[kh]:n.ONE,[zh]:n.SRC_COLOR,[Lo]:n.SRC_ALPHA,[Xh]:n.SRC_ALPHA_SATURATE,[jh]:n.DST_COLOR,[Hh]:n.DST_ALPHA,[Vh]:n.ONE_MINUS_SRC_COLOR,[Ro]:n.ONE_MINUS_SRC_ALPHA,[$h]:n.ONE_MINUS_DST_COLOR,[Wh]:n.ONE_MINUS_DST_ALPHA,[qh]:n.CONSTANT_COLOR,[Yh]:n.ONE_MINUS_CONSTANT_COLOR,[Kh]:n.CONSTANT_ALPHA,[Jh]:n.ONE_MINUS_CONSTANT_ALPHA};function ht(D,de,ae,oe,te,K,_e,Ne,ft,rt){if(D===Vn){b===!0&&(me(n.BLEND),b=!1);return}if(b===!1&&(J(n.BLEND),b=!0),D!==Fh){if(D!==x||rt!==E){if((g!==yi||L!==yi)&&(n.blendEquation(n.FUNC_ADD),g=yi,L=yi),rt)switch(D){case or:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Dl:n.blendFunc(n.ONE,n.ONE);break;case Fl:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Nl:n.blendFuncSeparate(n.DST_COLOR,n.ONE_MINUS_SRC_ALPHA,n.ZERO,n.ONE);break;default:Mt("WebGLState: Invalid blending: ",D);break}else switch(D){case or:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Dl:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE,n.ONE,n.ONE);break;case Fl:Mt("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Nl:Mt("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Mt("WebGLState: Invalid blending: ",D);break}w=null,T=null,R=null,M=null,A.set(0,0,0),F=0,x=D,E=rt}return}te=te||de,K=K||ae,_e=_e||oe,(de!==g||te!==L)&&(n.blendEquationSeparate(It[de],It[te]),g=de,L=te),(ae!==w||oe!==T||K!==R||_e!==M)&&(n.blendFuncSeparate(He[ae],He[oe],He[K],He[_e]),w=ae,T=oe,R=K,M=_e),(Ne.equals(A)===!1||ft!==F)&&(n.blendColor(Ne.r,Ne.g,Ne.b,ft),A.copy(Ne),F=ft),x=D,E=!1}function I(D,de){D.side===Mn?me(n.CULL_FACE):J(n.CULL_FACE);let ae=D.side===Xt;de&&(ae=!ae),Xe(ae),D.blending===or&&D.transparent===!1?ht(Vn):ht(D.blending,D.blendEquation,D.blendSrc,D.blendDst,D.blendEquationAlpha,D.blendSrcAlpha,D.blendDstAlpha,D.blendColor,D.blendAlpha,D.premultipliedAlpha),o.setFunc(D.depthFunc),o.setTest(D.depthTest),o.setMask(D.depthWrite),s.setMask(D.colorWrite);const oe=D.stencilWrite;c.setTest(oe),oe&&(c.setMask(D.stencilWriteMask),c.setFunc(D.stencilFunc,D.stencilRef,D.stencilFuncMask),c.setOp(D.stencilFail,D.stencilZFail,D.stencilZPass)),ye(D.polygonOffset,D.polygonOffsetFactor,D.polygonOffsetUnits),D.alphaToCoverage===!0?J(n.SAMPLE_ALPHA_TO_COVERAGE):me(n.SAMPLE_ALPHA_TO_COVERAGE)}function Xe(D){v!==D&&(D?n.frontFace(n.CW):n.frontFace(n.CCW),v=D)}function qe(D){D!==Ph?(J(n.CULL_FACE),D!==P&&(D===Il?n.cullFace(n.BACK):D===Ih?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):me(n.CULL_FACE),P=D}function lt(D){D!==O&&(X&&n.lineWidth(D),O=D)}function ye(D,de,ae){D?(J(n.POLYGON_OFFSET_FILL),(B!==de||W!==ae)&&(n.polygonOffset(de,ae),B=de,W=ae)):me(n.POLYGON_OFFSET_FILL)}function gt(D){D?J(n.SCISSOR_TEST):me(n.SCISSOR_TEST)}function Te(D){D===void 0&&(D=n.TEXTURE0+H-1),ie!==D&&(n.activeTexture(D),ie=D)}function Ue(D,de,ae){ae===void 0&&(ie===null?ae=n.TEXTURE0+H-1:ae=ie);let oe=ne[ae];oe===void 0&&(oe={type:void 0,texture:void 0},ne[ae]=oe),(oe.type!==D||oe.texture!==de)&&(ie!==ae&&(n.activeTexture(ae),ie=ae),n.bindTexture(D,de||q[D]),oe.type=D,oe.texture=de)}function C(){const D=ne[ie];D!==void 0&&D.type!==void 0&&(n.bindTexture(D.type,null),D.type=void 0,D.texture=void 0)}function y(){try{n.compressedTexImage2D(...arguments)}catch(D){D("WebGLState:",D)}}function G(){try{n.compressedTexImage3D(...arguments)}catch(D){D("WebGLState:",D)}}function Y(){try{n.texSubImage2D(...arguments)}catch(D){D("WebGLState:",D)}}function Z(){try{n.texSubImage3D(...arguments)}catch(D){D("WebGLState:",D)}}function j(){try{n.compressedTexSubImage2D(...arguments)}catch(D){D("WebGLState:",D)}}function Ee(){try{n.compressedTexSubImage3D(...arguments)}catch(D){D("WebGLState:",D)}}function le(){try{n.texStorage2D(...arguments)}catch(D){D("WebGLState:",D)}}function Ce(){try{n.texStorage3D(...arguments)}catch(D){D("WebGLState:",D)}}function Se(){try{n.texImage2D(...arguments)}catch(D){D("WebGLState:",D)}}function ee(){try{n.texImage3D(...arguments)}catch(D){D("WebGLState:",D)}}function se(D){tt.equals(D)===!1&&(n.scissor(D.x,D.y,D.z,D.w),tt.copy(D))}function Re(D){nt.equals(D)===!1&&(n.viewport(D.x,D.y,D.z,D.w),nt.copy(D))}function Ae(D,de){let ae=d.get(de);ae===void 0&&(ae=new WeakMap,d.set(de,ae));let oe=ae.get(D);oe===void 0&&(oe=n.getUniformBlockIndex(de,D.name),ae.set(D,oe))}function he(D,de){const oe=d.get(de).get(D);l.get(de)!==oe&&(n.uniformBlockBinding(de,oe,D.__bindingPointIndex),l.set(de,oe))}function Ie(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),o.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),f={},ie=null,ne={},p={},h=new WeakMap,m=[],_=null,b=!1,x=null,g=null,w=null,T=null,L=null,R=null,M=null,A=new ze(0,0,0),F=0,E=!1,v=null,P=null,O=null,B=null,W=null,tt.set(0,0,n.canvas.width,n.canvas.height),nt.set(0,0,n.canvas.width,n.canvas.height),s.reset(),o.reset(),c.reset()}return{buffers:{color:s,depth:o,stencil:c},enable:J,disable:me,bindFramebuffer:De,drawBuffers:ve,useProgram:$e,setBlending:ht,setMaterial:I,setFlipSided:Xe,setCullFace:qe,setLineWidth:lt,setPolygonOffset:ye,setScissorTest:gt,activeTexture:Te,bindTexture:Ue,unbindTexture:C,compressedTexImage2D:y,compressedTexImage3D:G,texImage2D:Se,texImage3D:ee,updateUBOMapping:Ae,uniformBlockBinding:he,texStorage2D:le,texStorage3D:Ce,texSubImage2D:Y,texSubImage3D:Z,compressedTexSubImage2D:j,compressedTexSubImage3D:Ee,scissor:se,viewport:Re,reset:Ie}}function N_(n,e,t,i,r,s,o){const c=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),d=new Oe,f=new WeakMap;let p;const h=new WeakMap;let m=!1;try{m=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function _(C,y){return m?new OffscreenCanvas(C,y):pa("canvas")}function b(C,y,G){let Y=1;const Z=Ue(C);if((Z.width>G||Z.height>G)&&(Y=G/Math.max(Z.width,Z.height)),Y<1)if(typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&C instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&C instanceof ImageBitmap||typeof VideoFrame<"u"&&C instanceof VideoFrame){const j=Math.floor(Y*Z.width),Ee=Math.floor(Y*Z.height);p===void 0&&(p=_(j,Ee));const le=y?_(j,Ee):p;return le.width=j,le.height=Ee,le.getContext("2d").drawImage(C,0,0,j,Ee),Fe("WebGLRenderer: Texture has been resized from ("+Z.width+"x"+Z.height+") to ("+j+"x"+Ee+")."),le}else return"data"in C&&Fe("WebGLRenderer: Image in DataTexture is too big ("+Z.width+"x"+Z.height+")."),C;return C}function x(C){return C.generateMipmaps}function g(C){n.generateMipmap(C)}function w(C){return C.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:C.isWebGL3DRenderTarget?n.TEXTURE_3D:C.isWebGLArrayRenderTarget||C.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function T(C,y,G,Y,Z=!1){if(C!==null){if(n[C]!==void 0)return n[C];Fe("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+C+"'")}let j=y;if(y===n.RED&&(G===n.FLOAT&&(j=n.R32F),G===n.HALF_FLOAT&&(j=n.R16F),G===n.UNSIGNED_BYTE&&(j=n.R8)),y===n.RED_INTEGER&&(G===n.UNSIGNED_BYTE&&(j=n.R8UI),G===n.UNSIGNED_SHORT&&(j=n.R16UI),G===n.UNSIGNED_INT&&(j=n.R32UI),G===n.BYTE&&(j=n.R8I),G===n.SHORT&&(j=n.R16I),G===n.INT&&(j=n.R32I)),y===n.RG&&(G===n.FLOAT&&(j=n.RG32F),G===n.HALF_FLOAT&&(j=n.RG16F),G===n.UNSIGNED_BYTE&&(j=n.RG8)),y===n.RG_INTEGER&&(G===n.UNSIGNED_BYTE&&(j=n.RG8UI),G===n.UNSIGNED_SHORT&&(j=n.RG16UI),G===n.UNSIGNED_INT&&(j=n.RG32UI),G===n.BYTE&&(j=n.RG8I),G===n.SHORT&&(j=n.RG16I),G===n.INT&&(j=n.RG32I)),y===n.RGB_INTEGER&&(G===n.UNSIGNED_BYTE&&(j=n.RGB8UI),G===n.UNSIGNED_SHORT&&(j=n.RGB16UI),G===n.UNSIGNED_INT&&(j=n.RGB32UI),G===n.BYTE&&(j=n.RGB8I),G===n.SHORT&&(j=n.RGB16I),G===n.INT&&(j=n.RGB32I)),y===n.RGBA_INTEGER&&(G===n.UNSIGNED_BYTE&&(j=n.RGBA8UI),G===n.UNSIGNED_SHORT&&(j=n.RGBA16UI),G===n.UNSIGNED_INT&&(j=n.RGBA32UI),G===n.BYTE&&(j=n.RGBA8I),G===n.SHORT&&(j=n.RGBA16I),G===n.INT&&(j=n.RGBA32I)),y===n.RGB&&(G===n.UNSIGNED_INT_5_9_9_9_REV&&(j=n.RGB9_E5),G===n.UNSIGNED_INT_10F_11F_11F_REV&&(j=n.R11F_G11F_B10F)),y===n.RGBA){const Ee=Z?fa:Qe.getTransfer(Y);G===n.FLOAT&&(j=n.RGBA32F),G===n.HALF_FLOAT&&(j=n.RGBA16F),G===n.UNSIGNED_BYTE&&(j=Ee===at?n.SRGB8_ALPHA8:n.RGBA8),G===n.UNSIGNED_SHORT_4_4_4_4&&(j=n.RGBA4),G===n.UNSIGNED_SHORT_5_5_5_1&&(j=n.RGB5_A1)}return(j===n.R16F||j===n.R32F||j===n.RG16F||j===n.RG32F||j===n.RGBA16F||j===n.RGBA32F)&&e.get("EXT_color_buffer_float"),j}function L(C,y){let G;return C?y===null||y===Ci||y===Jr?G=n.DEPTH24_STENCIL8:y===zn?G=n.DEPTH32F_STENCIL8:y===Kr&&(G=n.DEPTH24_STENCIL8,Fe("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):y===null||y===Ci||y===Jr?G=n.DEPTH_COMPONENT24:y===zn?G=n.DEPTH_COMPONENT32F:y===Kr&&(G=n.DEPTH_COMPONENT16),G}function R(C,y){return x(C)===!0||C.isFramebufferTexture&&C.minFilter!==en&&C.minFilter!==cn?Math.log2(Math.max(y.width,y.height))+1:C.mipmaps!==void 0&&C.mipmaps.length>0?C.mipmaps.length:C.isCompressedTexture&&Array.isArray(C.image)?y.mipmaps.length:1}function M(C){const y=C.target;y.removeEventListener("dispose",M),F(y),y.isVideoTexture&&f.delete(y)}function A(C){const y=C.target;y.removeEventListener("dispose",A),v(y)}function F(C){const y=i.get(C);if(y.__webglInit===void 0)return;const G=C.source,Y=h.get(G);if(Y){const Z=Y[y.__cacheKey];Z.usedTimes--,Z.usedTimes===0&&E(C),Object.keys(Y).length===0&&h.delete(G)}i.remove(C)}function E(C){const y=i.get(C);n.deleteTexture(y.__webglTexture);const G=C.source,Y=h.get(G);delete Y[y.__cacheKey],o.memory.textures--}function v(C){const y=i.get(C);if(C.depthTexture&&(C.depthTexture.dispose(),i.remove(C.depthTexture)),C.isWebGLCubeRenderTarget)for(let Y=0;Y<6;Y++){if(Array.isArray(y.__webglFramebuffer[Y]))for(let Z=0;Z<y.__webglFramebuffer[Y].length;Z++)n.deleteFramebuffer(y.__webglFramebuffer[Y][Z]);else n.deleteFramebuffer(y.__webglFramebuffer[Y]);y.__webglDepthbuffer&&n.deleteRenderbuffer(y.__webglDepthbuffer[Y])}else{if(Array.isArray(y.__webglFramebuffer))for(let Y=0;Y<y.__webglFramebuffer.length;Y++)n.deleteFramebuffer(y.__webglFramebuffer[Y]);else n.deleteFramebuffer(y.__webglFramebuffer);if(y.__webglDepthbuffer&&n.deleteRenderbuffer(y.__webglDepthbuffer),y.__webglMultisampledFramebuffer&&n.deleteFramebuffer(y.__webglMultisampledFramebuffer),y.__webglColorRenderbuffer)for(let Y=0;Y<y.__webglColorRenderbuffer.length;Y++)y.__webglColorRenderbuffer[Y]&&n.deleteRenderbuffer(y.__webglColorRenderbuffer[Y]);y.__webglDepthRenderbuffer&&n.deleteRenderbuffer(y.__webglDepthRenderbuffer)}const G=C.textures;for(let Y=0,Z=G.length;Y<Z;Y++){const j=i.get(G[Y]);j.__webglTexture&&(n.deleteTexture(j.__webglTexture),o.memory.textures--),i.remove(G[Y])}i.remove(C)}let P=0;function O(){P=0}function B(){const C=P;return C>=r.maxTextures&&Fe("WebGLTextures: Trying to use "+C+" texture units while this GPU supports only "+r.maxTextures),P+=1,C}function W(C){const y=[];return y.push(C.wrapS),y.push(C.wrapT),y.push(C.wrapR||0),y.push(C.magFilter),y.push(C.minFilter),y.push(C.anisotropy),y.push(C.internalFormat),y.push(C.format),y.push(C.type),y.push(C.generateMipmaps),y.push(C.premultiplyAlpha),y.push(C.flipY),y.push(C.unpackAlignment),y.push(C.colorSpace),y.join()}function H(C,y){const G=i.get(C);if(C.isVideoTexture&&gt(C),C.isRenderTargetTexture===!1&&C.isExternalTexture!==!0&&C.version>0&&G.__version!==C.version){const Y=C.image;if(Y===null)Fe("WebGLRenderer: Texture marked for update but no image data found.");else if(Y.complete===!1)Fe("WebGLRenderer: Texture marked for update but image is incomplete");else{q(G,C,y);return}}else C.isExternalTexture&&(G.__webglTexture=C.sourceTexture?C.sourceTexture:null);t.bindTexture(n.TEXTURE_2D,G.__webglTexture,n.TEXTURE0+y)}function X(C,y){const G=i.get(C);if(C.isRenderTargetTexture===!1&&C.version>0&&G.__version!==C.version){q(G,C,y);return}else C.isExternalTexture&&(G.__webglTexture=C.sourceTexture?C.sourceTexture:null);t.bindTexture(n.TEXTURE_2D_ARRAY,G.__webglTexture,n.TEXTURE0+y)}function Q(C,y){const G=i.get(C);if(C.isRenderTargetTexture===!1&&C.version>0&&G.__version!==C.version){q(G,C,y);return}t.bindTexture(n.TEXTURE_3D,G.__webglTexture,n.TEXTURE0+y)}function $(C,y){const G=i.get(C);if(C.version>0&&G.__version!==C.version){J(G,C,y);return}t.bindTexture(n.TEXTURE_CUBE_MAP,G.__webglTexture,n.TEXTURE0+y)}const ie={[ko]:n.REPEAT,[kn]:n.CLAMP_TO_EDGE,[zo]:n.MIRRORED_REPEAT},ne={[en]:n.NEAREST,[op]:n.NEAREST_MIPMAP_NEAREST,[ms]:n.NEAREST_MIPMAP_LINEAR,[cn]:n.LINEAR,[Ba]:n.LINEAR_MIPMAP_NEAREST,[Si]:n.LINEAR_MIPMAP_LINEAR},xe={[up]:n.NEVER,[xp]:n.ALWAYS,[fp]:n.LESS,[Lu]:n.LEQUAL,[hp]:n.EQUAL,[gp]:n.GEQUAL,[pp]:n.GREATER,[mp]:n.NOTEQUAL};function je(C,y){if(y.type===zn&&e.has("OES_texture_float_linear")===!1&&(y.magFilter===cn||y.magFilter===Ba||y.magFilter===ms||y.magFilter===Si||y.minFilter===cn||y.minFilter===Ba||y.minFilter===ms||y.minFilter===Si)&&Fe("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(C,n.TEXTURE_WRAP_S,ie[y.wrapS]),n.texParameteri(C,n.TEXTURE_WRAP_T,ie[y.wrapT]),(C===n.TEXTURE_3D||C===n.TEXTURE_2D_ARRAY)&&n.texParameteri(C,n.TEXTURE_WRAP_R,ie[y.wrapR]),n.texParameteri(C,n.TEXTURE_MAG_FILTER,ne[y.magFilter]),n.texParameteri(C,n.TEXTURE_MIN_FILTER,ne[y.minFilter]),y.compareFunction&&(n.texParameteri(C,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(C,n.TEXTURE_COMPARE_FUNC,xe[y.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(y.magFilter===en||y.minFilter!==ms&&y.minFilter!==Si||y.type===zn&&e.has("OES_texture_float_linear")===!1)return;if(y.anisotropy>1||i.get(y).__currentAnisotropy){const G=e.get("EXT_texture_filter_anisotropic");n.texParameterf(C,G.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(y.anisotropy,r.getMaxAnisotropy())),i.get(y).__currentAnisotropy=y.anisotropy}}}function tt(C,y){let G=!1;C.__webglInit===void 0&&(C.__webglInit=!0,y.addEventListener("dispose",M));const Y=y.source;let Z=h.get(Y);Z===void 0&&(Z={},h.set(Y,Z));const j=W(y);if(j!==C.__cacheKey){Z[j]===void 0&&(Z[j]={texture:n.createTexture(),usedTimes:0},o.memory.textures++,G=!0),Z[j].usedTimes++;const Ee=Z[C.__cacheKey];Ee!==void 0&&(Z[C.__cacheKey].usedTimes--,Ee.usedTimes===0&&E(y)),C.__cacheKey=j,C.__webglTexture=Z[j].texture}return G}function nt(C,y,G){return Math.floor(Math.floor(C/G)/y)}function it(C,y,G,Y){const j=C.updateRanges;if(j.length===0)t.texSubImage2D(n.TEXTURE_2D,0,0,0,y.width,y.height,G,Y,y.data);else{j.sort((ee,se)=>ee.start-se.start);let Ee=0;for(let ee=1;ee<j.length;ee++){const se=j[Ee],Re=j[ee],Ae=se.start+se.count,he=nt(Re.start,y.width,4),Ie=nt(se.start,y.width,4);Re.start<=Ae+1&&he===Ie&&nt(Re.start+Re.count-1,y.width,4)===he?se.count=Math.max(se.count,Re.start+Re.count-se.start):(++Ee,j[Ee]=Re)}j.length=Ee+1;const le=n.getParameter(n.UNPACK_ROW_LENGTH),Ce=n.getParameter(n.UNPACK_SKIP_PIXELS),Se=n.getParameter(n.UNPACK_SKIP_ROWS);n.pixelStorei(n.UNPACK_ROW_LENGTH,y.width);for(let ee=0,se=j.length;ee<se;ee++){const Re=j[ee],Ae=Math.floor(Re.start/4),he=Math.ceil(Re.count/4),Ie=Ae%y.width,D=Math.floor(Ae/y.width),de=he,ae=1;n.pixelStorei(n.UNPACK_SKIP_PIXELS,Ie),n.pixelStorei(n.UNPACK_SKIP_ROWS,D),t.texSubImage2D(n.TEXTURE_2D,0,Ie,D,de,ae,G,Y,y.data)}C.clearUpdateRanges(),n.pixelStorei(n.UNPACK_ROW_LENGTH,le),n.pixelStorei(n.UNPACK_SKIP_PIXELS,Ce),n.pixelStorei(n.UNPACK_SKIP_ROWS,Se)}}function q(C,y,G){let Y=n.TEXTURE_2D;(y.isDataArrayTexture||y.isCompressedArrayTexture)&&(Y=n.TEXTURE_2D_ARRAY),y.isData3DTexture&&(Y=n.TEXTURE_3D);const Z=tt(C,y),j=y.source;t.bindTexture(Y,C.__webglTexture,n.TEXTURE0+G);const Ee=i.get(j);if(j.version!==Ee.__version||Z===!0){t.activeTexture(n.TEXTURE0+G);const le=Qe.getPrimaries(Qe.workingColorSpace),Ce=y.colorSpace===ti?null:Qe.getPrimaries(y.colorSpace),Se=y.colorSpace===ti||le===Ce?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,y.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,y.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,Se);let ee=b(y.image,!1,r.maxTextureSize);ee=Te(y,ee);const se=s.convert(y.format,y.colorSpace),Re=s.convert(y.type);let Ae=T(y.internalFormat,se,Re,y.colorSpace,y.isVideoTexture);je(Y,y);let he;const Ie=y.mipmaps,D=y.isVideoTexture!==!0,de=Ee.__version===void 0||Z===!0,ae=j.dataReady,oe=R(y,ee);if(y.isDepthTexture)Ae=L(y.format===Qr,y.type),de&&(D?t.texStorage2D(n.TEXTURE_2D,1,Ae,ee.width,ee.height):t.texImage2D(n.TEXTURE_2D,0,Ae,ee.width,ee.height,0,se,Re,null));else if(y.isDataTexture)if(Ie.length>0){D&&de&&t.texStorage2D(n.TEXTURE_2D,oe,Ae,Ie[0].width,Ie[0].height);for(let te=0,K=Ie.length;te<K;te++)he=Ie[te],D?ae&&t.texSubImage2D(n.TEXTURE_2D,te,0,0,he.width,he.height,se,Re,he.data):t.texImage2D(n.TEXTURE_2D,te,Ae,he.width,he.height,0,se,Re,he.data);y.generateMipmaps=!1}else D?(de&&t.texStorage2D(n.TEXTURE_2D,oe,Ae,ee.width,ee.height),ae&&it(y,ee,se,Re)):t.texImage2D(n.TEXTURE_2D,0,Ae,ee.width,ee.height,0,se,Re,ee.data);else if(y.isCompressedTexture)if(y.isCompressedArrayTexture){D&&de&&t.texStorage3D(n.TEXTURE_2D_ARRAY,oe,Ae,Ie[0].width,Ie[0].height,ee.depth);for(let te=0,K=Ie.length;te<K;te++)if(he=Ie[te],y.format!==xn)if(se!==null)if(D){if(ae)if(y.layerUpdates.size>0){const _e=ud(he.width,he.height,y.format,y.type);for(const Ne of y.layerUpdates){const ft=he.data.subarray(Ne*_e/he.data.BYTES_PER_ELEMENT,(Ne+1)*_e/he.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,te,0,0,Ne,he.width,he.height,1,se,ft)}y.clearLayerUpdates()}else t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,te,0,0,0,he.width,he.height,ee.depth,se,he.data)}else t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,te,Ae,he.width,he.height,ee.depth,0,he.data,0,0);else Fe("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else D?ae&&t.texSubImage3D(n.TEXTURE_2D_ARRAY,te,0,0,0,he.width,he.height,ee.depth,se,Re,he.data):t.texImage3D(n.TEXTURE_2D_ARRAY,te,Ae,he.width,he.height,ee.depth,0,se,Re,he.data)}else{D&&de&&t.texStorage2D(n.TEXTURE_2D,oe,Ae,Ie[0].width,Ie[0].height);for(let te=0,K=Ie.length;te<K;te++)he=Ie[te],y.format!==xn?se!==null?D?ae&&t.compressedTexSubImage2D(n.TEXTURE_2D,te,0,0,he.width,he.height,se,he.data):t.compressedTexImage2D(n.TEXTURE_2D,te,Ae,he.width,he.height,0,he.data):Fe("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):D?ae&&t.texSubImage2D(n.TEXTURE_2D,te,0,0,he.width,he.height,se,Re,he.data):t.texImage2D(n.TEXTURE_2D,te,Ae,he.width,he.height,0,se,Re,he.data)}else if(y.isDataArrayTexture)if(D){if(de&&t.texStorage3D(n.TEXTURE_2D_ARRAY,oe,Ae,ee.width,ee.height,ee.depth),ae)if(y.layerUpdates.size>0){const te=ud(ee.width,ee.height,y.format,y.type);for(const K of y.layerUpdates){const _e=ee.data.subarray(K*te/ee.data.BYTES_PER_ELEMENT,(K+1)*te/ee.data.BYTES_PER_ELEMENT);t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,K,ee.width,ee.height,1,se,Re,_e)}y.clearLayerUpdates()}else t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,ee.width,ee.height,ee.depth,se,Re,ee.data)}else t.texImage3D(n.TEXTURE_2D_ARRAY,0,Ae,ee.width,ee.height,ee.depth,0,se,Re,ee.data);else if(y.isData3DTexture)D?(de&&t.texStorage3D(n.TEXTURE_3D,oe,Ae,ee.width,ee.height,ee.depth),ae&&t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,ee.width,ee.height,ee.depth,se,Re,ee.data)):t.texImage3D(n.TEXTURE_3D,0,Ae,ee.width,ee.height,ee.depth,0,se,Re,ee.data);else if(y.isFramebufferTexture){if(de)if(D)t.texStorage2D(n.TEXTURE_2D,oe,Ae,ee.width,ee.height);else{let te=ee.width,K=ee.height;for(let _e=0;_e<oe;_e++)t.texImage2D(n.TEXTURE_2D,_e,Ae,te,K,0,se,Re,null),te>>=1,K>>=1}}else if(Ie.length>0){if(D&&de){const te=Ue(Ie[0]);t.texStorage2D(n.TEXTURE_2D,oe,Ae,te.width,te.height)}for(let te=0,K=Ie.length;te<K;te++)he=Ie[te],D?ae&&t.texSubImage2D(n.TEXTURE_2D,te,0,0,se,Re,he):t.texImage2D(n.TEXTURE_2D,te,Ae,se,Re,he);y.generateMipmaps=!1}else if(D){if(de){const te=Ue(ee);t.texStorage2D(n.TEXTURE_2D,oe,Ae,te.width,te.height)}ae&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,se,Re,ee)}else t.texImage2D(n.TEXTURE_2D,0,Ae,se,Re,ee);x(y)&&g(Y),Ee.__version=j.version,y.onUpdate&&y.onUpdate(y)}C.__version=y.version}function J(C,y,G){if(y.image.length!==6)return;const Y=tt(C,y),Z=y.source;t.bindTexture(n.TEXTURE_CUBE_MAP,C.__webglTexture,n.TEXTURE0+G);const j=i.get(Z);if(Z.version!==j.__version||Y===!0){t.activeTexture(n.TEXTURE0+G);const Ee=Qe.getPrimaries(Qe.workingColorSpace),le=y.colorSpace===ti?null:Qe.getPrimaries(y.colorSpace),Ce=y.colorSpace===ti||Ee===le?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,y.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,y.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ce);const Se=y.isCompressedTexture||y.image[0].isCompressedTexture,ee=y.image[0]&&y.image[0].isDataTexture,se=[];for(let K=0;K<6;K++)!Se&&!ee?se[K]=b(y.image[K],!0,r.maxCubemapSize):se[K]=ee?y.image[K].image:y.image[K],se[K]=Te(y,se[K]);const Re=se[0],Ae=s.convert(y.format,y.colorSpace),he=s.convert(y.type),Ie=T(y.internalFormat,Ae,he,y.colorSpace),D=y.isVideoTexture!==!0,de=j.__version===void 0||Y===!0,ae=Z.dataReady;let oe=R(y,Re);je(n.TEXTURE_CUBE_MAP,y);let te;if(Se){D&&de&&t.texStorage2D(n.TEXTURE_CUBE_MAP,oe,Ie,Re.width,Re.height);for(let K=0;K<6;K++){te=se[K].mipmaps;for(let _e=0;_e<te.length;_e++){const Ne=te[_e];y.format!==xn?Ae!==null?D?ae&&t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,_e,0,0,Ne.width,Ne.height,Ae,Ne.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,_e,Ie,Ne.width,Ne.height,0,Ne.data):Fe("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):D?ae&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,_e,0,0,Ne.width,Ne.height,Ae,he,Ne.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,_e,Ie,Ne.width,Ne.height,0,Ae,he,Ne.data)}}}else{if(te=y.mipmaps,D&&de){te.length>0&&oe++;const K=Ue(se[0]);t.texStorage2D(n.TEXTURE_CUBE_MAP,oe,Ie,K.width,K.height)}for(let K=0;K<6;K++)if(ee){D?ae&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,0,0,se[K].width,se[K].height,Ae,he,se[K].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,Ie,se[K].width,se[K].height,0,Ae,he,se[K].data);for(let _e=0;_e<te.length;_e++){const ft=te[_e].image[K].image;D?ae&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,_e+1,0,0,ft.width,ft.height,Ae,he,ft.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,_e+1,Ie,ft.width,ft.height,0,Ae,he,ft.data)}}else{D?ae&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,0,0,Ae,he,se[K]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,Ie,Ae,he,se[K]);for(let _e=0;_e<te.length;_e++){const Ne=te[_e];D?ae&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,_e+1,0,0,Ae,he,Ne.image[K]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,_e+1,Ie,Ae,he,Ne.image[K])}}}x(y)&&g(n.TEXTURE_CUBE_MAP),j.__version=Z.version,y.onUpdate&&y.onUpdate(y)}C.__version=y.version}function me(C,y,G,Y,Z,j){const Ee=s.convert(G.format,G.colorSpace),le=s.convert(G.type),Ce=T(G.internalFormat,Ee,le,G.colorSpace),Se=i.get(y),ee=i.get(G);if(ee.__renderTarget=y,!Se.__hasExternalTextures){const se=Math.max(1,y.width>>j),Re=Math.max(1,y.height>>j);Z===n.TEXTURE_3D||Z===n.TEXTURE_2D_ARRAY?t.texImage3D(Z,j,Ce,se,Re,y.depth,0,Ee,le,null):t.texImage2D(Z,j,Ce,se,Re,0,Ee,le,null)}t.bindFramebuffer(n.FRAMEBUFFER,C),ye(y)?c.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,Y,Z,ee.__webglTexture,0,lt(y)):(Z===n.TEXTURE_2D||Z>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&Z<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,Y,Z,ee.__webglTexture,j),t.bindFramebuffer(n.FRAMEBUFFER,null)}function De(C,y,G){if(n.bindRenderbuffer(n.RENDERBUFFER,C),y.depthBuffer){const Y=y.depthTexture,Z=Y&&Y.isDepthTexture?Y.type:null,j=L(y.stencilBuffer,Z),Ee=y.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,le=lt(y);ye(y)?c.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,le,j,y.width,y.height):G?n.renderbufferStorageMultisample(n.RENDERBUFFER,le,j,y.width,y.height):n.renderbufferStorage(n.RENDERBUFFER,j,y.width,y.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,Ee,n.RENDERBUFFER,C)}else{const Y=y.textures;for(let Z=0;Z<Y.length;Z++){const j=Y[Z],Ee=s.convert(j.format,j.colorSpace),le=s.convert(j.type),Ce=T(j.internalFormat,Ee,le,j.colorSpace),Se=lt(y);G&&ye(y)===!1?n.renderbufferStorageMultisample(n.RENDERBUFFER,Se,Ce,y.width,y.height):ye(y)?c.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Se,Ce,y.width,y.height):n.renderbufferStorage(n.RENDERBUFFER,Ce,y.width,y.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function ve(C,y){if(y&&y.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(n.FRAMEBUFFER,C),!(y.depthTexture&&y.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const Y=i.get(y.depthTexture);Y.__renderTarget=y,(!Y.__webglTexture||y.depthTexture.image.width!==y.width||y.depthTexture.image.height!==y.height)&&(y.depthTexture.image.width=y.width,y.depthTexture.image.height=y.height,y.depthTexture.needsUpdate=!0),H(y.depthTexture,0);const Z=Y.__webglTexture,j=lt(y);if(y.depthTexture.format===Zr)ye(y)?c.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,Z,0,j):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,Z,0);else if(y.depthTexture.format===Qr)ye(y)?c.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,Z,0,j):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,Z,0);else throw new Error("Unknown depthTexture format")}function $e(C){const y=i.get(C),G=C.isWebGLCubeRenderTarget===!0;if(y.__boundDepthTexture!==C.depthTexture){const Y=C.depthTexture;if(y.__depthDisposeCallback&&y.__depthDisposeCallback(),Y){const Z=()=>{delete y.__boundDepthTexture,delete y.__depthDisposeCallback,Y.removeEventListener("dispose",Z)};Y.addEventListener("dispose",Z),y.__depthDisposeCallback=Z}y.__boundDepthTexture=Y}if(C.depthTexture&&!y.__autoAllocateDepthBuffer){if(G)throw new Error("target.depthTexture not supported in Cube render targets");const Y=C.texture.mipmaps;Y&&Y.length>0?ve(y.__webglFramebuffer[0],C):ve(y.__webglFramebuffer,C)}else if(G){y.__webglDepthbuffer=[];for(let Y=0;Y<6;Y++)if(t.bindFramebuffer(n.FRAMEBUFFER,y.__webglFramebuffer[Y]),y.__webglDepthbuffer[Y]===void 0)y.__webglDepthbuffer[Y]=n.createRenderbuffer(),De(y.__webglDepthbuffer[Y],C,!1);else{const Z=C.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,j=y.__webglDepthbuffer[Y];n.bindRenderbuffer(n.RENDERBUFFER,j),n.framebufferRenderbuffer(n.FRAMEBUFFER,Z,n.RENDERBUFFER,j)}}else{const Y=C.texture.mipmaps;if(Y&&Y.length>0?t.bindFramebuffer(n.FRAMEBUFFER,y.__webglFramebuffer[0]):t.bindFramebuffer(n.FRAMEBUFFER,y.__webglFramebuffer),y.__webglDepthbuffer===void 0)y.__webglDepthbuffer=n.createRenderbuffer(),De(y.__webglDepthbuffer,C,!1);else{const Z=C.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,j=y.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,j),n.framebufferRenderbuffer(n.FRAMEBUFFER,Z,n.RENDERBUFFER,j)}}t.bindFramebuffer(n.FRAMEBUFFER,null)}function It(C,y,G){const Y=i.get(C);y!==void 0&&me(Y.__webglFramebuffer,C,C.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),G!==void 0&&$e(C)}function He(C){const y=C.texture,G=i.get(C),Y=i.get(y);C.addEventListener("dispose",A);const Z=C.textures,j=C.isWebGLCubeRenderTarget===!0,Ee=Z.length>1;if(Ee||(Y.__webglTexture===void 0&&(Y.__webglTexture=n.createTexture()),Y.__version=y.version,o.memory.textures++),j){G.__webglFramebuffer=[];for(let le=0;le<6;le++)if(y.mipmaps&&y.mipmaps.length>0){G.__webglFramebuffer[le]=[];for(let Ce=0;Ce<y.mipmaps.length;Ce++)G.__webglFramebuffer[le][Ce]=n.createFramebuffer()}else G.__webglFramebuffer[le]=n.createFramebuffer()}else{if(y.mipmaps&&y.mipmaps.length>0){G.__webglFramebuffer=[];for(let le=0;le<y.mipmaps.length;le++)G.__webglFramebuffer[le]=n.createFramebuffer()}else G.__webglFramebuffer=n.createFramebuffer();if(Ee)for(let le=0,Ce=Z.length;le<Ce;le++){const Se=i.get(Z[le]);Se.__webglTexture===void 0&&(Se.__webglTexture=n.createTexture(),o.memory.textures++)}if(C.samples>0&&ye(C)===!1){G.__webglMultisampledFramebuffer=n.createFramebuffer(),G.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,G.__webglMultisampledFramebuffer);for(let le=0;le<Z.length;le++){const Ce=Z[le];G.__webglColorRenderbuffer[le]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,G.__webglColorRenderbuffer[le]);const Se=s.convert(Ce.format,Ce.colorSpace),ee=s.convert(Ce.type),se=T(Ce.internalFormat,Se,ee,Ce.colorSpace,C.isXRRenderTarget===!0),Re=lt(C);n.renderbufferStorageMultisample(n.RENDERBUFFER,Re,se,C.width,C.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+le,n.RENDERBUFFER,G.__webglColorRenderbuffer[le])}n.bindRenderbuffer(n.RENDERBUFFER,null),C.depthBuffer&&(G.__webglDepthRenderbuffer=n.createRenderbuffer(),De(G.__webglDepthRenderbuffer,C,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(j){t.bindTexture(n.TEXTURE_CUBE_MAP,Y.__webglTexture),je(n.TEXTURE_CUBE_MAP,y);for(let le=0;le<6;le++)if(y.mipmaps&&y.mipmaps.length>0)for(let Ce=0;Ce<y.mipmaps.length;Ce++)me(G.__webglFramebuffer[le][Ce],C,y,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+le,Ce);else me(G.__webglFramebuffer[le],C,y,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+le,0);x(y)&&g(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(Ee){for(let le=0,Ce=Z.length;le<Ce;le++){const Se=Z[le],ee=i.get(Se);let se=n.TEXTURE_2D;(C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(se=C.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(se,ee.__webglTexture),je(se,Se),me(G.__webglFramebuffer,C,Se,n.COLOR_ATTACHMENT0+le,se,0),x(Se)&&g(se)}t.unbindTexture()}else{let le=n.TEXTURE_2D;if((C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(le=C.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(le,Y.__webglTexture),je(le,y),y.mipmaps&&y.mipmaps.length>0)for(let Ce=0;Ce<y.mipmaps.length;Ce++)me(G.__webglFramebuffer[Ce],C,y,n.COLOR_ATTACHMENT0,le,Ce);else me(G.__webglFramebuffer,C,y,n.COLOR_ATTACHMENT0,le,0);x(y)&&g(le),t.unbindTexture()}C.depthBuffer&&$e(C)}function ht(C){const y=C.textures;for(let G=0,Y=y.length;G<Y;G++){const Z=y[G];if(x(Z)){const j=w(C),Ee=i.get(Z).__webglTexture;t.bindTexture(j,Ee),g(j),t.unbindTexture()}}}const I=[],Xe=[];function qe(C){if(C.samples>0){if(ye(C)===!1){const y=C.textures,G=C.width,Y=C.height;let Z=n.COLOR_BUFFER_BIT;const j=C.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,Ee=i.get(C),le=y.length>1;if(le)for(let Se=0;Se<y.length;Se++)t.bindFramebuffer(n.FRAMEBUFFER,Ee.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Se,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,Ee.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Se,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,Ee.__webglMultisampledFramebuffer);const Ce=C.texture.mipmaps;Ce&&Ce.length>0?t.bindFramebuffer(n.DRAW_FRAMEBUFFER,Ee.__webglFramebuffer[0]):t.bindFramebuffer(n.DRAW_FRAMEBUFFER,Ee.__webglFramebuffer);for(let Se=0;Se<y.length;Se++){if(C.resolveDepthBuffer&&(C.depthBuffer&&(Z|=n.DEPTH_BUFFER_BIT),C.stencilBuffer&&C.resolveStencilBuffer&&(Z|=n.STENCIL_BUFFER_BIT)),le){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,Ee.__webglColorRenderbuffer[Se]);const ee=i.get(y[Se]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,ee,0)}n.blitFramebuffer(0,0,G,Y,0,0,G,Y,Z,n.NEAREST),l===!0&&(I.length=0,Xe.length=0,I.push(n.COLOR_ATTACHMENT0+Se),C.depthBuffer&&C.resolveDepthBuffer===!1&&(I.push(j),Xe.push(j),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,Xe)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,I))}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),le)for(let Se=0;Se<y.length;Se++){t.bindFramebuffer(n.FRAMEBUFFER,Ee.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Se,n.RENDERBUFFER,Ee.__webglColorRenderbuffer[Se]);const ee=i.get(y[Se]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,Ee.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Se,n.TEXTURE_2D,ee,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,Ee.__webglMultisampledFramebuffer)}else if(C.depthBuffer&&C.resolveDepthBuffer===!1&&l){const y=C.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[y])}}}function lt(C){return Math.min(r.maxSamples,C.samples)}function ye(C){const y=i.get(C);return C.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&y.__useRenderToTexture!==!1}function gt(C){const y=o.render.frame;f.get(C)!==y&&(f.set(C,y),C.update())}function Te(C,y){const G=C.colorSpace,Y=C.format,Z=C.type;return C.isCompressedTexture===!0||C.isVideoTexture===!0||G!==pr&&G!==ti&&(Qe.getTransfer(G)===at?(Y!==xn||Z!==Ln)&&Fe("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Mt("WebGLTextures: Unsupported texture color space:",G)),y}function Ue(C){return typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement?(d.width=C.naturalWidth||C.width,d.height=C.naturalHeight||C.height):typeof VideoFrame<"u"&&C instanceof VideoFrame?(d.width=C.displayWidth,d.height=C.displayHeight):(d.width=C.width,d.height=C.height),d}this.allocateTextureUnit=B,this.resetTextureUnits=O,this.setTexture2D=H,this.setTexture2DArray=X,this.setTexture3D=Q,this.setTextureCube=$,this.rebindTextures=It,this.setupRenderTarget=He,this.updateRenderTargetMipmap=ht,this.updateMultisampleRenderTarget=qe,this.setupDepthRenderbuffer=$e,this.setupFrameBufferTexture=me,this.useMultisampledRTT=ye}function U_(n,e){function t(i,r=ti){let s;const o=Qe.getTransfer(r);if(i===Ln)return n.UNSIGNED_BYTE;if(i===Oc)return n.UNSIGNED_SHORT_4_4_4_4;if(i===Bc)return n.UNSIGNED_SHORT_5_5_5_1;if(i===Eu)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===Mu)return n.UNSIGNED_INT_10F_11F_11F_REV;if(i===vu)return n.BYTE;if(i===Su)return n.SHORT;if(i===Kr)return n.UNSIGNED_SHORT;if(i===Uc)return n.INT;if(i===Ci)return n.UNSIGNED_INT;if(i===zn)return n.FLOAT;if(i===br)return n.HALF_FLOAT;if(i===Tu)return n.ALPHA;if(i===Cu)return n.RGB;if(i===xn)return n.RGBA;if(i===Zr)return n.DEPTH_COMPONENT;if(i===Qr)return n.DEPTH_STENCIL;if(i===wu)return n.RED;if(i===Gc)return n.RED_INTEGER;if(i===kc)return n.RG;if(i===zc)return n.RG_INTEGER;if(i===Vc)return n.RGBA_INTEGER;if(i===Xs||i===qs||i===Ys||i===Ks)if(o===at)if(s=e.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(i===Xs)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===qs)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===Ys)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===Ks)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=e.get("WEBGL_compressed_texture_s3tc"),s!==null){if(i===Xs)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===qs)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===Ys)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===Ks)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===Vo||i===Ho||i===Wo||i===jo)if(s=e.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(i===Vo)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===Ho)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===Wo)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===jo)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===$o||i===Xo||i===qo)if(s=e.get("WEBGL_compressed_texture_etc"),s!==null){if(i===$o||i===Xo)return o===at?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(i===qo)return o===at?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(i===Yo||i===Ko||i===Jo||i===Zo||i===Qo||i===ec||i===tc||i===nc||i===ic||i===rc||i===sc||i===ac||i===oc||i===cc)if(s=e.get("WEBGL_compressed_texture_astc"),s!==null){if(i===Yo)return o===at?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===Ko)return o===at?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===Jo)return o===at?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===Zo)return o===at?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===Qo)return o===at?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===ec)return o===at?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===tc)return o===at?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===nc)return o===at?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===ic)return o===at?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===rc)return o===at?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===sc)return o===at?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===ac)return o===at?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===oc)return o===at?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===cc)return o===at?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===lc||i===dc||i===uc)if(s=e.get("EXT_texture_compression_bptc"),s!==null){if(i===lc)return o===at?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===dc)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===uc)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===fc||i===hc||i===pc||i===mc)if(s=e.get("EXT_texture_compression_rgtc"),s!==null){if(i===fc)return s.COMPRESSED_RED_RGTC1_EXT;if(i===hc)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===pc)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===mc)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===Jr?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:t}}const O_=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,B_=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class G_{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){const i=new ku(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=i}}getMesh(e){if(this.texture!==null&&this.mesh===null){const t=e.cameras[0].viewport,i=new jn({vertexShader:O_,fragmentShader:B_,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Pn(new cs(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class k_ extends Ii{constructor(e,t){super();const i=this;let r=null,s=1,o=null,c="local-floor",l=1,d=null,f=null,p=null,h=null,m=null,_=null;const b=typeof XRWebGLBinding<"u",x=new G_,g={},w=t.getContextAttributes();let T=null,L=null;const R=[],M=[],A=new Oe;let F=null;const E=new an;E.viewport=new vt;const v=new an;v.viewport=new vt;const P=[E,v],O=new rm;let B=null,W=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(q){let J=R[q];return J===void 0&&(J=new ao,R[q]=J),J.getTargetRaySpace()},this.getControllerGrip=function(q){let J=R[q];return J===void 0&&(J=new ao,R[q]=J),J.getGripSpace()},this.getHand=function(q){let J=R[q];return J===void 0&&(J=new ao,R[q]=J),J.getHandSpace()};function H(q){const J=M.indexOf(q.inputSource);if(J===-1)return;const me=R[J];me!==void 0&&(me.update(q.inputSource,q.frame,d||o),me.dispatchEvent({type:q.type,data:q.inputSource}))}function X(){r.removeEventListener("select",H),r.removeEventListener("selectstart",H),r.removeEventListener("selectend",H),r.removeEventListener("squeeze",H),r.removeEventListener("squeezestart",H),r.removeEventListener("squeezeend",H),r.removeEventListener("end",X),r.removeEventListener("inputsourceschange",Q);for(let q=0;q<R.length;q++){const J=M[q];J!==null&&(M[q]=null,R[q].disconnect(J))}B=null,W=null,x.reset();for(const q in g)delete g[q];e.setRenderTarget(T),m=null,h=null,p=null,r=null,L=null,it.stop(),i.isPresenting=!1,e.setPixelRatio(F),e.setSize(A.width,A.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(q){s=q,i.isPresenting===!0&&Fe("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(q){c=q,i.isPresenting===!0&&Fe("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return d||o},this.setReferenceSpace=function(q){d=q},this.getBaseLayer=function(){return h!==null?h:m},this.getBinding=function(){return p===null&&b&&(p=new XRWebGLBinding(r,t)),p},this.getFrame=function(){return _},this.getSession=function(){return r},this.setSession=async function(q){if(r=q,r!==null){if(T=e.getRenderTarget(),r.addEventListener("select",H),r.addEventListener("selectstart",H),r.addEventListener("selectend",H),r.addEventListener("squeeze",H),r.addEventListener("squeezestart",H),r.addEventListener("squeezeend",H),r.addEventListener("end",X),r.addEventListener("inputsourceschange",Q),w.xrCompatible!==!0&&await t.makeXRCompatible(),F=e.getPixelRatio(),e.getSize(A),b&&"createProjectionLayer"in XRWebGLBinding.prototype){let me=null,De=null,ve=null;w.depth&&(ve=w.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,me=w.stencil?Qr:Zr,De=w.stencil?Jr:Ci);const $e={colorFormat:t.RGBA8,depthFormat:ve,scaleFactor:s};p=this.getBinding(),h=p.createProjectionLayer($e),r.updateRenderState({layers:[h]}),e.setPixelRatio(1),e.setSize(h.textureWidth,h.textureHeight,!1),L=new Ai(h.textureWidth,h.textureHeight,{format:xn,type:Ln,depthTexture:new Gu(h.textureWidth,h.textureHeight,De,void 0,void 0,void 0,void 0,void 0,void 0,me),stencilBuffer:w.stencil,colorSpace:e.outputColorSpace,samples:w.antialias?4:0,resolveDepthBuffer:h.ignoreDepthValues===!1,resolveStencilBuffer:h.ignoreDepthValues===!1})}else{const me={antialias:w.antialias,alpha:!0,depth:w.depth,stencil:w.stencil,framebufferScaleFactor:s};m=new XRWebGLLayer(r,t,me),r.updateRenderState({baseLayer:m}),e.setPixelRatio(1),e.setSize(m.framebufferWidth,m.framebufferHeight,!1),L=new Ai(m.framebufferWidth,m.framebufferHeight,{format:xn,type:Ln,colorSpace:e.outputColorSpace,stencilBuffer:w.stencil,resolveDepthBuffer:m.ignoreDepthValues===!1,resolveStencilBuffer:m.ignoreDepthValues===!1})}L.isXRRenderTarget=!0,this.setFoveation(l),d=null,o=await r.requestReferenceSpace(c),it.setContext(r),it.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return x.getDepthTexture()};function Q(q){for(let J=0;J<q.removed.length;J++){const me=q.removed[J],De=M.indexOf(me);De>=0&&(M[De]=null,R[De].disconnect(me))}for(let J=0;J<q.added.length;J++){const me=q.added[J];let De=M.indexOf(me);if(De===-1){for(let $e=0;$e<R.length;$e++)if($e>=M.length){M.push(me),De=$e;break}else if(M[$e]===null){M[$e]=me,De=$e;break}if(De===-1)break}const ve=R[De];ve&&ve.connect(me)}}const $=new k,ie=new k;function ne(q,J,me){$.setFromMatrixPosition(J.matrixWorld),ie.setFromMatrixPosition(me.matrixWorld);const De=$.distanceTo(ie),ve=J.projectionMatrix.elements,$e=me.projectionMatrix.elements,It=ve[14]/(ve[10]-1),He=ve[14]/(ve[10]+1),ht=(ve[9]+1)/ve[5],I=(ve[9]-1)/ve[5],Xe=(ve[8]-1)/ve[0],qe=($e[8]+1)/$e[0],lt=It*Xe,ye=It*qe,gt=De/(-Xe+qe),Te=gt*-Xe;if(J.matrixWorld.decompose(q.position,q.quaternion,q.scale),q.translateX(Te),q.translateZ(gt),q.matrixWorld.compose(q.position,q.quaternion,q.scale),q.matrixWorldInverse.copy(q.matrixWorld).invert(),ve[10]===-1)q.projectionMatrix.copy(J.projectionMatrix),q.projectionMatrixInverse.copy(J.projectionMatrixInverse);else{const Ue=It+gt,C=He+gt,y=lt-Te,G=ye+(De-Te),Y=ht*He/C*Ue,Z=I*He/C*Ue;q.projectionMatrix.makePerspective(y,G,Y,Z,Ue,C),q.projectionMatrixInverse.copy(q.projectionMatrix).invert()}}function xe(q,J){J===null?q.matrixWorld.copy(q.matrix):q.matrixWorld.multiplyMatrices(J.matrixWorld,q.matrix),q.matrixWorldInverse.copy(q.matrixWorld).invert()}this.updateCamera=function(q){if(r===null)return;let J=q.near,me=q.far;x.texture!==null&&(x.depthNear>0&&(J=x.depthNear),x.depthFar>0&&(me=x.depthFar)),O.near=v.near=E.near=J,O.far=v.far=E.far=me,(B!==O.near||W!==O.far)&&(r.updateRenderState({depthNear:O.near,depthFar:O.far}),B=O.near,W=O.far),O.layers.mask=q.layers.mask|6,E.layers.mask=O.layers.mask&3,v.layers.mask=O.layers.mask&5;const De=q.parent,ve=O.cameras;xe(O,De);for(let $e=0;$e<ve.length;$e++)xe(ve[$e],De);ve.length===2?ne(O,E,v):O.projectionMatrix.copy(E.projectionMatrix),je(q,O,De)};function je(q,J,me){me===null?q.matrix.copy(J.matrixWorld):(q.matrix.copy(me.matrixWorld),q.matrix.invert(),q.matrix.multiply(J.matrixWorld)),q.matrix.decompose(q.position,q.quaternion,q.scale),q.updateMatrixWorld(!0),q.projectionMatrix.copy(J.projectionMatrix),q.projectionMatrixInverse.copy(J.projectionMatrixInverse),q.isPerspectiveCamera&&(q.fov=gc*2*Math.atan(1/q.projectionMatrix.elements[5]),q.zoom=1)}this.getCamera=function(){return O},this.getFoveation=function(){if(!(h===null&&m===null))return l},this.setFoveation=function(q){l=q,h!==null&&(h.fixedFoveation=q),m!==null&&m.fixedFoveation!==void 0&&(m.fixedFoveation=q)},this.hasDepthSensing=function(){return x.texture!==null},this.getDepthSensingMesh=function(){return x.getMesh(O)},this.getCameraTexture=function(q){return g[q]};let tt=null;function nt(q,J){if(f=J.getViewerPose(d||o),_=J,f!==null){const me=f.views;m!==null&&(e.setRenderTargetFramebuffer(L,m.framebuffer),e.setRenderTarget(L));let De=!1;me.length!==O.cameras.length&&(O.cameras.length=0,De=!0);for(let He=0;He<me.length;He++){const ht=me[He];let I=null;if(m!==null)I=m.getViewport(ht);else{const qe=p.getViewSubImage(h,ht);I=qe.viewport,He===0&&(e.setRenderTargetTextures(L,qe.colorTexture,qe.depthStencilTexture),e.setRenderTarget(L))}let Xe=P[He];Xe===void 0&&(Xe=new an,Xe.layers.enable(He),Xe.viewport=new vt,P[He]=Xe),Xe.matrix.fromArray(ht.transform.matrix),Xe.matrix.decompose(Xe.position,Xe.quaternion,Xe.scale),Xe.projectionMatrix.fromArray(ht.projectionMatrix),Xe.projectionMatrixInverse.copy(Xe.projectionMatrix).invert(),Xe.viewport.set(I.x,I.y,I.width,I.height),He===0&&(O.matrix.copy(Xe.matrix),O.matrix.decompose(O.position,O.quaternion,O.scale)),De===!0&&O.cameras.push(Xe)}const ve=r.enabledFeatures;if(ve&&ve.includes("depth-sensing")&&r.depthUsage=="gpu-optimized"&&b){p=i.getBinding();const He=p.getDepthInformation(me[0]);He&&He.isValid&&He.texture&&x.init(He,r.renderState)}if(ve&&ve.includes("camera-access")&&b){e.state.unbindTexture(),p=i.getBinding();for(let He=0;He<me.length;He++){const ht=me[He].camera;if(ht){let I=g[ht];I||(I=new ku,g[ht]=I);const Xe=p.getCameraImage(ht);I.sourceTexture=Xe}}}}for(let me=0;me<R.length;me++){const De=M[me],ve=R[me];De!==null&&ve!==void 0&&ve.update(De,J,d||o)}tt&&tt(q,J),J.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:J}),_=null}const it=new Wu;it.setAnimationLoop(nt),this.setAnimationLoop=function(q){tt=q},this.dispose=function(){}}}const _i=new Rn,z_=new St;function V_(n,e){function t(x,g){x.matrixAutoUpdate===!0&&x.updateMatrix(),g.value.copy(x.matrix)}function i(x,g){g.color.getRGB(x.fogColor.value,Uu(n)),g.isFog?(x.fogNear.value=g.near,x.fogFar.value=g.far):g.isFogExp2&&(x.fogDensity.value=g.density)}function r(x,g,w,T,L){g.isMeshBasicMaterial||g.isMeshLambertMaterial?s(x,g):g.isMeshToonMaterial?(s(x,g),p(x,g)):g.isMeshPhongMaterial?(s(x,g),f(x,g)):g.isMeshStandardMaterial?(s(x,g),h(x,g),g.isMeshPhysicalMaterial&&m(x,g,L)):g.isMeshMatcapMaterial?(s(x,g),_(x,g)):g.isMeshDepthMaterial?s(x,g):g.isMeshDistanceMaterial?(s(x,g),b(x,g)):g.isMeshNormalMaterial?s(x,g):g.isLineBasicMaterial?(o(x,g),g.isLineDashedMaterial&&c(x,g)):g.isPointsMaterial?l(x,g,w,T):g.isSpriteMaterial?d(x,g):g.isShadowMaterial?(x.color.value.copy(g.color),x.opacity.value=g.opacity):g.isShaderMaterial&&(g.uniformsNeedUpdate=!1)}function s(x,g){x.opacity.value=g.opacity,g.color&&x.diffuse.value.copy(g.color),g.emissive&&x.emissive.value.copy(g.emissive).multiplyScalar(g.emissiveIntensity),g.map&&(x.map.value=g.map,t(g.map,x.mapTransform)),g.alphaMap&&(x.alphaMap.value=g.alphaMap,t(g.alphaMap,x.alphaMapTransform)),g.bumpMap&&(x.bumpMap.value=g.bumpMap,t(g.bumpMap,x.bumpMapTransform),x.bumpScale.value=g.bumpScale,g.side===Xt&&(x.bumpScale.value*=-1)),g.normalMap&&(x.normalMap.value=g.normalMap,t(g.normalMap,x.normalMapTransform),x.normalScale.value.copy(g.normalScale),g.side===Xt&&x.normalScale.value.negate()),g.displacementMap&&(x.displacementMap.value=g.displacementMap,t(g.displacementMap,x.displacementMapTransform),x.displacementScale.value=g.displacementScale,x.displacementBias.value=g.displacementBias),g.emissiveMap&&(x.emissiveMap.value=g.emissiveMap,t(g.emissiveMap,x.emissiveMapTransform)),g.specularMap&&(x.specularMap.value=g.specularMap,t(g.specularMap,x.specularMapTransform)),g.alphaTest>0&&(x.alphaTest.value=g.alphaTest);const w=e.get(g),T=w.envMap,L=w.envMapRotation;T&&(x.envMap.value=T,_i.copy(L),_i.x*=-1,_i.y*=-1,_i.z*=-1,T.isCubeTexture&&T.isRenderTargetTexture===!1&&(_i.y*=-1,_i.z*=-1),x.envMapRotation.value.setFromMatrix4(z_.makeRotationFromEuler(_i)),x.flipEnvMap.value=T.isCubeTexture&&T.isRenderTargetTexture===!1?-1:1,x.reflectivity.value=g.reflectivity,x.ior.value=g.ior,x.refractionRatio.value=g.refractionRatio),g.lightMap&&(x.lightMap.value=g.lightMap,x.lightMapIntensity.value=g.lightMapIntensity,t(g.lightMap,x.lightMapTransform)),g.aoMap&&(x.aoMap.value=g.aoMap,x.aoMapIntensity.value=g.aoMapIntensity,t(g.aoMap,x.aoMapTransform))}function o(x,g){x.diffuse.value.copy(g.color),x.opacity.value=g.opacity,g.map&&(x.map.value=g.map,t(g.map,x.mapTransform))}function c(x,g){x.dashSize.value=g.dashSize,x.totalSize.value=g.dashSize+g.gapSize,x.scale.value=g.scale}function l(x,g,w,T){x.diffuse.value.copy(g.color),x.opacity.value=g.opacity,x.size.value=g.size*w,x.scale.value=T*.5,g.map&&(x.map.value=g.map,t(g.map,x.uvTransform)),g.alphaMap&&(x.alphaMap.value=g.alphaMap,t(g.alphaMap,x.alphaMapTransform)),g.alphaTest>0&&(x.alphaTest.value=g.alphaTest)}function d(x,g){x.diffuse.value.copy(g.color),x.opacity.value=g.opacity,x.rotation.value=g.rotation,g.map&&(x.map.value=g.map,t(g.map,x.mapTransform)),g.alphaMap&&(x.alphaMap.value=g.alphaMap,t(g.alphaMap,x.alphaMapTransform)),g.alphaTest>0&&(x.alphaTest.value=g.alphaTest)}function f(x,g){x.specular.value.copy(g.specular),x.shininess.value=Math.max(g.shininess,1e-4)}function p(x,g){g.gradientMap&&(x.gradientMap.value=g.gradientMap)}function h(x,g){x.metalness.value=g.metalness,g.metalnessMap&&(x.metalnessMap.value=g.metalnessMap,t(g.metalnessMap,x.metalnessMapTransform)),x.roughness.value=g.roughness,g.roughnessMap&&(x.roughnessMap.value=g.roughnessMap,t(g.roughnessMap,x.roughnessMapTransform)),g.envMap&&(x.envMapIntensity.value=g.envMapIntensity)}function m(x,g,w){x.ior.value=g.ior,g.sheen>0&&(x.sheenColor.value.copy(g.sheenColor).multiplyScalar(g.sheen),x.sheenRoughness.value=g.sheenRoughness,g.sheenColorMap&&(x.sheenColorMap.value=g.sheenColorMap,t(g.sheenColorMap,x.sheenColorMapTransform)),g.sheenRoughnessMap&&(x.sheenRoughnessMap.value=g.sheenRoughnessMap,t(g.sheenRoughnessMap,x.sheenRoughnessMapTransform))),g.clearcoat>0&&(x.clearcoat.value=g.clearcoat,x.clearcoatRoughness.value=g.clearcoatRoughness,g.clearcoatMap&&(x.clearcoatMap.value=g.clearcoatMap,t(g.clearcoatMap,x.clearcoatMapTransform)),g.clearcoatRoughnessMap&&(x.clearcoatRoughnessMap.value=g.clearcoatRoughnessMap,t(g.clearcoatRoughnessMap,x.clearcoatRoughnessMapTransform)),g.clearcoatNormalMap&&(x.clearcoatNormalMap.value=g.clearcoatNormalMap,t(g.clearcoatNormalMap,x.clearcoatNormalMapTransform),x.clearcoatNormalScale.value.copy(g.clearcoatNormalScale),g.side===Xt&&x.clearcoatNormalScale.value.negate())),g.dispersion>0&&(x.dispersion.value=g.dispersion),g.iridescence>0&&(x.iridescence.value=g.iridescence,x.iridescenceIOR.value=g.iridescenceIOR,x.iridescenceThicknessMinimum.value=g.iridescenceThicknessRange[0],x.iridescenceThicknessMaximum.value=g.iridescenceThicknessRange[1],g.iridescenceMap&&(x.iridescenceMap.value=g.iridescenceMap,t(g.iridescenceMap,x.iridescenceMapTransform)),g.iridescenceThicknessMap&&(x.iridescenceThicknessMap.value=g.iridescenceThicknessMap,t(g.iridescenceThicknessMap,x.iridescenceThicknessMapTransform))),g.transmission>0&&(x.transmission.value=g.transmission,x.transmissionSamplerMap.value=w.texture,x.transmissionSamplerSize.value.set(w.width,w.height),g.transmissionMap&&(x.transmissionMap.value=g.transmissionMap,t(g.transmissionMap,x.transmissionMapTransform)),x.thickness.value=g.thickness,g.thicknessMap&&(x.thicknessMap.value=g.thicknessMap,t(g.thicknessMap,x.thicknessMapTransform)),x.attenuationDistance.value=g.attenuationDistance,x.attenuationColor.value.copy(g.attenuationColor)),g.anisotropy>0&&(x.anisotropyVector.value.set(g.anisotropy*Math.cos(g.anisotropyRotation),g.anisotropy*Math.sin(g.anisotropyRotation)),g.anisotropyMap&&(x.anisotropyMap.value=g.anisotropyMap,t(g.anisotropyMap,x.anisotropyMapTransform))),x.specularIntensity.value=g.specularIntensity,x.specularColor.value.copy(g.specularColor),g.specularColorMap&&(x.specularColorMap.value=g.specularColorMap,t(g.specularColorMap,x.specularColorMapTransform)),g.specularIntensityMap&&(x.specularIntensityMap.value=g.specularIntensityMap,t(g.specularIntensityMap,x.specularIntensityMapTransform))}function _(x,g){g.matcap&&(x.matcap.value=g.matcap)}function b(x,g){const w=e.get(g).light;x.referencePosition.value.setFromMatrixPosition(w.matrixWorld),x.nearDistance.value=w.shadow.camera.near,x.farDistance.value=w.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function H_(n,e,t,i){let r={},s={},o=[];const c=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function l(w,T){const L=T.program;i.uniformBlockBinding(w,L)}function d(w,T){let L=r[w.id];L===void 0&&(_(w),L=f(w),r[w.id]=L,w.addEventListener("dispose",x));const R=T.program;i.updateUBOMapping(w,R);const M=e.render.frame;s[w.id]!==M&&(h(w),s[w.id]=M)}function f(w){const T=p();w.__bindingPointIndex=T;const L=n.createBuffer(),R=w.__size,M=w.usage;return n.bindBuffer(n.UNIFORM_BUFFER,L),n.bufferData(n.UNIFORM_BUFFER,R,M),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,T,L),L}function p(){for(let w=0;w<c;w++)if(o.indexOf(w)===-1)return o.push(w),w;return Mt("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function h(w){const T=r[w.id],L=w.uniforms,R=w.__cache;n.bindBuffer(n.UNIFORM_BUFFER,T);for(let M=0,A=L.length;M<A;M++){const F=Array.isArray(L[M])?L[M]:[L[M]];for(let E=0,v=F.length;E<v;E++){const P=F[E];if(m(P,M,E,R)===!0){const O=P.__offset,B=Array.isArray(P.value)?P.value:[P.value];let W=0;for(let H=0;H<B.length;H++){const X=B[H],Q=b(X);typeof X=="number"||typeof X=="boolean"?(P.__data[0]=X,n.bufferSubData(n.UNIFORM_BUFFER,O+W,P.__data)):X.isMatrix3?(P.__data[0]=X.elements[0],P.__data[1]=X.elements[1],P.__data[2]=X.elements[2],P.__data[3]=0,P.__data[4]=X.elements[3],P.__data[5]=X.elements[4],P.__data[6]=X.elements[5],P.__data[7]=0,P.__data[8]=X.elements[6],P.__data[9]=X.elements[7],P.__data[10]=X.elements[8],P.__data[11]=0):(X.toArray(P.__data,W),W+=Q.storage/Float32Array.BYTES_PER_ELEMENT)}n.bufferSubData(n.UNIFORM_BUFFER,O,P.__data)}}}n.bindBuffer(n.UNIFORM_BUFFER,null)}function m(w,T,L,R){const M=w.value,A=T+"_"+L;if(R[A]===void 0)return typeof M=="number"||typeof M=="boolean"?R[A]=M:R[A]=M.clone(),!0;{const F=R[A];if(typeof M=="number"||typeof M=="boolean"){if(F!==M)return R[A]=M,!0}else if(F.equals(M)===!1)return F.copy(M),!0}return!1}function _(w){const T=w.uniforms;let L=0;const R=16;for(let A=0,F=T.length;A<F;A++){const E=Array.isArray(T[A])?T[A]:[T[A]];for(let v=0,P=E.length;v<P;v++){const O=E[v],B=Array.isArray(O.value)?O.value:[O.value];for(let W=0,H=B.length;W<H;W++){const X=B[W],Q=b(X),$=L%R,ie=$%Q.boundary,ne=$+ie;L+=ie,ne!==0&&R-ne<Q.storage&&(L+=R-ne),O.__data=new Float32Array(Q.storage/Float32Array.BYTES_PER_ELEMENT),O.__offset=L,L+=Q.storage}}}const M=L%R;return M>0&&(L+=R-M),w.__size=L,w.__cache={},this}function b(w){const T={boundary:0,storage:0};return typeof w=="number"||typeof w=="boolean"?(T.boundary=4,T.storage=4):w.isVector2?(T.boundary=8,T.storage=8):w.isVector3||w.isColor?(T.boundary=16,T.storage=12):w.isVector4?(T.boundary=16,T.storage=16):w.isMatrix3?(T.boundary=48,T.storage=48):w.isMatrix4?(T.boundary=64,T.storage=64):w.isTexture?Fe("WebGLRenderer: Texture samplers can not be part of an uniforms group."):Fe("WebGLRenderer: Unsupported uniform value type.",w),T}function x(w){const T=w.target;T.removeEventListener("dispose",x);const L=o.indexOf(T.__bindingPointIndex);o.splice(L,1),n.deleteBuffer(r[T.id]),delete r[T.id],delete s[T.id]}function g(){for(const w in r)n.deleteBuffer(r[w]);o=[],r={},s={}}return{bind:l,update:d,dispose:g}}const W_=new Uint16Array([11481,15204,11534,15171,11808,15015,12385,14843,12894,14716,13396,14600,13693,14483,13976,14366,14237,14171,14405,13961,14511,13770,14605,13598,14687,13444,14760,13305,14822,13066,14876,12857,14923,12675,14963,12517,14997,12379,15025,12230,15049,12023,15070,11843,15086,11687,15100,11551,15111,11433,15120,11330,15127,11217,15132,11060,15135,10922,15138,10801,15139,10695,15139,10600,13012,14923,13020,14917,13064,14886,13176,14800,13349,14666,13513,14526,13724,14398,13960,14230,14200,14020,14383,13827,14488,13651,14583,13491,14667,13348,14740,13132,14803,12908,14856,12713,14901,12542,14938,12394,14968,12241,14992,12017,15010,11822,15024,11654,15034,11507,15041,11380,15044,11269,15044,11081,15042,10913,15037,10764,15031,10635,15023,10520,15014,10419,15003,10330,13657,14676,13658,14673,13670,14660,13698,14622,13750,14547,13834,14442,13956,14317,14112,14093,14291,13889,14407,13704,14499,13538,14586,13389,14664,13201,14733,12966,14792,12758,14842,12577,14882,12418,14915,12272,14940,12033,14959,11826,14972,11646,14980,11490,14983,11355,14983,11212,14979,11008,14971,10830,14961,10675,14950,10540,14936,10420,14923,10315,14909,10204,14894,10041,14089,14460,14090,14459,14096,14452,14112,14431,14141,14388,14186,14305,14252,14130,14341,13941,14399,13756,14467,13585,14539,13430,14610,13272,14677,13026,14737,12808,14790,12617,14833,12449,14869,12303,14896,12065,14916,11845,14929,11655,14937,11490,14939,11347,14936,11184,14930,10970,14921,10783,14912,10621,14900,10480,14885,10356,14867,10247,14848,10062,14827,9894,14805,9745,14400,14208,14400,14206,14402,14198,14406,14174,14415,14122,14427,14035,14444,13913,14469,13767,14504,13613,14548,13463,14598,13324,14651,13082,14704,12858,14752,12658,14795,12483,14831,12330,14860,12106,14881,11875,14895,11675,14903,11501,14905,11351,14903,11178,14900,10953,14892,10757,14880,10589,14865,10442,14847,10313,14827,10162,14805,9965,14782,9792,14757,9642,14731,9507,14562,13883,14562,13883,14563,13877,14566,13862,14570,13830,14576,13773,14584,13689,14595,13582,14613,13461,14637,13336,14668,13120,14704,12897,14741,12695,14776,12516,14808,12358,14835,12150,14856,11910,14870,11701,14878,11519,14882,11361,14884,11187,14880,10951,14871,10748,14858,10572,14842,10418,14823,10286,14801,10099,14777,9897,14751,9722,14725,9567,14696,9430,14666,9309,14702,13604,14702,13604,14702,13600,14703,13591,14705,13570,14707,13533,14709,13477,14712,13400,14718,13305,14727,13106,14743,12907,14762,12716,14784,12539,14807,12380,14827,12190,14844,11943,14855,11727,14863,11539,14870,11376,14871,11204,14868,10960,14858,10748,14845,10565,14829,10406,14809,10269,14786,10058,14761,9852,14734,9671,14705,9512,14674,9374,14641,9253,14608,9076,14821,13366,14821,13365,14821,13364,14821,13358,14821,13344,14821,13320,14819,13252,14817,13145,14815,13011,14814,12858,14817,12698,14823,12539,14832,12389,14841,12214,14850,11968,14856,11750,14861,11558,14866,11390,14867,11226,14862,10972,14853,10754,14840,10565,14823,10401,14803,10259,14780,10032,14754,9820,14725,9635,14694,9473,14661,9333,14627,9203,14593,8988,14557,8798,14923,13014,14922,13014,14922,13012,14922,13004,14920,12987,14919,12957,14915,12907,14909,12834,14902,12738,14894,12623,14888,12498,14883,12370,14880,12203,14878,11970,14875,11759,14873,11569,14874,11401,14872,11243,14865,10986,14855,10762,14842,10568,14825,10401,14804,10255,14781,10017,14754,9799,14725,9611,14692,9445,14658,9301,14623,9139,14587,8920,14548,8729,14509,8562,15008,12672,15008,12672,15008,12671,15007,12667,15005,12656,15001,12637,14997,12605,14989,12556,14978,12490,14966,12407,14953,12313,14940,12136,14927,11934,14914,11742,14903,11563,14896,11401,14889,11247,14879,10992,14866,10767,14851,10570,14833,10400,14812,10252,14789,10007,14761,9784,14731,9592,14698,9424,14663,9279,14627,9088,14588,8868,14548,8676,14508,8508,14467,8360,15080,12386,15080,12386,15079,12385,15078,12383,15076,12378,15072,12367,15066,12347,15057,12315,15045,12253,15030,12138,15012,11998,14993,11845,14972,11685,14951,11530,14935,11383,14920,11228,14904,10981,14887,10762,14870,10567,14850,10397,14827,10248,14803,9997,14774,9771,14743,9578,14710,9407,14674,9259,14637,9048,14596,8826,14555,8632,14514,8464,14471,8317,14427,8182,15139,12008,15139,12008,15138,12008,15137,12007,15135,12003,15130,11990,15124,11969,15115,11929,15102,11872,15086,11794,15064,11693,15041,11581,15013,11459,14987,11336,14966,11170,14944,10944,14921,10738,14898,10552,14875,10387,14850,10239,14824,9983,14794,9758,14762,9563,14728,9392,14692,9244,14653,9014,14611,8791,14569,8597,14526,8427,14481,8281,14436,8110,14391,7885,15188,11617,15188,11617,15187,11617,15186,11618,15183,11617,15179,11612,15173,11601,15163,11581,15150,11546,15133,11495,15110,11427,15083,11346,15051,11246,15024,11057,14996,10868,14967,10687,14938,10517,14911,10362,14882,10206,14853,9956,14821,9737,14787,9543,14752,9375,14715,9228,14675,8980,14632,8760,14589,8565,14544,8395,14498,8248,14451,8049,14404,7824,14357,7630,15228,11298,15228,11298,15227,11299,15226,11301,15223,11303,15219,11302,15213,11299,15204,11290,15191,11271,15174,11217,15150,11129,15119,11015,15087,10886,15057,10744,15024,10599,14990,10455,14957,10318,14924,10143,14891,9911,14856,9701,14820,9516,14782,9352,14744,9200,14703,8946,14659,8725,14615,8533,14568,8366,14521,8220,14472,7992,14423,7770,14374,7578,14315,7408,15260,10819,15260,10819,15259,10822,15258,10826,15256,10832,15251,10836,15246,10841,15237,10838,15225,10821,15207,10788,15183,10734,15151,10660,15120,10571,15087,10469,15049,10359,15012,10249,14974,10041,14937,9837,14900,9647,14860,9475,14820,9320,14779,9147,14736,8902,14691,8688,14646,8499,14598,8335,14549,8189,14499,7940,14448,7720,14397,7529,14347,7363,14256,7218,15285,10410,15285,10411,15285,10413,15284,10418,15282,10425,15278,10434,15272,10442,15264,10449,15252,10445,15235,10433,15210,10403,15179,10358,15149,10301,15113,10218,15073,10059,15033,9894,14991,9726,14951,9565,14909,9413,14865,9273,14822,9073,14777,8845,14730,8641,14682,8459,14633,8300,14583,8129,14531,7883,14479,7670,14426,7482,14373,7321,14305,7176,14201,6939,15305,9939,15305,9940,15305,9945,15304,9955,15302,9967,15298,9989,15293,10010,15286,10033,15274,10044,15258,10045,15233,10022,15205,9975,15174,9903,15136,9808,15095,9697,15053,9578,15009,9451,14965,9327,14918,9198,14871,8973,14825,8766,14775,8579,14725,8408,14675,8259,14622,8058,14569,7821,14515,7615,14460,7435,14405,7276,14350,7108,14256,6866,14149,6653,15321,9444,15321,9445,15321,9448,15320,9458,15317,9470,15314,9490,15310,9515,15302,9540,15292,9562,15276,9579,15251,9577,15226,9559,15195,9519,15156,9463,15116,9389,15071,9304,15025,9208,14978,9023,14927,8838,14878,8661,14827,8496,14774,8344,14722,8206,14667,7973,14612,7749,14556,7555,14499,7382,14443,7229,14385,7025,14322,6791,14210,6588,14100,6409,15333,8920,15333,8921,15332,8927,15332,8943,15329,8965,15326,9002,15322,9048,15316,9106,15307,9162,15291,9204,15267,9221,15244,9221,15212,9196,15175,9134,15133,9043,15088,8930,15040,8801,14990,8665,14938,8526,14886,8391,14830,8261,14775,8087,14719,7866,14661,7664,14603,7482,14544,7322,14485,7178,14426,6936,14367,6713,14281,6517,14166,6348,14054,6198,15341,8360,15341,8361,15341,8366,15341,8379,15339,8399,15336,8431,15332,8473,15326,8527,15318,8585,15302,8632,15281,8670,15258,8690,15227,8690,15191,8664,15149,8612,15104,8543,15055,8456,15001,8360,14948,8259,14892,8122,14834,7923,14776,7734,14716,7558,14656,7397,14595,7250,14534,7070,14472,6835,14410,6628,14350,6443,14243,6283,14125,6135,14010,5889,15348,7715,15348,7717,15348,7725,15347,7745,15345,7780,15343,7836,15339,7905,15334,8e3,15326,8103,15310,8193,15293,8239,15270,8270,15240,8287,15204,8283,15163,8260,15118,8223,15067,8143,15014,8014,14958,7873,14899,7723,14839,7573,14778,7430,14715,7293,14652,7164,14588,6931,14524,6720,14460,6531,14396,6362,14330,6210,14207,6015,14086,5781,13969,5576,15352,7114,15352,7116,15352,7128,15352,7159,15350,7195,15348,7237,15345,7299,15340,7374,15332,7457,15317,7544,15301,7633,15280,7703,15251,7754,15216,7775,15176,7767,15131,7733,15079,7670,15026,7588,14967,7492,14906,7387,14844,7278,14779,7171,14714,6965,14648,6770,14581,6587,14515,6420,14448,6269,14382,6123,14299,5881,14172,5665,14049,5477,13929,5310,15355,6329,15355,6330,15355,6339,15355,6362,15353,6410,15351,6472,15349,6572,15344,6688,15337,6835,15323,6985,15309,7142,15287,7220,15260,7277,15226,7310,15188,7326,15142,7318,15090,7285,15036,7239,14976,7177,14914,7045,14849,6892,14782,6736,14714,6581,14645,6433,14576,6293,14506,6164,14438,5946,14369,5733,14270,5540,14140,5369,14014,5216,13892,5043,15357,5483,15357,5484,15357,5496,15357,5528,15356,5597,15354,5692,15351,5835,15347,6011,15339,6195,15328,6317,15314,6446,15293,6566,15268,6668,15235,6746,15197,6796,15152,6811,15101,6790,15046,6748,14985,6673,14921,6583,14854,6479,14785,6371,14714,6259,14643,6149,14571,5946,14499,5750,14428,5567,14358,5401,14242,5250,14109,5111,13980,4870,13856,4657,15359,4555,15359,4557,15358,4573,15358,4633,15357,4715,15355,4841,15353,5061,15349,5216,15342,5391,15331,5577,15318,5770,15299,5967,15274,6150,15243,6223,15206,6280,15161,6310,15111,6317,15055,6300,14994,6262,14928,6208,14860,6141,14788,5994,14715,5838,14641,5684,14566,5529,14492,5384,14418,5247,14346,5121,14216,4892,14079,4682,13948,4496,13822,4330,15359,3498,15359,3501,15359,3520,15359,3598,15358,3719,15356,3860,15355,4137,15351,4305,15344,4563,15334,4809,15321,5116,15303,5273,15280,5418,15250,5547,15214,5653,15170,5722,15120,5761,15064,5763,15002,5733,14935,5673,14865,5597,14792,5504,14716,5400,14640,5294,14563,5185,14486,5041,14410,4841,14335,4655,14191,4482,14051,4325,13918,4183,13790,4012,15360,2282,15360,2285,15360,2306,15360,2401,15359,2547,15357,2748,15355,3103,15352,3349,15345,3675,15336,4020,15324,4272,15307,4496,15285,4716,15255,4908,15220,5086,15178,5170,15128,5214,15072,5234,15010,5231,14943,5206,14871,5166,14796,5102,14718,4971,14639,4833,14559,4687,14480,4541,14402,4401,14315,4268,14167,4142,14025,3958,13888,3747,13759,3556,15360,923,15360,925,15360,946,15360,1052,15359,1214,15357,1494,15356,1892,15352,2274,15346,2663,15338,3099,15326,3393,15309,3679,15288,3980,15260,4183,15226,4325,15185,4437,15136,4517,15080,4570,15018,4591,14950,4581,14877,4545,14800,4485,14720,4411,14638,4325,14556,4231,14475,4136,14395,3988,14297,3803,14145,3628,13999,3465,13861,3314,13729,3177,15360,263,15360,264,15360,272,15360,325,15359,407,15358,548,15356,780,15352,1144,15347,1580,15339,2099,15328,2425,15312,2795,15292,3133,15264,3329,15232,3517,15191,3689,15143,3819,15088,3923,15025,3978,14956,3999,14882,3979,14804,3931,14722,3855,14639,3756,14554,3645,14470,3529,14388,3409,14279,3289,14124,3173,13975,3055,13834,2848,13701,2658,15360,49,15360,49,15360,52,15360,75,15359,111,15358,201,15356,283,15353,519,15348,726,15340,1045,15329,1415,15314,1795,15295,2173,15269,2410,15237,2649,15197,2866,15150,3054,15095,3140,15032,3196,14963,3228,14888,3236,14808,3224,14725,3191,14639,3146,14553,3088,14466,2976,14382,2836,14262,2692,14103,2549,13952,2409,13808,2278,13674,2154,15360,4,15360,4,15360,4,15360,13,15359,33,15358,59,15357,112,15353,199,15348,302,15341,456,15331,628,15316,827,15297,1082,15272,1332,15241,1601,15202,1851,15156,2069,15101,2172,15039,2256,14970,2314,14894,2348,14813,2358,14728,2344,14640,2311,14551,2263,14463,2203,14376,2133,14247,2059,14084,1915,13930,1761,13784,1609,13648,1464,15360,0,15360,0,15360,0,15360,3,15359,18,15358,26,15357,53,15354,80,15348,97,15341,165,15332,238,15318,326,15299,427,15275,529,15245,654,15207,771,15161,885,15108,994,15046,1089,14976,1170,14900,1229,14817,1266,14731,1284,14641,1282,14550,1260,14460,1223,14370,1174,14232,1116,14066,1050,13909,981,13761,910,13623,839]);let On=null;function j_(){return On===null&&(On=new Xp(W_,32,32,kc,br),On.minFilter=cn,On.magFilter=cn,On.wrapS=kn,On.wrapT=kn,On.generateMipmaps=!1,On.needsUpdate=!0),On}class $_{constructor(e={}){const{canvas:t=_p(),context:i=null,depth:r=!0,stencil:s=!1,alpha:o=!1,antialias:c=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:d=!1,powerPreference:f="default",failIfMajorPerformanceCaveat:p=!1,reversedDepthBuffer:h=!1}=e;this.isWebGLRenderer=!0;let m;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");m=i.getContextAttributes().alpha}else m=o;const _=new Set([Vc,zc,Gc]),b=new Set([Ln,Ci,Kr,Jr,Oc,Bc]),x=new Uint32Array(4),g=new Int32Array(4);let w=null,T=null;const L=[],R=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=ri,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const M=this;let A=!1;this._outputColorSpace=sn;let F=0,E=0,v=null,P=-1,O=null;const B=new vt,W=new vt;let H=null;const X=new ze(0);let Q=0,$=t.width,ie=t.height,ne=1,xe=null,je=null;const tt=new vt(0,0,$,ie),nt=new vt(0,0,$,ie);let it=!1;const q=new $c;let J=!1,me=!1;const De=new St,ve=new k,$e=new vt,It={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let He=!1;function ht(){return v===null?ne:1}let I=i;function Xe(S,N){return t.getContext(S,N)}try{const S={alpha:!0,depth:r,stencil:s,antialias:c,premultipliedAlpha:l,preserveDrawingBuffer:d,powerPreference:f,failIfMajorPerformanceCaveat:p};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${Nc}`),t.addEventListener("webglcontextlost",te,!1),t.addEventListener("webglcontextrestored",K,!1),t.addEventListener("webglcontextcreationerror",_e,!1),I===null){const N="webgl2";if(I=Xe(N,S),I===null)throw Xe(N)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(S){throw S("WebGLRenderer: "+S.message),S}let qe,lt,ye,gt,Te,Ue,C,y,G,Y,Z,j,Ee,le,Ce,Se,ee,se,Re,Ae,he,Ie,D,de;function ae(){qe=new ex(I),qe.init(),Ie=new U_(I,qe),lt=new j0(I,qe,e,Ie),ye=new F_(I,qe),lt.reversedDepthBuffer&&h&&ye.buffers.depth.setReversed(!0),gt=new ix(I),Te=new v_,Ue=new N_(I,qe,ye,Te,lt,Ie,gt),C=new X0(M),y=new Q0(M),G=new om(I),D=new H0(I,G),Y=new tx(I,G,gt,D),Z=new sx(I,Y,G,gt),Re=new rx(I,lt,Ue),Se=new $0(Te),j=new y_(M,C,y,qe,lt,D,Se),Ee=new V_(M,Te),le=new E_,Ce=new L_(qe),se=new V0(M,C,y,ye,Z,m,l),ee=new I_(M,Z,lt),de=new H_(I,gt,lt,ye),Ae=new W0(I,qe,gt),he=new nx(I,qe,gt),gt.programs=j.programs,M.capabilities=lt,M.extensions=qe,M.properties=Te,M.renderLists=le,M.shadowMap=ee,M.state=ye,M.info=gt}ae();const oe=new k_(M,I);this.xr=oe,this.getContext=function(){return I},this.getContextAttributes=function(){return I.getContextAttributes()},this.forceContextLoss=function(){const S=qe.get("WEBGL_lose_context");S&&S.loseContext()},this.forceContextRestore=function(){const S=qe.get("WEBGL_lose_context");S&&S.restoreContext()},this.getPixelRatio=function(){return ne},this.setPixelRatio=function(S){S!==void 0&&(ne=S,this.setSize($,ie,!1))},this.getSize=function(S){return S.set($,ie)},this.setSize=function(S,N,z=!0){if(oe.isPresenting){Fe("WebGLRenderer: Can't change size while VR device is presenting.");return}$=S,ie=N,t.width=Math.floor(S*ne),t.height=Math.floor(N*ne),z===!0&&(t.style.width=S+"px",t.style.height=N+"px"),this.setViewport(0,0,S,N)},this.getDrawingBufferSize=function(S){return S.set($*ne,ie*ne).floor()},this.setDrawingBufferSize=function(S,N,z){$=S,ie=N,ne=z,t.width=Math.floor(S*z),t.height=Math.floor(N*z),this.setViewport(0,0,S,N)},this.getCurrentViewport=function(S){return S.copy(B)},this.getViewport=function(S){return S.copy(tt)},this.setViewport=function(S,N,z,V){S.isVector4?tt.set(S.x,S.y,S.z,S.w):tt.set(S,N,z,V),ye.viewport(B.copy(tt).multiplyScalar(ne).round())},this.getScissor=function(S){return S.copy(nt)},this.setScissor=function(S,N,z,V){S.isVector4?nt.set(S.x,S.y,S.z,S.w):nt.set(S,N,z,V),ye.scissor(W.copy(nt).multiplyScalar(ne).round())},this.getScissorTest=function(){return it},this.setScissorTest=function(S){ye.setScissorTest(it=S)},this.setOpaqueSort=function(S){xe=S},this.setTransparentSort=function(S){je=S},this.getClearColor=function(S){return S.copy(se.getClearColor())},this.setClearColor=function(){se.setClearColor(...arguments)},this.getClearAlpha=function(){return se.getClearAlpha()},this.setClearAlpha=function(){se.setClearAlpha(...arguments)},this.clear=function(S=!0,N=!0,z=!0){let V=0;if(S){let U=!1;if(v!==null){const re=v.texture.format;U=_.has(re)}if(U){const re=v.texture.type,ue=b.has(re),be=se.getClearColor(),ge=se.getClearAlpha(),Le=be.r,Pe=be.g,Me=be.b;ue?(x[0]=Le,x[1]=Pe,x[2]=Me,x[3]=ge,I.clearBufferuiv(I.COLOR,0,x)):(g[0]=Le,g[1]=Pe,g[2]=Me,g[3]=ge,I.clearBufferiv(I.COLOR,0,g))}else V|=I.COLOR_BUFFER_BIT}N&&(V|=I.DEPTH_BUFFER_BIT),z&&(V|=I.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),I.clear(V)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",te,!1),t.removeEventListener("webglcontextrestored",K,!1),t.removeEventListener("webglcontextcreationerror",_e,!1),se.dispose(),le.dispose(),Ce.dispose(),Te.dispose(),C.dispose(),y.dispose(),Z.dispose(),D.dispose(),de.dispose(),j.dispose(),oe.dispose(),oe.removeEventListener("sessionstart",Ml),oe.removeEventListener("sessionend",Tl),ui.stop()};function te(S){S.preventDefault(),kl("WebGLRenderer: Context Lost."),A=!0}function K(){kl("WebGLRenderer: Context Restored."),A=!1;const S=gt.autoReset,N=ee.enabled,z=ee.autoUpdate,V=ee.needsUpdate,U=ee.type;ae(),gt.autoReset=S,ee.enabled=N,ee.autoUpdate=z,ee.needsUpdate=V,ee.type=U}function _e(S){Mt("WebGLRenderer: A WebGL context could not be created. Reason: ",S.statusMessage)}function Ne(S){const N=S.target;N.removeEventListener("dispose",Ne),ft(N)}function ft(S){rt(S),Te.remove(S)}function rt(S){const N=Te.get(S).programs;N!==void 0&&(N.forEach(function(z){j.releaseProgram(z)}),S.isShaderMaterial&&j.releaseShaderCache(S))}this.renderBufferDirect=function(S,N,z,V,U,re){N===null&&(N=It);const ue=U.isMesh&&U.matrixWorld.determinant()<0,be=mh(S,N,z,V,U);ye.setMaterial(V,ue);let ge=z.index,Le=1;if(V.wireframe===!0){if(ge=Y.getWireframeAttribute(z),ge===void 0)return;Le=2}const Pe=z.drawRange,Me=z.attributes.position;let Ye=Pe.start*Le,st=(Pe.start+Pe.count)*Le;re!==null&&(Ye=Math.max(Ye,re.start*Le),st=Math.min(st,(re.start+re.count)*Le)),ge!==null?(Ye=Math.max(Ye,0),st=Math.min(st,ge.count)):Me!=null&&(Ye=Math.max(Ye,0),st=Math.min(st,Me.count));const bt=st-Ye;if(bt<0||bt===1/0)return;D.setup(U,V,be,z,ge);let yt,ct=Ae;if(ge!==null&&(yt=G.get(ge),ct=he,ct.setIndex(yt)),U.isMesh)V.wireframe===!0?(ye.setLineWidth(V.wireframeLinewidth*ht()),ct.setMode(I.LINES)):ct.setMode(I.TRIANGLES);else if(U.isLine){let we=V.linewidth;we===void 0&&(we=1),ye.setLineWidth(we*ht()),U.isLineSegments?ct.setMode(I.LINES):U.isLineLoop?ct.setMode(I.LINE_LOOP):ct.setMode(I.LINE_STRIP)}else U.isPoints?ct.setMode(I.POINTS):U.isSprite&&ct.setMode(I.TRIANGLES);if(U.isBatchedMesh)if(U._multiDrawInstances!==null)es("WebGLRenderer: renderMultiDrawInstances has been deprecated and will be removed in r184. Append to renderMultiDraw arguments and use indirection."),ct.renderMultiDrawInstances(U._multiDrawStarts,U._multiDrawCounts,U._multiDrawCount,U._multiDrawInstances);else if(qe.get("WEBGL_multi_draw"))ct.renderMultiDraw(U._multiDrawStarts,U._multiDrawCounts,U._multiDrawCount);else{const we=U._multiDrawStarts,xt=U._multiDrawCounts,Ze=U._multiDrawCount,Yt=ge?G.get(ge).bytesPerElement:1,Oi=Te.get(V).currentProgram.getUniforms();for(let Kt=0;Kt<Ze;Kt++)Oi.setValue(I,"_gl_DrawID",Kt),ct.render(we[Kt]/Yt,xt[Kt])}else if(U.isInstancedMesh)ct.renderInstances(Ye,bt,U.count);else if(z.isInstancedBufferGeometry){const we=z._maxInstanceCount!==void 0?z._maxInstanceCount:1/0,xt=Math.min(z.instanceCount,we);ct.renderInstances(Ye,bt,xt)}else ct.render(Ye,bt)};function vn(S,N,z){S.transparent===!0&&S.side===Mn&&S.forceSinglePass===!1?(S.side=Xt,S.needsUpdate=!0,hs(S,N,z),S.side=ai,S.needsUpdate=!0,hs(S,N,z),S.side=Mn):hs(S,N,z)}this.compile=function(S,N,z=null){z===null&&(z=S),T=Ce.get(z),T.init(N),R.push(T),z.traverseVisible(function(U){U.isLight&&U.layers.test(N.layers)&&(T.pushLight(U),U.castShadow&&T.pushShadow(U))}),S!==z&&S.traverseVisible(function(U){U.isLight&&U.layers.test(N.layers)&&(T.pushLight(U),U.castShadow&&T.pushShadow(U))}),T.setupLights();const V=new Set;return S.traverse(function(U){if(!(U.isMesh||U.isPoints||U.isLine||U.isSprite))return;const re=U.material;if(re)if(Array.isArray(re))for(let ue=0;ue<re.length;ue++){const be=re[ue];vn(be,z,U),V.add(be)}else vn(re,z,U),V.add(re)}),T=R.pop(),V},this.compileAsync=function(S,N,z=null){const V=this.compile(S,N,z);return new Promise(U=>{function re(){if(V.forEach(function(ue){Te.get(ue).currentProgram.isReady()&&V.delete(ue)}),V.size===0){U(S);return}setTimeout(re,10)}qe.get("KHR_parallel_shader_compile")!==null?re():setTimeout(re,10)})};let un=null;function ph(S){un&&un(S)}function Ml(){ui.stop()}function Tl(){ui.start()}const ui=new Wu;ui.setAnimationLoop(ph),typeof self<"u"&&ui.setContext(self),this.setAnimationLoop=function(S){un=S,oe.setAnimationLoop(S),S===null?ui.stop():ui.start()},oe.addEventListener("sessionstart",Ml),oe.addEventListener("sessionend",Tl),this.render=function(S,N){if(N!==void 0&&N.isCamera!==!0){Mt("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(A===!0)return;if(S.matrixWorldAutoUpdate===!0&&S.updateMatrixWorld(),N.parent===null&&N.matrixWorldAutoUpdate===!0&&N.updateMatrixWorld(),oe.enabled===!0&&oe.isPresenting===!0&&(oe.cameraAutoUpdate===!0&&oe.updateCamera(N),N=oe.getCamera()),S.isScene===!0&&S.onBeforeRender(M,S,N,v),T=Ce.get(S,R.length),T.init(N),R.push(T),De.multiplyMatrices(N.projectionMatrix,N.matrixWorldInverse),q.setFromProjectionMatrix(De,Cn,N.reversedDepth),me=this.localClippingEnabled,J=Se.init(this.clippingPlanes,me),w=le.get(S,L.length),w.init(),L.push(w),oe.enabled===!0&&oe.isPresenting===!0){const re=M.xr.getDepthSensingMesh();re!==null&&Na(re,N,-1/0,M.sortObjects)}Na(S,N,0,M.sortObjects),w.finish(),M.sortObjects===!0&&w.sort(xe,je),He=oe.enabled===!1||oe.isPresenting===!1||oe.hasDepthSensing()===!1,He&&se.addToRenderList(w,S),this.info.render.frame++,J===!0&&Se.beginShadows();const z=T.state.shadowsArray;ee.render(z,S,N),J===!0&&Se.endShadows(),this.info.autoReset===!0&&this.info.reset();const V=w.opaque,U=w.transmissive;if(T.setupLights(),N.isArrayCamera){const re=N.cameras;if(U.length>0)for(let ue=0,be=re.length;ue<be;ue++){const ge=re[ue];wl(V,U,S,ge)}He&&se.render(S);for(let ue=0,be=re.length;ue<be;ue++){const ge=re[ue];Cl(w,S,ge,ge.viewport)}}else U.length>0&&wl(V,U,S,N),He&&se.render(S),Cl(w,S,N);v!==null&&E===0&&(Ue.updateMultisampleRenderTarget(v),Ue.updateRenderTargetMipmap(v)),S.isScene===!0&&S.onAfterRender(M,S,N),D.resetDefaultState(),P=-1,O=null,R.pop(),R.length>0?(T=R[R.length-1],J===!0&&Se.setGlobalState(M.clippingPlanes,T.state.camera)):T=null,L.pop(),L.length>0?w=L[L.length-1]:w=null};function Na(S,N,z,V){if(S.visible===!1)return;if(S.layers.test(N.layers)){if(S.isGroup)z=S.renderOrder;else if(S.isLOD)S.autoUpdate===!0&&S.update(N);else if(S.isLight)T.pushLight(S),S.castShadow&&T.pushShadow(S);else if(S.isSprite){if(!S.frustumCulled||q.intersectsSprite(S)){V&&$e.setFromMatrixPosition(S.matrixWorld).applyMatrix4(De);const ue=Z.update(S),be=S.material;be.visible&&w.push(S,ue,be,z,$e.z,null)}}else if((S.isMesh||S.isLine||S.isPoints)&&(!S.frustumCulled||q.intersectsObject(S))){const ue=Z.update(S),be=S.material;if(V&&(S.boundingSphere!==void 0?(S.boundingSphere===null&&S.computeBoundingSphere(),$e.copy(S.boundingSphere.center)):(ue.boundingSphere===null&&ue.computeBoundingSphere(),$e.copy(ue.boundingSphere.center)),$e.applyMatrix4(S.matrixWorld).applyMatrix4(De)),Array.isArray(be)){const ge=ue.groups;for(let Le=0,Pe=ge.length;Le<Pe;Le++){const Me=ge[Le],Ye=be[Me.materialIndex];Ye&&Ye.visible&&w.push(S,ue,Ye,z,$e.z,Me)}}else be.visible&&w.push(S,ue,be,z,$e.z,null)}}const re=S.children;for(let ue=0,be=re.length;ue<be;ue++)Na(re[ue],N,z,V)}function Cl(S,N,z,V){const{opaque:U,transmissive:re,transparent:ue}=S;T.setupLightsView(z),J===!0&&Se.setGlobalState(M.clippingPlanes,z),V&&ye.viewport(B.copy(V)),U.length>0&&fs(U,N,z),re.length>0&&fs(re,N,z),ue.length>0&&fs(ue,N,z),ye.buffers.depth.setTest(!0),ye.buffers.depth.setMask(!0),ye.buffers.color.setMask(!0),ye.setPolygonOffset(!1)}function wl(S,N,z,V){if((z.isScene===!0?z.overrideMaterial:null)!==null)return;T.state.transmissionRenderTarget[V.id]===void 0&&(T.state.transmissionRenderTarget[V.id]=new Ai(1,1,{generateMipmaps:!0,type:qe.has("EXT_color_buffer_half_float")||qe.has("EXT_color_buffer_float")?br:Ln,minFilter:Si,samples:4,stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Qe.workingColorSpace}));const re=T.state.transmissionRenderTarget[V.id],ue=V.viewport||B;re.setSize(ue.z*M.transmissionResolutionScale,ue.w*M.transmissionResolutionScale);const be=M.getRenderTarget(),ge=M.getActiveCubeFace(),Le=M.getActiveMipmapLevel();M.setRenderTarget(re),M.getClearColor(X),Q=M.getClearAlpha(),Q<1&&M.setClearColor(16777215,.5),M.clear(),He&&se.render(z);const Pe=M.toneMapping;M.toneMapping=ri;const Me=V.viewport;if(V.viewport!==void 0&&(V.viewport=void 0),T.setupLightsView(V),J===!0&&Se.setGlobalState(M.clippingPlanes,V),fs(S,z,V),Ue.updateMultisampleRenderTarget(re),Ue.updateRenderTargetMipmap(re),qe.has("WEBGL_multisampled_render_to_texture")===!1){let Ye=!1;for(let st=0,bt=N.length;st<bt;st++){const yt=N[st],{object:ct,geometry:we,material:xt,group:Ze}=yt;if(xt.side===Mn&&ct.layers.test(V.layers)){const Yt=xt.side;xt.side=Xt,xt.needsUpdate=!0,Al(ct,z,V,we,xt,Ze),xt.side=Yt,xt.needsUpdate=!0,Ye=!0}}Ye===!0&&(Ue.updateMultisampleRenderTarget(re),Ue.updateRenderTargetMipmap(re))}M.setRenderTarget(be,ge,Le),M.setClearColor(X,Q),Me!==void 0&&(V.viewport=Me),M.toneMapping=Pe}function fs(S,N,z){const V=N.isScene===!0?N.overrideMaterial:null;for(let U=0,re=S.length;U<re;U++){const ue=S[U],{object:be,geometry:ge,group:Le}=ue;let Pe=ue.material;Pe.allowOverride===!0&&V!==null&&(Pe=V),be.layers.test(z.layers)&&Al(be,N,z,ge,Pe,Le)}}function Al(S,N,z,V,U,re){S.onBeforeRender(M,N,z,V,U,re),S.modelViewMatrix.multiplyMatrices(z.matrixWorldInverse,S.matrixWorld),S.normalMatrix.getNormalMatrix(S.modelViewMatrix),U.onBeforeRender(M,N,z,V,S,re),U.transparent===!0&&U.side===Mn&&U.forceSinglePass===!1?(U.side=Xt,U.needsUpdate=!0,M.renderBufferDirect(z,N,V,U,S,re),U.side=ai,U.needsUpdate=!0,M.renderBufferDirect(z,N,V,U,S,re),U.side=Mn):M.renderBufferDirect(z,N,V,U,S,re),S.onAfterRender(M,N,z,V,U,re)}function hs(S,N,z){N.isScene!==!0&&(N=It);const V=Te.get(S),U=T.state.lights,re=T.state.shadowsArray,ue=U.state.version,be=j.getParameters(S,U.state,re,N,z),ge=j.getProgramCacheKey(be);let Le=V.programs;V.environment=S.isMeshStandardMaterial?N.environment:null,V.fog=N.fog,V.envMap=(S.isMeshStandardMaterial?y:C).get(S.envMap||V.environment),V.envMapRotation=V.environment!==null&&S.envMap===null?N.environmentRotation:S.envMapRotation,Le===void 0&&(S.addEventListener("dispose",Ne),Le=new Map,V.programs=Le);let Pe=Le.get(ge);if(Pe!==void 0){if(V.currentProgram===Pe&&V.lightsStateVersion===ue)return Rl(S,be),Pe}else be.uniforms=j.getUniforms(S),S.onBeforeCompile(be,M),Pe=j.acquireProgram(be,ge),Le.set(ge,Pe),V.uniforms=be.uniforms;const Me=V.uniforms;return(!S.isShaderMaterial&&!S.isRawShaderMaterial||S.clipping===!0)&&(Me.clippingPlanes=Se.uniform),Rl(S,be),V.needsLights=xh(S),V.lightsStateVersion=ue,V.needsLights&&(Me.ambientLightColor.value=U.state.ambient,Me.lightProbe.value=U.state.probe,Me.directionalLights.value=U.state.directional,Me.directionalLightShadows.value=U.state.directionalShadow,Me.spotLights.value=U.state.spot,Me.spotLightShadows.value=U.state.spotShadow,Me.rectAreaLights.value=U.state.rectArea,Me.ltc_1.value=U.state.rectAreaLTC1,Me.ltc_2.value=U.state.rectAreaLTC2,Me.pointLights.value=U.state.point,Me.pointLightShadows.value=U.state.pointShadow,Me.hemisphereLights.value=U.state.hemi,Me.directionalShadowMap.value=U.state.directionalShadowMap,Me.directionalShadowMatrix.value=U.state.directionalShadowMatrix,Me.spotShadowMap.value=U.state.spotShadowMap,Me.spotLightMatrix.value=U.state.spotLightMatrix,Me.spotLightMap.value=U.state.spotLightMap,Me.pointShadowMap.value=U.state.pointShadowMap,Me.pointShadowMatrix.value=U.state.pointShadowMatrix),V.currentProgram=Pe,V.uniformsList=null,Pe}function Ll(S){if(S.uniformsList===null){const N=S.currentProgram.getUniforms();S.uniformsList=Qs.seqWithValue(N.seq,S.uniforms)}return S.uniformsList}function Rl(S,N){const z=Te.get(S);z.outputColorSpace=N.outputColorSpace,z.batching=N.batching,z.batchingColor=N.batchingColor,z.instancing=N.instancing,z.instancingColor=N.instancingColor,z.instancingMorph=N.instancingMorph,z.skinning=N.skinning,z.morphTargets=N.morphTargets,z.morphNormals=N.morphNormals,z.morphColors=N.morphColors,z.morphTargetsCount=N.morphTargetsCount,z.numClippingPlanes=N.numClippingPlanes,z.numIntersection=N.numClipIntersection,z.vertexAlphas=N.vertexAlphas,z.vertexTangents=N.vertexTangents,z.toneMapping=N.toneMapping}function mh(S,N,z,V,U){N.isScene!==!0&&(N=It),Ue.resetTextureUnits();const re=N.fog,ue=V.isMeshStandardMaterial?N.environment:null,be=v===null?M.outputColorSpace:v.isXRRenderTarget===!0?v.texture.colorSpace:pr,ge=(V.isMeshStandardMaterial?y:C).get(V.envMap||ue),Le=V.vertexColors===!0&&!!z.attributes.color&&z.attributes.color.itemSize===4,Pe=!!z.attributes.tangent&&(!!V.normalMap||V.anisotropy>0),Me=!!z.morphAttributes.position,Ye=!!z.morphAttributes.normal,st=!!z.morphAttributes.color;let bt=ri;V.toneMapped&&(v===null||v.isXRRenderTarget===!0)&&(bt=M.toneMapping);const yt=z.morphAttributes.position||z.morphAttributes.normal||z.morphAttributes.color,ct=yt!==void 0?yt.length:0,we=Te.get(V),xt=T.state.lights;if(J===!0&&(me===!0||S!==O)){const Bt=S===O&&V.id===P;Se.setState(V,S,Bt)}let Ze=!1;V.version===we.__version?(we.needsLights&&we.lightsStateVersion!==xt.state.version||we.outputColorSpace!==be||U.isBatchedMesh&&we.batching===!1||!U.isBatchedMesh&&we.batching===!0||U.isBatchedMesh&&we.batchingColor===!0&&U.colorTexture===null||U.isBatchedMesh&&we.batchingColor===!1&&U.colorTexture!==null||U.isInstancedMesh&&we.instancing===!1||!U.isInstancedMesh&&we.instancing===!0||U.isSkinnedMesh&&we.skinning===!1||!U.isSkinnedMesh&&we.skinning===!0||U.isInstancedMesh&&we.instancingColor===!0&&U.instanceColor===null||U.isInstancedMesh&&we.instancingColor===!1&&U.instanceColor!==null||U.isInstancedMesh&&we.instancingMorph===!0&&U.morphTexture===null||U.isInstancedMesh&&we.instancingMorph===!1&&U.morphTexture!==null||we.envMap!==ge||V.fog===!0&&we.fog!==re||we.numClippingPlanes!==void 0&&(we.numClippingPlanes!==Se.numPlanes||we.numIntersection!==Se.numIntersection)||we.vertexAlphas!==Le||we.vertexTangents!==Pe||we.morphTargets!==Me||we.morphNormals!==Ye||we.morphColors!==st||we.toneMapping!==bt||we.morphTargetsCount!==ct)&&(Ze=!0):(Ze=!0,we.__version=V.version);let Yt=we.currentProgram;Ze===!0&&(Yt=hs(V,N,U));let Oi=!1,Kt=!1,Ar=!1;const _t=Yt.getUniforms(),Ht=we.uniforms;if(ye.useProgram(Yt.program)&&(Oi=!0,Kt=!0,Ar=!0),V.id!==P&&(P=V.id,Kt=!0),Oi||O!==S){ye.buffers.depth.getReversed()&&S.reversedDepth!==!0&&(S._reversedDepth=!0,S.updateProjectionMatrix()),_t.setValue(I,"projectionMatrix",S.projectionMatrix),_t.setValue(I,"viewMatrix",S.matrixWorldInverse);const Wt=_t.map.cameraPosition;Wt!==void 0&&Wt.setValue(I,ve.setFromMatrixPosition(S.matrixWorld)),lt.logarithmicDepthBuffer&&_t.setValue(I,"logDepthBufFC",2/(Math.log(S.far+1)/Math.LN2)),(V.isMeshPhongMaterial||V.isMeshToonMaterial||V.isMeshLambertMaterial||V.isMeshBasicMaterial||V.isMeshStandardMaterial||V.isShaderMaterial)&&_t.setValue(I,"isOrthographic",S.isOrthographicCamera===!0),O!==S&&(O=S,Kt=!0,Ar=!0)}if(U.isSkinnedMesh){_t.setOptional(I,U,"bindMatrix"),_t.setOptional(I,U,"bindMatrixInverse");const Bt=U.skeleton;Bt&&(Bt.boneTexture===null&&Bt.computeBoneTexture(),_t.setValue(I,"boneTexture",Bt.boneTexture,Ue))}U.isBatchedMesh&&(_t.setOptional(I,U,"batchingTexture"),_t.setValue(I,"batchingTexture",U._matricesTexture,Ue),_t.setOptional(I,U,"batchingIdTexture"),_t.setValue(I,"batchingIdTexture",U._indirectTexture,Ue),_t.setOptional(I,U,"batchingColorTexture"),U._colorsTexture!==null&&_t.setValue(I,"batchingColorTexture",U._colorsTexture,Ue));const nn=z.morphAttributes;if((nn.position!==void 0||nn.normal!==void 0||nn.color!==void 0)&&Re.update(U,z,Yt),(Kt||we.receiveShadow!==U.receiveShadow)&&(we.receiveShadow=U.receiveShadow,_t.setValue(I,"receiveShadow",U.receiveShadow)),V.isMeshGouraudMaterial&&V.envMap!==null&&(Ht.envMap.value=ge,Ht.flipEnvMap.value=ge.isCubeTexture&&ge.isRenderTargetTexture===!1?-1:1),V.isMeshStandardMaterial&&V.envMap===null&&N.environment!==null&&(Ht.envMapIntensity.value=N.environmentIntensity),Ht.dfgLUT!==void 0&&(Ht.dfgLUT.value=j_()),Kt&&(_t.setValue(I,"toneMappingExposure",M.toneMappingExposure),we.needsLights&&gh(Ht,Ar),re&&V.fog===!0&&Ee.refreshFogUniforms(Ht,re),Ee.refreshMaterialUniforms(Ht,V,ne,ie,T.state.transmissionRenderTarget[S.id]),Qs.upload(I,Ll(we),Ht,Ue)),V.isShaderMaterial&&V.uniformsNeedUpdate===!0&&(Qs.upload(I,Ll(we),Ht,Ue),V.uniformsNeedUpdate=!1),V.isSpriteMaterial&&_t.setValue(I,"center",U.center),_t.setValue(I,"modelViewMatrix",U.modelViewMatrix),_t.setValue(I,"normalMatrix",U.normalMatrix),_t.setValue(I,"modelMatrix",U.matrixWorld),V.isShaderMaterial||V.isRawShaderMaterial){const Bt=V.uniformsGroups;for(let Wt=0,Ua=Bt.length;Wt<Ua;Wt++){const fi=Bt[Wt];de.update(fi,Yt),de.bind(fi,Yt)}}return Yt}function gh(S,N){S.ambientLightColor.needsUpdate=N,S.lightProbe.needsUpdate=N,S.directionalLights.needsUpdate=N,S.directionalLightShadows.needsUpdate=N,S.pointLights.needsUpdate=N,S.pointLightShadows.needsUpdate=N,S.spotLights.needsUpdate=N,S.spotLightShadows.needsUpdate=N,S.rectAreaLights.needsUpdate=N,S.hemisphereLights.needsUpdate=N}function xh(S){return S.isMeshLambertMaterial||S.isMeshToonMaterial||S.isMeshPhongMaterial||S.isMeshStandardMaterial||S.isShadowMaterial||S.isShaderMaterial&&S.lights===!0}this.getActiveCubeFace=function(){return F},this.getActiveMipmapLevel=function(){return E},this.getRenderTarget=function(){return v},this.setRenderTargetTextures=function(S,N,z){const V=Te.get(S);V.__autoAllocateDepthBuffer=S.resolveDepthBuffer===!1,V.__autoAllocateDepthBuffer===!1&&(V.__useRenderToTexture=!1),Te.get(S.texture).__webglTexture=N,Te.get(S.depthTexture).__webglTexture=V.__autoAllocateDepthBuffer?void 0:z,V.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(S,N){const z=Te.get(S);z.__webglFramebuffer=N,z.__useDefaultFramebuffer=N===void 0};const _h=I.createFramebuffer();this.setRenderTarget=function(S,N=0,z=0){v=S,F=N,E=z;let V=!0,U=null,re=!1,ue=!1;if(S){const ge=Te.get(S);if(ge.__useDefaultFramebuffer!==void 0)ye.bindFramebuffer(I.FRAMEBUFFER,null),V=!1;else if(ge.__webglFramebuffer===void 0)Ue.setupRenderTarget(S);else if(ge.__hasExternalTextures)Ue.rebindTextures(S,Te.get(S.texture).__webglTexture,Te.get(S.depthTexture).__webglTexture);else if(S.depthBuffer){const Me=S.depthTexture;if(ge.__boundDepthTexture!==Me){if(Me!==null&&Te.has(Me)&&(S.width!==Me.image.width||S.height!==Me.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");Ue.setupDepthRenderbuffer(S)}}const Le=S.texture;(Le.isData3DTexture||Le.isDataArrayTexture||Le.isCompressedArrayTexture)&&(ue=!0);const Pe=Te.get(S).__webglFramebuffer;S.isWebGLCubeRenderTarget?(Array.isArray(Pe[N])?U=Pe[N][z]:U=Pe[N],re=!0):S.samples>0&&Ue.useMultisampledRTT(S)===!1?U=Te.get(S).__webglMultisampledFramebuffer:Array.isArray(Pe)?U=Pe[z]:U=Pe,B.copy(S.viewport),W.copy(S.scissor),H=S.scissorTest}else B.copy(tt).multiplyScalar(ne).floor(),W.copy(nt).multiplyScalar(ne).floor(),H=it;if(z!==0&&(U=_h),ye.bindFramebuffer(I.FRAMEBUFFER,U)&&V&&ye.drawBuffers(S,U),ye.viewport(B),ye.scissor(W),ye.setScissorTest(H),re){const ge=Te.get(S.texture);I.framebufferTexture2D(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_CUBE_MAP_POSITIVE_X+N,ge.__webglTexture,z)}else if(ue){const ge=N;for(let Le=0;Le<S.textures.length;Le++){const Pe=Te.get(S.textures[Le]);I.framebufferTextureLayer(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0+Le,Pe.__webglTexture,z,ge)}}else if(S!==null&&z!==0){const ge=Te.get(S.texture);I.framebufferTexture2D(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_2D,ge.__webglTexture,z)}P=-1},this.readRenderTargetPixels=function(S,N,z,V,U,re,ue,be=0){if(!(S&&S.isWebGLRenderTarget)){Mt("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let ge=Te.get(S).__webglFramebuffer;if(S.isWebGLCubeRenderTarget&&ue!==void 0&&(ge=ge[ue]),ge){ye.bindFramebuffer(I.FRAMEBUFFER,ge);try{const Le=S.textures[be],Pe=Le.format,Me=Le.type;if(!lt.textureFormatReadable(Pe)){Mt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!lt.textureTypeReadable(Me)){Mt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}N>=0&&N<=S.width-V&&z>=0&&z<=S.height-U&&(S.textures.length>1&&I.readBuffer(I.COLOR_ATTACHMENT0+be),I.readPixels(N,z,V,U,Ie.convert(Pe),Ie.convert(Me),re))}finally{const Le=v!==null?Te.get(v).__webglFramebuffer:null;ye.bindFramebuffer(I.FRAMEBUFFER,Le)}}},this.readRenderTargetPixelsAsync=async function(S,N,z,V,U,re,ue,be=0){if(!(S&&S.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let ge=Te.get(S).__webglFramebuffer;if(S.isWebGLCubeRenderTarget&&ue!==void 0&&(ge=ge[ue]),ge)if(N>=0&&N<=S.width-V&&z>=0&&z<=S.height-U){ye.bindFramebuffer(I.FRAMEBUFFER,ge);const Le=S.textures[be],Pe=Le.format,Me=Le.type;if(!lt.textureFormatReadable(Pe))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!lt.textureTypeReadable(Me))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const Ye=I.createBuffer();I.bindBuffer(I.PIXEL_PACK_BUFFER,Ye),I.bufferData(I.PIXEL_PACK_BUFFER,re.byteLength,I.STREAM_READ),S.textures.length>1&&I.readBuffer(I.COLOR_ATTACHMENT0+be),I.readPixels(N,z,V,U,Ie.convert(Pe),Ie.convert(Me),0);const st=v!==null?Te.get(v).__webglFramebuffer:null;ye.bindFramebuffer(I.FRAMEBUFFER,st);const bt=I.fenceSync(I.SYNC_GPU_COMMANDS_COMPLETE,0);return I.flush(),await bp(I,bt,4),I.bindBuffer(I.PIXEL_PACK_BUFFER,Ye),I.getBufferSubData(I.PIXEL_PACK_BUFFER,0,re),I.deleteBuffer(Ye),I.deleteSync(bt),re}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(S,N=null,z=0){const V=Math.pow(2,-z),U=Math.floor(S.image.width*V),re=Math.floor(S.image.height*V),ue=N!==null?N.x:0,be=N!==null?N.y:0;Ue.setTexture2D(S,0),I.copyTexSubImage2D(I.TEXTURE_2D,z,0,0,ue,be,U,re),ye.unbindTexture()};const bh=I.createFramebuffer(),yh=I.createFramebuffer();this.copyTextureToTexture=function(S,N,z=null,V=null,U=0,re=null){re===null&&(U!==0?(es("WebGLRenderer: copyTextureToTexture function signature has changed to support src and dst mipmap levels."),re=U,U=0):re=0);let ue,be,ge,Le,Pe,Me,Ye,st,bt;const yt=S.isCompressedTexture?S.mipmaps[re]:S.image;if(z!==null)ue=z.max.x-z.min.x,be=z.max.y-z.min.y,ge=z.isBox3?z.max.z-z.min.z:1,Le=z.min.x,Pe=z.min.y,Me=z.isBox3?z.min.z:0;else{const nn=Math.pow(2,-U);ue=Math.floor(yt.width*nn),be=Math.floor(yt.height*nn),S.isDataArrayTexture?ge=yt.depth:S.isData3DTexture?ge=Math.floor(yt.depth*nn):ge=1,Le=0,Pe=0,Me=0}V!==null?(Ye=V.x,st=V.y,bt=V.z):(Ye=0,st=0,bt=0);const ct=Ie.convert(N.format),we=Ie.convert(N.type);let xt;N.isData3DTexture?(Ue.setTexture3D(N,0),xt=I.TEXTURE_3D):N.isDataArrayTexture||N.isCompressedArrayTexture?(Ue.setTexture2DArray(N,0),xt=I.TEXTURE_2D_ARRAY):(Ue.setTexture2D(N,0),xt=I.TEXTURE_2D),I.pixelStorei(I.UNPACK_FLIP_Y_WEBGL,N.flipY),I.pixelStorei(I.UNPACK_PREMULTIPLY_ALPHA_WEBGL,N.premultiplyAlpha),I.pixelStorei(I.UNPACK_ALIGNMENT,N.unpackAlignment);const Ze=I.getParameter(I.UNPACK_ROW_LENGTH),Yt=I.getParameter(I.UNPACK_IMAGE_HEIGHT),Oi=I.getParameter(I.UNPACK_SKIP_PIXELS),Kt=I.getParameter(I.UNPACK_SKIP_ROWS),Ar=I.getParameter(I.UNPACK_SKIP_IMAGES);I.pixelStorei(I.UNPACK_ROW_LENGTH,yt.width),I.pixelStorei(I.UNPACK_IMAGE_HEIGHT,yt.height),I.pixelStorei(I.UNPACK_SKIP_PIXELS,Le),I.pixelStorei(I.UNPACK_SKIP_ROWS,Pe),I.pixelStorei(I.UNPACK_SKIP_IMAGES,Me);const _t=S.isDataArrayTexture||S.isData3DTexture,Ht=N.isDataArrayTexture||N.isData3DTexture;if(S.isDepthTexture){const nn=Te.get(S),Bt=Te.get(N),Wt=Te.get(nn.__renderTarget),Ua=Te.get(Bt.__renderTarget);ye.bindFramebuffer(I.READ_FRAMEBUFFER,Wt.__webglFramebuffer),ye.bindFramebuffer(I.DRAW_FRAMEBUFFER,Ua.__webglFramebuffer);for(let fi=0;fi<ge;fi++)_t&&(I.framebufferTextureLayer(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,Te.get(S).__webglTexture,U,Me+fi),I.framebufferTextureLayer(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,Te.get(N).__webglTexture,re,bt+fi)),I.blitFramebuffer(Le,Pe,ue,be,Ye,st,ue,be,I.DEPTH_BUFFER_BIT,I.NEAREST);ye.bindFramebuffer(I.READ_FRAMEBUFFER,null),ye.bindFramebuffer(I.DRAW_FRAMEBUFFER,null)}else if(U!==0||S.isRenderTargetTexture||Te.has(S)){const nn=Te.get(S),Bt=Te.get(N);ye.bindFramebuffer(I.READ_FRAMEBUFFER,bh),ye.bindFramebuffer(I.DRAW_FRAMEBUFFER,yh);for(let Wt=0;Wt<ge;Wt++)_t?I.framebufferTextureLayer(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,nn.__webglTexture,U,Me+Wt):I.framebufferTexture2D(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_2D,nn.__webglTexture,U),Ht?I.framebufferTextureLayer(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,Bt.__webglTexture,re,bt+Wt):I.framebufferTexture2D(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_2D,Bt.__webglTexture,re),U!==0?I.blitFramebuffer(Le,Pe,ue,be,Ye,st,ue,be,I.COLOR_BUFFER_BIT,I.NEAREST):Ht?I.copyTexSubImage3D(xt,re,Ye,st,bt+Wt,Le,Pe,ue,be):I.copyTexSubImage2D(xt,re,Ye,st,Le,Pe,ue,be);ye.bindFramebuffer(I.READ_FRAMEBUFFER,null),ye.bindFramebuffer(I.DRAW_FRAMEBUFFER,null)}else Ht?S.isDataTexture||S.isData3DTexture?I.texSubImage3D(xt,re,Ye,st,bt,ue,be,ge,ct,we,yt.data):N.isCompressedArrayTexture?I.compressedTexSubImage3D(xt,re,Ye,st,bt,ue,be,ge,ct,yt.data):I.texSubImage3D(xt,re,Ye,st,bt,ue,be,ge,ct,we,yt):S.isDataTexture?I.texSubImage2D(I.TEXTURE_2D,re,Ye,st,ue,be,ct,we,yt.data):S.isCompressedTexture?I.compressedTexSubImage2D(I.TEXTURE_2D,re,Ye,st,yt.width,yt.height,ct,yt.data):I.texSubImage2D(I.TEXTURE_2D,re,Ye,st,ue,be,ct,we,yt);I.pixelStorei(I.UNPACK_ROW_LENGTH,Ze),I.pixelStorei(I.UNPACK_IMAGE_HEIGHT,Yt),I.pixelStorei(I.UNPACK_SKIP_PIXELS,Oi),I.pixelStorei(I.UNPACK_SKIP_ROWS,Kt),I.pixelStorei(I.UNPACK_SKIP_IMAGES,Ar),re===0&&N.generateMipmaps&&I.generateMipmap(xt),ye.unbindTexture()},this.initRenderTarget=function(S){Te.get(S).__webglFramebuffer===void 0&&Ue.setupRenderTarget(S)},this.initTexture=function(S){S.isCubeTexture?Ue.setTextureCube(S,0):S.isData3DTexture?Ue.setTexture3D(S,0):S.isDataArrayTexture||S.isCompressedArrayTexture?Ue.setTexture2DArray(S,0):Ue.setTexture2D(S,0),ye.unbindTexture()},this.resetState=function(){F=0,E=0,v=null,ye.reset(),D.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Cn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorSpace=Qe._getDrawingBufferColorSpace(e),t.unpackColorSpace=Qe._getUnpackColorSpace()}}const Nd={type:"change"},Kc={type:"start"},Yu={type:"end"},Os=new Wc,Ud=new ei,X_=Math.cos(70*vp.DEG2RAD),wt=new k,$t=2*Math.PI,ot={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},go=1e-6;class q_ extends sm{constructor(e,t=null){super(e,t),this.state=ot.NONE,this.target=new k,this.cursor=new k,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:ar.ROTATE,MIDDLE:ar.DOLLY,RIGHT:ar.PAN},this.touches={ONE:nr.ROTATE,TWO:nr.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this._lastPosition=new k,this._lastQuaternion=new wi,this._lastTargetPosition=new k,this._quat=new wi().setFromUnitVectors(e.up,new k(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new dd,this._sphericalDelta=new dd,this._scale=1,this._panOffset=new k,this._rotateStart=new Oe,this._rotateEnd=new Oe,this._rotateDelta=new Oe,this._panStart=new Oe,this._panEnd=new Oe,this._panDelta=new Oe,this._dollyStart=new Oe,this._dollyEnd=new Oe,this._dollyDelta=new Oe,this._dollyDirection=new k,this._mouse=new Oe,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=K_.bind(this),this._onPointerDown=Y_.bind(this),this._onPointerUp=J_.bind(this),this._onContextMenu=rb.bind(this),this._onMouseWheel=eb.bind(this),this._onKeyDown=tb.bind(this),this._onTouchStart=nb.bind(this),this._onTouchMove=ib.bind(this),this._onMouseDown=Z_.bind(this),this._onMouseMove=Q_.bind(this),this._interceptControlDown=sb.bind(this),this._interceptControlUp=ab.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}connect(e){super.connect(e),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents(),this.domElement.getRootNode().removeEventListener("keydown",this._interceptControlDown,{capture:!0}),this.domElement.style.touchAction="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(Nd),this.update(),this.state=ot.NONE}update(e=null){const t=this.object.position;wt.copy(t).sub(this.target),wt.applyQuaternion(this._quat),this._spherical.setFromVector3(wt),this.autoRotate&&this.state===ot.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let i=this.minAzimuthAngle,r=this.maxAzimuthAngle;isFinite(i)&&isFinite(r)&&(i<-Math.PI?i+=$t:i>Math.PI&&(i-=$t),r<-Math.PI?r+=$t:r>Math.PI&&(r-=$t),i<=r?this._spherical.theta=Math.max(i,Math.min(r,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(i+r)/2?Math.max(i,this._spherical.theta):Math.min(r,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let s=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{const o=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),s=o!=this._spherical.radius}if(wt.setFromSpherical(this._spherical),wt.applyQuaternion(this._quatInverse),t.copy(this.target).add(wt),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let o=null;if(this.object.isPerspectiveCamera){const c=wt.length();o=this._clampDistance(c*this._scale);const l=c-o;this.object.position.addScaledVector(this._dollyDirection,l),this.object.updateMatrixWorld(),s=!!l}else if(this.object.isOrthographicCamera){const c=new k(this._mouse.x,this._mouse.y,0);c.unproject(this.object);const l=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),s=l!==this.object.zoom;const d=new k(this._mouse.x,this._mouse.y,0);d.unproject(this.object),this.object.position.sub(d).add(c),this.object.updateMatrixWorld(),o=wt.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;o!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(o).add(this.object.position):(Os.origin.copy(this.object.position),Os.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(Os.direction))<X_?this.object.lookAt(this.target):(Ud.setFromNormalAndCoplanarPoint(this.object.up,this.target),Os.intersectPlane(Ud,this.target))))}else if(this.object.isOrthographicCamera){const o=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),o!==this.object.zoom&&(this.object.updateProjectionMatrix(),s=!0)}return this._scale=1,this._performCursorZoom=!1,s||this._lastPosition.distanceToSquared(this.object.position)>go||8*(1-this._lastQuaternion.dot(this.object.quaternion))>go||this._lastTargetPosition.distanceToSquared(this.target)>go?(this.dispatchEvent(Nd),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(e){return e!==null?$t/60*this.autoRotateSpeed*e:$t/60/60*this.autoRotateSpeed}_getZoomScale(e){const t=Math.abs(e*.01);return Math.pow(.95,this.zoomSpeed*t)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,t){wt.setFromMatrixColumn(t,0),wt.multiplyScalar(-e),this._panOffset.add(wt)}_panUp(e,t){this.screenSpacePanning===!0?wt.setFromMatrixColumn(t,1):(wt.setFromMatrixColumn(t,0),wt.crossVectors(this.object.up,wt)),wt.multiplyScalar(e),this._panOffset.add(wt)}_pan(e,t){const i=this.domElement;if(this.object.isPerspectiveCamera){const r=this.object.position;wt.copy(r).sub(this.target);let s=wt.length();s*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*s/i.clientHeight,this.object.matrix),this._panUp(2*t*s/i.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/i.clientWidth,this.object.matrix),this._panUp(t*(this.object.top-this.object.bottom)/this.object.zoom/i.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(e,t){if(!this.zoomToCursor)return;this._performCursorZoom=!0;const i=this.domElement.getBoundingClientRect(),r=e-i.left,s=t-i.top,o=i.width,c=i.height;this._mouse.x=r/o*2-1,this._mouse.y=-(s/c)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const t=this.domElement;this._rotateLeft($t*this._rotateDelta.x/t.clientHeight),this._rotateUp($t*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),this.update()}_handleKeyDown(e){let t=!1;switch(e.code){case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp($t*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),t=!0;break;case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(-$t*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),t=!0;break;case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft($t*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),t=!0;break;case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(-$t*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),t=!0;break}t&&(e.preventDefault(),this.update())}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{const t=this._getSecondPointerPosition(e),i=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._rotateStart.set(i,r)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{const t=this._getSecondPointerPosition(e),i=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._panStart.set(i,r)}}_handleTouchStartDolly(e){const t=this._getSecondPointerPosition(e),i=e.pageX-t.x,r=e.pageY-t.y,s=Math.sqrt(i*i+r*r);this._dollyStart.set(0,s)}_handleTouchStartDollyPan(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enablePan&&this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enableRotate&&this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{const i=this._getSecondPointerPosition(e),r=.5*(e.pageX+i.x),s=.5*(e.pageY+i.y);this._rotateEnd.set(r,s)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const t=this.domElement;this._rotateLeft($t*this._rotateDelta.x/t.clientHeight),this._rotateUp($t*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{const t=this._getSecondPointerPosition(e),i=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._panEnd.set(i,r)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){const t=this._getSecondPointerPosition(e),i=e.pageX-t.x,r=e.pageY-t.y,s=Math.sqrt(i*i+r*r);this._dollyEnd.set(0,s),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);const o=(e.pageX+t.x)*.5,c=(e.pageY+t.y)*.5;this._updateZoomParameters(o,c)}_handleTouchMoveDollyPan(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enablePan&&this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enableRotate&&this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId){this._pointers.splice(t,1);return}}_isTrackingPointer(e){for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId)return!0;return!1}_trackPointer(e){let t=this._pointerPositions[e.pointerId];t===void 0&&(t=new Oe,this._pointerPositions[e.pointerId]=t),t.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){const t=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[t]}_customWheelEvent(e){const t=e.deltaMode,i={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(t){case 1:i.deltaY*=16;break;case 2:i.deltaY*=100;break}return e.ctrlKey&&!this._controlActive&&(i.deltaY*=10),i}}function Y_(n){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(n.pointerId),this.domElement.addEventListener("pointermove",this._onPointerMove),this.domElement.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(n)&&(this._addPointer(n),n.pointerType==="touch"?this._onTouchStart(n):this._onMouseDown(n)))}function K_(n){this.enabled!==!1&&(n.pointerType==="touch"?this._onTouchMove(n):this._onMouseMove(n))}function J_(n){switch(this._removePointer(n),this._pointers.length){case 0:this.domElement.releasePointerCapture(n.pointerId),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(Yu),this.state=ot.NONE;break;case 1:const e=this._pointers[0],t=this._pointerPositions[e];this._onTouchStart({pointerId:e,pageX:t.x,pageY:t.y});break}}function Z_(n){let e;switch(n.button){case 0:e=this.mouseButtons.LEFT;break;case 1:e=this.mouseButtons.MIDDLE;break;case 2:e=this.mouseButtons.RIGHT;break;default:e=-1}switch(e){case ar.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(n),this.state=ot.DOLLY;break;case ar.ROTATE:if(n.ctrlKey||n.metaKey||n.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(n),this.state=ot.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(n),this.state=ot.ROTATE}break;case ar.PAN:if(n.ctrlKey||n.metaKey||n.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(n),this.state=ot.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(n),this.state=ot.PAN}break;default:this.state=ot.NONE}this.state!==ot.NONE&&this.dispatchEvent(Kc)}function Q_(n){switch(this.state){case ot.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(n);break;case ot.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(n);break;case ot.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(n);break}}function eb(n){this.enabled===!1||this.enableZoom===!1||this.state!==ot.NONE||(n.preventDefault(),this.dispatchEvent(Kc),this._handleMouseWheel(this._customWheelEvent(n)),this.dispatchEvent(Yu))}function tb(n){this.enabled!==!1&&this._handleKeyDown(n)}function nb(n){switch(this._trackPointer(n),this._pointers.length){case 1:switch(this.touches.ONE){case nr.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(n),this.state=ot.TOUCH_ROTATE;break;case nr.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(n),this.state=ot.TOUCH_PAN;break;default:this.state=ot.NONE}break;case 2:switch(this.touches.TWO){case nr.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(n),this.state=ot.TOUCH_DOLLY_PAN;break;case nr.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(n),this.state=ot.TOUCH_DOLLY_ROTATE;break;default:this.state=ot.NONE}break;default:this.state=ot.NONE}this.state!==ot.NONE&&this.dispatchEvent(Kc)}function ib(n){switch(this._trackPointer(n),this.state){case ot.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(n),this.update();break;case ot.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(n),this.update();break;case ot.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(n),this.update();break;case ot.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(n),this.update();break;default:this.state=ot.NONE}}function rb(n){this.enabled!==!1&&n.preventDefault()}function sb(n){n.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function ab(n){n.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}const mn={IMAGE:"image",IFRAME:"iframe"},Ku=["ocean","ember","graphite"],Ju=["comfortable","compact"],ob="card_collapsed_",Li="card-klipperview",Jc=["card-print-progress","card-temperatures","card-motion","card-quick-commands","card-macros","card-dashboard-console","camera-main-card","camera-toolhead-card",Li],Zu={left:["card-print-progress","card-motion","camera-main-card","card-macros"],right:["card-temperatures","card-quick-commands","card-dashboard-console",Li,"camera-toolhead-card"]},cb={"card-print-progress":"Status","card-temperatures":"Thermals","card-motion":"Controls","card-quick-commands":"Quick Commands","card-macros":"Macros","card-dashboard-console":"Console","camera-main-card":"Main Camera","camera-toolhead-card":"Toolhead Cam",[Li]:"KlipperView"},_c={unknown:{label:"Unknown",color:"#64748b"},connecting:{label:"Connecting",color:"#f59e0b"},disconnected:{label:"Disconnected",color:"#f97316"},ready:{label:"Ready",color:"#22c55e"},printing:{label:"Printing",color:"#16a34a"},paused:{label:"Paused",color:"#f59e0b"},complete:{label:"Complete",color:"#22d3ee"},cancelled:{label:"Cancelled",color:"#94a3b8"},error:{label:"Error",color:"#ef4444"}},Qu={dashboard:"Dashboard",console:"Console",configuration:"Machine",files:"GCode Files","pretty-gcode":"KlipperView",settings:"Settings"},ef="active_view",tf="config_selected_path",nf="config_file_type_filter",rf="config_file_search_filter",Zc="interface_machine_side_collapsed",sf="jobs_sort_mode",af="jobs_type_filter",of="jobs_search_query",cf="jobs_directory",lf="jobs_visible_columns",lb=["modified_desc","modified_asc","name_asc","name_desc","size_desc","size_asc","eta_desc","eta_asc"],db=["all","files","folders"],bc=[{key:"size",label:"Size"},{key:"modified",label:"Modified"},{key:"eta",label:"ETA"},{key:"total_layers",label:"Total Layers"},{key:"layer_height",label:"Layer Height"},{key:"first_layer_height",label:"First Layer Height"},{key:"object_height",label:"Object Height"},{key:"filament_length",label:"Filament Length"},{key:"filament_weight",label:"Filament Weight"},{key:"filament_type",label:"Filament Type"},{key:"filament_name",label:"Filament Name"},{key:"nozzle_diameter",label:"Nozzle Diameter"},{key:"first_layer_extruder_temp",label:"First Layer Nozzle Temp"},{key:"first_layer_bed_temp",label:"First Layer Bed Temp"},{key:"chamber_temp",label:"Chamber Temp"}],ts=bc.map(n=>n.key),ub=["size","modified","eta","total_layers"],df=new Set(["debug","info","warn","error"]),fb=1200,hb=400,pb=1200,mb=6e3,gb=250,uf="console_history_v1",ff="console_filter_v1",hf="console_autoscroll_v1",pf="console_hide_temps_v1",mf="console_raw_output_v1",gf=120,xb=1500,_b=["all","command","response","error","system"],bb=["G0","G1","G2","G3","G4","G10","G20","G21","G28","G90","G91","G92","M82","M83","M84","M104","M105","M106","M107","M109","M114","M115","M117","M118","M140","M141","M190","M191","M220","M221","M400"],yb=["STATUS","GET_POSITION","QUERY_ENDSTOPS","RESTART","FIRMWARE_RESTART"],vb={hotend:[0,170,200,215,240,260],bed:[0,45,60,80,100]},Sb=250,Eb=800,Mb=2e3,Tb=1e4,Od=140,Cb=800,wb=600*1e3,Ab=.18,Bd="temperature_history_session_v1",Lb="forge_ui_temperature_history",Rb=1,gr="temperature_samples",Gd={hotend:"#ff4a3f",bed:"#2ea3ff"},dt={ALL:"all",EXAMPLE:"example",LOG:"log",BACKUP:"backup",CONFIG:"config",DOC:"doc"},xo={[dt.EXAMPLE]:"Examples",[dt.LOG]:"Logs",[dt.BACKUP]:"Backups",[dt.CONFIG]:"Configs",[dt.DOC]:"Other docs"},xa={[dt.EXAMPLE]:0,[dt.LOG]:1,[dt.BACKUP]:2,[dt.CONFIG]:3,[dt.DOC]:4},Pb=new Set(["gcodes","timelapse","timelapse_frames"]),_o=["config","logs","docs","config_example","config_examples"],Bs=["system","klipper","moonraker","fluidd","mainsail"],Ib=15e4,Db=120,kd=.05,Sr=20*1e3,Fb=14400*1e3,Nb=95,Ub=.005,lr="default",Ob="travel",bo=[lr,"inner","outer","fill","skin","support","skirt"],Bb=[{term:"inner wall",featureType:"inner"},{term:"outer wall",featureType:"outer"},{term:"inner",featureType:"inner"},{term:"outer",featureType:"outer"},{term:"perimeter",featureType:"outer"},{term:"wall",featureType:"outer"},{term:"fill",featureType:"fill"},{term:"infill",featureType:"fill"},{term:"skin",featureType:"skin"},{term:"support",featureType:"support"},{term:"raft",featureType:"support"},{term:"brim",featureType:"skirt"},{term:"skirt",featureType:"skirt"}],zd={[lr]:{current:"rgba(248, 113, 113, 0.96)",history:"rgba(186, 92, 92, 0.52)"},inner:{current:"rgba(34, 197, 94, 0.95)",history:"rgba(52, 138, 84, 0.5)"},outer:{current:"rgba(239, 68, 68, 0.98)",history:"rgba(164, 66, 66, 0.56)"},fill:{current:"rgba(251, 146, 60, 0.95)",history:"rgba(178, 111, 66, 0.52)"},skin:{current:"rgba(250, 204, 21, 0.96)",history:"rgba(184, 154, 60, 0.52)"},support:{current:"rgba(56, 189, 248, 0.95)",history:"rgba(72, 131, 168, 0.52)"},skirt:{current:"rgba(14, 165, 233, 0.95)",history:"rgba(60, 122, 153, 0.52)"}},Vd={current:"rgba(148, 163, 184, 0.72)",history:"rgba(100, 116, 139, 0.38)"},Gb="rgba(100, 116, 139, 0.42)",kb=5,yo=.42;function Hd(n,e){return getComputedStyle(document.documentElement).getPropertyValue(n).trim()||e}function zb(){return{hotend:Hd("--danger",Gd.hotend),bed:Hd("--accent",Gd.bed)}}const ke=xu("app"),u={navItems:[...document.querySelectorAll(".nav-item")],views:[...document.querySelectorAll(".view")],sidebar:document.getElementById("sidebar"),sidebarToggle:document.getElementById("sidebar-toggle"),pageTitle:document.getElementById("page-title"),connectionPill:document.getElementById("connection-pill"),connectionText:document.getElementById("connection-text"),printerDot:document.getElementById("printer-dot"),printerState:document.getElementById("printer-state"),progressBar:document.getElementById("progress-bar"),progressText:document.getElementById("progress-text"),statusFileName:document.getElementById("status-file-name"),statusFileThumbWrap:document.getElementById("status-file-thumb-wrap"),statusFileThumb:document.getElementById("status-file-thumb"),statusEtp:document.getElementById("status-etp"),statusFinish:document.getElementById("status-finish"),statusTimeLeft:document.getElementById("status-time-left"),statusSpeed:document.getElementById("status-speed"),statusFlowrate:document.getElementById("status-flowrate"),statusFilament:document.getElementById("status-filament"),statusLayer:document.getElementById("status-layer"),tempHotend:document.getElementById("temp-hotend"),tempBed:document.getElementById("temp-bed"),tempHotendState:document.getElementById("temp-hotend-state"),tempBedState:document.getElementById("temp-bed-state"),tempHotendTarget:document.getElementById("temp-hotend-target"),tempBedTarget:document.getElementById("temp-bed-target"),tempHotendTargetInput:document.getElementById("temp-hotend-target-input"),tempBedTargetInput:document.getElementById("temp-bed-target-input"),tempHotendTargetToggle:document.getElementById("temp-hotend-target-toggle"),tempBedTargetToggle:document.getElementById("temp-bed-target-toggle"),tempHotendTargetMenu:document.getElementById("temp-hotend-target-menu"),tempBedTargetMenu:document.getElementById("temp-bed-target-menu"),tempCooldown:document.getElementById("temp-cooldown"),tempSettingsToggle:document.getElementById("temp-settings-toggle"),tempSettingsMenu:document.getElementById("temp-settings-menu"),tempShowChart:document.getElementById("temp-show-chart"),tempHideHostSensors:document.getElementById("temp-hide-host-sensors"),tempHideMonitors:document.getElementById("temp-hide-monitors"),tempAutoscaleChart:document.getElementById("temp-autoscale-chart"),temperatureChartWrap:document.getElementById("temperature-chart-wrap"),temperatureChart:document.getElementById("temperature-chart"),temperatureChartTooltip:document.getElementById("temperature-chart-tooltip"),temperatureTooltipTime:document.getElementById("temperature-tooltip-time"),temperatureTooltipHotend:document.getElementById("temperature-tooltip-hotend"),temperatureTooltipBed:document.getElementById("temperature-tooltip-bed"),consoleLog:document.getElementById("console-log"),consoleForm:document.getElementById("console-form"),consoleInput:document.getElementById("console-input"),consoleClear:document.getElementById("console-clear"),consoleHelperToggle:document.getElementById("console-helper-toggle"),consoleSettingsToggle:document.getElementById("console-settings-toggle"),consoleHelperPanel:document.getElementById("console-helper-panel"),consoleSettingsPanel:document.getElementById("console-settings-panel"),consoleHideTemps:document.getElementById("console-hide-temps"),consoleRawOutput:document.getElementById("console-raw-output"),consolePause:document.getElementById("console-pause"),consoleAutoscroll:document.getElementById("console-autoscroll"),consoleFilter:document.getElementById("console-filter"),consoleSearch:document.getElementById("console-search"),consoleMeta:document.getElementById("console-meta"),consoleHelperGrid:document.getElementById("console-helper-grid"),dashboardConsoleLog:document.getElementById("dashboard-console-log"),dashboardConsoleForm:document.getElementById("dashboard-console-form"),dashboardConsoleInput:document.getElementById("dashboard-console-input"),dashboardConsoleClear:document.getElementById("dashboard-console-clear"),dashboardConsoleHelperToggle:document.getElementById("dashboard-console-helper-toggle"),dashboardConsoleSettingsToggle:document.getElementById("dashboard-console-settings-toggle"),dashboardConsoleHelperPanel:document.getElementById("dashboard-console-helper-panel"),dashboardConsoleSettingsPanel:document.getElementById("dashboard-console-settings-panel"),dashboardConsoleHideTemps:document.getElementById("dashboard-console-hide-temps"),dashboardConsoleRawOutput:document.getElementById("dashboard-console-raw-output"),dashboardConsolePause:document.getElementById("dashboard-console-pause"),dashboardConsoleAutoscroll:document.getElementById("dashboard-console-autoscroll"),dashboardConsoleFilter:document.getElementById("dashboard-console-filter"),dashboardConsoleSearch:document.getElementById("dashboard-console-search"),dashboardConsoleMeta:document.getElementById("dashboard-console-meta"),dashboardConsoleHelperGrid:document.getElementById("dashboard-console-helper-grid"),macroList:document.getElementById("macro-list"),dashboardMacroList:document.getElementById("dashboard-macro-list"),jobsCard:document.getElementById("jobs-card"),fileList:document.getElementById("file-list"),jobsRefresh:document.getElementById("jobs-refresh"),jobsUploadBtn:document.getElementById("jobs-upload-btn"),jobsUploadFolderBtn:document.getElementById("jobs-upload-folder-btn"),jobsUploadPrintBtn:document.getElementById("jobs-upload-print-btn"),jobsAddFileBtn:document.getElementById("jobs-add-file-btn"),jobsUploadInput:document.getElementById("jobs-upload-input"),jobsUploadFolderInput:document.getElementById("jobs-upload-folder-input"),jobsUploadPrintInput:document.getElementById("jobs-upload-print-input"),jobsAddFileInput:document.getElementById("jobs-add-file-input"),jobsNewFolder:document.getElementById("jobs-new-folder"),jobsSummary:document.getElementById("jobs-summary"),jobsFeaturePanel:document.getElementById("jobs-feature-panel"),jobsPathDisplay:document.getElementById("jobs-path-display"),jobsSortToggle:document.getElementById("jobs-sort-toggle"),jobsSortMenu:document.getElementById("jobs-sort-menu"),jobsColumnsToggle:document.getElementById("jobs-columns-toggle"),jobsColumnsMenu:document.getElementById("jobs-columns-menu"),jobsColumnsList:document.getElementById("jobs-columns-list"),jobsSearchToggle:document.getElementById("jobs-search-toggle"),jobsFilterToggle:document.getElementById("jobs-filter-toggle"),jobsFilterMenu:document.getElementById("jobs-filter-menu"),jobsAddToggle:document.getElementById("jobs-add-toggle"),jobsAddMenu:document.getElementById("jobs-add-menu"),jobsSearch:document.getElementById("jobs-search"),jobsSort:document.getElementById("jobs-sort"),jobsTypeFilter:document.getElementById("jobs-type-filter"),jobsActiveLabel:document.getElementById("jobs-active-label"),jobsPause:document.getElementById("jobs-pause"),jobsResume:document.getElementById("jobs-resume"),jobsCancel:document.getElementById("jobs-cancel"),jobsBreadcrumbs:document.getElementById("jobs-breadcrumbs"),jobsStatus:document.getElementById("jobs-status"),prettyGcodeView:document.getElementById("view-pretty-gcode"),prettyGcodeCard:document.getElementById(Li),prettyGcodeCanvas:document.getElementById("pretty-gcode-canvas"),prettyGcodeStatus:document.getElementById("pretty-gcode-status"),prettyGcodeFile:document.getElementById("pretty-gcode-file"),prettyGcodeFollow:document.getElementById("pretty-gcode-follow"),prettyGcodeReload:document.getElementById("pretty-gcode-reload"),prettyGcodeMode:document.getElementById("pretty-gcode-mode"),prettyGcodeLoadFile:document.getElementById("pretty-gcode-load-file"),prettyGcodeLive:document.getElementById("pretty-gcode-live"),prettyGcodeRewind:document.getElementById("pretty-gcode-rewind"),prettyGcodePlayPause:document.getElementById("pretty-gcode-play-pause"),prettyGcodeFastForward:document.getElementById("pretty-gcode-fast-forward"),prettyGcodeShowMirror:document.getElementById("pretty-gcode-show-mirror"),prettyGcodeShowNozzle:document.getElementById("pretty-gcode-show-nozzle"),prettyGcodeOrbitIdle:document.getElementById("pretty-gcode-orbit-idle"),prettyGcodeProgress:document.getElementById("pretty-gcode-progress"),prettyGcodeLayerSlider:document.getElementById("pretty-gcode-layer-slider"),prettyGcodeLayerTop:document.getElementById("pretty-gcode-layer-top"),prettyGcodeLayerBottom:document.getElementById("pretty-gcode-layer-bottom"),prettyGcodeLoadInput:document.getElementById("pretty-gcode-load-input"),machineLayout:document.getElementById("machine-layout"),machineSideColumn:document.getElementById("machine-side-column"),machineSideToggle:document.getElementById("machine-side-toggle"),configRefresh:document.getElementById("config-refresh"),configUploadBtn:document.getElementById("config-upload-btn"),configUploadInput:document.getElementById("config-upload-input"),configFilter:document.getElementById("config-filter"),configFileSearch:document.getElementById("config-file-search"),configFileList:document.getElementById("config-file-list"),configCurrentFile:document.getElementById("config-current-file"),configStatus:document.getElementById("config-status"),configDownload:document.getElementById("config-download"),configDelete:document.getElementById("config-delete"),configNewBtn:document.getElementById("config-new-btn"),configIgnoreChanges:document.getElementById("config-ignore-changes"),configSaveRestart:document.getElementById("config-save-restart"),configDirtyPrompt:document.getElementById("config-dirty-prompt"),configEditor:document.getElementById("config-editor"),configSearchInput:document.getElementById("config-search-input"),configSearchPrev:document.getElementById("config-search-prev"),configSearchNext:document.getElementById("config-search-next"),configSearchCount:document.getElementById("config-search-count"),configSearchCase:document.getElementById("config-search-case"),configSearchWord:document.getElementById("config-search-word"),configSearchRegex:document.getElementById("config-search-regex"),machineSystemStatus:document.getElementById("machine-system-status"),machineMcuName:document.getElementById("machine-mcu-name"),machineMcuChip:document.getElementById("machine-mcu-chip"),machineMcuVersion:document.getElementById("machine-mcu-version"),machineMcuStats:document.getElementById("machine-mcu-stats"),machineHostArch:document.getElementById("machine-host-arch"),machineHostVersion:document.getElementById("machine-host-version"),machineHostOs:document.getElementById("machine-host-os"),machineHostStats:document.getElementById("machine-host-stats"),machineHostNetworkList:document.getElementById("machine-host-network-list"),machineDevicesGauge:document.getElementById("machine-devices-gauge"),machineDevicesValue:document.getElementById("machine-devices-value"),machineCpuGauge:document.getElementById("machine-cpu-gauge"),machineCpuGaugeValue:document.getElementById("machine-cpu-gauge-value"),machineMemGauge:document.getElementById("machine-mem-gauge"),machineMemGaugeValue:document.getElementById("machine-mem-gauge-value"),machineUpdateRefresh:document.getElementById("machine-update-refresh"),machineUpdateUpgradeAll:document.getElementById("machine-update-upgrade-all"),machineUpdateSummary:document.getElementById("machine-update-summary"),machineUpdateRate:document.getElementById("machine-update-rate"),machineUpdateList:document.getElementById("machine-update-list"),machineUpdateLog:document.getElementById("machine-update-log"),machineUpdateStatus:document.getElementById("machine-update-status"),machineEndstopsQuery:document.getElementById("machine-endstops-query"),machineEndstopsSummary:document.getElementById("machine-endstops-summary"),machineEndstopsList:document.getElementById("machine-endstops-list"),machineEndstopsStatus:document.getElementById("machine-endstops-status"),machineLogFilesRefresh:document.getElementById("machine-log-files-refresh"),machineLogFilesDeleteAll:document.getElementById("machine-log-files-delete-all"),machineLogFilesSummary:document.getElementById("machine-log-files-summary"),machineLogFilesList:document.getElementById("machine-log-files-list"),machineLogFilesStatus:document.getElementById("machine-log-files-status"),settingsForm:document.getElementById("settings-form"),moonrakerUrl:document.getElementById("moonraker-url"),interfaceTheme:document.getElementById("interface-theme"),interfaceCompact:document.getElementById("interface-compact"),interfaceDensity:document.getElementById("interface-density"),dashShowPrintProgress:document.getElementById("dash-show-print-progress"),dashShowTemperatures:document.getElementById("dash-show-temperatures"),dashShowMotion:document.getElementById("dash-show-motion"),dashShowQuickCommands:document.getElementById("dash-show-quick-commands"),dashShowMacros:document.getElementById("dash-show-macros"),dashShowMainCamera:document.getElementById("dash-show-main-camera"),dashShowToolheadCamera:document.getElementById("dash-show-toolhead-camera"),dashShowConsole:document.getElementById("dash-show-console"),dashShowKlipperView:document.getElementById("dash-show-klipperview"),openDashboardLayout:document.getElementById("open-dashboard-layout"),dashboardLayoutDialog:document.getElementById("dashboard-layout-dialog"),dashboardLayoutClose:document.getElementById("dashboard-layout-close"),dashboardLayoutSave:document.getElementById("dashboard-layout-save"),dashboardLayoutReset:document.getElementById("dashboard-layout-reset"),dashboardLayoutLeft:document.getElementById("dashboard-layout-left"),dashboardLayoutRight:document.getElementById("dashboard-layout-right"),dashboardCards:document.getElementById("dashboard-cards"),dashboardColLeft:document.getElementById("dashboard-col-left"),dashboardColRight:document.getElementById("dashboard-col-right"),cardPrintProgress:document.getElementById("card-print-progress"),cardTemperatures:document.getElementById("card-temperatures"),cardMotion:document.getElementById("card-motion"),cardQuickCommands:document.getElementById("card-quick-commands"),cardMacros:document.getElementById("card-macros"),cardDashboardConsole:document.getElementById("card-dashboard-console"),cardMainCamera:document.getElementById("camera-main-card"),cardToolheadCamera:document.getElementById("camera-toolhead-card"),cameraEnabled:document.getElementById("camera-enabled"),cameraUrl:document.getElementById("camera-url"),cameraRenderMode:document.getElementById("camera-render-mode"),toolheadCameraEnabled:document.getElementById("toolhead-camera-enabled"),toolheadCameraUrl:document.getElementById("toolhead-camera-url"),toolheadCameraRenderMode:document.getElementById("toolhead-camera-render-mode"),mainCameraFrame:document.getElementById("main-camera-frame"),toolheadCameraFrame:document.getElementById("toolhead-camera-frame"),mainCameraFullscreen:document.getElementById("main-camera-fullscreen"),toolheadCameraFullscreen:document.getElementById("toolhead-camera-fullscreen"),cameraDialog:document.getElementById("camera-fullscreen-dialog"),cameraDialogClose:document.getElementById("camera-fullscreen-close"),cameraDialogContent:document.getElementById("camera-fullscreen-content"),home:document.getElementById("btn-home"),jog:[...document.querySelectorAll("[data-jog]")],quickGcode:[...document.querySelectorAll("[data-gcode]")]};let _a=null,ea=null,ta=null,na=null,ia=null,vo=null,Gs=null,Hr=null,Zi=null,ra=null,fe={renderer:null,scene:null,camera:null,controls:null,animationFrame:null,geometryDirty:!0,renderRequested:!0,layerEntries:[],printGroup:null,mirrorGroup:null,bedGrid:null,bedPlane:null,nozzleMesh:null,bedCenter:{},bedSize:{x:220,z:220},lastInteractionMs:0};function Et(n,e){const t=localStorage.getItem(n);return t===null?e:t==="1"||t==="true"}function Wd(n,e){const t=localStorage.getItem(n);return t===mn.IMAGE||t===mn.IFRAME?t:e}function jd(n,e,t){const i=localStorage.getItem(n);return i&&t.includes(i)?i:e}function Vb(n){return!(n instanceof HTMLInputElement)||n.type!=="file"?null:(n.hasAttribute("hidden")&&n.removeAttribute("hidden"),n.classList.add("file-input-proxy"),n)}function Ur(n){const e=Vb(n);if(!(!e||e.disabled)){if(typeof e.showPicker=="function")try{e.showPicker();return}catch{}e.click()}}function xf(n){return Object.prototype.hasOwnProperty.call(Qu,n)}function Hb(n="dashboard"){const e=localStorage.getItem(ef);return xf(e)?e:n}function Wb(){return String(localStorage.getItem(tf)||"").trim()}function jb(){return wr(localStorage.getItem(nf))}function $b(){return String(localStorage.getItem(rf)||"").trim()}function Er(n){const e=String(n||"").trim().toLowerCase();return lb.includes(e)?e:"modified_desc"}function Mr(n){const e=String(n||"").trim().toLowerCase();return db.includes(e)?e:"all"}function Ke(n){return String(n||"").trim().replace(/\\/g,"/").replace(/^\/+/,"").replace(/\/+$/,"")}function Xb(){return Er(localStorage.getItem(sf))}function qb(){return Mr(localStorage.getItem(af))}function Yb(){return String(localStorage.getItem(of)||"").trim()}function Kb(){return Ke(localStorage.getItem(cf))}function wa(n){let e=[];if(Array.isArray(n))e=n;else if(typeof n=="string")try{const r=JSON.parse(n);Array.isArray(r)&&(e=r)}catch{e=[]}const t=e.map(r=>String(r||"").trim().toLowerCase()).map(r=>r==="layers"?"total_layers":r).filter(r=>ts.includes(r)),i=[...new Set(t)];return i.length?i:[...ub]}function Jb(){return wa(localStorage.getItem(lf))}function Aa(){localStorage.setItem(tf,a.config.selectedPath||""),localStorage.setItem(nf,wr(a.config.fileTypeFilter)),localStorage.setItem(rf,String(a.config.fileSearchQuery||"").trim())}function Zb(n){return n.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")}function yc(n){const t=(Array.isArray(n)?n:[]).filter(i=>Jc.includes(i));return[...new Set(t)]}function oi(n){const e=n&&typeof n=="object"?n:{},t=yc(e.left),i=yc(e.right).filter(o=>!t.includes(o)),r=new Set([...t,...i]);return Jc.filter(o=>!r.has(o)).forEach(o=>{t.length<=i.length?t.push(o):i.push(o)}),{left:t,right:i}}function Qb(n){const e=yc(n),t={left:[],right:[]};return e.forEach((i,r)=>{const s=r%2===0?"left":"right";t[s].push(i)}),oi(t)}function _f(n){const e=oi(n),t=Math.max(e.left.length,e.right.length),i=[];for(let r=0;r<t;r+=1)e.left[r]&&i.push(e.left[r]),e.right[r]&&i.push(e.right[r]);return i}function ey(){const n=localStorage.getItem("dashboard_layout");if(n)try{const t=JSON.parse(n);return oi(t)}catch{}const e=localStorage.getItem("dashboard_layout_order");if(e)try{const t=JSON.parse(e);return Qb(t)}catch{}return oi(Zu)}function Or(n,e=null){const t=Number(n);return Number.isFinite(t)?t:e}function bf(n){const e=Or(n?.time,null);return Number.isFinite(e)?{time:e,hotendCurrent:Or(n?.hotendCurrent,null),hotendTarget:Or(n?.hotendTarget,0),bedCurrent:Or(n?.bedCurrent,null),bedTarget:Or(n?.bedTarget,0)}:null}function yf(){if(vo)return vo;let n=null;try{n=sessionStorage.getItem(Bd),n||(n=`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`,sessionStorage.setItem(Bd,n))}catch{}return n||(n=`volatile-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`),vo=n,n}function vf(){return Gs||(Gs=new Promise((n,e)=>{if(typeof indexedDB>"u"){n(null);return}const t=indexedDB.open(Lb,Rb);t.onupgradeneeded=()=>{const i=t.result;i.objectStoreNames.contains(gr)||i.createObjectStore(gr,{keyPath:["sessionId","time"]})},t.onsuccess=()=>{n(t.result)},t.onerror=()=>{e(t.error||new Error("Failed to open temperature history database."))}}),Gs)}async function ty(){try{const n=await vf();if(!n)return[];const e=yf();return await new Promise((t,i)=>{const s=n.transaction(gr,"readonly").objectStore(gr),o=IDBKeyRange.bound([e,0],[e,Number.MAX_SAFE_INTEGER]),c=s.getAll(o);c.onsuccess=()=>{const l=(c.result||[]).map(d=>bf(d)).filter(Boolean).sort((d,f)=>d.time-f.time);t(l)},c.onerror=()=>{i(c.error||new Error("Failed to read temperature history."))}})}catch(n){return ke.debug("Temperature history load failed.",{error:n?.message||String(n)}),[]}}async function ny(n){const e=bf(n);if(e)try{const t=await vf();if(!t)return;const i=yf();await new Promise((r,s)=>{const o=t.transaction(gr,"readwrite");o.objectStore(gr).put({sessionId:i,...e}),o.oncomplete=()=>r(),o.onerror=()=>s(o.error||new Error("Failed to persist temperature sample.")),o.onabort=()=>s(o.error||new Error("Temperature sample transaction aborted."))})}catch(t){ke.debug("Temperature history persist failed.",{error:t?.message||String(t)})}}async function iy(){const n=await ty();if(!n.length)return;a.temperatures.history=n;const e=n[n.length-1];a.temperatures.hotend.current=e.hotendCurrent,a.temperatures.hotend.target=e.hotendTarget,a.temperatures.bed.current=e.bedCurrent,a.temperatures.bed.target=e.bedTarget}const vc=[],ks=vc[vc.length-1]||null;function Qc(){return{systemInfo:null,procStats:null,mcuStatus:null,systemStats:null,klipperVersion:"",lastError:"",lastUpdatedMs:null}}function Sf(){return{busy:!1,versionInfo:{},githubRateLimit:null,githubRequestsRemaining:null,githubLimitResetTime:null,lastError:"",statusMessage:"",actionInFlight:!1,activeActionLabel:"",lastUpdatedMs:null,activityLog:[]}}function el(){return{values:{},queryInFlight:!1,lastError:"",lastUpdatedMs:null}}function tl(){return{files:[],isLoading:!1,actionInFlight:!1,lastError:"",lastUpdatedMs:null}}function ry(){return{files:[],directories:[],isLoading:!1,actionInFlight:!1,actionLabel:"",activePath:"",lastError:"",lastUpdatedMs:null,searchQuery:Yb(),sortMode:Xb(),typeFilter:qb(),currentDirectory:Kb(),visibleColumns:Jb(),metadataByPath:new Map,metadataLoading:new Set,uploadDragDepth:0}}function sy(){return{isLoading:!1,loadingFile:"",activeFile:"",sourceLabel:"",sourceMode:"live",sourceTextLength:0,lastError:"",lastLoadedAtMs:null,parseRequestId:0,segments:[],extrudingSegmentIndices:[],bounds:null,extrusionCount:0,followToolhead:!0,showMirror:!0,showNozzle:!0,orbitWhenIdle:!1,toolhead:{x:null,y:null,z:null},simulationProgress:0,simulationPlaying:!1,simulationSpeed:1,simulationDurationMs:Sr,simulationLastTickMs:null,layerZValues:[],segmentLayerIndices:[],segmentExtrusionOrderInLayer:[],layerExtrusionCounts:[],layerExtrusionEndCounts:[],totalLayers:0,selectedLayerIndex:0,layerSelectionPinned:!1}}const a={client:null,connectionStatus:"disconnected",activeView:Hb(),moonrakerUrl:localStorage.getItem("moonraker_url")||"http://127.0.0.1:7125",config:{files:[],filteredFiles:[],selectedPath:Wb(),originalContent:"",draftContent:"",isDirty:!1,isLoadingFile:!1,fileTypeFilter:jb(),fileSearchQuery:$b()},configSearch:{query:"",caseSensitive:!1,wholeWord:!1,useRegex:!1,matches:[],activeIndex:-1,invalidRegex:!1},interface:{theme:jd("interface_theme","ocean",Ku),compact:Et("interface_compact",!1),density:jd("interface_density","comfortable",Ju),sidebarCollapsed:Et("interface_sidebar_collapsed",!1),machineSideCollapsed:Et(Zc,!1)},dashboard:{showPrintProgress:Et("dashboard_show_print_progress",!0),showTemperatures:Et("dashboard_show_temperatures",!0),showMotion:Et("dashboard_show_motion",!0),showQuickCommands:Et("dashboard_show_quick_commands",!0),showMacros:Et("dashboard_show_macros",!0),showMainCamera:Et("dashboard_show_main_camera",!0),showToolheadCamera:Et("dashboard_show_toolhead_camera",!0),showConsole:Et("dashboard_show_console",!0),showKlipperView:Et("dashboard_show_klipperview",!0),layout:ey()},camera:{enabled:Et("camera_enabled",!0),url:localStorage.getItem("camera_url")||"",renderMode:Wd("camera_render_mode",mn.IMAGE)},toolheadCamera:{enabled:Et("toolhead_camera_enabled",!1),url:localStorage.getItem("toolhead_camera_url")||"",renderMode:Wd("toolhead_camera_render_mode",mn.IMAGE)},temperatures:{hotend:{current:ks?.hotendCurrent??null,target:ks?.hotendTarget??0},bed:{current:ks?.bedCurrent??null,target:ks?.bedTarget??0},history:vc,chart:{show:Et("temperature_show_chart",!0),hideHostSensors:Et("temperature_hide_host_sensors",!1),hideMonitors:Et("temperature_hide_monitors",!1),autoscale:Et("temperature_autoscale_chart",!1),offsetMs:0,hoverIndex:null,layout:null}},machineLoads:Qc(),updateManager:Sf(),endstops:el(),logFiles:tl(),jobs:ry(),prettyGcode:sy(),console:{seenStoreEntryKeys:new Set,pendingCommandCounts:new Map,storeSyncFailed:!1,autoscroll:Et(hf,!0),filter:La(localStorage.getItem(ff)),searchQuery:"",hideTemps:Et(pf,!1),rawOutput:Et(mf,!1),paused:!1,pausedBuffer:[],history:oy(),historyIndex:0,historyDraft:"",helperEntries:sl(),helperLoading:!1,helperLoaded:!1},printStatus:{filename:"",thumbnailPath:"",metadataByFile:new Map,metadataRequestId:0,lastPrintStats:{},lastGcodeMove:{},lastFilamentUsed:null,lastVirtualSd:{},lastMotionReport:{},countdownTargetMs:null}};function ay(n=Date.now()){const e=Number(n);return(Number.isFinite(e)?new Date(e):new Date).toLocaleTimeString()}function oy(){try{const n=localStorage.getItem(uf);if(!n)return[];const e=JSON.parse(n);return Array.isArray(e)?e.map(t=>String(t||"").trim()).filter(t=>t.length>0).slice(-gf):[]}catch{return[]}}function La(n){const e=String(n||"all").trim().toLowerCase();return _b.includes(e)?e:"all"}function nl(n){return String(n||"").replace(/\r/g,"").split(`
`).map(e=>e.trimEnd()).filter(e=>e.trim().length>0)}function Ct(){return[{key:"main",log:u.consoleLog,form:u.consoleForm,input:u.consoleInput,clearButton:u.consoleClear,helperToggle:u.consoleHelperToggle,settingsToggle:u.consoleSettingsToggle,helperPanel:u.consoleHelperPanel,settingsPanel:u.consoleSettingsPanel,hideTempsInput:u.consoleHideTemps,rawOutputInput:u.consoleRawOutput,pauseButton:u.consolePause,autoscrollInput:u.consoleAutoscroll,filterSelect:u.consoleFilter,searchInput:u.consoleSearch,meta:u.consoleMeta,helperGrid:u.consoleHelperGrid},{key:"dashboard",log:u.dashboardConsoleLog,form:u.dashboardConsoleForm,input:u.dashboardConsoleInput,clearButton:u.dashboardConsoleClear,helperToggle:u.dashboardConsoleHelperToggle,settingsToggle:u.dashboardConsoleSettingsToggle,helperPanel:u.dashboardConsoleHelperPanel,settingsPanel:u.dashboardConsoleSettingsPanel,hideTempsInput:u.dashboardConsoleHideTemps,rawOutputInput:u.dashboardConsoleRawOutput,pauseButton:u.dashboardConsolePause,autoscrollInput:u.dashboardConsoleAutoscroll,filterSelect:u.dashboardConsoleFilter,searchInput:u.dashboardConsoleSearch,meta:u.dashboardConsoleMeta,helperGrid:u.dashboardConsoleHelperGrid}]}function Ef(n="main"){return Ct().find(e=>e.key===n)||null}function Mf(){return Ct().map(n=>n.input).filter(n=>n instanceof HTMLInputElement)}function Tf(n=null){if(n instanceof HTMLInputElement)return n;const e=Mf();return e.find(i=>i===document.activeElement)||e[0]||null}function Sc(n){Mf().forEach(e=>{e.value=n})}function Ec(n,e=null){const t=Tf(e);return Sc(String(n||"")),t}function cy(){return Ct().find(e=>e.log)?.log||null}function ly(n){const e=String(n||"").trim();return e?!!(/^(?:ok\s+)?(?:T\d*:|T:|B:|C:|P:)/i.test(e)||/\bT\d*:\s*-?\d/i.test(e)||/\bB:\s*-?\d/i.test(e)):!1}function dy(){Ct().forEach(n=>{const e=n.log;if(e)for(;e.children.length>fb;)e.removeChild(e.firstElementChild)})}function uy(n,e,t=""){const i=String(t||"").trim().toLowerCase();if(["command","response","error","system"].includes(i))return i;const r=String(e||"").trim().toUpperCase(),s=df.has(n)?n:"info";return r==="COMMAND"?"command":r==="RESPONSE"?"response":r==="ERROR"||s==="error"?"error":"system"}function fy(n){if(!n)return!1;const e=La(a.console.filter);if(e!=="all"&&n.dataset.consoleType!==e)return!1;if(a.console.hideTemps&&n.dataset.consoleType==="response"){const i=n.dataset.consoleMessage||n.textContent||"";if(ly(i))return!1}const t=String(a.console.searchQuery||"").trim().toLowerCase();return t?String(n.textContent||"").toLowerCase().includes(t):!0}function ci(){const n=cy();if(!n)return;const e=n.children.length;let t=0;[...n.children].forEach(o=>{o.hidden||(t+=1)});const i=a.console.pausedBuffer.length,r=[`${t}/${e} visible`];i>0&&r.push(`${i} buffered`),a.console.paused&&r.push("paused");const s=`${r.join(" | ")} lines`;Ct().forEach(o=>{if(o.meta&&(o.meta.textContent=s),o.pauseButton){o.pauseButton.dataset.paused=a.console.paused?"true":"false",o.pauseButton.setAttribute("aria-pressed",String(a.console.paused));const c=i>0?` (${i})`:"";o.pauseButton.textContent=a.console.paused?`Resume${c}`:"Pause"}})}function il(){Ct().forEach(n=>{n.log&&(n.log.scrollTop=n.log.scrollHeight)})}function Cf(n){n&&(n.hidden=!fy(n))}function rl(){Ct().forEach(n=>{const e=n.log;e&&[...e.children].forEach(t=>{Cf(t)})}),ci(),!a.console.paused&&a.console.autoscroll&&il()}function wf(n,e,{timestampMs:t=Date.now(),label:i=null,consoleType:r=null}={}){const s=df.has(e)?e:"info",o=String(i||s).trim().toUpperCase()||s.toUpperCase(),c=uy(s,o,r),l=document.createElement("div");return l.className=`console-line console-line-${s}`,l.dataset.consoleType=c,l.dataset.consoleLevel=s,l.dataset.consoleLabel=o,l.dataset.consoleMessage=String(n||""),l.textContent=`[${ay(t)}] [${o}] ${n}`,l}function Af(n){if(!n)return;const e=Ct().map(t=>t.log).filter(t=>!!t);e.length&&(e.forEach((t,i)=>{const r=i===0?n:n.cloneNode(!0);Cf(r),t.appendChild(r)}),dy(),ci(),a.console.autoscroll&&!a.console.paused&&il())}function hy(){if(!a.console.pausedBuffer.length){ci();return}const n=[...a.console.pausedBuffer];a.console.pausedBuffer.length=0,n.forEach(e=>{const t=wf(e.message,e.level,e);Af(t)})}function py(n){const e=!!n;a.console.paused!==e&&(a.console.paused=e,e||hy(),ci())}function my(n){a.console.autoscroll=!!n,localStorage.setItem(hf,String(a.console.autoscroll)),Ct().forEach(e=>{e.autoscrollInput&&(e.autoscrollInput.checked=a.console.autoscroll)}),!a.console.paused&&a.console.autoscroll&&il(),ci()}function gy(n){a.console.filter=La(n),localStorage.setItem(ff,a.console.filter),Ct().forEach(e=>{e.filterSelect&&(e.filterSelect.value=a.console.filter)}),rl()}function xy(n){a.console.searchQuery=String(n||"").trim(),Ct().forEach(e=>{e.searchInput&&(e.searchInput.value=a.console.searchQuery)}),rl()}function dr(){Ct().forEach(n=>{n.helperPanel&&(n.helperPanel.hidden=!0),n.settingsPanel&&(n.settingsPanel.hidden=!0),n.helperToggle&&n.helperToggle.setAttribute("aria-expanded","false"),n.settingsToggle&&n.settingsToggle.setAttribute("aria-expanded","false")})}function _y(n="main"){const e=Ef(n);if(!e?.helperPanel)return;const t=e.helperPanel.hidden;dr(),t&&(e.helperPanel.hidden=!1,e.helperToggle&&e.helperToggle.setAttribute("aria-expanded","true"))}function by(n="main"){const e=Ef(n);if(!e?.settingsPanel)return;const t=e.settingsPanel.hidden;dr(),t&&(e.settingsPanel.hidden=!1,e.settingsToggle&&e.settingsToggle.setAttribute("aria-expanded","true"))}function yy(n){a.console.hideTemps=!!n,localStorage.setItem(pf,String(a.console.hideTemps)),Ct().forEach(e=>{e.hideTempsInput&&(e.hideTempsInput.checked=a.console.hideTemps)}),rl()}function vy(n){a.console.rawOutput=!!n,localStorage.setItem(mf,String(a.console.rawOutput)),Ct().forEach(e=>{e.rawOutputInput&&(e.rawOutputInput.checked=a.console.rawOutput)})}function sl(){const n=[...bb,...yb],e=new Set;return n.forEach(t=>{const i=String(t||"").trim().toUpperCase();i&&e.add(i)}),[...e].sort((t,i)=>t.localeCompare(i)).map(t=>({command:t,description:""}))}function Sy(n){const e=new Map;return sl().forEach(t=>{e.set(t.command,t)}),(Array.isArray(n)?n:[]).forEach(t=>{const i=String(t?.command||"").trim().toUpperCase();if(!i)return;const r=e.get(i),s=String(t?.description||"").trim()||r?.description||"";e.set(i,{command:i,description:s})}),[...e.values()].sort((t,i)=>t.command.localeCompare(i.command))}function sa(){const n=Ct().map(t=>t.helperGrid).filter(t=>!!t);if(!n.length)return;const e=Array.isArray(a.console.helperEntries)?a.console.helperEntries:[];n.forEach(t=>{if(t.innerHTML="",a.console.helperLoading){const r=document.createElement("p");r.className="muted",r.textContent="Loading commands from Moonraker...",t.appendChild(r);return}if(!e.length){const r=document.createElement("p");r.className="muted",r.textContent="No helper commands available.",t.appendChild(r);return}const i=document.createDocumentFragment();e.forEach(r=>{const s=String(r?.command||"").trim();if(!s)return;const o=document.createElement("button");o.type="button",o.dataset.consoleHelper=s;const c=document.createElement("span");c.className="console-helper-command",c.textContent=s,o.appendChild(c);const l=String(r?.description||"").trim();if(l){const d=document.createElement("span");d.className="console-helper-description",d.textContent=l,o.appendChild(d)}l?o.title=`${s} - ${l}`:o.title=s,i.appendChild(o)}),t.appendChild(i)})}function Ey(n){const e=n?.result??n??{};let t=e;e&&typeof e=="object"&&(e.commands&&typeof e.commands=="object"?t=e.commands:e.gcode_help&&typeof e.gcode_help=="object"?t=e.gcode_help:e.help&&typeof e.help=="object"&&(t=e.help));const i=[];Array.isArray(t)?t.forEach(o=>{if(typeof o=="string"){const c=o.trim();c&&i.push({command:c,description:""});return}if(o&&typeof o=="object"){const c=String(o.command||o.name||o.cmd||"").trim();if(!c)return;const l=String(o.description||o.help||o.desc||"").trim();i.push({command:c,description:l})}}):t&&typeof t=="object"&&Object.entries(t).forEach(([o,c])=>{const l=String(o||"").trim();if(!l)return;let d="";typeof c=="string"?d=c.trim():c&&typeof c=="object"&&(d=String(c.help||c.description||c.desc||"").trim()),i.push({command:l,description:d})});const r=[],s=new Set;return i.forEach(o=>{const c=String(o.command||"").trim().toUpperCase();!c||s.has(c)||(s.add(c),r.push({command:c,description:String(o.description||"").trim()}))}),r.sort((o,c)=>o.command.localeCompare(c.command)),r}async function My(){if(!a.client){sa();return}a.console.helperLoading=!0,sa();try{const n=await a.client.call("/printer/gcode/help"),e=Ey(n);a.console.helperEntries=Sy(e),a.console.helperLoaded=!0}catch(n){const e=n?.message||String(n);a.console.helperLoaded||(a.console.helperEntries=sl()),pe(`Console helper load failed: ${e}`,"warn",{consoleType:"system",label:"SYSTEM"}),ke.debug("Console helper load failed.",{error:e})}finally{a.console.helperLoading=!1,sa()}}function $d(){Ct().forEach(n=>{n.log&&(n.log.innerHTML="")}),a.console.pausedBuffer.length=0,ci()}function Ty(){localStorage.setItem(uf,JSON.stringify(a.console.history))}function Wr(){a.console.historyIndex=a.console.history.length,a.console.historyDraft=""}function Cy(n){const e=String(n||"").trim();if(e){for(a.console.history=a.console.history.filter(t=>t!==e),a.console.history.push(e);a.console.history.length>gf;)a.console.history.shift();Ty(),Wr()}}function Xd(n,e=null){const t=a.console.history,i=Tf(e);if(!(!t.length||!i)){if(typeof a.console.historyIndex!="number"&&(a.console.historyIndex=t.length),n<0?(a.console.historyIndex===t.length&&(a.console.historyDraft=i.value),a.console.historyIndex=Math.max(0,a.console.historyIndex-1)):n>0&&(a.console.historyIndex=Math.min(t.length,a.console.historyIndex+1)),a.console.historyIndex>=t.length){Ec(a.console.historyDraft,i);return}if(Ec(t[a.console.historyIndex]||"",i),typeof i.setSelectionRange=="function"){const r=i.value.length;i.setSelectionRange(r,r)}}}function pe(n,e="info",{timestampMs:t=Date.now(),label:i=null,consoleType:r=null}={}){const s=String(n??"");if(!s.trim())return;const o={message:s,level:e,timestampMs:t,label:i,consoleType:r};if(a.console.paused){for(a.console.pausedBuffer.push(o);a.console.pausedBuffer.length>xb;)a.console.pausedBuffer.shift();ci();return}const c=wf(s,e,{timestampMs:t,label:i,consoleType:r});Af(c)}function Lf(n){return String(n||"").trim().replace(/\s+/g," ").toUpperCase()}function wy(n){const e=Lf(n);if(!e)return;const t=a.console.pendingCommandCounts.get(e)||0;for(a.console.pendingCommandCounts.set(e,t+1);a.console.pendingCommandCounts.size>gb;){const i=a.console.pendingCommandCounts.keys().next().value;if(!i)break;a.console.pendingCommandCounts.delete(i)}}function Ay(n){const e=Lf(n);if(!e)return!1;const t=a.console.pendingCommandCounts.get(e)||0;return t?(t<=1?a.console.pendingCommandCounts.delete(e):a.console.pendingCommandCounts.set(e,t-1),!0):!1}function Ly(n){nl(n).forEach(t=>{wy(t),pe(t,"info",{label:"COMMAND",consoleType:"command"})})}function Rf(n){return String(n||"").trim().toLowerCase()}function Ry(n,e){return e==="command"?"command":e==="response"?"response":e==="warn"||e==="warning"?"system":e==="error"||n.startsWith("!!")||/^error/i.test(n)?"error":n.startsWith("//")||/^ok/i.test(n)?"response":"command"}function Py(n){return n==="error"?{level:"error",label:"ERROR",consoleType:"error"}:n==="response"?{level:"info",label:"RESPONSE",consoleType:"response"}:n==="command"?{level:"info",label:"COMMAND",consoleType:"command"}:{level:"info",label:"SYSTEM",consoleType:"system"}}function Iy(n){for(a.console.seenStoreEntryKeys.add(n);a.console.seenStoreEntryKeys.size>mb;){const e=a.console.seenStoreEntryKeys.keys().next().value;if(!e)break;a.console.seenStoreEntryKeys.delete(e)}}function Dy(n,e,t=""){const i=Number(n?.time),r=t||Rf(n?.type)||"log";return`${Number.isFinite(i)?i:0}|${r}|${e}`}function Pf(n){if(!Array.isArray(n)||!n.length)return;[...n].sort((t,i)=>(Number(t?.time)||0)-(Number(i?.time)||0)).forEach(t=>{const i=Rf(t?.type),r=nl(t?.message||"");if(!r.length)return;const s=Number.isFinite(Number(t?.time))?Number(t.time)*1e3:Date.now();r.forEach(o=>{const c=Ry(o,i),l=Dy(t,o,c);if(a.console.seenStoreEntryKeys.has(l)||(Iy(l),c==="command"&&Ay(o)))return;const d=Py(c);pe(o,d.level,{timestampMs:s,label:d.label,consoleType:d.consoleType})})})}function Fy(n){if(!n||!Array.isArray(n.params))return[];const e=[];return n.params.forEach(t=>{if(t){if(Array.isArray(t)){t.forEach(i=>{i&&typeof i=="object"&&e.push(i)});return}if(Array.isArray(t.gcode_store)){t.gcode_store.forEach(i=>{i&&typeof i=="object"&&e.push(i)});return}typeof t=="object"&&("message"in t||"type"in t)&&e.push(t)}}),e}async function Ny(){if(a.client)try{const e=(await a.client.call(`/server/gcode_store?count=${hb}`))?.result?.gcode_store;Array.isArray(e)&&Pf(e),a.console.storeSyncFailed=!1}catch(n){const e=n?.message||String(n);a.console.storeSyncFailed||pe(`Console sync failed: ${e}`,"warn",{consoleType:"system"}),a.console.storeSyncFailed=!0,ke.debug("Console store sync failed.",{error:e})}}function aa(){ia&&(clearInterval(ia),ia=null)}function Uy(){if(aa(),!a.client)return;let n=!1;const e=async()=>{if(!(n||!a.client)){n=!0;try{await Ny()}finally{n=!1}}};e(),ia=setInterval(()=>{e()},pb)}function qd(){a.console.seenStoreEntryKeys.clear(),a.console.pendingCommandCounts.clear(),a.console.storeSyncFailed=!1}function Oy(){if(!u.sidebarToggle)return;const n=a.interface.sidebarCollapsed;u.sidebarToggle.dataset.state=n?"collapsed":"expanded",u.sidebarToggle.setAttribute("aria-expanded",String(!n)),u.sidebarToggle.setAttribute("aria-label",n?"Expand sidebar":"Collapse sidebar"),u.sidebarToggle.setAttribute("title",n?"Expand sidebar":"Collapse sidebar")}function By(){if(!u.machineSideToggle)return;const n=!!a.interface.machineSideCollapsed;u.machineSideToggle.dataset.state=n?"collapsed":"expanded",u.machineSideToggle.setAttribute("aria-expanded",String(!n));const e=n?"Expand right column":"Collapse right column";u.machineSideToggle.setAttribute("aria-label",e),u.machineSideToggle.setAttribute("title",e)}function Ra(){document.documentElement.dataset.theme=a.interface.theme,document.documentElement.dataset.density=a.interface.density,document.body.classList.toggle("compact-mode",a.interface.compact),document.body.classList.toggle("sidebar-collapsed",a.interface.sidebarCollapsed),u.machineLayout?.classList.toggle("machine-side-collapsed",!!a.interface.machineSideCollapsed),Oy(),By()}function mt(){return!u.prettyGcodeCard||!u.prettyGcodeCanvas||u.prettyGcodeCard.classList.contains("card-hidden")?!1:a.activeView==="pretty-gcode"||a.activeView==="dashboard"}function If(){if(!u.prettyGcodeCard)return;if(a.activeView==="pretty-gcode"){u.prettyGcodeView&&u.prettyGcodeCard.parentElement!==u.prettyGcodeView&&u.prettyGcodeView.appendChild(u.prettyGcodeCard);return}const e=(a.dashboard.layout?.left||[]).includes(Li)?u.dashboardColLeft:u.dashboardColRight;e&&u.prettyGcodeCard.parentElement!==e&&e.appendChild(u.prettyGcodeCard)}function al(){if(!u.dashboardColLeft||!u.dashboardColRight)return;a.dashboard.layout=oi(a.dashboard.layout);const n=a.activeView==="pretty-gcode",e=document.createDocumentFragment();a.dashboard.layout.left.forEach(i=>{if(n&&i===Li)return;const r=document.getElementById(i);r&&e.appendChild(r)});const t=document.createDocumentFragment();a.dashboard.layout.right.forEach(i=>{if(n&&i===Li)return;const r=document.getElementById(i);r&&t.appendChild(r)}),u.dashboardColLeft.appendChild(e),u.dashboardColRight.appendChild(t),If()}function ol(){[[u.cardPrintProgress,a.dashboard.showPrintProgress],[u.cardTemperatures,a.dashboard.showTemperatures],[u.cardMotion,a.dashboard.showMotion],[u.cardQuickCommands,a.dashboard.showQuickCommands],[u.cardMacros,a.dashboard.showMacros],[u.cardMainCamera,a.dashboard.showMainCamera],[u.cardToolheadCamera,a.dashboard.showToolheadCamera],[u.cardDashboardConsole,a.dashboard.showConsole],[u.prettyGcodeCard,a.dashboard.showKlipperView]].forEach(([e,t])=>{e&&e.classList.toggle("card-hidden",!t)})}function Gy(){[u.dashboardLayoutLeft,u.dashboardLayoutRight].forEach(n=>{n&&(n.classList.remove("drop-target"),n.querySelectorAll(".drop-target").forEach(e=>e.classList.remove("drop-target")))})}function ky(n){a.dashboard.layout.left=a.dashboard.layout.left.filter(e=>e!==n),a.dashboard.layout.right=a.dashboard.layout.right.filter(e=>e!==n)}function So(n,e,t=null){if(!n||e!=="left"&&e!=="right")return;ky(n);const i=a.dashboard.layout[e];if(t){const r=i.indexOf(t);r>=0?i.splice(r,0,n):i.push(n)}else i.push(n);a.dashboard.layout=oi(a.dashboard.layout)}function Yd(n){if(_a)return _a;const e=n.dataTransfer?.getData("text/plain")||"",[t]=e.split("|");return Jc.includes(t)?t:null}function Kd(n,e){if(!e)return;e.innerHTML="",(a.dashboard.layout[n]||[]).forEach(i=>{const r=document.createElement("li");r.className="layout-item",r.draggable=!0,r.dataset.cardId=i,r.dataset.column=n;const s=document.createElement("span");s.className="layout-handle",s.textContent="::";const o=document.createElement("span");o.className="layout-item-label",o.textContent=cb[i]||i;const c=document.createElement("button");c.type="button",c.className="layout-move-column",c.textContent=n==="left"?"->":"<-",c.title=n==="left"?"Move to right column":"Move to left column",c.setAttribute("aria-label",c.title),c.addEventListener("click",d=>{d.preventDefault(),d.stopPropagation(),So(i,n==="left"?"right":"left"),jr()});const l=document.createElement("div");l.className="layout-item-controls",l.appendChild(c),r.append(s,o,l),r.addEventListener("dragstart",d=>{_a=i,r.classList.add("dragging"),d.dataTransfer&&(d.dataTransfer.effectAllowed="move",d.dataTransfer.setData("text/plain",`${i}|${n}`))}),r.addEventListener("dragend",()=>{r.classList.remove("dragging"),_a=null,Gy()}),r.addEventListener("dragover",d=>{d.preventDefault(),r.classList.add("drop-target"),e.classList.add("drop-target"),d.dataTransfer&&(d.dataTransfer.dropEffect="move")}),r.addEventListener("dragleave",()=>{r.classList.remove("drop-target")}),r.addEventListener("drop",d=>{d.preventDefault(),d.stopPropagation(),r.classList.remove("drop-target"),e.classList.remove("drop-target");const f=Yd(d);f&&(So(f,n,i),jr())}),e.appendChild(r)}),e.ondragover=i=>{i.preventDefault(),e.classList.add("drop-target"),i.dataTransfer&&(i.dataTransfer.dropEffect="move")},e.ondragleave=i=>{i.target===e&&e.classList.remove("drop-target")},e.ondrop=i=>{i.preventDefault(),e.classList.remove("drop-target");const r=Yd(i);r&&(So(r,n),jr())}}function jr(){Kd("left",u.dashboardLayoutLeft),Kd("right",u.dashboardLayoutRight)}function zy(){jr(),typeof u.dashboardLayoutDialog?.showModal=="function"&&u.dashboardLayoutDialog.showModal()}function Mc(){u.dashboardLayoutDialog?.open&&u.dashboardLayoutDialog.close()}function Vy(){a.dashboard.layout=oi(a.dashboard.layout),localStorage.setItem("dashboard_layout",JSON.stringify(a.dashboard.layout)),localStorage.setItem("dashboard_layout_order",JSON.stringify(_f(a.dashboard.layout))),al(),ol(),Mc(),pe("Dashboard layout saved.")}function Hy(){a.dashboard.layout=oi(Zu),jr()}function Wy(){a.interface.sidebarCollapsed=!a.interface.sidebarCollapsed,localStorage.setItem("interface_sidebar_collapsed",String(a.interface.sidebarCollapsed)),Ra()}function jy(){a.interface.machineSideCollapsed=!a.interface.machineSideCollapsed,localStorage.setItem(Zc,String(a.interface.machineSideCollapsed)),Ra()}function Df(n){const e=String(n||"").trim().toLowerCase();return e?["standby","ready","idle","operational"].includes(e)?"ready":e==="printing"?"printing":e==="paused"?"paused":["complete","completed"].includes(e)?"complete":["cancelled","canceled"].includes(e)?"cancelled":["error","shutdown"].includes(e)?"error":["disconnected","offline"].includes(e)?"disconnected":e==="connecting"?"connecting":"unknown":"unknown"}function ba(n){if(a.connectionStatus=String(n||"").trim().toLowerCase(),u.connectionPill.textContent=n,n==="connected"){u.connectionPill.style.borderColor="rgba(34, 197, 94, 0.7)",u.connectionText.textContent=a.moonrakerUrl;const e=u.printerState.dataset.state||"unknown";["unknown","connecting","disconnected","error"].includes(e)&&rr("ready")}else Of(null),u.connectionPill.style.borderColor="rgba(148, 163, 184, 0.22)",n==="connecting"&&rr("connecting"),n==="disconnected"&&rr("disconnected"),n==="error"&&rr("error");mt()&&et()}function rr(n){const e=Df(n),t=_c[e]||_c.unknown;u.printerState.dataset.state=e,u.printerState.textContent=t.label,u.printerDot.style.background=t.color,yl()}function $y(n){const e=typeof n=="string"?n.trim():"",t=e||"No active file";a.printStatus.filename=e,u.statusFileName&&(u.statusFileName.textContent=t,u.statusFileName.title=t)}function Xy(n){return String(n||"").split("/").filter(e=>e.length>0).map(e=>encodeURIComponent(e)).join("/")}function Ff(n){if(!n)return"";const e=Xy(n);return`${a.moonrakerUrl}/server/files/gcodes/${e}`}function sr(n){if(a.printStatus.thumbnailPath=n||"",!(!u.statusFileThumbWrap||!u.statusFileThumb)){if(!n){u.statusFileThumbWrap.hidden=!0,u.statusFileThumb.removeAttribute("src");return}u.statusFileThumb.src=Ff(n),u.statusFileThumbWrap.hidden=!1}}function cl(n){if(!Number.isFinite(n)||n<=0)return"--:--:--";const e=Math.max(0,Math.round(n)),t=Math.floor(e/3600),i=Math.floor(e%3600/60),r=e%60;return`${String(t).padStart(2,"0")}:${String(i).padStart(2,"0")}:${String(r).padStart(2,"0")}`}function qy(n){return!Number.isFinite(n)||n<0?"--:--":new Date(Date.now()+Math.round(n*1e3)).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",hour12:!1})}function Nf(){Hr&&(clearInterval(Hr),Hr=null)}function Uf(){if(!u.statusTimeLeft)return;const n=Number(a.printStatus.countdownTargetMs);if(!Number.isFinite(n)){u.statusTimeLeft.textContent="--:--:--";return}const e=Math.max((n-Date.now())/1e3,0);u.statusTimeLeft.textContent=cl(e),e<=0&&Nf()}function Yy(){Hr||(Hr=setInterval(Uf,1e3))}function Of(n){if(u.statusTimeLeft){if(!Number.isFinite(n)||n<0){a.printStatus.countdownTargetMs=null,u.statusTimeLeft.textContent="--:--:--",Nf();return}a.printStatus.countdownTargetMs=Date.now()+Math.round(n*1e3),Uf(),Yy()}}function Bf(n){const e=Number(n?.print_duration);if(Number.isFinite(e)&&e>=0)return e;const t=Number(n?.total_duration);return Number.isFinite(t)&&t>=0?t:0}function ll(n){const e=typeof n=="string"?n.trim():"";if(!e)return null;const t=a.printStatus.metadataByFile.get(e);return t&&typeof t=="object"?t:null}function Ky(n){const e=ll(a.printStatus.filename),t=Number(e?.estimatedTime);if(Number.isFinite(t)&&t>0)return t;const i=Number(a.printStatus.lastVirtualSd?.progress),r=Bf(n);return Number.isFinite(i)&&i>0&&r>0?r/i:null}function oa(n){if(!u.statusEtp||!u.statusFinish)return;const e=Ky(n),t=Bf(n),i=Number.isFinite(e)?Math.max(e-t,0):null;u.statusEtp.textContent=cl(e),u.statusFinish.textContent=qy(i),Of(i)}function Tc(n){const e=n&&typeof n=="object"?n:{},i={...a.printStatus.lastVirtualSd||{},...e};return a.printStatus.lastVirtualSd=i,i}function Cc(n){const e=Number(n?.progress),t=Number.isFinite(e)?Math.max(0,Math.min(100,Math.round(e*100))):0;u.progressBar&&(u.progressBar.style.width=`${t}%`),u.progressText&&(u.progressText.textContent=`${t}%`)}function Jd(n){const e=Number(n);return!Number.isFinite(e)||e<0?"--":`${Math.round(e)}`}function An(n){const e=Number(n);return Number.isFinite(e)?e:null}function on(n){const e=An(n);return!Number.isFinite(e)||e<=0?null:e}function Jy(){const n=a.printStatus.lastGcodeMove?.gcode_position,e=a.printStatus.lastGcodeMove?.position,t=[Array.isArray(n)?n[2]:null,Array.isArray(e)?e[2]:null,a.printStatus.lastGcodeMove?.gcode_z,a.printStatus.lastGcodeMove?.position_z];for(const i of t){const r=An(i);if(Number.isFinite(r)&&r>=0)return r}return null}function Zy(n,e){const t=on(e?.layerHeight);if(!Number.isFinite(t))return null;const i=on(e?.firstLayerHeight)??t,r=Jy();if(!Number.isFinite(r))return null;let s=1;return r>i+t*.5&&(s=1+Math.round((r-i)/t)),!Number.isFinite(s)||s<1?null:Number.isFinite(n)&&n>0?Math.min(s,n):s}function Qy(n){const e=An(a.printStatus.lastVirtualSd?.progress);if(!Number.isFinite(e)||e<=0||!Number.isFinite(n)||n<=0)return null;const t=Math.max(0,Math.min(1,e)),i=Math.max(1,Math.round(t*n));return Math.min(i,n)}function ca(n){if(!u.statusLayer)return;const e=ll(a.printStatus.filename),t=An(n?.info?.current_layer??n?.current_layer),i=on(n?.info?.total_layer??n?.total_layer),r=on(e?.totalLayers),s=i??r,o=t??Zy(s,e)??Qy(s);u.statusLayer.textContent=`Layer: ${Jd(o)}/${Jd(s)}`}function ev(n){const e=n&&typeof n=="object"?n:{},t=a.printStatus.lastPrintStats||{},i={...t,...e},r=t?.info&&typeof t.info=="object"?t.info:{},s=e?.info&&typeof e.info=="object"?e.info:{};return(Object.keys(r).length||Object.keys(s).length)&&(i.info={...r,...s}),a.printStatus.lastPrintStats=i,i}function tv(n){oa(n)}function nv(n){return!Number.isFinite(n)||n<0?"--%":`${Math.round(n*100)}%`}function iv(n){return!Number.isFinite(n)||n<0?"--":n>=1e3?`${(n/1e3).toFixed(2)} m`:`${Math.round(n)} mm`}function rv(n){return!Number.isFinite(n)||n<0?"-- mm/s":n>=100?`${Math.round(n)} mm/s`:`${n.toFixed(1)} mm/s`}function sv(n,e=null,t=null){e&&typeof e=="object"&&(a.printStatus.lastGcodeMove={...a.printStatus.lastGcodeMove,...e}),t&&typeof t=="object"&&(a.printStatus.lastMotionReport={...a.printStatus.lastMotionReport,...t});const i=Number(a.printStatus.lastMotionReport?.live_velocity),r=Number(a.printStatus.lastGcodeMove?.speed),s=Number.isFinite(i)&&i>=0?i:r,o=Number(a.printStatus.lastGcodeMove?.extrude_factor),c=Number(n?.filament_used);Number.isFinite(c)&&c>=0&&(a.printStatus.lastFilamentUsed=c),u.statusSpeed&&(u.statusSpeed.textContent=rv(s)),u.statusFlowrate&&(u.statusFlowrate.textContent=nv(o)),u.statusFilament&&(u.statusFilament.textContent=iv(a.printStatus.lastFilamentUsed))}function Gf(n){const e=Array.isArray(n?.thumbnails)?n.thumbnails:[];if(!e.length)return"";const t=e.filter(r=>typeof r?.relative_path=="string"&&r.relative_path);return t.length&&t.map(r=>{const s=Number(r.width),o=Number.isFinite(s)?Math.abs(s-96):9999;return{thumb:r,delta:o}}).sort((r,s)=>r.delta-s.delta)[0]?.thumb?.relative_path||""}async function av(n){const e=typeof n=="string"?n.trim():"";if(!e||!a.client){sr("");return}if(a.printStatus.metadataByFile.has(e)){const i=ll(e);sr(i?.thumbnailPath||""),oa(a.printStatus.lastPrintStats),ca(a.printStatus.lastPrintStats);return}const t=++a.printStatus.metadataRequestId;try{const r=(await a.client.call(`/server/files/metadata?filename=${encodeURIComponent(e)}`))?.result||{},s=Gf(r),o=Number(r.estimated_time),c=Number(r.layer_count),l={thumbnailPath:s,estimatedTime:Number.isFinite(o)&&o>0?o:null,totalLayers:Number.isFinite(c)&&c>0?Math.round(c):null,layerHeight:on(r.layer_height),firstLayerHeight:on(r.first_layer_height)};if(a.printStatus.metadataByFile.set(e,l),t!==a.printStatus.metadataRequestId||a.printStatus.filename!==e)return;sr(l.thumbnailPath||""),oa(a.printStatus.lastPrintStats),ca(a.printStatus.lastPrintStats)}catch(i){const r=i?.message||String(i);if(ke.debug("Print file metadata load skipped.",{filename:e,error:r}),a.printStatus.metadataByFile.set(e,{thumbnailPath:"",estimatedTime:null,totalLayers:null,layerHeight:null,firstLayerHeight:null}),t!==a.printStatus.metadataRequestId||a.printStatus.filename!==e)return;sr(""),oa(a.printStatus.lastPrintStats),ca(a.printStatus.lastPrintStats)}}function wc(n,e=null,t=null){const i=ev(n),r=typeof i.filename=="string"?i.filename:"",s=r.trim(),o=bn();if($y(r),tv(i),sv(i,e,t),ca(i),yl(),o||tn({skipRender:!mt()}),a.activeView==="files"&&rh(),!s){sr(""),!o&&a.prettyGcode.activeFile?Ri(""):mt()&&et();return}a.printStatus.metadataByFile.has(s)||sr(""),av(s),!o&&(mt()||a.prettyGcode.activeFile)&&Ri(s)}function kf(n){xf(n)&&(u.navItems.forEach(e=>e.classList.toggle("active",e.dataset.view===n)),u.views.forEach(e=>e.classList.toggle("active",e.id===`view-${n}`)),u.pageTitle.textContent=Qu[n]||n.slice(0,1).toUpperCase()+n.slice(1),a.activeView=n,If(),localStorage.setItem(ef,n),mt()&&et())}function ov(n){const e=n[0],t=n[1]==="+",i=e==="Z"?1:10,r=t?i:-i;return`G91
G0 ${e}${r} F6000
G90`}function Ac(n,e,t){if(n.innerHTML="",!e.enabled){const r=document.createElement("p");r.className="muted",r.textContent=`${t} disabled in Settings.`,n.appendChild(r);return}if(!e.url){const r=document.createElement("p");r.className="muted",r.textContent=`Set ${t} URL in Settings.`,n.appendChild(r);return}if(e.renderMode===mn.IFRAME){const r=document.createElement("iframe");r.src=e.url,r.title=t,r.loading="lazy",n.appendChild(r);return}const i=document.createElement("img");i.src=e.url,i.alt=t,i.referrerPolicy="no-referrer",i.addEventListener("error",()=>{n.innerHTML=`<p class="muted">${t} failed to load.</p>`}),n.appendChild(i)}function zf(){Ac(u.mainCameraFrame,a.camera,"Main Camera"),Ac(u.toolheadCameraFrame,a.toolheadCamera,"Toolhead Cam");const n=a.camera.enabled&&!!a.camera.url,e=a.toolheadCamera.enabled&&!!a.toolheadCamera.url;u.mainCameraFullscreen.disabled=!n,u.toolheadCameraFullscreen.disabled=!e}function Zd(n){return typeof n!="number"||Number.isNaN(n)?"--.-°C":`${n.toFixed(1)}°C`}function zr(n){return typeof n!="number"||Number.isNaN(n)?"0":String(Math.round(Math.max(0,n)))}function Vf(n,e){const t=n==="hotend"?320:130,i=Number(e);return Number.isFinite(i)?Math.round(Math.max(0,Math.min(t,i))):null}function Qd(n,e){return!Number.isFinite(e)||e<=.5?"off":Number.isFinite(n)&&n<e-2?"heating":"on"}function la(){ea&&(clearInterval(ea),ea=null)}function cv(){if(la(),!a.client)return;let n=!1;const e=async()=>{if(!(!a.client||n)){n=!0;try{const i=(await a.client.call("/printer/objects/query?extruder&heater_bed&print_stats&virtual_sdcard&gcode_move&motion_report"))?.result?.status||{};Rc(i);const r=Tc(i?.virtual_sdcard||null);Cc(r),wc(i?.print_stats||{},i?.gcode_move||null,i?.motion_report||null)}catch(t){const i=t?.message||String(t);ke.debug("Status poll skipped.",{error:i})}finally{n=!1}}};e(),ea=setInterval(e,Eb)}function pt(n,e=null){const t=Number(n);return Number.isFinite(t)?t:e}function lv(n){const e=pt(n,null);return Number.isFinite(e)?e.toFixed(2):"--"}function zs(n){const e=pt(n,null);return!Number.isFinite(e)||e<0?"--":e>=1024*1024*1024?`${(e/(1024*1024*1024)).toFixed(1)} GB`:e>=1024*1024?`${(e/(1024*1024)).toFixed(1)} MB`:e>=1024?`${(e/1024).toFixed(1)} kB`:`${Math.round(e)} B`}function dv(n){const e=pt(n,null);return!Number.isFinite(e)||e<0?"--":e>=1024*1024?`${(e/(1024*1024)).toFixed(1)} MB/s`:e>=1024?`${(e/1024).toFixed(1)} kB/s`:`${e.toFixed(1)} B/s`}function Vs(n,{preferKiB:e=!1,allowHeuristic:t=!0}={}){const i=pt(n,null);return!Number.isFinite(i)||i<=0?null:e||t&&i<32*1024*1024?i*1024:i}function uv(n){const e=pt(n,null);return!Number.isFinite(e)||e<=0?"--":e>=1e6?`${Math.round(e/1e6)} MHz`:e>=1e3?`${Math.round(e/1e3)} kHz`:`${Math.round(e)} Hz`}function $r(n){if(typeof n=="string")return n.trim()||"";if(!n||typeof n!="object")return"";const e=[n.git_version,n.version,n.software_version];for(const t of e)if(typeof t=="string"&&t.trim())return t.trim();return""}function fv(n){const e=n?.last_stats&&typeof n.last_stats=="object"?n.last_stats:{};return{load:pt(e.mcu_task_avg??n?.mcu_task_avg,null),awake:pt(e.mcu_awake??n?.mcu_awake,null),freq:pt(e.freq??n?.freq,null)}}function hv(n){const e=Array.isArray(n?.ip_addresses)?n.ip_addresses:[];if(!e.length)return"--";const t=e.find(i=>String(i?.family||"").toLowerCase().includes("ipv4")&&!i?.is_link_local)||e.find(i=>!i?.is_link_local)||e[0];return String(t?.address||"").trim()||"--"}function Eo(n,e,t,i){const r=Number.isFinite(t)?Math.max(0,Math.min(100,t)):0;n&&n.style.setProperty("--gauge-value",r.toFixed(2)),e&&(e.textContent=i)}function Hs(n){if(!u.machineSystemStatus)return;const e=String(n||"").trim();u.machineSystemStatus.textContent=e,u.machineSystemStatus.hidden=!e}function si(){const n=a.machineLoads||Qc(),e=n.mcuStatus||{},t=n.systemStats||{},i=n.procStats||{},r=n.systemInfo||{},s=String(e?.name||"mcu").trim()||"mcu",o=String(e?.mcu_constants?.MCU||e?.mcu_constants?.MCU_TYPE||e?.mcu_type||"unknown").trim(),c=$r(e?.mcu_version)||$r(n.klipperVersion)||"--",l=fv(e),d=Number.isFinite(l.load)?l.load.toFixed(2):"--",f=Number.isFinite(l.awake)?l.awake.toFixed(2):"--",p=uv(l.freq);u.machineMcuName&&(u.machineMcuName.textContent=s),u.machineMcuChip&&(u.machineMcuChip.textContent=`(${o||"unknown"})`),u.machineMcuVersion&&(u.machineMcuVersion.textContent=`Version: ${c}`),u.machineMcuStats&&(u.machineMcuStats.textContent=`Load: ${d}, Awake: ${f}, Freq: ${p}`);const h=r?.cpu_info&&typeof r.cpu_info=="object"?r.cpu_info:{},m=r?.distribution&&typeof r.distribution=="object"?r.distribution:{},_=String(h.cpu_desc||h.arch||h.model||"").trim(),b=pt(h.bits??h.address_bits,null),x=[];_&&x.push(_),Number.isFinite(b)&&x.push(`${Math.round(b)}bit`);const g=x.length?`(${x.join(", ")})`:"(unknown)",w=$r(n.klipperVersion)||c,T=String(m.name||m.pretty_name||m.id||"").trim(),L=String(m.version||"").trim(),R=String(m.codename||"").trim(),M=T?`${T}${L?` ${L}`:""}${R?` (${R})`:""}`:"Unknown",A=pt(t?.sysload,null),F=pt(i?.cpu_temp??t?.cpu_temp,null);let E=pt(i?.system_cpu_usage?.cpu,null);!Number.isFinite(E)&&Number.isFinite(A)&&(E=Math.max(0,Math.min(100,A*100)));const v=Vs(h?.total_memory??h?.mem_total??i?.total_memory??i?.mem_total,{preferKiB:!1}),P=Vs(t?.memavail??i?.mem_available??i?.memavail,{preferKiB:!0});let O=null,B=pt(i?.memory_usage?.percent??i?.memory_percent,null);Number.isFinite(v)&&Number.isFinite(P)?(O=Math.max(v-P,0),B=v>0?O/v*100:null):Number.isFinite(v)&&Number.isFinite(B)&&(O=v*Math.max(0,Math.min(100,B))/100);const W=Number.isFinite(O)&&Number.isFinite(v)?`${zs(O)} / ${zs(v)}`:"--",H=Number.isFinite(F)?`${Math.round(F)}°C`:"--";if(u.machineHostArch&&(u.machineHostArch.textContent=g),u.machineHostVersion&&(u.machineHostVersion.textContent=`Version: ${w}`),u.machineHostOs&&(u.machineHostOs.textContent=`OS: ${M}`),u.machineHostStats&&(u.machineHostStats.textContent=`Load: ${lv(A)}, Mem: ${W}, Temp: ${H}`),u.machineHostNetworkList){u.machineHostNetworkList.innerHTML="";const Q=i?.network&&typeof i.network=="object"?i.network:{},$=r?.network&&typeof r.network=="object"?r.network:{},ie=[...new Set([...Object.keys($),...Object.keys(Q)])].sort();if(ie.length)ie.forEach(ne=>{const xe=Q[ne]||{},je=$[ne]||{},tt=hv(je);let nt=pt(xe?.bandwidth??xe?.tx_bandwidth??xe?.rx_bandwidth,null);const it=pt(xe?.rx_bandwidth,null),q=pt(xe?.tx_bandwidth,null);!Number.isFinite(nt)&&(Number.isFinite(it)||Number.isFinite(q))&&(nt=(Number.isFinite(it)?it:0)+(Number.isFinite(q)?q:0));const J=Vs(xe?.rx_bytes??xe?.received_bytes,{preferKiB:!1,allowHeuristic:!1}),me=Vs(xe?.tx_bytes??xe?.transmitted_bytes,{preferKiB:!1,allowHeuristic:!1}),De=document.createElement("p");De.textContent=`${ne} (${tt}): Bandwidth: ${dv(nt)}`;const ve=document.createElement("p");ve.className="muted",ve.textContent=`Received: ${zs(J)}, Transmitted: ${zs(me)}`,u.machineHostNetworkList.append(De,ve)});else{const ne=document.createElement("p");ne.className="muted",ne.textContent="No network interfaces reported.",u.machineHostNetworkList.appendChild(ne)}}const X=e&&Object.keys(e).length?1:0;Eo(u.machineDevicesGauge,u.machineDevicesValue,X>0?14:0,String(X)),Eo(u.machineCpuGauge,u.machineCpuGaugeValue,E,Number.isFinite(E)?`${Math.round(E)}`:"--"),Eo(u.machineMemGauge,u.machineMemGaugeValue,B,Number.isFinite(B)?`${Math.round(B)}`:"--"),a.client?n.lastError?Hs(`System load update issue: ${n.lastError}`):n.lastUpdatedMs?Hs(""):Hs("Loading system stats..."):Hs("Connect to Moonraker to load system stats.")}async function Lc({fetchStatic:n=!1}={}){if(!a.client){si();return}const e=a.machineLoads,t=n||!e.systemInfo?a.client.getMachineSystemInfo():Promise.resolve(null),i=n||!e.klipperVersion?a.client.getServerInfo():Promise.resolve(null),[r,s,o,c]=await Promise.allSettled([a.client.getMcuAndSystemStats(),a.client.getMachineProcStats(),t,i]),l=[];let d=!1;if(r.status==="fulfilled"){const f=r.value?.result?.status||{};e.mcuStatus=f?.mcu||null,e.systemStats=f?.system_stats||null,d=!0}else l.push(r.reason?.message||String(r.reason));if(s.status==="fulfilled"?(e.procStats=s.value?.result||null,d=!0):l.push(s.reason?.message||String(s.reason)),o.status==="fulfilled"?o.value&&(e.systemInfo=o.value?.result?.system_info||o.value?.result||null,d=!0):l.push(o.reason?.message||String(o.reason)),c.status==="fulfilled"){if(c.value){const f=c.value?.result||{},p=$r(f?.klippy_version)||$r(f?.software_version);p&&(e.klipperVersion=p),d=!0}}else l.push(c.reason?.message||String(c.reason));d&&(e.lastUpdatedMs=Date.now()),e.lastError=l.length?l[0]:"",l.length&&ke.debug("Machine loads poll completed with warnings.",{errorCount:l.length,firstError:l[0]}),si()}function da(){ta&&(clearInterval(ta),ta=null)}function pv(){if(da(),!a.client)return;let n=!1;const e=async()=>{if(!(!a.client||n)){n=!0;try{await Lc()}catch(t){const i=t?.message||String(t);a.machineLoads.lastError=i,ke.debug("Machine loads poll failed.",{error:i}),si()}finally{n=!1}}};e(),ta=setInterval(e,Mb)}function mv(){a.machineLoads=Qc(),si()}function gv(n){const e=String(n||"").trim().toLowerCase();return e==="triggered"||e==="closed"?"triggered":e==="open"?"open":"unknown"}function xv(n){if(!n||typeof n!="object")return{};const e=Object.entries(n).filter(([i])=>!!String(i||"").trim()).filter(([,i])=>["string","number","boolean"].includes(typeof i)),t={};return e.forEach(([i,r])=>{t[String(i).trim()]=String(r)}),t}function _v(n){const e=["x","y","z","probe","z_probe"];return[...n].sort((t,i)=>{const r=t.name.toLowerCase(),s=i.name.toLowerCase(),o=e.indexOf(r),c=e.indexOf(s),l=o>=0?o:e.length+(r[0]==="x"?0:r[0]==="y"?1:r[0]==="z"?2:3),d=c>=0?c:e.length+(s[0]==="x"?0:s[0]==="y"?1:s[0]==="z"?2:3);return l!==d?l-d:r.localeCompare(s)})}function Qi(n,e="info"){const t=String(n||"").trim();u.machineEndstopsStatus&&(u.machineEndstopsStatus.textContent=t,u.machineEndstopsStatus.dataset.level=e)}function Tn(){const n=a.endstops||el(),e=a.connectionStatus==="connected",t=_v(Object.entries(n.values||{}).map(([i,r])=>({name:i,raw:String(r||"").trim(),state:gv(r)})));if(u.machineEndstopsQuery&&(u.machineEndstopsQuery.disabled=!e||n.queryInFlight,u.machineEndstopsQuery.textContent=n.queryInFlight?"Querying...":"Query"),u.machineEndstopsList)if(u.machineEndstopsList.innerHTML="",t.length)t.forEach(i=>{const r=document.createElement("div");r.className="machine-endstop-item";const s=document.createElement("span");s.className="machine-endstop-name",s.textContent=i.name;const o=document.createElement("span");o.className=`machine-endstop-pill machine-endstop-pill-${i.state}`,o.textContent=i.state==="triggered"?"TRIGGERED":i.state==="open"?"open":"unknown",r.append(s,o),u.machineEndstopsList.appendChild(r)});else{const i=document.createElement("p");i.className="muted",i.textContent=e?"No endstop data available yet.":"Endstop data is unavailable while disconnected.",u.machineEndstopsList.appendChild(i)}if(u.machineEndstopsSummary)if(!t.length)u.machineEndstopsSummary.textContent="Press Query to check current endstop states.";else{const i=t.filter(l=>l.state==="triggered").length,r=t.filter(l=>l.state==="open").length,s=t.length-i-r,o=[`${i} triggered`,`${r} open`];s>0&&o.push(`${s} unknown`);const c=n.lastUpdatedMs?` | Last query: ${new Date(n.lastUpdatedMs).toLocaleTimeString()}`:"";u.machineEndstopsSummary.textContent=`${o.join(" | ")}${c}`}a.client?e?n.queryInFlight?Qi("Querying endstop state...","info"):n.lastError?Qi(`Endstop query failed: ${n.lastError}`,"error"):n.lastUpdatedMs?Qi("Endstop query complete.","info"):Qi("Press Query to request endstop state from Moonraker.","info"):Qi("Moonraker disconnected. Reconnect to query endstops.","warn"):Qi("Connect to Moonraker to query endstops.","warn")}async function dl({source:n="user",silent:e=!1}={}){if(!a.client||a.connectionStatus!=="connected")return Tn(),null;if(a.endstops.queryInFlight)return null;a.endstops.queryInFlight=!0,a.endstops.lastError="",Tn();try{const t=await a.client.getEndstopsStatus(),i=t?.result&&typeof t.result=="object"?t.result:t,r=xv(i);return a.endstops.values=r,a.endstops.lastUpdatedMs=Date.now(),a.endstops.lastError="",n==="user"&&pe("Endstops queried.","info"),Tn(),r}catch(t){const i=t?.message||String(t);return a.endstops.lastError=i,e||pe(`Endstop query failed: ${i}`,"error"),Tn(),null}finally{a.endstops.queryInFlight=!1,Tn()}}function bv(){a.endstops=el(),Tn()}function ul(n){return String(n||"").trim().replace(/\\/g,"/").replace(/^\/+/,"").replace(/^logs\//i,"")}function yv(n){const e=Number(n);return!Number.isFinite(e)||e<=0?null:e>1e12?e:e*1e3}function vv(n){const e=n?.result,t=Array.isArray(e)?e:Array.isArray(e?.files)?e.files:[],i=new Map;return t.forEach(r=>{if(!r||typeof r=="object"&&String(r.type||"").toLowerCase()==="directory")return;const s=typeof r=="string"?r:typeof r.path=="string"?r.path:[r.dirname,r.filename].filter(Boolean).join("/"),o=ul(s);if(!o||o.endsWith("/"))return;const c=Number(r?.size),l=Number.isFinite(c)&&c>=0?c:null,d=yv(r?.modified??r?.mtime??r?.date??r?.time);i.set(o,{relativePath:o,path:`logs/${o}`,size:l,modifiedMs:d})}),[...i.values()].sort((r,s)=>{const o=Number(r.modifiedMs)||0,c=Number(s.modifiedMs)||0;return o!==c?c-o:r.relativePath.localeCompare(s.relativePath)})}function eu(n){const e=Number(n);return!Number.isFinite(e)||e<=0?"--":new Date(e).toLocaleString()}function bi(n,e="info"){u.machineLogFilesStatus&&(u.machineLogFilesStatus.textContent=String(n||"").trim(),u.machineLogFilesStatus.dataset.level=e)}async function Sv(n){const e=ul(n);if(!e||!a.client||a.connectionStatus!=="connected")return!1;a.logFiles.actionInFlight=!0,Pt();try{const t=await a.client.getFileBlob("logs",e),i=e.split("/").pop()||"log.txt",r=URL.createObjectURL(t),s=document.createElement("a");return s.href=r,s.download=i,document.body.appendChild(s),s.click(),s.remove(),URL.revokeObjectURL(r),pe(`Log downloaded: logs/${e}`,"info"),a.logFiles.lastError="",!0}catch(t){const i=t?.message||String(t);return a.logFiles.lastError=i,pe(`Log download failed (${e}): ${i}`,"error"),!1}finally{a.logFiles.actionInFlight=!1,Pt()}}async function Ev(n){const e=ul(n);if(!e||!a.client||a.connectionStatus!=="connected"||!window.confirm(`Delete log file logs/${e}? This cannot be undone.`))return!1;a.logFiles.actionInFlight=!0,Pt();try{return await a.client.deleteLogFile(e),pe(`Log deleted: logs/${e}`,"warn"),a.logFiles.lastError="",await ls({source:"delete",silent:!0}),!0}catch(i){const r=i?.message||String(i);return a.logFiles.lastError=r,pe(`Log delete failed (${e}): ${r}`,"error"),Pt(),!1}finally{a.logFiles.actionInFlight=!1,Pt()}}async function Mv(){if(!a.client||a.connectionStatus!=="connected")return!1;const n=[...a.logFiles.files||[]];if(!n.length||!window.confirm(`Delete all ${n.length} log file${n.length===1?"":"s"}? This cannot be undone.`))return!1;a.logFiles.actionInFlight=!0,Pt();let t=0,i=0;try{for(const r of n)try{await a.client.deleteLogFile(r.relativePath),t+=1}catch{i+=1}return a.logFiles.lastError="",pe(`Log cleanup complete: ${t} deleted${i?`, ${i} failed`:""}.`,i?"warn":"info"),await ls({source:"delete",silent:!0}),i===0}catch(r){const s=r?.message||String(r);return a.logFiles.lastError=s,pe(`Delete all logs failed: ${s}`,"error"),Pt(),!1}finally{a.logFiles.actionInFlight=!1,Pt()}}function Pt(){const n=a.logFiles||tl(),e=a.connectionStatus==="connected",t=Array.isArray(n.files)?n.files:[],i=n.isLoading||n.actionInFlight;if(u.machineLogFilesRefresh&&(u.machineLogFilesRefresh.disabled=!e||i,u.machineLogFilesRefresh.textContent=n.isLoading?"Loading...":"Refresh"),u.machineLogFilesDeleteAll&&(u.machineLogFilesDeleteAll.disabled=!e||i||!t.length),u.machineLogFilesSummary)if(!t.length)u.machineLogFilesSummary.textContent="No log files loaded.";else{const r=t.reduce((l,d)=>l+(Number(d.size)||0),0),s=t.reduce((l,d)=>Math.max(l,Number(d.modifiedMs)||0),0),o=s>0?` | Latest: ${eu(s)}`:"",c=r>0?` | Total: ${_r(r)}`:"";u.machineLogFilesSummary.textContent=`${t.length} log file${t.length===1?"":"s"}${c}${o}`}if(u.machineLogFilesList)if(u.machineLogFilesList.innerHTML="",t.length)t.forEach(r=>{const s=document.createElement("article");s.className="machine-log-file-item";const o=document.createElement("div");o.className="machine-log-file-meta";const c=document.createElement("p");c.className="machine-log-file-name",c.textContent=r.relativePath;const l=document.createElement("p");l.className="machine-log-file-detail muted";const d=_r(r.size)||"--",f=eu(r.modifiedMs);l.textContent=`${d} | Modified: ${f}`,o.append(c,l);const p=document.createElement("div");p.className="machine-log-file-row-actions";const h=document.createElement("button");h.type="button",h.className="machine-log-file-btn",h.textContent="Download",h.disabled=i,h.addEventListener("click",async()=>{await Sv(r.relativePath)});const m=document.createElement("button");m.type="button",m.className="machine-log-file-btn danger",m.textContent="Delete",m.disabled=i,m.addEventListener("click",async()=>{await Ev(r.relativePath)}),p.append(h,m),s.append(o,p),u.machineLogFilesList.appendChild(s)});else{const r=document.createElement("p");r.className="muted",r.textContent=e?"No log files reported in logs/.":"Log files are unavailable while disconnected.",u.machineLogFilesList.appendChild(r)}a.client?e?n.isLoading?bi("Loading log files...","info"):n.actionInFlight?bi("Running log file action...","warn"):n.lastError?bi(`Log files action failed: ${n.lastError}`,"error"):n.lastUpdatedMs?bi(`Last refreshed: ${new Date(n.lastUpdatedMs).toLocaleTimeString()}`,"info"):bi("Press Refresh to load log files.","info"):bi("Moonraker disconnected. Reconnect to manage logs.","warn"):bi("Connect to Moonraker to manage logs.","warn")}async function ls({source:n="user",silent:e=!1}={}){if(!a.client||a.connectionStatus!=="connected")return Pt(),[];if(a.logFiles.isLoading)return a.logFiles.files||[];a.logFiles.isLoading=!0,a.logFiles.lastError="",Pt();try{const t=await a.client.getLogFiles(),i=vv(t);return a.logFiles.files=i,a.logFiles.lastError="",a.logFiles.lastUpdatedMs=Date.now(),n==="user"&&pe(`Loaded ${i.length} log file${i.length===1?"":"s"}.`,"info"),Pt(),i}catch(t){const i=t?.message||String(t);return a.logFiles.lastError=i,e||pe(`Log files load failed: ${i}`,"error"),Pt(),[]}finally{a.logFiles.isLoading=!1,Pt()}}function Tv(){a.logFiles=tl(),Pt()}function $n(n){return String(n||"").trim().toLowerCase()}function Mi(n){const e=$n(n);return e?e==="klipper"?"Klipper":e==="moonraker"?"Moonraker":e==="fluidd"?"Fluidd":e==="mainsail"?"Mainsail":e==="system"?"System":e.split(/[\s_-]+/).filter(Boolean).map(t=>t.slice(0,1).toUpperCase()+t.slice(1)).join(" "):"Unknown"}function Xr(n){return Array.isArray(n)?n:[]}function Cv(){const n=a.updateManager.versionInfo;if(!n||typeof n!="object")return[];const e=Object.entries(n).map(([t,i])=>{if(!i||typeof i!="object")return null;const r=String(i.name||t).trim();return r?{...i,name:r}:null}).filter(Boolean);return e.sort((t,i)=>{const r=$n(t.name),s=$n(i.name),o=Bs.indexOf(r),c=Bs.indexOf(s),l=o>=0?o:Bs.length+10,d=c>=0?c:Bs.length+10;return l!==d?l-d:r.localeCompare(s)}),e}function Hf(n){if(!n||typeof n!="object")return!1;const e=$n(n.name),t=$n(n.configured_type);if(e==="system"||t==="system"){const l=pt(n.package_count,0);return Number.isFinite(l)&&l>0}const i=String(n.remote_hash||"").trim().toLowerCase(),r=String(n.current_hash||"").trim().toLowerCase();if(i==="update-available"||i&&r&&i!==r||Xr(n.commits_behind).length>0)return!0;const o=String(n.remote_version||"").trim(),c=String(n.version||"").trim();return!!(o&&c&&o!==c)}function wv(n){if(!n||typeof n!="object"||$n(n.name)==="system")return!1;const t=$n(n.configured_type);return t==="git_repo"||t==="zip"||t==="web"||n.is_valid===!1||n.is_dirty===!0||n.corrupt===!0}function Av(n){return!n||typeof n!="object"?!1:!!String(n.rollback_version||"").trim()}function Lv(n){if(!n||typeof n!="object")return[];const e=[];return Xr(n.warnings).forEach(t=>{const i=String(t||"").trim();i&&e.push(i)}),Xr(n.anomalies).forEach(t=>{const i=String(t||"").trim();i&&e.push(i)}),Xr(n.recovery_messages).forEach(t=>{const i=String(t||"").trim();i&&e.push(i)}),[...new Set(e)]}function Rv(n){const e=Number(n);return Number.isFinite(e)?new Date(e).toLocaleTimeString():"--:--:--"}function Ot(n,e="info"){const t=String(n||"").trim();a.updateManager.statusMessage=t,u.machineUpdateStatus&&(u.machineUpdateStatus.textContent=t,u.machineUpdateStatus.dataset.level=e)}function Ti(n,e="info"){const t=String(n||"").trim();t&&(a.updateManager.activityLog.push({time:Date.now(),message:t,level:e}),a.updateManager.activityLog.length>Od&&a.updateManager.activityLog.splice(0,a.updateManager.activityLog.length-Od),qt())}function Pv(){if(!u.machineUpdateLog)return;u.machineUpdateLog.innerHTML="";const n=a.updateManager.activityLog;if(!n.length){const t=document.createElement("p");t.className="muted",t.textContent="No update activity yet.",u.machineUpdateLog.appendChild(t);return}n.slice(-60).forEach(t=>{const i=document.createElement("p");i.className="machine-update-log-line",t.level==="error"&&i.classList.add("machine-update-log-line-error"),i.textContent=`[${Rv(t.time)}] ${t.message}`,u.machineUpdateLog.appendChild(i)}),u.machineUpdateLog.scrollTop=u.machineUpdateLog.scrollHeight}function Mo({label:n,kind:e="default",disabled:t=!1,onClick:i}){const r=document.createElement("button");return r.type="button",r.className=`machine-update-btn machine-update-btn-${e}`,r.textContent=n,r.disabled=t,r.addEventListener("click",i),r}function Iv(n,e){const t=document.createElement("article");t.className="machine-update-item";const i=document.createElement("div");i.className="machine-update-item-head";const r=document.createElement("div");r.className="machine-update-title-wrap";const s=document.createElement("h4");s.textContent=Mi(n.name),r.appendChild(s);const o=document.createElement("span");o.className="machine-update-pill";const c=Hf(n),l=n.is_valid!==!1,d=pt(n.package_count,0);l?d>0&&$n(n.name)==="system"?(o.classList.add("machine-update-pill-warn"),o.textContent=`${Math.round(d)} packages`):c?(o.classList.add("machine-update-pill-warn"),o.textContent="Update available"):(o.classList.add("machine-update-pill-ok"),o.textContent="Up to date"):(o.classList.add("machine-update-pill-danger"),o.textContent="Invalid"),r.appendChild(o),i.appendChild(r);const f=document.createElement("div");f.className="machine-update-item-actions";const p=String(n.name||"").trim();p&&c&&f.appendChild(Mo({label:"Update",kind:"accent",disabled:e||!l,onClick:async()=>{await jf(p)}})),p&&wv(n)&&f.appendChild(Mo({label:"Recover",kind:"warning",disabled:e,onClick:async()=>{const R=Mi(p);if(!window.confirm(`Recover ${R}?`))return;const A=window.confirm(`Use hard recover for ${R}?

Press OK for hard recover, or Cancel for standard recover.`);await Uv(p,{hard:A})}})),p&&Av(n)&&f.appendChild(Mo({label:"Rollback",kind:"default",disabled:e,onClick:async()=>{const R=Mi(p);window.confirm(`Rollback ${R} to ${n.rollback_version}?`)&&await Ov(p)}})),f.childElementCount&&i.appendChild(f),t.appendChild(i);const h=document.createElement("p");h.className="machine-update-detail";const m=String(n.version||n.full_version_string||"--").trim()||"--",_=String(n.remote_version||"--").trim()||"--",b=String(n.configured_type||"").trim(),x=String(n.channel||"").trim(),g=String(n.branch||"").trim();$n(n.name)==="system"?h.textContent=`Package updates: ${Number.isFinite(d)?Math.max(0,Math.round(d)):0}`:h.textContent=`Current: ${m}  |  Latest: ${_}`,t.appendChild(h);const w=[];b&&w.push(`Type: ${b}`),x&&w.push(`Channel: ${x}`),g&&w.push(`Branch: ${g}`);const T=Xr(n.commits_behind).length;if(T>0&&w.push(`${T} commit${T===1?"":"s"} behind`),n.is_dirty===!0&&w.push("Dirty working tree"),n.is_valid===!1&&w.push("Invalid state"),w.length){const R=document.createElement("p");R.className="machine-update-meta",R.textContent=w.join(" | "),t.appendChild(R)}const L=Lv(n);if(L.length){const R=document.createElement("div");R.className="machine-update-issues",L.slice(0,3).forEach(M=>{const A=document.createElement("p");A.textContent=M,R.appendChild(A)}),t.appendChild(R)}return t}function qt(){const n=a.updateManager,e=Cv(),t=e.filter(r=>Hf(r)).length,i=!!a.client;if(u.machineUpdateRefresh&&(u.machineUpdateRefresh.disabled=!i||n.actionInFlight),u.machineUpdateUpgradeAll&&(u.machineUpdateUpgradeAll.disabled=!i||n.actionInFlight||n.busy||!t),u.machineUpdateSummary&&(i?e.length?t?u.machineUpdateSummary.textContent=`${t} updater${t===1?"":"s"} need attention.`:u.machineUpdateSummary.textContent=`All ${e.length} updater${e.length===1?"":"s"} are up to date.`:u.machineUpdateSummary.textContent="No updaters reported by Moonraker.":u.machineUpdateSummary.textContent="Connect to Moonraker to check update status."),u.machineUpdateRate){const r=pt(n.githubRequestsRemaining,null),s=pt(n.githubRateLimit,null),o=pt(n.githubLimitResetTime,null);if(Number.isFinite(r)&&Number.isFinite(s)){const c=Number.isFinite(o)?` | Reset: ${new Date(o*1e3).toLocaleTimeString()}`:"";u.machineUpdateRate.textContent=`GitHub API: ${Math.round(r)}/${Math.round(s)}${c}`}else u.machineUpdateRate.textContent=""}if(u.machineUpdateList)if(u.machineUpdateList.innerHTML="",i)if(e.length){const r=n.actionInFlight||n.busy;e.forEach(s=>{u.machineUpdateList.appendChild(Iv(s,r))})}else{const r=document.createElement("p");r.className="muted",r.textContent="No updater entries found in Moonraker update status.",u.machineUpdateList.appendChild(r)}else{const r=document.createElement("p");r.className="muted",r.textContent="Update controls are available after Moonraker connects.",u.machineUpdateList.appendChild(r)}Pv(),n.statusMessage||(i?n.lastError?Ot(`Update manager error: ${n.lastError}`,"error"):n.busy?Ot("Update process running...","warn"):n.lastUpdatedMs?Ot(`Last checked: ${new Date(n.lastUpdatedMs).toLocaleTimeString()}`,"info"):Ot("Loading update status...","info"):Ot("Connect to Moonraker to use Update Manager.","warn"))}function Wf(n,{keepStatusMessage:e=!1}={}){const t=n&&typeof n=="object"?n:{},i=t.version_info&&typeof t.version_info=="object"?t.version_info:{};a.updateManager.busy=!!t.busy,a.updateManager.versionInfo=i,a.updateManager.githubRateLimit=pt(t.github_rate_limit,null),a.updateManager.githubRequestsRemaining=pt(t.github_requests_remaining,null),a.updateManager.githubLimitResetTime=pt(t.github_limit_reset_time,null),a.updateManager.lastError="",a.updateManager.lastUpdatedMs=Date.now(),e||(a.updateManager.statusMessage="")}async function Tr({forceRefresh:n=!1,source:e="poll",name:t=null}={}){if(!a.client)return qt(),null;try{const i=n?await a.client.refreshMachineUpdates(t):await a.client.getMachineUpdateStatus(),r=i?.result&&typeof i.result=="object"?i.result:i;return Wf(r),n&&e!=="poll"&&(Ot("Update status refreshed.","info"),Ti("Update status refreshed.")),qt(),r}catch(i){const r=i?.message||String(i);throw a.updateManager.lastError=r,e!=="poll"?(pe(`Update manager refresh failed: ${r}`,"error"),Ti(`Refresh failed: ${r}`,"error"),Ot(`Update manager refresh failed: ${r}`,"error")):a.updateManager.lastUpdatedMs||Ot(`Update manager refresh failed: ${r}`,"error"),qt(),i}}function ua(){na&&(clearInterval(na),na=null)}function Dv(){if(ua(),!a.client)return;let n=!1;const e=async()=>{if(!(!a.client||n)){n=!0;try{await Tr({forceRefresh:!1,source:"poll"})}catch(t){ke.debug("Update manager poll failed.",{error:t?.message||String(t)})}finally{n=!1}}};e(),na=setInterval(e,Tb)}function Fv(){a.updateManager=Sf(),qt()}async function fl(n,e){if(!a.client)return Ot("Connect to Moonraker to run updater actions.","warn"),!1;if(a.updateManager.actionInFlight)return Ot("Another update action is currently running.","warn"),!1;a.updateManager.actionInFlight=!0,a.updateManager.activeActionLabel=n,Ot(`${n} requested...`,"warn"),Ti(`${n} requested.`),qt();try{await e(),Ti(`${n} accepted.`);try{await Tr({forceRefresh:!1,source:"action"})}catch(t){const i=t?.message||String(t);ke.debug("Update manager post-action refresh failed.",{actionLabel:n,error:i})}return!0}catch(t){const i=t?.message||String(t);return a.updateManager.lastError=i,Ti(`${n} failed: ${i}`,"error"),pe(`${n} failed: ${i}`,"error"),Ot(`${n} failed: ${i}`,"error"),qt(),!1}finally{a.updateManager.actionInFlight=!1,a.updateManager.activeActionLabel="",qt()}}async function Nv(){await Tr({forceRefresh:!0,source:"user"})}async function jf(n=null){const e=n?`Update ${Mi(n)}`:"Update all components";return fl(e,async()=>{await a.client.upgradeMachineUpdates(n)})}async function Uv(n,{hard:e=!1}={}){const t=`${e?"Hard recover":"Recover"} ${Mi(n)}`;return fl(t,async()=>{await a.client.recoverMachineUpdater(n,{hard:e})})}async function Ov(n){const e=`Rollback ${Mi(n)}`;return fl(e,async()=>{await a.client.rollbackMachineUpdater(n)})}function Bv(n){const[e]=Array.isArray(n?.params)?n.params:[];if(!e||typeof e!="object")return;const t=String(e.application||e.name||"update").trim(),i=Mi(t),r=String(e.message||"").trim(),s=e.complete===!0,o=e.error===!0;r&&Ti(`${i}: ${r}`,o?"error":"info"),o?(a.updateManager.lastError=r||"Update manager reported an error.",Ot(a.updateManager.lastError,"error")):s?(a.updateManager.busy=!1,a.updateManager.actionInFlight=!1,a.updateManager.activeActionLabel="",Ot(`${i} update completed.`,"info"),Tr({forceRefresh:!1,source:"notify"})):(a.updateManager.busy=!0,r&&Ot(`${i}: ${r}`,"warn")),qt()}function Gv(n){const[e]=Array.isArray(n?.params)?n.params:[];!e||typeof e!="object"||(Wf(e),Ot("Update status refreshed.","info"),Ti("Moonraker pushed refreshed update status."),qt())}function Rc(n,{recordHistory:e=!0}={}){const t=n?.extruder||{},i=n?.heater_bed||{};if(typeof t.temperature=="number"&&(a.temperatures.hotend.current=t.temperature),typeof i.temperature=="number"&&(a.temperatures.bed.current=i.temperature),typeof t.target=="number"&&(a.temperatures.hotend.target=t.target),typeof i.target=="number"&&(a.temperatures.bed.target=i.target),e){const r={time:Date.now(),hotendCurrent:a.temperatures.hotend.current,hotendTarget:a.temperatures.hotend.target,bedCurrent:a.temperatures.bed.current,bedTarget:a.temperatures.bed.target},s=a.temperatures.history,o=s[s.length-1];o&&r.time-o.time<Cb?s[s.length-1]={...r,time:o.time}:s.push(r);const c=s[s.length-1];ny(c)}ns()}function kv(){localStorage.setItem("temperature_show_chart",String(a.temperatures.chart.show)),localStorage.setItem("temperature_hide_host_sensors",String(a.temperatures.chart.hideHostSensors)),localStorage.setItem("temperature_hide_monitors",String(a.temperatures.chart.hideMonitors)),localStorage.setItem("temperature_autoscale_chart",String(a.temperatures.chart.autoscale))}function Qn(){!u.tempSettingsMenu||!u.tempSettingsToggle||(u.tempSettingsMenu.hidden=!0,u.tempSettingsToggle.setAttribute("aria-expanded","false"))}function Gn(n=null){[u.tempHotendTargetMenu,u.tempBedTargetMenu].forEach(e=>{!e||e===n||(e.hidden=!0)})}function zv(){return`
    <svg class="target-preset-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2v20M4.93 6l14.14 12M19.07 6 4.93 18M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
    </svg>
  `}function Pc(n){const e=n==="hotend"?u.tempHotendTargetMenu:u.tempBedTargetMenu;if(!e)return;e.innerHTML="";const t=Math.round(a.temperatures[n].target||0);vb[n].forEach(i=>{const r=document.createElement("button");r.type="button",r.className="target-preset-item",r.innerHTML=`${zv()}<span>${i}°C</span>`,i===t&&r.classList.add("target-preset-active"),r.addEventListener("click",async s=>{s.preventDefault(),await qf(n,i),Gn()}),e.appendChild(r)})}function $f(){Pc("hotend"),Pc("bed")}function tu(n){const e=n==="hotend"?u.tempHotendTargetMenu:u.tempBedTargetMenu;if(!e)return;Pc(n);const t=e.hidden;Gn(),e.hidden=!t}function Vv(){if(u.temperatureChartWrap){if(u.temperatureChartWrap.classList.toggle("is-hidden",!a.temperatures.chart.show),!a.temperatures.chart.show){a.temperatures.chart.hoverIndex=null,u.temperatureChartTooltip&&(u.temperatureChartTooltip.hidden=!0);return}xr()}}function Hv(){const n=a.temperatures.hotend.current,e=a.temperatures.bed.current,t=a.temperatures.hotend.target,i=a.temperatures.bed.target;u.tempHotend&&(u.tempHotend.textContent=Zd(n)),u.tempBed&&(u.tempBed.textContent=Zd(e)),u.tempHotendTarget&&(u.tempHotendTarget.textContent=zr(t)),u.tempBedTarget&&(u.tempBedTarget.textContent=zr(i)),u.tempHotendState&&(u.tempHotendState.textContent=Qd(n,t)),u.tempBedState&&(u.tempBedState.textContent=Qd(e,i)),u.tempHotendTargetInput&&document.activeElement!==u.tempHotendTargetInput&&(u.tempHotendTargetInput.value=zr(t)),u.tempBedTargetInput&&document.activeElement!==u.tempBedTargetInput&&(u.tempBedTargetInput.value=zr(i)),$f()}function nu(n,e){const t=Number.isFinite(n)?n:0,i=Number.isFinite(e)?e:0,r=i>0?Math.round(t/i*100):0;return`${t.toFixed(1)} / ${i.toFixed(1)}°C [${Math.max(0,r)}%]`}function hl(n,e){const t=(e-n.startTime)/(n.endTime-n.startTime||1);return n.left+t*n.width}function Xf(n,e){const t=Number.isFinite(e)?e:0,i=Math.max(0,Math.min(1,t/n.yMax));return n.top+(1-i)*n.height}function Wv(n,e){n.save(),n.strokeStyle="rgba(148, 163, 184, 0.22)",n.lineWidth=1;const t=5;for(let r=0;r<=t;r+=1){const s=e.top+e.height*r/t;n.beginPath(),n.moveTo(e.left,s),n.lineTo(e.left+e.width,s),n.stroke();const o=e.yMax-e.yMax*r/t;n.fillStyle="rgba(203, 213, 225, 0.72)",n.font='13px "JetBrains Mono"',n.textAlign="right",n.textBaseline="middle",n.fillText(String(Math.round(o)),e.left-8,s)}const i=9;for(let r=0;r<=i;r+=1){const s=e.left+e.width*r/i;n.beginPath(),n.moveTo(s,e.top),n.lineTo(s,e.top+e.height),n.stroke();const o=e.startTime+(e.endTime-e.startTime)*r/i;n.fillStyle="rgba(148, 163, 184, 0.68)",n.font='13px "JetBrains Mono"',n.textAlign="center",n.textBaseline="top";const c=new Date(o).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});n.fillText(c,s,e.top+e.height+10)}n.restore()}function iu(n,e,t,i,r){n.save(),n.strokeStyle=r,n.lineWidth=3,n.lineCap="round",n.lineJoin="round",n.beginPath(),n.rect(e.left,e.top,e.width,e.height),n.clip();let s=!1,o=0,c=null;t.forEach(l=>{const d=l[i];if(!Number.isFinite(d))return;const f=hl(e,l.time),p=Xf(e,d);c={x:f,y:p},o+=1,s?n.lineTo(f,p):(n.beginPath(),n.moveTo(f,p),s=!0)}),s&&n.stroke(),o===1&&c&&(n.fillStyle=r,n.beginPath(),n.arc(c.x,c.y,3.2,0,Math.PI*2),n.fill()),n.restore()}function jv(n){if(!u.temperatureChartTooltip)return;const{hoverIndex:e}=a.temperatures.chart,t=Number.isInteger(e)?n.history[e]:null;if(!t){u.temperatureChartTooltip.hidden=!0;return}u.temperatureTooltipTime&&(u.temperatureTooltipTime.textContent=new Date(t.time).toLocaleTimeString()),u.temperatureTooltipHotend&&(u.temperatureTooltipHotend.textContent=nu(t.hotendCurrent,t.hotendTarget)),u.temperatureTooltipBed&&(u.temperatureTooltipBed.textContent=nu(t.bedCurrent,t.bedTarget));const i=hl(n,t.time);u.temperatureChartTooltip.hidden=!1;const r=u.temperatureChartTooltip.offsetWidth||248,s=Math.max(8,Math.min(n.canvasWidth-r-8,i+12));u.temperatureChartTooltip.style.left=`${s}px`,u.temperatureChartTooltip.style.top=`${Math.max(8,n.top+10)}px`}function $v(n,e){let t=0,i=n.length;for(;t<i;){const r=Math.floor((t+i)/2);n[r].time<e?t=r+1:i=r}return t}function Xv(n,e){let t=0,i=n.length;for(;t<i;){const r=Math.floor((t+i)/2);n[r].time<=e?t=r+1:i=r}return t-1}function qv(n,e,t){if(!n.length)return[];let i=$v(n,e),r=Xv(n,t);return i>0&&(i-=1),r<n.length-1&&(r+=1),i<0&&(i=0),r>=n.length&&(r=n.length-1),r<i?[]:n.slice(i,r+1)}function xr(){const n=u.temperatureChart;if(!n||!a.temperatures.chart.show)return;const e=a.temperatures.history,t=a.temperatures.chart,i=wb,r=e[e.length-1]?.time||Date.now(),s=e[0]?.time||r-i,o=Math.max(0,r-s),c=Math.max(0,o-i),l=Math.max(0,Math.min(t.offsetMs||0,c));l!==t.offsetMs&&(t.offsetMs=l);const d=r-l,f=Math.max(s,d-i),p=Math.max(d,f+i),h=qv(e,f,p),m=n.getContext("2d");if(!m)return;const _=Math.max(10,n.clientWidth||10),b=Math.max(10,n.clientHeight||10),x=window.devicePixelRatio||1,g=Math.round(_*x),w=Math.round(b*x);(n.width!==g||n.height!==w)&&(n.width=g,n.height=w),m.setTransform(x,0,0,x,0,0),m.clearRect(0,0,_,b);const T=46,L=12,R=10,M=40,A=Math.max(16,_-T-L),F=Math.max(16,b-R-M),E=h.reduce((W,H)=>{const X=Math.max(Number.isFinite(H.hotendCurrent)?H.hotendCurrent:0,Number.isFinite(H.hotendTarget)?H.hotendTarget:0,Number.isFinite(H.bedCurrent)?H.bedCurrent:0,Number.isFinite(H.bedTarget)?H.bedTarget:0);return Math.max(W,X)},0),v=t.autoscale?Math.max(60,Math.ceil((E+12)/10)*10):Sb,P={canvasWidth:_,canvasHeight:b,left:T,top:R,width:A,height:F,startTime:f,endTime:p,yMax:v,history:h,windowMs:i,maxOffsetMs:c};Wv(m,P);const O=zb();iu(m,P,h,"hotendCurrent",O.hotend),iu(m,P,h,"bedCurrent",O.bed);const B=Number.isInteger(t.hoverIndex)?h[t.hoverIndex]:null;if(!B&&t.hoverIndex!==null&&(t.hoverIndex=null),B){const W=hl(P,B.time);m.save(),m.strokeStyle="rgba(184, 198, 219, 0.62)",m.setLineDash([6,6]),m.beginPath(),m.moveTo(W,R),m.lineTo(W,R+F),m.stroke(),m.setLineDash([]),[[B.hotendCurrent,O.hotend],[B.bedCurrent,O.bed]].forEach(([H,X])=>{if(!Number.isFinite(H))return;const Q=Xf(P,H);m.fillStyle=X,m.beginPath(),m.arc(W,Q,4.5,0,Math.PI*2),m.fill(),m.lineWidth=2,m.strokeStyle="rgba(15, 23, 42, 0.9)",m.stroke()}),m.restore()}t.layout=P,jv(P)}function ns(){Hv(),Vv()}function Yv(n){const e=a.temperatures.chart.layout;if(!e||!u.temperatureChart)return;const t=u.temperatureChart.getBoundingClientRect(),i=n.clientX-t.left,r=n.clientY-t.top,s=i>=e.left&&i<=e.left+e.width,o=r>=e.top&&r<=e.top+e.height;if(!s||!o){a.temperatures.chart.hoverIndex!==null&&(a.temperatures.chart.hoverIndex=null,xr());return}const c=(i-e.left)/e.width,l=e.startTime+c*(e.endTime-e.startTime);let d=null,f=Number.POSITIVE_INFINITY;e.history.forEach((p,h)=>{const m=Math.abs(p.time-l);m<f&&(f=m,d=h)}),d!==a.temperatures.chart.hoverIndex&&(a.temperatures.chart.hoverIndex=d,xr())}function Kv(n){const e=a.temperatures.chart.layout;if(!e||e.maxOffsetMs<=0)return;const t=Math.abs(n.deltaX)>Math.abs(n.deltaY)?n.deltaX:n.deltaY;if(!Number.isFinite(t)||t===0)return;n.preventDefault();const i=Math.max(15*1e3,Math.round(e.windowMs*Ab)),r=Math.min(12,Math.max(1,Math.abs(t)/100)),s=n.shiftKey?8:1,o=Math.round(i*r*s),c=Math.max(0,Math.min(e.maxOffsetMs,a.temperatures.chart.offsetMs+Math.sign(t)*o));c!==a.temperatures.chart.offsetMs&&(a.temperatures.chart.offsetMs=c,a.temperatures.chart.hoverIndex=null,xr())}function Jv(){a.temperatures.chart.hoverIndex!==null&&(a.temperatures.chart.hoverIndex=null,xr())}async function qf(n,e){const t=Vf(n,e);if(t===null)return;n==="hotend"?u.tempHotendTargetInput&&(u.tempHotendTargetInput.value=String(t)):u.tempBedTargetInput&&(u.tempBedTargetInput.value=String(t));const r=`SET_HEATER_TEMPERATURE HEATER=${n==="hotend"?"extruder":"heater_bed"} TARGET=${t}`;await ii(r,{actionLabel:`Set ${n==="hotend"?"Extruder":"Heater Bed"} target`})&&(a.temperatures[n].target=t,ns())}async function Zv(){await ii(`SET_HEATER_TEMPERATURE HEATER=extruder TARGET=0
SET_HEATER_TEMPERATURE HEATER=heater_bed TARGET=0`,{actionLabel:"Cooldown"})&&(a.temperatures.hotend.target=0,a.temperatures.bed.target=0,ns())}function Qv(){u.cardTemperatures&&(u.tempShowChart&&(u.tempShowChart.checked=a.temperatures.chart.show),u.tempHideHostSensors&&(u.tempHideHostSensors.checked=a.temperatures.chart.hideHostSensors),u.tempHideMonitors&&(u.tempHideMonitors.checked=a.temperatures.chart.hideMonitors),u.tempAutoscaleChart&&(u.tempAutoscaleChart.checked=a.temperatures.chart.autoscale),$f(),ns(),Gn(),Qn(),u.tempCooldown?.addEventListener("click",async()=>{Gn(),Qn(),await Zv()}),u.tempSettingsToggle?.addEventListener("click",n=>{if(n.preventDefault(),n.stopPropagation(),!u.tempSettingsMenu||!u.tempSettingsToggle)return;const e=u.tempSettingsMenu.hidden;Gn(),u.tempSettingsMenu.hidden=!e,u.tempSettingsToggle.setAttribute("aria-expanded",String(e))}),[u.tempShowChart,u.tempHideHostSensors,u.tempHideMonitors,u.tempAutoscaleChart].forEach(n=>{n?.addEventListener("change",()=>{a.temperatures.chart.show=u.tempShowChart?.checked??!0,a.temperatures.chart.hideHostSensors=u.tempHideHostSensors?.checked??!1,a.temperatures.chart.hideMonitors=u.tempHideMonitors?.checked??!1,a.temperatures.chart.autoscale=u.tempAutoscaleChart?.checked??!1,kv(),ns()})}),u.tempHotendTargetToggle?.addEventListener("click",n=>{n.preventDefault(),n.stopPropagation(),Qn(),tu("hotend")}),u.tempBedTargetToggle?.addEventListener("click",n=>{n.preventDefault(),n.stopPropagation(),Qn(),tu("bed")}),[["hotend",u.tempHotendTargetInput],["bed",u.tempBedTargetInput]].forEach(([n,e])=>{e&&(e.addEventListener("keydown",async t=>{t.key==="Enter"&&(t.preventDefault(),await qf(n,e.value),Gn(),Qn())}),e.addEventListener("blur",async()=>{Vf(n,e.value)===null&&(e.value=zr(a.temperatures[n].target))}))}),u.temperatureChart?.addEventListener("mousemove",Yv),u.temperatureChart?.addEventListener("mouseleave",Jv),u.temperatureChart?.addEventListener("wheel",Kv,{passive:!1}),window.addEventListener("resize",()=>{xr()}),document.addEventListener("keydown",n=>{n.key==="Escape"&&(Gn(),Qn())}),document.addEventListener("click",n=>{const e=n.target;if(e instanceof Element){if(!u.cardTemperatures.contains(e)){Gn(),Qn();return}e.closest(".target-control")||Gn(),!e.closest("#temp-settings-menu")&&!e.closest("#temp-settings-toggle")&&Qn()}}))}function ru(n,e){!n.enabled||!n.url||(u.cameraDialogContent.innerHTML="",Ac(u.cameraDialogContent,n,e),typeof u.cameraDialog.showModal=="function"&&u.cameraDialog.showModal())}function su(){u.cameraDialog.open&&u.cameraDialog.close()}function eS(n,e){let t=n.querySelector(":scope > .card-head, :scope > .camera-card-head");if(t)return t.classList.add("card-head"),t;let i=n.querySelector(":scope > h2, :scope > h3");return i||(i=document.createElement("h3"),i.textContent=n.classList.contains("settings-actions")?"Actions":`Card ${e+1}`,n.prepend(i)),t=document.createElement("div"),t.className="card-head",i.remove(),t.appendChild(i),n.prepend(t),t}function tS(n){let e=n.querySelector(":scope > .card-head-actions");if(e)return e;e=document.createElement("div"),e.className="card-head-actions";const t=n.querySelector(":scope > h2, :scope > h3");return[...n.children].filter(r=>r!==t&&!r.classList.contains("card-head-actions")).forEach(r=>e.appendChild(r)),n.appendChild(e),e}function nS(n,e){let t=n.querySelector(":scope > .card-body");return t||(t=document.createElement("div"),t.className="card-body",[...n.children].filter(r=>r!==e).forEach(r=>t.appendChild(r)),n.appendChild(t),t)}function iS(n,e){const t=n.closest(".view")?.id||"view",i=`card-${e+1}`,r=n.querySelector(":scope > .card-head > h2, :scope > .card-head > h3")?.textContent?.trim()||n.querySelector(":scope h2, :scope h3")?.textContent?.trim()||i,s=n.id||r||i;return`${ob}${Zb(`${t}-${s}`)}`}function rS(n,e){n.dataset.state=e?"collapsed":"expanded",n.setAttribute("aria-expanded",String(!e)),n.setAttribute("title",e?"Expand card":"Collapse card")}function au(n,e,t,i){n.classList.toggle("card-collapsed",i),rS(e,i),localStorage.setItem(t,i?"1":"0")}function sS(){[...document.querySelectorAll(".view .card")].forEach((e,t)=>{const i=eS(e,t),r=tS(i);nS(e,i);let s=r.querySelector(":scope > .card-collapse-toggle");s?s.querySelector(".card-collapse-icon")||(s.innerHTML='<span class="card-collapse-icon" aria-hidden="true"></span>'):(s=document.createElement("button"),s.type="button",s.className="card-collapse-toggle",s.setAttribute("aria-label","Toggle card"),s.innerHTML='<span class="card-collapse-icon" aria-hidden="true"></span>',r.appendChild(s));const o=iS(e,t),c=localStorage.getItem(o)==="1";au(e,s,o,c),s.addEventListener("click",()=>{const l=!e.classList.contains("card-collapsed");au(e,s,o,l)})})}async function Yf(){if(pe(`Connecting to ${a.moonrakerUrl}`,"info"),ke.info("Connecting to Moonraker.",{baseUrl:a.moonrakerUrl}),la(),da(),ua(),aa(),qd(),mv(),Fv(),bv(),Tv(),a.client?.ws&&a.client.ws.readyState<=1)try{a.client.ws.close(),ke.debug("Closed previous websocket before reconnect.")}catch(n){const e=n?.message||String(n);pe(`Previous websocket close failed: ${e}`,"warn"),ke.warn("Previous websocket close failed.",{error:e})}a.client=new Rh(a.moonrakerUrl),ba("connecting"),a.client.onConnectionState(n=>{if(ba(n),n==="connected"){pe("Moonraker connected.","info"),cv(),pv(),Dv(),qd(),Uy(),My(),Lc({fetchStatic:!0}),Tr({forceRefresh:!1,source:"connect"}),dl({source:"connect",silent:!0}),ls({source:"connect",silent:!0}),ke.info("Moonraker websocket connected.");return}if(n==="disconnected"){pe("Moonraker disconnected.","warn"),la(),da(),ua(),aa(),a.machineLoads.lastError="Moonraker disconnected.",a.updateManager.lastError="Moonraker disconnected.",a.updateManager.statusMessage="",a.endstops.queryInFlight=!1,a.logFiles.isLoading=!1,a.logFiles.actionInFlight=!1,a.jobs.isLoading=!1,a.jobs.actionInFlight=!1,si(),qt(),Tn(),Pt(),Be(),ke.warn("Moonraker websocket disconnected.");return}if(n==="error"){pe("Moonraker websocket error.","error"),la(),da(),ua(),aa(),a.machineLoads.lastError="Moonraker websocket error.",a.updateManager.lastError="Moonraker websocket error.",a.updateManager.statusMessage="",a.endstops.queryInFlight=!1,a.logFiles.isLoading=!1,a.logFiles.actionInFlight=!1,a.jobs.isLoading=!1,a.jobs.actionInFlight=!1,si(),qt(),Tn(),Pt(),Be(),ke.error("Moonraker websocket error.");return}ke.debug("Moonraker connection status update.",{status:n})}),a.client.onMessage(n=>{if(a.console.rawOutput)try{pe(JSON.stringify(n),"debug",{label:"RAW",consoleType:"system"})}catch{pe(String(n),"debug",{label:"RAW",consoleType:"system"})}if(n.method==="notify_gcode_response"){const[e]=n.params||[];nl(e).forEach(t=>{const i=t.startsWith("!!")||/^error\b/i.test(t);pe(t,i?"error":"info",{label:i?"ERROR":"RESPONSE",consoleType:i?"error":"response"})});return}if(n.method==="notify_gcode_store"){const e=Fy(n);e.length&&Pf(e);return}if(n.method==="notify_status_update"){const[e]=n.params||[],t=e?.print_stats||{},i=Tc(e?.virtual_sdcard||null);Cc(i),wc(t,e?.gcode_move||null,e?.motion_report||null),Rc(e);const r=t.state||t.status;r&&rr(r);const s=e?.extruder||{},o=e?.heater_bed||{};ke.debug("Status update received.",{printerState:r||null,progress:a.printStatus.lastVirtualSd?.progress??null,hotend:s.temperature??null,hotendTarget:s.target??null,bed:o.temperature??null,bedTarget:o.target??null});return}if(n.method==="notify_update_response"){Bv(n);return}n.method==="notify_update_refreshed"&&Gv(n)}),a.client.connectWebSocket();try{const e=(await a.client.call("/printer/objects/query?print_stats&gcode_move&virtual_sdcard&motion_report"))?.result?.status||{},t=e.print_stats||{},i=e.gcode_move||null,r=e.motion_report||null,s=Tc(e.virtual_sdcard||null);Cc(s);const o=t.state||t.status||"ready";rr(o),wc(t,i,r),ke.debug("Initial printer state loaded.",{printerState:o})}catch(n){const e=n?.message||String(n);pe(`Printer state load failed: ${e}`,"error"),ke.error("Printer state load failed.",{error:e})}try{const e=(await a.client.call("/printer/objects/query?extruder&heater_bed"))?.result?.status||{};Rc(e)}catch(n){const e=n?.message||String(n);pe(`Temperature load failed: ${e}`,"warn"),ke.warn("Temperature load failed.",{error:e})}try{await Lc({fetchStatic:!0})}catch(n){const e=n?.message||String(n);a.machineLoads.lastError=e,si(),ke.debug("Initial machine loads snapshot failed.",{error:e})}try{const e=(await a.client.getMacros())?.result?.status?.configfile?.settings||{},t=Object.keys(e).filter(i=>i.startsWith("gcode_macro "));aS(t),ke.info("Macros loaded.",{count:t.length})}catch(n){const e=n?.message||String(n);pe(`Macro load failed: ${e}`,"error"),ke.error("Macro load failed.",{error:e})}try{const n=await li({source:"connect",silent:!0});ke.info("Print files loaded.",{count:n.length})}catch(n){const e=n?.message||String(n);pe(`Print files load failed: ${e}`,"error"),ke.error("Print files load failed.",{error:e})}await Ui({preserveSelection:!0})}function ou(n,e){if(n){if(n.innerHTML="",!e.length){const t=document.createElement("p");t.className="muted",t.textContent="No macros found.",n.appendChild(t);return}e.forEach(t=>{const i=t.replace("gcode_macro ",""),r=document.createElement("button");r.type="button",r.className="macro-action-btn",r.textContent=i,r.title=i,r.addEventListener("click",async()=>{await ii(i,{actionLabel:`Macro ${i}`})}),n.appendChild(r)})}}function aS(n){ou(u.macroList,n),ou(u.dashboardMacroList,n)}function ut(n){return String(n||"").trim().replace(/\\/g,"/").replace(/^\/+/,"").replace(/^gcodes\//i,"").replace(/\/+$/,"")}function ya(n){const e=ut(n);if(!e)return"";const t=e.split("/").filter(Boolean);return t.length<=1?"":t.slice(0,-1).join("/")}function Di(n){const e=ut(n);if(!e)return"";const t=e.split("/").filter(Boolean);return t.length?t[t.length-1]:e}function Dt(n,e="info"){u.prettyGcodeStatus&&(u.prettyGcodeStatus.textContent=String(n||"").trim(),u.prettyGcodeStatus.dataset.level=e)}function bn(){return a.prettyGcode.sourceMode==="simulation"}function Fi(n){const e=Number(n);return Number.isFinite(e)?Math.max(0,Math.min(1,e)):0}function pl(n,e){const t=Math.max(0,Number(n)||0),i=Math.max(0,Number(e)||0),r=t*Nb+i*30;return Math.max(Sr,Math.min(Fb,r))}function Kf(){ra&&(clearInterval(ra),ra=null)}function yn({render:n=!0}={}){a.prettyGcode.simulationPlaying=!1,a.prettyGcode.simulationLastTickMs=null,Kf(),n&&mt()&&et()}function oS(n=a.prettyGcode.simulationProgress){const e=Array.isArray(a.prettyGcode.segments)?a.prettyGcode.segments:[];if(!e.length)return{x:null,y:null,z:null};const t=Fi(n),i=Array.isArray(a.prettyGcode.extrudingSegmentIndices)?a.prettyGcode.extrudingSegmentIndices:[];if(i.length){if(t<=0){const l=e[i[0]]||e[0];return{x:Number.isFinite(l?.x1)?l.x1:null,y:Number.isFinite(l?.y1)?l.y1:null,z:Number.isFinite(l?.z)?l.z:null}}const o=Math.max(0,Math.min(i.length-1,Math.round(t*(i.length-1)))),c=e[i[o]];if(c)return{x:Number.isFinite(c.x2)?c.x2:null,y:Number.isFinite(c.y2)?c.y2:null,z:Number.isFinite(c.z)?c.z:null}}const r=Math.max(0,Math.min(e.length-1,Math.round(t*(e.length-1)))),s=e[r];return{x:Number.isFinite(s?.x2)?s.x2:null,y:Number.isFinite(s?.y2)?s.y2:null,z:Number.isFinite(s?.z)?s.z:null}}function cS(){return bn()?a.prettyGcode.segments.length?(a.prettyGcode.simulationProgress>=1&&(a.prettyGcode.simulationProgress=0),Kf(),a.prettyGcode.simulationPlaying=!0,a.prettyGcode.simulationLastTickMs=Date.now(),tn({skipRender:!0}),ra=setInterval(()=>{if(!bn()||!a.prettyGcode.simulationPlaying){yn({render:!1});return}const n=Date.now(),e=Number(a.prettyGcode.simulationLastTickMs)||n,t=Math.max(0,n-e);a.prettyGcode.simulationLastTickMs=n;const i=Math.max(1,Number(a.prettyGcode.simulationDurationMs)||Sr),r=Math.max(.1,Number(a.prettyGcode.simulationSpeed)||1),s=t*r/i;a.prettyGcode.simulationProgress=Fi(a.prettyGcode.simulationProgress+s),tn({skipRender:!0}),a.prettyGcode.simulationProgress>=1&&yn({render:!1}),mt()&&et()},Db),mt()&&et(),!0):(Dt("No path loaded. Load a file first.","warn"),!1):(Dt("Load a file with Simulation mode before pressing Play.","warn"),!1)}function lS(){return bn()?a.prettyGcode.simulationPlaying?(yn(),!0):cS():(Dt("Load a file and enter Simulation mode to use playback controls.","warn"),!1)}function cu(n){return bn()?a.prettyGcode.segments.length?(yn({render:!1}),a.prettyGcode.simulationProgress=Fi(a.prettyGcode.simulationProgress+(Number(n)||0)),tn({skipRender:!0}),mt()&&et(),!0):(Dt("No path loaded. Load a file first.","warn"),!1):(Dt("Load a file and enter Simulation mode to use rewind or fast forward.","warn"),!1)}function dS(n){u.prettyGcodeProgress&&(u.prettyGcodeProgress.value=String(Math.round(Fi(n)*1e3)))}function uS(n,e){const t=Array.isArray(n)?n:[];if(!t.length)return{layerZValues:[],segmentLayerIndices:[],segmentExtrusionOrderInLayer:[],layerExtrusionCounts:[],layerExtrusionEndCounts:[],totalLayers:0};const i=[],r=Array.isArray(e)&&e.length?e:t.map((p,h)=>h);for(const p of r){const h=Number(p);if(!Number.isInteger(h)||h<0||h>=t.length)continue;const m=t[h],_=Number(m?.z);if(!Number.isFinite(_))continue;let b=-1;for(let x=0;x<i.length;x+=1)if(Math.abs(i[x]-_)<=Ub){b=x;break}b>=0||i.push(_)}if(!i.length)return{layerZValues:[],segmentLayerIndices:[],segmentExtrusionOrderInLayer:[],layerExtrusionCounts:[],layerExtrusionEndCounts:[],totalLayers:0};i.sort((p,h)=>p-h);const s=p=>{if(!Number.isFinite(p))return 0;let h=0,m=Number.POSITIVE_INFINITY;for(let _=0;_<i.length;_+=1){const b=Math.abs(i[_]-p);b<m&&(m=b,h=_)}return h},o=new Array(t.length).fill(0),c=new Array(t.length).fill(0),l=new Array(i.length).fill(0);t.forEach((p,h)=>{const m=s(Number(p?.z));o[h]=m,p?.extruding&&(l[m]+=1,c[h]=l[m])});const d=[];let f=0;return l.forEach(p=>{f+=Number(p)||0,d.push(f)}),{layerZValues:i,segmentLayerIndices:o,segmentExtrusionOrderInLayer:c,layerExtrusionCounts:l,layerExtrusionEndCounts:d,totalLayers:i.length}}function Pa(n){const e=Number(a.prettyGcode.totalLayers)||0;if(e<=0)return 0;const t=Number(n),i=Number.isFinite(t)?Math.round(t):0;return Math.max(0,Math.min(e-1,i))}function Jf(n=ds()){const e=Number(a.prettyGcode.totalLayers)||0;if(e<=0||e===1)return 0;const t=Fi(n),i=Array.isArray(a.prettyGcode.layerExtrusionEndCounts)?a.prettyGcode.layerExtrusionEndCounts:[],r=Math.max(0,Number(a.prettyGcode.extrusionCount)||0);if(r>0&&i.length===e){const c=Math.round(t*r);for(let l=0;l<i.length;l+=1)if(c<=i[l])return l;return e-1}const s=Array.isArray(a.prettyGcode.layerZValues)?a.prettyGcode.layerZValues:[],o=Number(a.prettyGcode.toolhead?.z);if(s.length===e&&Number.isFinite(o)){let c=0,l=Number.POSITIVE_INFINITY;for(let d=0;d<s.length;d+=1){const f=Math.abs(s[d]-o);f<l&&(l=f,c=d)}return c}return Pa(Math.round(t*(e-1)))}function Zf(n=ds()){if((Number(a.prettyGcode.totalLayers)||0)<=0)return a.prettyGcode.selectedLayerIndex=0,a.prettyGcode.layerSelectionPinned=!1,0;if(a.prettyGcode.layerSelectionPinned)return a.prettyGcode.selectedLayerIndex=Pa(a.prettyGcode.selectedLayerIndex),a.prettyGcode.selectedLayerIndex;const t=Jf(n);return a.prettyGcode.selectedLayerIndex=t,t}function lu(n,{pin:e=!0,render:t=!0}={}){if((Number(a.prettyGcode.totalLayers)||0)<=0){a.prettyGcode.selectedLayerIndex=0,a.prettyGcode.layerSelectionPinned=!1;return}a.prettyGcode.selectedLayerIndex=Pa(n),a.prettyGcode.layerSelectionPinned=!!e,t&&mt()&&et()}function fS(n=ds()){const e=Number(a.prettyGcode.totalLayers)||0,t=e>0,i=t?Zf(n):0,r=t?i+1:1;return u.prettyGcodeLayerSlider&&(u.prettyGcodeLayerSlider.min="1",u.prettyGcodeLayerSlider.max=String(Math.max(1,e)),u.prettyGcodeLayerSlider.step="1",u.prettyGcodeLayerSlider.value=String(r),u.prettyGcodeLayerSlider.disabled=!t||a.prettyGcode.isLoading,u.prettyGcodeLayerSlider.setAttribute("aria-valuenow",String(r)),u.prettyGcodeLayerSlider.setAttribute("aria-valuetext",t?`Layer ${r} of ${e}`:"No layers loaded")),u.prettyGcodeLayerTop&&(u.prettyGcodeLayerTop.textContent=t?`Layer ${e}`:"Layer --"),u.prettyGcodeLayerBottom&&(u.prettyGcodeLayerBottom.textContent="Layer 1"),i}function hS(n){if(!u.prettyGcodeFile)return;const e=String(a.prettyGcode.sourceLabel||"").trim();if(e){u.prettyGcodeFile.textContent=e;return}const t=ut(n);if(!t){u.prettyGcodeFile.textContent="No active print file.";return}u.prettyGcodeFile.textContent=`gcodes/${t}`}function pS(){const n=a.printStatus.lastGcodeMove||{},e=Array.isArray(n?.gcode_position)?n.gcode_position:[],t=An(e?.[0]??n?.position?.[0]??n?.gcode_x??n?.x),i=An(e?.[1]??n?.position?.[1]??n?.gcode_y??n?.y),r=An(e?.[2]??n?.position?.[2]??n?.gcode_z??n?.z);return{x:Number.isFinite(t)?t:null,y:Number.isFinite(i)?i:null,z:Number.isFinite(r)?r:null}}function ds(){if(bn())return Fi(a.prettyGcode.simulationProgress);const n=ut(a.prettyGcode.activeFile),e=ut(a.printStatus.lastPrintStats?.filename||a.printStatus.filename);if(!n||!e||n!==e)return 0;const t=Number(a.printStatus.lastVirtualSd?.progress);return Number.isFinite(t)?Math.max(0,Math.min(1,t)):0}function mS(n){const e=String(n||"").toLowerCase().trim();if(!e)return null;for(const t of Bb)if(e.includes(t.term))return t.featureType;return null}function ml(n){const e=String(n||"").replace(/\r/g,"").split(`
`);let t=0,i=0,r=0,s=0,o=!0,c=!0,l=lr;const d=[],f=[];let p=0,h=null,m=null,_=null,b=null;const x=(w,T)=>{!Number.isFinite(w)||!Number.isFinite(T)||(h=h===null?w:Math.min(h,w),m=m===null?w:Math.max(m,w),_=_===null?T:Math.min(_,T),b=b===null?T:Math.max(b,T))};for(const w of e){if(d.length>=Ib)break;let T=String(w||"");const L=T.indexOf(";");if(L>=0){const B=T.slice(L+1),W=mS(B);W&&(l=W),T=T.slice(0,L)}if(T=T.trim(),!T)continue;const R=T.split(/\s+/).filter(Boolean);if(!R.length)continue;const M=R[0].toUpperCase(),A={};for(let B=1;B<R.length;B+=1){const W=R[B];if(!W||W.length<2)continue;const H=W[0].toUpperCase(),X=Number(W.slice(1));Number.isFinite(X)&&(A[H]=X)}if(M==="G90"){o=!0;continue}if(M==="G91"){o=!1;continue}if(M==="M82"){c=!0;continue}if(M==="M83"){c=!1;continue}if(M==="G92"){Object.prototype.hasOwnProperty.call(A,"X")&&(t=A.X),Object.prototype.hasOwnProperty.call(A,"Y")&&(i=A.Y),Object.prototype.hasOwnProperty.call(A,"Z")&&(r=A.Z),Object.prototype.hasOwnProperty.call(A,"E")&&(s=A.E);continue}if(!["G0","G1","G2","G3"].includes(M))continue;const F=Object.prototype.hasOwnProperty.call(A,"X")?o?A.X:t+A.X:t,E=Object.prototype.hasOwnProperty.call(A,"Y")?o?A.Y:i+A.Y:i,v=Object.prototype.hasOwnProperty.call(A,"Z")?o?A.Z:r+A.Z:r,P=Object.prototype.hasOwnProperty.call(A,"E")?c?A.E:s+A.E:s;if(F!==t||E!==i){const B=P>s+1e-5,W=B?l:Ob;d.push({x1:t,y1:i,x2:F,y2:E,z:v,extruding:B,featureType:W}),x(t,i),x(F,E),B&&(p+=1,f.push(d.length-1))}t=F,i=E,r=v,s=P}return{segments:d,extrudingSegmentIndices:f,extrusionCount:p,bounds:h===null||_===null||m===null||b===null?null:{minX:h,minY:_,maxX:m,maxY:b}}}function Qf(){if(!u.prettyGcodeCanvas)return{width:0,height:0,dpr:1};const n=u.prettyGcodeCanvas.getBoundingClientRect(),e=window.devicePixelRatio||1,t=Math.max(1,Math.round(n.width*e)),i=Math.max(1,Math.round(n.height*e));return{width:Math.max(1,n.width),height:Math.max(1,n.height),dpr:e,targetWidth:t,targetHeight:i}}function gS(n,e="#94a3b8"){const t=String(n||"").trim(),i=t.match(/^rgba?\(([^)]+)\)$/i);if(i){const r=i[1].split(",").map(d=>d.trim()),s=Number(r[0]),o=Number(r[1]),c=Number(r[2]),l=r.length>3?Number(r[3]):1;if([s,o,c].every(d=>Number.isFinite(d)))return{color:new ze(`rgb(${s}, ${o}, ${c})`),opacity:Number.isFinite(l)?Math.max(0,Math.min(1,l)):1}}try{return{color:new ze(t||e),opacity:1}}catch{return{color:new ze(e),opacity:1}}}function er(n,e=1){const t=gS(n),i=Math.max(0,Math.min(1,t.opacity*e));return new Xc({color:t.color,transparent:i<.999,opacity:i})}function Wn(){fe.renderRequested=!0}function eh(){fe.geometryDirty=!0,Wn()}function du(n){n&&(n.traverse(e=>{if(e?.geometry?.dispose&&e.geometry.dispose(),!!e?.material){if(Array.isArray(e.material)){e.material.forEach(t=>t?.dispose?.());return}e.material.dispose?.()}}),n.clear())}function th(){if(!u.prettyGcodeCanvas)return!1;if(fe.scene&&fe.renderer&&fe.camera)return!0;const n=new $_({canvas:u.prettyGcodeCanvas,antialias:!0,alpha:!1,preserveDrawingBuffer:!1}),e=new $p;e.background=new ze("#050b14");const t=new an(55,1,.1,5e3);t.position.set(180,160,180);const i=new q_(t,u.prettyGcodeCanvas);i.enableDamping=!0,i.dampingFactor=.08,i.screenSpacePanning=!0,i.target.set(110,0,110),i.update(),i.addEventListener("change",()=>{fe.lastInteractionMs=Date.now(),Wn()});const r=new im(16777215,.62);e.add(r);const s=new ld(16777215,.68);s.position.set(80,220,120),e.add(s);const o=new ld(10274303,.28);o.position.set(-120,130,-100),e.add(o);const c=new ir;c.name="pretty-print-group",e.add(c);const l=new ir;l.name="pretty-mirror-group",l.scale.set(1,-1,1),e.add(l);const d=new Hu(220,22,3359061,2042167);e.add(d);const f=new cs(220,220,1,1);f.rotateX(-Math.PI/2);const p=new Pn(f,new jc({color:new ze("#0b1727"),transparent:!0,opacity:.36,depthWrite:!1,side:Mn}));p.position.y=-.05,e.add(p);const h=14,m=4,_=new Yc(m,h,22),b=new Zp({color:new ze("#f59e0b"),metalness:.42,roughness:.38,emissive:new ze("#7c2d12"),emissiveIntensity:.2}),x=new Pn(_,b);x.rotation.x=Math.PI,x.visible=!1,e.add(x),fe.renderer=n,fe.scene=e,fe.camera=t,fe.controls=i,fe.printGroup=c,fe.mirrorGroup=l,fe.bedGrid=d,fe.bedPlane=p,fe.nozzleMesh=x,fe.lastInteractionMs=Date.now(),fe.geometryDirty=!0,fe.renderRequested=!0;const g=Qf();if(n.setPixelRatio(g.dpr),n.setSize(g.width,g.height,!1),!fe.animationFrame){const w=()=>{if(fe.animationFrame=window.requestAnimationFrame(w),!mt()||!fe.renderer||!fe.scene||!fe.camera)return;let L=!1;const R=Date.now(),M=fe.controls;M&&a.prettyGcode.orbitWhenIdle&&R-fe.lastInteractionMs>kb*1e3&&(M.rotateLeft(.0036),L=!0);const A=!!M?.update?.();(L||A)&&Wn(),fe.renderRequested&&(fe.renderer.render(fe.scene,fe.camera),fe.renderRequested=!1)};w()}return!0}function xS(n){if(!fe.scene||!n)return;const e=Math.max(60,Math.abs(n.maxX-n.minX)+28),t=Math.max(60,Math.abs(n.maxY-n.minY)+28),i=(n.minX+n.maxX)*.5,r=(n.minY+n.maxY)*.5;fe.bedCenter={x:i,y:0,z:r},fe.bedSize={x:e,z:t,y:Math.max(120,e,t)},fe.bedGrid&&(fe.scene.remove(fe.bedGrid),fe.bedGrid.geometry?.dispose?.(),fe.bedGrid.material?.dispose?.());const s=Math.max(8,Math.min(70,Math.round(Math.max(e,t)/10))),o=Math.max(e,t),c=new Hu(o,s,3359061,2042167);if(c.position.set(i,0,r),fe.scene.add(c),fe.bedGrid=c,fe.bedPlane){const f=fe.bedPlane;f.scale.set(e/220,1,t/220),f.position.set(i,-.05,r)}const l=fe.camera,d=fe.controls;if(l&&d){const f=Math.max(e,t)*.9;d.target.set(i,0,r),l.position.set(i+f,Math.max(80,f*.75),r+f*.9),d.update()}}function uu(n,e,t,i){if(!Array.isArray(n)||!n.length)return null;const r=()=>{const h=new dn;return h.setAttribute("position",new Vt(n,3)),h},s=Math.floor(n.length/6),o=new Zs(r(),er(e)),c=new Zs(r(),er(t)),l=i?new Zs(r(),er(i)):null,d=o.clone();d.material=er(e,yo);const f=c.clone();f.material=er(t,yo);const p=l?l.clone():null;return p&&(p.material=er(i,yo)),{segmentCount:s,current:o,history:c,future:l,currentMirror:d,historyMirror:f,futureMirror:p}}function _S(){if(!th())return;const e=a.prettyGcode,t=Array.isArray(e.segments)?e.segments:[],i=e.bounds;if(!fe.printGroup||!fe.mirrorGroup)return;if(du(fe.printGroup),du(fe.mirrorGroup),fe.layerEntries=[],!t.length||!i){fe.geometryDirty=!1,Wn();return}xS(i);const r=Math.max(1,Number(e.totalLayers)||0),s=Array.isArray(e.segmentLayerIndices)?e.segmentLayerIndices:[],o=Array.isArray(e.segmentExtrusionOrderInLayer)?e.segmentExtrusionOrderInLayer:[],c=Number(e.totalLayers)>0&&s.length===t.length&&o.length===t.length,l=Array.from({length:r},(f,p)=>{const h=new Map;return bo.forEach(m=>{h.set(m,{positions:[],orders:[]})}),{layerIndex:p,travelPositions:[],features:h,travelPair:null,featurePairs:new Map}}),d=(f,p=!1)=>{const h=p?f.x2:f.x1,m=Number(f.z)||0,_=p?f.y2:f.y1;return{x:h,y:m,z:_}};t.forEach((f,p)=>{const h=c&&Number(s[p])||0,m=Math.max(0,Math.min(l.length-1,h)),_=l[m],b=d(f,!1),x=d(f,!0);if(!f.extruding){_.travelPositions.push(b.x,b.y,b.z,x.x,x.y,x.z);return}const g=bo.includes(f.featureType)?f.featureType:lr,w=_.features.get(g)||_.features.get(lr);w.positions.push(b.x,b.y,b.z,x.x,x.y,x.z);const T=c&&Number(o[p])||w.orders.length+1;w.orders.push(T)}),l.forEach(f=>{const p=uu(f.travelPositions,Vd.current,Vd.history,null);p&&(f.travelPair=p,fe.printGroup.add(p.current,p.history),fe.mirrorGroup.add(p.currentMirror,p.historyMirror)),bo.forEach(h=>{const m=f.features.get(h);if(!m||!m.positions.length)return;const _=zd[h]||zd[lr],b=uu(m.positions,_.current,_.history,Gb);b&&(b.orders=m.orders,f.featurePairs.set(h,b),fe.printGroup.add(b.current,b.history,b.future),fe.mirrorGroup.add(b.currentMirror,b.historyMirror,b.futureMirror))}),fe.layerEntries.push(f)}),fe.geometryDirty=!1,Wn()}function tr(n,e,t){if(!n?.geometry?.setDrawRange)return;const i=Math.max(0,Number(e)||0),r=Math.max(0,Number(t)||0);n.geometry.setDrawRange(i*2,r*2)}function bS(n){const e=a.prettyGcode,t=Zf(n),i=Math.round(n*Math.max(1,Number(e.extrusionCount)||0)),r=Array.isArray(e.layerExtrusionEndCounts)?e.layerExtrusionEndCounts:[],s=!!e.layerSelectionPinned,o=!!e.showMirror,c=t>0&&Number(r[t-1])||0,l=s?Number.POSITIVE_INFINITY:Math.max(0,i-c);fe.layerEntries.forEach(d=>{const f=d.layerIndex,p=f<t,h=f===t,m=d.travelPair;m&&(m.history.visible=p,m.historyMirror.visible=p&&o,m.current.visible=h,m.currentMirror.visible=h&&o,tr(m.history,0,m.segmentCount),tr(m.current,0,m.segmentCount)),d.featurePairs.forEach(_=>{if(p){_.history.visible=!0,_.historyMirror.visible=o,_.current.visible=!1,_.currentMirror.visible=!1,_.future.visible=!1,_.futureMirror.visible=!1,tr(_.history,0,_.segmentCount);return}if(!h){_.history.visible=!1,_.historyMirror.visible=!1,_.current.visible=!1,_.currentMirror.visible=!1,_.future.visible=!1,_.futureMirror.visible=!1;return}if(_.history.visible=!1,_.historyMirror.visible=!1,s){_.current.visible=!0,_.currentMirror.visible=o,_.future.visible=!1,_.futureMirror.visible=!1,tr(_.current,0,_.segmentCount);return}let b=0;for(let g=0;g<_.orders.length;g+=1)(Number(_.orders[g])||0)<=l&&(b+=1);const x=Math.max(0,_.segmentCount-b);_.current.visible=b>0,_.currentMirror.visible=b>0&&o,_.future.visible=x>0,_.futureMirror.visible=x>0&&o,tr(_.current,0,b),tr(_.future,b,x)})}),fe.mirrorGroup&&(fe.mirrorGroup.visible=o)}function yS(){const n=fe.nozzleMesh;if(!n)return;const e=a.prettyGcode.toolhead||{x:null,y:null,z:null};if(!!!a.prettyGcode.showNozzle||!Number.isFinite(e.x)||!Number.isFinite(e.y)){n.visible=!1;return}const i=Math.max(40,fe.bedSize.x,fe.bedSize.z),r=Math.max(8,Math.min(20,i*.055));n.scale.set(r/14,r/14,r/14),n.position.set(Number(e.x),Number(e.z)+r*.45,Number(e.y)),n.visible=!0}function Br(){if(!u.prettyGcodeCanvas||!th())return;const n=Qf();fe.renderer&&fe.camera&&(fe.renderer.setPixelRatio(n.dpr),fe.renderer.setSize(n.width,n.height,!1),fe.camera.aspect=Math.max(.1,n.width/Math.max(1,n.height)),fe.camera.updateProjectionMatrix()),fe.geometryDirty&&_S();const e=ds();bS(e),yS(),Wn()}function et(){u.prettyGcodeFollow&&(u.prettyGcodeFollow.checked=!!a.prettyGcode.followToolhead),u.prettyGcodeShowMirror&&(u.prettyGcodeShowMirror.checked=!!a.prettyGcode.showMirror),u.prettyGcodeShowNozzle&&(u.prettyGcodeShowNozzle.checked=!!a.prettyGcode.showNozzle),u.prettyGcodeOrbitIdle&&(u.prettyGcodeOrbitIdle.checked=!!a.prettyGcode.orbitWhenIdle);const n=bn(),e=Array.isArray(a.prettyGcode.segments)&&a.prettyGcode.segments.length>0;hS(a.prettyGcode.activeFile),tn({skipRender:!0});const t=ds();dS(t);const i=fS(t),r=Number(a.prettyGcode.totalLayers)||0,s=r>0?` | Layer: ${i+1}/${r}${a.prettyGcode.layerSelectionPinned?" (manual)":""}`:"";if(u.prettyGcodeMode&&(u.prettyGcodeMode.textContent=n?"Mode: Simulation":"Mode: Live"),u.prettyGcodePlayPause&&(u.prettyGcodePlayPause.textContent=a.prettyGcode.simulationPlaying?"Pause":"Play",u.prettyGcodePlayPause.disabled=!n||!e||a.prettyGcode.isLoading),u.prettyGcodeRewind&&(u.prettyGcodeRewind.disabled=!n||!e||a.prettyGcode.isLoading),u.prettyGcodeFastForward&&(u.prettyGcodeFastForward.disabled=!n||!e||a.prettyGcode.isLoading),u.prettyGcodeProgress&&(u.prettyGcodeProgress.disabled=!n||!e||a.prettyGcode.isLoading),u.prettyGcodeLive&&(u.prettyGcodeLive.disabled=!n),u.prettyGcodeLoadFile&&(u.prettyGcodeLoadFile.disabled=a.prettyGcode.isLoading),!n&&!a.client){Dt("Connect to Moonraker to use live print tracking.","warn"),Br();return}if(!n&&a.connectionStatus!=="connected"){Dt("Moonraker disconnected. Reconnect to stream live path updates.","warn"),Br();return}if(a.prettyGcode.isLoading){Dt(`Loading ${a.prettyGcode.loadingFile||"print file"}...`,"info"),Br();return}if(a.prettyGcode.lastError){Dt(`KlipperView failed: ${a.prettyGcode.lastError}`,"error"),Br();return}const o=a.prettyGcode.segments||[],c=Math.round(t*1e3)/10,l=a.prettyGcode.toolhead||{x:null,y:null},d=Number.isFinite(l.x)&&Number.isFinite(l.y)?` | Toolhead: X${l.x.toFixed(2)} Y${l.y.toFixed(2)}`:"";if(!o.length)Dt(n?"Load a GCode file and press Play to run simulation.":"No parsed path yet. Start a print or press Reload.","info");else if(n){const f=a.prettyGcode.simulationPlaying?"Playing":"Paused";Dt(`Simulation ${f} | Progress: ${c.toFixed(1)}%${s}${d}`,"info")}else Dt(`Loaded ${o.length.toLocaleString()} moves | Progress: ${c.toFixed(1)}%${s}${d}`,"info");Br()}function gl(n,e){a.prettyGcode.sourceTextLength=Number(e)||0,a.prettyGcode.segments=Array.isArray(n?.segments)?n.segments:[],a.prettyGcode.extrudingSegmentIndices=Array.isArray(n?.extrudingSegmentIndices)?n.extrudingSegmentIndices:[],a.prettyGcode.bounds=n?.bounds||null,a.prettyGcode.extrusionCount=Number(n?.extrusionCount)||0;const t=uS(a.prettyGcode.segments,a.prettyGcode.extrudingSegmentIndices);a.prettyGcode.layerZValues=t.layerZValues,a.prettyGcode.segmentLayerIndices=t.segmentLayerIndices,a.prettyGcode.segmentExtrusionOrderInLayer=t.segmentExtrusionOrderInLayer,a.prettyGcode.layerExtrusionCounts=t.layerExtrusionCounts,a.prettyGcode.layerExtrusionEndCounts=t.layerExtrusionEndCounts,a.prettyGcode.totalLayers=t.totalLayers,a.prettyGcode.layerSelectionPinned?a.prettyGcode.selectedLayerIndex=Pa(a.prettyGcode.selectedLayerIndex):a.prettyGcode.selectedLayerIndex=Jf(),eh()}function Ia(){a.prettyGcode.segments=[],a.prettyGcode.extrudingSegmentIndices=[],a.prettyGcode.bounds=null,a.prettyGcode.extrusionCount=0,a.prettyGcode.sourceTextLength=0,a.prettyGcode.layerZValues=[],a.prettyGcode.segmentLayerIndices=[],a.prettyGcode.segmentExtrusionOrderInLayer=[],a.prettyGcode.layerExtrusionCounts=[],a.prettyGcode.layerExtrusionEndCounts=[],a.prettyGcode.totalLayers=0,a.prettyGcode.selectedLayerIndex=0,a.prettyGcode.layerSelectionPinned=!1,eh()}async function vS(n){const e=n||null;if(!e)return!1;const t=String(e.name||"local-file.gcode").trim()||"local-file.gcode";yn({render:!1});const i=a.prettyGcode.parseRequestId+1;a.prettyGcode.parseRequestId=i,a.prettyGcode.isLoading=!0,a.prettyGcode.loadingFile=t,a.prettyGcode.lastError="",a.prettyGcode.sourceMode="simulation",a.prettyGcode.sourceLabel=`local/${t}`,a.prettyGcode.activeFile=t,a.prettyGcode.simulationProgress=0,a.prettyGcode.simulationPlaying=!1,a.prettyGcode.simulationLastTickMs=null,a.prettyGcode.layerSelectionPinned=!1,a.prettyGcode.selectedLayerIndex=0,et();try{const r=await e.text();if(i!==a.prettyGcode.parseRequestId)return!1;const s=ml(r);return gl(s,String(r||"").length),a.prettyGcode.simulationDurationMs=pl(s.segments.length,s.extrusionCount),a.prettyGcode.lastLoadedAtMs=Date.now(),a.prettyGcode.lastError="",tn({skipRender:!0}),!0}catch(r){const s=r?.message||String(r);return i===a.prettyGcode.parseRequestId&&(a.prettyGcode.lastError=s,Ia(),a.prettyGcode.simulationDurationMs=Sr),!1}finally{i===a.prettyGcode.parseRequestId&&(a.prettyGcode.isLoading=!1,a.prettyGcode.loadingFile="",et())}}async function SS(n){const e=ut(n);if(!e||!a.client||a.connectionStatus!=="connected")return Dt("Connect to Moonraker to load host print files.","warn"),!1;yn({render:!1});const t=a.prettyGcode.parseRequestId+1;a.prettyGcode.parseRequestId=t,a.prettyGcode.isLoading=!0,a.prettyGcode.loadingFile=e,a.prettyGcode.lastError="",a.prettyGcode.sourceMode="simulation",a.prettyGcode.sourceLabel=`gcodes/${e}`,a.prettyGcode.activeFile=e,a.prettyGcode.simulationProgress=0,a.prettyGcode.simulationPlaying=!1,a.prettyGcode.simulationLastTickMs=null,a.prettyGcode.layerSelectionPinned=!1,a.prettyGcode.selectedLayerIndex=0,mt()&&et();try{const i=await a.client.getFileText("gcodes",e);if(t!==a.prettyGcode.parseRequestId)return!1;const r=ml(i);return gl(r,String(i||"").length),a.prettyGcode.simulationDurationMs=pl(r.segments.length,r.extrusionCount),a.prettyGcode.lastLoadedAtMs=Date.now(),a.prettyGcode.lastError="",tn({skipRender:!0}),!0}catch(i){const r=i?.message||String(i);return t===a.prettyGcode.parseRequestId&&(a.prettyGcode.lastError=r,Ia(),a.prettyGcode.simulationDurationMs=Sr),!1}finally{t===a.prettyGcode.parseRequestId&&(a.prettyGcode.isLoading=!1,a.prettyGcode.loadingFile="",mt()&&et())}}async function ES(n,{force:e=!1}={}){const t=ut(n);if(!t||!a.client||a.connectionStatus!=="connected")return!1;if(yn({render:!1}),a.prettyGcode.sourceMode="live",a.prettyGcode.sourceLabel="",a.prettyGcode.simulationProgress=0,a.prettyGcode.simulationPlaying=!1,a.prettyGcode.simulationLastTickMs=null,!e&&a.prettyGcode.activeFile===t&&a.prettyGcode.isLoading&&a.prettyGcode.loadingFile===t||!e&&a.prettyGcode.activeFile===t&&!a.prettyGcode.lastError&&Number.isFinite(a.prettyGcode.lastLoadedAtMs))return!0;const i=a.prettyGcode.parseRequestId+1;a.prettyGcode.parseRequestId=i,a.prettyGcode.isLoading=!0,a.prettyGcode.loadingFile=t,a.prettyGcode.lastError="",a.prettyGcode.activeFile=t,et();try{const r=await a.client.getFileText("gcodes",t);if(i!==a.prettyGcode.parseRequestId)return!1;const s=ml(r);return gl(s,String(r||"").length),a.prettyGcode.lastLoadedAtMs=Date.now(),a.prettyGcode.lastError="",a.prettyGcode.simulationDurationMs=pl(s.segments.length,s.extrusionCount),tn({skipRender:!0}),!0}catch(r){const s=r?.message||String(r);return i===a.prettyGcode.parseRequestId&&(a.prettyGcode.lastError=s,Ia()),!1}finally{i===a.prettyGcode.parseRequestId&&(a.prettyGcode.isLoading=!1,a.prettyGcode.loadingFile="",et())}}async function Ri(n,{force:e=!1}={}){const t=ut(n);if(!t)return yn({render:!1}),a.prettyGcode.activeFile="",a.prettyGcode.sourceLabel="",Ia(),a.prettyGcode.lastLoadedAtMs=null,a.prettyGcode.lastError="",a.prettyGcode.simulationProgress=0,a.prettyGcode.simulationDurationMs=Sr,a.prettyGcode.simulationLastTickMs=null,a.prettyGcode.toolhead={x:null,y:null,z:null},mt()&&et(),!1;const i=await ES(t,{force:e});return mt()&&et(),i}async function MS(){if(bn())return a.prettyGcode.segments.length?(yn({render:!1}),a.prettyGcode.simulationProgress=0,a.prettyGcode.simulationLastTickMs=null,a.prettyGcode.layerSelectionPinned=!1,a.prettyGcode.selectedLayerIndex=0,tn({skipRender:!0}),mt()&&et(),!0):(Dt("No simulation file loaded to restart.","warn"),!1);const n=ut(a.printStatus.lastPrintStats?.filename||a.printStatus.filename||a.prettyGcode.activeFile);return n?Ri(n,{force:!0}):(Dt("No active print file to reload.","warn"),!1)}async function TS(){yn({render:!1}),a.prettyGcode.sourceMode="live",a.prettyGcode.sourceLabel="",a.prettyGcode.simulationProgress=0,a.prettyGcode.simulationLastTickMs=null,a.prettyGcode.layerSelectionPinned=!1,a.prettyGcode.selectedLayerIndex=0;const n=ut(a.printStatus.lastPrintStats?.filename||a.printStatus.filename);if(!n||!a.client||a.connectionStatus!=="connected")return await Ri(""),tn({skipRender:!0}),mt()&&et(),!1;const e=await Ri(n,{force:!0});return tn({skipRender:!0}),mt()&&et(),e}function tn({skipRender:n=!1}={}){bn()?a.prettyGcode.toolhead=oS():a.prettyGcode.toolhead=pS(),!n&&mt()&&et()}function CS(n){const e=Number(n);return!Number.isFinite(e)||e<=0?null:e>1e12?e:e*1e3}function nh(n){const e=Number(n);return!Number.isFinite(e)||e<=0?"--":new Date(e).toLocaleString()}function wS(n){const e=String(n||"").trim().toLowerCase();return e==="directory"?"directory":e==="file"?"file":""}function fu(n,e){const t=Ke(e);if(!t)return;const i=t.split("/").filter(Boolean);if(!i.length)return;let r="";i.forEach(s=>{r=r?`${r}/${s}`:s,n.add(r)})}function AS(n){const e=n?.result,t=Array.isArray(n)?n:Array.isArray(e)?e:Array.isArray(e?.files)?e.files:[],i=new Map,r=new Set;return t.forEach(o=>{if(!o)return;const c=wS(o?.type),l=typeof o=="string"?o:typeof o.path=="string"?o.path:[o.dirname,o.filename].filter(Boolean).join("/"),d=ut(l);if(!d)return;if(c==="directory"||String(l||"").trim().endsWith("/")){fu(r,d);return}const p=Number(o?.size),h=Number.isFinite(p)&&p>=0?p:0,m=CS(o?.modified??o?.mtime??o?.date??o?.time);i.set(d,{path:d,displayName:Di(d),directory:ya(d),size:h,modifiedMs:m});const _=ya(d);_&&fu(r,_)}),{files:[...i.values()].sort((o,c)=>{const l=Number(o.modifiedMs)||0,d=Number(c.modifiedMs)||0;return l!==d?d-l:o.path.localeCompare(c.path)}),directories:[...r].sort((o,c)=>o.localeCompare(c))}}function LS(n){const e=new Set((n||[]).map(t=>ut(t.path)).filter(Boolean));[...a.jobs.metadataByPath.keys()].forEach(t=>{e.has(t)||a.jobs.metadataByPath.delete(t)}),[...a.jobs.metadataLoading].forEach(t=>{e.has(t)||a.jobs.metadataLoading.delete(t)})}function RS(n){const e=Array.isArray(n?.files)?n.files:[],t=Array.isArray(n?.directories)?n.directories:[];a.jobs.files=e,a.jobs.directories=t,LS(e),a.jobs.currentDirectory=_l(a.jobs.currentDirectory)}function PS(){const n=Ke(a.jobs.currentDirectory),e=n?`${n}/`:"",t=new Map,i=[],r=o=>{const c=Ke(o);if(!c)return;const l=Di(c)||c;t.has(c)||t.set(c,{path:c,displayName:l,fileCount:0,size:0,modifiedMs:0})},s=o=>{const c=Ke(o);if(!c)return"";if(n){if(!c.startsWith(e))return"";const d=c.slice(e.length);if(!d||d.startsWith("/"))return"";const f=d.split("/")[0];return f?`${e}${f}`:""}return c.split("/")[0]||""};return(a.jobs.directories||[]).forEach(o=>{const c=s(o);!c||c===n||r(c)}),(a.jobs.files||[]).forEach(o=>{const c=ut(o.path);if(!c||n&&!c.startsWith(e))return;const l=n?c.slice(e.length):c;if(!l||l.startsWith("/"))return;const d=l.indexOf("/");if(d>=0){const f=l.slice(0,d),p=e?`${e}${f}`:f;if(!p)return;r(p);const h=t.get(p);h.fileCount+=1,h.size+=Number(o.size)||0,h.modifiedMs=Math.max(h.modifiedMs,Number(o.modifiedMs)||0);return}i.push(o)}),{directories:[...t.values()],files:i}}function IS(n){return[...n].sort((e,t)=>e.path.localeCompare(t.path))}function DS(n){const e=Er(a.jobs.sortMode),t=[...n];return t.sort((i,r)=>{if(e==="name_asc")return i.displayName.localeCompare(r.displayName)||i.path.localeCompare(r.path);if(e==="name_desc")return r.displayName.localeCompare(i.displayName)||r.path.localeCompare(i.path);if(e==="size_desc")return(Number(r.size)||0)-(Number(i.size)||0)||i.displayName.localeCompare(r.displayName);if(e==="size_asc")return(Number(i.size)||0)-(Number(r.size)||0)||i.displayName.localeCompare(r.displayName);if(e==="eta_desc"||e==="eta_asc"){const o=a.jobs.metadataByPath.get(i.path),c=a.jobs.metadataByPath.get(r.path),l=Number(o?.estimatedTime)||0,d=Number(c?.estimatedTime)||0,f=e==="eta_desc"?d-l:l-d;return f!==0?f:i.displayName.localeCompare(r.displayName)}return e==="modified_asc"?(Number(i.modifiedMs)||0)-(Number(r.modifiedMs)||0)||i.displayName.localeCompare(r.displayName):(Number(r.modifiedMs)||0)-(Number(i.modifiedMs)||0)||i.displayName.localeCompare(r.displayName)}),t}function xl(){const n=a.printStatus.lastPrintStats||{},e=u.printerState?.dataset?.state||"unknown",t=n.state||n.status||e,i=Df(t),r=ut(n.filename),s=ut(a.printStatus.filename);return{state:i,filename:r||s}}function Qt(n,e="info"){u.jobsStatus&&(u.jobsStatus.textContent=String(n||"").trim(),u.jobsStatus.dataset.level=e)}function FS(n){const e=Number(n?.estimated_time),t=Number(n?.layer_count);return{thumbnailPath:Gf(n),estimatedTime:Number.isFinite(e)&&e>0?e:null,totalLayers:Number.isFinite(t)&&t>0?Math.round(t):null,layerHeight:on(n?.layer_height),firstLayerHeight:on(n?.first_layer_height),objectHeight:on(n?.object_height),filamentTotal:on(n?.filament_total),filamentWeightTotal:on(n?.filament_weight_total),filamentType:String(n?.filament_type||"").trim(),filamentName:String(n?.filament_name||"").trim(),nozzleDiameter:on(n?.nozzle_diameter),firstLayerExtruderTemp:An(n?.first_layer_extr_temp??n?.first_layer_extruder_temp),firstLayerBedTemp:An(n?.first_layer_bed_temp),chamberTemp:An(n?.chamber_temp)}}async function hu(n){const e=ut(n);if(!(!e||!a.client)&&!a.jobs.metadataByPath.has(e)&&!a.jobs.metadataLoading.has(e)){a.jobs.metadataLoading.add(e);try{const t=await a.client.getFileMetadata(e),i=FS(t?.result||{});a.jobs.metadataByPath.set(e,i),a.printStatus.metadataByFile.has(e)||a.printStatus.metadataByFile.set(e,i)}catch{a.jobs.metadataByPath.set(e,{thumbnailPath:"",estimatedTime:null,totalLayers:null,layerHeight:null,firstLayerHeight:null,objectHeight:null,filamentTotal:null,filamentWeightTotal:null,filamentType:"",filamentName:"",nozzleDiameter:null,firstLayerExtruderTemp:null,firstLayerBedTemp:null,chamberTemp:null})}finally{a.jobs.metadataLoading.delete(e),a.activeView==="files"&&Be()}}}function _n(){localStorage.setItem(sf,Er(a.jobs.sortMode)),localStorage.setItem(af,Mr(a.jobs.typeFilter)),localStorage.setItem(of,String(a.jobs.searchQuery||"").trim()),localStorage.setItem(cf,Ke(a.jobs.currentDirectory)),localStorage.setItem(lf,JSON.stringify(wa(a.jobs.visibleColumns)))}function NS(n){const e=Ke(n);return!e||(a.jobs.directories||[]).some(t=>Ke(t)===e)?!0:(a.jobs.files||[]).some(t=>ut(t.path).startsWith(`${e}/`))}function _l(n=a.jobs.currentDirectory){let e=Ke(n);if(!e)return"";for(;e&&!NS(e);){const t=e.split("/");t.pop(),e=t.join("/")}return e}function Ic(n,{persist:e=!0}={}){a.jobs.currentDirectory=_l(n),e&&_n(),Be()}function US(){return[{menu:u.jobsSortMenu,toggle:u.jobsSortToggle},{menu:u.jobsColumnsMenu,toggle:u.jobsColumnsToggle},{menu:u.jobsFilterMenu,toggle:u.jobsFilterToggle},{menu:u.jobsAddMenu,toggle:u.jobsAddToggle}].filter(n=>n.menu&&n.toggle)}function ih(n,e,t){!n||!e||(n.hidden=!t,e.setAttribute("aria-expanded",t?"true":"false"),e.classList.toggle("is-active",t))}function kt(n=null){US().forEach(({menu:e,toggle:t})=>{e!==n&&ih(e,t,!1)})}function Ws(n,e){if(!n||!e)return;const t=n.hidden;kt(t?n:null),ih(n,e,t)}function OS(){if(!u.jobsPathDisplay)return;const n=Ke(a.jobs.currentDirectory),e=n?`/${n}`:"/";u.jobsPathDisplay.textContent=e,u.jobsPathDisplay.title=n?`gcodes/${n}`:"gcodes/"}function Cr(){return wa(a.jobs.visibleColumns)}function va(n){const e=wa(n),t=Cr();e.length===t.length&&e.every((i,r)=>i===t[r])||(a.jobs.visibleColumns=e,_n(),bl(),Be())}function pu(n,e){const t=String(n||"").trim().toLowerCase();if(!ts.includes(t))return;const i=Cr();if(e){if(i.includes(t))return;va([...i,t]);return}if(i.includes(t)){if(i.length===1){Qt("At least one file info field must remain visible.","warn"),bl();return}va(i.filter(r=>r!==t))}}function mu(n,e){const t=String(n||"").trim().toLowerCase();if(!ts.includes(t))return;const i=Number(e);if(!Number.isFinite(i)||i===0)return;const r=Cr(),s=r.indexOf(t);if(s<0)return;const o=s+(i>0?1:-1);if(o<0||o>=r.length)return;const c=[...r],[l]=c.splice(s,1);c.splice(o,0,l),va(c)}function BS(n,e,t="before"){const i=String(n||"").trim().toLowerCase(),r=String(e||"").trim().toLowerCase();if(!ts.includes(i)||!ts.includes(r)||i===r)return;const s=Cr(),o=s.indexOf(i),c=s.indexOf(r);if(o<0||c<0)return;const l=[...s];l.splice(o,1);const d=l.indexOf(r),f=t==="after"?d+1:d;l.splice(f,0,i),va(l)}function js(){u.jobsColumnsList&&u.jobsColumnsList.querySelectorAll(".jobs-columns-row").forEach(n=>{n.classList.remove("is-drop-target","is-drop-after","is-dragging"),n.removeAttribute("data-drop-position")})}function bl(){if(!u.jobsColumnsList)return;const n=Cr();u.jobsColumnsList.innerHTML="",n.forEach((t,i)=>{const r=bc.find(m=>m.key===t);if(!r)return;const s=document.createElement("div");s.className="jobs-columns-row",s.draggable=!0;const o=document.createElement("label");o.className="jobs-columns-toggle";const c=document.createElement("input");c.type="checkbox",c.checked=!0,c.addEventListener("change",()=>{pu(t,c.checked)});const l=document.createElement("span");l.textContent=r.label,o.append(c,l);const d=document.createElement("div");d.className="jobs-columns-order";const f=document.createElement("span");f.className="jobs-columns-drag-handle",f.textContent="::",f.title=`Drag ${r.label} to reorder`;const p=document.createElement("button");p.type="button",p.className="jobs-columns-order-btn",p.textContent="^",p.title=`Move ${r.label} up`,p.disabled=i===0,p.addEventListener("click",()=>{mu(t,-1)});const h=document.createElement("button");h.type="button",h.className="jobs-columns-order-btn",h.textContent="v",h.title=`Move ${r.label} down`,h.disabled=i===n.length-1,h.addEventListener("click",()=>{mu(t,1)}),s.addEventListener("dragstart",m=>{if(Zi=t,js(),s.classList.add("is-dragging"),m.dataTransfer){m.dataTransfer.effectAllowed="move";try{m.dataTransfer.setData("text/plain",t)}catch{}}}),s.addEventListener("dragover",m=>{if(!Zi||Zi===t)return;m.preventDefault();const _=s.getBoundingClientRect(),b=m.clientY>_.top+_.height/2;js(),s.classList.add("is-drop-target"),s.classList.toggle("is-drop-after",b),s.dataset.dropPosition=b?"after":"before",m.dataTransfer&&(m.dataTransfer.dropEffect="move")}),s.addEventListener("drop",m=>{m.preventDefault();const _=m.dataTransfer?.getData("text/plain")||"",b=String(Zi||_||"").trim().toLowerCase(),x=t,g=s.dataset.dropPosition==="after"?"after":"before";Zi=null,js(),BS(b,x,g)}),s.addEventListener("dragend",()=>{Zi=null,js()}),d.append(f,p,h),s.append(o,d),u.jobsColumnsList.appendChild(s)}),bc.filter(t=>!n.includes(t.key)).forEach(t=>{const i=document.createElement("div");i.className="jobs-columns-row is-hidden";const r=document.createElement("label");r.className="jobs-columns-toggle";const s=document.createElement("input");s.type="checkbox",s.checked=!1,s.addEventListener("change",()=>{pu(t.key,s.checked)});const o=document.createElement("span");o.textContent=t.label,r.append(s,o),i.append(r),u.jobsColumnsList.appendChild(i)})}function GS(){if(!u.jobsBreadcrumbs)return;const n=[],e=Ke(a.jobs.currentDirectory);if(n.push({label:"gcodes",path:""}),e){const t=e.split("/").filter(Boolean);let i="";t.forEach(r=>{i=i?`${i}/${r}`:r,n.push({label:r,path:i})})}u.jobsBreadcrumbs.innerHTML="",n.forEach((t,i)=>{const r=document.createElement("button");if(r.type="button",r.className="jobs-breadcrumb-btn",r.textContent=t.label,r.disabled=t.path===e,r.addEventListener("click",()=>{Ic(t.path)}),u.jobsBreadcrumbs.appendChild(r),i<n.length-1){const s=document.createElement("span");s.className="jobs-breadcrumb-sep",s.textContent="/",u.jobsBreadcrumbs.appendChild(s)}})}function yl(){const n=a.connectionStatus==="connected",e=a.jobs.actionInFlight,t=xl(),i=t.filename?`${_c[t.state]?.label||"Job"}: ${t.filename}`:"Printer is idle.";if(u.jobsActiveLabel&&(u.jobsActiveLabel.textContent=i),u.jobsPause&&(u.jobsPause.disabled=!n||e||t.state!=="printing"),u.jobsResume&&(u.jobsResume.disabled=!n||e||t.state!=="paused"),u.jobsCancel){const r=t.state==="printing"||t.state==="paused";u.jobsCancel.disabled=!n||e||!r}}function Gr(n){const e=Number(n);return!Number.isFinite(e)||e<=0?"--":e>=1e3?`${(e/1e3).toFixed(2)} m`:`${e.toFixed(2)} mm`}function kS(n){const e=Number(n);return!Number.isFinite(e)||e<=0?"--":e>=1e3?`${(e/1e3).toFixed(2)} kg`:`${e.toFixed(2)} g`}function To(n){const e=Number(n);return Number.isFinite(e)?`${e.toFixed(1)}C`:"--"}function zS(n,e){const t=[];return Cr().forEach(r=>{if(r==="size"){t.push(_r(n.size)||"--");return}if(r==="modified"){t.push(`Modified: ${nh(n.modifiedMs)}`);return}if(r==="eta"){const s=Number(e?.estimatedTime),o=Number.isFinite(s)&&s>0?cl(s):"--";t.push(`ETA: ${o}`);return}if(r==="total_layers"){const s=Number(e?.totalLayers),o=Number.isFinite(s)&&s>0?String(Math.round(s)):"--";t.push(`Layers: ${o}`);return}if(r==="layer_height"){t.push(`Layer H: ${Gr(e?.layerHeight)}`);return}if(r==="first_layer_height"){t.push(`First Layer H: ${Gr(e?.firstLayerHeight)}`);return}if(r==="object_height"){t.push(`Object H: ${Gr(e?.objectHeight)}`);return}if(r==="filament_length"){t.push(`Filament: ${Gr(e?.filamentTotal)}`);return}if(r==="filament_weight"){t.push(`Filament W: ${kS(e?.filamentWeightTotal)}`);return}if(r==="filament_type"){t.push(`Filament Type: ${e?.filamentType||"--"}`);return}if(r==="filament_name"){t.push(`Filament Name: ${e?.filamentName||"--"}`);return}if(r==="nozzle_diameter"){t.push(`Nozzle: ${Gr(e?.nozzleDiameter)}`);return}if(r==="first_layer_extruder_temp"){t.push(`1st Nozzle: ${To(e?.firstLayerExtruderTemp)}`);return}if(r==="first_layer_bed_temp"){t.push(`1st Bed: ${To(e?.firstLayerBedTemp)}`);return}r==="chamber_temp"&&t.push(`Chamber: ${To(e?.chamberTemp)}`)}),t.join(" | ")}function Da(n){const e=Ke(n);if(!e)return"";const t=e.split("/").filter(Boolean);return t.pop(),t.join("/")}function ln(n){const e=Ke(n);return e?`gcodes/${e}`:"gcodes/"}function rh(){if(!u.fileList)return;const n=a.connectionStatus==="connected",e=a.jobs.isLoading||a.jobs.actionInFlight,t=String(a.jobs.searchQuery||"").trim().toLowerCase(),i=Mr(a.jobs.typeFilter),r=Ke(a.jobs.currentDirectory),s=Da(r),{directories:o,files:c}=PS(),l=IS(o).filter(h=>i==="files"?!1:t?h.displayName.toLowerCase().includes(t):!0),d=DS(c).filter(h=>i==="folders"?!1:t?h.path.toLowerCase().includes(t):!0),f=!!r&&!t&&i!=="files";if(u.fileList.innerHTML="",!n){const h=document.createElement("p");h.className="muted",h.textContent="Print files are unavailable while disconnected.",u.fileList.appendChild(h);return}if(a.jobs.isLoading){const h=document.createElement("p");h.className="muted",h.textContent="Loading print files...",u.fileList.appendChild(h);return}if(!f&&!l.length&&!d.length){const h=document.createElement("p");h.className="muted",h.textContent=t?`No files or folders match "${t}".`:"No print files found in this directory.",u.fileList.appendChild(h);return}if(f){const h=document.createElement("article");h.className="jobs-entry jobs-entry-folder jobs-entry-parent";const m=document.createElement("div");m.className="jobs-entry-body";const _=document.createElement("p");_.className="jobs-entry-title",_.textContent="..";const b=document.createElement("p");b.className="jobs-entry-detail muted",b.textContent=`Up to ${ln(s)}`,m.append(_,b);const x=document.createElement("div");x.className="jobs-entry-actions";const g=document.createElement("button");g.type="button",g.className="jobs-entry-btn",g.textContent="^",g.disabled=e,g.addEventListener("click",()=>{Ic(s)}),x.append(g),h.append(m,x),u.fileList.appendChild(h)}l.forEach(h=>{const m=document.createElement("article");m.className="jobs-entry jobs-entry-folder";const _=document.createElement("div");_.className="jobs-entry-body";const b=document.createElement("p");b.className="jobs-entry-title",b.textContent=h.displayName,b.title=h.path;const x=document.createElement("p");x.className="jobs-entry-detail muted";const g=h.fileCount===1?"file":"files",w=_r(h.size)||"--",T=h.modifiedMs?nh(h.modifiedMs):"--";x.textContent=`${h.fileCount} ${g} | ${w} | Latest: ${T}`,_.append(b,x);const L=document.createElement("div");L.className="jobs-entry-actions";const R=document.createElement("button");R.type="button",R.className="jobs-entry-btn",R.textContent="Open",R.disabled=e,R.addEventListener("click",()=>{Ic(h.path)});const M=document.createElement("button");M.type="button",M.className="jobs-entry-btn",M.textContent="Rename",M.disabled=e,M.addEventListener("click",async()=>{await qS(h.path)});const A=document.createElement("button");A.type="button",A.className="jobs-entry-btn",A.textContent="Move",A.disabled=e,A.addEventListener("click",async()=>{await YS(h.path)});const F=document.createElement("button");F.type="button",F.className="jobs-entry-btn danger",F.textContent="Delete",F.disabled=e,F.addEventListener("click",async()=>{await JS(h.path)}),L.append(R,M,A,F),m.append(_,L),u.fileList.appendChild(m)});const p=ut(xl().filename);d.forEach(h=>{const m=document.createElement("article");m.className="jobs-entry jobs-entry-file",p&&p===h.path&&m.classList.add("is-active-job");const _=document.createElement("div");_.className="jobs-entry-thumb-wrap";const b=a.jobs.metadataByPath.get(h.path),x=b?.thumbnailPath||"";if(x){const P=document.createElement("img");P.className="jobs-entry-thumb",P.loading="lazy",P.alt=`Thumbnail for ${h.displayName}`,P.src=Ff(x),P.addEventListener("error",()=>{_.classList.add("is-fallback"),P.remove(),_.textContent="G"}),_.appendChild(P)}else _.classList.add("is-fallback"),_.textContent="G",a.jobs.metadataLoading.has(h.path)||hu(h.path);const g=document.createElement("div");g.className="jobs-entry-body";const w=document.createElement("p");w.className="jobs-entry-title",w.textContent=h.displayName,w.title=h.path;const T=document.createElement("p");T.className="jobs-entry-detail muted",T.textContent=zS(h,b),g.append(w,T);const L=document.createElement("div");L.className="jobs-entry-actions";const R=document.createElement("button");R.type="button",R.className="jobs-entry-btn",R.textContent=a.jobs.actionInFlight&&a.jobs.activePath===h.path&&a.jobs.actionLabel==="print"?"Printing...":"Print",R.disabled=e,R.addEventListener("click",async()=>{await ah(h.path)});const M=document.createElement("button");M.type="button",M.className="jobs-entry-btn",M.textContent=a.jobs.actionInFlight&&a.jobs.activePath===h.path&&a.jobs.actionLabel==="simulate"?"Loading...":"Simulate",M.disabled=e,M.addEventListener("click",async()=>{await ZS(h.path)});const A=document.createElement("button");A.type="button",A.className="jobs-entry-btn",A.textContent="Rename",A.disabled=e,A.addEventListener("click",async()=>{await $S(h.path)});const F=document.createElement("button");F.type="button",F.className="jobs-entry-btn",F.textContent="Move",F.disabled=e,F.addEventListener("click",async()=>{await XS(h.path)});const E=document.createElement("button");E.type="button",E.className="jobs-entry-btn",E.textContent="Download",E.disabled=e,E.addEventListener("click",async()=>{await WS(h.path)});const v=document.createElement("button");v.type="button",v.className="jobs-entry-btn danger",v.textContent="Delete",v.disabled=e,v.addEventListener("click",async()=>{await KS(h.path)}),L.append(R,M,A,F,E,v),m.append(_,g,L),u.fileList.appendChild(m),!b&&!a.jobs.metadataLoading.has(h.path)&&hu(h.path)})}function VS(){if(!u.jobsSummary)return;const n=a.jobs.files.length,e=a.jobs.directories.length,t=a.jobs.files.reduce((l,d)=>l+(Number(d.size)||0),0),i=Ke(a.jobs.currentDirectory),r=i?`gcodes/${i}`:"gcodes/",s=t>0?` | Total: ${_r(t)}`:"",o=`${n} print file${n===1?"":"s"}`,c=`${e} folder${e===1?"":"s"}`;u.jobsSummary.textContent=`${o} | ${c} in ${r}${s}`}function HS(){if(!a.client){Qt("Connect to Moonraker to manage print files.","warn");return}if(a.connectionStatus!=="connected"){Qt("Moonraker disconnected. Reconnect to manage print files.","warn");return}if(a.jobs.isLoading){Qt("Loading print files...","info");return}if(a.jobs.actionInFlight){Qt("Running print file action...","warn");return}if(a.jobs.lastError){Qt(`Print files action failed: ${a.jobs.lastError}`,"error");return}if(a.jobs.lastUpdatedMs){Qt(`Last refreshed: ${new Date(a.jobs.lastUpdatedMs).toLocaleTimeString()}`,"info");return}Qt("Press Refresh to load print files.","info")}function Be(){u.jobsSearch&&u.jobsSearch.value!==a.jobs.searchQuery&&(u.jobsSearch.value=a.jobs.searchQuery),u.jobsSort&&(u.jobsSort.value=Er(a.jobs.sortMode)),u.jobsTypeFilter&&(u.jobsTypeFilter.value=Mr(a.jobs.typeFilter));const n=a.connectionStatus==="connected",e=a.jobs.isLoading||a.jobs.actionInFlight;u.jobsRefresh&&(u.jobsRefresh.disabled=!n||e,u.jobsRefresh.classList.toggle("is-loading",a.jobs.isLoading),u.jobsRefresh.title=a.jobs.isLoading?"Loading...":"Refresh",u.jobsRefresh.setAttribute("aria-label",a.jobs.isLoading?"Loading print files":"Refresh file list")),u.jobsSortToggle&&(u.jobsSortToggle.disabled=e),u.jobsColumnsToggle&&(u.jobsColumnsToggle.disabled=e),u.jobsSearchToggle&&(u.jobsSearchToggle.disabled=e),u.jobsFilterToggle&&(u.jobsFilterToggle.disabled=e),u.jobsAddToggle&&(u.jobsAddToggle.disabled=!n||e),u.jobsUploadBtn&&(u.jobsUploadBtn.disabled=!n||e),u.jobsUploadFolderBtn&&(u.jobsUploadFolderBtn.disabled=!n||e),u.jobsUploadPrintBtn&&(u.jobsUploadPrintBtn.disabled=!n||e),u.jobsAddFileBtn&&(u.jobsAddFileBtn.disabled=!n||e),u.jobsNewFolder&&(u.jobsNewFolder.disabled=!n||e),u.jobsSearch&&(u.jobsSearch.disabled=e),(!n||e)&&(kt(),a.jobs.uploadDragDepth=0,qr(!1)),VS(),OS(),bl(),GS(),yl(),rh(),HS()}async function li({source:n="user",silent:e=!1}={}){if(!a.client||a.connectionStatus!=="connected")return Be(),[];if(a.jobs.isLoading)return a.jobs.files||[];a.jobs.isLoading=!0,a.jobs.lastError="",Be();try{const t=await a.client.getGcodeFiles(),i=AS(t);return RS(i),a.jobs.lastError="",a.jobs.lastUpdatedMs=Date.now(),_n(),n==="user"&&pe(`Loaded ${i.files.length} print file${i.files.length===1?"":"s"}.`,"info"),Be(),i.files}catch(t){const i=t?.message||String(t);return a.jobs.lastError=i,e||pe(`Print files load failed: ${i}`,"error"),Be(),[]}finally{a.jobs.isLoading=!1,Be()}}async function WS(n){const e=ut(n);if(!e||!a.client||a.connectionStatus!=="connected")return!1;a.jobs.actionInFlight=!0,a.jobs.actionLabel="download",a.jobs.activePath=e,Be();try{const t=await a.client.getFileBlob("gcodes",e),i=Di(e)||"print.gcode",r=URL.createObjectURL(t),s=document.createElement("a");return s.href=r,s.download=i,document.body.appendChild(s),s.click(),s.remove(),URL.revokeObjectURL(r),a.jobs.lastError="",pe(`Downloaded print file: ${ln(e)}`,"info"),!0}catch(t){const i=t?.message||String(t);return a.jobs.lastError=i,pe(`Print file download failed (${e}): ${i}`,"error"),!1}finally{a.jobs.actionInFlight=!1,a.jobs.actionLabel="",a.jobs.activePath="",Be()}}function sh(n){const e=String(n||"").trim();return!e||e.includes("/")||e.includes("\\")?"":e}function jS(n,e){const t=Ke(n),i=Ke(e),r=Ke(a.jobs.currentDirectory);if(!(!t||!i||!r)){if(r===t){a.jobs.currentDirectory=i,_n();return}if(r.startsWith(`${t}/`)){const s=r.slice(t.length+1);a.jobs.currentDirectory=s?`${i}/${s}`:i,_n()}}}async function Fa(n,e,{entryType:t="file",mode:i="move"}={}){const r=t==="directory"?Ke:ut,s=r(n),o=r(e);if(!s||!o||!a.client||a.connectionStatus!=="connected"||s===o)return!1;if(t==="directory"&&o.startsWith(`${s}/`))return Qt("Cannot move a folder into itself.","warn"),!1;a.jobs.actionInFlight=!0,a.jobs.actionLabel=i,a.jobs.activePath=s,Be();try{return await a.client.moveFile("gcodes",s,o),a.jobs.lastError="",t==="directory"&&jS(s,o),pe(`${i==="rename"?"Renamed":"Moved"} ${t==="directory"?"folder":"print file"}: ${ln(s)} -> ${ln(o)}`,"info"),await li({source:i,silent:!0}),!0}catch(c){const l=c?.message||String(c);return a.jobs.lastError=l,pe(`${t==="directory"?"Folder":"Print file"} ${i==="rename"?"rename":"move"} failed (${s}): ${l}`,"error"),Be(),!1}finally{a.jobs.actionInFlight=!1,a.jobs.actionLabel="",a.jobs.activePath="",Be()}}async function $S(n){const e=ut(n);if(!e)return!1;const t=Di(e)||"",i=window.prompt("Rename print file to:",t);if(i===null)return!1;const r=sh(i);if(!r)return Qt("Enter a valid file name.","warn"),!1;const s=ya(e),o=s?`${s}/${r}`:r;return Fa(e,o,{entryType:"file",mode:"rename"})}async function XS(n){const e=ut(n);if(!e)return!1;const t=Di(e);if(!t)return!1;const i=ya(e),r=window.prompt("Move print file to folder (relative to gcodes root):",i);if(r===null)return!1;const s=Ke(r),o=s?`${s}/${t}`:t;return Fa(e,o,{entryType:"file",mode:"move"})}async function qS(n){const e=Ke(n);if(!e)return!1;const t=Di(e)||"",i=window.prompt("Rename folder to:",t);if(i===null)return!1;const r=sh(i);if(!r)return Qt("Enter a valid folder name.","warn"),!1;const s=Da(e),o=s?`${s}/${r}`:r;return Fa(e,o,{entryType:"directory",mode:"rename"})}async function YS(n){const e=Ke(n);if(!e)return!1;const t=Di(e);if(!t)return!1;const i=Da(e),r=window.prompt("Move folder to destination parent (relative to gcodes root):",i);if(r===null)return!1;const s=Ke(r),o=s?`${s}/${t}`:t;return Fa(e,o,{entryType:"directory",mode:"move"})}async function KS(n){const e=ut(n);if(!e||!a.client||a.connectionStatus!=="connected"||!window.confirm(`Delete print file ${ln(e)}? This cannot be undone.`))return!1;a.jobs.actionInFlight=!0,a.jobs.actionLabel="delete",a.jobs.activePath=e,Be();try{return await a.client.deleteFile("gcodes",e),a.jobs.lastError="",pe(`Deleted print file: ${ln(e)}`,"warn"),await li({source:"delete",silent:!0}),!0}catch(i){const r=i?.message||String(i);return a.jobs.lastError=r,pe(`Print file delete failed (${e}): ${r}`,"error"),Be(),!1}finally{a.jobs.actionInFlight=!1,a.jobs.actionLabel="",a.jobs.activePath="",Be()}}async function JS(n){const e=Ke(n);if(!e||!a.client||a.connectionStatus!=="connected"||!window.confirm(`Delete folder ${ln(e)} and its contents? This cannot be undone.`))return!1;a.jobs.actionInFlight=!0,a.jobs.actionLabel="delete",a.jobs.activePath=e,Be();try{await a.client.deleteDirectory("gcodes",e,{force:!0});const i=Ke(a.jobs.currentDirectory);return(i===e||i.startsWith(`${e}/`))&&(a.jobs.currentDirectory=Da(e),_n()),a.jobs.lastError="",pe(`Deleted folder: ${ln(e)}`,"warn"),await li({source:"delete",silent:!0}),!0}catch(i){const r=i?.message||String(i);return a.jobs.lastError=r,pe(`Folder delete failed (${e}): ${r}`,"error"),Be(),!1}finally{a.jobs.actionInFlight=!1,a.jobs.actionLabel="",a.jobs.activePath="",Be()}}async function ZS(n){const e=ut(n);if(!e||!a.client||a.connectionStatus!=="connected")return!1;a.jobs.actionInFlight=!0,a.jobs.actionLabel="simulate",a.jobs.activePath=e,Be();try{return await SS(e)?(a.jobs.lastError="",pe(`Loaded simulation file: ${ln(e)}`,"info"),await Fc("pretty-gcode"),!0):(a.jobs.lastError=a.prettyGcode.lastError||"Failed to load simulation file.",Be(),!1)}catch(t){const i=t?.message||String(t);return a.jobs.lastError=i,pe(`Simulation load failed (${e}): ${i}`,"error"),Be(),!1}finally{a.jobs.actionInFlight=!1,a.jobs.actionLabel="",a.jobs.activePath="",Be()}}async function ah(n){const e=ut(n);if(!e||!a.client||a.connectionStatus!=="connected")return!1;const t=xl();if((t.state==="printing"||t.state==="paused")&&!window.confirm(`A job is currently ${t.state}. Start ${ln(e)} anyway?`))return!1;a.jobs.actionInFlight=!0,a.jobs.actionLabel="print",a.jobs.activePath=e,Be();try{return await a.client.startPrint(e),a.jobs.lastError="",pe(`Started print: ${ln(e)}`,"info"),!0}catch(r){const s=r?.message||String(r);return a.jobs.lastError=s,pe(`Start print failed (${e}): ${s}`,"error"),!1}finally{a.jobs.actionInFlight=!1,a.jobs.actionLabel="",a.jobs.activePath="",Be()}}function QS(n){return String(n?.webkitRelativePath||n?.name||"").trim().replace(/\\/g,"/").replace(/^\/+/,"").replace(/\/+/g,"/")}function eE(n){const e=Ke(n);if(!e)return{directory:"",filename:""};const t=e.split("/").filter(Boolean),i=t.pop()||"";return{directory:t.join("/"),filename:i}}function tE(n){const e=String(n?.message||"").toLowerCase(),t=Number(n?.status);return e.includes("exist")||e.includes("already")||t===409}async function nE(n){const e=Ke(n);if(!e||!a.client)return;const t=e.split("/").filter(Boolean);let i="";for(const r of t){i=i?`${i}/${r}`:r;try{await a.client.createDirectory("gcodes",i)}catch(s){if(!tE(s))throw s}}}async function iE(n,e,t){const i=Ke(e),r=String(t||"").trim();if(!r)throw new Error("A valid file name is required for upload.");return i&&await nE(i),await a.client.uploadFile("gcodes",n,i,r),i?`${i}/${r}`:r}async function Vr(n,{preserveRelativePaths:e=!1,printAfterUpload:t=!1,mode:i="upload"}={}){if(!a.client||a.connectionStatus!=="connected")return!1;const r=Array.isArray(n)?n:[...n||[]];if(!r.length)return!1;a.jobs.actionInFlight=!0,a.jobs.actionLabel=String(i||"upload").trim()||"upload",a.jobs.activePath="",Be();let s=0;const o=[];try{const c=Ke(a.jobs.currentDirectory);for(const l of r){const d=e?QS(l):Ke(l?.name||""),{directory:f,filename:p}=eE(d);if(!p)continue;const h=e?Ke([c,f].filter(Boolean).join("/")):c,m=await iE(l,h,p);o.push(m),s+=1}if(!s)throw new Error("No valid files were selected for upload.");return a.jobs.lastError="",pe(`Uploaded ${s} file${s===1?"":"s"}.`,"info"),await li({source:"upload",silent:!0}),t&&o.length&&await ah(o[0]),!0}catch(c){const l=c?.message||String(c);return a.jobs.lastError=l,pe(`Print file upload failed: ${l}`,"error"),Be(),!1}finally{a.jobs.actionInFlight=!1,a.jobs.actionLabel="",a.jobs.activePath="",a.jobs.uploadDragDepth=0,u.jobsCard?.classList.remove("is-drag-over"),Be()}}async function rE(){if(!a.client||a.connectionStatus!=="connected")return!1;const e=window.prompt("Enter the new folder name (relative to current directory):","new-folder");if(e===null)return!1;const t=Ke(e);if(!t)return Qt("Enter a valid folder name.","warn"),!1;const i=Ke(a.jobs.currentDirectory),r=i?`${i}/${t}`:t;a.jobs.actionInFlight=!0,a.jobs.actionLabel="mkdir",a.jobs.activePath=r,Be();try{return await a.client.createDirectory("gcodes",r),a.jobs.lastError="",pe(`Created folder: ${ln(r)}`,"info"),a.jobs.currentDirectory=Ke(r),_n(),await li({source:"mkdir",silent:!0}),!0}catch(s){const o=s?.message||String(s);return a.jobs.lastError=o,pe(`Create folder failed (${r}): ${o}`,"error"),Be(),!1}finally{a.jobs.actionInFlight=!1,a.jobs.actionLabel="",a.jobs.activePath="",Be()}}function Dc(n){return n?Array.from(n.types||[]).includes("Files"):!1}function qr(n){u.jobsCard&&u.jobsCard.classList.toggle("is-drag-over",!!n)}async function sE(n){if(!a.client||a.connectionStatus!=="connected"||!Dc(n.dataTransfer))return;n.preventDefault(),a.jobs.uploadDragDepth=0,qr(!1);const e=[...n.dataTransfer?.files||[]];e.length&&await Vr(e,{mode:"drop-upload"})}async function Co(n){if(!a.client||a.connectionStatus!=="connected")return!1;const e=String(n||"").trim().toLowerCase();if(!["pause","resume","cancel"].includes(e))return!1;const t=e==="cancel"?"cancel":e;a.jobs.actionInFlight=!0,a.jobs.actionLabel=t,a.jobs.activePath="",Be();try{if(e==="pause")await a.client.pausePrint();else if(e==="resume")await a.client.resumePrint();else{if(!window.confirm("Cancel the active print job?"))return!1;await a.client.cancelPrint()}return a.jobs.lastError="",pe(`Job action sent: ${e.toUpperCase()}`,"info"),!0}catch(i){const r=i?.message||String(i);return a.jobs.lastError=r,pe(`Job action failed (${e}): ${r}`,"error"),!1}finally{a.jobs.actionInFlight=!1,a.jobs.actionLabel="",a.jobs.activePath="",Be()}}function us(n){return String(n||"").trim().replace(/\\/g,"/").replace(/^\/+/,"").replace(/^config\//i,"")}function oh(n){const e=us(n);if(!e)return"";const t=e.split("/").filter(Boolean);return t.length<=1?"":t.slice(0,-1).join("/")}function is(n){const e=String(n?.relativePath||n?.path||"").trim().replace(/\\/g,"/").replace(/\/+$/,"");if(!e)return"";const t=e.split("/").filter(Boolean);return t.length?t[t.length-1]:e}function _r(n){const e=Number(n);return!Number.isFinite(e)||e<0?"":e<1024?`${e} B`:e<1024*1024?`${Math.round(e/1024)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}function wr(n){const e=String(n||"").toLowerCase().trim();switch(e){case dt.EXAMPLE:case dt.LOG:case dt.BACKUP:case dt.CONFIG:case dt.DOC:return e;default:return dt.ALL}}function aE(n,e=""){const t=String(n||"").toLowerCase(),i=String(e||"").toLowerCase().trim();if(!t)return null;if(i.includes("example")||t.includes("example"))return dt.EXAMPLE;if(i==="docs"&&(t.startsWith("img/")||t.startsWith("prints/")||t.startsWith("_klipper3d/")||t.startsWith("_kliper3d/")))return dt.DOC;const s=t.split("/").pop()||t,o=/^printer-\d{8}_\d{6}\.cfg$/i.test(s),c=/^crowsnest\.conf\.\d{4}-\d{2}-\d{2}-\d{4}$/i.test(s);return o||c||/\.bak(?:$|[._-]|\d)/i.test(t)||/\.bkp(?:$|[._-]|\d)/i.test(t)?dt.BACKUP:/\.log(?:$|[._-]|\d)/i.test(t)?dt.LOG:/\.(conf|cfg|config)$/i.test(t)?dt.CONFIG:/\.(doc|md|txt)$/i.test(t)?dt.DOC:null}function ch(n,e){const t=String(n||"").trim().replace(/\\/g,"/").replace(/^\/+/,""),i=String(e||"").trim().replace(/^\/+/,"").replace(/\/+$/,"");if(!i)return t;const r=`${i}/`;return t.toLowerCase().startsWith(r.toLowerCase())?t.slice(r.length):t}function vl(n,e){const t=String(n||"").trim(),i=ch(e,n);return!t||!i?"":`${t}/${i}`}function di(n){const e=String(n||"").trim();return e&&a.config.files.find(t=>t.path===e)||null}function oE(n){return String(n||"").replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function wo(n,e){n&&(n.classList.toggle("is-active",!!e),n.setAttribute("aria-pressed",String(!!e)))}function Ei(){const n=!!a.config.selectedPath,e=a.configSearch.matches.length>0&&!a.configSearch.invalidRegex;if(u.configSearchInput&&(u.configSearchInput.disabled=!n),[u.configSearchPrev,u.configSearchNext].forEach(r=>{r&&(r.disabled=!n||!e)}),[u.configSearchCase,u.configSearchWord,u.configSearchRegex].forEach(r=>{r&&(r.disabled=!n)}),wo(u.configSearchCase,a.configSearch.caseSensitive),wo(u.configSearchWord,a.configSearch.wholeWord),wo(u.configSearchRegex,a.configSearch.useRegex),!u.configSearchCount)return;if(!n){u.configSearchCount.textContent="0/0";return}if(a.configSearch.invalidRegex){u.configSearchCount.textContent="Invalid";return}const t=a.configSearch.matches.length,i=a.configSearch.activeIndex;u.configSearchCount.textContent=t>0&&i>=0?`${i+1}/${t}`:`0/${t}`}function Sl({clearQuery:n=!1}={}){n&&u.configSearchInput&&(u.configSearchInput.value=""),n&&(a.configSearch.query=""),a.configSearch.matches=[],a.configSearch.activeIndex=-1,a.configSearch.invalidRegex=!1,Ei()}function cE(){if(!a.configSearch.query)return null;const n=a.configSearch.useRegex?a.configSearch.query:oE(a.configSearch.query),e=a.configSearch.wholeWord?`\\b${n}\\b`:n,t=a.configSearch.caseSensitive?"g":"gi";try{return new RegExp(e,t)}catch{return a.configSearch.invalidRegex=!0,null}}function lE(n,e){const t=[];let i=0,r;for(;(r=e.exec(n))!==null&&!(i>2e4);){i+=1;const s=String(r[0]||"");if(!s.length){e.lastIndex+=1;continue}t.push({start:r.index,end:r.index+s.length})}return t}function lh(){const n=u.configEditor;if(!n||n.disabled)return;const e=a.configSearch.matches[a.configSearch.activeIndex];e&&(n.focus(),n.setSelectionRange(e.start,e.end,"forward"))}function rs({preserveActive:n=!1,focusActive:e=!1}={}){const t=u.configEditor,i=!!a.config.selectedPath,r=String(u.configSearchInput?.value||"").trim();if(a.configSearch.query=r,a.configSearch.invalidRegex=!1,!i||!t||!r){a.configSearch.matches=[],a.configSearch.activeIndex=-1,Ei();return}const s=n&&a.configSearch.activeIndex>=0?a.configSearch.matches[a.configSearch.activeIndex]:null,o=cE();if(!o){a.configSearch.matches=[],a.configSearch.activeIndex=-1,Ei();return}const c=lE(t.value||"",o);if(a.configSearch.matches=c,!c.length){a.configSearch.activeIndex=-1,Ei();return}if(s){const l=c.findIndex(d=>d.start===s.start&&d.end===s.end);a.configSearch.activeIndex=l>=0?l:0}else{const l=Number(t.selectionStart),d=c.findIndex(f=>f.start>=l);a.configSearch.activeIndex=d>=0?d:0}Ei(),e&&lh()}function $s(n=1){if(!!!a.config.selectedPath)return;if(!a.configSearch.matches.length||a.configSearch.invalidRegex){rs({preserveActive:!1,focusActive:!0});return}const t=a.configSearch.matches.length,i=a.configSearch.activeIndex<0?0:(a.configSearch.activeIndex+n+t)%t;a.configSearch.activeIndex=i,Ei(),lh()}function Ao(n,e){a.configSearch[n]=!!e,Ei(),rs({preserveActive:!1,focusActive:!1})}function dE(){!u.configSearchInput||u.configSearchInput.disabled||(u.configSearchInput.focus(),u.configSearchInput.select())}function Je(n,e="info"){u.configStatus&&(u.configStatus.textContent=n,u.configStatus.dataset.level=e)}function Ni(n){const e=di(a.config.selectedPath),t=a.config.draftContent!==a.config.originalContent,i=e?.root==="config";a.config.isDirty=!!n&&t&&i,u.configDirtyPrompt&&(u.configDirtyPrompt.hidden=!a.config.isDirty)}function Pi(){const n=di(a.config.selectedPath),e=!!n,t=e?n.path:"";u.configCurrentFile&&(u.configCurrentFile.textContent=t||"No file selected"),u.configDownload&&(u.configDownload.hidden=!e,u.configDownload.disabled=!e),u.configDelete&&(u.configDelete.hidden=!e,u.configDelete.disabled=!e),!e&&u.configEditor&&(u.configEditor.value="",u.configEditor.disabled=!0),Ni(a.config.isDirty),e?rs({preserveActive:!1,focusActive:!1}):Sl({clearQuery:!0})}function Yr(){const n=wr(a.config.fileTypeFilter),e=String(a.config.fileSearchQuery||"").trim(),t=e.toLowerCase().split(/\s+/).filter(Boolean);a.config.fileTypeFilter=n,a.config.fileSearchQuery=e,u.configFileSearch&&u.configFileSearch.value!==e&&(u.configFileSearch.value=e),Aa(),a.config.filteredFiles=a.config.files.filter(i=>{if(n!==dt.ALL&&i.fileType!==n)return!1;if(!t.length)return!0;const r=`${i.path} ${i.relativePath}`.toLowerCase();return t.every(s=>r.includes(s))}),dh()}function dh(){if(!u.configFileList)return;if(u.configFileList.innerHTML="",!a.config.filteredFiles.length){const e=document.createElement("p");e.className="muted";const t=wr(a.config.fileTypeFilter),i=String(a.config.fileSearchQuery||"").trim();if(!a.config.files.length)e.textContent="No supported files found (.conf, .cfg, .config, .log, .bak, .bkp, .doc, .md, .txt).";else if(i)if(t===dt.ALL)e.textContent=`No files match "${i}".`;else{const r=xo[t]||"files";e.textContent=`No ${r.toLowerCase()} match "${i}".`}else if(t===dt.ALL)e.textContent="No files found for the selected filters.";else{const r=xo[t]||"files";e.textContent=`No ${r.toLowerCase()} found.`}u.configFileList.appendChild(e);return}let n="";a.config.filteredFiles.forEach(e=>{if(e.fileType!==n){const s=document.createElement("p");s.className="config-file-group muted",s.textContent=xo[e.fileType]||"Files",u.configFileList.appendChild(s),n=e.fileType}const t=document.createElement("button");t.type="button",t.className="config-file-item",t.classList.toggle("active",e.path===a.config.selectedPath),t.title=e.path;const i=document.createElement("span");i.className="config-file-path",i.textContent=is(e);const r=document.createElement("span");r.className="config-file-size muted",r.textContent=_r(e.size),t.append(i,r),t.addEventListener("click",async()=>{await Sa(e.path)}),u.configFileList.appendChild(t)})}function uE(n,e="config"){const t=n?.result,i=Array.isArray(t)?t:Array.isArray(t?.files)?t.files:[],r=new Map;return i.forEach(s=>{if(!s||typeof s=="object"&&String(s.type||"").toLowerCase()==="directory")return;const o=typeof s=="string"?s:typeof s.path=="string"?s.path:[s.dirname,s.filename].filter(Boolean).join("/"),c=ch(o,e);if(!c||c.endsWith("/"))return;const l=aE(c,e);if(!l)return;const d=vl(e,c);if(!d)return;const f=Number(s?.size),p=Number.isFinite(f)&&f>=0?f:null;r.has(d)||r.set(d,{path:d,root:e,relativePath:c,size:p,fileType:l})}),[...r.values()].sort((s,o)=>{const c=xa[s.fileType]??Number.MAX_SAFE_INTEGER,l=xa[o.fileType]??Number.MAX_SAFE_INTEGER;if(c!==l)return c-l;const d=is(s).toLowerCase(),f=is(o).toLowerCase();return d!==f?d.localeCompare(f):s.path.localeCompare(o.path)})}async function fE(){if(!a.client)return[..._o];try{const e=(await a.client.getServerInfo())?.result||{},i=(Array.isArray(e.registered_directories)?e.registered_directories:[]).map(s=>String(s||"").trim()).filter(Boolean).filter(s=>!Pb.has(s)),r=[...new Set(i)];return _o.forEach(s=>{r.includes(s)||r.push(s)}),r}catch(n){return ke.debug("Config root discovery failed; using fallback roots.",{error:n?.message||String(n)}),[..._o]}}async function Ui({preserveSelection:n=!0}={}){if(!a.client)return Je("Connect to Moonraker from Settings to manage configuration files.","warn"),[];a.activeView==="configuration"&&u.configFileList&&(u.configFileList.innerHTML='<p class="muted">Loading configuration files...</p>');try{const e=await fE(),i=(await Promise.allSettled(e.map(r=>a.client.getFilesByRoot(r)))).flatMap((r,s)=>r.status!=="fulfilled"?[]:uE(r.value,e[s]));return i.sort((r,s)=>{const o=xa[r.fileType]??Number.MAX_SAFE_INTEGER,c=xa[s.fileType]??Number.MAX_SAFE_INTEGER;if(o!==c)return o-c;const l=is(r).toLowerCase(),d=is(s).toLowerCase();return l!==d?l.localeCompare(d):r.path.localeCompare(s.path)}),a.config.files=i,n&&a.config.selectedPath&&(i.some(s=>s.path===a.config.selectedPath)||(a.config.selectedPath="",a.config.originalContent="",a.config.draftContent="",Ni(!1),Aa())),Yr(),Pi(),n&&a.activeView==="configuration"&&a.config.selectedPath&&!a.config.originalContent&&!a.config.draftContent&&await uh(a.config.selectedPath),Je(`Loaded ${i.length} supported file${i.length===1?"":"s"}.`),i}catch(e){const t=e?.message||String(e);return Je(`Failed to load configuration files: ${t}`,"error"),pe(`Config file load failed: ${t}`,"error"),ke.error("Config file load failed.",{error:t}),u.configFileList&&(u.configFileList.innerHTML=`<p class="muted">Failed to load config files: ${t}</p>`),[]}}async function uh(n){const e=di(n);if(!e||!a.client||a.config.isLoadingFile)return!1;a.config.isLoadingFile=!0,Je(`Loading ${e.path}...`),u.configEditor&&(u.configEditor.disabled=!0);try{const t=await a.client.getFileText(e.root,e.relativePath);return a.config.selectedPath=e.path,Aa(),a.config.originalContent=t,a.config.draftContent=t,u.configEditor&&(u.configEditor.value=t,u.configEditor.disabled=e.root!=="config"),Ni(!1),Pi(),dh(),Je(`Loaded ${e.path}.`),!0}catch(t){const i=t?.message||String(t);return Je(`Failed to load ${e.path}: ${i}`,"error"),pe(`Config open failed: ${i}`,"error"),ke.error("Config file load failed.",{path:e.path,error:i}),Pi(),!1}finally{a.config.isLoadingFile=!1}}function fh({notify:n=!0}={}){a.config.selectedPath&&(a.config.draftContent=a.config.originalContent,u.configEditor&&(u.configEditor.value=a.config.originalContent,u.configEditor.disabled=!1),Ni(!1),n&&(Je(`Ignored changes for ${a.config.selectedPath}.`,"warn"),pe(`Ignored unsaved changes: ${a.config.selectedPath}`,"warn")))}async function hh(){const n=di(a.config.selectedPath);if(!n||!a.client)return Je("Select a configuration file before saving.","warn"),!1;if(n.root!=="config")return Je("Save & Restart Firmware is only available for files under config/.","warn"),!1;const e=us(n.relativePath),t=u.configEditor?u.configEditor.value:a.config.draftContent;a.config.draftContent=t,Je(`Saving ${e}...`);try{return await a.client.saveConfigFileText(e,t),a.config.originalContent=t,a.config.draftContent=t,Ni(!1),Pi(),pe(`Config saved: ${e}`,"info"),Je(`Saved ${e}. Restarting firmware...`),await ii("FIRMWARE_RESTART",{actionLabel:"Firmware restart"})?Je(`Saved ${e} and requested firmware restart.`):(pe("Firmware restart failed after config save.","warn"),Je(`Saved ${e}, but firmware restart failed.`,"warn")),await Ui({preserveSelection:!0}),!0}catch(i){const r=i?.message||String(i);return pe(`Config save failed: ${r}`,"error"),Je(`Failed to save ${e}: ${r}`,"error"),ke.error("Config save failed.",{path:e,error:r}),!1}}async function El(){return!a.config.isDirty||!a.config.selectedPath?!0:window.confirm(`Unsaved changes detected in ${a.config.selectedPath}.

Press OK to Save and Restart Firmware, or Cancel to Ignore Changes.`)?hh():(fh({notify:!0}),!0)}async function Sa(n){const e=String(n||"").trim();!e||e===a.config.selectedPath||a.config.isDirty&&!await El()||await uh(e)}async function Fc(n){if(!(!n||n===a.activeView)&&!(a.activeView==="configuration"&&n!=="configuration"&&a.config.isDirty&&!await El())){if(kf(n),n==="files"){if(!a.client||a.connectionStatus!=="connected"){Be();return}!a.jobs.files.length&&!a.jobs.directories.length?await li({source:"view",silent:!0}):(a.jobs.currentDirectory=_l(a.jobs.currentDirectory),Be());return}if(n==="pretty-gcode"){if(tn({skipRender:!0}),bn()&&a.prettyGcode.segments.length){et();return}if(!a.client||a.connectionStatus!=="connected"){et();return}const e=ut(a.printStatus.lastPrintStats?.filename||a.printStatus.filename||a.prettyGcode.activeFile);if(!e){await Ri(""),et();return}await Ri(e);return}if(n==="configuration"){if(!a.client){Je("Connect to Moonraker from Settings to manage configuration files.","warn");return}if(a.config.files.length?(Yr(),Pi()):await Ui({preserveSelection:!0}),a.updateManager.lastUpdatedMs)qt();else try{await Tr({forceRefresh:!1,source:"view"})}catch{}a.connectionStatus==="connected"&&!a.endstops.lastUpdatedMs&&!a.endstops.queryInFlight?dl({source:"view",silent:!0}):Tn(),a.connectionStatus==="connected"&&!a.logFiles.lastUpdatedMs&&!a.logFiles.isLoading?ls({source:"view",silent:!0}):Pt()}}}async function hE(n){if(!n)return!1;if(!a.client)return Je("Connect to Moonraker from Settings before uploading.","warn"),!1;const e=di(a.config.selectedPath),t=e?.root==="config"?oh(e.relativePath):"";Je(`Uploading ${n.name}...`);try{await a.client.uploadFile("config",n,t,n.name),pe(`Config uploaded: ${n.name}`,"info"),await Ui({preserveSelection:!0});const i=us(t?`${t}/${n.name}`:n.name);return i&&await Sa(vl("config",i)),Je(`Uploaded ${n.name}.`),!0}catch(i){const r=i?.message||String(i);return pe(`Config upload failed: ${r}`,"error"),Je(`Failed to upload ${n.name}: ${r}`,"error"),ke.error("Config upload failed.",{filename:n.name,error:r}),!1}}function pE(n){if(!n||n.endsWith("/"))return!1;const e=n.split("/").filter(Boolean);return e.length?!e.some(t=>t==="."||t===".."):!1}function mE(){const n=di(a.config.selectedPath),e=n?.root==="config"?oh(n.relativePath):"";return e?`${e}/new-file.cfg`:"new-file.cfg"}async function gE(){if(!a.client)return Je("Connect to Moonraker from Settings before creating files.","warn"),!1;if(a.config.isDirty&&!await El())return!1;const n=mE(),e=window.prompt("Enter the new config file path (relative to config/):",n);if(e===null)return!1;const t=us(e);if(!pE(t))return Je("Enter a valid file path for the new config file.","warn"),!1;const i=vl("config",t);if(a.config.files.some(s=>s.path===i))return Je(`File already exists: ${t}`,"warn"),await Sa(i),!1;Je(`Creating ${t}...`);try{return await a.client.saveConfigFileText(t,""),pe(`Config file created: ${t}`,"info"),await Ui({preserveSelection:!0}),await Sa(i),Je(`Created ${t}.`),!0}catch(s){const o=s?.message||String(s);return pe(`Config file create failed: ${o}`,"error"),Je(`Failed to create ${t}: ${o}`,"error"),ke.error("Config file create failed.",{path:t,error:o}),!1}}async function xE(){const n=di(a.config.selectedPath);if(!n)return!1;if(!a.client)return Je("Connect to Moonraker from Settings before deleting files.","warn"),!1;if(n.root!=="config")return Je("Deleting is only available for files under config/.","warn"),!1;const e=us(n.relativePath),t=a.config.isDirty?`

Unsaved edits will be lost.`:"";if(!window.confirm(`Delete ${e}? This cannot be undone.${t}`))return!1;Je(`Deleting ${e}...`,"warn");try{return await a.client.deleteConfigFile(e),pe(`Config deleted: ${e}`,"warn"),a.config.selectedPath="",Aa(),a.config.originalContent="",a.config.draftContent="",Ni(!1),Pi(),await Ui({preserveSelection:!1}),Je(`Deleted ${e}.`),!0}catch(r){const s=r?.message||String(r);return pe(`Config delete failed: ${s}`,"error"),Je(`Failed to delete ${e}: ${s}`,"error"),ke.error("Config delete failed.",{path:e,error:s}),!1}}function _E(){const n=di(a.config.selectedPath);if(!n)return;const e=u.configEditor?u.configEditor.value:a.config.draftContent,t=n.relativePath.split("/").pop()||"config.txt",i=new Blob([e],{type:"text/plain"}),r=URL.createObjectURL(i),s=document.createElement("a");s.href=r,s.download=t,document.body.appendChild(s),s.click(),s.remove(),URL.revokeObjectURL(r),pe(`Config downloaded: ${n.path}`,"info")}async function ii(n,{actionLabel:e=n,successMessage:t=null}={}){if(!a.client)return pe(`Cannot run "${e}" while disconnected.`,"warn"),ke.warn("Skipped G-code action because client is unavailable.",{actionLabel:e,script:n}),!1;ke.info("Sending G-code action.",{actionLabel:e,script:n}),Ly(n);try{return await a.client.runGcode(n),t&&pe(t,"info"),ke.debug("G-code action completed.",{actionLabel:e}),!0}catch(i){const r=i?.message||String(i);return pe(`${e} failed: ${r}`,"error"),ke.error("G-code action failed.",{actionLabel:e,script:n,error:r}),!1}}function bE(){u.navItems.forEach(n=>{n.addEventListener("click",async()=>{await Fc(n.dataset.view)})}),u.sidebarToggle?.addEventListener("click",Wy),u.machineSideToggle?.addEventListener("click",jy),u.configRefresh?.addEventListener("click",async()=>{await Ui({preserveSelection:!0})}),u.machineUpdateRefresh?.addEventListener("click",async()=>{await Nv()}),u.machineUpdateUpgradeAll?.addEventListener("click",async()=>{window.confirm("Run Update All for every updater with available updates?")&&await jf()}),u.machineEndstopsQuery?.addEventListener("click",async()=>{await dl({source:"user"})}),u.machineLogFilesRefresh?.addEventListener("click",async()=>{await ls({source:"user"})}),u.machineLogFilesDeleteAll?.addEventListener("click",async()=>{await Mv()}),u.jobsRefresh?.addEventListener("click",async()=>{kt(),await li({source:"user"})}),u.prettyGcodeFollow?.addEventListener("change",()=>{a.prettyGcode.followToolhead=!!u.prettyGcodeFollow?.checked,et()}),u.prettyGcodeShowMirror?.addEventListener("change",()=>{a.prettyGcode.showMirror=!!u.prettyGcodeShowMirror?.checked,Wn(),mt()&&et()}),u.prettyGcodeShowNozzle?.addEventListener("change",()=>{a.prettyGcode.showNozzle=!!u.prettyGcodeShowNozzle?.checked,Wn(),mt()&&et()}),u.prettyGcodeOrbitIdle?.addEventListener("change",()=>{a.prettyGcode.orbitWhenIdle=!!u.prettyGcodeOrbitIdle?.checked,fe.lastInteractionMs=Date.now(),Wn(),mt()&&et()}),u.prettyGcodeReload?.addEventListener("click",async()=>{await MS()}),u.prettyGcodeLoadFile?.addEventListener("click",async()=>{if(!a.client||a.connectionStatus!=="connected"){Dt("Connect to Moonraker to browse host GCode files.","warn");return}await Fc("files"),Qt("Choose a GCode file and click Simulate to load it in KlipperView.","info")}),u.prettyGcodeLoadInput?.addEventListener("change",async n=>{const e=n.currentTarget,t=e?.files?.[0]||null;e.value="",t&&await vS(t)}),u.prettyGcodeLive?.addEventListener("click",async()=>{await TS()}),u.prettyGcodeRewind?.addEventListener("click",()=>{cu(-kd)}),u.prettyGcodePlayPause?.addEventListener("click",()=>{lS()}),u.prettyGcodeFastForward?.addEventListener("click",()=>{cu(kd)}),u.prettyGcodeProgress?.addEventListener("input",n=>{if(!bn())return;const e=n.currentTarget,t=Number(e?.value),i=Number.isFinite(t)?t/1e3:0;yn({render:!1}),a.prettyGcode.simulationProgress=Fi(i),a.prettyGcode.layerSelectionPinned=!1,tn({skipRender:!0}),mt()&&et()}),u.prettyGcodeLayerSlider?.addEventListener("pointerdown",()=>{u.prettyGcodeLayerSlider?.focus()}),u.prettyGcodeLayerSlider?.addEventListener("input",n=>{const e=n.currentTarget,t=Number(e?.value);Number.isFinite(t)&&(lu(t-1,{pin:!0,render:!1}),et())}),u.prettyGcodeLayerSlider?.addEventListener("keydown",n=>{if(n.key!=="ArrowUp"&&n.key!=="ArrowDown")return;n.preventDefault();const e=n.key==="ArrowUp"?1:-1,t=Number(u.prettyGcodeLayerSlider?.value||1),i=Number(u.prettyGcodeLayerSlider?.max||1),r=Math.max(1,Math.min(i,t+e));lu(r-1,{pin:!0,render:!1}),et()}),window.addEventListener("resize",()=>{mt()&&et()}),u.jobsSortToggle?.addEventListener("click",n=>{n.preventDefault(),Ws(u.jobsSortMenu,u.jobsSortToggle)}),u.jobsColumnsToggle?.addEventListener("click",n=>{n.preventDefault(),Ws(u.jobsColumnsMenu,u.jobsColumnsToggle)}),u.jobsSearchToggle?.addEventListener("click",n=>{n.preventDefault(),kt(),u.jobsSearch&&(u.jobsSearch.focus(),u.jobsSearch.select())}),u.jobsFilterToggle?.addEventListener("click",n=>{n.preventDefault(),Ws(u.jobsFilterMenu,u.jobsFilterToggle)}),u.jobsAddToggle?.addEventListener("click",n=>{n.preventDefault(),Ws(u.jobsAddMenu,u.jobsAddToggle)}),u.jobsUploadBtn?.addEventListener("click",()=>{kt(),Ur(u.jobsUploadInput)}),u.jobsUploadFolderBtn?.addEventListener("click",()=>{kt(),Ur(u.jobsUploadFolderInput)}),u.jobsUploadPrintBtn?.addEventListener("click",()=>{kt(),Ur(u.jobsUploadPrintInput)}),u.jobsAddFileBtn?.addEventListener("click",()=>{kt(),Ur(u.jobsAddFileInput)}),u.jobsUploadInput?.addEventListener("change",async n=>{const e=n.currentTarget,t=[...e?.files||[]];t.length&&(await Vr(t,{mode:"upload-files"}),e.value="")}),u.jobsUploadFolderInput?.addEventListener("change",async n=>{const e=n.currentTarget,t=[...e?.files||[]];t.length&&(await Vr(t,{preserveRelativePaths:!0,mode:"upload-folder"}),e.value="")}),u.jobsUploadPrintInput?.addEventListener("change",async n=>{const e=n.currentTarget,t=e?.files?.[0]||null;t&&(await Vr([t],{printAfterUpload:!0,mode:"upload-print"}),e.value="")}),u.jobsAddFileInput?.addEventListener("change",async n=>{const e=n.currentTarget,t=[...e?.files||[]];t.length&&(await Vr(t,{mode:"add-file"}),e.value="")}),u.jobsCard?.addEventListener("dragenter",n=>{Dc(n.dataTransfer)&&(!a.client||a.connectionStatus!=="connected"||(n.preventDefault(),a.jobs.uploadDragDepth+=1,qr(!0)))}),u.jobsCard?.addEventListener("dragover",n=>{Dc(n.dataTransfer)&&(!a.client||a.connectionStatus!=="connected"||(n.preventDefault(),n.dataTransfer.dropEffect="copy",qr(!0)))}),u.jobsCard?.addEventListener("dragleave",n=>{n.preventDefault(),a.jobs.uploadDragDepth=Math.max(0,a.jobs.uploadDragDepth-1),a.jobs.uploadDragDepth===0&&qr(!1)}),u.jobsCard?.addEventListener("drop",async n=>{await sE(n)}),u.jobsNewFolder?.addEventListener("click",async()=>{kt(),await rE()}),u.jobsSearch?.addEventListener("focus",()=>{kt()}),u.jobsSearch?.addEventListener("input",()=>{a.jobs.searchQuery=String(u.jobsSearch.value||"").trim(),_n(),Be()}),u.jobsSearch?.addEventListener("keydown",n=>{n.key==="Escape"&&(n.preventDefault(),a.jobs.searchQuery="",kt(),u.jobsSearch&&(u.jobsSearch.value="",u.jobsSearch.blur()),_n(),Be())}),u.jobsSort?.addEventListener("change",()=>{a.jobs.sortMode=Er(u.jobsSort.value),_n(),kt(),Be()}),u.jobsTypeFilter?.addEventListener("change",()=>{a.jobs.typeFilter=Mr(u.jobsTypeFilter.value),_n(),kt(),Be()}),u.jobsPause?.addEventListener("click",async()=>{await Co("pause")}),u.jobsResume?.addEventListener("click",async()=>{await Co("resume")}),u.jobsCancel?.addEventListener("click",async()=>{await Co("cancel")}),u.configSearchInput?.addEventListener("input",()=>{rs({preserveActive:!1,focusActive:!1})}),u.configSearchInput?.addEventListener("keydown",n=>{if(n.key==="Enter"){n.preventDefault(),$s(n.shiftKey?-1:1);return}n.key==="Escape"&&(n.preventDefault(),Sl({clearQuery:!0}),u.configEditor&&!u.configEditor.disabled&&u.configEditor.focus())}),u.configSearchPrev?.addEventListener("click",()=>{$s(-1)}),u.configSearchNext?.addEventListener("click",()=>{$s(1)}),u.configSearchCase?.addEventListener("click",()=>{Ao("caseSensitive",!a.configSearch.caseSensitive)}),u.configSearchWord?.addEventListener("click",()=>{Ao("wholeWord",!a.configSearch.wholeWord)}),u.configSearchRegex?.addEventListener("click",()=>{Ao("useRegex",!a.configSearch.useRegex)}),u.configUploadBtn?.addEventListener("click",()=>{Ur(u.configUploadInput)}),u.configUploadInput?.addEventListener("change",async n=>{const e=n.currentTarget,t=e?.files?.[0]||null;t&&(await hE(t),e.value="")}),u.configNewBtn?.addEventListener("click",async()=>{await gE()}),u.configDelete?.addEventListener("click",async()=>{await xE()}),u.configFilter?.addEventListener("change",()=>{a.config.fileTypeFilter=wr(u.configFilter.value),Yr()}),u.configFileSearch?.addEventListener("input",()=>{a.config.fileSearchQuery=String(u.configFileSearch.value||""),Yr()}),u.configFileSearch?.addEventListener("keydown",n=>{n.key==="Escape"&&(n.preventDefault(),u.configFileSearch.value="",a.config.fileSearchQuery="",Yr(),u.configFileSearch.blur())}),u.configDownload?.addEventListener("click",()=>{_E()}),u.configIgnoreChanges?.addEventListener("click",()=>{fh({notify:!0})}),u.configSaveRestart?.addEventListener("click",async()=>{await hh()}),u.configEditor?.addEventListener("input",()=>{if(!a.config.selectedPath)return;a.config.draftContent=u.configEditor.value;const n=a.config.draftContent!==a.config.originalContent;Ni(n),n?Je(`Unsaved changes in ${a.config.selectedPath}. Choose Ignore Changes or Save & Restart Firmware.`,"warn"):Je(`Loaded ${a.config.selectedPath}.`),rs({preserveActive:!0,focusActive:!1})}),u.configEditor?.addEventListener("keydown",n=>{if((n.ctrlKey||n.metaKey)&&n.key.toLowerCase()==="f"){n.preventDefault(),dE();return}n.key==="F3"&&(n.preventDefault(),$s(n.shiftKey?-1:1))}),u.openDashboardLayout?.addEventListener("click",zy),u.dashboardLayoutClose?.addEventListener("click",Mc),u.dashboardLayoutSave?.addEventListener("click",Vy),u.dashboardLayoutReset?.addEventListener("click",Hy),u.dashboardLayoutDialog?.addEventListener("click",n=>{n.target===u.dashboardLayoutDialog&&Mc()}),u.settingsForm.addEventListener("submit",async n=>{n.preventDefault();const e=u.moonrakerUrl.value.trim();e&&(a.moonrakerUrl=e,a.interface.theme=Ku.includes(u.interfaceTheme.value)?u.interfaceTheme.value:"ocean",a.interface.compact=u.interfaceCompact.checked,a.interface.density=Ju.includes(u.interfaceDensity.value)?u.interfaceDensity.value:"comfortable",a.dashboard.showPrintProgress=u.dashShowPrintProgress.checked,a.dashboard.showTemperatures=u.dashShowTemperatures.checked,a.dashboard.showMotion=u.dashShowMotion.checked,a.dashboard.showQuickCommands=u.dashShowQuickCommands.checked,a.dashboard.showMacros=u.dashShowMacros.checked,a.dashboard.showMainCamera=u.dashShowMainCamera.checked,a.dashboard.showToolheadCamera=u.dashShowToolheadCamera.checked,a.dashboard.showConsole=!!u.dashShowConsole?.checked,a.dashboard.showKlipperView=!!u.dashShowKlipperView?.checked,a.camera.enabled=u.cameraEnabled.checked,a.camera.url=u.cameraUrl.value.trim(),a.camera.renderMode=u.cameraRenderMode.value===mn.IFRAME?mn.IFRAME:mn.IMAGE,a.toolheadCamera.enabled=u.toolheadCameraEnabled.checked,a.toolheadCamera.url=u.toolheadCameraUrl.value.trim(),a.toolheadCamera.renderMode=u.toolheadCameraRenderMode.value===mn.IFRAME?mn.IFRAME:mn.IMAGE,localStorage.setItem("moonraker_url",a.moonrakerUrl),localStorage.setItem("interface_theme",a.interface.theme),localStorage.setItem("interface_compact",String(a.interface.compact)),localStorage.setItem("interface_density",a.interface.density),localStorage.setItem("interface_sidebar_collapsed",String(a.interface.sidebarCollapsed)),localStorage.setItem(Zc,String(a.interface.machineSideCollapsed)),localStorage.setItem("dashboard_show_print_progress",String(a.dashboard.showPrintProgress)),localStorage.setItem("dashboard_show_temperatures",String(a.dashboard.showTemperatures)),localStorage.setItem("dashboard_show_motion",String(a.dashboard.showMotion)),localStorage.setItem("dashboard_show_quick_commands",String(a.dashboard.showQuickCommands)),localStorage.setItem("dashboard_show_macros",String(a.dashboard.showMacros)),localStorage.setItem("dashboard_show_main_camera",String(a.dashboard.showMainCamera)),localStorage.setItem("dashboard_show_toolhead_camera",String(a.dashboard.showToolheadCamera)),localStorage.setItem("dashboard_show_console",String(a.dashboard.showConsole)),localStorage.setItem("dashboard_show_klipperview",String(a.dashboard.showKlipperView)),localStorage.setItem("dashboard_layout",JSON.stringify(a.dashboard.layout)),localStorage.setItem("dashboard_layout_order",JSON.stringify(_f(a.dashboard.layout))),localStorage.setItem("camera_enabled",String(a.camera.enabled)),localStorage.setItem("camera_url",a.camera.url),localStorage.setItem("camera_render_mode",a.camera.renderMode),localStorage.setItem("toolhead_camera_enabled",String(a.toolheadCamera.enabled)),localStorage.setItem("toolhead_camera_url",a.toolheadCamera.url),localStorage.setItem("toolhead_camera_render_mode",a.toolheadCamera.renderMode),Ra(),al(),ol(),zf(),pe("Settings saved.","info"),ke.info("Settings saved.",{moonrakerUrl:a.moonrakerUrl,theme:a.interface.theme,density:a.interface.density}),await Yf())}),Ct().forEach(n=>{n.form?.addEventListener("submit",async e=>{e.preventDefault();const t=String(n.input?.value||"").trim();if(!t)return;await ii(t,{actionLabel:"Console command"})&&(Cy(t),Sc(""),Wr(),n.input?.focus())}),n.clearButton?.addEventListener("click",()=>{$d()}),n.pauseButton?.addEventListener("click",()=>{py(!a.console.paused)}),n.helperToggle?.addEventListener("click",e=>{e.preventDefault(),_y(n.key)}),n.settingsToggle?.addEventListener("click",e=>{e.preventDefault(),by(n.key)}),n.helperGrid?.addEventListener("click",e=>{const t=e.target;if(!(t instanceof Element))return;const i=t.closest("[data-console-helper]");if(!i)return;const r=i.getAttribute("data-console-helper")||"";r&&(Ec(r,n.input),Wr(),n.input?.focus(),dr())}),n.hideTempsInput?.addEventListener("change",()=>{yy(!!n.hideTempsInput?.checked)}),n.rawOutputInput?.addEventListener("change",()=>{vy(!!n.rawOutputInput?.checked)}),n.autoscrollInput?.addEventListener("change",()=>{my(!!n.autoscrollInput?.checked)}),n.filterSelect?.addEventListener("change",()=>{gy(n.filterSelect?.value||"all")}),n.searchInput?.addEventListener("input",()=>{xy(n.searchInput?.value||"")}),n.input?.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="l"){e.preventDefault(),$d();return}if(e.key==="ArrowUp"&&!e.altKey&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey){e.preventDefault(),Xd(-1,n.input);return}if(e.key==="ArrowDown"&&!e.altKey&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey){e.preventDefault(),Xd(1,n.input);return}e.key==="Escape"&&(e.preventDefault(),dr(),Sc(""),Wr())})}),document.addEventListener("click",n=>{const e=n.target;if(!(e instanceof Node))return;const t=Ct().some(s=>!!s.helperToggle?.contains(e)||!!s.settingsToggle?.contains(e)),i=Ct().some(s=>!!s.helperPanel?.contains(e)||!!s.settingsPanel?.contains(e));!t&&!i&&dr(),e instanceof Element&&e.closest("#jobs-feature-panel")||kt()}),document.addEventListener("keydown",n=>{n.key==="Escape"&&kt()}),u.quickGcode.forEach(n=>{n.addEventListener("click",async()=>{const e=n.dataset.gcode;e&&await ii(e,{actionLabel:`Quick command ${e}`})})}),u.jog.forEach(n=>{n.addEventListener("click",async()=>{const e=n.dataset.jog;if(!e)return;const t=ov(e);await ii(t,{actionLabel:`Jog ${e}`})})}),u.home.addEventListener("click",async()=>{await ii("G28",{actionLabel:"Home axes"})}),u.mainCameraFullscreen.addEventListener("click",()=>ru(a.camera,"Main Camera")),u.toolheadCameraFullscreen.addEventListener("click",()=>ru(a.toolheadCamera,"Toolhead Cam")),u.cameraDialogClose.addEventListener("click",su),u.cameraDialog.addEventListener("click",n=>{n.target===u.cameraDialog&&su()})}async function yE(){u.moonrakerUrl.value=a.moonrakerUrl,u.interfaceTheme.value=a.interface.theme,u.interfaceCompact.checked=a.interface.compact,u.interfaceDensity.value=a.interface.density,u.dashShowPrintProgress.checked=a.dashboard.showPrintProgress,u.dashShowTemperatures.checked=a.dashboard.showTemperatures,u.dashShowMotion.checked=a.dashboard.showMotion,u.dashShowQuickCommands.checked=a.dashboard.showQuickCommands,u.dashShowMacros.checked=a.dashboard.showMacros,u.dashShowMainCamera.checked=a.dashboard.showMainCamera,u.dashShowToolheadCamera.checked=a.dashboard.showToolheadCamera,u.dashShowConsole&&(u.dashShowConsole.checked=a.dashboard.showConsole),u.dashShowKlipperView&&(u.dashShowKlipperView.checked=a.dashboard.showKlipperView),u.cameraEnabled.checked=a.camera.enabled,u.cameraUrl.value=a.camera.url,u.cameraRenderMode.value=a.camera.renderMode,u.toolheadCameraEnabled.checked=a.toolheadCamera.enabled,u.toolheadCameraUrl.value=a.toolheadCamera.url,u.toolheadCameraRenderMode.value=a.toolheadCamera.renderMode,u.configFilter&&(u.configFilter.value=wr(a.config.fileTypeFilter)),u.configFileSearch&&(u.configFileSearch.value=String(a.config.fileSearchQuery||"")),u.jobsSearch&&(u.jobsSearch.value=String(a.jobs.searchQuery||"")),u.jobsSort&&(u.jobsSort.value=Er(a.jobs.sortMode)),u.jobsTypeFilter&&(u.jobsTypeFilter.value=Mr(a.jobs.typeFilter)),Ct().forEach(n=>{n.autoscrollInput&&(n.autoscrollInput.checked=a.console.autoscroll),n.filterSelect&&(n.filterSelect.value=La(a.console.filter)),n.searchInput&&(n.searchInput.value=a.console.searchQuery),n.hideTempsInput&&(n.hideTempsInput.checked=a.console.hideTemps),n.rawOutputInput&&(n.rawOutputInput.checked=a.console.rawOutput)}),dr(),sa(),Wr(),ci(),kf(a.activeView),Pi(),Sl({clearQuery:!0}),Je("Connect to Moonraker from Settings to manage configuration files.","warn"),al(),sS(),si(),qt(),Tn(),Pt(),Be(),et();try{await iy()}catch(n){ke.debug("Temperature history restore failed.",{error:n?.message||String(n)})}Qv(),Ra(),ol(),zf(),bE(),Yf().catch(n=>{const e=n?.message||String(n);ke.error("Initial Moonraker connection failed.",{error:e}),ba("error"),pe(`Connect failed: ${e}`,"error")})}yE().catch(n=>{const e=n?.message||String(n);ke.error("App init failed.",{error:e}),ba("error"),pe(`Init failed: ${e}`,"error")});
