(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))i(r);new MutationObserver(r=>{for(const o of r)if(o.type==="childList")for(const a of o.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&i(a)}).observe(document,{childList:!0,subtree:!0});function t(r){const o={};return r.integrity&&(o.integrity=r.integrity),r.referrerPolicy&&(o.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?o.credentials="include":r.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function i(r){if(r.ep)return;r.ep=!0;const o=t(r);fetch(r.href,o)}})();const Wh=["debug","info","warn","error"],$l={debug:10,info:20,warn:30,error:40},jh="ui_log_level";function Nu(n){if(!n)return null;const e=String(n).trim().toLowerCase();return Wh.includes(e)?e:null}function $h(){if(typeof window>"u")return null;const n=new URLSearchParams(window.location.search||"");return Nu(n.get("log"))}function Xh(){if(typeof window>"u"||!window.localStorage)return null;try{return Nu(window.localStorage.getItem(jh))}catch{return null}}let qh=$h()||Xh()||"info";function Yh(n){return $l[n]>=$l[qh]}function vo(n,e,t,i){if(!Yh(n))return;const o=console[n==="debug"?"debug":n==="info"?"info":n==="warn"?"warn":"error"]||console.log,a=`[${e}] [${n.toUpperCase()}] ${t}`;if(typeof i>"u"){o(a);return}o(a,i)}function Uu(n){return{debug(e,t){vo("debug",n,e,t)},info(e,t){vo("info",n,e,t)},warn(e,t){vo("warn",n,e,t)},error(e,t){vo("error",n,e,t)}}}const Kh="2.0",Jh=Uu("moonraker");function En(n){return String(n||"").replace(/^\/+/,"").split("/").filter(Boolean)}function Js(n){return En(n).map(e=>encodeURIComponent(e)).join("/")}function Zh(n){const e=En(n);if(!e.length)return{directory:"",filename:""};const t=e[e.length-1];return{directory:e.slice(0,-1).join("/"),filename:t}}class Qh{constructor(e){this.baseUrl=e.replace(/\/$/,""),this.ws=null,this.requestId=0,this.wsCallbacks=new Set,this.stateCallbacks=new Set}onMessage(e){return this.wsCallbacks.add(e),()=>this.wsCallbacks.delete(e)}onConnectionState(e){return this.stateCallbacks.add(e),()=>this.stateCallbacks.delete(e)}setConnectionState(e){this.stateCallbacks.forEach(t=>t(e))}async rpc(e,t={}){const i=await fetch(`${this.baseUrl}/printer/${e}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...t})});if(!i.ok)throw new Error(`Moonraker call failed: ${e}`);return i.json()}async call(e,t={}){const i=await fetch(`${this.baseUrl}${e}`,t);if(!i.ok){const o=await i.text().catch(()=>""),a=o?`: ${o.slice(0,200)}`:"",c=new Error(`Moonraker call failed (${i.status}): ${e}${a}`);throw c.status=i.status,c}if(i.status===204)return null;const r=await i.text();if(!r)return null;try{return JSON.parse(r)}catch{return r}}connectWebSocket(){const e=this.baseUrl.replace("http://","ws://").replace("https://","wss://")+"/websocket";this.ws=new WebSocket(e),this.ws.addEventListener("open",()=>{this.setConnectionState("connected"),this.send({method:"printer.objects.subscribe",params:{objects:{print_stats:null,virtual_sdcard:null,gcode_move:null,motion_report:null,extruder:null,heater_bed:null,toolhead:null}}})}),this.ws.addEventListener("close",()=>this.setConnectionState("disconnected")),this.ws.addEventListener("error",()=>this.setConnectionState("error")),this.ws.addEventListener("message",t=>{try{const i=JSON.parse(t.data);this.wsCallbacks.forEach(r=>r(i))}catch(i){Jh.error("Invalid websocket payload",i)}})}send({method:e,params:t={}}){!this.ws||this.ws.readyState!==WebSocket.OPEN||this.ws.send(JSON.stringify({jsonrpc:Kh,method:e,params:t,id:++this.requestId}))}async runGcode(e){return this.call("/printer/gcode/script",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({script:e})})}async getMacros(){return this.call("/printer/objects/query?configfile")}async getFiles(){return this.call("/server/files/list")}async getFilesByRoot(e){const t=String(e||"").trim();if(!t)throw new Error("A file root is required.");return this.call(`/server/files/list?root=${encodeURIComponent(t)}`)}async getConfigFiles(){return this.getFilesByRoot("config")}async getLogFiles(){return this.getFilesByRoot("logs")}async getGcodeFiles(){return this.getFilesByRoot("gcodes")}async getFileMetadata(e){const t=En(e).join("/");if(!t)throw new Error("A file path is required.");return this.call(`/server/files/metadata?filename=${encodeURIComponent(t)}`)}async startPrint(e){const t=En(e).join("/");if(!t)throw new Error("A print file path is required.");const i=[{path:"/printer/print/start",method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filename:t})},{path:`/printer/print/start?filename=${encodeURIComponent(t)}`,method:"POST"}];let r=null;for(const o of i)try{if((await fetch(`${this.baseUrl}${o.path}`,{method:o.method,headers:o.headers,body:o.body})).ok)return!0;r=new Error(`Moonraker call failed: ${o.method} ${o.path}`)}catch(a){r=a}try{return await this.runGcode(`SDCARD_PRINT_FILE FILENAME="${t.replace(/\"/g,'\\"')}"`),!0}catch(o){r=o}throw r instanceof Error?r:new Error(`Failed to start print: ${t}`)}async pausePrint(){try{return await this.call("/printer/print/pause",{method:"POST"}),!0}catch{return await this.runGcode("PAUSE"),!0}}async resumePrint(){try{return await this.call("/printer/print/resume",{method:"POST"}),!0}catch{return await this.runGcode("RESUME"),!0}}async cancelPrint(){try{return await this.call("/printer/print/cancel",{method:"POST"}),!0}catch{return await this.runGcode("CANCEL_PRINT"),!0}}async getServerInfo(){return this.call("/server/info")}async getMachineSystemInfo(){return this.call("/machine/system_info")}async getMachineProcStats(){return this.call("/machine/proc_stats")}async getMcuAndSystemStats(){return this.call("/printer/objects/query?mcu&system_stats")}async getEndstopsStatus(){return this.call("/printer/query_endstops/status")}async getMachineUpdateStatus(){return this.call("/machine/update/status")}async refreshMachineUpdates(e=null){const t=e?{name:String(e).trim()}:{};return this.call("/machine/update/refresh",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)})}async upgradeMachineUpdates(e=null){const t=e?{name:String(e).trim()}:{};try{return await this.call("/machine/update/upgrade",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)})}catch(i){const r=Number(i?.status);if(!Number.isFinite(r)||![404,405,501].includes(r))throw i;const o=String(e||"").trim().toLowerCase();return o?o==="system"||o==="moonraker"||o==="klipper"?this.call(`/machine/update/${o}`,{method:"POST"}):this.call("/machine/update/client",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:o})}):this.call("/machine/update/full",{method:"POST"})}}async recoverMachineUpdater(e,{hard:t=!1}={}){const i=String(e||"").trim();if(!i)throw new Error("An updater name is required for recover.");return this.call("/machine/update/recover",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:i,hard:!!t})})}async rollbackMachineUpdater(e){const t=String(e||"").trim();if(!t)throw new Error("An updater name is required for rollback.");return this.call("/machine/update/rollback",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:t})})}async getFileText(e,t){const i=String(e||"").trim(),r=Js(t);if(!i||!r)throw new Error("A file root and path are required.");const o=await fetch(`${this.baseUrl}/server/files/${encodeURIComponent(i)}/${r}`,{cache:"no-store"});if(!o.ok)throw new Error(`Moonraker call failed: /server/files/${i}/${r}`);return o.text()}async getFileBlob(e,t){const i=String(e||"").trim(),r=Js(t);if(!i||!r)throw new Error("A file root and path are required.");const o=await fetch(`${this.baseUrl}/server/files/${encodeURIComponent(i)}/${r}`,{cache:"no-store"});if(!o.ok)throw new Error(`Moonraker call failed: /server/files/${i}/${r}`);return o.blob()}async getConfigFileText(e){return this.getFileText("config",e)}async uploadFile(e,t,i="",r=""){const o=new FormData;o.append("root",e);const a=En(i).join("/");a&&o.append("path",a);const c=r||t?.name||"upload.txt";return o.append("file",t,c),this.call("/server/files/upload",{method:"POST",body:o})}async createDirectory(e,t){const i=String(e||"").trim(),r=En(t).join("/");if(!i||!r)throw new Error("A file root and directory path are required.");const o=`${i}/${r}`,a=[{path:`/server/files/directory?path=${encodeURIComponent(o)}`,method:"POST"},{path:"/server/files/directory",method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:o})},{path:`/server/files/mkdir?path=${encodeURIComponent(o)}`,method:"POST"},{path:"/server/files/mkdir",method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:o})}];let c=null;for(const d of a)try{if((await fetch(`${this.baseUrl}${d.path}`,{method:d.method,headers:d.headers,body:d.body})).ok)return!0;c=new Error(`Moonraker call failed: ${d.method} ${d.path}`)}catch(u){c=u}throw c instanceof Error?c:new Error(`Failed to create directory: ${o}`)}async moveFile(e,t,i){const r=String(e||"").trim(),o=En(t).join("/"),a=En(i).join("/");if(!r||!o||!a)throw new Error("A file root, source path, and destination path are required.");const c=`${r}/${o}`,d=`${r}/${a}`,u=[{path:"/server/files/move",method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({source:c,dest:d})},{path:"/server/files/move",method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({source:o,dest:a,root:r})},{path:"/server/files/move",method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({src:c,dst:d})},{path:`/server/files/move?source=${encodeURIComponent(c)}&dest=${encodeURIComponent(d)}`,method:"POST"},{path:`/server/files/move?source=${encodeURIComponent(o)}&dest=${encodeURIComponent(a)}&root=${encodeURIComponent(r)}`,method:"POST"}];let f=null;for(const p of u)try{if((await fetch(`${this.baseUrl}${p.path}`,{method:p.method,headers:p.headers,body:p.body})).ok)return!0;f=new Error(`Moonraker call failed: ${p.method} ${p.path}`)}catch(h){f=h}throw f instanceof Error?f:new Error(`Failed to move path: ${c} -> ${d}`)}async deleteDirectory(e,t,{force:i=!0}={}){const r=String(e||"").trim(),o=En(t).join("/");if(!r||!o)throw new Error("A file root and directory path are required.");const a=`${r}/${o}`,c=i?"&force=true":"",d=[{path:`/server/files/directory?path=${encodeURIComponent(a)}${c}`,method:"DELETE"},{path:`/server/files/delete_directory?path=${encodeURIComponent(a)}${c}`,method:"DELETE"},{path:`/server/files/delete_directory?path=${encodeURIComponent(a)}${c}`,method:"POST"},{path:"/server/files/delete_directory",method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:a,force:!!i})},{path:"/server/files/directory",method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:a,force:!!i})},{path:"/server/files/directory",method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:a,action:"delete",force:!!i})}];let u=null;for(const f of d)try{if((await fetch(`${this.baseUrl}${f.path}`,{method:f.method,headers:f.headers,body:f.body})).ok)return!0;u=new Error(`Moonraker call failed: ${f.method} ${f.path}`)}catch(p){u=p}throw u instanceof Error?u:new Error(`Failed to delete directory: ${a}`)}async saveConfigFileText(e,t){const{directory:i,filename:r}=Zh(e);if(!r)throw new Error("A config file path is required.");const o=new Blob([t??""],{type:"text/plain"});return this.uploadFile("config",o,i.length?i:"",r)}async deleteFile(e,t){const i=String(e||"").trim(),r=En(t).join("/");if(!i||!r)throw new Error("A file root and path are required.");const o=Js(r),a=`${i}/${r}`,c=[{path:`/server/files/${encodeURIComponent(i)}/${o}`,method:"DELETE"},{path:`/server/files/${encodeURIComponent(i)}/${o}`,method:"POST"},{path:`/server/files/delete_file?path=${encodeURIComponent(r)}`,method:"DELETE"},{path:`/server/files/delete_file?path=${encodeURIComponent(a)}`,method:"DELETE"},{path:`/server/files/delete?path=${encodeURIComponent(r)}`,method:"DELETE"},{path:`/server/files/delete?path=${encodeURIComponent(a)}`,method:"DELETE"},{path:`/server/files/delete_file?path=${encodeURIComponent(r)}`,method:"POST"},{path:`/server/files/delete_file?path=${encodeURIComponent(a)}`,method:"POST"},{path:`/server/files/delete?path=${encodeURIComponent(r)}`,method:"POST"},{path:`/server/files/delete?path=${encodeURIComponent(a)}`,method:"POST"}];let d=null;for(const u of c)try{if((await fetch(`${this.baseUrl}${u.path}`,{method:u.method})).ok)return!0;d=new Error(`Moonraker call failed: ${u.method} ${u.path}`)}catch(f){d=f}throw d instanceof Error?d:new Error(`Failed to delete file: ${i}/${r}`)}async deleteConfigFile(e){return this.deleteFile("config",e)}async deleteLogFile(e){return this.deleteFile("logs",e)}}const Zc="181",lr={ROTATE:0,DOLLY:1,PAN:2},sr={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},ep=0,Xl=1,tp=2,Ou=1,np=2,kn=3,ai=0,Xt=1,Tn=2,Wn=0,dr=1,ql=2,Yl=3,Kl=4,ip=5,Si=100,rp=101,op=102,sp=103,ap=104,cp=200,lp=201,dp=202,up=203,Wa=204,ja=205,fp=206,hp=207,pp=208,mp=209,gp=210,xp=211,_p=212,bp=213,yp=214,$a=0,Xa=1,qa=2,pr=3,Ya=4,Ka=5,Ja=6,Za=7,Bu=0,Sp=1,vp=2,oi=0,Ep=1,Mp=2,Tp=3,Cp=4,wp=5,Ap=6,Lp=7,Gu=300,mr=301,gr=302,Qa=303,ec=304,Ns=306,tc=1e3,Hn=1001,nc=1002,tn=1003,Rp=1004,Eo=1005,ln=1006,Zs=1007,Ei=1008,Pn=1009,ku=1010,zu=1011,no=1012,Qc=1013,Ai=1014,Vn=1015,Er=1016,el=1017,tl=1018,io=1020,Hu=35902,Vu=35899,Wu=1021,ju=1022,_n=1023,ro=1026,oo=1027,$u=1028,nl=1029,il=1030,rl=1031,ol=1033,ts=33776,ns=33777,is=33778,rs=33779,ic=35840,rc=35841,oc=35842,sc=35843,ac=36196,cc=37492,lc=37496,dc=37808,uc=37809,fc=37810,hc=37811,pc=37812,mc=37813,gc=37814,xc=37815,_c=37816,bc=37817,yc=37818,Sc=37819,vc=37820,Ec=37821,Mc=36492,Tc=36494,Cc=36495,wc=36283,Ac=36284,Lc=36285,Rc=36286,Pp=3200,Ip=3201,Xu=0,Dp=1,ii="",sn="srgb",xr="srgb-linear",ys="linear",st="srgb",zi=7680,Jl=519,Fp=512,Np=513,Up=514,qu=515,Op=516,Bp=517,Gp=518,kp=519,Zl=35044,Ql="300 es",wn=2e3,Ss=2001;function Yu(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function vs(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function zp(){const n=vs("canvas");return n.style.display="block",n}const ed={};function td(...n){const e="THREE."+n.shift();console.log(e,...n)}function Fe(...n){const e="THREE."+n.shift();console.warn(e,...n)}function Mt(...n){const e="THREE."+n.shift();console.error(e,...n)}function so(...n){const e=n.join(" ");e in ed||(ed[e]=!0,Fe(...n))}function Hp(n,e,t){return new Promise(function(i,r){function o(){switch(n.clientWaitSync(e,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:r();break;case n.TIMEOUT_EXPIRED:setTimeout(o,t);break;default:i()}}setTimeout(o,t)})}class Ni{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){const i=this._listeners;return i===void 0?!1:i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){const i=this._listeners;if(i===void 0)return;const r=i[e];if(r!==void 0){const o=r.indexOf(t);o!==-1&&r.splice(o,1)}}dispatchEvent(e){const t=this._listeners;if(t===void 0)return;const i=t[e.type];if(i!==void 0){e.target=this;const r=i.slice(0);for(let o=0,a=r.length;o<a;o++)r[o].call(this,e);e.target=null}}}const Nt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],os=Math.PI/180,Pc=180/Math.PI;function ho(){const n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Nt[n&255]+Nt[n>>8&255]+Nt[n>>16&255]+Nt[n>>24&255]+"-"+Nt[e&255]+Nt[e>>8&255]+"-"+Nt[e>>16&15|64]+Nt[e>>24&255]+"-"+Nt[t&63|128]+Nt[t>>8&255]+"-"+Nt[t>>16&255]+Nt[t>>24&255]+Nt[i&255]+Nt[i>>8&255]+Nt[i>>16&255]+Nt[i>>24&255]).toLowerCase()}function We(n,e,t){return Math.max(e,Math.min(t,n))}function Vp(n,e){return(n%e+e)%e}function Qs(n,e,t){return(1-t)*n+t*e}function Dr(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("Invalid component type.")}}function jt(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("Invalid component type.")}}const Wp={DEG2RAD:os};class Be{constructor(e=0,t=0){Be.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,i=this.y,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6],this.y=r[1]*t+r[4]*i+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=We(this.x,e.x,t.x),this.y=We(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=We(this.x,e,t),this.y=We(this.y,e,t),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(We(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const i=this.dot(e)/t;return Math.acos(We(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const i=Math.cos(t),r=Math.sin(t),o=this.x-e.x,a=this.y-e.y;return this.x=o*i-a*r+e.x,this.y=o*r+a*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Li{constructor(e=0,t=0,i=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=r}static slerpFlat(e,t,i,r,o,a,c){let d=i[r+0],u=i[r+1],f=i[r+2],p=i[r+3],h=o[a+0],m=o[a+1],_=o[a+2],b=o[a+3];if(c<=0){e[t+0]=d,e[t+1]=u,e[t+2]=f,e[t+3]=p;return}if(c>=1){e[t+0]=h,e[t+1]=m,e[t+2]=_,e[t+3]=b;return}if(p!==b||d!==h||u!==m||f!==_){let x=d*h+u*m+f*_+p*b;x<0&&(h=-h,m=-m,_=-_,b=-b,x=-x);let g=1-c;if(x<.9995){const w=Math.acos(x),T=Math.sin(w);g=Math.sin(g*w)/T,c=Math.sin(c*w)/T,d=d*g+h*c,u=u*g+m*c,f=f*g+_*c,p=p*g+b*c}else{d=d*g+h*c,u=u*g+m*c,f=f*g+_*c,p=p*g+b*c;const w=1/Math.sqrt(d*d+u*u+f*f+p*p);d*=w,u*=w,f*=w,p*=w}}e[t]=d,e[t+1]=u,e[t+2]=f,e[t+3]=p}static multiplyQuaternionsFlat(e,t,i,r,o,a){const c=i[r],d=i[r+1],u=i[r+2],f=i[r+3],p=o[a],h=o[a+1],m=o[a+2],_=o[a+3];return e[t]=c*_+f*p+d*m-u*h,e[t+1]=d*_+f*h+u*p-c*m,e[t+2]=u*_+f*m+c*h-d*p,e[t+3]=f*_-c*p-d*h-u*m,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,r){return this._x=e,this._y=t,this._z=i,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const i=e._x,r=e._y,o=e._z,a=e._order,c=Math.cos,d=Math.sin,u=c(i/2),f=c(r/2),p=c(o/2),h=d(i/2),m=d(r/2),_=d(o/2);switch(a){case"XYZ":this._x=h*f*p+u*m*_,this._y=u*m*p-h*f*_,this._z=u*f*_+h*m*p,this._w=u*f*p-h*m*_;break;case"YXZ":this._x=h*f*p+u*m*_,this._y=u*m*p-h*f*_,this._z=u*f*_-h*m*p,this._w=u*f*p+h*m*_;break;case"ZXY":this._x=h*f*p-u*m*_,this._y=u*m*p+h*f*_,this._z=u*f*_+h*m*p,this._w=u*f*p-h*m*_;break;case"ZYX":this._x=h*f*p-u*m*_,this._y=u*m*p+h*f*_,this._z=u*f*_-h*m*p,this._w=u*f*p+h*m*_;break;case"YZX":this._x=h*f*p+u*m*_,this._y=u*m*p+h*f*_,this._z=u*f*_-h*m*p,this._w=u*f*p-h*m*_;break;case"XZY":this._x=h*f*p-u*m*_,this._y=u*m*p-h*f*_,this._z=u*f*_+h*m*p,this._w=u*f*p+h*m*_;break;default:Fe("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const i=t/2,r=Math.sin(i);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,i=t[0],r=t[4],o=t[8],a=t[1],c=t[5],d=t[9],u=t[2],f=t[6],p=t[10],h=i+c+p;if(h>0){const m=.5/Math.sqrt(h+1);this._w=.25/m,this._x=(f-d)*m,this._y=(o-u)*m,this._z=(a-r)*m}else if(i>c&&i>p){const m=2*Math.sqrt(1+i-c-p);this._w=(f-d)/m,this._x=.25*m,this._y=(r+a)/m,this._z=(o+u)/m}else if(c>p){const m=2*Math.sqrt(1+c-i-p);this._w=(o-u)/m,this._x=(r+a)/m,this._y=.25*m,this._z=(d+f)/m}else{const m=2*Math.sqrt(1+p-i-c);this._w=(a-r)/m,this._x=(o+u)/m,this._y=(d+f)/m,this._z=.25*m}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<1e-8?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(We(this.dot(e),-1,1)))}rotateTowards(e,t){const i=this.angleTo(e);if(i===0)return this;const r=Math.min(1,t/i);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const i=e._x,r=e._y,o=e._z,a=e._w,c=t._x,d=t._y,u=t._z,f=t._w;return this._x=i*f+a*c+r*u-o*d,this._y=r*f+a*d+o*c-i*u,this._z=o*f+a*u+i*d-r*c,this._w=a*f-i*c-r*d-o*u,this._onChangeCallback(),this}slerp(e,t){if(t<=0)return this;if(t>=1)return this.copy(e);let i=e._x,r=e._y,o=e._z,a=e._w,c=this.dot(e);c<0&&(i=-i,r=-r,o=-o,a=-a,c=-c);let d=1-t;if(c<.9995){const u=Math.acos(c),f=Math.sin(u);d=Math.sin(d*u)/f,t=Math.sin(t*u)/f,this._x=this._x*d+i*t,this._y=this._y*d+r*t,this._z=this._z*d+o*t,this._w=this._w*d+a*t,this._onChangeCallback()}else this._x=this._x*d+i*t,this._y=this._y*d+r*t,this._z=this._z*d+o*t,this._w=this._w*d+a*t,this.normalize();return this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){const e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),r=Math.sqrt(1-i),o=Math.sqrt(i);return this.set(r*Math.sin(e),r*Math.cos(e),o*Math.sin(t),o*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class k{constructor(e=0,t=0,i=0){k.prototype.isVector3=!0,this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(nd.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(nd.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,i=this.y,r=this.z,o=e.elements;return this.x=o[0]*t+o[3]*i+o[6]*r,this.y=o[1]*t+o[4]*i+o[7]*r,this.z=o[2]*t+o[5]*i+o[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,i=this.y,r=this.z,o=e.elements,a=1/(o[3]*t+o[7]*i+o[11]*r+o[15]);return this.x=(o[0]*t+o[4]*i+o[8]*r+o[12])*a,this.y=(o[1]*t+o[5]*i+o[9]*r+o[13])*a,this.z=(o[2]*t+o[6]*i+o[10]*r+o[14])*a,this}applyQuaternion(e){const t=this.x,i=this.y,r=this.z,o=e.x,a=e.y,c=e.z,d=e.w,u=2*(a*r-c*i),f=2*(c*t-o*r),p=2*(o*i-a*t);return this.x=t+d*u+a*p-c*f,this.y=i+d*f+c*u-o*p,this.z=r+d*p+o*f-a*u,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,i=this.y,r=this.z,o=e.elements;return this.x=o[0]*t+o[4]*i+o[8]*r,this.y=o[1]*t+o[5]*i+o[9]*r,this.z=o[2]*t+o[6]*i+o[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=We(this.x,e.x,t.x),this.y=We(this.y,e.y,t.y),this.z=We(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=We(this.x,e,t),this.y=We(this.y,e,t),this.z=We(this.z,e,t),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(We(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const i=e.x,r=e.y,o=e.z,a=t.x,c=t.y,d=t.z;return this.x=r*d-o*c,this.y=o*a-i*d,this.z=i*c-r*a,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return ea.copy(this).projectOnVector(e),this.sub(ea)}reflect(e){return this.sub(ea.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const i=this.dot(e)/t;return Math.acos(We(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,i=this.y-e.y,r=this.z-e.z;return t*t+i*i+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){const r=Math.sin(t)*e;return this.x=r*Math.sin(i),this.y=Math.cos(t)*e,this.z=r*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const ea=new k,nd=new Li;class ke{constructor(e,t,i,r,o,a,c,d,u){ke.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,r,o,a,c,d,u)}set(e,t,i,r,o,a,c,d,u){const f=this.elements;return f[0]=e,f[1]=r,f[2]=c,f[3]=t,f[4]=o,f[5]=d,f[6]=i,f[7]=a,f[8]=u,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const i=e.elements,r=t.elements,o=this.elements,a=i[0],c=i[3],d=i[6],u=i[1],f=i[4],p=i[7],h=i[2],m=i[5],_=i[8],b=r[0],x=r[3],g=r[6],w=r[1],T=r[4],L=r[7],R=r[2],M=r[5],A=r[8];return o[0]=a*b+c*w+d*R,o[3]=a*x+c*T+d*M,o[6]=a*g+c*L+d*A,o[1]=u*b+f*w+p*R,o[4]=u*x+f*T+p*M,o[7]=u*g+f*L+p*A,o[2]=h*b+m*w+_*R,o[5]=h*x+m*T+_*M,o[8]=h*g+m*L+_*A,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],i=e[1],r=e[2],o=e[3],a=e[4],c=e[5],d=e[6],u=e[7],f=e[8];return t*a*f-t*c*u-i*o*f+i*c*d+r*o*u-r*a*d}invert(){const e=this.elements,t=e[0],i=e[1],r=e[2],o=e[3],a=e[4],c=e[5],d=e[6],u=e[7],f=e[8],p=f*a-c*u,h=c*d-f*o,m=u*o-a*d,_=t*p+i*h+r*m;if(_===0)return this.set(0,0,0,0,0,0,0,0,0);const b=1/_;return e[0]=p*b,e[1]=(r*u-f*i)*b,e[2]=(c*i-r*a)*b,e[3]=h*b,e[4]=(f*t-r*d)*b,e[5]=(r*o-c*t)*b,e[6]=m*b,e[7]=(i*d-u*t)*b,e[8]=(a*t-i*o)*b,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,r,o,a,c){const d=Math.cos(o),u=Math.sin(o);return this.set(i*d,i*u,-i*(d*a+u*c)+a+e,-r*u,r*d,-r*(-u*a+d*c)+c+t,0,0,1),this}scale(e,t){return this.premultiply(ta.makeScale(e,t)),this}rotate(e){return this.premultiply(ta.makeRotation(-e)),this}translate(e,t){return this.premultiply(ta.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,i=e.elements;for(let r=0;r<9;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){const i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}}const ta=new ke,id=new ke().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),rd=new ke().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function jp(){const n={enabled:!0,workingColorSpace:xr,spaces:{},convert:function(r,o,a){return this.enabled===!1||o===a||!o||!a||(this.spaces[o].transfer===st&&(r.r=jn(r.r),r.g=jn(r.g),r.b=jn(r.b)),this.spaces[o].primaries!==this.spaces[a].primaries&&(r.applyMatrix3(this.spaces[o].toXYZ),r.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===st&&(r.r=ur(r.r),r.g=ur(r.g),r.b=ur(r.b))),r},workingToColorSpace:function(r,o){return this.convert(r,this.workingColorSpace,o)},colorSpaceToWorking:function(r,o){return this.convert(r,o,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===ii?ys:this.spaces[r].transfer},getToneMappingMode:function(r){return this.spaces[r].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(r,o=this.workingColorSpace){return r.fromArray(this.spaces[o].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,o,a){return r.copy(this.spaces[o].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(r,o){return so("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),n.workingToColorSpace(r,o)},toWorkingColorSpace:function(r,o){return so("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),n.colorSpaceToWorking(r,o)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],i=[.3127,.329];return n.define({[xr]:{primaries:e,whitePoint:i,transfer:ys,toXYZ:id,fromXYZ:rd,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:sn},outputColorSpaceConfig:{drawingBufferColorSpace:sn}},[sn]:{primaries:e,whitePoint:i,transfer:st,toXYZ:id,fromXYZ:rd,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:sn}}}),n}const Qe=jp();function jn(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function ur(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}let Hi;class $p{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let i;if(e instanceof HTMLCanvasElement)i=e;else{Hi===void 0&&(Hi=vs("canvas")),Hi.width=e.width,Hi.height=e.height;const r=Hi.getContext("2d");e instanceof ImageData?r.putImageData(e,0,0):r.drawImage(e,0,0,e.width,e.height),i=Hi}return i.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=vs("canvas");t.width=e.width,t.height=e.height;const i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);const r=i.getImageData(0,0,e.width,e.height),o=r.data;for(let a=0;a<o.length;a++)o[a]=jn(o[a]/255)*255;return i.putImageData(r,0,0),t}else if(e.data){const t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(jn(t[i]/255)*255):t[i]=jn(t[i]);return{data:t,width:e.width,height:e.height}}else return Fe("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let Xp=0;class sl{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Xp++}),this.uuid=ho(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){const t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):t instanceof VideoFrame?e.set(t.displayHeight,t.displayWidth,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const i={uuid:this.uuid,url:""},r=this.data;if(r!==null){let o;if(Array.isArray(r)){o=[];for(let a=0,c=r.length;a<c;a++)r[a].isDataTexture?o.push(na(r[a].image)):o.push(na(r[a]))}else o=na(r);i.url=o}return t||(e.images[this.uuid]=i),i}}function na(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?$p.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(Fe("Texture: Unable to serialize Texture."),{})}let qp=0;const ia=new k;class zt extends Ni{constructor(e=zt.DEFAULT_IMAGE,t=zt.DEFAULT_MAPPING,i=Hn,r=Hn,o=ln,a=Ei,c=_n,d=Pn,u=zt.DEFAULT_ANISOTROPY,f=ii){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:qp++}),this.uuid=ho(),this.name="",this.source=new sl(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=r,this.magFilter=o,this.minFilter=a,this.anisotropy=u,this.format=c,this.internalFormat=null,this.type=d,this.offset=new Be(0,0),this.repeat=new Be(1,1),this.center=new Be(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new ke,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=f,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0}get width(){return this.source.getSize(ia).x}get height(){return this.source.getSize(ia).y}get depth(){return this.source.getSize(ia).z}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(const t in e){const i=e[t];if(i===void 0){Fe(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}const r=this[t];if(r===void 0){Fe(`Texture.setValues(): property '${t}' does not exist.`);continue}r&&i&&r.isVector2&&i.isVector2||r&&i&&r.isVector3&&i.isVector3||r&&i&&r.isMatrix3&&i.isMatrix3?r.copy(i):this[t]=i}}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Gu)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case tc:e.x=e.x-Math.floor(e.x);break;case Hn:e.x=e.x<0?0:1;break;case nc:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case tc:e.y=e.y-Math.floor(e.y);break;case Hn:e.y=e.y<0?0:1;break;case nc:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}zt.DEFAULT_IMAGE=null;zt.DEFAULT_MAPPING=Gu;zt.DEFAULT_ANISOTROPY=1;class St{constructor(e=0,t=0,i=0,r=1){St.prototype.isVector4=!0,this.x=e,this.y=t,this.z=i,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,r){return this.x=e,this.y=t,this.z=i,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,i=this.y,r=this.z,o=this.w,a=e.elements;return this.x=a[0]*t+a[4]*i+a[8]*r+a[12]*o,this.y=a[1]*t+a[5]*i+a[9]*r+a[13]*o,this.z=a[2]*t+a[6]*i+a[10]*r+a[14]*o,this.w=a[3]*t+a[7]*i+a[11]*r+a[15]*o,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,r,o;const d=e.elements,u=d[0],f=d[4],p=d[8],h=d[1],m=d[5],_=d[9],b=d[2],x=d[6],g=d[10];if(Math.abs(f-h)<.01&&Math.abs(p-b)<.01&&Math.abs(_-x)<.01){if(Math.abs(f+h)<.1&&Math.abs(p+b)<.1&&Math.abs(_+x)<.1&&Math.abs(u+m+g-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const T=(u+1)/2,L=(m+1)/2,R=(g+1)/2,M=(f+h)/4,A=(p+b)/4,F=(_+x)/4;return T>L&&T>R?T<.01?(i=0,r=.707106781,o=.707106781):(i=Math.sqrt(T),r=M/i,o=A/i):L>R?L<.01?(i=.707106781,r=0,o=.707106781):(r=Math.sqrt(L),i=M/r,o=F/r):R<.01?(i=.707106781,r=.707106781,o=0):(o=Math.sqrt(R),i=A/o,r=F/o),this.set(i,r,o,t),this}let w=Math.sqrt((x-_)*(x-_)+(p-b)*(p-b)+(h-f)*(h-f));return Math.abs(w)<.001&&(w=1),this.x=(x-_)/w,this.y=(p-b)/w,this.z=(h-f)/w,this.w=Math.acos((u+m+g-1)/2),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=We(this.x,e.x,t.x),this.y=We(this.y,e.y,t.y),this.z=We(this.z,e.z,t.z),this.w=We(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=We(this.x,e,t),this.y=We(this.y,e,t),this.z=We(this.z,e,t),this.w=We(this.w,e,t),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(We(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Yp extends Ni{constructor(e=1,t=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:ln,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1},i),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=i.depth,this.scissor=new St(0,0,e,t),this.scissorTest=!1,this.viewport=new St(0,0,e,t);const r={width:e,height:t,depth:i.depth},o=new zt(r);this.textures=[];const a=i.count;for(let c=0;c<a;c++)this.textures[c]=o.clone(),this.textures[c].isRenderTargetTexture=!0,this.textures[c].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview}_setTextureOptions(e={}){const t={minFilter:ln,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let r=0,o=this.textures.length;r<o;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=i,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,i=e.textures.length;t<i;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;const r=Object.assign({},e.textures[t].image);this.textures[t].source=new sl(r)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Ri extends Yp{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}}class Ku extends zt{constructor(e=null,t=1,i=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=tn,this.minFilter=tn,this.wrapR=Hn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class Kp extends zt{constructor(e=null,t=1,i=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=tn,this.minFilter=tn,this.wrapR=Hn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class po{constructor(e=new k(1/0,1/0,1/0),t=new k(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(hn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(hn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const i=hn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const i=e.geometry;if(i!==void 0){const o=i.getAttribute("position");if(t===!0&&o!==void 0&&e.isInstancedMesh!==!0)for(let a=0,c=o.count;a<c;a++)e.isMesh===!0?e.getVertexPosition(a,hn):hn.fromBufferAttribute(o,a),hn.applyMatrix4(e.matrixWorld),this.expandByPoint(hn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Mo.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),Mo.copy(i.boundingBox)),Mo.applyMatrix4(e.matrixWorld),this.union(Mo)}const r=e.children;for(let o=0,a=r.length;o<a;o++)this.expandByObject(r[o],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,hn),hn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Fr),To.subVectors(this.max,Fr),Vi.subVectors(e.a,Fr),Wi.subVectors(e.b,Fr),ji.subVectors(e.c,Fr),Yn.subVectors(Wi,Vi),Kn.subVectors(ji,Wi),pi.subVectors(Vi,ji);let t=[0,-Yn.z,Yn.y,0,-Kn.z,Kn.y,0,-pi.z,pi.y,Yn.z,0,-Yn.x,Kn.z,0,-Kn.x,pi.z,0,-pi.x,-Yn.y,Yn.x,0,-Kn.y,Kn.x,0,-pi.y,pi.x,0];return!ra(t,Vi,Wi,ji,To)||(t=[1,0,0,0,1,0,0,0,1],!ra(t,Vi,Wi,ji,To))?!1:(Co.crossVectors(Yn,Kn),t=[Co.x,Co.y,Co.z],ra(t,Vi,Wi,ji,To))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,hn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(hn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Fn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Fn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Fn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Fn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Fn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Fn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Fn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Fn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Fn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}}const Fn=[new k,new k,new k,new k,new k,new k,new k,new k],hn=new k,Mo=new po,Vi=new k,Wi=new k,ji=new k,Yn=new k,Kn=new k,pi=new k,Fr=new k,To=new k,Co=new k,mi=new k;function ra(n,e,t,i,r){for(let o=0,a=n.length-3;o<=a;o+=3){mi.fromArray(n,o);const c=r.x*Math.abs(mi.x)+r.y*Math.abs(mi.y)+r.z*Math.abs(mi.z),d=e.dot(mi),u=t.dot(mi),f=i.dot(mi);if(Math.max(-Math.max(d,u,f),Math.min(d,u,f))>c)return!1}return!0}const Jp=new po,Nr=new k,oa=new k;class Us{constructor(e=new k,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const i=this.center;t!==void 0?i.copy(t):Jp.setFromPoints(e).getCenter(i);let r=0;for(let o=0,a=e.length;o<a;o++)r=Math.max(r,i.distanceToSquared(e[o]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Nr.subVectors(e,this.center);const t=Nr.lengthSq();if(t>this.radius*this.radius){const i=Math.sqrt(t),r=(i-this.radius)*.5;this.center.addScaledVector(Nr,r/i),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(oa.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Nr.copy(e.center).add(oa)),this.expandByPoint(Nr.copy(e.center).sub(oa))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}}const Nn=new k,sa=new k,wo=new k,Jn=new k,aa=new k,Ao=new k,ca=new k;class al{constructor(e=new k,t=new k(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Nn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=Nn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Nn.copy(this.origin).addScaledVector(this.direction,t),Nn.distanceToSquared(e))}distanceSqToSegment(e,t,i,r){sa.copy(e).add(t).multiplyScalar(.5),wo.copy(t).sub(e).normalize(),Jn.copy(this.origin).sub(sa);const o=e.distanceTo(t)*.5,a=-this.direction.dot(wo),c=Jn.dot(this.direction),d=-Jn.dot(wo),u=Jn.lengthSq(),f=Math.abs(1-a*a);let p,h,m,_;if(f>0)if(p=a*d-c,h=a*c-d,_=o*f,p>=0)if(h>=-_)if(h<=_){const b=1/f;p*=b,h*=b,m=p*(p+a*h+2*c)+h*(a*p+h+2*d)+u}else h=o,p=Math.max(0,-(a*h+c)),m=-p*p+h*(h+2*d)+u;else h=-o,p=Math.max(0,-(a*h+c)),m=-p*p+h*(h+2*d)+u;else h<=-_?(p=Math.max(0,-(-a*o+c)),h=p>0?-o:Math.min(Math.max(-o,-d),o),m=-p*p+h*(h+2*d)+u):h<=_?(p=0,h=Math.min(Math.max(-o,-d),o),m=h*(h+2*d)+u):(p=Math.max(0,-(a*o+c)),h=p>0?o:Math.min(Math.max(-o,-d),o),m=-p*p+h*(h+2*d)+u);else h=a>0?-o:o,p=Math.max(0,-(a*h+c)),m=-p*p+h*(h+2*d)+u;return i&&i.copy(this.origin).addScaledVector(this.direction,p),r&&r.copy(sa).addScaledVector(wo,h),m}intersectSphere(e,t){Nn.subVectors(e.center,this.origin);const i=Nn.dot(this.direction),r=Nn.dot(Nn)-i*i,o=e.radius*e.radius;if(r>o)return null;const a=Math.sqrt(o-r),c=i-a,d=i+a;return d<0?null:c<0?this.at(d,t):this.at(c,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){const i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,r,o,a,c,d;const u=1/this.direction.x,f=1/this.direction.y,p=1/this.direction.z,h=this.origin;return u>=0?(i=(e.min.x-h.x)*u,r=(e.max.x-h.x)*u):(i=(e.max.x-h.x)*u,r=(e.min.x-h.x)*u),f>=0?(o=(e.min.y-h.y)*f,a=(e.max.y-h.y)*f):(o=(e.max.y-h.y)*f,a=(e.min.y-h.y)*f),i>a||o>r||((o>i||isNaN(i))&&(i=o),(a<r||isNaN(r))&&(r=a),p>=0?(c=(e.min.z-h.z)*p,d=(e.max.z-h.z)*p):(c=(e.max.z-h.z)*p,d=(e.min.z-h.z)*p),i>d||c>r)||((c>i||i!==i)&&(i=c),(d<r||r!==r)&&(r=d),r<0)?null:this.at(i>=0?i:r,t)}intersectsBox(e){return this.intersectBox(e,Nn)!==null}intersectTriangle(e,t,i,r,o){aa.subVectors(t,e),Ao.subVectors(i,e),ca.crossVectors(aa,Ao);let a=this.direction.dot(ca),c;if(a>0){if(r)return null;c=1}else if(a<0)c=-1,a=-a;else return null;Jn.subVectors(this.origin,e);const d=c*this.direction.dot(Ao.crossVectors(Jn,Ao));if(d<0)return null;const u=c*this.direction.dot(aa.cross(Jn));if(u<0||d+u>a)return null;const f=-c*Jn.dot(ca);return f<0?null:this.at(f/a,o)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class vt{constructor(e,t,i,r,o,a,c,d,u,f,p,h,m,_,b,x){vt.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,r,o,a,c,d,u,f,p,h,m,_,b,x)}set(e,t,i,r,o,a,c,d,u,f,p,h,m,_,b,x){const g=this.elements;return g[0]=e,g[4]=t,g[8]=i,g[12]=r,g[1]=o,g[5]=a,g[9]=c,g[13]=d,g[2]=u,g[6]=f,g[10]=p,g[14]=h,g[3]=m,g[7]=_,g[11]=b,g[15]=x,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new vt().fromArray(this.elements)}copy(e){const t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){const t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){const t=this.elements,i=e.elements,r=1/$i.setFromMatrixColumn(e,0).length(),o=1/$i.setFromMatrixColumn(e,1).length(),a=1/$i.setFromMatrixColumn(e,2).length();return t[0]=i[0]*r,t[1]=i[1]*r,t[2]=i[2]*r,t[3]=0,t[4]=i[4]*o,t[5]=i[5]*o,t[6]=i[6]*o,t[7]=0,t[8]=i[8]*a,t[9]=i[9]*a,t[10]=i[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,i=e.x,r=e.y,o=e.z,a=Math.cos(i),c=Math.sin(i),d=Math.cos(r),u=Math.sin(r),f=Math.cos(o),p=Math.sin(o);if(e.order==="XYZ"){const h=a*f,m=a*p,_=c*f,b=c*p;t[0]=d*f,t[4]=-d*p,t[8]=u,t[1]=m+_*u,t[5]=h-b*u,t[9]=-c*d,t[2]=b-h*u,t[6]=_+m*u,t[10]=a*d}else if(e.order==="YXZ"){const h=d*f,m=d*p,_=u*f,b=u*p;t[0]=h+b*c,t[4]=_*c-m,t[8]=a*u,t[1]=a*p,t[5]=a*f,t[9]=-c,t[2]=m*c-_,t[6]=b+h*c,t[10]=a*d}else if(e.order==="ZXY"){const h=d*f,m=d*p,_=u*f,b=u*p;t[0]=h-b*c,t[4]=-a*p,t[8]=_+m*c,t[1]=m+_*c,t[5]=a*f,t[9]=b-h*c,t[2]=-a*u,t[6]=c,t[10]=a*d}else if(e.order==="ZYX"){const h=a*f,m=a*p,_=c*f,b=c*p;t[0]=d*f,t[4]=_*u-m,t[8]=h*u+b,t[1]=d*p,t[5]=b*u+h,t[9]=m*u-_,t[2]=-u,t[6]=c*d,t[10]=a*d}else if(e.order==="YZX"){const h=a*d,m=a*u,_=c*d,b=c*u;t[0]=d*f,t[4]=b-h*p,t[8]=_*p+m,t[1]=p,t[5]=a*f,t[9]=-c*f,t[2]=-u*f,t[6]=m*p+_,t[10]=h-b*p}else if(e.order==="XZY"){const h=a*d,m=a*u,_=c*d,b=c*u;t[0]=d*f,t[4]=-p,t[8]=u*f,t[1]=h*p+b,t[5]=a*f,t[9]=m*p-_,t[2]=_*p-m,t[6]=c*f,t[10]=b*p+h}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Zp,e,Qp)}lookAt(e,t,i){const r=this.elements;return Zt.subVectors(e,t),Zt.lengthSq()===0&&(Zt.z=1),Zt.normalize(),Zn.crossVectors(i,Zt),Zn.lengthSq()===0&&(Math.abs(i.z)===1?Zt.x+=1e-4:Zt.z+=1e-4,Zt.normalize(),Zn.crossVectors(i,Zt)),Zn.normalize(),Lo.crossVectors(Zt,Zn),r[0]=Zn.x,r[4]=Lo.x,r[8]=Zt.x,r[1]=Zn.y,r[5]=Lo.y,r[9]=Zt.y,r[2]=Zn.z,r[6]=Lo.z,r[10]=Zt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const i=e.elements,r=t.elements,o=this.elements,a=i[0],c=i[4],d=i[8],u=i[12],f=i[1],p=i[5],h=i[9],m=i[13],_=i[2],b=i[6],x=i[10],g=i[14],w=i[3],T=i[7],L=i[11],R=i[15],M=r[0],A=r[4],F=r[8],E=r[12],S=r[1],P=r[5],O=r[9],B=r[13],W=r[2],V=r[6],X=r[10],Q=r[14],$=r[3],ie=r[7],ne=r[11],xe=r[15];return o[0]=a*M+c*S+d*W+u*$,o[4]=a*A+c*P+d*V+u*ie,o[8]=a*F+c*O+d*X+u*ne,o[12]=a*E+c*B+d*Q+u*xe,o[1]=f*M+p*S+h*W+m*$,o[5]=f*A+p*P+h*V+m*ie,o[9]=f*F+p*O+h*X+m*ne,o[13]=f*E+p*B+h*Q+m*xe,o[2]=_*M+b*S+x*W+g*$,o[6]=_*A+b*P+x*V+g*ie,o[10]=_*F+b*O+x*X+g*ne,o[14]=_*E+b*B+x*Q+g*xe,o[3]=w*M+T*S+L*W+R*$,o[7]=w*A+T*P+L*V+R*ie,o[11]=w*F+T*O+L*X+R*ne,o[15]=w*E+T*B+L*Q+R*xe,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],i=e[4],r=e[8],o=e[12],a=e[1],c=e[5],d=e[9],u=e[13],f=e[2],p=e[6],h=e[10],m=e[14],_=e[3],b=e[7],x=e[11],g=e[15];return _*(+o*d*p-r*u*p-o*c*h+i*u*h+r*c*m-i*d*m)+b*(+t*d*m-t*u*h+o*a*h-r*a*m+r*u*f-o*d*f)+x*(+t*u*p-t*c*m-o*a*p+i*a*m+o*c*f-i*u*f)+g*(-r*c*f-t*d*p+t*c*h+r*a*p-i*a*h+i*d*f)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){const r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=i),this}invert(){const e=this.elements,t=e[0],i=e[1],r=e[2],o=e[3],a=e[4],c=e[5],d=e[6],u=e[7],f=e[8],p=e[9],h=e[10],m=e[11],_=e[12],b=e[13],x=e[14],g=e[15],w=p*x*u-b*h*u+b*d*m-c*x*m-p*d*g+c*h*g,T=_*h*u-f*x*u-_*d*m+a*x*m+f*d*g-a*h*g,L=f*b*u-_*p*u+_*c*m-a*b*m-f*c*g+a*p*g,R=_*p*d-f*b*d-_*c*h+a*b*h+f*c*x-a*p*x,M=t*w+i*T+r*L+o*R;if(M===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const A=1/M;return e[0]=w*A,e[1]=(b*h*o-p*x*o-b*r*m+i*x*m+p*r*g-i*h*g)*A,e[2]=(c*x*o-b*d*o+b*r*u-i*x*u-c*r*g+i*d*g)*A,e[3]=(p*d*o-c*h*o-p*r*u+i*h*u+c*r*m-i*d*m)*A,e[4]=T*A,e[5]=(f*x*o-_*h*o+_*r*m-t*x*m-f*r*g+t*h*g)*A,e[6]=(_*d*o-a*x*o-_*r*u+t*x*u+a*r*g-t*d*g)*A,e[7]=(a*h*o-f*d*o+f*r*u-t*h*u-a*r*m+t*d*m)*A,e[8]=L*A,e[9]=(_*p*o-f*b*o-_*i*m+t*b*m+f*i*g-t*p*g)*A,e[10]=(a*b*o-_*c*o+_*i*u-t*b*u-a*i*g+t*c*g)*A,e[11]=(f*c*o-a*p*o-f*i*u+t*p*u+a*i*m-t*c*m)*A,e[12]=R*A,e[13]=(f*b*r-_*p*r+_*i*h-t*b*h-f*i*x+t*p*x)*A,e[14]=(_*c*r-a*b*r-_*i*d+t*b*d+a*i*x-t*c*x)*A,e[15]=(a*p*r-f*c*r+f*i*d-t*p*d-a*i*h+t*c*h)*A,this}scale(e){const t=this.elements,i=e.x,r=e.y,o=e.z;return t[0]*=i,t[4]*=r,t[8]*=o,t[1]*=i,t[5]*=r,t[9]*=o,t[2]*=i,t[6]*=r,t[10]*=o,t[3]*=i,t[7]*=r,t[11]*=o,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,r))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const i=Math.cos(t),r=Math.sin(t),o=1-i,a=e.x,c=e.y,d=e.z,u=o*a,f=o*c;return this.set(u*a+i,u*c-r*d,u*d+r*c,0,u*c+r*d,f*c+i,f*d-r*a,0,u*d-r*c,f*d+r*a,o*d*d+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,r,o,a){return this.set(1,i,o,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,i){const r=this.elements,o=t._x,a=t._y,c=t._z,d=t._w,u=o+o,f=a+a,p=c+c,h=o*u,m=o*f,_=o*p,b=a*f,x=a*p,g=c*p,w=d*u,T=d*f,L=d*p,R=i.x,M=i.y,A=i.z;return r[0]=(1-(b+g))*R,r[1]=(m+L)*R,r[2]=(_-T)*R,r[3]=0,r[4]=(m-L)*M,r[5]=(1-(h+g))*M,r[6]=(x+w)*M,r[7]=0,r[8]=(_+T)*A,r[9]=(x-w)*A,r[10]=(1-(h+b))*A,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,i){const r=this.elements;let o=$i.set(r[0],r[1],r[2]).length();const a=$i.set(r[4],r[5],r[6]).length(),c=$i.set(r[8],r[9],r[10]).length();this.determinant()<0&&(o=-o),e.x=r[12],e.y=r[13],e.z=r[14],pn.copy(this);const u=1/o,f=1/a,p=1/c;return pn.elements[0]*=u,pn.elements[1]*=u,pn.elements[2]*=u,pn.elements[4]*=f,pn.elements[5]*=f,pn.elements[6]*=f,pn.elements[8]*=p,pn.elements[9]*=p,pn.elements[10]*=p,t.setFromRotationMatrix(pn),i.x=o,i.y=a,i.z=c,this}makePerspective(e,t,i,r,o,a,c=wn,d=!1){const u=this.elements,f=2*o/(t-e),p=2*o/(i-r),h=(t+e)/(t-e),m=(i+r)/(i-r);let _,b;if(d)_=o/(a-o),b=a*o/(a-o);else if(c===wn)_=-(a+o)/(a-o),b=-2*a*o/(a-o);else if(c===Ss)_=-a/(a-o),b=-a*o/(a-o);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+c);return u[0]=f,u[4]=0,u[8]=h,u[12]=0,u[1]=0,u[5]=p,u[9]=m,u[13]=0,u[2]=0,u[6]=0,u[10]=_,u[14]=b,u[3]=0,u[7]=0,u[11]=-1,u[15]=0,this}makeOrthographic(e,t,i,r,o,a,c=wn,d=!1){const u=this.elements,f=2/(t-e),p=2/(i-r),h=-(t+e)/(t-e),m=-(i+r)/(i-r);let _,b;if(d)_=1/(a-o),b=a/(a-o);else if(c===wn)_=-2/(a-o),b=-(a+o)/(a-o);else if(c===Ss)_=-1/(a-o),b=-o/(a-o);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+c);return u[0]=f,u[4]=0,u[8]=0,u[12]=h,u[1]=0,u[5]=p,u[9]=0,u[13]=m,u[2]=0,u[6]=0,u[10]=_,u[14]=b,u[3]=0,u[7]=0,u[11]=0,u[15]=1,this}equals(e){const t=this.elements,i=e.elements;for(let r=0;r<16;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){const i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}}const $i=new k,pn=new vt,Zp=new k(0,0,0),Qp=new k(1,1,1),Zn=new k,Lo=new k,Zt=new k,od=new vt,sd=new Li;class In{constructor(e=0,t=0,i=0,r=In.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,r=this._order){return this._x=e,this._y=t,this._z=i,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){const r=e.elements,o=r[0],a=r[4],c=r[8],d=r[1],u=r[5],f=r[9],p=r[2],h=r[6],m=r[10];switch(t){case"XYZ":this._y=Math.asin(We(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-f,m),this._z=Math.atan2(-a,o)):(this._x=Math.atan2(h,u),this._z=0);break;case"YXZ":this._x=Math.asin(-We(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(c,m),this._z=Math.atan2(d,u)):(this._y=Math.atan2(-p,o),this._z=0);break;case"ZXY":this._x=Math.asin(We(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(-p,m),this._z=Math.atan2(-a,u)):(this._y=0,this._z=Math.atan2(d,o));break;case"ZYX":this._y=Math.asin(-We(p,-1,1)),Math.abs(p)<.9999999?(this._x=Math.atan2(h,m),this._z=Math.atan2(d,o)):(this._x=0,this._z=Math.atan2(-a,u));break;case"YZX":this._z=Math.asin(We(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(-f,u),this._y=Math.atan2(-p,o)):(this._x=0,this._y=Math.atan2(c,m));break;case"XZY":this._z=Math.asin(-We(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(h,u),this._y=Math.atan2(c,o)):(this._x=Math.atan2(-f,m),this._y=0);break;default:Fe("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return od.makeRotationFromQuaternion(e),this.setFromRotationMatrix(od,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return sd.setFromEuler(this),this.setFromQuaternion(sd,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}In.DEFAULT_ORDER="XYZ";class Ju{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let em=0;const ad=new k,Xi=new Li,Un=new vt,Ro=new k,Ur=new k,tm=new k,nm=new Li,cd=new k(1,0,0),ld=new k(0,1,0),dd=new k(0,0,1),ud={type:"added"},im={type:"removed"},qi={type:"childadded",child:null},la={type:"childremoved",child:null};class Ft extends Ni{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:em++}),this.uuid=ho(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Ft.DEFAULT_UP.clone();const e=new k,t=new In,i=new Li,r=new k(1,1,1);function o(){i.setFromEuler(t,!1)}function a(){t.setFromQuaternion(i,void 0,!1)}t._onChange(o),i._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new vt},normalMatrix:{value:new ke}}),this.matrix=new vt,this.matrixWorld=new vt,this.matrixAutoUpdate=Ft.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Ft.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Ju,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Xi.setFromAxisAngle(e,t),this.quaternion.multiply(Xi),this}rotateOnWorldAxis(e,t){return Xi.setFromAxisAngle(e,t),this.quaternion.premultiply(Xi),this}rotateX(e){return this.rotateOnAxis(cd,e)}rotateY(e){return this.rotateOnAxis(ld,e)}rotateZ(e){return this.rotateOnAxis(dd,e)}translateOnAxis(e,t){return ad.copy(e).applyQuaternion(this.quaternion),this.position.add(ad.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(cd,e)}translateY(e){return this.translateOnAxis(ld,e)}translateZ(e){return this.translateOnAxis(dd,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Un.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?Ro.copy(e):Ro.set(e,t,i);const r=this.parent;this.updateWorldMatrix(!0,!1),Ur.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Un.lookAt(Ur,Ro,this.up):Un.lookAt(Ro,Ur,this.up),this.quaternion.setFromRotationMatrix(Un),r&&(Un.extractRotation(r.matrixWorld),Xi.setFromRotationMatrix(Un),this.quaternion.premultiply(Xi.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(Mt("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(ud),qi.child=e,this.dispatchEvent(qi),qi.child=null):Mt("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(im),la.child=e,this.dispatchEvent(la),la.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Un.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Un.multiply(e.parent.matrixWorld)),e.applyMatrix4(Un),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(ud),qi.child=e,this.dispatchEvent(qi),qi.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,r=this.children.length;i<r;i++){const a=this.children[i].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);const r=this.children;for(let o=0,a=r.length;o<a;o++)r[o].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ur,e,tm),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ur,nm,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t){const i=this.parent;if(e===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){const r=this.children;for(let o=0,a=r.length;o<a;o++)r[o].updateWorldMatrix(!1,!0)}}toJSON(e){const t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const r={};r.uuid=this.uuid,r.type=this.type,this.name!==""&&(r.name=this.name),this.castShadow===!0&&(r.castShadow=!0),this.receiveShadow===!0&&(r.receiveShadow=!0),this.visible===!1&&(r.visible=!1),this.frustumCulled===!1&&(r.frustumCulled=!1),this.renderOrder!==0&&(r.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(r.matrixAutoUpdate=!1),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(c=>({...c,boundingBox:c.boundingBox?c.boundingBox.toJSON():void 0,boundingSphere:c.boundingSphere?c.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(c=>({...c})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function o(c,d){return c[d.uuid]===void 0&&(c[d.uuid]=d.toJSON(e)),d.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=o(e.geometries,this.geometry);const c=this.geometry.parameters;if(c!==void 0&&c.shapes!==void 0){const d=c.shapes;if(Array.isArray(d))for(let u=0,f=d.length;u<f;u++){const p=d[u];o(e.shapes,p)}else o(e.shapes,d)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(o(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const c=[];for(let d=0,u=this.material.length;d<u;d++)c.push(o(e.materials,this.material[d]));r.material=c}else r.material=o(e.materials,this.material);if(this.children.length>0){r.children=[];for(let c=0;c<this.children.length;c++)r.children.push(this.children[c].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let c=0;c<this.animations.length;c++){const d=this.animations[c];r.animations.push(o(e.animations,d))}}if(t){const c=a(e.geometries),d=a(e.materials),u=a(e.textures),f=a(e.images),p=a(e.shapes),h=a(e.skeletons),m=a(e.animations),_=a(e.nodes);c.length>0&&(i.geometries=c),d.length>0&&(i.materials=d),u.length>0&&(i.textures=u),f.length>0&&(i.images=f),p.length>0&&(i.shapes=p),h.length>0&&(i.skeletons=h),m.length>0&&(i.animations=m),_.length>0&&(i.nodes=_)}return i.object=r,i;function a(c){const d=[];for(const u in c){const f=c[u];delete f.metadata,d.push(f)}return d}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){const r=e.children[i];this.add(r.clone())}return this}}Ft.DEFAULT_UP=new k(0,1,0);Ft.DEFAULT_MATRIX_AUTO_UPDATE=!0;Ft.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const mn=new k,On=new k,da=new k,Bn=new k,Yi=new k,Ki=new k,fd=new k,ua=new k,fa=new k,ha=new k,pa=new St,ma=new St,ga=new St;class xn{constructor(e=new k,t=new k,i=new k){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,r){r.subVectors(i,t),mn.subVectors(e,t),r.cross(mn);const o=r.lengthSq();return o>0?r.multiplyScalar(1/Math.sqrt(o)):r.set(0,0,0)}static getBarycoord(e,t,i,r,o){mn.subVectors(r,t),On.subVectors(i,t),da.subVectors(e,t);const a=mn.dot(mn),c=mn.dot(On),d=mn.dot(da),u=On.dot(On),f=On.dot(da),p=a*u-c*c;if(p===0)return o.set(0,0,0),null;const h=1/p,m=(u*d-c*f)*h,_=(a*f-c*d)*h;return o.set(1-m-_,_,m)}static containsPoint(e,t,i,r){return this.getBarycoord(e,t,i,r,Bn)===null?!1:Bn.x>=0&&Bn.y>=0&&Bn.x+Bn.y<=1}static getInterpolation(e,t,i,r,o,a,c,d){return this.getBarycoord(e,t,i,r,Bn)===null?(d.x=0,d.y=0,"z"in d&&(d.z=0),"w"in d&&(d.w=0),null):(d.setScalar(0),d.addScaledVector(o,Bn.x),d.addScaledVector(a,Bn.y),d.addScaledVector(c,Bn.z),d)}static getInterpolatedAttribute(e,t,i,r,o,a){return pa.setScalar(0),ma.setScalar(0),ga.setScalar(0),pa.fromBufferAttribute(e,t),ma.fromBufferAttribute(e,i),ga.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(pa,o.x),a.addScaledVector(ma,o.y),a.addScaledVector(ga,o.z),a}static isFrontFacing(e,t,i,r){return mn.subVectors(i,t),On.subVectors(e,t),mn.cross(On).dot(r)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,r){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,i,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return mn.subVectors(this.c,this.b),On.subVectors(this.a,this.b),mn.cross(On).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return xn.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return xn.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,r,o){return xn.getInterpolation(e,this.a,this.b,this.c,t,i,r,o)}containsPoint(e){return xn.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return xn.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const i=this.a,r=this.b,o=this.c;let a,c;Yi.subVectors(r,i),Ki.subVectors(o,i),ua.subVectors(e,i);const d=Yi.dot(ua),u=Ki.dot(ua);if(d<=0&&u<=0)return t.copy(i);fa.subVectors(e,r);const f=Yi.dot(fa),p=Ki.dot(fa);if(f>=0&&p<=f)return t.copy(r);const h=d*p-f*u;if(h<=0&&d>=0&&f<=0)return a=d/(d-f),t.copy(i).addScaledVector(Yi,a);ha.subVectors(e,o);const m=Yi.dot(ha),_=Ki.dot(ha);if(_>=0&&m<=_)return t.copy(o);const b=m*u-d*_;if(b<=0&&u>=0&&_<=0)return c=u/(u-_),t.copy(i).addScaledVector(Ki,c);const x=f*_-m*p;if(x<=0&&p-f>=0&&m-_>=0)return fd.subVectors(o,r),c=(p-f)/(p-f+(m-_)),t.copy(r).addScaledVector(fd,c);const g=1/(x+b+h);return a=b*g,c=h*g,t.copy(i).addScaledVector(Yi,a).addScaledVector(Ki,c)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}const Zu={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Qn={h:0,s:0,l:0},Po={h:0,s:0,l:0};function xa(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}class ze{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){const r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=sn){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Qe.colorSpaceToWorking(this,t),this}setRGB(e,t,i,r=Qe.workingColorSpace){return this.r=e,this.g=t,this.b=i,Qe.colorSpaceToWorking(this,r),this}setHSL(e,t,i,r=Qe.workingColorSpace){if(e=Vp(e,1),t=We(t,0,1),i=We(i,0,1),t===0)this.r=this.g=this.b=i;else{const o=i<=.5?i*(1+t):i+t-i*t,a=2*i-o;this.r=xa(a,o,e+1/3),this.g=xa(a,o,e),this.b=xa(a,o,e-1/3)}return Qe.colorSpaceToWorking(this,r),this}setStyle(e,t=sn){function i(o){o!==void 0&&parseFloat(o)<1&&Fe("Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let o;const a=r[1],c=r[2];switch(a){case"rgb":case"rgba":if(o=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(c))return i(o[4]),this.setRGB(Math.min(255,parseInt(o[1],10))/255,Math.min(255,parseInt(o[2],10))/255,Math.min(255,parseInt(o[3],10))/255,t);if(o=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(c))return i(o[4]),this.setRGB(Math.min(100,parseInt(o[1],10))/100,Math.min(100,parseInt(o[2],10))/100,Math.min(100,parseInt(o[3],10))/100,t);break;case"hsl":case"hsla":if(o=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(c))return i(o[4]),this.setHSL(parseFloat(o[1])/360,parseFloat(o[2])/100,parseFloat(o[3])/100,t);break;default:Fe("Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){const o=r[1],a=o.length;if(a===3)return this.setRGB(parseInt(o.charAt(0),16)/15,parseInt(o.charAt(1),16)/15,parseInt(o.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(o,16),t);Fe("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=sn){const i=Zu[e.toLowerCase()];return i!==void 0?this.setHex(i,t):Fe("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=jn(e.r),this.g=jn(e.g),this.b=jn(e.b),this}copyLinearToSRGB(e){return this.r=ur(e.r),this.g=ur(e.g),this.b=ur(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=sn){return Qe.workingToColorSpace(Ut.copy(this),e),Math.round(We(Ut.r*255,0,255))*65536+Math.round(We(Ut.g*255,0,255))*256+Math.round(We(Ut.b*255,0,255))}getHexString(e=sn){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Qe.workingColorSpace){Qe.workingToColorSpace(Ut.copy(this),t);const i=Ut.r,r=Ut.g,o=Ut.b,a=Math.max(i,r,o),c=Math.min(i,r,o);let d,u;const f=(c+a)/2;if(c===a)d=0,u=0;else{const p=a-c;switch(u=f<=.5?p/(a+c):p/(2-a-c),a){case i:d=(r-o)/p+(r<o?6:0);break;case r:d=(o-i)/p+2;break;case o:d=(i-r)/p+4;break}d/=6}return e.h=d,e.s=u,e.l=f,e}getRGB(e,t=Qe.workingColorSpace){return Qe.workingToColorSpace(Ut.copy(this),t),e.r=Ut.r,e.g=Ut.g,e.b=Ut.b,e}getStyle(e=sn){Qe.workingToColorSpace(Ut.copy(this),e);const t=Ut.r,i=Ut.g,r=Ut.b;return e!==sn?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(r*255)})`}offsetHSL(e,t,i){return this.getHSL(Qn),this.setHSL(Qn.h+e,Qn.s+t,Qn.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(Qn),e.getHSL(Po);const i=Qs(Qn.h,Po.h,t),r=Qs(Qn.s,Po.s,t),o=Qs(Qn.l,Po.l,t);return this.setHSL(i,r,o),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,i=this.g,r=this.b,o=e.elements;return this.r=o[0]*t+o[3]*i+o[6]*r,this.g=o[1]*t+o[4]*i+o[7]*r,this.b=o[2]*t+o[5]*i+o[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Ut=new ze;ze.NAMES=Zu;let rm=0;class Mr extends Ni{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:rm++}),this.uuid=ho(),this.name="",this.type="Material",this.blending=dr,this.side=ai,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Wa,this.blendDst=ja,this.blendEquation=Si,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new ze(0,0,0),this.blendAlpha=0,this.depthFunc=pr,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Jl,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=zi,this.stencilZFail=zi,this.stencilZPass=zi,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const i=e[t];if(i===void 0){Fe(`Material: parameter '${t}' has value of undefined.`);continue}const r=this[t];if(r===void 0){Fe(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(i):r&&r.isVector3&&i&&i.isVector3?r.copy(i):this[t]=i}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==dr&&(i.blending=this.blending),this.side!==ai&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==Wa&&(i.blendSrc=this.blendSrc),this.blendDst!==ja&&(i.blendDst=this.blendDst),this.blendEquation!==Si&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==pr&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Jl&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==zi&&(i.stencilFail=this.stencilFail),this.stencilZFail!==zi&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==zi&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function r(o){const a=[];for(const c in o){const d=o[c];delete d.metadata,a.push(d)}return a}if(t){const o=r(e.textures),a=r(e.images);o.length>0&&(i.textures=o),a.length>0&&(i.images=a)}return i}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let i=null;if(t!==null){const r=t.length;i=new Array(r);for(let o=0;o!==r;++o)i[o]=t[o].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}class cl extends Mr{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new ze(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new In,this.combine=Bu,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const Tt=new k,Io=new Be;let om=0;class An{constructor(e,t,i=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:om++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=Zl,this.updateRanges=[],this.gpuType=Vn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let r=0,o=this.itemSize;r<o;r++)this.array[e+r]=t.array[i+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)Io.fromBufferAttribute(this,t),Io.applyMatrix3(e),this.setXY(t,Io.x,Io.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)Tt.fromBufferAttribute(this,t),Tt.applyMatrix3(e),this.setXYZ(t,Tt.x,Tt.y,Tt.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)Tt.fromBufferAttribute(this,t),Tt.applyMatrix4(e),this.setXYZ(t,Tt.x,Tt.y,Tt.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)Tt.fromBufferAttribute(this,t),Tt.applyNormalMatrix(e),this.setXYZ(t,Tt.x,Tt.y,Tt.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)Tt.fromBufferAttribute(this,t),Tt.transformDirection(e),this.setXYZ(t,Tt.x,Tt.y,Tt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=Dr(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=jt(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Dr(t,this.array)),t}setX(e,t){return this.normalized&&(t=jt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Dr(t,this.array)),t}setY(e,t){return this.normalized&&(t=jt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Dr(t,this.array)),t}setZ(e,t){return this.normalized&&(t=jt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Dr(t,this.array)),t}setW(e,t){return this.normalized&&(t=jt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=jt(t,this.array),i=jt(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,r){return e*=this.itemSize,this.normalized&&(t=jt(t,this.array),i=jt(i,this.array),r=jt(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this}setXYZW(e,t,i,r,o){return e*=this.itemSize,this.normalized&&(t=jt(t,this.array),i=jt(i,this.array),r=jt(r,this.array),o=jt(o,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this.array[e+3]=o,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==Zl&&(e.usage=this.usage),e}}class Qu extends An{constructor(e,t,i){super(new Uint16Array(e),t,i)}}class ef extends An{constructor(e,t,i){super(new Uint32Array(e),t,i)}}class Ht extends An{constructor(e,t,i){super(new Float32Array(e),t,i)}}let sm=0;const on=new vt,_a=new Ft,Ji=new k,Qt=new po,Or=new po,Rt=new k;class un extends Ni{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:sm++}),this.uuid=ho(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Yu(e)?ef:Qu)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const i=this.attributes.normal;if(i!==void 0){const o=new ke().getNormalMatrix(e);i.applyNormalMatrix(o),i.needsUpdate=!0}const r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return on.makeRotationFromQuaternion(e),this.applyMatrix4(on),this}rotateX(e){return on.makeRotationX(e),this.applyMatrix4(on),this}rotateY(e){return on.makeRotationY(e),this.applyMatrix4(on),this}rotateZ(e){return on.makeRotationZ(e),this.applyMatrix4(on),this}translate(e,t,i){return on.makeTranslation(e,t,i),this.applyMatrix4(on),this}scale(e,t,i){return on.makeScale(e,t,i),this.applyMatrix4(on),this}lookAt(e){return _a.lookAt(e),_a.updateMatrix(),this.applyMatrix4(_a.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Ji).negate(),this.translate(Ji.x,Ji.y,Ji.z),this}setFromPoints(e){const t=this.getAttribute("position");if(t===void 0){const i=[];for(let r=0,o=e.length;r<o;r++){const a=e[r];i.push(a.x,a.y,a.z||0)}this.setAttribute("position",new Ht(i,3))}else{const i=Math.min(e.length,t.count);for(let r=0;r<i;r++){const o=e[r];t.setXYZ(r,o.x,o.y,o.z||0)}e.length>t.count&&Fe("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new po);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Mt("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new k(-1/0,-1/0,-1/0),new k(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,r=t.length;i<r;i++){const o=t[i];Qt.setFromBufferAttribute(o),this.morphTargetsRelative?(Rt.addVectors(this.boundingBox.min,Qt.min),this.boundingBox.expandByPoint(Rt),Rt.addVectors(this.boundingBox.max,Qt.max),this.boundingBox.expandByPoint(Rt)):(this.boundingBox.expandByPoint(Qt.min),this.boundingBox.expandByPoint(Qt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Mt('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Us);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Mt("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new k,1/0);return}if(e){const i=this.boundingSphere.center;if(Qt.setFromBufferAttribute(e),t)for(let o=0,a=t.length;o<a;o++){const c=t[o];Or.setFromBufferAttribute(c),this.morphTargetsRelative?(Rt.addVectors(Qt.min,Or.min),Qt.expandByPoint(Rt),Rt.addVectors(Qt.max,Or.max),Qt.expandByPoint(Rt)):(Qt.expandByPoint(Or.min),Qt.expandByPoint(Or.max))}Qt.getCenter(i);let r=0;for(let o=0,a=e.count;o<a;o++)Rt.fromBufferAttribute(e,o),r=Math.max(r,i.distanceToSquared(Rt));if(t)for(let o=0,a=t.length;o<a;o++){const c=t[o],d=this.morphTargetsRelative;for(let u=0,f=c.count;u<f;u++)Rt.fromBufferAttribute(c,u),d&&(Ji.fromBufferAttribute(e,u),Rt.add(Ji)),r=Math.max(r,i.distanceToSquared(Rt))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&Mt('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){Mt("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const i=t.position,r=t.normal,o=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new An(new Float32Array(4*i.count),4));const a=this.getAttribute("tangent"),c=[],d=[];for(let F=0;F<i.count;F++)c[F]=new k,d[F]=new k;const u=new k,f=new k,p=new k,h=new Be,m=new Be,_=new Be,b=new k,x=new k;function g(F,E,S){u.fromBufferAttribute(i,F),f.fromBufferAttribute(i,E),p.fromBufferAttribute(i,S),h.fromBufferAttribute(o,F),m.fromBufferAttribute(o,E),_.fromBufferAttribute(o,S),f.sub(u),p.sub(u),m.sub(h),_.sub(h);const P=1/(m.x*_.y-_.x*m.y);isFinite(P)&&(b.copy(f).multiplyScalar(_.y).addScaledVector(p,-m.y).multiplyScalar(P),x.copy(p).multiplyScalar(m.x).addScaledVector(f,-_.x).multiplyScalar(P),c[F].add(b),c[E].add(b),c[S].add(b),d[F].add(x),d[E].add(x),d[S].add(x))}let w=this.groups;w.length===0&&(w=[{start:0,count:e.count}]);for(let F=0,E=w.length;F<E;++F){const S=w[F],P=S.start,O=S.count;for(let B=P,W=P+O;B<W;B+=3)g(e.getX(B+0),e.getX(B+1),e.getX(B+2))}const T=new k,L=new k,R=new k,M=new k;function A(F){R.fromBufferAttribute(r,F),M.copy(R);const E=c[F];T.copy(E),T.sub(R.multiplyScalar(R.dot(E))).normalize(),L.crossVectors(M,E);const P=L.dot(d[F])<0?-1:1;a.setXYZW(F,T.x,T.y,T.z,P)}for(let F=0,E=w.length;F<E;++F){const S=w[F],P=S.start,O=S.count;for(let B=P,W=P+O;B<W;B+=3)A(e.getX(B+0)),A(e.getX(B+1)),A(e.getX(B+2))}}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new An(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let h=0,m=i.count;h<m;h++)i.setXYZ(h,0,0,0);const r=new k,o=new k,a=new k,c=new k,d=new k,u=new k,f=new k,p=new k;if(e)for(let h=0,m=e.count;h<m;h+=3){const _=e.getX(h+0),b=e.getX(h+1),x=e.getX(h+2);r.fromBufferAttribute(t,_),o.fromBufferAttribute(t,b),a.fromBufferAttribute(t,x),f.subVectors(a,o),p.subVectors(r,o),f.cross(p),c.fromBufferAttribute(i,_),d.fromBufferAttribute(i,b),u.fromBufferAttribute(i,x),c.add(f),d.add(f),u.add(f),i.setXYZ(_,c.x,c.y,c.z),i.setXYZ(b,d.x,d.y,d.z),i.setXYZ(x,u.x,u.y,u.z)}else for(let h=0,m=t.count;h<m;h+=3)r.fromBufferAttribute(t,h+0),o.fromBufferAttribute(t,h+1),a.fromBufferAttribute(t,h+2),f.subVectors(a,o),p.subVectors(r,o),f.cross(p),i.setXYZ(h+0,f.x,f.y,f.z),i.setXYZ(h+1,f.x,f.y,f.z),i.setXYZ(h+2,f.x,f.y,f.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)Rt.fromBufferAttribute(e,t),Rt.normalize(),e.setXYZ(t,Rt.x,Rt.y,Rt.z)}toNonIndexed(){function e(c,d){const u=c.array,f=c.itemSize,p=c.normalized,h=new u.constructor(d.length*f);let m=0,_=0;for(let b=0,x=d.length;b<x;b++){c.isInterleavedBufferAttribute?m=d[b]*c.data.stride+c.offset:m=d[b]*f;for(let g=0;g<f;g++)h[_++]=u[m++]}return new An(h,f,p)}if(this.index===null)return Fe("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new un,i=this.index.array,r=this.attributes;for(const c in r){const d=r[c],u=e(d,i);t.setAttribute(c,u)}const o=this.morphAttributes;for(const c in o){const d=[],u=o[c];for(let f=0,p=u.length;f<p;f++){const h=u[f],m=e(h,i);d.push(m)}t.morphAttributes[c]=d}t.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let c=0,d=a.length;c<d;c++){const u=a[c];t.addGroup(u.start,u.count,u.materialIndex)}return t}toJSON(){const e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){const d=this.parameters;for(const u in d)d[u]!==void 0&&(e[u]=d[u]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const i=this.attributes;for(const d in i){const u=i[d];e.data.attributes[d]=u.toJSON(e.data)}const r={};let o=!1;for(const d in this.morphAttributes){const u=this.morphAttributes[d],f=[];for(let p=0,h=u.length;p<h;p++){const m=u[p];f.push(m.toJSON(e.data))}f.length>0&&(r[d]=f,o=!0)}o&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));const c=this.boundingSphere;return c!==null&&(e.data.boundingSphere=c.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const i=e.index;i!==null&&this.setIndex(i.clone());const r=e.attributes;for(const u in r){const f=r[u];this.setAttribute(u,f.clone(t))}const o=e.morphAttributes;for(const u in o){const f=[],p=o[u];for(let h=0,m=p.length;h<m;h++)f.push(p[h].clone(t));this.morphAttributes[u]=f}this.morphTargetsRelative=e.morphTargetsRelative;const a=e.groups;for(let u=0,f=a.length;u<f;u++){const p=a[u];this.addGroup(p.start,p.count,p.materialIndex)}const c=e.boundingBox;c!==null&&(this.boundingBox=c.clone());const d=e.boundingSphere;return d!==null&&(this.boundingSphere=d.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const hd=new vt,gi=new al,Do=new Us,pd=new k,Fo=new k,No=new k,Uo=new k,ba=new k,Oo=new k,md=new k,Bo=new k;class Dn extends Ft{constructor(e=new un,t=new cl){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){const r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let o=0,a=r.length;o<a;o++){const c=r[o].name||String(o);this.morphTargetInfluences.push(0),this.morphTargetDictionary[c]=o}}}}getVertexPosition(e,t){const i=this.geometry,r=i.attributes.position,o=i.morphAttributes.position,a=i.morphTargetsRelative;t.fromBufferAttribute(r,e);const c=this.morphTargetInfluences;if(o&&c){Oo.set(0,0,0);for(let d=0,u=o.length;d<u;d++){const f=c[d],p=o[d];f!==0&&(ba.fromBufferAttribute(p,e),a?Oo.addScaledVector(ba,f):Oo.addScaledVector(ba.sub(t),f))}t.add(Oo)}return t}raycast(e,t){const i=this.geometry,r=this.material,o=this.matrixWorld;r!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Do.copy(i.boundingSphere),Do.applyMatrix4(o),gi.copy(e.ray).recast(e.near),!(Do.containsPoint(gi.origin)===!1&&(gi.intersectSphere(Do,pd)===null||gi.origin.distanceToSquared(pd)>(e.far-e.near)**2))&&(hd.copy(o).invert(),gi.copy(e.ray).applyMatrix4(hd),!(i.boundingBox!==null&&gi.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,gi)))}_computeIntersections(e,t,i){let r;const o=this.geometry,a=this.material,c=o.index,d=o.attributes.position,u=o.attributes.uv,f=o.attributes.uv1,p=o.attributes.normal,h=o.groups,m=o.drawRange;if(c!==null)if(Array.isArray(a))for(let _=0,b=h.length;_<b;_++){const x=h[_],g=a[x.materialIndex],w=Math.max(x.start,m.start),T=Math.min(c.count,Math.min(x.start+x.count,m.start+m.count));for(let L=w,R=T;L<R;L+=3){const M=c.getX(L),A=c.getX(L+1),F=c.getX(L+2);r=Go(this,g,e,i,u,f,p,M,A,F),r&&(r.faceIndex=Math.floor(L/3),r.face.materialIndex=x.materialIndex,t.push(r))}}else{const _=Math.max(0,m.start),b=Math.min(c.count,m.start+m.count);for(let x=_,g=b;x<g;x+=3){const w=c.getX(x),T=c.getX(x+1),L=c.getX(x+2);r=Go(this,a,e,i,u,f,p,w,T,L),r&&(r.faceIndex=Math.floor(x/3),t.push(r))}}else if(d!==void 0)if(Array.isArray(a))for(let _=0,b=h.length;_<b;_++){const x=h[_],g=a[x.materialIndex],w=Math.max(x.start,m.start),T=Math.min(d.count,Math.min(x.start+x.count,m.start+m.count));for(let L=w,R=T;L<R;L+=3){const M=L,A=L+1,F=L+2;r=Go(this,g,e,i,u,f,p,M,A,F),r&&(r.faceIndex=Math.floor(L/3),r.face.materialIndex=x.materialIndex,t.push(r))}}else{const _=Math.max(0,m.start),b=Math.min(d.count,m.start+m.count);for(let x=_,g=b;x<g;x+=3){const w=x,T=x+1,L=x+2;r=Go(this,a,e,i,u,f,p,w,T,L),r&&(r.faceIndex=Math.floor(x/3),t.push(r))}}}}function am(n,e,t,i,r,o,a,c){let d;if(e.side===Xt?d=i.intersectTriangle(a,o,r,!0,c):d=i.intersectTriangle(r,o,a,e.side===ai,c),d===null)return null;Bo.copy(c),Bo.applyMatrix4(n.matrixWorld);const u=t.ray.origin.distanceTo(Bo);return u<t.near||u>t.far?null:{distance:u,point:Bo.clone(),object:n}}function Go(n,e,t,i,r,o,a,c,d,u){n.getVertexPosition(c,Fo),n.getVertexPosition(d,No),n.getVertexPosition(u,Uo);const f=am(n,e,t,i,Fo,No,Uo,md);if(f){const p=new k;xn.getBarycoord(md,Fo,No,Uo,p),r&&(f.uv=xn.getInterpolatedAttribute(r,c,d,u,p,new Be)),o&&(f.uv1=xn.getInterpolatedAttribute(o,c,d,u,p,new Be)),a&&(f.normal=xn.getInterpolatedAttribute(a,c,d,u,p,new k),f.normal.dot(i.direction)>0&&f.normal.multiplyScalar(-1));const h={a:c,b:d,c:u,normal:new k,materialIndex:0};xn.getNormal(Fo,No,Uo,h.normal),f.face=h,f.barycoord=p}return f}class mo extends un{constructor(e=1,t=1,i=1,r=1,o=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:r,heightSegments:o,depthSegments:a};const c=this;r=Math.floor(r),o=Math.floor(o),a=Math.floor(a);const d=[],u=[],f=[],p=[];let h=0,m=0;_("z","y","x",-1,-1,i,t,e,a,o,0),_("z","y","x",1,-1,i,t,-e,a,o,1),_("x","z","y",1,1,e,i,t,r,a,2),_("x","z","y",1,-1,e,i,-t,r,a,3),_("x","y","z",1,-1,e,t,i,r,o,4),_("x","y","z",-1,-1,e,t,-i,r,o,5),this.setIndex(d),this.setAttribute("position",new Ht(u,3)),this.setAttribute("normal",new Ht(f,3)),this.setAttribute("uv",new Ht(p,2));function _(b,x,g,w,T,L,R,M,A,F,E){const S=L/A,P=R/F,O=L/2,B=R/2,W=M/2,V=A+1,X=F+1;let Q=0,$=0;const ie=new k;for(let ne=0;ne<X;ne++){const xe=ne*P-B;for(let je=0;je<V;je++){const tt=je*S-O;ie[b]=tt*w,ie[x]=xe*T,ie[g]=W,u.push(ie.x,ie.y,ie.z),ie[b]=0,ie[x]=0,ie[g]=M>0?1:-1,f.push(ie.x,ie.y,ie.z),p.push(je/A),p.push(1-ne/F),Q+=1}}for(let ne=0;ne<F;ne++)for(let xe=0;xe<A;xe++){const je=h+xe+V*ne,tt=h+xe+V*(ne+1),nt=h+(xe+1)+V*(ne+1),it=h+(xe+1)+V*ne;d.push(je,tt,it),d.push(tt,nt,it),$+=6}c.addGroup(m,$,E),m+=$,h+=Q}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new mo(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}function _r(n){const e={};for(const t in n){e[t]={};for(const i in n[t]){const r=n[t][i];r&&(r.isColor||r.isMatrix3||r.isMatrix4||r.isVector2||r.isVector3||r.isVector4||r.isTexture||r.isQuaternion)?r.isRenderTargetTexture?(Fe("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=r.clone():Array.isArray(r)?e[t][i]=r.slice():e[t][i]=r}}return e}function Gt(n){const e={};for(let t=0;t<n.length;t++){const i=_r(n[t]);for(const r in i)e[r]=i[r]}return e}function cm(n){const e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function tf(n){const e=n.getRenderTarget();return e===null?n.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:Qe.workingColorSpace}const lm={clone:_r,merge:Gt};var dm=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,um=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Xn extends Mr{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=dm,this.fragmentShader=um,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=_r(e.uniforms),this.uniformsGroups=cm(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const r in this.uniforms){const a=this.uniforms[r].value;a&&a.isTexture?t.uniforms[r]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[r]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[r]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[r]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[r]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[r]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[r]={type:"m4",value:a.toArray()}:t.uniforms[r]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const i={};for(const r in this.extensions)this.extensions[r]===!0&&(i[r]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}}class nf extends Ft{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new vt,this.projectionMatrix=new vt,this.projectionMatrixInverse=new vt,this.coordinateSystem=wn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const ei=new k,gd=new Be,xd=new Be;class an extends nf{constructor(e=50,t=1,i=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=Pc*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(os*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Pc*2*Math.atan(Math.tan(os*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){ei.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(ei.x,ei.y).multiplyScalar(-e/ei.z),ei.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(ei.x,ei.y).multiplyScalar(-e/ei.z)}getViewSize(e,t){return this.getViewBounds(e,gd,xd),t.subVectors(xd,gd)}setViewOffset(e,t,i,r,o,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=o,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(os*.5*this.fov)/this.zoom,i=2*t,r=this.aspect*i,o=-.5*r;const a=this.view;if(this.view!==null&&this.view.enabled){const d=a.fullWidth,u=a.fullHeight;o+=a.offsetX*r/d,t-=a.offsetY*i/u,r*=a.width/d,i*=a.height/u}const c=this.filmOffset;c!==0&&(o+=e*c/this.getFilmWidth()),this.projectionMatrix.makePerspective(o,o+r,t,t-i,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}const Zi=-90,Qi=1;class fm extends Ft{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;const r=new an(Zi,Qi,e,t);r.layers=this.layers,this.add(r);const o=new an(Zi,Qi,e,t);o.layers=this.layers,this.add(o);const a=new an(Zi,Qi,e,t);a.layers=this.layers,this.add(a);const c=new an(Zi,Qi,e,t);c.layers=this.layers,this.add(c);const d=new an(Zi,Qi,e,t);d.layers=this.layers,this.add(d);const u=new an(Zi,Qi,e,t);u.layers=this.layers,this.add(u)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[i,r,o,a,c,d]=t;for(const u of t)this.remove(u);if(e===wn)i.up.set(0,1,0),i.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),o.up.set(0,0,-1),o.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),c.up.set(0,1,0),c.lookAt(0,0,1),d.up.set(0,1,0),d.lookAt(0,0,-1);else if(e===Ss)i.up.set(0,-1,0),i.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),o.up.set(0,0,1),o.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),c.up.set(0,-1,0),c.lookAt(0,0,1),d.up.set(0,-1,0),d.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const u of t)this.add(u),u.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:i,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[o,a,c,d,u,f]=this.children,p=e.getRenderTarget(),h=e.getActiveCubeFace(),m=e.getActiveMipmapLevel(),_=e.xr.enabled;e.xr.enabled=!1;const b=i.texture.generateMipmaps;i.texture.generateMipmaps=!1,e.setRenderTarget(i,0,r),e.render(t,o),e.setRenderTarget(i,1,r),e.render(t,a),e.setRenderTarget(i,2,r),e.render(t,c),e.setRenderTarget(i,3,r),e.render(t,d),e.setRenderTarget(i,4,r),e.render(t,u),i.texture.generateMipmaps=b,e.setRenderTarget(i,5,r),e.render(t,f),e.setRenderTarget(p,h,m),e.xr.enabled=_,i.texture.needsPMREMUpdate=!0}}class rf extends zt{constructor(e=[],t=mr,i,r,o,a,c,d,u,f){super(e,t,i,r,o,a,c,d,u,f),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class hm extends Ri{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const i={width:e,height:e,depth:1},r=[i,i,i,i,i,i];this.texture=new rf(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const i={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},r=new mo(5,5,5),o=new Xn({name:"CubemapFromEquirect",uniforms:_r(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Xt,blending:Wn});o.uniforms.tEquirect.value=t;const a=new Dn(r,o),c=t.minFilter;return t.minFilter===Ei&&(t.minFilter=ln),new fm(1,10,this).update(e,a),t.minFilter=c,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,i=!0,r=!0){const o=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,i,r);e.setRenderTarget(o)}}class ar extends Ft{constructor(){super(),this.isGroup=!0,this.type="Group"}}const pm={type:"move"};class ya{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new ar,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new ar,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new k,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new k),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new ar,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new k,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new k),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let r=null,o=null,a=null;const c=this._targetRay,d=this._grip,u=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(u&&e.hand){a=!0;for(const b of e.hand.values()){const x=t.getJointPose(b,i),g=this._getHandJoint(u,b);x!==null&&(g.matrix.fromArray(x.transform.matrix),g.matrix.decompose(g.position,g.rotation,g.scale),g.matrixWorldNeedsUpdate=!0,g.jointRadius=x.radius),g.visible=x!==null}const f=u.joints["index-finger-tip"],p=u.joints["thumb-tip"],h=f.position.distanceTo(p.position),m=.02,_=.005;u.inputState.pinching&&h>m+_?(u.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!u.inputState.pinching&&h<=m-_&&(u.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else d!==null&&e.gripSpace&&(o=t.getPose(e.gripSpace,i),o!==null&&(d.matrix.fromArray(o.transform.matrix),d.matrix.decompose(d.position,d.rotation,d.scale),d.matrixWorldNeedsUpdate=!0,o.linearVelocity?(d.hasLinearVelocity=!0,d.linearVelocity.copy(o.linearVelocity)):d.hasLinearVelocity=!1,o.angularVelocity?(d.hasAngularVelocity=!0,d.angularVelocity.copy(o.angularVelocity)):d.hasAngularVelocity=!1));c!==null&&(r=t.getPose(e.targetRaySpace,i),r===null&&o!==null&&(r=o),r!==null&&(c.matrix.fromArray(r.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,r.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(r.linearVelocity)):c.hasLinearVelocity=!1,r.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(r.angularVelocity)):c.hasAngularVelocity=!1,this.dispatchEvent(pm)))}return c!==null&&(c.visible=r!==null),d!==null&&(d.visible=o!==null),u!==null&&(u.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const i=new ar;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}}class mm extends Ft{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new In,this.environmentIntensity=1,this.environmentRotation=new In,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}}class gm extends zt{constructor(e=null,t=1,i=1,r,o,a,c,d,u=tn,f=tn,p,h){super(null,a,c,d,u,f,r,o,p,h),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const Sa=new k,xm=new k,_m=new ke;class ni{constructor(e=new k(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,r){return this.normal.set(e,t,i),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){const r=Sa.subVectors(i,t).cross(xm.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){const i=e.delta(Sa),r=this.normal.dot(i);if(r===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const o=-(e.start.dot(this.normal)+this.constant)/r;return o<0||o>1?null:t.copy(e.start).addScaledVector(i,o)}intersectsLine(e){const t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const i=t||_m.getNormalMatrix(e),r=this.coplanarPoint(Sa).applyMatrix4(e),o=this.normal.applyMatrix3(i).normalize();return this.constant=-r.dot(o),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const xi=new Us,bm=new Be(.5,.5),ko=new k;class ll{constructor(e=new ni,t=new ni,i=new ni,r=new ni,o=new ni,a=new ni){this.planes=[e,t,i,r,o,a]}set(e,t,i,r,o,a){const c=this.planes;return c[0].copy(e),c[1].copy(t),c[2].copy(i),c[3].copy(r),c[4].copy(o),c[5].copy(a),this}copy(e){const t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=wn,i=!1){const r=this.planes,o=e.elements,a=o[0],c=o[1],d=o[2],u=o[3],f=o[4],p=o[5],h=o[6],m=o[7],_=o[8],b=o[9],x=o[10],g=o[11],w=o[12],T=o[13],L=o[14],R=o[15];if(r[0].setComponents(u-a,m-f,g-_,R-w).normalize(),r[1].setComponents(u+a,m+f,g+_,R+w).normalize(),r[2].setComponents(u+c,m+p,g+b,R+T).normalize(),r[3].setComponents(u-c,m-p,g-b,R-T).normalize(),i)r[4].setComponents(d,h,x,L).normalize(),r[5].setComponents(u-d,m-h,g-x,R-L).normalize();else if(r[4].setComponents(u-d,m-h,g-x,R-L).normalize(),t===wn)r[5].setComponents(u+d,m+h,g+x,R+L).normalize();else if(t===Ss)r[5].setComponents(d,h,x,L).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),xi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),xi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(xi)}intersectsSprite(e){xi.center.set(0,0,0);const t=bm.distanceTo(e.center);return xi.radius=.7071067811865476+t,xi.applyMatrix4(e.matrixWorld),this.intersectsSphere(xi)}intersectsSphere(e){const t=this.planes,i=e.center,r=-e.radius;for(let o=0;o<6;o++)if(t[o].distanceToPoint(i)<r)return!1;return!0}intersectsBox(e){const t=this.planes;for(let i=0;i<6;i++){const r=t[i];if(ko.x=r.normal.x>0?e.max.x:e.min.x,ko.y=r.normal.y>0?e.max.y:e.min.y,ko.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(ko)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class dl extends Mr{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new ze(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}}const Es=new k,Ms=new k,_d=new vt,Br=new al,zo=new Us,va=new k,bd=new k;class ym extends Ft{constructor(e=new un,t=new dl){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,i=[0];for(let r=1,o=t.count;r<o;r++)Es.fromBufferAttribute(t,r-1),Ms.fromBufferAttribute(t,r),i[r]=i[r-1],i[r]+=Es.distanceTo(Ms);e.setAttribute("lineDistance",new Ht(i,1))}else Fe("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){const i=this.geometry,r=this.matrixWorld,o=e.params.Line.threshold,a=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),zo.copy(i.boundingSphere),zo.applyMatrix4(r),zo.radius+=o,e.ray.intersectsSphere(zo)===!1)return;_d.copy(r).invert(),Br.copy(e.ray).applyMatrix4(_d);const c=o/((this.scale.x+this.scale.y+this.scale.z)/3),d=c*c,u=this.isLineSegments?2:1,f=i.index,h=i.attributes.position;if(f!==null){const m=Math.max(0,a.start),_=Math.min(f.count,a.start+a.count);for(let b=m,x=_-1;b<x;b+=u){const g=f.getX(b),w=f.getX(b+1),T=Ho(this,e,Br,d,g,w,b);T&&t.push(T)}if(this.isLineLoop){const b=f.getX(_-1),x=f.getX(m),g=Ho(this,e,Br,d,b,x,_-1);g&&t.push(g)}}else{const m=Math.max(0,a.start),_=Math.min(h.count,a.start+a.count);for(let b=m,x=_-1;b<x;b+=u){const g=Ho(this,e,Br,d,b,b+1,b);g&&t.push(g)}if(this.isLineLoop){const b=Ho(this,e,Br,d,_-1,m,_-1);b&&t.push(b)}}}updateMorphTargets(){const t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){const r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let o=0,a=r.length;o<a;o++){const c=r[o].name||String(o);this.morphTargetInfluences.push(0),this.morphTargetDictionary[c]=o}}}}}function Ho(n,e,t,i,r,o,a){const c=n.geometry.attributes.position;if(Es.fromBufferAttribute(c,r),Ms.fromBufferAttribute(c,o),t.distanceSqToSegment(Es,Ms,va,bd)>i)return;va.applyMatrix4(n.matrixWorld);const u=e.ray.origin.distanceTo(va);if(!(u<e.near||u>e.far))return{distance:u,point:bd.clone().applyMatrix4(n.matrixWorld),index:a,face:null,faceIndex:null,barycoord:null,object:n}}const yd=new k,Sd=new k;class ss extends ym{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,i=[];for(let r=0,o=t.count;r<o;r+=2)yd.fromBufferAttribute(t,r),Sd.fromBufferAttribute(t,r+1),i[r]=r===0?0:i[r-1],i[r+1]=i[r]+yd.distanceTo(Sd);e.setAttribute("lineDistance",new Ht(i,1))}else Fe("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class of extends zt{constructor(e,t,i=Ai,r,o,a,c=tn,d=tn,u,f=ro,p=1){if(f!==ro&&f!==oo)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const h={width:e,height:t,depth:p};super(h,r,o,a,c,d,f,i,u),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new sl(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}}class sf extends zt{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}}class ul extends un{constructor(e=1,t=1,i=1,r=32,o=1,a=!1,c=0,d=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:i,radialSegments:r,heightSegments:o,openEnded:a,thetaStart:c,thetaLength:d};const u=this;r=Math.floor(r),o=Math.floor(o);const f=[],p=[],h=[],m=[];let _=0;const b=[],x=i/2;let g=0;w(),a===!1&&(e>0&&T(!0),t>0&&T(!1)),this.setIndex(f),this.setAttribute("position",new Ht(p,3)),this.setAttribute("normal",new Ht(h,3)),this.setAttribute("uv",new Ht(m,2));function w(){const L=new k,R=new k;let M=0;const A=(t-e)/i;for(let F=0;F<=o;F++){const E=[],S=F/o,P=S*(t-e)+e;for(let O=0;O<=r;O++){const B=O/r,W=B*d+c,V=Math.sin(W),X=Math.cos(W);R.x=P*V,R.y=-S*i+x,R.z=P*X,p.push(R.x,R.y,R.z),L.set(V,A,X).normalize(),h.push(L.x,L.y,L.z),m.push(B,1-S),E.push(_++)}b.push(E)}for(let F=0;F<r;F++)for(let E=0;E<o;E++){const S=b[E][F],P=b[E+1][F],O=b[E+1][F+1],B=b[E][F+1];(e>0||E!==0)&&(f.push(S,P,B),M+=3),(t>0||E!==o-1)&&(f.push(P,O,B),M+=3)}u.addGroup(g,M,0),g+=M}function T(L){const R=_,M=new Be,A=new k;let F=0;const E=L===!0?e:t,S=L===!0?1:-1;for(let O=1;O<=r;O++)p.push(0,x*S,0),h.push(0,S,0),m.push(.5,.5),_++;const P=_;for(let O=0;O<=r;O++){const W=O/r*d+c,V=Math.cos(W),X=Math.sin(W);A.x=E*X,A.y=x*S,A.z=E*V,p.push(A.x,A.y,A.z),h.push(0,S,0),M.x=V*.5+.5,M.y=X*.5*S+.5,m.push(M.x,M.y),_++}for(let O=0;O<r;O++){const B=R+O,W=P+O;L===!0?f.push(W,W+1,B):f.push(W+1,W,B),F+=3}u.addGroup(g,F,L===!0?1:2),g+=F}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new ul(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class fl extends ul{constructor(e=1,t=1,i=32,r=1,o=!1,a=0,c=Math.PI*2){super(0,e,t,i,r,o,a,c),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:i,heightSegments:r,openEnded:o,thetaStart:a,thetaLength:c}}static fromJSON(e){return new fl(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class go extends un{constructor(e=1,t=1,i=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:r};const o=e/2,a=t/2,c=Math.floor(i),d=Math.floor(r),u=c+1,f=d+1,p=e/c,h=t/d,m=[],_=[],b=[],x=[];for(let g=0;g<f;g++){const w=g*h-a;for(let T=0;T<u;T++){const L=T*p-o;_.push(L,-w,0),b.push(0,0,1),x.push(T/c),x.push(1-g/d)}}for(let g=0;g<d;g++)for(let w=0;w<c;w++){const T=w+u*g,L=w+u*(g+1),R=w+1+u*(g+1),M=w+1+u*g;m.push(T,L,M),m.push(L,R,M)}this.setIndex(m),this.setAttribute("position",new Ht(_,3)),this.setAttribute("normal",new Ht(b,3)),this.setAttribute("uv",new Ht(x,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new go(e.width,e.height,e.widthSegments,e.heightSegments)}}class Sm extends Mr{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new ze(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new ze(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Xu,this.normalScale=new Be(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new In,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class vm extends Mr{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Pp,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class Em extends Mr{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}class af extends Ft{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new ze(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}}const Ea=new vt,vd=new k,Ed=new k;class Mm{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Be(512,512),this.mapType=Pn,this.map=null,this.mapPass=null,this.matrix=new vt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new ll,this._frameExtents=new Be(1,1),this._viewportCount=1,this._viewports=[new St(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){const t=this.camera,i=this.matrix;vd.setFromMatrixPosition(e.matrixWorld),t.position.copy(vd),Ed.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Ed),t.updateMatrixWorld(),Ea.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Ea,t.coordinateSystem,t.reversedDepth),t.reversedDepth?i.set(.5,0,0,.5,0,.5,0,.5,0,0,1,0,0,0,0,1):i.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),i.multiply(Ea)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}class cf extends nf{constructor(e=-1,t=1,i=1,r=-1,o=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=r,this.near=o,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,r,o,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=o,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,r=(this.top+this.bottom)/2;let o=i-e,a=i+e,c=r+t,d=r-t;if(this.view!==null&&this.view.enabled){const u=(this.right-this.left)/this.view.fullWidth/this.zoom,f=(this.top-this.bottom)/this.view.fullHeight/this.zoom;o+=u*this.view.offsetX,a=o+u*this.view.width,c-=f*this.view.offsetY,d=c-f*this.view.height}this.projectionMatrix.makeOrthographic(o,a,c,d,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}class Tm extends Mm{constructor(){super(new cf(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class Md extends af{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Ft.DEFAULT_UP),this.updateMatrix(),this.target=new Ft,this.shadow=new Tm}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}}class Cm extends af{constructor(e,t){super(e,t),this.isAmbientLight=!0,this.type="AmbientLight"}}class wm extends an{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}}class Td{constructor(e=1,t=0,i=0){this.radius=e,this.phi=t,this.theta=i}set(e,t,i){return this.radius=e,this.phi=t,this.theta=i,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=We(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,i){return this.radius=Math.sqrt(e*e+t*t+i*i),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,i),this.phi=Math.acos(We(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}}class lf extends ss{constructor(e=10,t=10,i=4473924,r=8947848){i=new ze(i),r=new ze(r);const o=t/2,a=e/t,c=e/2,d=[],u=[];for(let h=0,m=0,_=-c;h<=t;h++,_+=a){d.push(-c,0,_,c,0,_),d.push(_,0,-c,_,0,c);const b=h===o?i:r;b.toArray(u,m),m+=3,b.toArray(u,m),m+=3,b.toArray(u,m),m+=3,b.toArray(u,m),m+=3}const f=new un;f.setAttribute("position",new Ht(d,3)),f.setAttribute("color",new Ht(u,3));const p=new dl({vertexColors:!0,toneMapped:!1});super(f,p),this.type="GridHelper"}dispose(){this.geometry.dispose(),this.material.dispose()}}class Am extends Ni{constructor(e,t=null){super(),this.object=e,this.domElement=t,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(e){if(e===void 0){Fe("Controls: connect() now requires an element.");return}this.domElement!==null&&this.disconnect(),this.domElement=e}disconnect(){}dispose(){}update(){}}function Cd(n,e,t,i){const r=Lm(i);switch(t){case Wu:return n*e;case $u:return n*e/r.components*r.byteLength;case nl:return n*e/r.components*r.byteLength;case il:return n*e*2/r.components*r.byteLength;case rl:return n*e*2/r.components*r.byteLength;case ju:return n*e*3/r.components*r.byteLength;case _n:return n*e*4/r.components*r.byteLength;case ol:return n*e*4/r.components*r.byteLength;case ts:case ns:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case is:case rs:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case rc:case sc:return Math.max(n,16)*Math.max(e,8)/4;case ic:case oc:return Math.max(n,8)*Math.max(e,8)/2;case ac:case cc:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case lc:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case dc:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case uc:return Math.floor((n+4)/5)*Math.floor((e+3)/4)*16;case fc:return Math.floor((n+4)/5)*Math.floor((e+4)/5)*16;case hc:return Math.floor((n+5)/6)*Math.floor((e+4)/5)*16;case pc:return Math.floor((n+5)/6)*Math.floor((e+5)/6)*16;case mc:return Math.floor((n+7)/8)*Math.floor((e+4)/5)*16;case gc:return Math.floor((n+7)/8)*Math.floor((e+5)/6)*16;case xc:return Math.floor((n+7)/8)*Math.floor((e+7)/8)*16;case _c:return Math.floor((n+9)/10)*Math.floor((e+4)/5)*16;case bc:return Math.floor((n+9)/10)*Math.floor((e+5)/6)*16;case yc:return Math.floor((n+9)/10)*Math.floor((e+7)/8)*16;case Sc:return Math.floor((n+9)/10)*Math.floor((e+9)/10)*16;case vc:return Math.floor((n+11)/12)*Math.floor((e+9)/10)*16;case Ec:return Math.floor((n+11)/12)*Math.floor((e+11)/12)*16;case Mc:case Tc:case Cc:return Math.ceil(n/4)*Math.ceil(e/4)*16;case wc:case Ac:return Math.ceil(n/4)*Math.ceil(e/4)*8;case Lc:case Rc:return Math.ceil(n/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function Lm(n){switch(n){case Pn:case ku:return{byteLength:1,components:1};case no:case zu:case Er:return{byteLength:2,components:1};case el:case tl:return{byteLength:2,components:4};case Ai:case Qc:case Vn:return{byteLength:4,components:1};case Hu:case Vu:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${n}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Zc}}));typeof window<"u"&&(window.__THREE__?Fe("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Zc);function df(){let n=null,e=!1,t=null,i=null;function r(o,a){t(o,a),i=n.requestAnimationFrame(r)}return{start:function(){e!==!0&&t!==null&&(i=n.requestAnimationFrame(r),e=!0)},stop:function(){n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(o){t=o},setContext:function(o){n=o}}}function Rm(n){const e=new WeakMap;function t(c,d){const u=c.array,f=c.usage,p=u.byteLength,h=n.createBuffer();n.bindBuffer(d,h),n.bufferData(d,u,f),c.onUploadCallback();let m;if(u instanceof Float32Array)m=n.FLOAT;else if(typeof Float16Array<"u"&&u instanceof Float16Array)m=n.HALF_FLOAT;else if(u instanceof Uint16Array)c.isFloat16BufferAttribute?m=n.HALF_FLOAT:m=n.UNSIGNED_SHORT;else if(u instanceof Int16Array)m=n.SHORT;else if(u instanceof Uint32Array)m=n.UNSIGNED_INT;else if(u instanceof Int32Array)m=n.INT;else if(u instanceof Int8Array)m=n.BYTE;else if(u instanceof Uint8Array)m=n.UNSIGNED_BYTE;else if(u instanceof Uint8ClampedArray)m=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+u);return{buffer:h,type:m,bytesPerElement:u.BYTES_PER_ELEMENT,version:c.version,size:p}}function i(c,d,u){const f=d.array,p=d.updateRanges;if(n.bindBuffer(u,c),p.length===0)n.bufferSubData(u,0,f);else{p.sort((m,_)=>m.start-_.start);let h=0;for(let m=1;m<p.length;m++){const _=p[h],b=p[m];b.start<=_.start+_.count+1?_.count=Math.max(_.count,b.start+b.count-_.start):(++h,p[h]=b)}p.length=h+1;for(let m=0,_=p.length;m<_;m++){const b=p[m];n.bufferSubData(u,b.start*f.BYTES_PER_ELEMENT,f,b.start,b.count)}d.clearUpdateRanges()}d.onUploadCallback()}function r(c){return c.isInterleavedBufferAttribute&&(c=c.data),e.get(c)}function o(c){c.isInterleavedBufferAttribute&&(c=c.data);const d=e.get(c);d&&(n.deleteBuffer(d.buffer),e.delete(c))}function a(c,d){if(c.isInterleavedBufferAttribute&&(c=c.data),c.isGLBufferAttribute){const f=e.get(c);(!f||f.version<c.version)&&e.set(c,{buffer:c.buffer,type:c.type,bytesPerElement:c.elementSize,version:c.version});return}const u=e.get(c);if(u===void 0)e.set(c,t(c,d));else if(u.version<c.version){if(u.size!==c.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(u.buffer,c,d),u.version=c.version}}return{get:r,remove:o,update:a}}var Pm=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Im=`#ifdef USE_ALPHAHASH
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
#endif`,Dm=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Fm=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Nm=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Um=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Om=`#ifdef USE_AOMAP
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
#endif`,Bm=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Gm=`#ifdef USE_BATCHING
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
#endif`,km=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,zm=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Hm=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Vm=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,Wm=`#ifdef USE_IRIDESCENCE
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
#endif`,jm=`#ifdef USE_BUMPMAP
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
#endif`,$m=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,Xm=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,qm=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Ym=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Km=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Jm=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Zm=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,Qm=`#if defined( USE_COLOR_ALPHA )
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
#endif`,eg=`#define PI 3.141592653589793
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
} // validated`,tg=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,ng=`vec3 transformedNormal = objectNormal;
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
#endif`,ig=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,rg=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,og=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,sg=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,ag="gl_FragColor = linearToOutputTexel( gl_FragColor );",cg=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,lg=`#ifdef USE_ENVMAP
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
#endif`,dg=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,ug=`#ifdef USE_ENVMAP
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
#endif`,fg=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,hg=`#ifdef USE_ENVMAP
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
#endif`,pg=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,mg=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,gg=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,xg=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,_g=`#ifdef USE_GRADIENTMAP
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
}`,bg=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,yg=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Sg=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,vg=`uniform bool receiveShadow;
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
#endif`,Eg=`#ifdef USE_ENVMAP
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
#endif`,Mg=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Tg=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Cg=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,wg=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Ag=`PhysicalMaterial material;
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
#endif`,Lg=`uniform sampler2D dfgLUT;
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
}`,Rg=`
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
#endif`,Pg=`#if defined( RE_IndirectDiffuse )
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
#endif`,Ig=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Dg=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Fg=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Ng=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Ug=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Og=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Bg=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Gg=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,kg=`#if defined( USE_POINTS_UV )
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
#endif`,zg=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Hg=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Vg=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Wg=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,jg=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,$g=`#ifdef USE_MORPHTARGETS
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
#endif`,Xg=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,qg=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,Yg=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,Kg=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Jg=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Zg=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Qg=`#ifdef USE_NORMALMAP
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
#endif`,e0=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,t0=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,n0=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,i0=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,r0=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,o0=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,s0=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,a0=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,c0=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,l0=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,d0=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,u0=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,f0=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,h0=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,p0=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,m0=`float getShadowMask() {
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
}`,g0=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,x0=`#ifdef USE_SKINNING
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
#endif`,_0=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,b0=`#ifdef USE_SKINNING
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
#endif`,y0=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,S0=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,v0=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,E0=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,M0=`#ifdef USE_TRANSMISSION
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
#endif`,T0=`#ifdef USE_TRANSMISSION
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
#endif`,C0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,w0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,A0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,L0=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const R0=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,P0=`uniform sampler2D t2D;
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
}`,I0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,D0=`#ifdef ENVMAP_TYPE_CUBE
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
}`,F0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,N0=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,U0=`#include <common>
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
}`,O0=`#if DEPTH_PACKING == 3200
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
}`,B0=`#define DISTANCE
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
}`,G0=`#define DISTANCE
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
}`,k0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,z0=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,H0=`uniform float scale;
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
}`,V0=`uniform vec3 diffuse;
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
}`,W0=`#include <common>
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
}`,j0=`uniform vec3 diffuse;
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
}`,$0=`#define LAMBERT
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
}`,X0=`#define LAMBERT
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
}`,q0=`#define MATCAP
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
}`,Y0=`#define MATCAP
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
}`,K0=`#define NORMAL
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
}`,J0=`#define NORMAL
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
}`,Z0=`#define PHONG
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
}`,Q0=`#define PHONG
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
}`,ex=`#define STANDARD
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
}`,tx=`#define STANDARD
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
}`,nx=`#define TOON
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
}`,ix=`#define TOON
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
}`,rx=`uniform float size;
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
}`,ox=`uniform vec3 diffuse;
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
}`,sx=`#include <common>
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
}`,ax=`uniform vec3 color;
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
}`,cx=`uniform float rotation;
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
}`,lx=`uniform vec3 diffuse;
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
}`,He={alphahash_fragment:Pm,alphahash_pars_fragment:Im,alphamap_fragment:Dm,alphamap_pars_fragment:Fm,alphatest_fragment:Nm,alphatest_pars_fragment:Um,aomap_fragment:Om,aomap_pars_fragment:Bm,batching_pars_vertex:Gm,batching_vertex:km,begin_vertex:zm,beginnormal_vertex:Hm,bsdfs:Vm,iridescence_fragment:Wm,bumpmap_pars_fragment:jm,clipping_planes_fragment:$m,clipping_planes_pars_fragment:Xm,clipping_planes_pars_vertex:qm,clipping_planes_vertex:Ym,color_fragment:Km,color_pars_fragment:Jm,color_pars_vertex:Zm,color_vertex:Qm,common:eg,cube_uv_reflection_fragment:tg,defaultnormal_vertex:ng,displacementmap_pars_vertex:ig,displacementmap_vertex:rg,emissivemap_fragment:og,emissivemap_pars_fragment:sg,colorspace_fragment:ag,colorspace_pars_fragment:cg,envmap_fragment:lg,envmap_common_pars_fragment:dg,envmap_pars_fragment:ug,envmap_pars_vertex:fg,envmap_physical_pars_fragment:Eg,envmap_vertex:hg,fog_vertex:pg,fog_pars_vertex:mg,fog_fragment:gg,fog_pars_fragment:xg,gradientmap_pars_fragment:_g,lightmap_pars_fragment:bg,lights_lambert_fragment:yg,lights_lambert_pars_fragment:Sg,lights_pars_begin:vg,lights_toon_fragment:Mg,lights_toon_pars_fragment:Tg,lights_phong_fragment:Cg,lights_phong_pars_fragment:wg,lights_physical_fragment:Ag,lights_physical_pars_fragment:Lg,lights_fragment_begin:Rg,lights_fragment_maps:Pg,lights_fragment_end:Ig,logdepthbuf_fragment:Dg,logdepthbuf_pars_fragment:Fg,logdepthbuf_pars_vertex:Ng,logdepthbuf_vertex:Ug,map_fragment:Og,map_pars_fragment:Bg,map_particle_fragment:Gg,map_particle_pars_fragment:kg,metalnessmap_fragment:zg,metalnessmap_pars_fragment:Hg,morphinstance_vertex:Vg,morphcolor_vertex:Wg,morphnormal_vertex:jg,morphtarget_pars_vertex:$g,morphtarget_vertex:Xg,normal_fragment_begin:qg,normal_fragment_maps:Yg,normal_pars_fragment:Kg,normal_pars_vertex:Jg,normal_vertex:Zg,normalmap_pars_fragment:Qg,clearcoat_normal_fragment_begin:e0,clearcoat_normal_fragment_maps:t0,clearcoat_pars_fragment:n0,iridescence_pars_fragment:i0,opaque_fragment:r0,packing:o0,premultiplied_alpha_fragment:s0,project_vertex:a0,dithering_fragment:c0,dithering_pars_fragment:l0,roughnessmap_fragment:d0,roughnessmap_pars_fragment:u0,shadowmap_pars_fragment:f0,shadowmap_pars_vertex:h0,shadowmap_vertex:p0,shadowmask_pars_fragment:m0,skinbase_vertex:g0,skinning_pars_vertex:x0,skinning_vertex:_0,skinnormal_vertex:b0,specularmap_fragment:y0,specularmap_pars_fragment:S0,tonemapping_fragment:v0,tonemapping_pars_fragment:E0,transmission_fragment:M0,transmission_pars_fragment:T0,uv_pars_fragment:C0,uv_pars_vertex:w0,uv_vertex:A0,worldpos_vertex:L0,background_vert:R0,background_frag:P0,backgroundCube_vert:I0,backgroundCube_frag:D0,cube_vert:F0,cube_frag:N0,depth_vert:U0,depth_frag:O0,distanceRGBA_vert:B0,distanceRGBA_frag:G0,equirect_vert:k0,equirect_frag:z0,linedashed_vert:H0,linedashed_frag:V0,meshbasic_vert:W0,meshbasic_frag:j0,meshlambert_vert:$0,meshlambert_frag:X0,meshmatcap_vert:q0,meshmatcap_frag:Y0,meshnormal_vert:K0,meshnormal_frag:J0,meshphong_vert:Z0,meshphong_frag:Q0,meshphysical_vert:ex,meshphysical_frag:tx,meshtoon_vert:nx,meshtoon_frag:ix,points_vert:rx,points_frag:ox,shadow_vert:sx,shadow_frag:ax,sprite_vert:cx,sprite_frag:lx},ce={common:{diffuse:{value:new ze(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new ke},alphaMap:{value:null},alphaMapTransform:{value:new ke},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new ke}},envmap:{envMap:{value:null},envMapRotation:{value:new ke},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new ke}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new ke}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new ke},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new ke},normalScale:{value:new Be(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new ke},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new ke}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new ke}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new ke}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new ze(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new ze(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new ke},alphaTest:{value:0},uvTransform:{value:new ke}},sprite:{diffuse:{value:new ze(16777215)},opacity:{value:1},center:{value:new Be(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new ke},alphaMap:{value:null},alphaMapTransform:{value:new ke},alphaTest:{value:0}}},Mn={basic:{uniforms:Gt([ce.common,ce.specularmap,ce.envmap,ce.aomap,ce.lightmap,ce.fog]),vertexShader:He.meshbasic_vert,fragmentShader:He.meshbasic_frag},lambert:{uniforms:Gt([ce.common,ce.specularmap,ce.envmap,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.fog,ce.lights,{emissive:{value:new ze(0)}}]),vertexShader:He.meshlambert_vert,fragmentShader:He.meshlambert_frag},phong:{uniforms:Gt([ce.common,ce.specularmap,ce.envmap,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.fog,ce.lights,{emissive:{value:new ze(0)},specular:{value:new ze(1118481)},shininess:{value:30}}]),vertexShader:He.meshphong_vert,fragmentShader:He.meshphong_frag},standard:{uniforms:Gt([ce.common,ce.envmap,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.roughnessmap,ce.metalnessmap,ce.fog,ce.lights,{emissive:{value:new ze(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:He.meshphysical_vert,fragmentShader:He.meshphysical_frag},toon:{uniforms:Gt([ce.common,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.gradientmap,ce.fog,ce.lights,{emissive:{value:new ze(0)}}]),vertexShader:He.meshtoon_vert,fragmentShader:He.meshtoon_frag},matcap:{uniforms:Gt([ce.common,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.fog,{matcap:{value:null}}]),vertexShader:He.meshmatcap_vert,fragmentShader:He.meshmatcap_frag},points:{uniforms:Gt([ce.points,ce.fog]),vertexShader:He.points_vert,fragmentShader:He.points_frag},dashed:{uniforms:Gt([ce.common,ce.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:He.linedashed_vert,fragmentShader:He.linedashed_frag},depth:{uniforms:Gt([ce.common,ce.displacementmap]),vertexShader:He.depth_vert,fragmentShader:He.depth_frag},normal:{uniforms:Gt([ce.common,ce.bumpmap,ce.normalmap,ce.displacementmap,{opacity:{value:1}}]),vertexShader:He.meshnormal_vert,fragmentShader:He.meshnormal_frag},sprite:{uniforms:Gt([ce.sprite,ce.fog]),vertexShader:He.sprite_vert,fragmentShader:He.sprite_frag},background:{uniforms:{uvTransform:{value:new ke},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:He.background_vert,fragmentShader:He.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new ke}},vertexShader:He.backgroundCube_vert,fragmentShader:He.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:He.cube_vert,fragmentShader:He.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:He.equirect_vert,fragmentShader:He.equirect_frag},distanceRGBA:{uniforms:Gt([ce.common,ce.displacementmap,{referencePosition:{value:new k},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:He.distanceRGBA_vert,fragmentShader:He.distanceRGBA_frag},shadow:{uniforms:Gt([ce.lights,ce.fog,{color:{value:new ze(0)},opacity:{value:1}}]),vertexShader:He.shadow_vert,fragmentShader:He.shadow_frag}};Mn.physical={uniforms:Gt([Mn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new ke},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new ke},clearcoatNormalScale:{value:new Be(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new ke},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new ke},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new ke},sheen:{value:0},sheenColor:{value:new ze(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new ke},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new ke},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new ke},transmissionSamplerSize:{value:new Be},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new ke},attenuationDistance:{value:0},attenuationColor:{value:new ze(0)},specularColor:{value:new ze(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new ke},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new ke},anisotropyVector:{value:new Be},anisotropyMap:{value:null},anisotropyMapTransform:{value:new ke}}]),vertexShader:He.meshphysical_vert,fragmentShader:He.meshphysical_frag};const Vo={r:0,b:0,g:0},_i=new In,dx=new vt;function ux(n,e,t,i,r,o,a){const c=new ze(0);let d=o===!0?0:1,u,f,p=null,h=0,m=null;function _(T){let L=T.isScene===!0?T.background:null;return L&&L.isTexture&&(L=(T.backgroundBlurriness>0?t:e).get(L)),L}function b(T){let L=!1;const R=_(T);R===null?g(c,d):R&&R.isColor&&(g(R,1),L=!0);const M=n.xr.getEnvironmentBlendMode();M==="additive"?i.buffers.color.setClear(0,0,0,1,a):M==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,a),(n.autoClear||L)&&(i.buffers.depth.setTest(!0),i.buffers.depth.setMask(!0),i.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function x(T,L){const R=_(L);R&&(R.isCubeTexture||R.mapping===Ns)?(f===void 0&&(f=new Dn(new mo(1,1,1),new Xn({name:"BackgroundCubeMaterial",uniforms:_r(Mn.backgroundCube.uniforms),vertexShader:Mn.backgroundCube.vertexShader,fragmentShader:Mn.backgroundCube.fragmentShader,side:Xt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),f.geometry.deleteAttribute("normal"),f.geometry.deleteAttribute("uv"),f.onBeforeRender=function(M,A,F){this.matrixWorld.copyPosition(F.matrixWorld)},Object.defineProperty(f.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(f)),_i.copy(L.backgroundRotation),_i.x*=-1,_i.y*=-1,_i.z*=-1,R.isCubeTexture&&R.isRenderTargetTexture===!1&&(_i.y*=-1,_i.z*=-1),f.material.uniforms.envMap.value=R,f.material.uniforms.flipEnvMap.value=R.isCubeTexture&&R.isRenderTargetTexture===!1?-1:1,f.material.uniforms.backgroundBlurriness.value=L.backgroundBlurriness,f.material.uniforms.backgroundIntensity.value=L.backgroundIntensity,f.material.uniforms.backgroundRotation.value.setFromMatrix4(dx.makeRotationFromEuler(_i)),f.material.toneMapped=Qe.getTransfer(R.colorSpace)!==st,(p!==R||h!==R.version||m!==n.toneMapping)&&(f.material.needsUpdate=!0,p=R,h=R.version,m=n.toneMapping),f.layers.enableAll(),T.unshift(f,f.geometry,f.material,0,0,null)):R&&R.isTexture&&(u===void 0&&(u=new Dn(new go(2,2),new Xn({name:"BackgroundMaterial",uniforms:_r(Mn.background.uniforms),vertexShader:Mn.background.vertexShader,fragmentShader:Mn.background.fragmentShader,side:ai,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),u.geometry.deleteAttribute("normal"),Object.defineProperty(u.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(u)),u.material.uniforms.t2D.value=R,u.material.uniforms.backgroundIntensity.value=L.backgroundIntensity,u.material.toneMapped=Qe.getTransfer(R.colorSpace)!==st,R.matrixAutoUpdate===!0&&R.updateMatrix(),u.material.uniforms.uvTransform.value.copy(R.matrix),(p!==R||h!==R.version||m!==n.toneMapping)&&(u.material.needsUpdate=!0,p=R,h=R.version,m=n.toneMapping),u.layers.enableAll(),T.unshift(u,u.geometry,u.material,0,0,null))}function g(T,L){T.getRGB(Vo,tf(n)),i.buffers.color.setClear(Vo.r,Vo.g,Vo.b,L,a)}function w(){f!==void 0&&(f.geometry.dispose(),f.material.dispose(),f=void 0),u!==void 0&&(u.geometry.dispose(),u.material.dispose(),u=void 0)}return{getClearColor:function(){return c},setClearColor:function(T,L=1){c.set(T),d=L,g(c,d)},getClearAlpha:function(){return d},setClearAlpha:function(T){d=T,g(c,d)},render:b,addToRenderList:x,dispose:w}}function fx(n,e){const t=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},r=h(null);let o=r,a=!1;function c(S,P,O,B,W){let V=!1;const X=p(B,O,P);o!==X&&(o=X,u(o.object)),V=m(S,B,O,W),V&&_(S,B,O,W),W!==null&&e.update(W,n.ELEMENT_ARRAY_BUFFER),(V||a)&&(a=!1,L(S,P,O,B),W!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(W).buffer))}function d(){return n.createVertexArray()}function u(S){return n.bindVertexArray(S)}function f(S){return n.deleteVertexArray(S)}function p(S,P,O){const B=O.wireframe===!0;let W=i[S.id];W===void 0&&(W={},i[S.id]=W);let V=W[P.id];V===void 0&&(V={},W[P.id]=V);let X=V[B];return X===void 0&&(X=h(d()),V[B]=X),X}function h(S){const P=[],O=[],B=[];for(let W=0;W<t;W++)P[W]=0,O[W]=0,B[W]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:P,enabledAttributes:O,attributeDivisors:B,object:S,attributes:{},index:null}}function m(S,P,O,B){const W=o.attributes,V=P.attributes;let X=0;const Q=O.getAttributes();for(const $ in Q)if(Q[$].location>=0){const ne=W[$];let xe=V[$];if(xe===void 0&&($==="instanceMatrix"&&S.instanceMatrix&&(xe=S.instanceMatrix),$==="instanceColor"&&S.instanceColor&&(xe=S.instanceColor)),ne===void 0||ne.attribute!==xe||xe&&ne.data!==xe.data)return!0;X++}return o.attributesNum!==X||o.index!==B}function _(S,P,O,B){const W={},V=P.attributes;let X=0;const Q=O.getAttributes();for(const $ in Q)if(Q[$].location>=0){let ne=V[$];ne===void 0&&($==="instanceMatrix"&&S.instanceMatrix&&(ne=S.instanceMatrix),$==="instanceColor"&&S.instanceColor&&(ne=S.instanceColor));const xe={};xe.attribute=ne,ne&&ne.data&&(xe.data=ne.data),W[$]=xe,X++}o.attributes=W,o.attributesNum=X,o.index=B}function b(){const S=o.newAttributes;for(let P=0,O=S.length;P<O;P++)S[P]=0}function x(S){g(S,0)}function g(S,P){const O=o.newAttributes,B=o.enabledAttributes,W=o.attributeDivisors;O[S]=1,B[S]===0&&(n.enableVertexAttribArray(S),B[S]=1),W[S]!==P&&(n.vertexAttribDivisor(S,P),W[S]=P)}function w(){const S=o.newAttributes,P=o.enabledAttributes;for(let O=0,B=P.length;O<B;O++)P[O]!==S[O]&&(n.disableVertexAttribArray(O),P[O]=0)}function T(S,P,O,B,W,V,X){X===!0?n.vertexAttribIPointer(S,P,O,W,V):n.vertexAttribPointer(S,P,O,B,W,V)}function L(S,P,O,B){b();const W=B.attributes,V=O.getAttributes(),X=P.defaultAttributeValues;for(const Q in V){const $=V[Q];if($.location>=0){let ie=W[Q];if(ie===void 0&&(Q==="instanceMatrix"&&S.instanceMatrix&&(ie=S.instanceMatrix),Q==="instanceColor"&&S.instanceColor&&(ie=S.instanceColor)),ie!==void 0){const ne=ie.normalized,xe=ie.itemSize,je=e.get(ie);if(je===void 0)continue;const tt=je.buffer,nt=je.type,it=je.bytesPerElement,q=nt===n.INT||nt===n.UNSIGNED_INT||ie.gpuType===Qc;if(ie.isInterleavedBufferAttribute){const J=ie.data,me=J.stride,De=ie.offset;if(J.isInstancedInterleavedBuffer){for(let Se=0;Se<$.locationSize;Se++)g($.location+Se,J.meshPerAttribute);S.isInstancedMesh!==!0&&B._maxInstanceCount===void 0&&(B._maxInstanceCount=J.meshPerAttribute*J.count)}else for(let Se=0;Se<$.locationSize;Se++)x($.location+Se);n.bindBuffer(n.ARRAY_BUFFER,tt);for(let Se=0;Se<$.locationSize;Se++)T($.location+Se,xe/$.locationSize,nt,ne,me*it,(De+xe/$.locationSize*Se)*it,q)}else{if(ie.isInstancedBufferAttribute){for(let J=0;J<$.locationSize;J++)g($.location+J,ie.meshPerAttribute);S.isInstancedMesh!==!0&&B._maxInstanceCount===void 0&&(B._maxInstanceCount=ie.meshPerAttribute*ie.count)}else for(let J=0;J<$.locationSize;J++)x($.location+J);n.bindBuffer(n.ARRAY_BUFFER,tt);for(let J=0;J<$.locationSize;J++)T($.location+J,xe/$.locationSize,nt,ne,xe*it,xe/$.locationSize*J*it,q)}}else if(X!==void 0){const ne=X[Q];if(ne!==void 0)switch(ne.length){case 2:n.vertexAttrib2fv($.location,ne);break;case 3:n.vertexAttrib3fv($.location,ne);break;case 4:n.vertexAttrib4fv($.location,ne);break;default:n.vertexAttrib1fv($.location,ne)}}}}w()}function R(){F();for(const S in i){const P=i[S];for(const O in P){const B=P[O];for(const W in B)f(B[W].object),delete B[W];delete P[O]}delete i[S]}}function M(S){if(i[S.id]===void 0)return;const P=i[S.id];for(const O in P){const B=P[O];for(const W in B)f(B[W].object),delete B[W];delete P[O]}delete i[S.id]}function A(S){for(const P in i){const O=i[P];if(O[S.id]===void 0)continue;const B=O[S.id];for(const W in B)f(B[W].object),delete B[W];delete O[S.id]}}function F(){E(),a=!0,o!==r&&(o=r,u(o.object))}function E(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:c,reset:F,resetDefaultState:E,dispose:R,releaseStatesOfGeometry:M,releaseStatesOfProgram:A,initAttributes:b,enableAttribute:x,disableUnusedAttributes:w}}function hx(n,e,t){let i;function r(u){i=u}function o(u,f){n.drawArrays(i,u,f),t.update(f,i,1)}function a(u,f,p){p!==0&&(n.drawArraysInstanced(i,u,f,p),t.update(f,i,p))}function c(u,f,p){if(p===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,u,0,f,0,p);let m=0;for(let _=0;_<p;_++)m+=f[_];t.update(m,i,1)}function d(u,f,p,h){if(p===0)return;const m=e.get("WEBGL_multi_draw");if(m===null)for(let _=0;_<u.length;_++)a(u[_],f[_],h[_]);else{m.multiDrawArraysInstancedWEBGL(i,u,0,f,0,h,0,p);let _=0;for(let b=0;b<p;b++)_+=f[b]*h[b];t.update(_,i,1)}}this.setMode=r,this.render=o,this.renderInstances=a,this.renderMultiDraw=c,this.renderMultiDrawInstances=d}function px(n,e,t,i){let r;function o(){if(r!==void 0)return r;if(e.has("EXT_texture_filter_anisotropic")===!0){const A=e.get("EXT_texture_filter_anisotropic");r=n.getParameter(A.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function a(A){return!(A!==_n&&i.convert(A)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function c(A){const F=A===Er&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(A!==Pn&&i.convert(A)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE)&&A!==Vn&&!F)}function d(A){if(A==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";A="mediump"}return A==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let u=t.precision!==void 0?t.precision:"highp";const f=d(u);f!==u&&(Fe("WebGLRenderer:",u,"not supported, using",f,"instead."),u=f);const p=t.logarithmicDepthBuffer===!0,h=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control"),m=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),_=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),b=n.getParameter(n.MAX_TEXTURE_SIZE),x=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),g=n.getParameter(n.MAX_VERTEX_ATTRIBS),w=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),T=n.getParameter(n.MAX_VARYING_VECTORS),L=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),R=_>0,M=n.getParameter(n.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:o,getMaxPrecision:d,textureFormatReadable:a,textureTypeReadable:c,precision:u,logarithmicDepthBuffer:p,reversedDepthBuffer:h,maxTextures:m,maxVertexTextures:_,maxTextureSize:b,maxCubemapSize:x,maxAttributes:g,maxVertexUniforms:w,maxVaryings:T,maxFragmentUniforms:L,vertexTextures:R,maxSamples:M}}function mx(n){const e=this;let t=null,i=0,r=!1,o=!1;const a=new ni,c=new ke,d={value:null,needsUpdate:!1};this.uniform=d,this.numPlanes=0,this.numIntersection=0,this.init=function(p,h){const m=p.length!==0||h||i!==0||r;return r=h,i=p.length,m},this.beginShadows=function(){o=!0,f(null)},this.endShadows=function(){o=!1},this.setGlobalState=function(p,h){t=f(p,h,0)},this.setState=function(p,h,m){const _=p.clippingPlanes,b=p.clipIntersection,x=p.clipShadows,g=n.get(p);if(!r||_===null||_.length===0||o&&!x)o?f(null):u();else{const w=o?0:i,T=w*4;let L=g.clippingState||null;d.value=L,L=f(_,h,T,m);for(let R=0;R!==T;++R)L[R]=t[R];g.clippingState=L,this.numIntersection=b?this.numPlanes:0,this.numPlanes+=w}};function u(){d.value!==t&&(d.value=t,d.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function f(p,h,m,_){const b=p!==null?p.length:0;let x=null;if(b!==0){if(x=d.value,_!==!0||x===null){const g=m+b*4,w=h.matrixWorldInverse;c.getNormalMatrix(w),(x===null||x.length<g)&&(x=new Float32Array(g));for(let T=0,L=m;T!==b;++T,L+=4)a.copy(p[T]).applyMatrix4(w,c),a.normal.toArray(x,L),x[L+3]=a.constant}d.value=x,d.needsUpdate=!0}return e.numPlanes=b,e.numIntersection=0,x}}function gx(n){let e=new WeakMap;function t(a,c){return c===Qa?a.mapping=mr:c===ec&&(a.mapping=gr),a}function i(a){if(a&&a.isTexture){const c=a.mapping;if(c===Qa||c===ec)if(e.has(a)){const d=e.get(a).texture;return t(d,a.mapping)}else{const d=a.image;if(d&&d.height>0){const u=new hm(d.height);return u.fromEquirectangularTexture(n,a),e.set(a,u),a.addEventListener("dispose",r),t(u.texture,a.mapping)}else return null}}return a}function r(a){const c=a.target;c.removeEventListener("dispose",r);const d=e.get(c);d!==void 0&&(e.delete(c),d.dispose())}function o(){e=new WeakMap}return{get:i,dispose:o}}const ri=4,wd=[.125,.215,.35,.446,.526,.582],vi=20,xx=256,Gr=new cf,Ad=new ze;let Ma=null,Ta=0,Ca=0,wa=!1;const _x=new k;class Ld{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._sigmas=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,i=.1,r=100,o={}){const{size:a=256,position:c=_x}=o;Ma=this._renderer.getRenderTarget(),Ta=this._renderer.getActiveCubeFace(),Ca=this._renderer.getActiveMipmapLevel(),wa=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);const d=this._allocateTargets();return d.depthBuffer=!0,this._sceneToCubeUV(e,i,r,d,c),t>0&&this._blur(d,0,0,t),this._applyPMREM(d),this._cleanup(d),d}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Id(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Pd(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(Ma,Ta,Ca),this._renderer.xr.enabled=wa,e.scissorTest=!1,er(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===mr||e.mapping===gr?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Ma=this._renderer.getRenderTarget(),Ta=this._renderer.getActiveCubeFace(),Ca=this._renderer.getActiveMipmapLevel(),wa=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:ln,minFilter:ln,generateMipmaps:!1,type:Er,format:_n,colorSpace:xr,depthBuffer:!1},r=Rd(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Rd(e,t,i);const{_lodMax:o}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods,sigmas:this._sigmas}=bx(o)),this._blurMaterial=Sx(o,e,t),this._ggxMaterial=yx(o,e,t)}return r}_compileMaterial(e){const t=new Dn(new un,e);this._renderer.compile(t,Gr)}_sceneToCubeUV(e,t,i,r,o){const d=new an(90,1,t,i),u=[1,-1,1,1,1,1],f=[1,1,1,-1,-1,-1],p=this._renderer,h=p.autoClear,m=p.toneMapping;p.getClearColor(Ad),p.toneMapping=oi,p.autoClear=!1,p.state.buffers.depth.getReversed()&&(p.setRenderTarget(r),p.clearDepth(),p.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new Dn(new mo,new cl({name:"PMREM.Background",side:Xt,depthWrite:!1,depthTest:!1})));const b=this._backgroundBox,x=b.material;let g=!1;const w=e.background;w?w.isColor&&(x.color.copy(w),e.background=null,g=!0):(x.color.copy(Ad),g=!0);for(let T=0;T<6;T++){const L=T%3;L===0?(d.up.set(0,u[T],0),d.position.set(o.x,o.y,o.z),d.lookAt(o.x+f[T],o.y,o.z)):L===1?(d.up.set(0,0,u[T]),d.position.set(o.x,o.y,o.z),d.lookAt(o.x,o.y+f[T],o.z)):(d.up.set(0,u[T],0),d.position.set(o.x,o.y,o.z),d.lookAt(o.x,o.y,o.z+f[T]));const R=this._cubeSize;er(r,L*R,T>2?R:0,R,R),p.setRenderTarget(r),g&&p.render(b,d),p.render(e,d)}p.toneMapping=m,p.autoClear=h,e.background=w}_textureToCubeUV(e,t){const i=this._renderer,r=e.mapping===mr||e.mapping===gr;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=Id()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Pd());const o=r?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=o;const c=o.uniforms;c.envMap.value=e;const d=this._cubeSize;er(t,0,0,3*d,2*d),i.setRenderTarget(t),i.render(a,Gr)}_applyPMREM(e){const t=this._renderer,i=t.autoClear;t.autoClear=!1;const r=this._lodMeshes.length;for(let o=1;o<r;o++)this._applyGGXFilter(e,o-1,o);t.autoClear=i}_applyGGXFilter(e,t,i){const r=this._renderer,o=this._pingPongRenderTarget,a=this._ggxMaterial,c=this._lodMeshes[i];c.material=a;const d=a.uniforms,u=i/(this._lodMeshes.length-1),f=t/(this._lodMeshes.length-1),p=Math.sqrt(u*u-f*f),h=.05+u*.95,m=p*h,{_lodMax:_}=this,b=this._sizeLods[i],x=3*b*(i>_-ri?i-_+ri:0),g=4*(this._cubeSize-b);d.envMap.value=e.texture,d.roughness.value=m,d.mipInt.value=_-t,er(o,x,g,3*b,2*b),r.setRenderTarget(o),r.render(c,Gr),d.envMap.value=o.texture,d.roughness.value=0,d.mipInt.value=_-i,er(e,x,g,3*b,2*b),r.setRenderTarget(e),r.render(c,Gr)}_blur(e,t,i,r,o){const a=this._pingPongRenderTarget;this._halfBlur(e,a,t,i,r,"latitudinal",o),this._halfBlur(a,e,i,i,r,"longitudinal",o)}_halfBlur(e,t,i,r,o,a,c){const d=this._renderer,u=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&Mt("blur direction must be either latitudinal or longitudinal!");const f=3,p=this._lodMeshes[r];p.material=u;const h=u.uniforms,m=this._sizeLods[i]-1,_=isFinite(o)?Math.PI/(2*m):2*Math.PI/(2*vi-1),b=o/_,x=isFinite(o)?1+Math.floor(f*b):vi;x>vi&&Fe(`sigmaRadians, ${o}, is too large and will clip, as it requested ${x} samples when the maximum is set to ${vi}`);const g=[];let w=0;for(let A=0;A<vi;++A){const F=A/b,E=Math.exp(-F*F/2);g.push(E),A===0?w+=E:A<x&&(w+=2*E)}for(let A=0;A<g.length;A++)g[A]=g[A]/w;h.envMap.value=e.texture,h.samples.value=x,h.weights.value=g,h.latitudinal.value=a==="latitudinal",c&&(h.poleAxis.value=c);const{_lodMax:T}=this;h.dTheta.value=_,h.mipInt.value=T-i;const L=this._sizeLods[r],R=3*L*(r>T-ri?r-T+ri:0),M=4*(this._cubeSize-L);er(t,R,M,3*L,2*L),d.setRenderTarget(t),d.render(p,Gr)}}function bx(n){const e=[],t=[],i=[];let r=n;const o=n-ri+1+wd.length;for(let a=0;a<o;a++){const c=Math.pow(2,r);e.push(c);let d=1/c;a>n-ri?d=wd[a-n+ri-1]:a===0&&(d=0),t.push(d);const u=1/(c-2),f=-u,p=1+u,h=[f,f,p,f,p,p,f,f,p,p,f,p],m=6,_=6,b=3,x=2,g=1,w=new Float32Array(b*_*m),T=new Float32Array(x*_*m),L=new Float32Array(g*_*m);for(let M=0;M<m;M++){const A=M%3*2/3-1,F=M>2?0:-1,E=[A,F,0,A+2/3,F,0,A+2/3,F+1,0,A,F,0,A+2/3,F+1,0,A,F+1,0];w.set(E,b*_*M),T.set(h,x*_*M);const S=[M,M,M,M,M,M];L.set(S,g*_*M)}const R=new un;R.setAttribute("position",new An(w,b)),R.setAttribute("uv",new An(T,x)),R.setAttribute("faceIndex",new An(L,g)),i.push(new Dn(R,null)),r>ri&&r--}return{lodMeshes:i,sizeLods:e,sigmas:t}}function Rd(n,e,t){const i=new Ri(n,e,t);return i.texture.mapping=Ns,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function er(n,e,t,i,r){n.viewport.set(e,t,i,r),n.scissor.set(e,t,i,r)}function yx(n,e,t){return new Xn({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:xx,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Os(),fragmentShader:`

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
		`,blending:Wn,depthTest:!1,depthWrite:!1})}function Sx(n,e,t){const i=new Float32Array(vi),r=new k(0,1,0);return new Xn({name:"SphericalGaussianBlur",defines:{n:vi,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:r}},vertexShader:Os(),fragmentShader:`

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
		`,blending:Wn,depthTest:!1,depthWrite:!1})}function Pd(){return new Xn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Os(),fragmentShader:`

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
		`,blending:Wn,depthTest:!1,depthWrite:!1})}function Id(){return new Xn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Os(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Wn,depthTest:!1,depthWrite:!1})}function Os(){return`

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
	`}function vx(n){let e=new WeakMap,t=null;function i(c){if(c&&c.isTexture){const d=c.mapping,u=d===Qa||d===ec,f=d===mr||d===gr;if(u||f){let p=e.get(c);const h=p!==void 0?p.texture.pmremVersion:0;if(c.isRenderTargetTexture&&c.pmremVersion!==h)return t===null&&(t=new Ld(n)),p=u?t.fromEquirectangular(c,p):t.fromCubemap(c,p),p.texture.pmremVersion=c.pmremVersion,e.set(c,p),p.texture;if(p!==void 0)return p.texture;{const m=c.image;return u&&m&&m.height>0||f&&m&&r(m)?(t===null&&(t=new Ld(n)),p=u?t.fromEquirectangular(c):t.fromCubemap(c),p.texture.pmremVersion=c.pmremVersion,e.set(c,p),c.addEventListener("dispose",o),p.texture):null}}}return c}function r(c){let d=0;const u=6;for(let f=0;f<u;f++)c[f]!==void 0&&d++;return d===u}function o(c){const d=c.target;d.removeEventListener("dispose",o);const u=e.get(d);u!==void 0&&(e.delete(d),u.dispose())}function a(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:i,dispose:a}}function Ex(n){const e={};function t(i){if(e[i]!==void 0)return e[i];const r=n.getExtension(i);return e[i]=r,r}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){const r=t(i);return r===null&&so("WebGLRenderer: "+i+" extension not supported."),r}}}function Mx(n,e,t,i){const r={},o=new WeakMap;function a(p){const h=p.target;h.index!==null&&e.remove(h.index);for(const _ in h.attributes)e.remove(h.attributes[_]);h.removeEventListener("dispose",a),delete r[h.id];const m=o.get(h);m&&(e.remove(m),o.delete(h)),i.releaseStatesOfGeometry(h),h.isInstancedBufferGeometry===!0&&delete h._maxInstanceCount,t.memory.geometries--}function c(p,h){return r[h.id]===!0||(h.addEventListener("dispose",a),r[h.id]=!0,t.memory.geometries++),h}function d(p){const h=p.attributes;for(const m in h)e.update(h[m],n.ARRAY_BUFFER)}function u(p){const h=[],m=p.index,_=p.attributes.position;let b=0;if(m!==null){const w=m.array;b=m.version;for(let T=0,L=w.length;T<L;T+=3){const R=w[T+0],M=w[T+1],A=w[T+2];h.push(R,M,M,A,A,R)}}else if(_!==void 0){const w=_.array;b=_.version;for(let T=0,L=w.length/3-1;T<L;T+=3){const R=T+0,M=T+1,A=T+2;h.push(R,M,M,A,A,R)}}else return;const x=new(Yu(h)?ef:Qu)(h,1);x.version=b;const g=o.get(p);g&&e.remove(g),o.set(p,x)}function f(p){const h=o.get(p);if(h){const m=p.index;m!==null&&h.version<m.version&&u(p)}else u(p);return o.get(p)}return{get:c,update:d,getWireframeAttribute:f}}function Tx(n,e,t){let i;function r(h){i=h}let o,a;function c(h){o=h.type,a=h.bytesPerElement}function d(h,m){n.drawElements(i,m,o,h*a),t.update(m,i,1)}function u(h,m,_){_!==0&&(n.drawElementsInstanced(i,m,o,h*a,_),t.update(m,i,_))}function f(h,m,_){if(_===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,m,0,o,h,0,_);let x=0;for(let g=0;g<_;g++)x+=m[g];t.update(x,i,1)}function p(h,m,_,b){if(_===0)return;const x=e.get("WEBGL_multi_draw");if(x===null)for(let g=0;g<h.length;g++)u(h[g]/a,m[g],b[g]);else{x.multiDrawElementsInstancedWEBGL(i,m,0,o,h,0,b,0,_);let g=0;for(let w=0;w<_;w++)g+=m[w]*b[w];t.update(g,i,1)}}this.setMode=r,this.setIndex=c,this.render=d,this.renderInstances=u,this.renderMultiDraw=f,this.renderMultiDrawInstances=p}function Cx(n){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(o,a,c){switch(t.calls++,a){case n.TRIANGLES:t.triangles+=c*(o/3);break;case n.LINES:t.lines+=c*(o/2);break;case n.LINE_STRIP:t.lines+=c*(o-1);break;case n.LINE_LOOP:t.lines+=c*o;break;case n.POINTS:t.points+=c*o;break;default:Mt("WebGLInfo: Unknown draw mode:",a);break}}function r(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:r,update:i}}function wx(n,e,t){const i=new WeakMap,r=new St;function o(a,c,d){const u=a.morphTargetInfluences,f=c.morphAttributes.position||c.morphAttributes.normal||c.morphAttributes.color,p=f!==void 0?f.length:0;let h=i.get(c);if(h===void 0||h.count!==p){let S=function(){F.dispose(),i.delete(c),c.removeEventListener("dispose",S)};var m=S;h!==void 0&&h.texture.dispose();const _=c.morphAttributes.position!==void 0,b=c.morphAttributes.normal!==void 0,x=c.morphAttributes.color!==void 0,g=c.morphAttributes.position||[],w=c.morphAttributes.normal||[],T=c.morphAttributes.color||[];let L=0;_===!0&&(L=1),b===!0&&(L=2),x===!0&&(L=3);let R=c.attributes.position.count*L,M=1;R>e.maxTextureSize&&(M=Math.ceil(R/e.maxTextureSize),R=e.maxTextureSize);const A=new Float32Array(R*M*4*p),F=new Ku(A,R,M,p);F.type=Vn,F.needsUpdate=!0;const E=L*4;for(let P=0;P<p;P++){const O=g[P],B=w[P],W=T[P],V=R*M*4*P;for(let X=0;X<O.count;X++){const Q=X*E;_===!0&&(r.fromBufferAttribute(O,X),A[V+Q+0]=r.x,A[V+Q+1]=r.y,A[V+Q+2]=r.z,A[V+Q+3]=0),b===!0&&(r.fromBufferAttribute(B,X),A[V+Q+4]=r.x,A[V+Q+5]=r.y,A[V+Q+6]=r.z,A[V+Q+7]=0),x===!0&&(r.fromBufferAttribute(W,X),A[V+Q+8]=r.x,A[V+Q+9]=r.y,A[V+Q+10]=r.z,A[V+Q+11]=W.itemSize===4?r.w:1)}}h={count:p,texture:F,size:new Be(R,M)},i.set(c,h),c.addEventListener("dispose",S)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)d.getUniforms().setValue(n,"morphTexture",a.morphTexture,t);else{let _=0;for(let x=0;x<u.length;x++)_+=u[x];const b=c.morphTargetsRelative?1:1-_;d.getUniforms().setValue(n,"morphTargetBaseInfluence",b),d.getUniforms().setValue(n,"morphTargetInfluences",u)}d.getUniforms().setValue(n,"morphTargetsTexture",h.texture,t),d.getUniforms().setValue(n,"morphTargetsTextureSize",h.size)}return{update:o}}function Ax(n,e,t,i){let r=new WeakMap;function o(d){const u=i.render.frame,f=d.geometry,p=e.get(d,f);if(r.get(p)!==u&&(e.update(p),r.set(p,u)),d.isInstancedMesh&&(d.hasEventListener("dispose",c)===!1&&d.addEventListener("dispose",c),r.get(d)!==u&&(t.update(d.instanceMatrix,n.ARRAY_BUFFER),d.instanceColor!==null&&t.update(d.instanceColor,n.ARRAY_BUFFER),r.set(d,u))),d.isSkinnedMesh){const h=d.skeleton;r.get(h)!==u&&(h.update(),r.set(h,u))}return p}function a(){r=new WeakMap}function c(d){const u=d.target;u.removeEventListener("dispose",c),t.remove(u.instanceMatrix),u.instanceColor!==null&&t.remove(u.instanceColor)}return{update:o,dispose:a}}const uf=new zt,Dd=new of(1,1),ff=new Ku,hf=new Kp,pf=new rf,Fd=[],Nd=[],Ud=new Float32Array(16),Od=new Float32Array(9),Bd=new Float32Array(4);function Tr(n,e,t){const i=n[0];if(i<=0||i>0)return n;const r=e*t;let o=Fd[r];if(o===void 0&&(o=new Float32Array(r),Fd[r]=o),e!==0){i.toArray(o,0);for(let a=1,c=0;a!==e;++a)c+=t,n[a].toArray(o,c)}return o}function At(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function Lt(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function Bs(n,e){let t=Nd[e];t===void 0&&(t=new Int32Array(e),Nd[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function Lx(n,e){const t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function Rx(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(At(t,e))return;n.uniform2fv(this.addr,e),Lt(t,e)}}function Px(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(At(t,e))return;n.uniform3fv(this.addr,e),Lt(t,e)}}function Ix(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(At(t,e))return;n.uniform4fv(this.addr,e),Lt(t,e)}}function Dx(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(At(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),Lt(t,e)}else{if(At(t,i))return;Bd.set(i),n.uniformMatrix2fv(this.addr,!1,Bd),Lt(t,i)}}function Fx(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(At(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),Lt(t,e)}else{if(At(t,i))return;Od.set(i),n.uniformMatrix3fv(this.addr,!1,Od),Lt(t,i)}}function Nx(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(At(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),Lt(t,e)}else{if(At(t,i))return;Ud.set(i),n.uniformMatrix4fv(this.addr,!1,Ud),Lt(t,i)}}function Ux(n,e){const t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function Ox(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(At(t,e))return;n.uniform2iv(this.addr,e),Lt(t,e)}}function Bx(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(At(t,e))return;n.uniform3iv(this.addr,e),Lt(t,e)}}function Gx(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(At(t,e))return;n.uniform4iv(this.addr,e),Lt(t,e)}}function kx(n,e){const t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function zx(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(At(t,e))return;n.uniform2uiv(this.addr,e),Lt(t,e)}}function Hx(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(At(t,e))return;n.uniform3uiv(this.addr,e),Lt(t,e)}}function Vx(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(At(t,e))return;n.uniform4uiv(this.addr,e),Lt(t,e)}}function Wx(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r);let o;this.type===n.SAMPLER_2D_SHADOW?(Dd.compareFunction=qu,o=Dd):o=uf,t.setTexture2D(e||o,r)}function jx(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture3D(e||hf,r)}function $x(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTextureCube(e||pf,r)}function Xx(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture2DArray(e||ff,r)}function qx(n){switch(n){case 5126:return Lx;case 35664:return Rx;case 35665:return Px;case 35666:return Ix;case 35674:return Dx;case 35675:return Fx;case 35676:return Nx;case 5124:case 35670:return Ux;case 35667:case 35671:return Ox;case 35668:case 35672:return Bx;case 35669:case 35673:return Gx;case 5125:return kx;case 36294:return zx;case 36295:return Hx;case 36296:return Vx;case 35678:case 36198:case 36298:case 36306:case 35682:return Wx;case 35679:case 36299:case 36307:return jx;case 35680:case 36300:case 36308:case 36293:return $x;case 36289:case 36303:case 36311:case 36292:return Xx}}function Yx(n,e){n.uniform1fv(this.addr,e)}function Kx(n,e){const t=Tr(e,this.size,2);n.uniform2fv(this.addr,t)}function Jx(n,e){const t=Tr(e,this.size,3);n.uniform3fv(this.addr,t)}function Zx(n,e){const t=Tr(e,this.size,4);n.uniform4fv(this.addr,t)}function Qx(n,e){const t=Tr(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function e_(n,e){const t=Tr(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function t_(n,e){const t=Tr(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function n_(n,e){n.uniform1iv(this.addr,e)}function i_(n,e){n.uniform2iv(this.addr,e)}function r_(n,e){n.uniform3iv(this.addr,e)}function o_(n,e){n.uniform4iv(this.addr,e)}function s_(n,e){n.uniform1uiv(this.addr,e)}function a_(n,e){n.uniform2uiv(this.addr,e)}function c_(n,e){n.uniform3uiv(this.addr,e)}function l_(n,e){n.uniform4uiv(this.addr,e)}function d_(n,e,t){const i=this.cache,r=e.length,o=Bs(t,r);At(i,o)||(n.uniform1iv(this.addr,o),Lt(i,o));for(let a=0;a!==r;++a)t.setTexture2D(e[a]||uf,o[a])}function u_(n,e,t){const i=this.cache,r=e.length,o=Bs(t,r);At(i,o)||(n.uniform1iv(this.addr,o),Lt(i,o));for(let a=0;a!==r;++a)t.setTexture3D(e[a]||hf,o[a])}function f_(n,e,t){const i=this.cache,r=e.length,o=Bs(t,r);At(i,o)||(n.uniform1iv(this.addr,o),Lt(i,o));for(let a=0;a!==r;++a)t.setTextureCube(e[a]||pf,o[a])}function h_(n,e,t){const i=this.cache,r=e.length,o=Bs(t,r);At(i,o)||(n.uniform1iv(this.addr,o),Lt(i,o));for(let a=0;a!==r;++a)t.setTexture2DArray(e[a]||ff,o[a])}function p_(n){switch(n){case 5126:return Yx;case 35664:return Kx;case 35665:return Jx;case 35666:return Zx;case 35674:return Qx;case 35675:return e_;case 35676:return t_;case 5124:case 35670:return n_;case 35667:case 35671:return i_;case 35668:case 35672:return r_;case 35669:case 35673:return o_;case 5125:return s_;case 36294:return a_;case 36295:return c_;case 36296:return l_;case 35678:case 36198:case 36298:case 36306:case 35682:return d_;case 35679:case 36299:case 36307:return u_;case 35680:case 36300:case 36308:case 36293:return f_;case 36289:case 36303:case 36311:case 36292:return h_}}class m_{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=qx(t.type)}}class g_{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=p_(t.type)}}class x_{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){const r=this.seq;for(let o=0,a=r.length;o!==a;++o){const c=r[o];c.setValue(e,t[c.id],i)}}}const Aa=/(\w+)(\])?(\[|\.)?/g;function Gd(n,e){n.seq.push(e),n.map[e.id]=e}function __(n,e,t){const i=n.name,r=i.length;for(Aa.lastIndex=0;;){const o=Aa.exec(i),a=Aa.lastIndex;let c=o[1];const d=o[2]==="]",u=o[3];if(d&&(c=c|0),u===void 0||u==="["&&a+2===r){Gd(t,u===void 0?new m_(c,n,e):new g_(c,n,e));break}else{let p=t.map[c];p===void 0&&(p=new x_(c),Gd(t,p)),t=p}}}class as{constructor(e,t){this.seq=[],this.map={};const i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let r=0;r<i;++r){const o=e.getActiveUniform(t,r),a=e.getUniformLocation(t,o.name);__(o,a,this)}}setValue(e,t,i,r){const o=this.map[t];o!==void 0&&o.setValue(e,i,r)}setOptional(e,t,i){const r=t[i];r!==void 0&&this.setValue(e,i,r)}static upload(e,t,i,r){for(let o=0,a=t.length;o!==a;++o){const c=t[o],d=i[c.id];d.needsUpdate!==!1&&c.setValue(e,d.value,r)}}static seqWithValue(e,t){const i=[];for(let r=0,o=e.length;r!==o;++r){const a=e[r];a.id in t&&i.push(a)}return i}}function kd(n,e,t){const i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}const b_=37297;let y_=0;function S_(n,e){const t=n.split(`
`),i=[],r=Math.max(e-6,0),o=Math.min(e+6,t.length);for(let a=r;a<o;a++){const c=a+1;i.push(`${c===e?">":" "} ${c}: ${t[a]}`)}return i.join(`
`)}const zd=new ke;function v_(n){Qe._getMatrix(zd,Qe.workingColorSpace,n);const e=`mat3( ${zd.elements.map(t=>t.toFixed(4))} )`;switch(Qe.getTransfer(n)){case ys:return[e,"LinearTransferOETF"];case st:return[e,"sRGBTransferOETF"];default:return Fe("WebGLProgram: Unsupported color space: ",n),[e,"LinearTransferOETF"]}}function Hd(n,e,t){const i=n.getShaderParameter(e,n.COMPILE_STATUS),o=(n.getShaderInfoLog(e)||"").trim();if(i&&o==="")return"";const a=/ERROR: 0:(\d+)/.exec(o);if(a){const c=parseInt(a[1]);return t.toUpperCase()+`

`+o+`

`+S_(n.getShaderSource(e),c)}else return o}function E_(n,e){const t=v_(e);return[`vec4 ${n}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function M_(n,e){let t;switch(e){case Ep:t="Linear";break;case Mp:t="Reinhard";break;case Tp:t="Cineon";break;case Cp:t="ACESFilmic";break;case Ap:t="AgX";break;case Lp:t="Neutral";break;case wp:t="Custom";break;default:Fe("WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}const Wo=new k;function T_(){Qe.getLuminanceCoefficients(Wo);const n=Wo.x.toFixed(4),e=Wo.y.toFixed(4),t=Wo.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function C_(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Wr).join(`
`)}function w_(n){const e=[];for(const t in n){const i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function A_(n,e){const t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){const o=n.getActiveAttrib(e,r),a=o.name;let c=1;o.type===n.FLOAT_MAT2&&(c=2),o.type===n.FLOAT_MAT3&&(c=3),o.type===n.FLOAT_MAT4&&(c=4),t[a]={type:o.type,location:n.getAttribLocation(e,a),locationSize:c}}return t}function Wr(n){return n!==""}function Vd(n,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Wd(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const L_=/^[ \t]*#include +<([\w\d./]+)>/gm;function Ic(n){return n.replace(L_,P_)}const R_=new Map;function P_(n,e){let t=He[e];if(t===void 0){const i=R_.get(e);if(i!==void 0)t=He[i],Fe('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("Can not resolve #include <"+e+">")}return Ic(t)}const I_=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function jd(n){return n.replace(I_,D_)}function D_(n,e,t,i){let r="";for(let o=parseInt(e);o<parseInt(t);o++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+o+" ]").replace(/UNROLLED_LOOP_INDEX/g,o);return r}function $d(n){let e=`precision ${n.precision} float;
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
#define LOW_PRECISION`),e}function F_(n){let e="SHADOWMAP_TYPE_BASIC";return n.shadowMapType===Ou?e="SHADOWMAP_TYPE_PCF":n.shadowMapType===np?e="SHADOWMAP_TYPE_PCF_SOFT":n.shadowMapType===kn&&(e="SHADOWMAP_TYPE_VSM"),e}function N_(n){let e="ENVMAP_TYPE_CUBE";if(n.envMap)switch(n.envMapMode){case mr:case gr:e="ENVMAP_TYPE_CUBE";break;case Ns:e="ENVMAP_TYPE_CUBE_UV";break}return e}function U_(n){let e="ENVMAP_MODE_REFLECTION";return n.envMap&&n.envMapMode===gr&&(e="ENVMAP_MODE_REFRACTION"),e}function O_(n){let e="ENVMAP_BLENDING_NONE";if(n.envMap)switch(n.combine){case Bu:e="ENVMAP_BLENDING_MULTIPLY";break;case Sp:e="ENVMAP_BLENDING_MIX";break;case vp:e="ENVMAP_BLENDING_ADD";break}return e}function B_(n){const e=n.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:i,maxMip:t}}function G_(n,e,t,i){const r=n.getContext(),o=t.defines;let a=t.vertexShader,c=t.fragmentShader;const d=F_(t),u=N_(t),f=U_(t),p=O_(t),h=B_(t),m=C_(t),_=w_(o),b=r.createProgram();let x,g,w=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(x=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(Wr).join(`
`),x.length>0&&(x+=`
`),g=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(Wr).join(`
`),g.length>0&&(g+=`
`)):(x=[$d(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+f:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+d:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Wr).join(`
`),g=[$d(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.envMap?"#define "+f:"",t.envMap?"#define "+p:"",h?"#define CUBEUV_TEXEL_WIDTH "+h.texelWidth:"",h?"#define CUBEUV_TEXEL_HEIGHT "+h.texelHeight:"",h?"#define CUBEUV_MAX_MIP "+h.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+d:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==oi?"#define TONE_MAPPING":"",t.toneMapping!==oi?He.tonemapping_pars_fragment:"",t.toneMapping!==oi?M_("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",He.colorspace_pars_fragment,E_("linearToOutputTexel",t.outputColorSpace),T_(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Wr).join(`
`)),a=Ic(a),a=Vd(a,t),a=Wd(a,t),c=Ic(c),c=Vd(c,t),c=Wd(c,t),a=jd(a),c=jd(c),t.isRawShaderMaterial!==!0&&(w=`#version 300 es
`,x=[m,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+x,g=["#define varying in",t.glslVersion===Ql?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Ql?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+g);const T=w+x+a,L=w+g+c,R=kd(r,r.VERTEX_SHADER,T),M=kd(r,r.FRAGMENT_SHADER,L);r.attachShader(b,R),r.attachShader(b,M),t.index0AttributeName!==void 0?r.bindAttribLocation(b,0,t.index0AttributeName):t.morphTargets===!0&&r.bindAttribLocation(b,0,"position"),r.linkProgram(b);function A(P){if(n.debug.checkShaderErrors){const O=r.getProgramInfoLog(b)||"",B=r.getShaderInfoLog(R)||"",W=r.getShaderInfoLog(M)||"",V=O.trim(),X=B.trim(),Q=W.trim();let $=!0,ie=!0;if(r.getProgramParameter(b,r.LINK_STATUS)===!1)if($=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(r,b,R,M);else{const ne=Hd(r,R,"vertex"),xe=Hd(r,M,"fragment");Mt("THREE.WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(b,r.VALIDATE_STATUS)+`

Material Name: `+P.name+`
Material Type: `+P.type+`

Program Info Log: `+V+`
`+ne+`
`+xe)}else V!==""?Fe("WebGLProgram: Program Info Log:",V):(X===""||Q==="")&&(ie=!1);ie&&(P.diagnostics={runnable:$,programLog:V,vertexShader:{log:X,prefix:x},fragmentShader:{log:Q,prefix:g}})}r.deleteShader(R),r.deleteShader(M),F=new as(r,b),E=A_(r,b)}let F;this.getUniforms=function(){return F===void 0&&A(this),F};let E;this.getAttributes=function(){return E===void 0&&A(this),E};let S=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return S===!1&&(S=r.getProgramParameter(b,b_)),S},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(b),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=y_++,this.cacheKey=e,this.usedTimes=1,this.program=b,this.vertexShader=R,this.fragmentShader=M,this}let k_=0;class z_{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){const t=e.vertexShader,i=e.fragmentShader,r=this._getShaderStage(t),o=this._getShaderStage(i),a=this._getShaderCacheForMaterial(e);return a.has(r)===!1&&(a.add(r),r.usedTimes++),a.has(o)===!1&&(a.add(o),o.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){const t=this.shaderCache;let i=t.get(e);return i===void 0&&(i=new H_(e),t.set(e,i)),i}}class H_{constructor(e){this.id=k_++,this.code=e,this.usedTimes=0}}function V_(n,e,t,i,r,o,a){const c=new Ju,d=new z_,u=new Set,f=[],p=r.logarithmicDepthBuffer,h=r.vertexTextures;let m=r.precision;const _={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function b(E){return u.add(E),E===0?"uv":`uv${E}`}function x(E,S,P,O,B){const W=O.fog,V=B.geometry,X=E.isMeshStandardMaterial?O.environment:null,Q=(E.isMeshStandardMaterial?t:e).get(E.envMap||X),$=Q&&Q.mapping===Ns?Q.image.height:null,ie=_[E.type];E.precision!==null&&(m=r.getMaxPrecision(E.precision),m!==E.precision&&Fe("WebGLProgram.getParameters:",E.precision,"not supported, using",m,"instead."));const ne=V.morphAttributes.position||V.morphAttributes.normal||V.morphAttributes.color,xe=ne!==void 0?ne.length:0;let je=0;V.morphAttributes.position!==void 0&&(je=1),V.morphAttributes.normal!==void 0&&(je=2),V.morphAttributes.color!==void 0&&(je=3);let tt,nt,it,q;if(ie){const rt=Mn[ie];tt=rt.vertexShader,nt=rt.fragmentShader}else tt=E.vertexShader,nt=E.fragmentShader,d.update(E),it=d.getVertexShaderID(E),q=d.getFragmentShaderID(E);const J=n.getRenderTarget(),me=n.state.buffers.depth.getReversed(),De=B.isInstancedMesh===!0,Se=B.isBatchedMesh===!0,$e=!!E.map,It=!!E.matcap,Ve=!!Q,pt=!!E.aoMap,I=!!E.lightMap,Xe=!!E.bumpMap,qe=!!E.normalMap,lt=!!E.displacementMap,ye=!!E.emissiveMap,gt=!!E.metalnessMap,Te=!!E.roughnessMap,Oe=E.anisotropy>0,C=E.clearcoat>0,y=E.dispersion>0,G=E.iridescence>0,Y=E.sheen>0,Z=E.transmission>0,j=Oe&&!!E.anisotropyMap,Ee=C&&!!E.clearcoatMap,le=C&&!!E.clearcoatNormalMap,Ce=C&&!!E.clearcoatRoughnessMap,ve=G&&!!E.iridescenceMap,ee=G&&!!E.iridescenceThicknessMap,oe=Y&&!!E.sheenColorMap,Re=Y&&!!E.sheenRoughnessMap,Ae=!!E.specularMap,he=!!E.specularColorMap,Ie=!!E.specularIntensityMap,D=Z&&!!E.transmissionMap,de=Z&&!!E.thicknessMap,se=!!E.gradientMap,ae=!!E.alphaMap,te=E.alphaTest>0,K=!!E.alphaHash,_e=!!E.extensions;let Ne=oi;E.toneMapped&&(J===null||J.isXRRenderTarget===!0)&&(Ne=n.toneMapping);const ft={shaderID:ie,shaderType:E.type,shaderName:E.name,vertexShader:tt,fragmentShader:nt,defines:E.defines,customVertexShaderID:it,customFragmentShaderID:q,isRawShaderMaterial:E.isRawShaderMaterial===!0,glslVersion:E.glslVersion,precision:m,batching:Se,batchingColor:Se&&B._colorsTexture!==null,instancing:De,instancingColor:De&&B.instanceColor!==null,instancingMorph:De&&B.morphTexture!==null,supportsVertexTextures:h,outputColorSpace:J===null?n.outputColorSpace:J.isXRRenderTarget===!0?J.texture.colorSpace:xr,alphaToCoverage:!!E.alphaToCoverage,map:$e,matcap:It,envMap:Ve,envMapMode:Ve&&Q.mapping,envMapCubeUVHeight:$,aoMap:pt,lightMap:I,bumpMap:Xe,normalMap:qe,displacementMap:h&&lt,emissiveMap:ye,normalMapObjectSpace:qe&&E.normalMapType===Dp,normalMapTangentSpace:qe&&E.normalMapType===Xu,metalnessMap:gt,roughnessMap:Te,anisotropy:Oe,anisotropyMap:j,clearcoat:C,clearcoatMap:Ee,clearcoatNormalMap:le,clearcoatRoughnessMap:Ce,dispersion:y,iridescence:G,iridescenceMap:ve,iridescenceThicknessMap:ee,sheen:Y,sheenColorMap:oe,sheenRoughnessMap:Re,specularMap:Ae,specularColorMap:he,specularIntensityMap:Ie,transmission:Z,transmissionMap:D,thicknessMap:de,gradientMap:se,opaque:E.transparent===!1&&E.blending===dr&&E.alphaToCoverage===!1,alphaMap:ae,alphaTest:te,alphaHash:K,combine:E.combine,mapUv:$e&&b(E.map.channel),aoMapUv:pt&&b(E.aoMap.channel),lightMapUv:I&&b(E.lightMap.channel),bumpMapUv:Xe&&b(E.bumpMap.channel),normalMapUv:qe&&b(E.normalMap.channel),displacementMapUv:lt&&b(E.displacementMap.channel),emissiveMapUv:ye&&b(E.emissiveMap.channel),metalnessMapUv:gt&&b(E.metalnessMap.channel),roughnessMapUv:Te&&b(E.roughnessMap.channel),anisotropyMapUv:j&&b(E.anisotropyMap.channel),clearcoatMapUv:Ee&&b(E.clearcoatMap.channel),clearcoatNormalMapUv:le&&b(E.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Ce&&b(E.clearcoatRoughnessMap.channel),iridescenceMapUv:ve&&b(E.iridescenceMap.channel),iridescenceThicknessMapUv:ee&&b(E.iridescenceThicknessMap.channel),sheenColorMapUv:oe&&b(E.sheenColorMap.channel),sheenRoughnessMapUv:Re&&b(E.sheenRoughnessMap.channel),specularMapUv:Ae&&b(E.specularMap.channel),specularColorMapUv:he&&b(E.specularColorMap.channel),specularIntensityMapUv:Ie&&b(E.specularIntensityMap.channel),transmissionMapUv:D&&b(E.transmissionMap.channel),thicknessMapUv:de&&b(E.thicknessMap.channel),alphaMapUv:ae&&b(E.alphaMap.channel),vertexTangents:!!V.attributes.tangent&&(qe||Oe),vertexColors:E.vertexColors,vertexAlphas:E.vertexColors===!0&&!!V.attributes.color&&V.attributes.color.itemSize===4,pointsUvs:B.isPoints===!0&&!!V.attributes.uv&&($e||ae),fog:!!W,useFog:E.fog===!0,fogExp2:!!W&&W.isFogExp2,flatShading:E.flatShading===!0&&E.wireframe===!1,sizeAttenuation:E.sizeAttenuation===!0,logarithmicDepthBuffer:p,reversedDepthBuffer:me,skinning:B.isSkinnedMesh===!0,morphTargets:V.morphAttributes.position!==void 0,morphNormals:V.morphAttributes.normal!==void 0,morphColors:V.morphAttributes.color!==void 0,morphTargetsCount:xe,morphTextureStride:je,numDirLights:S.directional.length,numPointLights:S.point.length,numSpotLights:S.spot.length,numSpotLightMaps:S.spotLightMap.length,numRectAreaLights:S.rectArea.length,numHemiLights:S.hemi.length,numDirLightShadows:S.directionalShadowMap.length,numPointLightShadows:S.pointShadowMap.length,numSpotLightShadows:S.spotShadowMap.length,numSpotLightShadowsWithMaps:S.numSpotLightShadowsWithMaps,numLightProbes:S.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:E.dithering,shadowMapEnabled:n.shadowMap.enabled&&P.length>0,shadowMapType:n.shadowMap.type,toneMapping:Ne,decodeVideoTexture:$e&&E.map.isVideoTexture===!0&&Qe.getTransfer(E.map.colorSpace)===st,decodeVideoTextureEmissive:ye&&E.emissiveMap.isVideoTexture===!0&&Qe.getTransfer(E.emissiveMap.colorSpace)===st,premultipliedAlpha:E.premultipliedAlpha,doubleSided:E.side===Tn,flipSided:E.side===Xt,useDepthPacking:E.depthPacking>=0,depthPacking:E.depthPacking||0,index0AttributeName:E.index0AttributeName,extensionClipCullDistance:_e&&E.extensions.clipCullDistance===!0&&i.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(_e&&E.extensions.multiDraw===!0||Se)&&i.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:E.customProgramCacheKey()};return ft.vertexUv1s=u.has(1),ft.vertexUv2s=u.has(2),ft.vertexUv3s=u.has(3),u.clear(),ft}function g(E){const S=[];if(E.shaderID?S.push(E.shaderID):(S.push(E.customVertexShaderID),S.push(E.customFragmentShaderID)),E.defines!==void 0)for(const P in E.defines)S.push(P),S.push(E.defines[P]);return E.isRawShaderMaterial===!1&&(w(S,E),T(S,E),S.push(n.outputColorSpace)),S.push(E.customProgramCacheKey),S.join()}function w(E,S){E.push(S.precision),E.push(S.outputColorSpace),E.push(S.envMapMode),E.push(S.envMapCubeUVHeight),E.push(S.mapUv),E.push(S.alphaMapUv),E.push(S.lightMapUv),E.push(S.aoMapUv),E.push(S.bumpMapUv),E.push(S.normalMapUv),E.push(S.displacementMapUv),E.push(S.emissiveMapUv),E.push(S.metalnessMapUv),E.push(S.roughnessMapUv),E.push(S.anisotropyMapUv),E.push(S.clearcoatMapUv),E.push(S.clearcoatNormalMapUv),E.push(S.clearcoatRoughnessMapUv),E.push(S.iridescenceMapUv),E.push(S.iridescenceThicknessMapUv),E.push(S.sheenColorMapUv),E.push(S.sheenRoughnessMapUv),E.push(S.specularMapUv),E.push(S.specularColorMapUv),E.push(S.specularIntensityMapUv),E.push(S.transmissionMapUv),E.push(S.thicknessMapUv),E.push(S.combine),E.push(S.fogExp2),E.push(S.sizeAttenuation),E.push(S.morphTargetsCount),E.push(S.morphAttributeCount),E.push(S.numDirLights),E.push(S.numPointLights),E.push(S.numSpotLights),E.push(S.numSpotLightMaps),E.push(S.numHemiLights),E.push(S.numRectAreaLights),E.push(S.numDirLightShadows),E.push(S.numPointLightShadows),E.push(S.numSpotLightShadows),E.push(S.numSpotLightShadowsWithMaps),E.push(S.numLightProbes),E.push(S.shadowMapType),E.push(S.toneMapping),E.push(S.numClippingPlanes),E.push(S.numClipIntersection),E.push(S.depthPacking)}function T(E,S){c.disableAll(),S.supportsVertexTextures&&c.enable(0),S.instancing&&c.enable(1),S.instancingColor&&c.enable(2),S.instancingMorph&&c.enable(3),S.matcap&&c.enable(4),S.envMap&&c.enable(5),S.normalMapObjectSpace&&c.enable(6),S.normalMapTangentSpace&&c.enable(7),S.clearcoat&&c.enable(8),S.iridescence&&c.enable(9),S.alphaTest&&c.enable(10),S.vertexColors&&c.enable(11),S.vertexAlphas&&c.enable(12),S.vertexUv1s&&c.enable(13),S.vertexUv2s&&c.enable(14),S.vertexUv3s&&c.enable(15),S.vertexTangents&&c.enable(16),S.anisotropy&&c.enable(17),S.alphaHash&&c.enable(18),S.batching&&c.enable(19),S.dispersion&&c.enable(20),S.batchingColor&&c.enable(21),S.gradientMap&&c.enable(22),E.push(c.mask),c.disableAll(),S.fog&&c.enable(0),S.useFog&&c.enable(1),S.flatShading&&c.enable(2),S.logarithmicDepthBuffer&&c.enable(3),S.reversedDepthBuffer&&c.enable(4),S.skinning&&c.enable(5),S.morphTargets&&c.enable(6),S.morphNormals&&c.enable(7),S.morphColors&&c.enable(8),S.premultipliedAlpha&&c.enable(9),S.shadowMapEnabled&&c.enable(10),S.doubleSided&&c.enable(11),S.flipSided&&c.enable(12),S.useDepthPacking&&c.enable(13),S.dithering&&c.enable(14),S.transmission&&c.enable(15),S.sheen&&c.enable(16),S.opaque&&c.enable(17),S.pointsUvs&&c.enable(18),S.decodeVideoTexture&&c.enable(19),S.decodeVideoTextureEmissive&&c.enable(20),S.alphaToCoverage&&c.enable(21),E.push(c.mask)}function L(E){const S=_[E.type];let P;if(S){const O=Mn[S];P=lm.clone(O.uniforms)}else P=E.uniforms;return P}function R(E,S){let P;for(let O=0,B=f.length;O<B;O++){const W=f[O];if(W.cacheKey===S){P=W,++P.usedTimes;break}}return P===void 0&&(P=new G_(n,S,E,o),f.push(P)),P}function M(E){if(--E.usedTimes===0){const S=f.indexOf(E);f[S]=f[f.length-1],f.pop(),E.destroy()}}function A(E){d.remove(E)}function F(){d.dispose()}return{getParameters:x,getProgramCacheKey:g,getUniforms:L,acquireProgram:R,releaseProgram:M,releaseShaderCache:A,programs:f,dispose:F}}function W_(){let n=new WeakMap;function e(a){return n.has(a)}function t(a){let c=n.get(a);return c===void 0&&(c={},n.set(a,c)),c}function i(a){n.delete(a)}function r(a,c,d){n.get(a)[c]=d}function o(){n=new WeakMap}return{has:e,get:t,remove:i,update:r,dispose:o}}function j_(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.z!==e.z?n.z-e.z:n.id-e.id}function Xd(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function qd(){const n=[];let e=0;const t=[],i=[],r=[];function o(){e=0,t.length=0,i.length=0,r.length=0}function a(p,h,m,_,b,x){let g=n[e];return g===void 0?(g={id:p.id,object:p,geometry:h,material:m,groupOrder:_,renderOrder:p.renderOrder,z:b,group:x},n[e]=g):(g.id=p.id,g.object=p,g.geometry=h,g.material=m,g.groupOrder=_,g.renderOrder=p.renderOrder,g.z=b,g.group=x),e++,g}function c(p,h,m,_,b,x){const g=a(p,h,m,_,b,x);m.transmission>0?i.push(g):m.transparent===!0?r.push(g):t.push(g)}function d(p,h,m,_,b,x){const g=a(p,h,m,_,b,x);m.transmission>0?i.unshift(g):m.transparent===!0?r.unshift(g):t.unshift(g)}function u(p,h){t.length>1&&t.sort(p||j_),i.length>1&&i.sort(h||Xd),r.length>1&&r.sort(h||Xd)}function f(){for(let p=e,h=n.length;p<h;p++){const m=n[p];if(m.id===null)break;m.id=null,m.object=null,m.geometry=null,m.material=null,m.group=null}}return{opaque:t,transmissive:i,transparent:r,init:o,push:c,unshift:d,finish:f,sort:u}}function $_(){let n=new WeakMap;function e(i,r){const o=n.get(i);let a;return o===void 0?(a=new qd,n.set(i,[a])):r>=o.length?(a=new qd,o.push(a)):a=o[r],a}function t(){n=new WeakMap}return{get:e,dispose:t}}function X_(){const n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new k,color:new ze};break;case"SpotLight":t={position:new k,direction:new k,color:new ze,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new k,color:new ze,distance:0,decay:0};break;case"HemisphereLight":t={direction:new k,skyColor:new ze,groundColor:new ze};break;case"RectAreaLight":t={color:new ze,position:new k,halfWidth:new k,halfHeight:new k};break}return n[e.id]=t,t}}}function q_(){const n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Be};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Be};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Be,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}let Y_=0;function K_(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function J_(n){const e=new X_,t=q_(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let u=0;u<9;u++)i.probe.push(new k);const r=new k,o=new vt,a=new vt;function c(u){let f=0,p=0,h=0;for(let E=0;E<9;E++)i.probe[E].set(0,0,0);let m=0,_=0,b=0,x=0,g=0,w=0,T=0,L=0,R=0,M=0,A=0;u.sort(K_);for(let E=0,S=u.length;E<S;E++){const P=u[E],O=P.color,B=P.intensity,W=P.distance,V=P.shadow&&P.shadow.map?P.shadow.map.texture:null;if(P.isAmbientLight)f+=O.r*B,p+=O.g*B,h+=O.b*B;else if(P.isLightProbe){for(let X=0;X<9;X++)i.probe[X].addScaledVector(P.sh.coefficients[X],B);A++}else if(P.isDirectionalLight){const X=e.get(P);if(X.color.copy(P.color).multiplyScalar(P.intensity),P.castShadow){const Q=P.shadow,$=t.get(P);$.shadowIntensity=Q.intensity,$.shadowBias=Q.bias,$.shadowNormalBias=Q.normalBias,$.shadowRadius=Q.radius,$.shadowMapSize=Q.mapSize,i.directionalShadow[m]=$,i.directionalShadowMap[m]=V,i.directionalShadowMatrix[m]=P.shadow.matrix,w++}i.directional[m]=X,m++}else if(P.isSpotLight){const X=e.get(P);X.position.setFromMatrixPosition(P.matrixWorld),X.color.copy(O).multiplyScalar(B),X.distance=W,X.coneCos=Math.cos(P.angle),X.penumbraCos=Math.cos(P.angle*(1-P.penumbra)),X.decay=P.decay,i.spot[b]=X;const Q=P.shadow;if(P.map&&(i.spotLightMap[R]=P.map,R++,Q.updateMatrices(P),P.castShadow&&M++),i.spotLightMatrix[b]=Q.matrix,P.castShadow){const $=t.get(P);$.shadowIntensity=Q.intensity,$.shadowBias=Q.bias,$.shadowNormalBias=Q.normalBias,$.shadowRadius=Q.radius,$.shadowMapSize=Q.mapSize,i.spotShadow[b]=$,i.spotShadowMap[b]=V,L++}b++}else if(P.isRectAreaLight){const X=e.get(P);X.color.copy(O).multiplyScalar(B),X.halfWidth.set(P.width*.5,0,0),X.halfHeight.set(0,P.height*.5,0),i.rectArea[x]=X,x++}else if(P.isPointLight){const X=e.get(P);if(X.color.copy(P.color).multiplyScalar(P.intensity),X.distance=P.distance,X.decay=P.decay,P.castShadow){const Q=P.shadow,$=t.get(P);$.shadowIntensity=Q.intensity,$.shadowBias=Q.bias,$.shadowNormalBias=Q.normalBias,$.shadowRadius=Q.radius,$.shadowMapSize=Q.mapSize,$.shadowCameraNear=Q.camera.near,$.shadowCameraFar=Q.camera.far,i.pointShadow[_]=$,i.pointShadowMap[_]=V,i.pointShadowMatrix[_]=P.shadow.matrix,T++}i.point[_]=X,_++}else if(P.isHemisphereLight){const X=e.get(P);X.skyColor.copy(P.color).multiplyScalar(B),X.groundColor.copy(P.groundColor).multiplyScalar(B),i.hemi[g]=X,g++}}x>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=ce.LTC_FLOAT_1,i.rectAreaLTC2=ce.LTC_FLOAT_2):(i.rectAreaLTC1=ce.LTC_HALF_1,i.rectAreaLTC2=ce.LTC_HALF_2)),i.ambient[0]=f,i.ambient[1]=p,i.ambient[2]=h;const F=i.hash;(F.directionalLength!==m||F.pointLength!==_||F.spotLength!==b||F.rectAreaLength!==x||F.hemiLength!==g||F.numDirectionalShadows!==w||F.numPointShadows!==T||F.numSpotShadows!==L||F.numSpotMaps!==R||F.numLightProbes!==A)&&(i.directional.length=m,i.spot.length=b,i.rectArea.length=x,i.point.length=_,i.hemi.length=g,i.directionalShadow.length=w,i.directionalShadowMap.length=w,i.pointShadow.length=T,i.pointShadowMap.length=T,i.spotShadow.length=L,i.spotShadowMap.length=L,i.directionalShadowMatrix.length=w,i.pointShadowMatrix.length=T,i.spotLightMatrix.length=L+R-M,i.spotLightMap.length=R,i.numSpotLightShadowsWithMaps=M,i.numLightProbes=A,F.directionalLength=m,F.pointLength=_,F.spotLength=b,F.rectAreaLength=x,F.hemiLength=g,F.numDirectionalShadows=w,F.numPointShadows=T,F.numSpotShadows=L,F.numSpotMaps=R,F.numLightProbes=A,i.version=Y_++)}function d(u,f){let p=0,h=0,m=0,_=0,b=0;const x=f.matrixWorldInverse;for(let g=0,w=u.length;g<w;g++){const T=u[g];if(T.isDirectionalLight){const L=i.directional[p];L.direction.setFromMatrixPosition(T.matrixWorld),r.setFromMatrixPosition(T.target.matrixWorld),L.direction.sub(r),L.direction.transformDirection(x),p++}else if(T.isSpotLight){const L=i.spot[m];L.position.setFromMatrixPosition(T.matrixWorld),L.position.applyMatrix4(x),L.direction.setFromMatrixPosition(T.matrixWorld),r.setFromMatrixPosition(T.target.matrixWorld),L.direction.sub(r),L.direction.transformDirection(x),m++}else if(T.isRectAreaLight){const L=i.rectArea[_];L.position.setFromMatrixPosition(T.matrixWorld),L.position.applyMatrix4(x),a.identity(),o.copy(T.matrixWorld),o.premultiply(x),a.extractRotation(o),L.halfWidth.set(T.width*.5,0,0),L.halfHeight.set(0,T.height*.5,0),L.halfWidth.applyMatrix4(a),L.halfHeight.applyMatrix4(a),_++}else if(T.isPointLight){const L=i.point[h];L.position.setFromMatrixPosition(T.matrixWorld),L.position.applyMatrix4(x),h++}else if(T.isHemisphereLight){const L=i.hemi[b];L.direction.setFromMatrixPosition(T.matrixWorld),L.direction.transformDirection(x),b++}}}return{setup:c,setupView:d,state:i}}function Yd(n){const e=new J_(n),t=[],i=[];function r(f){u.camera=f,t.length=0,i.length=0}function o(f){t.push(f)}function a(f){i.push(f)}function c(){e.setup(t)}function d(f){e.setupView(t,f)}const u={lightsArray:t,shadowsArray:i,camera:null,lights:e,transmissionRenderTarget:{}};return{init:r,state:u,setupLights:c,setupLightsView:d,pushLight:o,pushShadow:a}}function Z_(n){let e=new WeakMap;function t(r,o=0){const a=e.get(r);let c;return a===void 0?(c=new Yd(n),e.set(r,[c])):o>=a.length?(c=new Yd(n),a.push(c)):c=a[o],c}function i(){e=new WeakMap}return{get:t,dispose:i}}const Q_=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,eb=`uniform sampler2D shadow_pass;
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
}`;function tb(n,e,t){let i=new ll;const r=new Be,o=new Be,a=new St,c=new vm({depthPacking:Ip}),d=new Em,u={},f=t.maxTextureSize,p={[ai]:Xt,[Xt]:ai,[Tn]:Tn},h=new Xn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Be},radius:{value:4}},vertexShader:Q_,fragmentShader:eb}),m=h.clone();m.defines.HORIZONTAL_PASS=1;const _=new un;_.setAttribute("position",new An(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const b=new Dn(_,h),x=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Ou;let g=this.type;this.render=function(M,A,F){if(x.enabled===!1||x.autoUpdate===!1&&x.needsUpdate===!1||M.length===0)return;const E=n.getRenderTarget(),S=n.getActiveCubeFace(),P=n.getActiveMipmapLevel(),O=n.state;O.setBlending(Wn),O.buffers.depth.getReversed()===!0?O.buffers.color.setClear(0,0,0,0):O.buffers.color.setClear(1,1,1,1),O.buffers.depth.setTest(!0),O.setScissorTest(!1);const B=g!==kn&&this.type===kn,W=g===kn&&this.type!==kn;for(let V=0,X=M.length;V<X;V++){const Q=M[V],$=Q.shadow;if($===void 0){Fe("WebGLShadowMap:",Q,"has no shadow.");continue}if($.autoUpdate===!1&&$.needsUpdate===!1)continue;r.copy($.mapSize);const ie=$.getFrameExtents();if(r.multiply(ie),o.copy($.mapSize),(r.x>f||r.y>f)&&(r.x>f&&(o.x=Math.floor(f/ie.x),r.x=o.x*ie.x,$.mapSize.x=o.x),r.y>f&&(o.y=Math.floor(f/ie.y),r.y=o.y*ie.y,$.mapSize.y=o.y)),$.map===null||B===!0||W===!0){const xe=this.type!==kn?{minFilter:tn,magFilter:tn}:{};$.map!==null&&$.map.dispose(),$.map=new Ri(r.x,r.y,xe),$.map.texture.name=Q.name+".shadowMap",$.camera.updateProjectionMatrix()}n.setRenderTarget($.map),n.clear();const ne=$.getViewportCount();for(let xe=0;xe<ne;xe++){const je=$.getViewport(xe);a.set(o.x*je.x,o.y*je.y,o.x*je.z,o.y*je.w),O.viewport(a),$.updateMatrices(Q,xe),i=$.getFrustum(),L(A,F,$.camera,Q,this.type)}$.isPointLightShadow!==!0&&this.type===kn&&w($,F),$.needsUpdate=!1}g=this.type,x.needsUpdate=!1,n.setRenderTarget(E,S,P)};function w(M,A){const F=e.update(b);h.defines.VSM_SAMPLES!==M.blurSamples&&(h.defines.VSM_SAMPLES=M.blurSamples,m.defines.VSM_SAMPLES=M.blurSamples,h.needsUpdate=!0,m.needsUpdate=!0),M.mapPass===null&&(M.mapPass=new Ri(r.x,r.y)),h.uniforms.shadow_pass.value=M.map.texture,h.uniforms.resolution.value=M.mapSize,h.uniforms.radius.value=M.radius,n.setRenderTarget(M.mapPass),n.clear(),n.renderBufferDirect(A,null,F,h,b,null),m.uniforms.shadow_pass.value=M.mapPass.texture,m.uniforms.resolution.value=M.mapSize,m.uniforms.radius.value=M.radius,n.setRenderTarget(M.map),n.clear(),n.renderBufferDirect(A,null,F,m,b,null)}function T(M,A,F,E){let S=null;const P=F.isPointLight===!0?M.customDistanceMaterial:M.customDepthMaterial;if(P!==void 0)S=P;else if(S=F.isPointLight===!0?d:c,n.localClippingEnabled&&A.clipShadows===!0&&Array.isArray(A.clippingPlanes)&&A.clippingPlanes.length!==0||A.displacementMap&&A.displacementScale!==0||A.alphaMap&&A.alphaTest>0||A.map&&A.alphaTest>0||A.alphaToCoverage===!0){const O=S.uuid,B=A.uuid;let W=u[O];W===void 0&&(W={},u[O]=W);let V=W[B];V===void 0&&(V=S.clone(),W[B]=V,A.addEventListener("dispose",R)),S=V}if(S.visible=A.visible,S.wireframe=A.wireframe,E===kn?S.side=A.shadowSide!==null?A.shadowSide:A.side:S.side=A.shadowSide!==null?A.shadowSide:p[A.side],S.alphaMap=A.alphaMap,S.alphaTest=A.alphaToCoverage===!0?.5:A.alphaTest,S.map=A.map,S.clipShadows=A.clipShadows,S.clippingPlanes=A.clippingPlanes,S.clipIntersection=A.clipIntersection,S.displacementMap=A.displacementMap,S.displacementScale=A.displacementScale,S.displacementBias=A.displacementBias,S.wireframeLinewidth=A.wireframeLinewidth,S.linewidth=A.linewidth,F.isPointLight===!0&&S.isMeshDistanceMaterial===!0){const O=n.properties.get(S);O.light=F}return S}function L(M,A,F,E,S){if(M.visible===!1)return;if(M.layers.test(A.layers)&&(M.isMesh||M.isLine||M.isPoints)&&(M.castShadow||M.receiveShadow&&S===kn)&&(!M.frustumCulled||i.intersectsObject(M))){M.modelViewMatrix.multiplyMatrices(F.matrixWorldInverse,M.matrixWorld);const B=e.update(M),W=M.material;if(Array.isArray(W)){const V=B.groups;for(let X=0,Q=V.length;X<Q;X++){const $=V[X],ie=W[$.materialIndex];if(ie&&ie.visible){const ne=T(M,ie,E,S);M.onBeforeShadow(n,M,A,F,B,ne,$),n.renderBufferDirect(F,null,B,ne,M,$),M.onAfterShadow(n,M,A,F,B,ne,$)}}}else if(W.visible){const V=T(M,W,E,S);M.onBeforeShadow(n,M,A,F,B,V,null),n.renderBufferDirect(F,null,B,V,M,null),M.onAfterShadow(n,M,A,F,B,V,null)}}const O=M.children;for(let B=0,W=O.length;B<W;B++)L(O[B],A,F,E,S)}function R(M){M.target.removeEventListener("dispose",R);for(const F in u){const E=u[F],S=M.target.uuid;S in E&&(E[S].dispose(),delete E[S])}}}const nb={[$a]:Xa,[qa]:Ja,[Ya]:Za,[pr]:Ka,[Xa]:$a,[Ja]:qa,[Za]:Ya,[Ka]:pr};function ib(n,e){function t(){let D=!1;const de=new St;let se=null;const ae=new St(0,0,0,0);return{setMask:function(te){se!==te&&!D&&(n.colorMask(te,te,te,te),se=te)},setLocked:function(te){D=te},setClear:function(te,K,_e,Ne,ft){ft===!0&&(te*=Ne,K*=Ne,_e*=Ne),de.set(te,K,_e,Ne),ae.equals(de)===!1&&(n.clearColor(te,K,_e,Ne),ae.copy(de))},reset:function(){D=!1,se=null,ae.set(-1,0,0,0)}}}function i(){let D=!1,de=!1,se=null,ae=null,te=null;return{setReversed:function(K){if(de!==K){const _e=e.get("EXT_clip_control");K?_e.clipControlEXT(_e.LOWER_LEFT_EXT,_e.ZERO_TO_ONE_EXT):_e.clipControlEXT(_e.LOWER_LEFT_EXT,_e.NEGATIVE_ONE_TO_ONE_EXT),de=K;const Ne=te;te=null,this.setClear(Ne)}},getReversed:function(){return de},setTest:function(K){K?J(n.DEPTH_TEST):me(n.DEPTH_TEST)},setMask:function(K){se!==K&&!D&&(n.depthMask(K),se=K)},setFunc:function(K){if(de&&(K=nb[K]),ae!==K){switch(K){case $a:n.depthFunc(n.NEVER);break;case Xa:n.depthFunc(n.ALWAYS);break;case qa:n.depthFunc(n.LESS);break;case pr:n.depthFunc(n.LEQUAL);break;case Ya:n.depthFunc(n.EQUAL);break;case Ka:n.depthFunc(n.GEQUAL);break;case Ja:n.depthFunc(n.GREATER);break;case Za:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}ae=K}},setLocked:function(K){D=K},setClear:function(K){te!==K&&(de&&(K=1-K),n.clearDepth(K),te=K)},reset:function(){D=!1,se=null,ae=null,te=null,de=!1}}}function r(){let D=!1,de=null,se=null,ae=null,te=null,K=null,_e=null,Ne=null,ft=null;return{setTest:function(rt){D||(rt?J(n.STENCIL_TEST):me(n.STENCIL_TEST))},setMask:function(rt){de!==rt&&!D&&(n.stencilMask(rt),de=rt)},setFunc:function(rt,vn,fn){(se!==rt||ae!==vn||te!==fn)&&(n.stencilFunc(rt,vn,fn),se=rt,ae=vn,te=fn)},setOp:function(rt,vn,fn){(K!==rt||_e!==vn||Ne!==fn)&&(n.stencilOp(rt,vn,fn),K=rt,_e=vn,Ne=fn)},setLocked:function(rt){D=rt},setClear:function(rt){ft!==rt&&(n.clearStencil(rt),ft=rt)},reset:function(){D=!1,de=null,se=null,ae=null,te=null,K=null,_e=null,Ne=null,ft=null}}}const o=new t,a=new i,c=new r,d=new WeakMap,u=new WeakMap;let f={},p={},h=new WeakMap,m=[],_=null,b=!1,x=null,g=null,w=null,T=null,L=null,R=null,M=null,A=new ze(0,0,0),F=0,E=!1,S=null,P=null,O=null,B=null,W=null;const V=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let X=!1,Q=0;const $=n.getParameter(n.VERSION);$.indexOf("WebGL")!==-1?(Q=parseFloat(/^WebGL (\d)/.exec($)[1]),X=Q>=1):$.indexOf("OpenGL ES")!==-1&&(Q=parseFloat(/^OpenGL ES (\d)/.exec($)[1]),X=Q>=2);let ie=null,ne={};const xe=n.getParameter(n.SCISSOR_BOX),je=n.getParameter(n.VIEWPORT),tt=new St().fromArray(xe),nt=new St().fromArray(je);function it(D,de,se,ae){const te=new Uint8Array(4),K=n.createTexture();n.bindTexture(D,K),n.texParameteri(D,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(D,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let _e=0;_e<se;_e++)D===n.TEXTURE_3D||D===n.TEXTURE_2D_ARRAY?n.texImage3D(de,0,n.RGBA,1,1,ae,0,n.RGBA,n.UNSIGNED_BYTE,te):n.texImage2D(de+_e,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,te);return K}const q={};q[n.TEXTURE_2D]=it(n.TEXTURE_2D,n.TEXTURE_2D,1),q[n.TEXTURE_CUBE_MAP]=it(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),q[n.TEXTURE_2D_ARRAY]=it(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),q[n.TEXTURE_3D]=it(n.TEXTURE_3D,n.TEXTURE_3D,1,1),o.setClear(0,0,0,1),a.setClear(1),c.setClear(0),J(n.DEPTH_TEST),a.setFunc(pr),Xe(!1),qe(Xl),J(n.CULL_FACE),pt(Wn);function J(D){f[D]!==!0&&(n.enable(D),f[D]=!0)}function me(D){f[D]!==!1&&(n.disable(D),f[D]=!1)}function De(D,de){return p[D]!==de?(n.bindFramebuffer(D,de),p[D]=de,D===n.DRAW_FRAMEBUFFER&&(p[n.FRAMEBUFFER]=de),D===n.FRAMEBUFFER&&(p[n.DRAW_FRAMEBUFFER]=de),!0):!1}function Se(D,de){let se=m,ae=!1;if(D){se=h.get(de),se===void 0&&(se=[],h.set(de,se));const te=D.textures;if(se.length!==te.length||se[0]!==n.COLOR_ATTACHMENT0){for(let K=0,_e=te.length;K<_e;K++)se[K]=n.COLOR_ATTACHMENT0+K;se.length=te.length,ae=!0}}else se[0]!==n.BACK&&(se[0]=n.BACK,ae=!0);ae&&n.drawBuffers(se)}function $e(D){return _!==D?(n.useProgram(D),_=D,!0):!1}const It={[Si]:n.FUNC_ADD,[rp]:n.FUNC_SUBTRACT,[op]:n.FUNC_REVERSE_SUBTRACT};It[sp]=n.MIN,It[ap]=n.MAX;const Ve={[cp]:n.ZERO,[lp]:n.ONE,[dp]:n.SRC_COLOR,[Wa]:n.SRC_ALPHA,[gp]:n.SRC_ALPHA_SATURATE,[pp]:n.DST_COLOR,[fp]:n.DST_ALPHA,[up]:n.ONE_MINUS_SRC_COLOR,[ja]:n.ONE_MINUS_SRC_ALPHA,[mp]:n.ONE_MINUS_DST_COLOR,[hp]:n.ONE_MINUS_DST_ALPHA,[xp]:n.CONSTANT_COLOR,[_p]:n.ONE_MINUS_CONSTANT_COLOR,[bp]:n.CONSTANT_ALPHA,[yp]:n.ONE_MINUS_CONSTANT_ALPHA};function pt(D,de,se,ae,te,K,_e,Ne,ft,rt){if(D===Wn){b===!0&&(me(n.BLEND),b=!1);return}if(b===!1&&(J(n.BLEND),b=!0),D!==ip){if(D!==x||rt!==E){if((g!==Si||L!==Si)&&(n.blendEquation(n.FUNC_ADD),g=Si,L=Si),rt)switch(D){case dr:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case ql:n.blendFunc(n.ONE,n.ONE);break;case Yl:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Kl:n.blendFuncSeparate(n.DST_COLOR,n.ONE_MINUS_SRC_ALPHA,n.ZERO,n.ONE);break;default:Mt("WebGLState: Invalid blending: ",D);break}else switch(D){case dr:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case ql:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE,n.ONE,n.ONE);break;case Yl:Mt("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Kl:Mt("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Mt("WebGLState: Invalid blending: ",D);break}w=null,T=null,R=null,M=null,A.set(0,0,0),F=0,x=D,E=rt}return}te=te||de,K=K||se,_e=_e||ae,(de!==g||te!==L)&&(n.blendEquationSeparate(It[de],It[te]),g=de,L=te),(se!==w||ae!==T||K!==R||_e!==M)&&(n.blendFuncSeparate(Ve[se],Ve[ae],Ve[K],Ve[_e]),w=se,T=ae,R=K,M=_e),(Ne.equals(A)===!1||ft!==F)&&(n.blendColor(Ne.r,Ne.g,Ne.b,ft),A.copy(Ne),F=ft),x=D,E=!1}function I(D,de){D.side===Tn?me(n.CULL_FACE):J(n.CULL_FACE);let se=D.side===Xt;de&&(se=!se),Xe(se),D.blending===dr&&D.transparent===!1?pt(Wn):pt(D.blending,D.blendEquation,D.blendSrc,D.blendDst,D.blendEquationAlpha,D.blendSrcAlpha,D.blendDstAlpha,D.blendColor,D.blendAlpha,D.premultipliedAlpha),a.setFunc(D.depthFunc),a.setTest(D.depthTest),a.setMask(D.depthWrite),o.setMask(D.colorWrite);const ae=D.stencilWrite;c.setTest(ae),ae&&(c.setMask(D.stencilWriteMask),c.setFunc(D.stencilFunc,D.stencilRef,D.stencilFuncMask),c.setOp(D.stencilFail,D.stencilZFail,D.stencilZPass)),ye(D.polygonOffset,D.polygonOffsetFactor,D.polygonOffsetUnits),D.alphaToCoverage===!0?J(n.SAMPLE_ALPHA_TO_COVERAGE):me(n.SAMPLE_ALPHA_TO_COVERAGE)}function Xe(D){S!==D&&(D?n.frontFace(n.CW):n.frontFace(n.CCW),S=D)}function qe(D){D!==ep?(J(n.CULL_FACE),D!==P&&(D===Xl?n.cullFace(n.BACK):D===tp?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):me(n.CULL_FACE),P=D}function lt(D){D!==O&&(X&&n.lineWidth(D),O=D)}function ye(D,de,se){D?(J(n.POLYGON_OFFSET_FILL),(B!==de||W!==se)&&(n.polygonOffset(de,se),B=de,W=se)):me(n.POLYGON_OFFSET_FILL)}function gt(D){D?J(n.SCISSOR_TEST):me(n.SCISSOR_TEST)}function Te(D){D===void 0&&(D=n.TEXTURE0+V-1),ie!==D&&(n.activeTexture(D),ie=D)}function Oe(D,de,se){se===void 0&&(ie===null?se=n.TEXTURE0+V-1:se=ie);let ae=ne[se];ae===void 0&&(ae={type:void 0,texture:void 0},ne[se]=ae),(ae.type!==D||ae.texture!==de)&&(ie!==se&&(n.activeTexture(se),ie=se),n.bindTexture(D,de||q[D]),ae.type=D,ae.texture=de)}function C(){const D=ne[ie];D!==void 0&&D.type!==void 0&&(n.bindTexture(D.type,null),D.type=void 0,D.texture=void 0)}function y(){try{n.compressedTexImage2D(...arguments)}catch(D){D("WebGLState:",D)}}function G(){try{n.compressedTexImage3D(...arguments)}catch(D){D("WebGLState:",D)}}function Y(){try{n.texSubImage2D(...arguments)}catch(D){D("WebGLState:",D)}}function Z(){try{n.texSubImage3D(...arguments)}catch(D){D("WebGLState:",D)}}function j(){try{n.compressedTexSubImage2D(...arguments)}catch(D){D("WebGLState:",D)}}function Ee(){try{n.compressedTexSubImage3D(...arguments)}catch(D){D("WebGLState:",D)}}function le(){try{n.texStorage2D(...arguments)}catch(D){D("WebGLState:",D)}}function Ce(){try{n.texStorage3D(...arguments)}catch(D){D("WebGLState:",D)}}function ve(){try{n.texImage2D(...arguments)}catch(D){D("WebGLState:",D)}}function ee(){try{n.texImage3D(...arguments)}catch(D){D("WebGLState:",D)}}function oe(D){tt.equals(D)===!1&&(n.scissor(D.x,D.y,D.z,D.w),tt.copy(D))}function Re(D){nt.equals(D)===!1&&(n.viewport(D.x,D.y,D.z,D.w),nt.copy(D))}function Ae(D,de){let se=u.get(de);se===void 0&&(se=new WeakMap,u.set(de,se));let ae=se.get(D);ae===void 0&&(ae=n.getUniformBlockIndex(de,D.name),se.set(D,ae))}function he(D,de){const ae=u.get(de).get(D);d.get(de)!==ae&&(n.uniformBlockBinding(de,ae,D.__bindingPointIndex),d.set(de,ae))}function Ie(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),a.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),f={},ie=null,ne={},p={},h=new WeakMap,m=[],_=null,b=!1,x=null,g=null,w=null,T=null,L=null,R=null,M=null,A=new ze(0,0,0),F=0,E=!1,S=null,P=null,O=null,B=null,W=null,tt.set(0,0,n.canvas.width,n.canvas.height),nt.set(0,0,n.canvas.width,n.canvas.height),o.reset(),a.reset(),c.reset()}return{buffers:{color:o,depth:a,stencil:c},enable:J,disable:me,bindFramebuffer:De,drawBuffers:Se,useProgram:$e,setBlending:pt,setMaterial:I,setFlipSided:Xe,setCullFace:qe,setLineWidth:lt,setPolygonOffset:ye,setScissorTest:gt,activeTexture:Te,bindTexture:Oe,unbindTexture:C,compressedTexImage2D:y,compressedTexImage3D:G,texImage2D:ve,texImage3D:ee,updateUBOMapping:Ae,uniformBlockBinding:he,texStorage2D:le,texStorage3D:Ce,texSubImage2D:Y,texSubImage3D:Z,compressedTexSubImage2D:j,compressedTexSubImage3D:Ee,scissor:oe,viewport:Re,reset:Ie}}function rb(n,e,t,i,r,o,a){const c=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,d=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),u=new Be,f=new WeakMap;let p;const h=new WeakMap;let m=!1;try{m=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function _(C,y){return m?new OffscreenCanvas(C,y):vs("canvas")}function b(C,y,G){let Y=1;const Z=Oe(C);if((Z.width>G||Z.height>G)&&(Y=G/Math.max(Z.width,Z.height)),Y<1)if(typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&C instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&C instanceof ImageBitmap||typeof VideoFrame<"u"&&C instanceof VideoFrame){const j=Math.floor(Y*Z.width),Ee=Math.floor(Y*Z.height);p===void 0&&(p=_(j,Ee));const le=y?_(j,Ee):p;return le.width=j,le.height=Ee,le.getContext("2d").drawImage(C,0,0,j,Ee),Fe("WebGLRenderer: Texture has been resized from ("+Z.width+"x"+Z.height+") to ("+j+"x"+Ee+")."),le}else return"data"in C&&Fe("WebGLRenderer: Image in DataTexture is too big ("+Z.width+"x"+Z.height+")."),C;return C}function x(C){return C.generateMipmaps}function g(C){n.generateMipmap(C)}function w(C){return C.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:C.isWebGL3DRenderTarget?n.TEXTURE_3D:C.isWebGLArrayRenderTarget||C.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function T(C,y,G,Y,Z=!1){if(C!==null){if(n[C]!==void 0)return n[C];Fe("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+C+"'")}let j=y;if(y===n.RED&&(G===n.FLOAT&&(j=n.R32F),G===n.HALF_FLOAT&&(j=n.R16F),G===n.UNSIGNED_BYTE&&(j=n.R8)),y===n.RED_INTEGER&&(G===n.UNSIGNED_BYTE&&(j=n.R8UI),G===n.UNSIGNED_SHORT&&(j=n.R16UI),G===n.UNSIGNED_INT&&(j=n.R32UI),G===n.BYTE&&(j=n.R8I),G===n.SHORT&&(j=n.R16I),G===n.INT&&(j=n.R32I)),y===n.RG&&(G===n.FLOAT&&(j=n.RG32F),G===n.HALF_FLOAT&&(j=n.RG16F),G===n.UNSIGNED_BYTE&&(j=n.RG8)),y===n.RG_INTEGER&&(G===n.UNSIGNED_BYTE&&(j=n.RG8UI),G===n.UNSIGNED_SHORT&&(j=n.RG16UI),G===n.UNSIGNED_INT&&(j=n.RG32UI),G===n.BYTE&&(j=n.RG8I),G===n.SHORT&&(j=n.RG16I),G===n.INT&&(j=n.RG32I)),y===n.RGB_INTEGER&&(G===n.UNSIGNED_BYTE&&(j=n.RGB8UI),G===n.UNSIGNED_SHORT&&(j=n.RGB16UI),G===n.UNSIGNED_INT&&(j=n.RGB32UI),G===n.BYTE&&(j=n.RGB8I),G===n.SHORT&&(j=n.RGB16I),G===n.INT&&(j=n.RGB32I)),y===n.RGBA_INTEGER&&(G===n.UNSIGNED_BYTE&&(j=n.RGBA8UI),G===n.UNSIGNED_SHORT&&(j=n.RGBA16UI),G===n.UNSIGNED_INT&&(j=n.RGBA32UI),G===n.BYTE&&(j=n.RGBA8I),G===n.SHORT&&(j=n.RGBA16I),G===n.INT&&(j=n.RGBA32I)),y===n.RGB&&(G===n.UNSIGNED_INT_5_9_9_9_REV&&(j=n.RGB9_E5),G===n.UNSIGNED_INT_10F_11F_11F_REV&&(j=n.R11F_G11F_B10F)),y===n.RGBA){const Ee=Z?ys:Qe.getTransfer(Y);G===n.FLOAT&&(j=n.RGBA32F),G===n.HALF_FLOAT&&(j=n.RGBA16F),G===n.UNSIGNED_BYTE&&(j=Ee===st?n.SRGB8_ALPHA8:n.RGBA8),G===n.UNSIGNED_SHORT_4_4_4_4&&(j=n.RGBA4),G===n.UNSIGNED_SHORT_5_5_5_1&&(j=n.RGB5_A1)}return(j===n.R16F||j===n.R32F||j===n.RG16F||j===n.RG32F||j===n.RGBA16F||j===n.RGBA32F)&&e.get("EXT_color_buffer_float"),j}function L(C,y){let G;return C?y===null||y===Ai||y===io?G=n.DEPTH24_STENCIL8:y===Vn?G=n.DEPTH32F_STENCIL8:y===no&&(G=n.DEPTH24_STENCIL8,Fe("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):y===null||y===Ai||y===io?G=n.DEPTH_COMPONENT24:y===Vn?G=n.DEPTH_COMPONENT32F:y===no&&(G=n.DEPTH_COMPONENT16),G}function R(C,y){return x(C)===!0||C.isFramebufferTexture&&C.minFilter!==tn&&C.minFilter!==ln?Math.log2(Math.max(y.width,y.height))+1:C.mipmaps!==void 0&&C.mipmaps.length>0?C.mipmaps.length:C.isCompressedTexture&&Array.isArray(C.image)?y.mipmaps.length:1}function M(C){const y=C.target;y.removeEventListener("dispose",M),F(y),y.isVideoTexture&&f.delete(y)}function A(C){const y=C.target;y.removeEventListener("dispose",A),S(y)}function F(C){const y=i.get(C);if(y.__webglInit===void 0)return;const G=C.source,Y=h.get(G);if(Y){const Z=Y[y.__cacheKey];Z.usedTimes--,Z.usedTimes===0&&E(C),Object.keys(Y).length===0&&h.delete(G)}i.remove(C)}function E(C){const y=i.get(C);n.deleteTexture(y.__webglTexture);const G=C.source,Y=h.get(G);delete Y[y.__cacheKey],a.memory.textures--}function S(C){const y=i.get(C);if(C.depthTexture&&(C.depthTexture.dispose(),i.remove(C.depthTexture)),C.isWebGLCubeRenderTarget)for(let Y=0;Y<6;Y++){if(Array.isArray(y.__webglFramebuffer[Y]))for(let Z=0;Z<y.__webglFramebuffer[Y].length;Z++)n.deleteFramebuffer(y.__webglFramebuffer[Y][Z]);else n.deleteFramebuffer(y.__webglFramebuffer[Y]);y.__webglDepthbuffer&&n.deleteRenderbuffer(y.__webglDepthbuffer[Y])}else{if(Array.isArray(y.__webglFramebuffer))for(let Y=0;Y<y.__webglFramebuffer.length;Y++)n.deleteFramebuffer(y.__webglFramebuffer[Y]);else n.deleteFramebuffer(y.__webglFramebuffer);if(y.__webglDepthbuffer&&n.deleteRenderbuffer(y.__webglDepthbuffer),y.__webglMultisampledFramebuffer&&n.deleteFramebuffer(y.__webglMultisampledFramebuffer),y.__webglColorRenderbuffer)for(let Y=0;Y<y.__webglColorRenderbuffer.length;Y++)y.__webglColorRenderbuffer[Y]&&n.deleteRenderbuffer(y.__webglColorRenderbuffer[Y]);y.__webglDepthRenderbuffer&&n.deleteRenderbuffer(y.__webglDepthRenderbuffer)}const G=C.textures;for(let Y=0,Z=G.length;Y<Z;Y++){const j=i.get(G[Y]);j.__webglTexture&&(n.deleteTexture(j.__webglTexture),a.memory.textures--),i.remove(G[Y])}i.remove(C)}let P=0;function O(){P=0}function B(){const C=P;return C>=r.maxTextures&&Fe("WebGLTextures: Trying to use "+C+" texture units while this GPU supports only "+r.maxTextures),P+=1,C}function W(C){const y=[];return y.push(C.wrapS),y.push(C.wrapT),y.push(C.wrapR||0),y.push(C.magFilter),y.push(C.minFilter),y.push(C.anisotropy),y.push(C.internalFormat),y.push(C.format),y.push(C.type),y.push(C.generateMipmaps),y.push(C.premultiplyAlpha),y.push(C.flipY),y.push(C.unpackAlignment),y.push(C.colorSpace),y.join()}function V(C,y){const G=i.get(C);if(C.isVideoTexture&&gt(C),C.isRenderTargetTexture===!1&&C.isExternalTexture!==!0&&C.version>0&&G.__version!==C.version){const Y=C.image;if(Y===null)Fe("WebGLRenderer: Texture marked for update but no image data found.");else if(Y.complete===!1)Fe("WebGLRenderer: Texture marked for update but image is incomplete");else{q(G,C,y);return}}else C.isExternalTexture&&(G.__webglTexture=C.sourceTexture?C.sourceTexture:null);t.bindTexture(n.TEXTURE_2D,G.__webglTexture,n.TEXTURE0+y)}function X(C,y){const G=i.get(C);if(C.isRenderTargetTexture===!1&&C.version>0&&G.__version!==C.version){q(G,C,y);return}else C.isExternalTexture&&(G.__webglTexture=C.sourceTexture?C.sourceTexture:null);t.bindTexture(n.TEXTURE_2D_ARRAY,G.__webglTexture,n.TEXTURE0+y)}function Q(C,y){const G=i.get(C);if(C.isRenderTargetTexture===!1&&C.version>0&&G.__version!==C.version){q(G,C,y);return}t.bindTexture(n.TEXTURE_3D,G.__webglTexture,n.TEXTURE0+y)}function $(C,y){const G=i.get(C);if(C.version>0&&G.__version!==C.version){J(G,C,y);return}t.bindTexture(n.TEXTURE_CUBE_MAP,G.__webglTexture,n.TEXTURE0+y)}const ie={[tc]:n.REPEAT,[Hn]:n.CLAMP_TO_EDGE,[nc]:n.MIRRORED_REPEAT},ne={[tn]:n.NEAREST,[Rp]:n.NEAREST_MIPMAP_NEAREST,[Eo]:n.NEAREST_MIPMAP_LINEAR,[ln]:n.LINEAR,[Zs]:n.LINEAR_MIPMAP_NEAREST,[Ei]:n.LINEAR_MIPMAP_LINEAR},xe={[Fp]:n.NEVER,[kp]:n.ALWAYS,[Np]:n.LESS,[qu]:n.LEQUAL,[Up]:n.EQUAL,[Gp]:n.GEQUAL,[Op]:n.GREATER,[Bp]:n.NOTEQUAL};function je(C,y){if(y.type===Vn&&e.has("OES_texture_float_linear")===!1&&(y.magFilter===ln||y.magFilter===Zs||y.magFilter===Eo||y.magFilter===Ei||y.minFilter===ln||y.minFilter===Zs||y.minFilter===Eo||y.minFilter===Ei)&&Fe("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(C,n.TEXTURE_WRAP_S,ie[y.wrapS]),n.texParameteri(C,n.TEXTURE_WRAP_T,ie[y.wrapT]),(C===n.TEXTURE_3D||C===n.TEXTURE_2D_ARRAY)&&n.texParameteri(C,n.TEXTURE_WRAP_R,ie[y.wrapR]),n.texParameteri(C,n.TEXTURE_MAG_FILTER,ne[y.magFilter]),n.texParameteri(C,n.TEXTURE_MIN_FILTER,ne[y.minFilter]),y.compareFunction&&(n.texParameteri(C,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(C,n.TEXTURE_COMPARE_FUNC,xe[y.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(y.magFilter===tn||y.minFilter!==Eo&&y.minFilter!==Ei||y.type===Vn&&e.has("OES_texture_float_linear")===!1)return;if(y.anisotropy>1||i.get(y).__currentAnisotropy){const G=e.get("EXT_texture_filter_anisotropic");n.texParameterf(C,G.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(y.anisotropy,r.getMaxAnisotropy())),i.get(y).__currentAnisotropy=y.anisotropy}}}function tt(C,y){let G=!1;C.__webglInit===void 0&&(C.__webglInit=!0,y.addEventListener("dispose",M));const Y=y.source;let Z=h.get(Y);Z===void 0&&(Z={},h.set(Y,Z));const j=W(y);if(j!==C.__cacheKey){Z[j]===void 0&&(Z[j]={texture:n.createTexture(),usedTimes:0},a.memory.textures++,G=!0),Z[j].usedTimes++;const Ee=Z[C.__cacheKey];Ee!==void 0&&(Z[C.__cacheKey].usedTimes--,Ee.usedTimes===0&&E(y)),C.__cacheKey=j,C.__webglTexture=Z[j].texture}return G}function nt(C,y,G){return Math.floor(Math.floor(C/G)/y)}function it(C,y,G,Y){const j=C.updateRanges;if(j.length===0)t.texSubImage2D(n.TEXTURE_2D,0,0,0,y.width,y.height,G,Y,y.data);else{j.sort((ee,oe)=>ee.start-oe.start);let Ee=0;for(let ee=1;ee<j.length;ee++){const oe=j[Ee],Re=j[ee],Ae=oe.start+oe.count,he=nt(Re.start,y.width,4),Ie=nt(oe.start,y.width,4);Re.start<=Ae+1&&he===Ie&&nt(Re.start+Re.count-1,y.width,4)===he?oe.count=Math.max(oe.count,Re.start+Re.count-oe.start):(++Ee,j[Ee]=Re)}j.length=Ee+1;const le=n.getParameter(n.UNPACK_ROW_LENGTH),Ce=n.getParameter(n.UNPACK_SKIP_PIXELS),ve=n.getParameter(n.UNPACK_SKIP_ROWS);n.pixelStorei(n.UNPACK_ROW_LENGTH,y.width);for(let ee=0,oe=j.length;ee<oe;ee++){const Re=j[ee],Ae=Math.floor(Re.start/4),he=Math.ceil(Re.count/4),Ie=Ae%y.width,D=Math.floor(Ae/y.width),de=he,se=1;n.pixelStorei(n.UNPACK_SKIP_PIXELS,Ie),n.pixelStorei(n.UNPACK_SKIP_ROWS,D),t.texSubImage2D(n.TEXTURE_2D,0,Ie,D,de,se,G,Y,y.data)}C.clearUpdateRanges(),n.pixelStorei(n.UNPACK_ROW_LENGTH,le),n.pixelStorei(n.UNPACK_SKIP_PIXELS,Ce),n.pixelStorei(n.UNPACK_SKIP_ROWS,ve)}}function q(C,y,G){let Y=n.TEXTURE_2D;(y.isDataArrayTexture||y.isCompressedArrayTexture)&&(Y=n.TEXTURE_2D_ARRAY),y.isData3DTexture&&(Y=n.TEXTURE_3D);const Z=tt(C,y),j=y.source;t.bindTexture(Y,C.__webglTexture,n.TEXTURE0+G);const Ee=i.get(j);if(j.version!==Ee.__version||Z===!0){t.activeTexture(n.TEXTURE0+G);const le=Qe.getPrimaries(Qe.workingColorSpace),Ce=y.colorSpace===ii?null:Qe.getPrimaries(y.colorSpace),ve=y.colorSpace===ii||le===Ce?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,y.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,y.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,ve);let ee=b(y.image,!1,r.maxTextureSize);ee=Te(y,ee);const oe=o.convert(y.format,y.colorSpace),Re=o.convert(y.type);let Ae=T(y.internalFormat,oe,Re,y.colorSpace,y.isVideoTexture);je(Y,y);let he;const Ie=y.mipmaps,D=y.isVideoTexture!==!0,de=Ee.__version===void 0||Z===!0,se=j.dataReady,ae=R(y,ee);if(y.isDepthTexture)Ae=L(y.format===oo,y.type),de&&(D?t.texStorage2D(n.TEXTURE_2D,1,Ae,ee.width,ee.height):t.texImage2D(n.TEXTURE_2D,0,Ae,ee.width,ee.height,0,oe,Re,null));else if(y.isDataTexture)if(Ie.length>0){D&&de&&t.texStorage2D(n.TEXTURE_2D,ae,Ae,Ie[0].width,Ie[0].height);for(let te=0,K=Ie.length;te<K;te++)he=Ie[te],D?se&&t.texSubImage2D(n.TEXTURE_2D,te,0,0,he.width,he.height,oe,Re,he.data):t.texImage2D(n.TEXTURE_2D,te,Ae,he.width,he.height,0,oe,Re,he.data);y.generateMipmaps=!1}else D?(de&&t.texStorage2D(n.TEXTURE_2D,ae,Ae,ee.width,ee.height),se&&it(y,ee,oe,Re)):t.texImage2D(n.TEXTURE_2D,0,Ae,ee.width,ee.height,0,oe,Re,ee.data);else if(y.isCompressedTexture)if(y.isCompressedArrayTexture){D&&de&&t.texStorage3D(n.TEXTURE_2D_ARRAY,ae,Ae,Ie[0].width,Ie[0].height,ee.depth);for(let te=0,K=Ie.length;te<K;te++)if(he=Ie[te],y.format!==_n)if(oe!==null)if(D){if(se)if(y.layerUpdates.size>0){const _e=Cd(he.width,he.height,y.format,y.type);for(const Ne of y.layerUpdates){const ft=he.data.subarray(Ne*_e/he.data.BYTES_PER_ELEMENT,(Ne+1)*_e/he.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,te,0,0,Ne,he.width,he.height,1,oe,ft)}y.clearLayerUpdates()}else t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,te,0,0,0,he.width,he.height,ee.depth,oe,he.data)}else t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,te,Ae,he.width,he.height,ee.depth,0,he.data,0,0);else Fe("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else D?se&&t.texSubImage3D(n.TEXTURE_2D_ARRAY,te,0,0,0,he.width,he.height,ee.depth,oe,Re,he.data):t.texImage3D(n.TEXTURE_2D_ARRAY,te,Ae,he.width,he.height,ee.depth,0,oe,Re,he.data)}else{D&&de&&t.texStorage2D(n.TEXTURE_2D,ae,Ae,Ie[0].width,Ie[0].height);for(let te=0,K=Ie.length;te<K;te++)he=Ie[te],y.format!==_n?oe!==null?D?se&&t.compressedTexSubImage2D(n.TEXTURE_2D,te,0,0,he.width,he.height,oe,he.data):t.compressedTexImage2D(n.TEXTURE_2D,te,Ae,he.width,he.height,0,he.data):Fe("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):D?se&&t.texSubImage2D(n.TEXTURE_2D,te,0,0,he.width,he.height,oe,Re,he.data):t.texImage2D(n.TEXTURE_2D,te,Ae,he.width,he.height,0,oe,Re,he.data)}else if(y.isDataArrayTexture)if(D){if(de&&t.texStorage3D(n.TEXTURE_2D_ARRAY,ae,Ae,ee.width,ee.height,ee.depth),se)if(y.layerUpdates.size>0){const te=Cd(ee.width,ee.height,y.format,y.type);for(const K of y.layerUpdates){const _e=ee.data.subarray(K*te/ee.data.BYTES_PER_ELEMENT,(K+1)*te/ee.data.BYTES_PER_ELEMENT);t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,K,ee.width,ee.height,1,oe,Re,_e)}y.clearLayerUpdates()}else t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,ee.width,ee.height,ee.depth,oe,Re,ee.data)}else t.texImage3D(n.TEXTURE_2D_ARRAY,0,Ae,ee.width,ee.height,ee.depth,0,oe,Re,ee.data);else if(y.isData3DTexture)D?(de&&t.texStorage3D(n.TEXTURE_3D,ae,Ae,ee.width,ee.height,ee.depth),se&&t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,ee.width,ee.height,ee.depth,oe,Re,ee.data)):t.texImage3D(n.TEXTURE_3D,0,Ae,ee.width,ee.height,ee.depth,0,oe,Re,ee.data);else if(y.isFramebufferTexture){if(de)if(D)t.texStorage2D(n.TEXTURE_2D,ae,Ae,ee.width,ee.height);else{let te=ee.width,K=ee.height;for(let _e=0;_e<ae;_e++)t.texImage2D(n.TEXTURE_2D,_e,Ae,te,K,0,oe,Re,null),te>>=1,K>>=1}}else if(Ie.length>0){if(D&&de){const te=Oe(Ie[0]);t.texStorage2D(n.TEXTURE_2D,ae,Ae,te.width,te.height)}for(let te=0,K=Ie.length;te<K;te++)he=Ie[te],D?se&&t.texSubImage2D(n.TEXTURE_2D,te,0,0,oe,Re,he):t.texImage2D(n.TEXTURE_2D,te,Ae,oe,Re,he);y.generateMipmaps=!1}else if(D){if(de){const te=Oe(ee);t.texStorage2D(n.TEXTURE_2D,ae,Ae,te.width,te.height)}se&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,oe,Re,ee)}else t.texImage2D(n.TEXTURE_2D,0,Ae,oe,Re,ee);x(y)&&g(Y),Ee.__version=j.version,y.onUpdate&&y.onUpdate(y)}C.__version=y.version}function J(C,y,G){if(y.image.length!==6)return;const Y=tt(C,y),Z=y.source;t.bindTexture(n.TEXTURE_CUBE_MAP,C.__webglTexture,n.TEXTURE0+G);const j=i.get(Z);if(Z.version!==j.__version||Y===!0){t.activeTexture(n.TEXTURE0+G);const Ee=Qe.getPrimaries(Qe.workingColorSpace),le=y.colorSpace===ii?null:Qe.getPrimaries(y.colorSpace),Ce=y.colorSpace===ii||Ee===le?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,y.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,y.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ce);const ve=y.isCompressedTexture||y.image[0].isCompressedTexture,ee=y.image[0]&&y.image[0].isDataTexture,oe=[];for(let K=0;K<6;K++)!ve&&!ee?oe[K]=b(y.image[K],!0,r.maxCubemapSize):oe[K]=ee?y.image[K].image:y.image[K],oe[K]=Te(y,oe[K]);const Re=oe[0],Ae=o.convert(y.format,y.colorSpace),he=o.convert(y.type),Ie=T(y.internalFormat,Ae,he,y.colorSpace),D=y.isVideoTexture!==!0,de=j.__version===void 0||Y===!0,se=Z.dataReady;let ae=R(y,Re);je(n.TEXTURE_CUBE_MAP,y);let te;if(ve){D&&de&&t.texStorage2D(n.TEXTURE_CUBE_MAP,ae,Ie,Re.width,Re.height);for(let K=0;K<6;K++){te=oe[K].mipmaps;for(let _e=0;_e<te.length;_e++){const Ne=te[_e];y.format!==_n?Ae!==null?D?se&&t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,_e,0,0,Ne.width,Ne.height,Ae,Ne.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,_e,Ie,Ne.width,Ne.height,0,Ne.data):Fe("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):D?se&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,_e,0,0,Ne.width,Ne.height,Ae,he,Ne.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,_e,Ie,Ne.width,Ne.height,0,Ae,he,Ne.data)}}}else{if(te=y.mipmaps,D&&de){te.length>0&&ae++;const K=Oe(oe[0]);t.texStorage2D(n.TEXTURE_CUBE_MAP,ae,Ie,K.width,K.height)}for(let K=0;K<6;K++)if(ee){D?se&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,0,0,oe[K].width,oe[K].height,Ae,he,oe[K].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,Ie,oe[K].width,oe[K].height,0,Ae,he,oe[K].data);for(let _e=0;_e<te.length;_e++){const ft=te[_e].image[K].image;D?se&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,_e+1,0,0,ft.width,ft.height,Ae,he,ft.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,_e+1,Ie,ft.width,ft.height,0,Ae,he,ft.data)}}else{D?se&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,0,0,Ae,he,oe[K]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,Ie,Ae,he,oe[K]);for(let _e=0;_e<te.length;_e++){const Ne=te[_e];D?se&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,_e+1,0,0,Ae,he,Ne.image[K]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,_e+1,Ie,Ae,he,Ne.image[K])}}}x(y)&&g(n.TEXTURE_CUBE_MAP),j.__version=Z.version,y.onUpdate&&y.onUpdate(y)}C.__version=y.version}function me(C,y,G,Y,Z,j){const Ee=o.convert(G.format,G.colorSpace),le=o.convert(G.type),Ce=T(G.internalFormat,Ee,le,G.colorSpace),ve=i.get(y),ee=i.get(G);if(ee.__renderTarget=y,!ve.__hasExternalTextures){const oe=Math.max(1,y.width>>j),Re=Math.max(1,y.height>>j);Z===n.TEXTURE_3D||Z===n.TEXTURE_2D_ARRAY?t.texImage3D(Z,j,Ce,oe,Re,y.depth,0,Ee,le,null):t.texImage2D(Z,j,Ce,oe,Re,0,Ee,le,null)}t.bindFramebuffer(n.FRAMEBUFFER,C),ye(y)?c.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,Y,Z,ee.__webglTexture,0,lt(y)):(Z===n.TEXTURE_2D||Z>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&Z<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,Y,Z,ee.__webglTexture,j),t.bindFramebuffer(n.FRAMEBUFFER,null)}function De(C,y,G){if(n.bindRenderbuffer(n.RENDERBUFFER,C),y.depthBuffer){const Y=y.depthTexture,Z=Y&&Y.isDepthTexture?Y.type:null,j=L(y.stencilBuffer,Z),Ee=y.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,le=lt(y);ye(y)?c.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,le,j,y.width,y.height):G?n.renderbufferStorageMultisample(n.RENDERBUFFER,le,j,y.width,y.height):n.renderbufferStorage(n.RENDERBUFFER,j,y.width,y.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,Ee,n.RENDERBUFFER,C)}else{const Y=y.textures;for(let Z=0;Z<Y.length;Z++){const j=Y[Z],Ee=o.convert(j.format,j.colorSpace),le=o.convert(j.type),Ce=T(j.internalFormat,Ee,le,j.colorSpace),ve=lt(y);G&&ye(y)===!1?n.renderbufferStorageMultisample(n.RENDERBUFFER,ve,Ce,y.width,y.height):ye(y)?c.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,ve,Ce,y.width,y.height):n.renderbufferStorage(n.RENDERBUFFER,Ce,y.width,y.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function Se(C,y){if(y&&y.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(n.FRAMEBUFFER,C),!(y.depthTexture&&y.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const Y=i.get(y.depthTexture);Y.__renderTarget=y,(!Y.__webglTexture||y.depthTexture.image.width!==y.width||y.depthTexture.image.height!==y.height)&&(y.depthTexture.image.width=y.width,y.depthTexture.image.height=y.height,y.depthTexture.needsUpdate=!0),V(y.depthTexture,0);const Z=Y.__webglTexture,j=lt(y);if(y.depthTexture.format===ro)ye(y)?c.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,Z,0,j):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,Z,0);else if(y.depthTexture.format===oo)ye(y)?c.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,Z,0,j):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,Z,0);else throw new Error("Unknown depthTexture format")}function $e(C){const y=i.get(C),G=C.isWebGLCubeRenderTarget===!0;if(y.__boundDepthTexture!==C.depthTexture){const Y=C.depthTexture;if(y.__depthDisposeCallback&&y.__depthDisposeCallback(),Y){const Z=()=>{delete y.__boundDepthTexture,delete y.__depthDisposeCallback,Y.removeEventListener("dispose",Z)};Y.addEventListener("dispose",Z),y.__depthDisposeCallback=Z}y.__boundDepthTexture=Y}if(C.depthTexture&&!y.__autoAllocateDepthBuffer){if(G)throw new Error("target.depthTexture not supported in Cube render targets");const Y=C.texture.mipmaps;Y&&Y.length>0?Se(y.__webglFramebuffer[0],C):Se(y.__webglFramebuffer,C)}else if(G){y.__webglDepthbuffer=[];for(let Y=0;Y<6;Y++)if(t.bindFramebuffer(n.FRAMEBUFFER,y.__webglFramebuffer[Y]),y.__webglDepthbuffer[Y]===void 0)y.__webglDepthbuffer[Y]=n.createRenderbuffer(),De(y.__webglDepthbuffer[Y],C,!1);else{const Z=C.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,j=y.__webglDepthbuffer[Y];n.bindRenderbuffer(n.RENDERBUFFER,j),n.framebufferRenderbuffer(n.FRAMEBUFFER,Z,n.RENDERBUFFER,j)}}else{const Y=C.texture.mipmaps;if(Y&&Y.length>0?t.bindFramebuffer(n.FRAMEBUFFER,y.__webglFramebuffer[0]):t.bindFramebuffer(n.FRAMEBUFFER,y.__webglFramebuffer),y.__webglDepthbuffer===void 0)y.__webglDepthbuffer=n.createRenderbuffer(),De(y.__webglDepthbuffer,C,!1);else{const Z=C.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,j=y.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,j),n.framebufferRenderbuffer(n.FRAMEBUFFER,Z,n.RENDERBUFFER,j)}}t.bindFramebuffer(n.FRAMEBUFFER,null)}function It(C,y,G){const Y=i.get(C);y!==void 0&&me(Y.__webglFramebuffer,C,C.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),G!==void 0&&$e(C)}function Ve(C){const y=C.texture,G=i.get(C),Y=i.get(y);C.addEventListener("dispose",A);const Z=C.textures,j=C.isWebGLCubeRenderTarget===!0,Ee=Z.length>1;if(Ee||(Y.__webglTexture===void 0&&(Y.__webglTexture=n.createTexture()),Y.__version=y.version,a.memory.textures++),j){G.__webglFramebuffer=[];for(let le=0;le<6;le++)if(y.mipmaps&&y.mipmaps.length>0){G.__webglFramebuffer[le]=[];for(let Ce=0;Ce<y.mipmaps.length;Ce++)G.__webglFramebuffer[le][Ce]=n.createFramebuffer()}else G.__webglFramebuffer[le]=n.createFramebuffer()}else{if(y.mipmaps&&y.mipmaps.length>0){G.__webglFramebuffer=[];for(let le=0;le<y.mipmaps.length;le++)G.__webglFramebuffer[le]=n.createFramebuffer()}else G.__webglFramebuffer=n.createFramebuffer();if(Ee)for(let le=0,Ce=Z.length;le<Ce;le++){const ve=i.get(Z[le]);ve.__webglTexture===void 0&&(ve.__webglTexture=n.createTexture(),a.memory.textures++)}if(C.samples>0&&ye(C)===!1){G.__webglMultisampledFramebuffer=n.createFramebuffer(),G.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,G.__webglMultisampledFramebuffer);for(let le=0;le<Z.length;le++){const Ce=Z[le];G.__webglColorRenderbuffer[le]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,G.__webglColorRenderbuffer[le]);const ve=o.convert(Ce.format,Ce.colorSpace),ee=o.convert(Ce.type),oe=T(Ce.internalFormat,ve,ee,Ce.colorSpace,C.isXRRenderTarget===!0),Re=lt(C);n.renderbufferStorageMultisample(n.RENDERBUFFER,Re,oe,C.width,C.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+le,n.RENDERBUFFER,G.__webglColorRenderbuffer[le])}n.bindRenderbuffer(n.RENDERBUFFER,null),C.depthBuffer&&(G.__webglDepthRenderbuffer=n.createRenderbuffer(),De(G.__webglDepthRenderbuffer,C,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(j){t.bindTexture(n.TEXTURE_CUBE_MAP,Y.__webglTexture),je(n.TEXTURE_CUBE_MAP,y);for(let le=0;le<6;le++)if(y.mipmaps&&y.mipmaps.length>0)for(let Ce=0;Ce<y.mipmaps.length;Ce++)me(G.__webglFramebuffer[le][Ce],C,y,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+le,Ce);else me(G.__webglFramebuffer[le],C,y,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+le,0);x(y)&&g(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(Ee){for(let le=0,Ce=Z.length;le<Ce;le++){const ve=Z[le],ee=i.get(ve);let oe=n.TEXTURE_2D;(C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(oe=C.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(oe,ee.__webglTexture),je(oe,ve),me(G.__webglFramebuffer,C,ve,n.COLOR_ATTACHMENT0+le,oe,0),x(ve)&&g(oe)}t.unbindTexture()}else{let le=n.TEXTURE_2D;if((C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(le=C.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(le,Y.__webglTexture),je(le,y),y.mipmaps&&y.mipmaps.length>0)for(let Ce=0;Ce<y.mipmaps.length;Ce++)me(G.__webglFramebuffer[Ce],C,y,n.COLOR_ATTACHMENT0,le,Ce);else me(G.__webglFramebuffer,C,y,n.COLOR_ATTACHMENT0,le,0);x(y)&&g(le),t.unbindTexture()}C.depthBuffer&&$e(C)}function pt(C){const y=C.textures;for(let G=0,Y=y.length;G<Y;G++){const Z=y[G];if(x(Z)){const j=w(C),Ee=i.get(Z).__webglTexture;t.bindTexture(j,Ee),g(j),t.unbindTexture()}}}const I=[],Xe=[];function qe(C){if(C.samples>0){if(ye(C)===!1){const y=C.textures,G=C.width,Y=C.height;let Z=n.COLOR_BUFFER_BIT;const j=C.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,Ee=i.get(C),le=y.length>1;if(le)for(let ve=0;ve<y.length;ve++)t.bindFramebuffer(n.FRAMEBUFFER,Ee.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+ve,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,Ee.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+ve,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,Ee.__webglMultisampledFramebuffer);const Ce=C.texture.mipmaps;Ce&&Ce.length>0?t.bindFramebuffer(n.DRAW_FRAMEBUFFER,Ee.__webglFramebuffer[0]):t.bindFramebuffer(n.DRAW_FRAMEBUFFER,Ee.__webglFramebuffer);for(let ve=0;ve<y.length;ve++){if(C.resolveDepthBuffer&&(C.depthBuffer&&(Z|=n.DEPTH_BUFFER_BIT),C.stencilBuffer&&C.resolveStencilBuffer&&(Z|=n.STENCIL_BUFFER_BIT)),le){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,Ee.__webglColorRenderbuffer[ve]);const ee=i.get(y[ve]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,ee,0)}n.blitFramebuffer(0,0,G,Y,0,0,G,Y,Z,n.NEAREST),d===!0&&(I.length=0,Xe.length=0,I.push(n.COLOR_ATTACHMENT0+ve),C.depthBuffer&&C.resolveDepthBuffer===!1&&(I.push(j),Xe.push(j),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,Xe)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,I))}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),le)for(let ve=0;ve<y.length;ve++){t.bindFramebuffer(n.FRAMEBUFFER,Ee.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+ve,n.RENDERBUFFER,Ee.__webglColorRenderbuffer[ve]);const ee=i.get(y[ve]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,Ee.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+ve,n.TEXTURE_2D,ee,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,Ee.__webglMultisampledFramebuffer)}else if(C.depthBuffer&&C.resolveDepthBuffer===!1&&d){const y=C.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[y])}}}function lt(C){return Math.min(r.maxSamples,C.samples)}function ye(C){const y=i.get(C);return C.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&y.__useRenderToTexture!==!1}function gt(C){const y=a.render.frame;f.get(C)!==y&&(f.set(C,y),C.update())}function Te(C,y){const G=C.colorSpace,Y=C.format,Z=C.type;return C.isCompressedTexture===!0||C.isVideoTexture===!0||G!==xr&&G!==ii&&(Qe.getTransfer(G)===st?(Y!==_n||Z!==Pn)&&Fe("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Mt("WebGLTextures: Unsupported texture color space:",G)),y}function Oe(C){return typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement?(u.width=C.naturalWidth||C.width,u.height=C.naturalHeight||C.height):typeof VideoFrame<"u"&&C instanceof VideoFrame?(u.width=C.displayWidth,u.height=C.displayHeight):(u.width=C.width,u.height=C.height),u}this.allocateTextureUnit=B,this.resetTextureUnits=O,this.setTexture2D=V,this.setTexture2DArray=X,this.setTexture3D=Q,this.setTextureCube=$,this.rebindTextures=It,this.setupRenderTarget=Ve,this.updateRenderTargetMipmap=pt,this.updateMultisampleRenderTarget=qe,this.setupDepthRenderbuffer=$e,this.setupFrameBufferTexture=me,this.useMultisampledRTT=ye}function ob(n,e){function t(i,r=ii){let o;const a=Qe.getTransfer(r);if(i===Pn)return n.UNSIGNED_BYTE;if(i===el)return n.UNSIGNED_SHORT_4_4_4_4;if(i===tl)return n.UNSIGNED_SHORT_5_5_5_1;if(i===Hu)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===Vu)return n.UNSIGNED_INT_10F_11F_11F_REV;if(i===ku)return n.BYTE;if(i===zu)return n.SHORT;if(i===no)return n.UNSIGNED_SHORT;if(i===Qc)return n.INT;if(i===Ai)return n.UNSIGNED_INT;if(i===Vn)return n.FLOAT;if(i===Er)return n.HALF_FLOAT;if(i===Wu)return n.ALPHA;if(i===ju)return n.RGB;if(i===_n)return n.RGBA;if(i===ro)return n.DEPTH_COMPONENT;if(i===oo)return n.DEPTH_STENCIL;if(i===$u)return n.RED;if(i===nl)return n.RED_INTEGER;if(i===il)return n.RG;if(i===rl)return n.RG_INTEGER;if(i===ol)return n.RGBA_INTEGER;if(i===ts||i===ns||i===is||i===rs)if(a===st)if(o=e.get("WEBGL_compressed_texture_s3tc_srgb"),o!==null){if(i===ts)return o.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===ns)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===is)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===rs)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(o=e.get("WEBGL_compressed_texture_s3tc"),o!==null){if(i===ts)return o.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===ns)return o.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===is)return o.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===rs)return o.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===ic||i===rc||i===oc||i===sc)if(o=e.get("WEBGL_compressed_texture_pvrtc"),o!==null){if(i===ic)return o.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===rc)return o.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===oc)return o.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===sc)return o.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===ac||i===cc||i===lc)if(o=e.get("WEBGL_compressed_texture_etc"),o!==null){if(i===ac||i===cc)return a===st?o.COMPRESSED_SRGB8_ETC2:o.COMPRESSED_RGB8_ETC2;if(i===lc)return a===st?o.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:o.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(i===dc||i===uc||i===fc||i===hc||i===pc||i===mc||i===gc||i===xc||i===_c||i===bc||i===yc||i===Sc||i===vc||i===Ec)if(o=e.get("WEBGL_compressed_texture_astc"),o!==null){if(i===dc)return a===st?o.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:o.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===uc)return a===st?o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:o.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===fc)return a===st?o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:o.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===hc)return a===st?o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:o.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===pc)return a===st?o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:o.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===mc)return a===st?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:o.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===gc)return a===st?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:o.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===xc)return a===st?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:o.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===_c)return a===st?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:o.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===bc)return a===st?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:o.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===yc)return a===st?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:o.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===Sc)return a===st?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:o.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===vc)return a===st?o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:o.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===Ec)return a===st?o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:o.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===Mc||i===Tc||i===Cc)if(o=e.get("EXT_texture_compression_bptc"),o!==null){if(i===Mc)return a===st?o.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:o.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===Tc)return o.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===Cc)return o.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===wc||i===Ac||i===Lc||i===Rc)if(o=e.get("EXT_texture_compression_rgtc"),o!==null){if(i===wc)return o.COMPRESSED_RED_RGTC1_EXT;if(i===Ac)return o.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Lc)return o.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===Rc)return o.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===io?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:t}}const sb=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,ab=`
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

}`;class cb{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){const i=new sf(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=i}}getMesh(e){if(this.texture!==null&&this.mesh===null){const t=e.cameras[0].viewport,i=new Xn({vertexShader:sb,fragmentShader:ab,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Dn(new go(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class lb extends Ni{constructor(e,t){super();const i=this;let r=null,o=1,a=null,c="local-floor",d=1,u=null,f=null,p=null,h=null,m=null,_=null;const b=typeof XRWebGLBinding<"u",x=new cb,g={},w=t.getContextAttributes();let T=null,L=null;const R=[],M=[],A=new Be;let F=null;const E=new an;E.viewport=new St;const S=new an;S.viewport=new St;const P=[E,S],O=new wm;let B=null,W=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(q){let J=R[q];return J===void 0&&(J=new ya,R[q]=J),J.getTargetRaySpace()},this.getControllerGrip=function(q){let J=R[q];return J===void 0&&(J=new ya,R[q]=J),J.getGripSpace()},this.getHand=function(q){let J=R[q];return J===void 0&&(J=new ya,R[q]=J),J.getHandSpace()};function V(q){const J=M.indexOf(q.inputSource);if(J===-1)return;const me=R[J];me!==void 0&&(me.update(q.inputSource,q.frame,u||a),me.dispatchEvent({type:q.type,data:q.inputSource}))}function X(){r.removeEventListener("select",V),r.removeEventListener("selectstart",V),r.removeEventListener("selectend",V),r.removeEventListener("squeeze",V),r.removeEventListener("squeezestart",V),r.removeEventListener("squeezeend",V),r.removeEventListener("end",X),r.removeEventListener("inputsourceschange",Q);for(let q=0;q<R.length;q++){const J=M[q];J!==null&&(M[q]=null,R[q].disconnect(J))}B=null,W=null,x.reset();for(const q in g)delete g[q];e.setRenderTarget(T),m=null,h=null,p=null,r=null,L=null,it.stop(),i.isPresenting=!1,e.setPixelRatio(F),e.setSize(A.width,A.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(q){o=q,i.isPresenting===!0&&Fe("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(q){c=q,i.isPresenting===!0&&Fe("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return u||a},this.setReferenceSpace=function(q){u=q},this.getBaseLayer=function(){return h!==null?h:m},this.getBinding=function(){return p===null&&b&&(p=new XRWebGLBinding(r,t)),p},this.getFrame=function(){return _},this.getSession=function(){return r},this.setSession=async function(q){if(r=q,r!==null){if(T=e.getRenderTarget(),r.addEventListener("select",V),r.addEventListener("selectstart",V),r.addEventListener("selectend",V),r.addEventListener("squeeze",V),r.addEventListener("squeezestart",V),r.addEventListener("squeezeend",V),r.addEventListener("end",X),r.addEventListener("inputsourceschange",Q),w.xrCompatible!==!0&&await t.makeXRCompatible(),F=e.getPixelRatio(),e.getSize(A),b&&"createProjectionLayer"in XRWebGLBinding.prototype){let me=null,De=null,Se=null;w.depth&&(Se=w.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,me=w.stencil?oo:ro,De=w.stencil?io:Ai);const $e={colorFormat:t.RGBA8,depthFormat:Se,scaleFactor:o};p=this.getBinding(),h=p.createProjectionLayer($e),r.updateRenderState({layers:[h]}),e.setPixelRatio(1),e.setSize(h.textureWidth,h.textureHeight,!1),L=new Ri(h.textureWidth,h.textureHeight,{format:_n,type:Pn,depthTexture:new of(h.textureWidth,h.textureHeight,De,void 0,void 0,void 0,void 0,void 0,void 0,me),stencilBuffer:w.stencil,colorSpace:e.outputColorSpace,samples:w.antialias?4:0,resolveDepthBuffer:h.ignoreDepthValues===!1,resolveStencilBuffer:h.ignoreDepthValues===!1})}else{const me={antialias:w.antialias,alpha:!0,depth:w.depth,stencil:w.stencil,framebufferScaleFactor:o};m=new XRWebGLLayer(r,t,me),r.updateRenderState({baseLayer:m}),e.setPixelRatio(1),e.setSize(m.framebufferWidth,m.framebufferHeight,!1),L=new Ri(m.framebufferWidth,m.framebufferHeight,{format:_n,type:Pn,colorSpace:e.outputColorSpace,stencilBuffer:w.stencil,resolveDepthBuffer:m.ignoreDepthValues===!1,resolveStencilBuffer:m.ignoreDepthValues===!1})}L.isXRRenderTarget=!0,this.setFoveation(d),u=null,a=await r.requestReferenceSpace(c),it.setContext(r),it.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return x.getDepthTexture()};function Q(q){for(let J=0;J<q.removed.length;J++){const me=q.removed[J],De=M.indexOf(me);De>=0&&(M[De]=null,R[De].disconnect(me))}for(let J=0;J<q.added.length;J++){const me=q.added[J];let De=M.indexOf(me);if(De===-1){for(let $e=0;$e<R.length;$e++)if($e>=M.length){M.push(me),De=$e;break}else if(M[$e]===null){M[$e]=me,De=$e;break}if(De===-1)break}const Se=R[De];Se&&Se.connect(me)}}const $=new k,ie=new k;function ne(q,J,me){$.setFromMatrixPosition(J.matrixWorld),ie.setFromMatrixPosition(me.matrixWorld);const De=$.distanceTo(ie),Se=J.projectionMatrix.elements,$e=me.projectionMatrix.elements,It=Se[14]/(Se[10]-1),Ve=Se[14]/(Se[10]+1),pt=(Se[9]+1)/Se[5],I=(Se[9]-1)/Se[5],Xe=(Se[8]-1)/Se[0],qe=($e[8]+1)/$e[0],lt=It*Xe,ye=It*qe,gt=De/(-Xe+qe),Te=gt*-Xe;if(J.matrixWorld.decompose(q.position,q.quaternion,q.scale),q.translateX(Te),q.translateZ(gt),q.matrixWorld.compose(q.position,q.quaternion,q.scale),q.matrixWorldInverse.copy(q.matrixWorld).invert(),Se[10]===-1)q.projectionMatrix.copy(J.projectionMatrix),q.projectionMatrixInverse.copy(J.projectionMatrixInverse);else{const Oe=It+gt,C=Ve+gt,y=lt-Te,G=ye+(De-Te),Y=pt*Ve/C*Oe,Z=I*Ve/C*Oe;q.projectionMatrix.makePerspective(y,G,Y,Z,Oe,C),q.projectionMatrixInverse.copy(q.projectionMatrix).invert()}}function xe(q,J){J===null?q.matrixWorld.copy(q.matrix):q.matrixWorld.multiplyMatrices(J.matrixWorld,q.matrix),q.matrixWorldInverse.copy(q.matrixWorld).invert()}this.updateCamera=function(q){if(r===null)return;let J=q.near,me=q.far;x.texture!==null&&(x.depthNear>0&&(J=x.depthNear),x.depthFar>0&&(me=x.depthFar)),O.near=S.near=E.near=J,O.far=S.far=E.far=me,(B!==O.near||W!==O.far)&&(r.updateRenderState({depthNear:O.near,depthFar:O.far}),B=O.near,W=O.far),O.layers.mask=q.layers.mask|6,E.layers.mask=O.layers.mask&3,S.layers.mask=O.layers.mask&5;const De=q.parent,Se=O.cameras;xe(O,De);for(let $e=0;$e<Se.length;$e++)xe(Se[$e],De);Se.length===2?ne(O,E,S):O.projectionMatrix.copy(E.projectionMatrix),je(q,O,De)};function je(q,J,me){me===null?q.matrix.copy(J.matrixWorld):(q.matrix.copy(me.matrixWorld),q.matrix.invert(),q.matrix.multiply(J.matrixWorld)),q.matrix.decompose(q.position,q.quaternion,q.scale),q.updateMatrixWorld(!0),q.projectionMatrix.copy(J.projectionMatrix),q.projectionMatrixInverse.copy(J.projectionMatrixInverse),q.isPerspectiveCamera&&(q.fov=Pc*2*Math.atan(1/q.projectionMatrix.elements[5]),q.zoom=1)}this.getCamera=function(){return O},this.getFoveation=function(){if(!(h===null&&m===null))return d},this.setFoveation=function(q){d=q,h!==null&&(h.fixedFoveation=q),m!==null&&m.fixedFoveation!==void 0&&(m.fixedFoveation=q)},this.hasDepthSensing=function(){return x.texture!==null},this.getDepthSensingMesh=function(){return x.getMesh(O)},this.getCameraTexture=function(q){return g[q]};let tt=null;function nt(q,J){if(f=J.getViewerPose(u||a),_=J,f!==null){const me=f.views;m!==null&&(e.setRenderTargetFramebuffer(L,m.framebuffer),e.setRenderTarget(L));let De=!1;me.length!==O.cameras.length&&(O.cameras.length=0,De=!0);for(let Ve=0;Ve<me.length;Ve++){const pt=me[Ve];let I=null;if(m!==null)I=m.getViewport(pt);else{const qe=p.getViewSubImage(h,pt);I=qe.viewport,Ve===0&&(e.setRenderTargetTextures(L,qe.colorTexture,qe.depthStencilTexture),e.setRenderTarget(L))}let Xe=P[Ve];Xe===void 0&&(Xe=new an,Xe.layers.enable(Ve),Xe.viewport=new St,P[Ve]=Xe),Xe.matrix.fromArray(pt.transform.matrix),Xe.matrix.decompose(Xe.position,Xe.quaternion,Xe.scale),Xe.projectionMatrix.fromArray(pt.projectionMatrix),Xe.projectionMatrixInverse.copy(Xe.projectionMatrix).invert(),Xe.viewport.set(I.x,I.y,I.width,I.height),Ve===0&&(O.matrix.copy(Xe.matrix),O.matrix.decompose(O.position,O.quaternion,O.scale)),De===!0&&O.cameras.push(Xe)}const Se=r.enabledFeatures;if(Se&&Se.includes("depth-sensing")&&r.depthUsage=="gpu-optimized"&&b){p=i.getBinding();const Ve=p.getDepthInformation(me[0]);Ve&&Ve.isValid&&Ve.texture&&x.init(Ve,r.renderState)}if(Se&&Se.includes("camera-access")&&b){e.state.unbindTexture(),p=i.getBinding();for(let Ve=0;Ve<me.length;Ve++){const pt=me[Ve].camera;if(pt){let I=g[pt];I||(I=new sf,g[pt]=I);const Xe=p.getCameraImage(pt);I.sourceTexture=Xe}}}}for(let me=0;me<R.length;me++){const De=M[me],Se=R[me];De!==null&&Se!==void 0&&Se.update(De,J,u||a)}tt&&tt(q,J),J.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:J}),_=null}const it=new df;it.setAnimationLoop(nt),this.setAnimationLoop=function(q){tt=q},this.dispose=function(){}}}const bi=new In,db=new vt;function ub(n,e){function t(x,g){x.matrixAutoUpdate===!0&&x.updateMatrix(),g.value.copy(x.matrix)}function i(x,g){g.color.getRGB(x.fogColor.value,tf(n)),g.isFog?(x.fogNear.value=g.near,x.fogFar.value=g.far):g.isFogExp2&&(x.fogDensity.value=g.density)}function r(x,g,w,T,L){g.isMeshBasicMaterial||g.isMeshLambertMaterial?o(x,g):g.isMeshToonMaterial?(o(x,g),p(x,g)):g.isMeshPhongMaterial?(o(x,g),f(x,g)):g.isMeshStandardMaterial?(o(x,g),h(x,g),g.isMeshPhysicalMaterial&&m(x,g,L)):g.isMeshMatcapMaterial?(o(x,g),_(x,g)):g.isMeshDepthMaterial?o(x,g):g.isMeshDistanceMaterial?(o(x,g),b(x,g)):g.isMeshNormalMaterial?o(x,g):g.isLineBasicMaterial?(a(x,g),g.isLineDashedMaterial&&c(x,g)):g.isPointsMaterial?d(x,g,w,T):g.isSpriteMaterial?u(x,g):g.isShadowMaterial?(x.color.value.copy(g.color),x.opacity.value=g.opacity):g.isShaderMaterial&&(g.uniformsNeedUpdate=!1)}function o(x,g){x.opacity.value=g.opacity,g.color&&x.diffuse.value.copy(g.color),g.emissive&&x.emissive.value.copy(g.emissive).multiplyScalar(g.emissiveIntensity),g.map&&(x.map.value=g.map,t(g.map,x.mapTransform)),g.alphaMap&&(x.alphaMap.value=g.alphaMap,t(g.alphaMap,x.alphaMapTransform)),g.bumpMap&&(x.bumpMap.value=g.bumpMap,t(g.bumpMap,x.bumpMapTransform),x.bumpScale.value=g.bumpScale,g.side===Xt&&(x.bumpScale.value*=-1)),g.normalMap&&(x.normalMap.value=g.normalMap,t(g.normalMap,x.normalMapTransform),x.normalScale.value.copy(g.normalScale),g.side===Xt&&x.normalScale.value.negate()),g.displacementMap&&(x.displacementMap.value=g.displacementMap,t(g.displacementMap,x.displacementMapTransform),x.displacementScale.value=g.displacementScale,x.displacementBias.value=g.displacementBias),g.emissiveMap&&(x.emissiveMap.value=g.emissiveMap,t(g.emissiveMap,x.emissiveMapTransform)),g.specularMap&&(x.specularMap.value=g.specularMap,t(g.specularMap,x.specularMapTransform)),g.alphaTest>0&&(x.alphaTest.value=g.alphaTest);const w=e.get(g),T=w.envMap,L=w.envMapRotation;T&&(x.envMap.value=T,bi.copy(L),bi.x*=-1,bi.y*=-1,bi.z*=-1,T.isCubeTexture&&T.isRenderTargetTexture===!1&&(bi.y*=-1,bi.z*=-1),x.envMapRotation.value.setFromMatrix4(db.makeRotationFromEuler(bi)),x.flipEnvMap.value=T.isCubeTexture&&T.isRenderTargetTexture===!1?-1:1,x.reflectivity.value=g.reflectivity,x.ior.value=g.ior,x.refractionRatio.value=g.refractionRatio),g.lightMap&&(x.lightMap.value=g.lightMap,x.lightMapIntensity.value=g.lightMapIntensity,t(g.lightMap,x.lightMapTransform)),g.aoMap&&(x.aoMap.value=g.aoMap,x.aoMapIntensity.value=g.aoMapIntensity,t(g.aoMap,x.aoMapTransform))}function a(x,g){x.diffuse.value.copy(g.color),x.opacity.value=g.opacity,g.map&&(x.map.value=g.map,t(g.map,x.mapTransform))}function c(x,g){x.dashSize.value=g.dashSize,x.totalSize.value=g.dashSize+g.gapSize,x.scale.value=g.scale}function d(x,g,w,T){x.diffuse.value.copy(g.color),x.opacity.value=g.opacity,x.size.value=g.size*w,x.scale.value=T*.5,g.map&&(x.map.value=g.map,t(g.map,x.uvTransform)),g.alphaMap&&(x.alphaMap.value=g.alphaMap,t(g.alphaMap,x.alphaMapTransform)),g.alphaTest>0&&(x.alphaTest.value=g.alphaTest)}function u(x,g){x.diffuse.value.copy(g.color),x.opacity.value=g.opacity,x.rotation.value=g.rotation,g.map&&(x.map.value=g.map,t(g.map,x.mapTransform)),g.alphaMap&&(x.alphaMap.value=g.alphaMap,t(g.alphaMap,x.alphaMapTransform)),g.alphaTest>0&&(x.alphaTest.value=g.alphaTest)}function f(x,g){x.specular.value.copy(g.specular),x.shininess.value=Math.max(g.shininess,1e-4)}function p(x,g){g.gradientMap&&(x.gradientMap.value=g.gradientMap)}function h(x,g){x.metalness.value=g.metalness,g.metalnessMap&&(x.metalnessMap.value=g.metalnessMap,t(g.metalnessMap,x.metalnessMapTransform)),x.roughness.value=g.roughness,g.roughnessMap&&(x.roughnessMap.value=g.roughnessMap,t(g.roughnessMap,x.roughnessMapTransform)),g.envMap&&(x.envMapIntensity.value=g.envMapIntensity)}function m(x,g,w){x.ior.value=g.ior,g.sheen>0&&(x.sheenColor.value.copy(g.sheenColor).multiplyScalar(g.sheen),x.sheenRoughness.value=g.sheenRoughness,g.sheenColorMap&&(x.sheenColorMap.value=g.sheenColorMap,t(g.sheenColorMap,x.sheenColorMapTransform)),g.sheenRoughnessMap&&(x.sheenRoughnessMap.value=g.sheenRoughnessMap,t(g.sheenRoughnessMap,x.sheenRoughnessMapTransform))),g.clearcoat>0&&(x.clearcoat.value=g.clearcoat,x.clearcoatRoughness.value=g.clearcoatRoughness,g.clearcoatMap&&(x.clearcoatMap.value=g.clearcoatMap,t(g.clearcoatMap,x.clearcoatMapTransform)),g.clearcoatRoughnessMap&&(x.clearcoatRoughnessMap.value=g.clearcoatRoughnessMap,t(g.clearcoatRoughnessMap,x.clearcoatRoughnessMapTransform)),g.clearcoatNormalMap&&(x.clearcoatNormalMap.value=g.clearcoatNormalMap,t(g.clearcoatNormalMap,x.clearcoatNormalMapTransform),x.clearcoatNormalScale.value.copy(g.clearcoatNormalScale),g.side===Xt&&x.clearcoatNormalScale.value.negate())),g.dispersion>0&&(x.dispersion.value=g.dispersion),g.iridescence>0&&(x.iridescence.value=g.iridescence,x.iridescenceIOR.value=g.iridescenceIOR,x.iridescenceThicknessMinimum.value=g.iridescenceThicknessRange[0],x.iridescenceThicknessMaximum.value=g.iridescenceThicknessRange[1],g.iridescenceMap&&(x.iridescenceMap.value=g.iridescenceMap,t(g.iridescenceMap,x.iridescenceMapTransform)),g.iridescenceThicknessMap&&(x.iridescenceThicknessMap.value=g.iridescenceThicknessMap,t(g.iridescenceThicknessMap,x.iridescenceThicknessMapTransform))),g.transmission>0&&(x.transmission.value=g.transmission,x.transmissionSamplerMap.value=w.texture,x.transmissionSamplerSize.value.set(w.width,w.height),g.transmissionMap&&(x.transmissionMap.value=g.transmissionMap,t(g.transmissionMap,x.transmissionMapTransform)),x.thickness.value=g.thickness,g.thicknessMap&&(x.thicknessMap.value=g.thicknessMap,t(g.thicknessMap,x.thicknessMapTransform)),x.attenuationDistance.value=g.attenuationDistance,x.attenuationColor.value.copy(g.attenuationColor)),g.anisotropy>0&&(x.anisotropyVector.value.set(g.anisotropy*Math.cos(g.anisotropyRotation),g.anisotropy*Math.sin(g.anisotropyRotation)),g.anisotropyMap&&(x.anisotropyMap.value=g.anisotropyMap,t(g.anisotropyMap,x.anisotropyMapTransform))),x.specularIntensity.value=g.specularIntensity,x.specularColor.value.copy(g.specularColor),g.specularColorMap&&(x.specularColorMap.value=g.specularColorMap,t(g.specularColorMap,x.specularColorMapTransform)),g.specularIntensityMap&&(x.specularIntensityMap.value=g.specularIntensityMap,t(g.specularIntensityMap,x.specularIntensityMapTransform))}function _(x,g){g.matcap&&(x.matcap.value=g.matcap)}function b(x,g){const w=e.get(g).light;x.referencePosition.value.setFromMatrixPosition(w.matrixWorld),x.nearDistance.value=w.shadow.camera.near,x.farDistance.value=w.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function fb(n,e,t,i){let r={},o={},a=[];const c=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function d(w,T){const L=T.program;i.uniformBlockBinding(w,L)}function u(w,T){let L=r[w.id];L===void 0&&(_(w),L=f(w),r[w.id]=L,w.addEventListener("dispose",x));const R=T.program;i.updateUBOMapping(w,R);const M=e.render.frame;o[w.id]!==M&&(h(w),o[w.id]=M)}function f(w){const T=p();w.__bindingPointIndex=T;const L=n.createBuffer(),R=w.__size,M=w.usage;return n.bindBuffer(n.UNIFORM_BUFFER,L),n.bufferData(n.UNIFORM_BUFFER,R,M),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,T,L),L}function p(){for(let w=0;w<c;w++)if(a.indexOf(w)===-1)return a.push(w),w;return Mt("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function h(w){const T=r[w.id],L=w.uniforms,R=w.__cache;n.bindBuffer(n.UNIFORM_BUFFER,T);for(let M=0,A=L.length;M<A;M++){const F=Array.isArray(L[M])?L[M]:[L[M]];for(let E=0,S=F.length;E<S;E++){const P=F[E];if(m(P,M,E,R)===!0){const O=P.__offset,B=Array.isArray(P.value)?P.value:[P.value];let W=0;for(let V=0;V<B.length;V++){const X=B[V],Q=b(X);typeof X=="number"||typeof X=="boolean"?(P.__data[0]=X,n.bufferSubData(n.UNIFORM_BUFFER,O+W,P.__data)):X.isMatrix3?(P.__data[0]=X.elements[0],P.__data[1]=X.elements[1],P.__data[2]=X.elements[2],P.__data[3]=0,P.__data[4]=X.elements[3],P.__data[5]=X.elements[4],P.__data[6]=X.elements[5],P.__data[7]=0,P.__data[8]=X.elements[6],P.__data[9]=X.elements[7],P.__data[10]=X.elements[8],P.__data[11]=0):(X.toArray(P.__data,W),W+=Q.storage/Float32Array.BYTES_PER_ELEMENT)}n.bufferSubData(n.UNIFORM_BUFFER,O,P.__data)}}}n.bindBuffer(n.UNIFORM_BUFFER,null)}function m(w,T,L,R){const M=w.value,A=T+"_"+L;if(R[A]===void 0)return typeof M=="number"||typeof M=="boolean"?R[A]=M:R[A]=M.clone(),!0;{const F=R[A];if(typeof M=="number"||typeof M=="boolean"){if(F!==M)return R[A]=M,!0}else if(F.equals(M)===!1)return F.copy(M),!0}return!1}function _(w){const T=w.uniforms;let L=0;const R=16;for(let A=0,F=T.length;A<F;A++){const E=Array.isArray(T[A])?T[A]:[T[A]];for(let S=0,P=E.length;S<P;S++){const O=E[S],B=Array.isArray(O.value)?O.value:[O.value];for(let W=0,V=B.length;W<V;W++){const X=B[W],Q=b(X),$=L%R,ie=$%Q.boundary,ne=$+ie;L+=ie,ne!==0&&R-ne<Q.storage&&(L+=R-ne),O.__data=new Float32Array(Q.storage/Float32Array.BYTES_PER_ELEMENT),O.__offset=L,L+=Q.storage}}}const M=L%R;return M>0&&(L+=R-M),w.__size=L,w.__cache={},this}function b(w){const T={boundary:0,storage:0};return typeof w=="number"||typeof w=="boolean"?(T.boundary=4,T.storage=4):w.isVector2?(T.boundary=8,T.storage=8):w.isVector3||w.isColor?(T.boundary=16,T.storage=12):w.isVector4?(T.boundary=16,T.storage=16):w.isMatrix3?(T.boundary=48,T.storage=48):w.isMatrix4?(T.boundary=64,T.storage=64):w.isTexture?Fe("WebGLRenderer: Texture samplers can not be part of an uniforms group."):Fe("WebGLRenderer: Unsupported uniform value type.",w),T}function x(w){const T=w.target;T.removeEventListener("dispose",x);const L=a.indexOf(T.__bindingPointIndex);a.splice(L,1),n.deleteBuffer(r[T.id]),delete r[T.id],delete o[T.id]}function g(){for(const w in r)n.deleteBuffer(r[w]);a=[],r={},o={}}return{bind:d,update:u,dispose:g}}const hb=new Uint16Array([11481,15204,11534,15171,11808,15015,12385,14843,12894,14716,13396,14600,13693,14483,13976,14366,14237,14171,14405,13961,14511,13770,14605,13598,14687,13444,14760,13305,14822,13066,14876,12857,14923,12675,14963,12517,14997,12379,15025,12230,15049,12023,15070,11843,15086,11687,15100,11551,15111,11433,15120,11330,15127,11217,15132,11060,15135,10922,15138,10801,15139,10695,15139,10600,13012,14923,13020,14917,13064,14886,13176,14800,13349,14666,13513,14526,13724,14398,13960,14230,14200,14020,14383,13827,14488,13651,14583,13491,14667,13348,14740,13132,14803,12908,14856,12713,14901,12542,14938,12394,14968,12241,14992,12017,15010,11822,15024,11654,15034,11507,15041,11380,15044,11269,15044,11081,15042,10913,15037,10764,15031,10635,15023,10520,15014,10419,15003,10330,13657,14676,13658,14673,13670,14660,13698,14622,13750,14547,13834,14442,13956,14317,14112,14093,14291,13889,14407,13704,14499,13538,14586,13389,14664,13201,14733,12966,14792,12758,14842,12577,14882,12418,14915,12272,14940,12033,14959,11826,14972,11646,14980,11490,14983,11355,14983,11212,14979,11008,14971,10830,14961,10675,14950,10540,14936,10420,14923,10315,14909,10204,14894,10041,14089,14460,14090,14459,14096,14452,14112,14431,14141,14388,14186,14305,14252,14130,14341,13941,14399,13756,14467,13585,14539,13430,14610,13272,14677,13026,14737,12808,14790,12617,14833,12449,14869,12303,14896,12065,14916,11845,14929,11655,14937,11490,14939,11347,14936,11184,14930,10970,14921,10783,14912,10621,14900,10480,14885,10356,14867,10247,14848,10062,14827,9894,14805,9745,14400,14208,14400,14206,14402,14198,14406,14174,14415,14122,14427,14035,14444,13913,14469,13767,14504,13613,14548,13463,14598,13324,14651,13082,14704,12858,14752,12658,14795,12483,14831,12330,14860,12106,14881,11875,14895,11675,14903,11501,14905,11351,14903,11178,14900,10953,14892,10757,14880,10589,14865,10442,14847,10313,14827,10162,14805,9965,14782,9792,14757,9642,14731,9507,14562,13883,14562,13883,14563,13877,14566,13862,14570,13830,14576,13773,14584,13689,14595,13582,14613,13461,14637,13336,14668,13120,14704,12897,14741,12695,14776,12516,14808,12358,14835,12150,14856,11910,14870,11701,14878,11519,14882,11361,14884,11187,14880,10951,14871,10748,14858,10572,14842,10418,14823,10286,14801,10099,14777,9897,14751,9722,14725,9567,14696,9430,14666,9309,14702,13604,14702,13604,14702,13600,14703,13591,14705,13570,14707,13533,14709,13477,14712,13400,14718,13305,14727,13106,14743,12907,14762,12716,14784,12539,14807,12380,14827,12190,14844,11943,14855,11727,14863,11539,14870,11376,14871,11204,14868,10960,14858,10748,14845,10565,14829,10406,14809,10269,14786,10058,14761,9852,14734,9671,14705,9512,14674,9374,14641,9253,14608,9076,14821,13366,14821,13365,14821,13364,14821,13358,14821,13344,14821,13320,14819,13252,14817,13145,14815,13011,14814,12858,14817,12698,14823,12539,14832,12389,14841,12214,14850,11968,14856,11750,14861,11558,14866,11390,14867,11226,14862,10972,14853,10754,14840,10565,14823,10401,14803,10259,14780,10032,14754,9820,14725,9635,14694,9473,14661,9333,14627,9203,14593,8988,14557,8798,14923,13014,14922,13014,14922,13012,14922,13004,14920,12987,14919,12957,14915,12907,14909,12834,14902,12738,14894,12623,14888,12498,14883,12370,14880,12203,14878,11970,14875,11759,14873,11569,14874,11401,14872,11243,14865,10986,14855,10762,14842,10568,14825,10401,14804,10255,14781,10017,14754,9799,14725,9611,14692,9445,14658,9301,14623,9139,14587,8920,14548,8729,14509,8562,15008,12672,15008,12672,15008,12671,15007,12667,15005,12656,15001,12637,14997,12605,14989,12556,14978,12490,14966,12407,14953,12313,14940,12136,14927,11934,14914,11742,14903,11563,14896,11401,14889,11247,14879,10992,14866,10767,14851,10570,14833,10400,14812,10252,14789,10007,14761,9784,14731,9592,14698,9424,14663,9279,14627,9088,14588,8868,14548,8676,14508,8508,14467,8360,15080,12386,15080,12386,15079,12385,15078,12383,15076,12378,15072,12367,15066,12347,15057,12315,15045,12253,15030,12138,15012,11998,14993,11845,14972,11685,14951,11530,14935,11383,14920,11228,14904,10981,14887,10762,14870,10567,14850,10397,14827,10248,14803,9997,14774,9771,14743,9578,14710,9407,14674,9259,14637,9048,14596,8826,14555,8632,14514,8464,14471,8317,14427,8182,15139,12008,15139,12008,15138,12008,15137,12007,15135,12003,15130,11990,15124,11969,15115,11929,15102,11872,15086,11794,15064,11693,15041,11581,15013,11459,14987,11336,14966,11170,14944,10944,14921,10738,14898,10552,14875,10387,14850,10239,14824,9983,14794,9758,14762,9563,14728,9392,14692,9244,14653,9014,14611,8791,14569,8597,14526,8427,14481,8281,14436,8110,14391,7885,15188,11617,15188,11617,15187,11617,15186,11618,15183,11617,15179,11612,15173,11601,15163,11581,15150,11546,15133,11495,15110,11427,15083,11346,15051,11246,15024,11057,14996,10868,14967,10687,14938,10517,14911,10362,14882,10206,14853,9956,14821,9737,14787,9543,14752,9375,14715,9228,14675,8980,14632,8760,14589,8565,14544,8395,14498,8248,14451,8049,14404,7824,14357,7630,15228,11298,15228,11298,15227,11299,15226,11301,15223,11303,15219,11302,15213,11299,15204,11290,15191,11271,15174,11217,15150,11129,15119,11015,15087,10886,15057,10744,15024,10599,14990,10455,14957,10318,14924,10143,14891,9911,14856,9701,14820,9516,14782,9352,14744,9200,14703,8946,14659,8725,14615,8533,14568,8366,14521,8220,14472,7992,14423,7770,14374,7578,14315,7408,15260,10819,15260,10819,15259,10822,15258,10826,15256,10832,15251,10836,15246,10841,15237,10838,15225,10821,15207,10788,15183,10734,15151,10660,15120,10571,15087,10469,15049,10359,15012,10249,14974,10041,14937,9837,14900,9647,14860,9475,14820,9320,14779,9147,14736,8902,14691,8688,14646,8499,14598,8335,14549,8189,14499,7940,14448,7720,14397,7529,14347,7363,14256,7218,15285,10410,15285,10411,15285,10413,15284,10418,15282,10425,15278,10434,15272,10442,15264,10449,15252,10445,15235,10433,15210,10403,15179,10358,15149,10301,15113,10218,15073,10059,15033,9894,14991,9726,14951,9565,14909,9413,14865,9273,14822,9073,14777,8845,14730,8641,14682,8459,14633,8300,14583,8129,14531,7883,14479,7670,14426,7482,14373,7321,14305,7176,14201,6939,15305,9939,15305,9940,15305,9945,15304,9955,15302,9967,15298,9989,15293,10010,15286,10033,15274,10044,15258,10045,15233,10022,15205,9975,15174,9903,15136,9808,15095,9697,15053,9578,15009,9451,14965,9327,14918,9198,14871,8973,14825,8766,14775,8579,14725,8408,14675,8259,14622,8058,14569,7821,14515,7615,14460,7435,14405,7276,14350,7108,14256,6866,14149,6653,15321,9444,15321,9445,15321,9448,15320,9458,15317,9470,15314,9490,15310,9515,15302,9540,15292,9562,15276,9579,15251,9577,15226,9559,15195,9519,15156,9463,15116,9389,15071,9304,15025,9208,14978,9023,14927,8838,14878,8661,14827,8496,14774,8344,14722,8206,14667,7973,14612,7749,14556,7555,14499,7382,14443,7229,14385,7025,14322,6791,14210,6588,14100,6409,15333,8920,15333,8921,15332,8927,15332,8943,15329,8965,15326,9002,15322,9048,15316,9106,15307,9162,15291,9204,15267,9221,15244,9221,15212,9196,15175,9134,15133,9043,15088,8930,15040,8801,14990,8665,14938,8526,14886,8391,14830,8261,14775,8087,14719,7866,14661,7664,14603,7482,14544,7322,14485,7178,14426,6936,14367,6713,14281,6517,14166,6348,14054,6198,15341,8360,15341,8361,15341,8366,15341,8379,15339,8399,15336,8431,15332,8473,15326,8527,15318,8585,15302,8632,15281,8670,15258,8690,15227,8690,15191,8664,15149,8612,15104,8543,15055,8456,15001,8360,14948,8259,14892,8122,14834,7923,14776,7734,14716,7558,14656,7397,14595,7250,14534,7070,14472,6835,14410,6628,14350,6443,14243,6283,14125,6135,14010,5889,15348,7715,15348,7717,15348,7725,15347,7745,15345,7780,15343,7836,15339,7905,15334,8e3,15326,8103,15310,8193,15293,8239,15270,8270,15240,8287,15204,8283,15163,8260,15118,8223,15067,8143,15014,8014,14958,7873,14899,7723,14839,7573,14778,7430,14715,7293,14652,7164,14588,6931,14524,6720,14460,6531,14396,6362,14330,6210,14207,6015,14086,5781,13969,5576,15352,7114,15352,7116,15352,7128,15352,7159,15350,7195,15348,7237,15345,7299,15340,7374,15332,7457,15317,7544,15301,7633,15280,7703,15251,7754,15216,7775,15176,7767,15131,7733,15079,7670,15026,7588,14967,7492,14906,7387,14844,7278,14779,7171,14714,6965,14648,6770,14581,6587,14515,6420,14448,6269,14382,6123,14299,5881,14172,5665,14049,5477,13929,5310,15355,6329,15355,6330,15355,6339,15355,6362,15353,6410,15351,6472,15349,6572,15344,6688,15337,6835,15323,6985,15309,7142,15287,7220,15260,7277,15226,7310,15188,7326,15142,7318,15090,7285,15036,7239,14976,7177,14914,7045,14849,6892,14782,6736,14714,6581,14645,6433,14576,6293,14506,6164,14438,5946,14369,5733,14270,5540,14140,5369,14014,5216,13892,5043,15357,5483,15357,5484,15357,5496,15357,5528,15356,5597,15354,5692,15351,5835,15347,6011,15339,6195,15328,6317,15314,6446,15293,6566,15268,6668,15235,6746,15197,6796,15152,6811,15101,6790,15046,6748,14985,6673,14921,6583,14854,6479,14785,6371,14714,6259,14643,6149,14571,5946,14499,5750,14428,5567,14358,5401,14242,5250,14109,5111,13980,4870,13856,4657,15359,4555,15359,4557,15358,4573,15358,4633,15357,4715,15355,4841,15353,5061,15349,5216,15342,5391,15331,5577,15318,5770,15299,5967,15274,6150,15243,6223,15206,6280,15161,6310,15111,6317,15055,6300,14994,6262,14928,6208,14860,6141,14788,5994,14715,5838,14641,5684,14566,5529,14492,5384,14418,5247,14346,5121,14216,4892,14079,4682,13948,4496,13822,4330,15359,3498,15359,3501,15359,3520,15359,3598,15358,3719,15356,3860,15355,4137,15351,4305,15344,4563,15334,4809,15321,5116,15303,5273,15280,5418,15250,5547,15214,5653,15170,5722,15120,5761,15064,5763,15002,5733,14935,5673,14865,5597,14792,5504,14716,5400,14640,5294,14563,5185,14486,5041,14410,4841,14335,4655,14191,4482,14051,4325,13918,4183,13790,4012,15360,2282,15360,2285,15360,2306,15360,2401,15359,2547,15357,2748,15355,3103,15352,3349,15345,3675,15336,4020,15324,4272,15307,4496,15285,4716,15255,4908,15220,5086,15178,5170,15128,5214,15072,5234,15010,5231,14943,5206,14871,5166,14796,5102,14718,4971,14639,4833,14559,4687,14480,4541,14402,4401,14315,4268,14167,4142,14025,3958,13888,3747,13759,3556,15360,923,15360,925,15360,946,15360,1052,15359,1214,15357,1494,15356,1892,15352,2274,15346,2663,15338,3099,15326,3393,15309,3679,15288,3980,15260,4183,15226,4325,15185,4437,15136,4517,15080,4570,15018,4591,14950,4581,14877,4545,14800,4485,14720,4411,14638,4325,14556,4231,14475,4136,14395,3988,14297,3803,14145,3628,13999,3465,13861,3314,13729,3177,15360,263,15360,264,15360,272,15360,325,15359,407,15358,548,15356,780,15352,1144,15347,1580,15339,2099,15328,2425,15312,2795,15292,3133,15264,3329,15232,3517,15191,3689,15143,3819,15088,3923,15025,3978,14956,3999,14882,3979,14804,3931,14722,3855,14639,3756,14554,3645,14470,3529,14388,3409,14279,3289,14124,3173,13975,3055,13834,2848,13701,2658,15360,49,15360,49,15360,52,15360,75,15359,111,15358,201,15356,283,15353,519,15348,726,15340,1045,15329,1415,15314,1795,15295,2173,15269,2410,15237,2649,15197,2866,15150,3054,15095,3140,15032,3196,14963,3228,14888,3236,14808,3224,14725,3191,14639,3146,14553,3088,14466,2976,14382,2836,14262,2692,14103,2549,13952,2409,13808,2278,13674,2154,15360,4,15360,4,15360,4,15360,13,15359,33,15358,59,15357,112,15353,199,15348,302,15341,456,15331,628,15316,827,15297,1082,15272,1332,15241,1601,15202,1851,15156,2069,15101,2172,15039,2256,14970,2314,14894,2348,14813,2358,14728,2344,14640,2311,14551,2263,14463,2203,14376,2133,14247,2059,14084,1915,13930,1761,13784,1609,13648,1464,15360,0,15360,0,15360,0,15360,3,15359,18,15358,26,15357,53,15354,80,15348,97,15341,165,15332,238,15318,326,15299,427,15275,529,15245,654,15207,771,15161,885,15108,994,15046,1089,14976,1170,14900,1229,14817,1266,14731,1284,14641,1282,14550,1260,14460,1223,14370,1174,14232,1116,14066,1050,13909,981,13761,910,13623,839]);let Gn=null;function pb(){return Gn===null&&(Gn=new gm(hb,32,32,il,Er),Gn.minFilter=ln,Gn.magFilter=ln,Gn.wrapS=Hn,Gn.wrapT=Hn,Gn.generateMipmaps=!1,Gn.needsUpdate=!0),Gn}class mb{constructor(e={}){const{canvas:t=zp(),context:i=null,depth:r=!0,stencil:o=!1,alpha:a=!1,antialias:c=!1,premultipliedAlpha:d=!0,preserveDrawingBuffer:u=!1,powerPreference:f="default",failIfMajorPerformanceCaveat:p=!1,reversedDepthBuffer:h=!1}=e;this.isWebGLRenderer=!0;let m;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");m=i.getContextAttributes().alpha}else m=a;const _=new Set([ol,rl,nl]),b=new Set([Pn,Ai,no,io,el,tl]),x=new Uint32Array(4),g=new Int32Array(4);let w=null,T=null;const L=[],R=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=oi,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const M=this;let A=!1;this._outputColorSpace=sn;let F=0,E=0,S=null,P=-1,O=null;const B=new St,W=new St;let V=null;const X=new ze(0);let Q=0,$=t.width,ie=t.height,ne=1,xe=null,je=null;const tt=new St(0,0,$,ie),nt=new St(0,0,$,ie);let it=!1;const q=new ll;let J=!1,me=!1;const De=new vt,Se=new k,$e=new St,It={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let Ve=!1;function pt(){return S===null?ne:1}let I=i;function Xe(v,N){return t.getContext(v,N)}try{const v={alpha:!0,depth:r,stencil:o,antialias:c,premultipliedAlpha:d,preserveDrawingBuffer:u,powerPreference:f,failIfMajorPerformanceCaveat:p};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${Zc}`),t.addEventListener("webglcontextlost",te,!1),t.addEventListener("webglcontextrestored",K,!1),t.addEventListener("webglcontextcreationerror",_e,!1),I===null){const N="webgl2";if(I=Xe(N,v),I===null)throw Xe(N)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(v){throw v("WebGLRenderer: "+v.message),v}let qe,lt,ye,gt,Te,Oe,C,y,G,Y,Z,j,Ee,le,Ce,ve,ee,oe,Re,Ae,he,Ie,D,de;function se(){qe=new Ex(I),qe.init(),Ie=new ob(I,qe),lt=new px(I,qe,e,Ie),ye=new ib(I,qe),lt.reversedDepthBuffer&&h&&ye.buffers.depth.setReversed(!0),gt=new Cx(I),Te=new W_,Oe=new rb(I,qe,ye,Te,lt,Ie,gt),C=new gx(M),y=new vx(M),G=new Rm(I),D=new fx(I,G),Y=new Mx(I,G,gt,D),Z=new Ax(I,Y,G,gt),Re=new wx(I,lt,Oe),ve=new mx(Te),j=new V_(M,C,y,qe,lt,D,ve),Ee=new ub(M,Te),le=new $_,Ce=new Z_(qe),oe=new ux(M,C,y,ye,Z,m,d),ee=new tb(M,Z,lt),de=new fb(I,gt,lt,ye),Ae=new hx(I,qe,gt),he=new Tx(I,qe,gt),gt.programs=j.programs,M.capabilities=lt,M.extensions=qe,M.properties=Te,M.renderLists=le,M.shadowMap=ee,M.state=ye,M.info=gt}se();const ae=new lb(M,I);this.xr=ae,this.getContext=function(){return I},this.getContextAttributes=function(){return I.getContextAttributes()},this.forceContextLoss=function(){const v=qe.get("WEBGL_lose_context");v&&v.loseContext()},this.forceContextRestore=function(){const v=qe.get("WEBGL_lose_context");v&&v.restoreContext()},this.getPixelRatio=function(){return ne},this.setPixelRatio=function(v){v!==void 0&&(ne=v,this.setSize($,ie,!1))},this.getSize=function(v){return v.set($,ie)},this.setSize=function(v,N,z=!0){if(ae.isPresenting){Fe("WebGLRenderer: Can't change size while VR device is presenting.");return}$=v,ie=N,t.width=Math.floor(v*ne),t.height=Math.floor(N*ne),z===!0&&(t.style.width=v+"px",t.style.height=N+"px"),this.setViewport(0,0,v,N)},this.getDrawingBufferSize=function(v){return v.set($*ne,ie*ne).floor()},this.setDrawingBufferSize=function(v,N,z){$=v,ie=N,ne=z,t.width=Math.floor(v*z),t.height=Math.floor(N*z),this.setViewport(0,0,v,N)},this.getCurrentViewport=function(v){return v.copy(B)},this.getViewport=function(v){return v.copy(tt)},this.setViewport=function(v,N,z,H){v.isVector4?tt.set(v.x,v.y,v.z,v.w):tt.set(v,N,z,H),ye.viewport(B.copy(tt).multiplyScalar(ne).round())},this.getScissor=function(v){return v.copy(nt)},this.setScissor=function(v,N,z,H){v.isVector4?nt.set(v.x,v.y,v.z,v.w):nt.set(v,N,z,H),ye.scissor(W.copy(nt).multiplyScalar(ne).round())},this.getScissorTest=function(){return it},this.setScissorTest=function(v){ye.setScissorTest(it=v)},this.setOpaqueSort=function(v){xe=v},this.setTransparentSort=function(v){je=v},this.getClearColor=function(v){return v.copy(oe.getClearColor())},this.setClearColor=function(){oe.setClearColor(...arguments)},this.getClearAlpha=function(){return oe.getClearAlpha()},this.setClearAlpha=function(){oe.setClearAlpha(...arguments)},this.clear=function(v=!0,N=!0,z=!0){let H=0;if(v){let U=!1;if(S!==null){const re=S.texture.format;U=_.has(re)}if(U){const re=S.texture.type,ue=b.has(re),be=oe.getClearColor(),ge=oe.getClearAlpha(),Le=be.r,Pe=be.g,Me=be.b;ue?(x[0]=Le,x[1]=Pe,x[2]=Me,x[3]=ge,I.clearBufferuiv(I.COLOR,0,x)):(g[0]=Le,g[1]=Pe,g[2]=Me,g[3]=ge,I.clearBufferiv(I.COLOR,0,g))}else H|=I.COLOR_BUFFER_BIT}N&&(H|=I.DEPTH_BUFFER_BIT),z&&(H|=I.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),I.clear(H)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",te,!1),t.removeEventListener("webglcontextrestored",K,!1),t.removeEventListener("webglcontextcreationerror",_e,!1),oe.dispose(),le.dispose(),Ce.dispose(),Te.dispose(),C.dispose(),y.dispose(),Z.dispose(),D.dispose(),de.dispose(),j.dispose(),ae.dispose(),ae.removeEventListener("sessionstart",Gl),ae.removeEventListener("sessionend",kl),fi.stop()};function te(v){v.preventDefault(),td("WebGLRenderer: Context Lost."),A=!0}function K(){td("WebGLRenderer: Context Restored."),A=!1;const v=gt.autoReset,N=ee.enabled,z=ee.autoUpdate,H=ee.needsUpdate,U=ee.type;se(),gt.autoReset=v,ee.enabled=N,ee.autoUpdate=z,ee.needsUpdate=H,ee.type=U}function _e(v){Mt("WebGLRenderer: A WebGL context could not be created. Reason: ",v.statusMessage)}function Ne(v){const N=v.target;N.removeEventListener("dispose",Ne),ft(N)}function ft(v){rt(v),Te.remove(v)}function rt(v){const N=Te.get(v).programs;N!==void 0&&(N.forEach(function(z){j.releaseProgram(z)}),v.isShaderMaterial&&j.releaseShaderCache(v))}this.renderBufferDirect=function(v,N,z,H,U,re){N===null&&(N=It);const ue=U.isMesh&&U.matrixWorld.determinant()<0,be=Bh(v,N,z,H,U);ye.setMaterial(H,ue);let ge=z.index,Le=1;if(H.wireframe===!0){if(ge=Y.getWireframeAttribute(z),ge===void 0)return;Le=2}const Pe=z.drawRange,Me=z.attributes.position;let Ye=Pe.start*Le,ot=(Pe.start+Pe.count)*Le;re!==null&&(Ye=Math.max(Ye,re.start*Le),ot=Math.min(ot,(re.start+re.count)*Le)),ge!==null?(Ye=Math.max(Ye,0),ot=Math.min(ot,ge.count)):Me!=null&&(Ye=Math.max(Ye,0),ot=Math.min(ot,Me.count));const bt=ot-Ye;if(bt<0||bt===1/0)return;D.setup(U,H,be,z,ge);let yt,ct=Ae;if(ge!==null&&(yt=G.get(ge),ct=he,ct.setIndex(yt)),U.isMesh)H.wireframe===!0?(ye.setLineWidth(H.wireframeLinewidth*pt()),ct.setMode(I.LINES)):ct.setMode(I.TRIANGLES);else if(U.isLine){let we=H.linewidth;we===void 0&&(we=1),ye.setLineWidth(we*pt()),U.isLineSegments?ct.setMode(I.LINES):U.isLineLoop?ct.setMode(I.LINE_LOOP):ct.setMode(I.LINE_STRIP)}else U.isPoints?ct.setMode(I.POINTS):U.isSprite&&ct.setMode(I.TRIANGLES);if(U.isBatchedMesh)if(U._multiDrawInstances!==null)so("WebGLRenderer: renderMultiDrawInstances has been deprecated and will be removed in r184. Append to renderMultiDraw arguments and use indirection."),ct.renderMultiDrawInstances(U._multiDrawStarts,U._multiDrawCounts,U._multiDrawCount,U._multiDrawInstances);else if(qe.get("WEBGL_multi_draw"))ct.renderMultiDraw(U._multiDrawStarts,U._multiDrawCounts,U._multiDrawCount);else{const we=U._multiDrawStarts,xt=U._multiDrawCounts,Ze=U._multiDrawCount,Kt=ge?G.get(ge).bytesPerElement:1,ki=Te.get(H).currentProgram.getUniforms();for(let Jt=0;Jt<Ze;Jt++)ki.setValue(I,"_gl_DrawID",Jt),ct.render(we[Jt]/Kt,xt[Jt])}else if(U.isInstancedMesh)ct.renderInstances(Ye,bt,U.count);else if(z.isInstancedBufferGeometry){const we=z._maxInstanceCount!==void 0?z._maxInstanceCount:1/0,xt=Math.min(z.instanceCount,we);ct.renderInstances(Ye,bt,xt)}else ct.render(Ye,bt)};function vn(v,N,z){v.transparent===!0&&v.side===Tn&&v.forceSinglePass===!1?(v.side=Xt,v.needsUpdate=!0,So(v,N,z),v.side=ai,v.needsUpdate=!0,So(v,N,z),v.side=Tn):So(v,N,z)}this.compile=function(v,N,z=null){z===null&&(z=v),T=Ce.get(z),T.init(N),R.push(T),z.traverseVisible(function(U){U.isLight&&U.layers.test(N.layers)&&(T.pushLight(U),U.castShadow&&T.pushShadow(U))}),v!==z&&v.traverseVisible(function(U){U.isLight&&U.layers.test(N.layers)&&(T.pushLight(U),U.castShadow&&T.pushShadow(U))}),T.setupLights();const H=new Set;return v.traverse(function(U){if(!(U.isMesh||U.isPoints||U.isLine||U.isSprite))return;const re=U.material;if(re)if(Array.isArray(re))for(let ue=0;ue<re.length;ue++){const be=re[ue];vn(be,z,U),H.add(be)}else vn(re,z,U),H.add(re)}),T=R.pop(),H},this.compileAsync=function(v,N,z=null){const H=this.compile(v,N,z);return new Promise(U=>{function re(){if(H.forEach(function(ue){Te.get(ue).currentProgram.isReady()&&H.delete(ue)}),H.size===0){U(v);return}setTimeout(re,10)}qe.get("KHR_parallel_shader_compile")!==null?re():setTimeout(re,10)})};let fn=null;function Oh(v){fn&&fn(v)}function Gl(){fi.stop()}function kl(){fi.start()}const fi=new df;fi.setAnimationLoop(Oh),typeof self<"u"&&fi.setContext(self),this.setAnimationLoop=function(v){fn=v,ae.setAnimationLoop(v),v===null?fi.stop():fi.start()},ae.addEventListener("sessionstart",Gl),ae.addEventListener("sessionend",kl),this.render=function(v,N){if(N!==void 0&&N.isCamera!==!0){Mt("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(A===!0)return;if(v.matrixWorldAutoUpdate===!0&&v.updateMatrixWorld(),N.parent===null&&N.matrixWorldAutoUpdate===!0&&N.updateMatrixWorld(),ae.enabled===!0&&ae.isPresenting===!0&&(ae.cameraAutoUpdate===!0&&ae.updateCamera(N),N=ae.getCamera()),v.isScene===!0&&v.onBeforeRender(M,v,N,S),T=Ce.get(v,R.length),T.init(N),R.push(T),De.multiplyMatrices(N.projectionMatrix,N.matrixWorldInverse),q.setFromProjectionMatrix(De,wn,N.reversedDepth),me=this.localClippingEnabled,J=ve.init(this.clippingPlanes,me),w=le.get(v,L.length),w.init(),L.push(w),ae.enabled===!0&&ae.isPresenting===!0){const re=M.xr.getDepthSensingMesh();re!==null&&Ys(re,N,-1/0,M.sortObjects)}Ys(v,N,0,M.sortObjects),w.finish(),M.sortObjects===!0&&w.sort(xe,je),Ve=ae.enabled===!1||ae.isPresenting===!1||ae.hasDepthSensing()===!1,Ve&&oe.addToRenderList(w,v),this.info.render.frame++,J===!0&&ve.beginShadows();const z=T.state.shadowsArray;ee.render(z,v,N),J===!0&&ve.endShadows(),this.info.autoReset===!0&&this.info.reset();const H=w.opaque,U=w.transmissive;if(T.setupLights(),N.isArrayCamera){const re=N.cameras;if(U.length>0)for(let ue=0,be=re.length;ue<be;ue++){const ge=re[ue];Hl(H,U,v,ge)}Ve&&oe.render(v);for(let ue=0,be=re.length;ue<be;ue++){const ge=re[ue];zl(w,v,ge,ge.viewport)}}else U.length>0&&Hl(H,U,v,N),Ve&&oe.render(v),zl(w,v,N);S!==null&&E===0&&(Oe.updateMultisampleRenderTarget(S),Oe.updateRenderTargetMipmap(S)),v.isScene===!0&&v.onAfterRender(M,v,N),D.resetDefaultState(),P=-1,O=null,R.pop(),R.length>0?(T=R[R.length-1],J===!0&&ve.setGlobalState(M.clippingPlanes,T.state.camera)):T=null,L.pop(),L.length>0?w=L[L.length-1]:w=null};function Ys(v,N,z,H){if(v.visible===!1)return;if(v.layers.test(N.layers)){if(v.isGroup)z=v.renderOrder;else if(v.isLOD)v.autoUpdate===!0&&v.update(N);else if(v.isLight)T.pushLight(v),v.castShadow&&T.pushShadow(v);else if(v.isSprite){if(!v.frustumCulled||q.intersectsSprite(v)){H&&$e.setFromMatrixPosition(v.matrixWorld).applyMatrix4(De);const ue=Z.update(v),be=v.material;be.visible&&w.push(v,ue,be,z,$e.z,null)}}else if((v.isMesh||v.isLine||v.isPoints)&&(!v.frustumCulled||q.intersectsObject(v))){const ue=Z.update(v),be=v.material;if(H&&(v.boundingSphere!==void 0?(v.boundingSphere===null&&v.computeBoundingSphere(),$e.copy(v.boundingSphere.center)):(ue.boundingSphere===null&&ue.computeBoundingSphere(),$e.copy(ue.boundingSphere.center)),$e.applyMatrix4(v.matrixWorld).applyMatrix4(De)),Array.isArray(be)){const ge=ue.groups;for(let Le=0,Pe=ge.length;Le<Pe;Le++){const Me=ge[Le],Ye=be[Me.materialIndex];Ye&&Ye.visible&&w.push(v,ue,Ye,z,$e.z,Me)}}else be.visible&&w.push(v,ue,be,z,$e.z,null)}}const re=v.children;for(let ue=0,be=re.length;ue<be;ue++)Ys(re[ue],N,z,H)}function zl(v,N,z,H){const{opaque:U,transmissive:re,transparent:ue}=v;T.setupLightsView(z),J===!0&&ve.setGlobalState(M.clippingPlanes,z),H&&ye.viewport(B.copy(H)),U.length>0&&yo(U,N,z),re.length>0&&yo(re,N,z),ue.length>0&&yo(ue,N,z),ye.buffers.depth.setTest(!0),ye.buffers.depth.setMask(!0),ye.buffers.color.setMask(!0),ye.setPolygonOffset(!1)}function Hl(v,N,z,H){if((z.isScene===!0?z.overrideMaterial:null)!==null)return;T.state.transmissionRenderTarget[H.id]===void 0&&(T.state.transmissionRenderTarget[H.id]=new Ri(1,1,{generateMipmaps:!0,type:qe.has("EXT_color_buffer_half_float")||qe.has("EXT_color_buffer_float")?Er:Pn,minFilter:Ei,samples:4,stencilBuffer:o,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Qe.workingColorSpace}));const re=T.state.transmissionRenderTarget[H.id],ue=H.viewport||B;re.setSize(ue.z*M.transmissionResolutionScale,ue.w*M.transmissionResolutionScale);const be=M.getRenderTarget(),ge=M.getActiveCubeFace(),Le=M.getActiveMipmapLevel();M.setRenderTarget(re),M.getClearColor(X),Q=M.getClearAlpha(),Q<1&&M.setClearColor(16777215,.5),M.clear(),Ve&&oe.render(z);const Pe=M.toneMapping;M.toneMapping=oi;const Me=H.viewport;if(H.viewport!==void 0&&(H.viewport=void 0),T.setupLightsView(H),J===!0&&ve.setGlobalState(M.clippingPlanes,H),yo(v,z,H),Oe.updateMultisampleRenderTarget(re),Oe.updateRenderTargetMipmap(re),qe.has("WEBGL_multisampled_render_to_texture")===!1){let Ye=!1;for(let ot=0,bt=N.length;ot<bt;ot++){const yt=N[ot],{object:ct,geometry:we,material:xt,group:Ze}=yt;if(xt.side===Tn&&ct.layers.test(H.layers)){const Kt=xt.side;xt.side=Xt,xt.needsUpdate=!0,Vl(ct,z,H,we,xt,Ze),xt.side=Kt,xt.needsUpdate=!0,Ye=!0}}Ye===!0&&(Oe.updateMultisampleRenderTarget(re),Oe.updateRenderTargetMipmap(re))}M.setRenderTarget(be,ge,Le),M.setClearColor(X,Q),Me!==void 0&&(H.viewport=Me),M.toneMapping=Pe}function yo(v,N,z){const H=N.isScene===!0?N.overrideMaterial:null;for(let U=0,re=v.length;U<re;U++){const ue=v[U],{object:be,geometry:ge,group:Le}=ue;let Pe=ue.material;Pe.allowOverride===!0&&H!==null&&(Pe=H),be.layers.test(z.layers)&&Vl(be,N,z,ge,Pe,Le)}}function Vl(v,N,z,H,U,re){v.onBeforeRender(M,N,z,H,U,re),v.modelViewMatrix.multiplyMatrices(z.matrixWorldInverse,v.matrixWorld),v.normalMatrix.getNormalMatrix(v.modelViewMatrix),U.onBeforeRender(M,N,z,H,v,re),U.transparent===!0&&U.side===Tn&&U.forceSinglePass===!1?(U.side=Xt,U.needsUpdate=!0,M.renderBufferDirect(z,N,H,U,v,re),U.side=ai,U.needsUpdate=!0,M.renderBufferDirect(z,N,H,U,v,re),U.side=Tn):M.renderBufferDirect(z,N,H,U,v,re),v.onAfterRender(M,N,z,H,U,re)}function So(v,N,z){N.isScene!==!0&&(N=It);const H=Te.get(v),U=T.state.lights,re=T.state.shadowsArray,ue=U.state.version,be=j.getParameters(v,U.state,re,N,z),ge=j.getProgramCacheKey(be);let Le=H.programs;H.environment=v.isMeshStandardMaterial?N.environment:null,H.fog=N.fog,H.envMap=(v.isMeshStandardMaterial?y:C).get(v.envMap||H.environment),H.envMapRotation=H.environment!==null&&v.envMap===null?N.environmentRotation:v.envMapRotation,Le===void 0&&(v.addEventListener("dispose",Ne),Le=new Map,H.programs=Le);let Pe=Le.get(ge);if(Pe!==void 0){if(H.currentProgram===Pe&&H.lightsStateVersion===ue)return jl(v,be),Pe}else be.uniforms=j.getUniforms(v),v.onBeforeCompile(be,M),Pe=j.acquireProgram(be,ge),Le.set(ge,Pe),H.uniforms=be.uniforms;const Me=H.uniforms;return(!v.isShaderMaterial&&!v.isRawShaderMaterial||v.clipping===!0)&&(Me.clippingPlanes=ve.uniform),jl(v,be),H.needsLights=kh(v),H.lightsStateVersion=ue,H.needsLights&&(Me.ambientLightColor.value=U.state.ambient,Me.lightProbe.value=U.state.probe,Me.directionalLights.value=U.state.directional,Me.directionalLightShadows.value=U.state.directionalShadow,Me.spotLights.value=U.state.spot,Me.spotLightShadows.value=U.state.spotShadow,Me.rectAreaLights.value=U.state.rectArea,Me.ltc_1.value=U.state.rectAreaLTC1,Me.ltc_2.value=U.state.rectAreaLTC2,Me.pointLights.value=U.state.point,Me.pointLightShadows.value=U.state.pointShadow,Me.hemisphereLights.value=U.state.hemi,Me.directionalShadowMap.value=U.state.directionalShadowMap,Me.directionalShadowMatrix.value=U.state.directionalShadowMatrix,Me.spotShadowMap.value=U.state.spotShadowMap,Me.spotLightMatrix.value=U.state.spotLightMatrix,Me.spotLightMap.value=U.state.spotLightMap,Me.pointShadowMap.value=U.state.pointShadowMap,Me.pointShadowMatrix.value=U.state.pointShadowMatrix),H.currentProgram=Pe,H.uniformsList=null,Pe}function Wl(v){if(v.uniformsList===null){const N=v.currentProgram.getUniforms();v.uniformsList=as.seqWithValue(N.seq,v.uniforms)}return v.uniformsList}function jl(v,N){const z=Te.get(v);z.outputColorSpace=N.outputColorSpace,z.batching=N.batching,z.batchingColor=N.batchingColor,z.instancing=N.instancing,z.instancingColor=N.instancingColor,z.instancingMorph=N.instancingMorph,z.skinning=N.skinning,z.morphTargets=N.morphTargets,z.morphNormals=N.morphNormals,z.morphColors=N.morphColors,z.morphTargetsCount=N.morphTargetsCount,z.numClippingPlanes=N.numClippingPlanes,z.numIntersection=N.numClipIntersection,z.vertexAlphas=N.vertexAlphas,z.vertexTangents=N.vertexTangents,z.toneMapping=N.toneMapping}function Bh(v,N,z,H,U){N.isScene!==!0&&(N=It),Oe.resetTextureUnits();const re=N.fog,ue=H.isMeshStandardMaterial?N.environment:null,be=S===null?M.outputColorSpace:S.isXRRenderTarget===!0?S.texture.colorSpace:xr,ge=(H.isMeshStandardMaterial?y:C).get(H.envMap||ue),Le=H.vertexColors===!0&&!!z.attributes.color&&z.attributes.color.itemSize===4,Pe=!!z.attributes.tangent&&(!!H.normalMap||H.anisotropy>0),Me=!!z.morphAttributes.position,Ye=!!z.morphAttributes.normal,ot=!!z.morphAttributes.color;let bt=oi;H.toneMapped&&(S===null||S.isXRRenderTarget===!0)&&(bt=M.toneMapping);const yt=z.morphAttributes.position||z.morphAttributes.normal||z.morphAttributes.color,ct=yt!==void 0?yt.length:0,we=Te.get(H),xt=T.state.lights;if(J===!0&&(me===!0||v!==O)){const Bt=v===O&&H.id===P;ve.setState(H,v,Bt)}let Ze=!1;H.version===we.__version?(we.needsLights&&we.lightsStateVersion!==xt.state.version||we.outputColorSpace!==be||U.isBatchedMesh&&we.batching===!1||!U.isBatchedMesh&&we.batching===!0||U.isBatchedMesh&&we.batchingColor===!0&&U.colorTexture===null||U.isBatchedMesh&&we.batchingColor===!1&&U.colorTexture!==null||U.isInstancedMesh&&we.instancing===!1||!U.isInstancedMesh&&we.instancing===!0||U.isSkinnedMesh&&we.skinning===!1||!U.isSkinnedMesh&&we.skinning===!0||U.isInstancedMesh&&we.instancingColor===!0&&U.instanceColor===null||U.isInstancedMesh&&we.instancingColor===!1&&U.instanceColor!==null||U.isInstancedMesh&&we.instancingMorph===!0&&U.morphTexture===null||U.isInstancedMesh&&we.instancingMorph===!1&&U.morphTexture!==null||we.envMap!==ge||H.fog===!0&&we.fog!==re||we.numClippingPlanes!==void 0&&(we.numClippingPlanes!==ve.numPlanes||we.numIntersection!==ve.numIntersection)||we.vertexAlphas!==Le||we.vertexTangents!==Pe||we.morphTargets!==Me||we.morphNormals!==Ye||we.morphColors!==ot||we.toneMapping!==bt||we.morphTargetsCount!==ct)&&(Ze=!0):(Ze=!0,we.__version=H.version);let Kt=we.currentProgram;Ze===!0&&(Kt=So(H,N,U));let ki=!1,Jt=!1,Ir=!1;const _t=Kt.getUniforms(),Vt=we.uniforms;if(ye.useProgram(Kt.program)&&(ki=!0,Jt=!0,Ir=!0),H.id!==P&&(P=H.id,Jt=!0),ki||O!==v){ye.buffers.depth.getReversed()&&v.reversedDepth!==!0&&(v._reversedDepth=!0,v.updateProjectionMatrix()),_t.setValue(I,"projectionMatrix",v.projectionMatrix),_t.setValue(I,"viewMatrix",v.matrixWorldInverse);const Wt=_t.map.cameraPosition;Wt!==void 0&&Wt.setValue(I,Se.setFromMatrixPosition(v.matrixWorld)),lt.logarithmicDepthBuffer&&_t.setValue(I,"logDepthBufFC",2/(Math.log(v.far+1)/Math.LN2)),(H.isMeshPhongMaterial||H.isMeshToonMaterial||H.isMeshLambertMaterial||H.isMeshBasicMaterial||H.isMeshStandardMaterial||H.isShaderMaterial)&&_t.setValue(I,"isOrthographic",v.isOrthographicCamera===!0),O!==v&&(O=v,Jt=!0,Ir=!0)}if(U.isSkinnedMesh){_t.setOptional(I,U,"bindMatrix"),_t.setOptional(I,U,"bindMatrixInverse");const Bt=U.skeleton;Bt&&(Bt.boneTexture===null&&Bt.computeBoneTexture(),_t.setValue(I,"boneTexture",Bt.boneTexture,Oe))}U.isBatchedMesh&&(_t.setOptional(I,U,"batchingTexture"),_t.setValue(I,"batchingTexture",U._matricesTexture,Oe),_t.setOptional(I,U,"batchingIdTexture"),_t.setValue(I,"batchingIdTexture",U._indirectTexture,Oe),_t.setOptional(I,U,"batchingColorTexture"),U._colorsTexture!==null&&_t.setValue(I,"batchingColorTexture",U._colorsTexture,Oe));const rn=z.morphAttributes;if((rn.position!==void 0||rn.normal!==void 0||rn.color!==void 0)&&Re.update(U,z,Kt),(Jt||we.receiveShadow!==U.receiveShadow)&&(we.receiveShadow=U.receiveShadow,_t.setValue(I,"receiveShadow",U.receiveShadow)),H.isMeshGouraudMaterial&&H.envMap!==null&&(Vt.envMap.value=ge,Vt.flipEnvMap.value=ge.isCubeTexture&&ge.isRenderTargetTexture===!1?-1:1),H.isMeshStandardMaterial&&H.envMap===null&&N.environment!==null&&(Vt.envMapIntensity.value=N.environmentIntensity),Vt.dfgLUT!==void 0&&(Vt.dfgLUT.value=pb()),Jt&&(_t.setValue(I,"toneMappingExposure",M.toneMappingExposure),we.needsLights&&Gh(Vt,Ir),re&&H.fog===!0&&Ee.refreshFogUniforms(Vt,re),Ee.refreshMaterialUniforms(Vt,H,ne,ie,T.state.transmissionRenderTarget[v.id]),as.upload(I,Wl(we),Vt,Oe)),H.isShaderMaterial&&H.uniformsNeedUpdate===!0&&(as.upload(I,Wl(we),Vt,Oe),H.uniformsNeedUpdate=!1),H.isSpriteMaterial&&_t.setValue(I,"center",U.center),_t.setValue(I,"modelViewMatrix",U.modelViewMatrix),_t.setValue(I,"normalMatrix",U.normalMatrix),_t.setValue(I,"modelMatrix",U.matrixWorld),H.isShaderMaterial||H.isRawShaderMaterial){const Bt=H.uniformsGroups;for(let Wt=0,Ks=Bt.length;Wt<Ks;Wt++){const hi=Bt[Wt];de.update(hi,Kt),de.bind(hi,Kt)}}return Kt}function Gh(v,N){v.ambientLightColor.needsUpdate=N,v.lightProbe.needsUpdate=N,v.directionalLights.needsUpdate=N,v.directionalLightShadows.needsUpdate=N,v.pointLights.needsUpdate=N,v.pointLightShadows.needsUpdate=N,v.spotLights.needsUpdate=N,v.spotLightShadows.needsUpdate=N,v.rectAreaLights.needsUpdate=N,v.hemisphereLights.needsUpdate=N}function kh(v){return v.isMeshLambertMaterial||v.isMeshToonMaterial||v.isMeshPhongMaterial||v.isMeshStandardMaterial||v.isShadowMaterial||v.isShaderMaterial&&v.lights===!0}this.getActiveCubeFace=function(){return F},this.getActiveMipmapLevel=function(){return E},this.getRenderTarget=function(){return S},this.setRenderTargetTextures=function(v,N,z){const H=Te.get(v);H.__autoAllocateDepthBuffer=v.resolveDepthBuffer===!1,H.__autoAllocateDepthBuffer===!1&&(H.__useRenderToTexture=!1),Te.get(v.texture).__webglTexture=N,Te.get(v.depthTexture).__webglTexture=H.__autoAllocateDepthBuffer?void 0:z,H.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(v,N){const z=Te.get(v);z.__webglFramebuffer=N,z.__useDefaultFramebuffer=N===void 0};const zh=I.createFramebuffer();this.setRenderTarget=function(v,N=0,z=0){S=v,F=N,E=z;let H=!0,U=null,re=!1,ue=!1;if(v){const ge=Te.get(v);if(ge.__useDefaultFramebuffer!==void 0)ye.bindFramebuffer(I.FRAMEBUFFER,null),H=!1;else if(ge.__webglFramebuffer===void 0)Oe.setupRenderTarget(v);else if(ge.__hasExternalTextures)Oe.rebindTextures(v,Te.get(v.texture).__webglTexture,Te.get(v.depthTexture).__webglTexture);else if(v.depthBuffer){const Me=v.depthTexture;if(ge.__boundDepthTexture!==Me){if(Me!==null&&Te.has(Me)&&(v.width!==Me.image.width||v.height!==Me.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");Oe.setupDepthRenderbuffer(v)}}const Le=v.texture;(Le.isData3DTexture||Le.isDataArrayTexture||Le.isCompressedArrayTexture)&&(ue=!0);const Pe=Te.get(v).__webglFramebuffer;v.isWebGLCubeRenderTarget?(Array.isArray(Pe[N])?U=Pe[N][z]:U=Pe[N],re=!0):v.samples>0&&Oe.useMultisampledRTT(v)===!1?U=Te.get(v).__webglMultisampledFramebuffer:Array.isArray(Pe)?U=Pe[z]:U=Pe,B.copy(v.viewport),W.copy(v.scissor),V=v.scissorTest}else B.copy(tt).multiplyScalar(ne).floor(),W.copy(nt).multiplyScalar(ne).floor(),V=it;if(z!==0&&(U=zh),ye.bindFramebuffer(I.FRAMEBUFFER,U)&&H&&ye.drawBuffers(v,U),ye.viewport(B),ye.scissor(W),ye.setScissorTest(V),re){const ge=Te.get(v.texture);I.framebufferTexture2D(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_CUBE_MAP_POSITIVE_X+N,ge.__webglTexture,z)}else if(ue){const ge=N;for(let Le=0;Le<v.textures.length;Le++){const Pe=Te.get(v.textures[Le]);I.framebufferTextureLayer(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0+Le,Pe.__webglTexture,z,ge)}}else if(v!==null&&z!==0){const ge=Te.get(v.texture);I.framebufferTexture2D(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_2D,ge.__webglTexture,z)}P=-1},this.readRenderTargetPixels=function(v,N,z,H,U,re,ue,be=0){if(!(v&&v.isWebGLRenderTarget)){Mt("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let ge=Te.get(v).__webglFramebuffer;if(v.isWebGLCubeRenderTarget&&ue!==void 0&&(ge=ge[ue]),ge){ye.bindFramebuffer(I.FRAMEBUFFER,ge);try{const Le=v.textures[be],Pe=Le.format,Me=Le.type;if(!lt.textureFormatReadable(Pe)){Mt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!lt.textureTypeReadable(Me)){Mt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}N>=0&&N<=v.width-H&&z>=0&&z<=v.height-U&&(v.textures.length>1&&I.readBuffer(I.COLOR_ATTACHMENT0+be),I.readPixels(N,z,H,U,Ie.convert(Pe),Ie.convert(Me),re))}finally{const Le=S!==null?Te.get(S).__webglFramebuffer:null;ye.bindFramebuffer(I.FRAMEBUFFER,Le)}}},this.readRenderTargetPixelsAsync=async function(v,N,z,H,U,re,ue,be=0){if(!(v&&v.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let ge=Te.get(v).__webglFramebuffer;if(v.isWebGLCubeRenderTarget&&ue!==void 0&&(ge=ge[ue]),ge)if(N>=0&&N<=v.width-H&&z>=0&&z<=v.height-U){ye.bindFramebuffer(I.FRAMEBUFFER,ge);const Le=v.textures[be],Pe=Le.format,Me=Le.type;if(!lt.textureFormatReadable(Pe))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!lt.textureTypeReadable(Me))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const Ye=I.createBuffer();I.bindBuffer(I.PIXEL_PACK_BUFFER,Ye),I.bufferData(I.PIXEL_PACK_BUFFER,re.byteLength,I.STREAM_READ),v.textures.length>1&&I.readBuffer(I.COLOR_ATTACHMENT0+be),I.readPixels(N,z,H,U,Ie.convert(Pe),Ie.convert(Me),0);const ot=S!==null?Te.get(S).__webglFramebuffer:null;ye.bindFramebuffer(I.FRAMEBUFFER,ot);const bt=I.fenceSync(I.SYNC_GPU_COMMANDS_COMPLETE,0);return I.flush(),await Hp(I,bt,4),I.bindBuffer(I.PIXEL_PACK_BUFFER,Ye),I.getBufferSubData(I.PIXEL_PACK_BUFFER,0,re),I.deleteBuffer(Ye),I.deleteSync(bt),re}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(v,N=null,z=0){const H=Math.pow(2,-z),U=Math.floor(v.image.width*H),re=Math.floor(v.image.height*H),ue=N!==null?N.x:0,be=N!==null?N.y:0;Oe.setTexture2D(v,0),I.copyTexSubImage2D(I.TEXTURE_2D,z,0,0,ue,be,U,re),ye.unbindTexture()};const Hh=I.createFramebuffer(),Vh=I.createFramebuffer();this.copyTextureToTexture=function(v,N,z=null,H=null,U=0,re=null){re===null&&(U!==0?(so("WebGLRenderer: copyTextureToTexture function signature has changed to support src and dst mipmap levels."),re=U,U=0):re=0);let ue,be,ge,Le,Pe,Me,Ye,ot,bt;const yt=v.isCompressedTexture?v.mipmaps[re]:v.image;if(z!==null)ue=z.max.x-z.min.x,be=z.max.y-z.min.y,ge=z.isBox3?z.max.z-z.min.z:1,Le=z.min.x,Pe=z.min.y,Me=z.isBox3?z.min.z:0;else{const rn=Math.pow(2,-U);ue=Math.floor(yt.width*rn),be=Math.floor(yt.height*rn),v.isDataArrayTexture?ge=yt.depth:v.isData3DTexture?ge=Math.floor(yt.depth*rn):ge=1,Le=0,Pe=0,Me=0}H!==null?(Ye=H.x,ot=H.y,bt=H.z):(Ye=0,ot=0,bt=0);const ct=Ie.convert(N.format),we=Ie.convert(N.type);let xt;N.isData3DTexture?(Oe.setTexture3D(N,0),xt=I.TEXTURE_3D):N.isDataArrayTexture||N.isCompressedArrayTexture?(Oe.setTexture2DArray(N,0),xt=I.TEXTURE_2D_ARRAY):(Oe.setTexture2D(N,0),xt=I.TEXTURE_2D),I.pixelStorei(I.UNPACK_FLIP_Y_WEBGL,N.flipY),I.pixelStorei(I.UNPACK_PREMULTIPLY_ALPHA_WEBGL,N.premultiplyAlpha),I.pixelStorei(I.UNPACK_ALIGNMENT,N.unpackAlignment);const Ze=I.getParameter(I.UNPACK_ROW_LENGTH),Kt=I.getParameter(I.UNPACK_IMAGE_HEIGHT),ki=I.getParameter(I.UNPACK_SKIP_PIXELS),Jt=I.getParameter(I.UNPACK_SKIP_ROWS),Ir=I.getParameter(I.UNPACK_SKIP_IMAGES);I.pixelStorei(I.UNPACK_ROW_LENGTH,yt.width),I.pixelStorei(I.UNPACK_IMAGE_HEIGHT,yt.height),I.pixelStorei(I.UNPACK_SKIP_PIXELS,Le),I.pixelStorei(I.UNPACK_SKIP_ROWS,Pe),I.pixelStorei(I.UNPACK_SKIP_IMAGES,Me);const _t=v.isDataArrayTexture||v.isData3DTexture,Vt=N.isDataArrayTexture||N.isData3DTexture;if(v.isDepthTexture){const rn=Te.get(v),Bt=Te.get(N),Wt=Te.get(rn.__renderTarget),Ks=Te.get(Bt.__renderTarget);ye.bindFramebuffer(I.READ_FRAMEBUFFER,Wt.__webglFramebuffer),ye.bindFramebuffer(I.DRAW_FRAMEBUFFER,Ks.__webglFramebuffer);for(let hi=0;hi<ge;hi++)_t&&(I.framebufferTextureLayer(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,Te.get(v).__webglTexture,U,Me+hi),I.framebufferTextureLayer(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,Te.get(N).__webglTexture,re,bt+hi)),I.blitFramebuffer(Le,Pe,ue,be,Ye,ot,ue,be,I.DEPTH_BUFFER_BIT,I.NEAREST);ye.bindFramebuffer(I.READ_FRAMEBUFFER,null),ye.bindFramebuffer(I.DRAW_FRAMEBUFFER,null)}else if(U!==0||v.isRenderTargetTexture||Te.has(v)){const rn=Te.get(v),Bt=Te.get(N);ye.bindFramebuffer(I.READ_FRAMEBUFFER,Hh),ye.bindFramebuffer(I.DRAW_FRAMEBUFFER,Vh);for(let Wt=0;Wt<ge;Wt++)_t?I.framebufferTextureLayer(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,rn.__webglTexture,U,Me+Wt):I.framebufferTexture2D(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_2D,rn.__webglTexture,U),Vt?I.framebufferTextureLayer(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,Bt.__webglTexture,re,bt+Wt):I.framebufferTexture2D(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_2D,Bt.__webglTexture,re),U!==0?I.blitFramebuffer(Le,Pe,ue,be,Ye,ot,ue,be,I.COLOR_BUFFER_BIT,I.NEAREST):Vt?I.copyTexSubImage3D(xt,re,Ye,ot,bt+Wt,Le,Pe,ue,be):I.copyTexSubImage2D(xt,re,Ye,ot,Le,Pe,ue,be);ye.bindFramebuffer(I.READ_FRAMEBUFFER,null),ye.bindFramebuffer(I.DRAW_FRAMEBUFFER,null)}else Vt?v.isDataTexture||v.isData3DTexture?I.texSubImage3D(xt,re,Ye,ot,bt,ue,be,ge,ct,we,yt.data):N.isCompressedArrayTexture?I.compressedTexSubImage3D(xt,re,Ye,ot,bt,ue,be,ge,ct,yt.data):I.texSubImage3D(xt,re,Ye,ot,bt,ue,be,ge,ct,we,yt):v.isDataTexture?I.texSubImage2D(I.TEXTURE_2D,re,Ye,ot,ue,be,ct,we,yt.data):v.isCompressedTexture?I.compressedTexSubImage2D(I.TEXTURE_2D,re,Ye,ot,yt.width,yt.height,ct,yt.data):I.texSubImage2D(I.TEXTURE_2D,re,Ye,ot,ue,be,ct,we,yt);I.pixelStorei(I.UNPACK_ROW_LENGTH,Ze),I.pixelStorei(I.UNPACK_IMAGE_HEIGHT,Kt),I.pixelStorei(I.UNPACK_SKIP_PIXELS,ki),I.pixelStorei(I.UNPACK_SKIP_ROWS,Jt),I.pixelStorei(I.UNPACK_SKIP_IMAGES,Ir),re===0&&N.generateMipmaps&&I.generateMipmap(xt),ye.unbindTexture()},this.initRenderTarget=function(v){Te.get(v).__webglFramebuffer===void 0&&Oe.setupRenderTarget(v)},this.initTexture=function(v){v.isCubeTexture?Oe.setTextureCube(v,0):v.isData3DTexture?Oe.setTexture3D(v,0):v.isDataArrayTexture||v.isCompressedArrayTexture?Oe.setTexture2DArray(v,0):Oe.setTexture2D(v,0),ye.unbindTexture()},this.resetState=function(){F=0,E=0,S=null,ye.reset(),D.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return wn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorSpace=Qe._getDrawingBufferColorSpace(e),t.unpackColorSpace=Qe._getUnpackColorSpace()}}const Kd={type:"change"},hl={type:"start"},mf={type:"end"},jo=new al,Jd=new ni,gb=Math.cos(70*Wp.DEG2RAD),wt=new k,$t=2*Math.PI,at={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},La=1e-6;class xb extends Am{constructor(e,t=null){super(e,t),this.state=at.NONE,this.target=new k,this.cursor=new k,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:lr.ROTATE,MIDDLE:lr.DOLLY,RIGHT:lr.PAN},this.touches={ONE:sr.ROTATE,TWO:sr.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this._lastPosition=new k,this._lastQuaternion=new Li,this._lastTargetPosition=new k,this._quat=new Li().setFromUnitVectors(e.up,new k(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new Td,this._sphericalDelta=new Td,this._scale=1,this._panOffset=new k,this._rotateStart=new Be,this._rotateEnd=new Be,this._rotateDelta=new Be,this._panStart=new Be,this._panEnd=new Be,this._panDelta=new Be,this._dollyStart=new Be,this._dollyEnd=new Be,this._dollyDelta=new Be,this._dollyDirection=new k,this._mouse=new Be,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=bb.bind(this),this._onPointerDown=_b.bind(this),this._onPointerUp=yb.bind(this),this._onContextMenu=wb.bind(this),this._onMouseWheel=Eb.bind(this),this._onKeyDown=Mb.bind(this),this._onTouchStart=Tb.bind(this),this._onTouchMove=Cb.bind(this),this._onMouseDown=Sb.bind(this),this._onMouseMove=vb.bind(this),this._interceptControlDown=Ab.bind(this),this._interceptControlUp=Lb.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}connect(e){super.connect(e),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents(),this.domElement.getRootNode().removeEventListener("keydown",this._interceptControlDown,{capture:!0}),this.domElement.style.touchAction="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(Kd),this.update(),this.state=at.NONE}update(e=null){const t=this.object.position;wt.copy(t).sub(this.target),wt.applyQuaternion(this._quat),this._spherical.setFromVector3(wt),this.autoRotate&&this.state===at.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let i=this.minAzimuthAngle,r=this.maxAzimuthAngle;isFinite(i)&&isFinite(r)&&(i<-Math.PI?i+=$t:i>Math.PI&&(i-=$t),r<-Math.PI?r+=$t:r>Math.PI&&(r-=$t),i<=r?this._spherical.theta=Math.max(i,Math.min(r,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(i+r)/2?Math.max(i,this._spherical.theta):Math.min(r,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let o=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{const a=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),o=a!=this._spherical.radius}if(wt.setFromSpherical(this._spherical),wt.applyQuaternion(this._quatInverse),t.copy(this.target).add(wt),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let a=null;if(this.object.isPerspectiveCamera){const c=wt.length();a=this._clampDistance(c*this._scale);const d=c-a;this.object.position.addScaledVector(this._dollyDirection,d),this.object.updateMatrixWorld(),o=!!d}else if(this.object.isOrthographicCamera){const c=new k(this._mouse.x,this._mouse.y,0);c.unproject(this.object);const d=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),o=d!==this.object.zoom;const u=new k(this._mouse.x,this._mouse.y,0);u.unproject(this.object),this.object.position.sub(u).add(c),this.object.updateMatrixWorld(),a=wt.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;a!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(a).add(this.object.position):(jo.origin.copy(this.object.position),jo.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(jo.direction))<gb?this.object.lookAt(this.target):(Jd.setFromNormalAndCoplanarPoint(this.object.up,this.target),jo.intersectPlane(Jd,this.target))))}else if(this.object.isOrthographicCamera){const a=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),a!==this.object.zoom&&(this.object.updateProjectionMatrix(),o=!0)}return this._scale=1,this._performCursorZoom=!1,o||this._lastPosition.distanceToSquared(this.object.position)>La||8*(1-this._lastQuaternion.dot(this.object.quaternion))>La||this._lastTargetPosition.distanceToSquared(this.target)>La?(this.dispatchEvent(Kd),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(e){return e!==null?$t/60*this.autoRotateSpeed*e:$t/60/60*this.autoRotateSpeed}_getZoomScale(e){const t=Math.abs(e*.01);return Math.pow(.95,this.zoomSpeed*t)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,t){wt.setFromMatrixColumn(t,0),wt.multiplyScalar(-e),this._panOffset.add(wt)}_panUp(e,t){this.screenSpacePanning===!0?wt.setFromMatrixColumn(t,1):(wt.setFromMatrixColumn(t,0),wt.crossVectors(this.object.up,wt)),wt.multiplyScalar(e),this._panOffset.add(wt)}_pan(e,t){const i=this.domElement;if(this.object.isPerspectiveCamera){const r=this.object.position;wt.copy(r).sub(this.target);let o=wt.length();o*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*o/i.clientHeight,this.object.matrix),this._panUp(2*t*o/i.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/i.clientWidth,this.object.matrix),this._panUp(t*(this.object.top-this.object.bottom)/this.object.zoom/i.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(e,t){if(!this.zoomToCursor)return;this._performCursorZoom=!0;const i=this.domElement.getBoundingClientRect(),r=e-i.left,o=t-i.top,a=i.width,c=i.height;this._mouse.x=r/a*2-1,this._mouse.y=-(o/c)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const t=this.domElement;this._rotateLeft($t*this._rotateDelta.x/t.clientHeight),this._rotateUp($t*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),this.update()}_handleKeyDown(e){let t=!1;switch(e.code){case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp($t*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),t=!0;break;case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(-$t*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),t=!0;break;case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft($t*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),t=!0;break;case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(-$t*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),t=!0;break}t&&(e.preventDefault(),this.update())}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{const t=this._getSecondPointerPosition(e),i=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._rotateStart.set(i,r)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{const t=this._getSecondPointerPosition(e),i=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._panStart.set(i,r)}}_handleTouchStartDolly(e){const t=this._getSecondPointerPosition(e),i=e.pageX-t.x,r=e.pageY-t.y,o=Math.sqrt(i*i+r*r);this._dollyStart.set(0,o)}_handleTouchStartDollyPan(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enablePan&&this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enableRotate&&this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{const i=this._getSecondPointerPosition(e),r=.5*(e.pageX+i.x),o=.5*(e.pageY+i.y);this._rotateEnd.set(r,o)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const t=this.domElement;this._rotateLeft($t*this._rotateDelta.x/t.clientHeight),this._rotateUp($t*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{const t=this._getSecondPointerPosition(e),i=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._panEnd.set(i,r)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){const t=this._getSecondPointerPosition(e),i=e.pageX-t.x,r=e.pageY-t.y,o=Math.sqrt(i*i+r*r);this._dollyEnd.set(0,o),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);const a=(e.pageX+t.x)*.5,c=(e.pageY+t.y)*.5;this._updateZoomParameters(a,c)}_handleTouchMoveDollyPan(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enablePan&&this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enableRotate&&this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId){this._pointers.splice(t,1);return}}_isTrackingPointer(e){for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId)return!0;return!1}_trackPointer(e){let t=this._pointerPositions[e.pointerId];t===void 0&&(t=new Be,this._pointerPositions[e.pointerId]=t),t.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){const t=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[t]}_customWheelEvent(e){const t=e.deltaMode,i={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(t){case 1:i.deltaY*=16;break;case 2:i.deltaY*=100;break}return e.ctrlKey&&!this._controlActive&&(i.deltaY*=10),i}}function _b(n){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(n.pointerId),this.domElement.addEventListener("pointermove",this._onPointerMove),this.domElement.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(n)&&(this._addPointer(n),n.pointerType==="touch"?this._onTouchStart(n):this._onMouseDown(n)))}function bb(n){this.enabled!==!1&&(n.pointerType==="touch"?this._onTouchMove(n):this._onMouseMove(n))}function yb(n){switch(this._removePointer(n),this._pointers.length){case 0:this.domElement.releasePointerCapture(n.pointerId),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(mf),this.state=at.NONE;break;case 1:const e=this._pointers[0],t=this._pointerPositions[e];this._onTouchStart({pointerId:e,pageX:t.x,pageY:t.y});break}}function Sb(n){let e;switch(n.button){case 0:e=this.mouseButtons.LEFT;break;case 1:e=this.mouseButtons.MIDDLE;break;case 2:e=this.mouseButtons.RIGHT;break;default:e=-1}switch(e){case lr.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(n),this.state=at.DOLLY;break;case lr.ROTATE:if(n.ctrlKey||n.metaKey||n.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(n),this.state=at.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(n),this.state=at.ROTATE}break;case lr.PAN:if(n.ctrlKey||n.metaKey||n.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(n),this.state=at.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(n),this.state=at.PAN}break;default:this.state=at.NONE}this.state!==at.NONE&&this.dispatchEvent(hl)}function vb(n){switch(this.state){case at.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(n);break;case at.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(n);break;case at.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(n);break}}function Eb(n){this.enabled===!1||this.enableZoom===!1||this.state!==at.NONE||(n.preventDefault(),this.dispatchEvent(hl),this._handleMouseWheel(this._customWheelEvent(n)),this.dispatchEvent(mf))}function Mb(n){this.enabled!==!1&&this._handleKeyDown(n)}function Tb(n){switch(this._trackPointer(n),this._pointers.length){case 1:switch(this.touches.ONE){case sr.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(n),this.state=at.TOUCH_ROTATE;break;case sr.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(n),this.state=at.TOUCH_PAN;break;default:this.state=at.NONE}break;case 2:switch(this.touches.TWO){case sr.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(n),this.state=at.TOUCH_DOLLY_PAN;break;case sr.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(n),this.state=at.TOUCH_DOLLY_ROTATE;break;default:this.state=at.NONE}break;default:this.state=at.NONE}this.state!==at.NONE&&this.dispatchEvent(hl)}function Cb(n){switch(this._trackPointer(n),this.state){case at.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(n),this.update();break;case at.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(n),this.update();break;case at.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(n),this.update();break;case at.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(n),this.update();break;default:this.state=at.NONE}}function wb(n){this.enabled!==!1&&n.preventDefault()}function Ab(n){n.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function Lb(n){n.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}const gn={IMAGE:"image",IFRAME:"iframe"},gf=["ocean","ember","graphite"],xf=["comfortable","compact"],_f=[.1,1,10,100],Rb="card_collapsed_",Pi="card-klipperview",pl=["card-print-progress","card-temperatures","card-motion","card-quick-commands","card-macros","card-dashboard-console","camera-main-card","camera-toolhead-card",Pi],bf={left:["card-print-progress","card-motion","camera-main-card","card-macros"],right:["card-temperatures","card-quick-commands","card-dashboard-console",Pi,"camera-toolhead-card"]},Pb={"card-print-progress":"Status","card-temperatures":"Thermals","card-motion":"Controls","card-quick-commands":"Quick Commands","card-macros":"Macros","card-dashboard-console":"Console","camera-main-card":"Main Camera","camera-toolhead-card":"Toolhead Cam",[Pi]:"KlipperView"},Dc={unknown:{label:"Unknown",color:"#64748b"},connecting:{label:"Connecting",color:"#f59e0b"},disconnected:{label:"Disconnected",color:"#f97316"},ready:{label:"Ready",color:"#22c55e"},printing:{label:"Printing",color:"#16a34a"},paused:{label:"Paused",color:"#f59e0b"},complete:{label:"Complete",color:"#22d3ee"},cancelled:{label:"Cancelled",color:"#94a3b8"},error:{label:"Error",color:"#ef4444"}},yf={dashboard:"Dashboard",console:"Console",configuration:"Machine",files:"GCode Files","pretty-gcode":"KlipperView",settings:"Settings"},Sf="active_view",vf="config_selected_path",Ef="config_file_type_filter",Mf="config_file_search_filter",ml="interface_machine_side_collapsed",Tf="jobs_sort_mode",Cf="jobs_type_filter",wf="jobs_search_query",Af="jobs_directory",Lf="jobs_visible_columns",Ib=["modified_desc","modified_asc","name_asc","name_desc","size_desc","size_asc","eta_desc","eta_asc"],Db=["all","files","folders"],Fc=[{key:"size",label:"Size"},{key:"modified",label:"Modified"},{key:"eta",label:"ETA"},{key:"total_layers",label:"Total Layers"},{key:"layer_height",label:"Layer Height"},{key:"first_layer_height",label:"First Layer Height"},{key:"object_height",label:"Object Height"},{key:"filament_length",label:"Filament Length"},{key:"filament_weight",label:"Filament Weight"},{key:"filament_type",label:"Filament Type"},{key:"filament_name",label:"Filament Name"},{key:"nozzle_diameter",label:"Nozzle Diameter"},{key:"first_layer_extruder_temp",label:"First Layer Nozzle Temp"},{key:"first_layer_bed_temp",label:"First Layer Bed Temp"},{key:"chamber_temp",label:"Chamber Temp"}],ao=Fc.map(n=>n.key),Fb=["size","modified","eta","total_layers"],Rf=new Set(["debug","info","warn","error"]),Nb=1200,Ub=400,Ob=1200,Bb=6e3,Gb=250,Pf="console_history_v1",If="console_filter_v1",Df="console_autoscroll_v1",Ff="console_hide_temps_v1",Nf="console_raw_output_v1",Uf=120,kb=1500,zb=["all","command","response","error","system"],Hb=["G0","G1","G2","G3","G4","G10","G20","G21","G28","G90","G91","G92","M82","M83","M84","M104","M105","M106","M107","M109","M114","M115","M117","M118","M140","M141","M190","M191","M220","M221","M400"],Vb=["STATUS","GET_POSITION","QUERY_ENDSTOPS","RESTART","FIRMWARE_RESTART"],Wb={hotend:[0,170,200,215,240,260],bed:[0,45,60,80,100]},jb=250,$b=800,Xb=2e3,qb=1e4,Zd=140,Yb=800,Kb=600*1e3,Jb=.18,Qd="temperature_history_session_v1",Zb="forge_ui_temperature_history",Qb=1,br="temperature_samples",eu={hotend:"#ff4a3f",bed:"#2ea3ff"},dt={ALL:"all",EXAMPLE:"example",LOG:"log",BACKUP:"backup",CONFIG:"config",DOC:"doc"},Ra={[dt.EXAMPLE]:"Examples",[dt.LOG]:"Logs",[dt.BACKUP]:"Backups",[dt.CONFIG]:"Configs",[dt.DOC]:"Other docs"},Ts={[dt.EXAMPLE]:0,[dt.LOG]:1,[dt.BACKUP]:2,[dt.CONFIG]:3,[dt.DOC]:4},ey=new Set(["gcodes","timelapse","timelapse_frames"]),Pa=["config","logs","docs","config_example","config_examples"],$o=["system","klipper","moonraker","fluidd","mainsail"],ty=15e4,ny=120,tu=.05,Cr=20*1e3,iy=14400*1e3,ry=95,oy=.005,fr="default",sy="travel",Ia=[fr,"inner","outer","fill","skin","support","skirt"],ay=[{term:"inner wall",featureType:"inner"},{term:"outer wall",featureType:"outer"},{term:"inner",featureType:"inner"},{term:"outer",featureType:"outer"},{term:"perimeter",featureType:"outer"},{term:"wall",featureType:"outer"},{term:"fill",featureType:"fill"},{term:"infill",featureType:"fill"},{term:"skin",featureType:"skin"},{term:"support",featureType:"support"},{term:"raft",featureType:"support"},{term:"brim",featureType:"skirt"},{term:"skirt",featureType:"skirt"}],nu={[fr]:{current:"rgba(248, 113, 113, 0.96)",history:"rgba(186, 92, 92, 0.52)"},inner:{current:"rgba(34, 197, 94, 0.95)",history:"rgba(52, 138, 84, 0.5)"},outer:{current:"rgba(239, 68, 68, 0.98)",history:"rgba(164, 66, 66, 0.56)"},fill:{current:"rgba(251, 146, 60, 0.95)",history:"rgba(178, 111, 66, 0.52)"},skin:{current:"rgba(250, 204, 21, 0.96)",history:"rgba(184, 154, 60, 0.52)"},support:{current:"rgba(56, 189, 248, 0.95)",history:"rgba(72, 131, 168, 0.52)"},skirt:{current:"rgba(14, 165, 233, 0.95)",history:"rgba(60, 122, 153, 0.52)"}},iu={current:"rgba(148, 163, 184, 0.72)",history:"rgba(100, 116, 139, 0.38)"},cy="rgba(100, 116, 139, 0.42)",ly=5,Da=.42;function ru(n,e){return getComputedStyle(document.documentElement).getPropertyValue(n).trim()||e}function dy(){return{hotend:ru("--danger",eu.hotend),bed:ru("--accent",eu.bed)}}const Ue=Uu("app"),l={navItems:[...document.querySelectorAll(".nav-item")],views:[...document.querySelectorAll(".view")],sidebar:document.getElementById("sidebar"),sidebarToggle:document.getElementById("sidebar-toggle"),pageTitle:document.getElementById("page-title"),connectionPill:document.getElementById("connection-pill"),connectionText:document.getElementById("connection-text"),printerDot:document.getElementById("printer-dot"),printerState:document.getElementById("printer-state"),progressBar:document.getElementById("progress-bar"),progressText:document.getElementById("progress-text"),statusFileName:document.getElementById("status-file-name"),statusFileThumbWrap:document.getElementById("status-file-thumb-wrap"),statusFileThumb:document.getElementById("status-file-thumb"),statusEtp:document.getElementById("status-etp"),statusFinish:document.getElementById("status-finish"),statusTimeLeft:document.getElementById("status-time-left"),statusSpeed:document.getElementById("status-speed"),statusFlowrate:document.getElementById("status-flowrate"),statusFilament:document.getElementById("status-filament"),statusLayer:document.getElementById("status-layer"),statusClearFile:document.getElementById("status-clear-file"),statusPrintActions:document.getElementById("status-print-actions"),statusPrintPause:document.getElementById("status-print-pause"),statusPrintResume:document.getElementById("status-print-resume"),statusPrintCancel:document.getElementById("status-print-cancel"),tempHotend:document.getElementById("temp-hotend"),tempBed:document.getElementById("temp-bed"),tempHotendState:document.getElementById("temp-hotend-state"),tempBedState:document.getElementById("temp-bed-state"),tempHotendTarget:document.getElementById("temp-hotend-target"),tempBedTarget:document.getElementById("temp-bed-target"),tempHotendTargetInput:document.getElementById("temp-hotend-target-input"),tempBedTargetInput:document.getElementById("temp-bed-target-input"),tempHotendTargetToggle:document.getElementById("temp-hotend-target-toggle"),tempBedTargetToggle:document.getElementById("temp-bed-target-toggle"),tempHotendTargetMenu:document.getElementById("temp-hotend-target-menu"),tempBedTargetMenu:document.getElementById("temp-bed-target-menu"),tempCooldown:document.getElementById("temp-cooldown"),tempSettingsToggle:document.getElementById("temp-settings-toggle"),tempSettingsMenu:document.getElementById("temp-settings-menu"),tempShowChart:document.getElementById("temp-show-chart"),tempHideHostSensors:document.getElementById("temp-hide-host-sensors"),tempHideMonitors:document.getElementById("temp-hide-monitors"),tempAutoscaleChart:document.getElementById("temp-autoscale-chart"),temperatureChartWrap:document.getElementById("temperature-chart-wrap"),temperatureChart:document.getElementById("temperature-chart"),temperatureChartTooltip:document.getElementById("temperature-chart-tooltip"),temperatureTooltipTime:document.getElementById("temperature-tooltip-time"),temperatureTooltipHotend:document.getElementById("temperature-tooltip-hotend"),temperatureTooltipBed:document.getElementById("temperature-tooltip-bed"),consoleLog:document.getElementById("console-log"),consoleForm:document.getElementById("console-form"),consoleInput:document.getElementById("console-input"),consoleClear:document.getElementById("console-clear"),consoleHelperToggle:document.getElementById("console-helper-toggle"),consoleSettingsToggle:document.getElementById("console-settings-toggle"),consoleHelperPanel:document.getElementById("console-helper-panel"),consoleSettingsPanel:document.getElementById("console-settings-panel"),consoleHideTemps:document.getElementById("console-hide-temps"),consoleRawOutput:document.getElementById("console-raw-output"),consolePause:document.getElementById("console-pause"),consoleAutoscroll:document.getElementById("console-autoscroll"),consoleFilter:document.getElementById("console-filter"),consoleSearch:document.getElementById("console-search"),consoleMeta:document.getElementById("console-meta"),consoleHelperGrid:document.getElementById("console-helper-grid"),dashboardConsoleLog:document.getElementById("dashboard-console-log"),dashboardConsoleForm:document.getElementById("dashboard-console-form"),dashboardConsoleInput:document.getElementById("dashboard-console-input"),dashboardConsoleClear:document.getElementById("dashboard-console-clear"),dashboardConsoleHelperToggle:document.getElementById("dashboard-console-helper-toggle"),dashboardConsoleSettingsToggle:document.getElementById("dashboard-console-settings-toggle"),dashboardConsoleHelperPanel:document.getElementById("dashboard-console-helper-panel"),dashboardConsoleSettingsPanel:document.getElementById("dashboard-console-settings-panel"),dashboardConsoleHideTemps:document.getElementById("dashboard-console-hide-temps"),dashboardConsoleRawOutput:document.getElementById("dashboard-console-raw-output"),dashboardConsolePause:document.getElementById("dashboard-console-pause"),dashboardConsoleAutoscroll:document.getElementById("dashboard-console-autoscroll"),dashboardConsoleFilter:document.getElementById("dashboard-console-filter"),dashboardConsoleSearch:document.getElementById("dashboard-console-search"),dashboardConsoleMeta:document.getElementById("dashboard-console-meta"),dashboardConsoleHelperGrid:document.getElementById("dashboard-console-helper-grid"),macroList:document.getElementById("macro-list"),dashboardMacroList:document.getElementById("dashboard-macro-list"),jobsCard:document.getElementById("jobs-card"),fileList:document.getElementById("file-list"),jobsRefresh:document.getElementById("jobs-refresh"),jobsUploadBtn:document.getElementById("jobs-upload-btn"),jobsUploadFolderBtn:document.getElementById("jobs-upload-folder-btn"),jobsUploadPrintBtn:document.getElementById("jobs-upload-print-btn"),jobsAddFileBtn:document.getElementById("jobs-add-file-btn"),jobsUploadInput:document.getElementById("jobs-upload-input"),jobsUploadFolderInput:document.getElementById("jobs-upload-folder-input"),jobsUploadPrintInput:document.getElementById("jobs-upload-print-input"),jobsAddFileInput:document.getElementById("jobs-add-file-input"),jobsNewFolder:document.getElementById("jobs-new-folder"),jobsSummary:document.getElementById("jobs-summary"),jobsFeaturePanel:document.getElementById("jobs-feature-panel"),jobsPathDisplay:document.getElementById("jobs-path-display"),jobsSortToggle:document.getElementById("jobs-sort-toggle"),jobsSortMenu:document.getElementById("jobs-sort-menu"),jobsColumnsToggle:document.getElementById("jobs-columns-toggle"),jobsColumnsMenu:document.getElementById("jobs-columns-menu"),jobsColumnsList:document.getElementById("jobs-columns-list"),jobsSearchToggle:document.getElementById("jobs-search-toggle"),jobsFilterToggle:document.getElementById("jobs-filter-toggle"),jobsFilterMenu:document.getElementById("jobs-filter-menu"),jobsAddToggle:document.getElementById("jobs-add-toggle"),jobsAddMenu:document.getElementById("jobs-add-menu"),jobsSearch:document.getElementById("jobs-search"),jobsSort:document.getElementById("jobs-sort"),jobsTypeFilter:document.getElementById("jobs-type-filter"),jobsActiveLabel:document.getElementById("jobs-active-label"),jobsPause:document.getElementById("jobs-pause"),jobsResume:document.getElementById("jobs-resume"),jobsCancel:document.getElementById("jobs-cancel"),jobsBreadcrumbs:document.getElementById("jobs-breadcrumbs"),jobsStatus:document.getElementById("jobs-status"),prettyGcodeView:document.getElementById("view-pretty-gcode"),prettyGcodeCard:document.getElementById(Pi),prettyGcodeCanvas:document.getElementById("pretty-gcode-canvas"),prettyGcodeStatus:document.getElementById("pretty-gcode-status"),prettyGcodeFile:document.getElementById("pretty-gcode-file"),prettyGcodeFollow:document.getElementById("pretty-gcode-follow"),prettyGcodeReload:document.getElementById("pretty-gcode-reload"),prettyGcodeMode:document.getElementById("pretty-gcode-mode"),prettyGcodeLoadFile:document.getElementById("pretty-gcode-load-file"),prettyGcodeLive:document.getElementById("pretty-gcode-live"),prettyGcodeRewind:document.getElementById("pretty-gcode-rewind"),prettyGcodePlayPause:document.getElementById("pretty-gcode-play-pause"),prettyGcodeFastForward:document.getElementById("pretty-gcode-fast-forward"),prettyGcodeShowMirror:document.getElementById("pretty-gcode-show-mirror"),prettyGcodeShowNozzle:document.getElementById("pretty-gcode-show-nozzle"),prettyGcodeOrbitIdle:document.getElementById("pretty-gcode-orbit-idle"),prettyGcodeProgress:document.getElementById("pretty-gcode-progress"),prettyGcodeLayerSlider:document.getElementById("pretty-gcode-layer-slider"),prettyGcodeLayerTop:document.getElementById("pretty-gcode-layer-top"),prettyGcodeLayerBottom:document.getElementById("pretty-gcode-layer-bottom"),prettyGcodeLoadInput:document.getElementById("pretty-gcode-load-input"),machineLayout:document.getElementById("machine-layout"),machineSideColumn:document.getElementById("machine-side-column"),machineSideToggle:document.getElementById("machine-side-toggle"),configRefresh:document.getElementById("config-refresh"),configUploadBtn:document.getElementById("config-upload-btn"),configUploadInput:document.getElementById("config-upload-input"),configFilter:document.getElementById("config-filter"),configFileSearch:document.getElementById("config-file-search"),configFileList:document.getElementById("config-file-list"),configCurrentFile:document.getElementById("config-current-file"),configStatus:document.getElementById("config-status"),configDownload:document.getElementById("config-download"),configDelete:document.getElementById("config-delete"),configNewBtn:document.getElementById("config-new-btn"),configIgnoreChanges:document.getElementById("config-ignore-changes"),configSaveRestart:document.getElementById("config-save-restart"),configDirtyPrompt:document.getElementById("config-dirty-prompt"),configEditor:document.getElementById("config-editor"),configSearchInput:document.getElementById("config-search-input"),configSearchPrev:document.getElementById("config-search-prev"),configSearchNext:document.getElementById("config-search-next"),configSearchCount:document.getElementById("config-search-count"),configSearchCase:document.getElementById("config-search-case"),configSearchWord:document.getElementById("config-search-word"),configSearchRegex:document.getElementById("config-search-regex"),machineSystemStatus:document.getElementById("machine-system-status"),machineMcuName:document.getElementById("machine-mcu-name"),machineMcuChip:document.getElementById("machine-mcu-chip"),machineMcuVersion:document.getElementById("machine-mcu-version"),machineMcuStats:document.getElementById("machine-mcu-stats"),machineHostArch:document.getElementById("machine-host-arch"),machineHostVersion:document.getElementById("machine-host-version"),machineHostOs:document.getElementById("machine-host-os"),machineHostStats:document.getElementById("machine-host-stats"),machineHostNetworkList:document.getElementById("machine-host-network-list"),machineDevicesGauge:document.getElementById("machine-devices-gauge"),machineDevicesValue:document.getElementById("machine-devices-value"),machineCpuGauge:document.getElementById("machine-cpu-gauge"),machineCpuGaugeValue:document.getElementById("machine-cpu-gauge-value"),machineMemGauge:document.getElementById("machine-mem-gauge"),machineMemGaugeValue:document.getElementById("machine-mem-gauge-value"),machineUpdateRefresh:document.getElementById("machine-update-refresh"),machineUpdateUpgradeAll:document.getElementById("machine-update-upgrade-all"),machineUpdateSummary:document.getElementById("machine-update-summary"),machineUpdateRate:document.getElementById("machine-update-rate"),machineUpdateList:document.getElementById("machine-update-list"),machineUpdateLog:document.getElementById("machine-update-log"),machineUpdateStatus:document.getElementById("machine-update-status"),machineEndstopsQuery:document.getElementById("machine-endstops-query"),machineEndstopsSummary:document.getElementById("machine-endstops-summary"),machineEndstopsList:document.getElementById("machine-endstops-list"),machineEndstopsStatus:document.getElementById("machine-endstops-status"),controlsEndstopsQuery:document.getElementById("controls-endstops-query"),controlsEndstopsSummary:document.getElementById("controls-endstops-summary"),controlsEndstopsList:document.getElementById("controls-endstops-list"),controlsEndstopsStatus:document.getElementById("controls-endstops-status"),machineLogFilesRefresh:document.getElementById("machine-log-files-refresh"),machineLogFilesDeleteAll:document.getElementById("machine-log-files-delete-all"),machineLogFilesSummary:document.getElementById("machine-log-files-summary"),machineLogFilesList:document.getElementById("machine-log-files-list"),machineLogFilesStatus:document.getElementById("machine-log-files-status"),settingsForm:document.getElementById("settings-form"),moonrakerUrl:document.getElementById("moonraker-url"),interfaceTheme:document.getElementById("interface-theme"),interfaceCompact:document.getElementById("interface-compact"),interfaceDensity:document.getElementById("interface-density"),dashShowPrintProgress:document.getElementById("dash-show-print-progress"),dashShowTemperatures:document.getElementById("dash-show-temperatures"),dashShowMotion:document.getElementById("dash-show-motion"),dashShowQuickCommands:document.getElementById("dash-show-quick-commands"),dashShowMacros:document.getElementById("dash-show-macros"),dashShowMainCamera:document.getElementById("dash-show-main-camera"),dashShowToolheadCamera:document.getElementById("dash-show-toolhead-camera"),dashShowConsole:document.getElementById("dash-show-console"),dashShowKlipperView:document.getElementById("dash-show-klipperview"),openDashboardLayout:document.getElementById("open-dashboard-layout"),dashboardLayoutDialog:document.getElementById("dashboard-layout-dialog"),dashboardLayoutClose:document.getElementById("dashboard-layout-close"),dashboardLayoutSave:document.getElementById("dashboard-layout-save"),dashboardLayoutReset:document.getElementById("dashboard-layout-reset"),dashboardLayoutLeft:document.getElementById("dashboard-layout-left"),dashboardLayoutRight:document.getElementById("dashboard-layout-right"),dashboardCards:document.getElementById("dashboard-cards"),dashboardColLeft:document.getElementById("dashboard-col-left"),dashboardColRight:document.getElementById("dashboard-col-right"),cardPrintProgress:document.getElementById("card-print-progress"),cardTemperatures:document.getElementById("card-temperatures"),cardMotion:document.getElementById("card-motion"),cardQuickCommands:document.getElementById("card-quick-commands"),cardMacros:document.getElementById("card-macros"),cardDashboardConsole:document.getElementById("card-dashboard-console"),cardMainCamera:document.getElementById("camera-main-card"),cardToolheadCamera:document.getElementById("camera-toolhead-card"),cameraEnabled:document.getElementById("camera-enabled"),cameraUrl:document.getElementById("camera-url"),cameraRenderMode:document.getElementById("camera-render-mode"),toolheadCameraEnabled:document.getElementById("toolhead-camera-enabled"),toolheadCameraUrl:document.getElementById("toolhead-camera-url"),toolheadCameraRenderMode:document.getElementById("toolhead-camera-render-mode"),mainCameraFrame:document.getElementById("main-camera-frame"),toolheadCameraFrame:document.getElementById("toolhead-camera-frame"),mainCameraFullscreen:document.getElementById("main-camera-fullscreen"),toolheadCameraFullscreen:document.getElementById("toolhead-camera-fullscreen"),cameraDialog:document.getElementById("camera-fullscreen-dialog"),cameraDialogClose:document.getElementById("camera-fullscreen-close"),cameraDialogContent:document.getElementById("camera-fullscreen-content"),controlsCard:document.getElementById("card-motion"),controlsKeyboardSurface:document.getElementById("controls-keyboard-surface"),controlsJogButtons:[...document.querySelectorAll("[data-control-jog-axis]")],controlsHomeButtons:[...document.querySelectorAll("[data-control-home]")],controlsDistanceButtons:[...document.querySelectorAll("[data-jog-distance]")],controlsFeedrateInput:document.getElementById("controls-feedrate-input"),controlsFeedrateSet:document.getElementById("controls-feedrate-set"),controlsFlowrateInput:document.getElementById("controls-flowrate-input"),controlsFlowrateSet:document.getElementById("controls-flowrate-set"),controlsExtrusionAmount:document.getElementById("controls-extrusion-amount"),controlsExtrude:document.getElementById("controls-extrude"),controlsRetract:document.getElementById("controls-retract"),controlsToolRow:document.getElementById("controls-tool-row"),controlsToolSelect:document.getElementById("controls-tool-select"),controlsToolSet:document.getElementById("controls-tool-set"),controlsMotorsOff:document.getElementById("controls-motors-off"),controlsFanOn:document.getElementById("controls-fan-on"),controlsFanOff:document.getElementById("controls-fan-off"),controlsFanSpeed:document.getElementById("controls-fan-speed"),controlsFanSpeedValue:document.getElementById("controls-fan-speed-value"),quickGcode:[...document.querySelectorAll("[data-gcode]")]};let Cs=null,cs=null,ls=null,ds=null,us=null,Fa=null,Xo=null,Yr=null,tr=null,fs=null,fe={renderer:null,scene:null,camera:null,controls:null,animationFrame:null,geometryDirty:!0,renderRequested:!0,layerEntries:[],printGroup:null,mirrorGroup:null,bedGrid:null,bedPlane:null,nozzleMesh:null,bedCenter:{},bedSize:{x:220,z:220},lastInteractionMs:0};function Et(n,e){const t=localStorage.getItem(n);return t===null?e:t==="1"||t==="true"}function ou(n,e){const t=localStorage.getItem(n);return t===gn.IMAGE||t===gn.IFRAME?t:e}function Na(n,e,t){const i=localStorage.getItem(n);return i&&t.includes(i)?i:e}function su(n,e,{min:t=.1,max:i=1/0}={}){const r=Number(localStorage.getItem(n));return!Number.isFinite(r)||r<t||r>i?e:r}function uy(n){return!(n instanceof HTMLInputElement)||n.type!=="file"?null:(n.hasAttribute("hidden")&&n.removeAttribute("hidden"),n.classList.add("file-input-proxy"),n)}function kr(n){const e=uy(n);if(!(!e||e.disabled)){if(typeof e.showPicker=="function")try{e.showPicker();return}catch{}e.click()}}function Of(n){return Object.prototype.hasOwnProperty.call(yf,n)}function fy(n="dashboard"){const e=localStorage.getItem(Sf);return Of(e)?e:n}function hy(){return String(localStorage.getItem(vf)||"").trim()}function py(){return Pr(localStorage.getItem(Ef))}function my(){return String(localStorage.getItem(Mf)||"").trim()}function wr(n){const e=String(n||"").trim().toLowerCase();return Ib.includes(e)?e:"modified_desc"}function Ar(n){const e=String(n||"").trim().toLowerCase();return Db.includes(e)?e:"all"}function Ke(n){return String(n||"").trim().replace(/\\/g,"/").replace(/^\/+/,"").replace(/\/+$/,"")}function gy(){return wr(localStorage.getItem(Tf))}function xy(){return Ar(localStorage.getItem(Cf))}function _y(){return String(localStorage.getItem(wf)||"").trim()}function by(){return Ke(localStorage.getItem(Af))}function Gs(n){let e=[];if(Array.isArray(n))e=n;else if(typeof n=="string")try{const r=JSON.parse(n);Array.isArray(r)&&(e=r)}catch{e=[]}const t=e.map(r=>String(r||"").trim().toLowerCase()).map(r=>r==="layers"?"total_layers":r).filter(r=>ao.includes(r)),i=[...new Set(t)];return i.length?i:[...Fb]}function yy(){return Gs(localStorage.getItem(Lf))}function ks(){localStorage.setItem(vf,s.config.selectedPath||""),localStorage.setItem(Ef,Pr(s.config.fileTypeFilter)),localStorage.setItem(Mf,String(s.config.fileSearchQuery||"").trim())}function Sy(n){return n.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")}function Nc(n){const t=(Array.isArray(n)?n:[]).filter(i=>pl.includes(i));return[...new Set(t)]}function ci(n){const e=n&&typeof n=="object"?n:{},t=Nc(e.left),i=Nc(e.right).filter(a=>!t.includes(a)),r=new Set([...t,...i]);return pl.filter(a=>!r.has(a)).forEach(a=>{t.length<=i.length?t.push(a):i.push(a)}),{left:t,right:i}}function vy(n){const e=Nc(n),t={left:[],right:[]};return e.forEach((i,r)=>{const o=r%2===0?"left":"right";t[o].push(i)}),ci(t)}function Bf(n){const e=ci(n),t=Math.max(e.left.length,e.right.length),i=[];for(let r=0;r<t;r+=1)e.left[r]&&i.push(e.left[r]),e.right[r]&&i.push(e.right[r]);return i}function Ey(){const n=localStorage.getItem("dashboard_layout");if(n)try{const t=JSON.parse(n);return ci(t)}catch{}const e=localStorage.getItem("dashboard_layout_order");if(e)try{const t=JSON.parse(e);return vy(t)}catch{}return ci(bf)}function zr(n,e=null){const t=Number(n);return Number.isFinite(t)?t:e}function Gf(n){const e=zr(n?.time,null);return Number.isFinite(e)?{time:e,hotendCurrent:zr(n?.hotendCurrent,null),hotendTarget:zr(n?.hotendTarget,0),bedCurrent:zr(n?.bedCurrent,null),bedTarget:zr(n?.bedTarget,0)}:null}function kf(){if(Fa)return Fa;let n=null;try{n=sessionStorage.getItem(Qd),n||(n=`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`,sessionStorage.setItem(Qd,n))}catch{}return n||(n=`volatile-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`),Fa=n,n}function zf(){return Xo||(Xo=new Promise((n,e)=>{if(typeof indexedDB>"u"){n(null);return}const t=indexedDB.open(Zb,Qb);t.onupgradeneeded=()=>{const i=t.result;i.objectStoreNames.contains(br)||i.createObjectStore(br,{keyPath:["sessionId","time"]})},t.onsuccess=()=>{n(t.result)},t.onerror=()=>{e(t.error||new Error("Failed to open temperature history database."))}}),Xo)}async function My(){try{const n=await zf();if(!n)return[];const e=kf();return await new Promise((t,i)=>{const o=n.transaction(br,"readonly").objectStore(br),a=IDBKeyRange.bound([e,0],[e,Number.MAX_SAFE_INTEGER]),c=o.getAll(a);c.onsuccess=()=>{const d=(c.result||[]).map(u=>Gf(u)).filter(Boolean).sort((u,f)=>u.time-f.time);t(d)},c.onerror=()=>{i(c.error||new Error("Failed to read temperature history."))}})}catch(n){return Ue.debug("Temperature history load failed.",{error:n?.message||String(n)}),[]}}async function Ty(n){const e=Gf(n);if(e)try{const t=await zf();if(!t)return;const i=kf();await new Promise((r,o)=>{const a=t.transaction(br,"readwrite");a.objectStore(br).put({sessionId:i,...e}),a.oncomplete=()=>r(),a.onerror=()=>o(a.error||new Error("Failed to persist temperature sample.")),a.onabort=()=>o(a.error||new Error("Temperature sample transaction aborted."))})}catch(t){Ue.debug("Temperature history persist failed.",{error:t?.message||String(t)})}}async function Cy(){const n=await My();if(!n.length)return;s.temperatures.history=n;const e=n[n.length-1];s.temperatures.hotend.current=e.hotendCurrent,s.temperatures.hotend.target=e.hotendTarget,s.temperatures.bed.current=e.bedCurrent,s.temperatures.bed.target=e.bedTarget}const Uc=[],qo=Uc[Uc.length-1]||null;function gl(){return{systemInfo:null,procStats:null,mcuStatus:null,systemStats:null,klipperVersion:"",lastError:"",lastUpdatedMs:null}}function Hf(){return{busy:!1,versionInfo:{},githubRateLimit:null,githubRequestsRemaining:null,githubLimitResetTime:null,lastError:"",statusMessage:"",actionInFlight:!1,activeActionLabel:"",lastUpdatedMs:null,activityLog:[]}}function xl(){return{values:{},queryInFlight:!1,lastError:"",lastUpdatedMs:null}}function _l(){return{files:[],isLoading:!1,actionInFlight:!1,lastError:"",lastUpdatedMs:null}}function wy(){return{files:[],directories:[],isLoading:!1,actionInFlight:!1,actionLabel:"",activePath:"",lastError:"",lastUpdatedMs:null,searchQuery:_y(),sortMode:gy(),typeFilter:xy(),currentDirectory:by(),visibleColumns:yy(),metadataByPath:new Map,metadataLoading:new Set,uploadDragDepth:0}}function Ay(){return{isLoading:!1,loadingFile:"",activeFile:"",sourceLabel:"",sourceMode:"live",sourceTextLength:0,lastError:"",lastLoadedAtMs:null,parseRequestId:0,segments:[],extrudingSegmentIndices:[],bounds:null,extrusionCount:0,followToolhead:!0,showMirror:!0,showNozzle:!0,orbitWhenIdle:!1,toolhead:{x:null,y:null,z:null},simulationProgress:0,simulationPlaying:!1,simulationSpeed:1,simulationDurationMs:Cr,simulationLastTickMs:null,layerZValues:[],segmentLayerIndices:[],segmentExtrusionOrderInLayer:[],layerExtrusionCounts:[],layerExtrusionEndCounts:[],totalLayers:0,selectedLayerIndex:0,layerSelectionPinned:!1}}const s={client:null,connectionStatus:"disconnected",activeView:fy(),moonrakerUrl:localStorage.getItem("moonraker_url")||"http://127.0.0.1:7125",config:{files:[],filteredFiles:[],selectedPath:hy(),originalContent:"",draftContent:"",isDirty:!1,isLoadingFile:!1,fileTypeFilter:py(),fileSearchQuery:my()},configSearch:{query:"",caseSensitive:!1,wholeWord:!1,useRegex:!1,matches:[],activeIndex:-1,invalidRegex:!1},interface:{theme:Na("interface_theme","ocean",gf),compact:Et("interface_compact",!1),density:Na("interface_density","comfortable",xf),sidebarCollapsed:Et("interface_sidebar_collapsed",!1),machineSideCollapsed:Et(ml,!1)},dashboard:{showPrintProgress:Et("dashboard_show_print_progress",!0),showTemperatures:Et("dashboard_show_temperatures",!0),showMotion:Et("dashboard_show_motion",!0),showQuickCommands:Et("dashboard_show_quick_commands",!0),showMacros:Et("dashboard_show_macros",!0),showMainCamera:Et("dashboard_show_main_camera",!0),showToolheadCamera:Et("dashboard_show_toolhead_camera",!0),showConsole:Et("dashboard_show_console",!0),showKlipperView:Et("dashboard_show_klipperview",!0),layout:Ey()},controls:{distance:Number(Na("controls_jog_distance","10",_f.map(String))),extrusionAmount:su("controls_extrusion_amount",10,{min:.1,max:1e3}),fanSpeed:su("controls_fan_speed",100,{min:0,max:100}),tools:[{label:"Hotend",command:"T0"}],keyboardActive:!1,feedRateResetter:null,flowRateResetter:null},camera:{enabled:Et("camera_enabled",!0),url:localStorage.getItem("camera_url")||"",renderMode:ou("camera_render_mode",gn.IMAGE)},toolheadCamera:{enabled:Et("toolhead_camera_enabled",!1),url:localStorage.getItem("toolhead_camera_url")||"",renderMode:ou("toolhead_camera_render_mode",gn.IMAGE)},temperatures:{hotend:{current:qo?.hotendCurrent??null,target:qo?.hotendTarget??0},bed:{current:qo?.bedCurrent??null,target:qo?.bedTarget??0},history:Uc,chart:{show:Et("temperature_show_chart",!0),hideHostSensors:Et("temperature_hide_host_sensors",!1),hideMonitors:Et("temperature_hide_monitors",!1),autoscale:Et("temperature_autoscale_chart",!1),offsetMs:0,hoverIndex:null,layout:null}},machineLoads:gl(),updateManager:Hf(),endstops:xl(),logFiles:_l(),jobs:wy(),prettyGcode:Ay(),console:{seenStoreEntryKeys:new Set,pendingCommandCounts:new Map,storeSyncFailed:!1,autoscroll:Et(Df,!0),filter:zs(localStorage.getItem(If)),searchQuery:"",hideTemps:Et(Ff,!1),rawOutput:Et(Nf,!1),paused:!1,pausedBuffer:[],history:Ry(),historyIndex:0,historyDraft:"",helperEntries:vl(),helperLoading:!1,helperLoaded:!1},printStatus:{filename:"",thumbnailPath:"",metadataByFile:new Map,metadataRequestId:0,lastPrintStats:{},lastGcodeMove:{},lastFilamentUsed:null,lastVirtualSd:{},lastMotionReport:{},lastToolhead:{},countdownTargetMs:null,fileClearedAfterComplete:!1}};function Ly(n=Date.now()){const e=Number(n);return(Number.isFinite(e)?new Date(e):new Date).toLocaleTimeString()}function Ry(){try{const n=localStorage.getItem(Pf);if(!n)return[];const e=JSON.parse(n);return Array.isArray(e)?e.map(t=>String(t||"").trim()).filter(t=>t.length>0).slice(-Uf):[]}catch{return[]}}function zs(n){const e=String(n||"all").trim().toLowerCase();return zb.includes(e)?e:"all"}function bl(n){return String(n||"").replace(/\r/g,"").split(`
`).map(e=>e.trimEnd()).filter(e=>e.trim().length>0)}function Ct(){return[{key:"main",log:l.consoleLog,form:l.consoleForm,input:l.consoleInput,clearButton:l.consoleClear,helperToggle:l.consoleHelperToggle,settingsToggle:l.consoleSettingsToggle,helperPanel:l.consoleHelperPanel,settingsPanel:l.consoleSettingsPanel,hideTempsInput:l.consoleHideTemps,rawOutputInput:l.consoleRawOutput,pauseButton:l.consolePause,autoscrollInput:l.consoleAutoscroll,filterSelect:l.consoleFilter,searchInput:l.consoleSearch,meta:l.consoleMeta,helperGrid:l.consoleHelperGrid},{key:"dashboard",log:l.dashboardConsoleLog,form:l.dashboardConsoleForm,input:l.dashboardConsoleInput,clearButton:l.dashboardConsoleClear,helperToggle:l.dashboardConsoleHelperToggle,settingsToggle:l.dashboardConsoleSettingsToggle,helperPanel:l.dashboardConsoleHelperPanel,settingsPanel:l.dashboardConsoleSettingsPanel,hideTempsInput:l.dashboardConsoleHideTemps,rawOutputInput:l.dashboardConsoleRawOutput,pauseButton:l.dashboardConsolePause,autoscrollInput:l.dashboardConsoleAutoscroll,filterSelect:l.dashboardConsoleFilter,searchInput:l.dashboardConsoleSearch,meta:l.dashboardConsoleMeta,helperGrid:l.dashboardConsoleHelperGrid}]}function Vf(n="main"){return Ct().find(e=>e.key===n)||null}function Wf(){return Ct().map(n=>n.input).filter(n=>n instanceof HTMLInputElement)}function jf(n=null){if(n instanceof HTMLInputElement)return n;const e=Wf();return e.find(i=>i===document.activeElement)||e[0]||null}function Oc(n){Wf().forEach(e=>{e.value=n})}function Bc(n,e=null){const t=jf(e);return Oc(String(n||"")),t}function Py(){return Ct().find(e=>e.log)?.log||null}function Iy(n){const e=String(n||"").trim();return e?!!(/^(?:ok\s+)?(?:T\d*:|T:|B:|C:|P:)/i.test(e)||/\bT\d*:\s*-?\d/i.test(e)||/\bB:\s*-?\d/i.test(e)):!1}function Dy(){Ct().forEach(n=>{const e=n.log;if(e)for(;e.children.length>Nb;)e.removeChild(e.firstElementChild)})}function Fy(n,e,t=""){const i=String(t||"").trim().toLowerCase();if(["command","response","error","system"].includes(i))return i;const r=String(e||"").trim().toUpperCase(),o=Rf.has(n)?n:"info";return r==="COMMAND"?"command":r==="RESPONSE"?"response":r==="ERROR"||o==="error"?"error":"system"}function Ny(n){if(!n)return!1;const e=zs(s.console.filter);if(e!=="all"&&n.dataset.consoleType!==e)return!1;if(s.console.hideTemps&&n.dataset.consoleType==="response"){const i=n.dataset.consoleMessage||n.textContent||"";if(Iy(i))return!1}const t=String(s.console.searchQuery||"").trim().toLowerCase();return t?String(n.textContent||"").toLowerCase().includes(t):!0}function li(){const n=Py();if(!n)return;const e=n.children.length;let t=0;[...n.children].forEach(a=>{a.hidden||(t+=1)});const i=s.console.pausedBuffer.length,r=[`${t}/${e} visible`];i>0&&r.push(`${i} buffered`),s.console.paused&&r.push("paused");const o=`${r.join(" | ")} lines`;Ct().forEach(a=>{if(a.meta&&(a.meta.textContent=o),a.pauseButton){a.pauseButton.dataset.paused=s.console.paused?"true":"false",a.pauseButton.setAttribute("aria-pressed",String(s.console.paused));const c=i>0?` (${i})`:"";a.pauseButton.textContent=s.console.paused?`Resume${c}`:"Pause"}})}function yl(){Ct().forEach(n=>{n.log&&(n.log.scrollTop=n.log.scrollHeight)})}function $f(n){n&&(n.hidden=!Ny(n))}function Sl(){Ct().forEach(n=>{const e=n.log;e&&[...e.children].forEach(t=>{$f(t)})}),li(),!s.console.paused&&s.console.autoscroll&&yl()}function Xf(n,e,{timestampMs:t=Date.now(),label:i=null,consoleType:r=null}={}){const o=Rf.has(e)?e:"info",a=String(i||o).trim().toUpperCase()||o.toUpperCase(),c=Fy(o,a,r),d=document.createElement("div");return d.className=`console-line console-line-${o}`,d.dataset.consoleType=c,d.dataset.consoleLevel=o,d.dataset.consoleLabel=a,d.dataset.consoleMessage=String(n||""),d.textContent=`[${Ly(t)}] [${a}] ${n}`,d}function qf(n){if(!n)return;const e=Ct().map(t=>t.log).filter(t=>!!t);e.length&&(e.forEach((t,i)=>{const r=i===0?n:n.cloneNode(!0);$f(r),t.appendChild(r)}),Dy(),li(),s.console.autoscroll&&!s.console.paused&&yl())}function Uy(){if(!s.console.pausedBuffer.length){li();return}const n=[...s.console.pausedBuffer];s.console.pausedBuffer.length=0,n.forEach(e=>{const t=Xf(e.message,e.level,e);qf(t)})}function Oy(n){const e=!!n;s.console.paused!==e&&(s.console.paused=e,e||Uy(),li())}function By(n){s.console.autoscroll=!!n,localStorage.setItem(Df,String(s.console.autoscroll)),Ct().forEach(e=>{e.autoscrollInput&&(e.autoscrollInput.checked=s.console.autoscroll)}),!s.console.paused&&s.console.autoscroll&&yl(),li()}function Gy(n){s.console.filter=zs(n),localStorage.setItem(If,s.console.filter),Ct().forEach(e=>{e.filterSelect&&(e.filterSelect.value=s.console.filter)}),Sl()}function ky(n){s.console.searchQuery=String(n||"").trim(),Ct().forEach(e=>{e.searchInput&&(e.searchInput.value=s.console.searchQuery)}),Sl()}function hr(){Ct().forEach(n=>{n.helperPanel&&(n.helperPanel.hidden=!0),n.settingsPanel&&(n.settingsPanel.hidden=!0),n.helperToggle&&n.helperToggle.setAttribute("aria-expanded","false"),n.settingsToggle&&n.settingsToggle.setAttribute("aria-expanded","false")})}function zy(n="main"){const e=Vf(n);if(!e?.helperPanel)return;const t=e.helperPanel.hidden;hr(),t&&(e.helperPanel.hidden=!1,e.helperToggle&&e.helperToggle.setAttribute("aria-expanded","true"))}function Hy(n="main"){const e=Vf(n);if(!e?.settingsPanel)return;const t=e.settingsPanel.hidden;hr(),t&&(e.settingsPanel.hidden=!1,e.settingsToggle&&e.settingsToggle.setAttribute("aria-expanded","true"))}function Vy(n){s.console.hideTemps=!!n,localStorage.setItem(Ff,String(s.console.hideTemps)),Ct().forEach(e=>{e.hideTempsInput&&(e.hideTempsInput.checked=s.console.hideTemps)}),Sl()}function Wy(n){s.console.rawOutput=!!n,localStorage.setItem(Nf,String(s.console.rawOutput)),Ct().forEach(e=>{e.rawOutputInput&&(e.rawOutputInput.checked=s.console.rawOutput)})}function vl(){const n=[...Hb,...Vb],e=new Set;return n.forEach(t=>{const i=String(t||"").trim().toUpperCase();i&&e.add(i)}),[...e].sort((t,i)=>t.localeCompare(i)).map(t=>({command:t,description:""}))}function jy(n){const e=new Map;return vl().forEach(t=>{e.set(t.command,t)}),(Array.isArray(n)?n:[]).forEach(t=>{const i=String(t?.command||"").trim().toUpperCase();if(!i)return;const r=e.get(i),o=String(t?.description||"").trim()||r?.description||"";e.set(i,{command:i,description:o})}),[...e.values()].sort((t,i)=>t.command.localeCompare(i.command))}function hs(){const n=Ct().map(t=>t.helperGrid).filter(t=>!!t);if(!n.length)return;const e=Array.isArray(s.console.helperEntries)?s.console.helperEntries:[];n.forEach(t=>{if(t.innerHTML="",s.console.helperLoading){const r=document.createElement("p");r.className="muted",r.textContent="Loading commands from Moonraker...",t.appendChild(r);return}if(!e.length){const r=document.createElement("p");r.className="muted",r.textContent="No helper commands available.",t.appendChild(r);return}const i=document.createDocumentFragment();e.forEach(r=>{const o=String(r?.command||"").trim();if(!o)return;const a=document.createElement("button");a.type="button",a.dataset.consoleHelper=o;const c=document.createElement("span");c.className="console-helper-command",c.textContent=o,a.appendChild(c);const d=String(r?.description||"").trim();if(d){const u=document.createElement("span");u.className="console-helper-description",u.textContent=d,a.appendChild(u)}d?a.title=`${o} - ${d}`:a.title=o,i.appendChild(a)}),t.appendChild(i)})}function Yf(n){const e=n?.result??n??{};let t=e;e&&typeof e=="object"&&(e.commands&&typeof e.commands=="object"?t=e.commands:e.gcode_help&&typeof e.gcode_help=="object"?t=e.gcode_help:e.help&&typeof e.help=="object"&&(t=e.help));const i=[];Array.isArray(t)?t.forEach(a=>{if(typeof a=="string"){const c=a.trim();c&&i.push({command:c,description:""});return}if(a&&typeof a=="object"){const c=String(a.command||a.name||a.cmd||"").trim();if(!c)return;const d=String(a.description||a.help||a.desc||"").trim();i.push({command:c,description:d})}}):t&&typeof t=="object"&&Object.entries(t).forEach(([a,c])=>{const d=String(a||"").trim();if(!d)return;let u="";typeof c=="string"?u=c.trim():c&&typeof c=="object"&&(u=String(c.help||c.description||c.desc||"").trim()),i.push({command:d,description:u})});const r=[],o=new Set;return i.forEach(a=>{const c=String(a.command||"").trim().toUpperCase();!c||o.has(c)||(o.add(c),r.push({command:c,description:String(a.description||"").trim()}))}),r.sort((a,c)=>a.command.localeCompare(c.command)),r}async function $y(){if(!s.client){hs();return}s.console.helperLoading=!0,hs();try{const n=await s.client.call("/printer/gcode/help"),e=Yf(n);s.console.helperEntries=jy(e),s.console.helperLoaded=!0}catch(n){const e=n?.message||String(n);s.console.helperLoaded||(s.console.helperEntries=vl()),pe(`Console helper load failed: ${e}`,"warn",{consoleType:"system",label:"SYSTEM"}),Ue.debug("Console helper load failed.",{error:e})}finally{s.console.helperLoading=!1,hs()}}function au(){Ct().forEach(n=>{n.log&&(n.log.innerHTML="")}),s.console.pausedBuffer.length=0,li()}function Xy(){localStorage.setItem(Pf,JSON.stringify(s.console.history))}function Kr(){s.console.historyIndex=s.console.history.length,s.console.historyDraft=""}function qy(n){const e=String(n||"").trim();if(e){for(s.console.history=s.console.history.filter(t=>t!==e),s.console.history.push(e);s.console.history.length>Uf;)s.console.history.shift();Xy(),Kr()}}function cu(n,e=null){const t=s.console.history,i=jf(e);if(!(!t.length||!i)){if(typeof s.console.historyIndex!="number"&&(s.console.historyIndex=t.length),n<0?(s.console.historyIndex===t.length&&(s.console.historyDraft=i.value),s.console.historyIndex=Math.max(0,s.console.historyIndex-1)):n>0&&(s.console.historyIndex=Math.min(t.length,s.console.historyIndex+1)),s.console.historyIndex>=t.length){Bc(s.console.historyDraft,i);return}if(Bc(t[s.console.historyIndex]||"",i),typeof i.setSelectionRange=="function"){const r=i.value.length;i.setSelectionRange(r,r)}}}function pe(n,e="info",{timestampMs:t=Date.now(),label:i=null,consoleType:r=null}={}){const o=String(n??"");if(!o.trim())return;const a={message:o,level:e,timestampMs:t,label:i,consoleType:r};if(s.console.paused){for(s.console.pausedBuffer.push(a);s.console.pausedBuffer.length>kb;)s.console.pausedBuffer.shift();li();return}const c=Xf(o,e,{timestampMs:t,label:i,consoleType:r});qf(c)}function Kf(n){return String(n||"").trim().replace(/\s+/g," ").toUpperCase()}function Yy(n){const e=Kf(n);if(!e)return;const t=s.console.pendingCommandCounts.get(e)||0;for(s.console.pendingCommandCounts.set(e,t+1);s.console.pendingCommandCounts.size>Gb;){const i=s.console.pendingCommandCounts.keys().next().value;if(!i)break;s.console.pendingCommandCounts.delete(i)}}function Ky(n){const e=Kf(n);if(!e)return!1;const t=s.console.pendingCommandCounts.get(e)||0;return t?(t<=1?s.console.pendingCommandCounts.delete(e):s.console.pendingCommandCounts.set(e,t-1),!0):!1}function Jy(n){bl(n).forEach(t=>{Yy(t),pe(t,"info",{label:"COMMAND",consoleType:"command"})})}function Jf(n){return String(n||"").trim().toLowerCase()}function Zy(n,e){return e==="command"?"command":e==="response"?"response":e==="warn"||e==="warning"?"system":e==="error"||n.startsWith("!!")||/^error/i.test(n)?"error":n.startsWith("//")||/^ok/i.test(n)?"response":"command"}function Qy(n){return n==="error"?{level:"error",label:"ERROR",consoleType:"error"}:n==="response"?{level:"info",label:"RESPONSE",consoleType:"response"}:n==="command"?{level:"info",label:"COMMAND",consoleType:"command"}:{level:"info",label:"SYSTEM",consoleType:"system"}}function eS(n){for(s.console.seenStoreEntryKeys.add(n);s.console.seenStoreEntryKeys.size>Bb;){const e=s.console.seenStoreEntryKeys.keys().next().value;if(!e)break;s.console.seenStoreEntryKeys.delete(e)}}function tS(n,e,t=""){const i=Number(n?.time),r=t||Jf(n?.type)||"log";return`${Number.isFinite(i)?i:0}|${r}|${e}`}function Zf(n){if(!Array.isArray(n)||!n.length)return;[...n].sort((t,i)=>(Number(t?.time)||0)-(Number(i?.time)||0)).forEach(t=>{const i=Jf(t?.type),r=bl(t?.message||"");if(!r.length)return;const o=Number.isFinite(Number(t?.time))?Number(t.time)*1e3:Date.now();r.forEach(a=>{const c=Zy(a,i),d=tS(t,a,c);if(s.console.seenStoreEntryKeys.has(d)||(eS(d),c==="command"&&Ky(a)))return;const u=Qy(c);pe(a,u.level,{timestampMs:o,label:u.label,consoleType:u.consoleType})})})}function nS(n){if(!n||!Array.isArray(n.params))return[];const e=[];return n.params.forEach(t=>{if(t){if(Array.isArray(t)){t.forEach(i=>{i&&typeof i=="object"&&e.push(i)});return}if(Array.isArray(t.gcode_store)){t.gcode_store.forEach(i=>{i&&typeof i=="object"&&e.push(i)});return}typeof t=="object"&&("message"in t||"type"in t)&&e.push(t)}}),e}async function iS(){if(s.client)try{const e=(await s.client.call(`/server/gcode_store?count=${Ub}`))?.result?.gcode_store;Array.isArray(e)&&Zf(e),s.console.storeSyncFailed=!1}catch(n){const e=n?.message||String(n);s.console.storeSyncFailed||pe(`Console sync failed: ${e}`,"warn",{consoleType:"system"}),s.console.storeSyncFailed=!0,Ue.debug("Console store sync failed.",{error:e})}}function ps(){us&&(clearInterval(us),us=null)}function rS(){if(ps(),!s.client)return;let n=!1;const e=async()=>{if(!(n||!s.client)){n=!0;try{await iS()}finally{n=!1}}};e(),us=setInterval(()=>{e()},Ob)}function lu(){s.console.seenStoreEntryKeys.clear(),s.console.pendingCommandCounts.clear(),s.console.storeSyncFailed=!1}function oS(){if(!l.sidebarToggle)return;const n=s.interface.sidebarCollapsed;l.sidebarToggle.dataset.state=n?"collapsed":"expanded",l.sidebarToggle.setAttribute("aria-expanded",String(!n)),l.sidebarToggle.setAttribute("aria-label",n?"Expand sidebar":"Collapse sidebar"),l.sidebarToggle.setAttribute("title",n?"Expand sidebar":"Collapse sidebar")}function sS(){if(!l.machineSideToggle)return;const n=!!s.interface.machineSideCollapsed;l.machineSideToggle.dataset.state=n?"collapsed":"expanded",l.machineSideToggle.setAttribute("aria-expanded",String(!n));const e=n?"Expand right column":"Collapse right column";l.machineSideToggle.setAttribute("aria-label",e),l.machineSideToggle.setAttribute("title",e)}function Hs(){document.documentElement.dataset.theme=s.interface.theme,document.documentElement.dataset.density=s.interface.density,document.body.classList.toggle("compact-mode",s.interface.compact),document.body.classList.toggle("sidebar-collapsed",s.interface.sidebarCollapsed),l.machineLayout?.classList.toggle("machine-side-collapsed",!!s.interface.machineSideCollapsed),oS(),sS()}function ht(){return!l.prettyGcodeCard||!l.prettyGcodeCanvas||l.prettyGcodeCard.classList.contains("card-hidden")?!1:s.activeView==="pretty-gcode"||s.activeView==="dashboard"}function Qf(){if(!l.prettyGcodeCard)return;if(s.activeView==="pretty-gcode"){l.prettyGcodeView&&l.prettyGcodeCard.parentElement!==l.prettyGcodeView&&l.prettyGcodeView.appendChild(l.prettyGcodeCard);return}const e=(s.dashboard.layout?.left||[]).includes(Pi)?l.dashboardColLeft:l.dashboardColRight;e&&l.prettyGcodeCard.parentElement!==e&&e.appendChild(l.prettyGcodeCard)}function El(){if(!l.dashboardColLeft||!l.dashboardColRight)return;s.dashboard.layout=ci(s.dashboard.layout);const n=s.activeView==="pretty-gcode",e=document.createDocumentFragment();s.dashboard.layout.left.forEach(i=>{if(n&&i===Pi)return;const r=document.getElementById(i);r&&e.appendChild(r)});const t=document.createDocumentFragment();s.dashboard.layout.right.forEach(i=>{if(n&&i===Pi)return;const r=document.getElementById(i);r&&t.appendChild(r)}),l.dashboardColLeft.appendChild(e),l.dashboardColRight.appendChild(t),Qf()}function Ml(){[[l.cardPrintProgress,s.dashboard.showPrintProgress],[l.cardTemperatures,s.dashboard.showTemperatures],[l.cardMotion,s.dashboard.showMotion],[l.cardQuickCommands,s.dashboard.showQuickCommands],[l.cardMacros,s.dashboard.showMacros],[l.cardMainCamera,s.dashboard.showMainCamera],[l.cardToolheadCamera,s.dashboard.showToolheadCamera],[l.cardDashboardConsole,s.dashboard.showConsole],[l.prettyGcodeCard,s.dashboard.showKlipperView]].forEach(([e,t])=>{e&&e.classList.toggle("card-hidden",!t)})}function aS(){[l.dashboardLayoutLeft,l.dashboardLayoutRight].forEach(n=>{n&&(n.classList.remove("drop-target"),n.querySelectorAll(".drop-target").forEach(e=>e.classList.remove("drop-target")))})}function cS(n){s.dashboard.layout.left=s.dashboard.layout.left.filter(e=>e!==n),s.dashboard.layout.right=s.dashboard.layout.right.filter(e=>e!==n)}function Ua(n,e,t=null){if(!n||e!=="left"&&e!=="right")return;cS(n);const i=s.dashboard.layout[e];if(t){const r=i.indexOf(t);r>=0?i.splice(r,0,n):i.push(n)}else i.push(n);s.dashboard.layout=ci(s.dashboard.layout)}function du(n){if(Cs)return Cs;const e=n.dataTransfer?.getData("text/plain")||"",[t]=e.split("|");return pl.includes(t)?t:null}function uu(n,e){if(!e)return;e.innerHTML="",(s.dashboard.layout[n]||[]).forEach(i=>{const r=document.createElement("li");r.className="layout-item",r.draggable=!0,r.dataset.cardId=i,r.dataset.column=n;const o=document.createElement("span");o.className="layout-handle",o.textContent="::";const a=document.createElement("span");a.className="layout-item-label",a.textContent=Pb[i]||i;const c=document.createElement("button");c.type="button",c.className="layout-move-column",c.textContent=n==="left"?"->":"<-",c.title=n==="left"?"Move to right column":"Move to left column",c.setAttribute("aria-label",c.title),c.addEventListener("click",u=>{u.preventDefault(),u.stopPropagation(),Ua(i,n==="left"?"right":"left"),Jr()});const d=document.createElement("div");d.className="layout-item-controls",d.appendChild(c),r.append(o,a,d),r.addEventListener("dragstart",u=>{Cs=i,r.classList.add("dragging"),u.dataTransfer&&(u.dataTransfer.effectAllowed="move",u.dataTransfer.setData("text/plain",`${i}|${n}`))}),r.addEventListener("dragend",()=>{r.classList.remove("dragging"),Cs=null,aS()}),r.addEventListener("dragover",u=>{u.preventDefault(),r.classList.add("drop-target"),e.classList.add("drop-target"),u.dataTransfer&&(u.dataTransfer.dropEffect="move")}),r.addEventListener("dragleave",()=>{r.classList.remove("drop-target")}),r.addEventListener("drop",u=>{u.preventDefault(),u.stopPropagation(),r.classList.remove("drop-target"),e.classList.remove("drop-target");const f=du(u);f&&(Ua(f,n,i),Jr())}),e.appendChild(r)}),e.ondragover=i=>{i.preventDefault(),e.classList.add("drop-target"),i.dataTransfer&&(i.dataTransfer.dropEffect="move")},e.ondragleave=i=>{i.target===e&&e.classList.remove("drop-target")},e.ondrop=i=>{i.preventDefault(),e.classList.remove("drop-target");const r=du(i);r&&(Ua(r,n),Jr())}}function Jr(){uu("left",l.dashboardLayoutLeft),uu("right",l.dashboardLayoutRight)}function lS(){Jr(),typeof l.dashboardLayoutDialog?.showModal=="function"&&l.dashboardLayoutDialog.showModal()}function Gc(){l.dashboardLayoutDialog?.open&&l.dashboardLayoutDialog.close()}function dS(){s.dashboard.layout=ci(s.dashboard.layout),localStorage.setItem("dashboard_layout",JSON.stringify(s.dashboard.layout)),localStorage.setItem("dashboard_layout_order",JSON.stringify(Bf(s.dashboard.layout))),El(),Ml(),Gc(),pe("Dashboard layout saved.")}function uS(){s.dashboard.layout=ci(bf),Jr()}function fS(){s.interface.sidebarCollapsed=!s.interface.sidebarCollapsed,localStorage.setItem("interface_sidebar_collapsed",String(s.interface.sidebarCollapsed)),Hs()}function hS(){s.interface.machineSideCollapsed=!s.interface.machineSideCollapsed,localStorage.setItem(ml,String(s.interface.machineSideCollapsed)),Hs()}function yr(n){const e=String(n||"").trim().toLowerCase();return e?["standby","ready","idle","operational"].includes(e)?"ready":e==="printing"?"printing":e==="paused"?"paused":["complete","completed"].includes(e)?"complete":["cancelled","canceled"].includes(e)?"cancelled":["error","shutdown"].includes(e)?"error":["disconnected","offline"].includes(e)?"disconnected":e==="connecting"?"connecting":"unknown":"unknown"}function ws(n){if(s.connectionStatus=String(n||"").trim().toLowerCase(),l.connectionPill.textContent=n,n==="connected"){l.connectionPill.style.borderColor="rgba(34, 197, 94, 0.7)",l.connectionText.textContent=s.moonrakerUrl;const e=l.printerState.dataset.state||"unknown";["unknown","connecting","disconnected","error"].includes(e)&&cr("ready")}else Cl(null),l.connectionPill.style.borderColor="rgba(148, 163, 184, 0.22)",n==="connecting"&&cr("connecting"),n==="disconnected"&&cr("disconnected"),n==="error"&&cr("error");ht()&&et()}function cr(n){const e=yr(n),t=Dc[e]||Dc.unknown;l.printerState.dataset.state=e,l.printerState.textContent=t.label,l.printerDot.style.background=t.color,Ds(),Rn(),As(s.printStatus.lastPrintStats)}function eh(n){const e=typeof n=="string"?n.trim():"",t=e||"No active file";s.printStatus.filename=e,l.statusFileName&&(l.statusFileName.textContent=t,l.statusFileName.title=t)}function pS(n=null){const e=n&&typeof n=="object"?n:s.printStatus.lastPrintStats||{},t=yr(e?.state||e?.status),i=yr(l.printerState?.dataset?.state||""),r=String(e?.filename||s.printStatus.filename||"").trim(),o=i==="printing"||i==="paused"||t==="printing"||t==="paused",a=t==="complete";return s.connectionStatus==="connected"&&!o&&a&&!!r&&!s.printStatus.fileClearedAfterComplete}function As(n=null){if(!l.statusClearFile)return;const e=pS(n);l.statusClearFile.hidden=!e,l.statusClearFile.disabled=!e}function th(){eh(""),Mi(""),l.progressBar&&(l.progressBar.style.width="0%"),l.progressText&&(l.progressText.textContent="0%"),l.statusEtp&&(l.statusEtp.textContent="--:--:--"),l.statusFinish&&(l.statusFinish.textContent="--:--"),Cl(null),l.statusSpeed&&(l.statusSpeed.textContent="-- mm/s"),l.statusFlowrate&&(l.statusFlowrate.textContent="--%"),l.statusFilament&&(l.statusFilament.textContent="--"),l.statusLayer&&(l.statusLayer.textContent="Layer: --/--")}function mS(){const n=s.printStatus.lastPrintStats||{};yr(n?.state||n?.status)==="complete"&&(s.printStatus.fileClearedAfterComplete=!0,th(),As(n))}function gS(n){return String(n||"").split("/").filter(e=>e.length>0).map(e=>encodeURIComponent(e)).join("/")}function nh(n){if(!n)return"";const e=gS(n);return`${s.moonrakerUrl}/server/files/gcodes/${e}`}function Mi(n){if(s.printStatus.thumbnailPath=n||"",!(!l.statusFileThumbWrap||!l.statusFileThumb)){if(!n){l.statusFileThumbWrap.hidden=!0,l.statusFileThumb.removeAttribute("src");return}l.statusFileThumb.src=nh(n),l.statusFileThumbWrap.hidden=!1}}function Tl(n){if(!Number.isFinite(n)||n<=0)return"--:--:--";const e=Math.max(0,Math.round(n)),t=Math.floor(e/3600),i=Math.floor(e%3600/60),r=e%60;return`${String(t).padStart(2,"0")}:${String(i).padStart(2,"0")}:${String(r).padStart(2,"0")}`}function xS(n){return!Number.isFinite(n)||n<0?"--:--":new Date(Date.now()+Math.round(n*1e3)).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",hour12:!1})}function ih(){Yr&&(clearInterval(Yr),Yr=null)}function rh(){if(!l.statusTimeLeft)return;const n=Number(s.printStatus.countdownTargetMs);if(!Number.isFinite(n)){l.statusTimeLeft.textContent="--:--:--";return}const e=Math.max((n-Date.now())/1e3,0);l.statusTimeLeft.textContent=Tl(e),e<=0&&ih()}function _S(){Yr||(Yr=setInterval(rh,1e3))}function Cl(n){if(l.statusTimeLeft){if(!Number.isFinite(n)||n<0){s.printStatus.countdownTargetMs=null,l.statusTimeLeft.textContent="--:--:--",ih();return}s.printStatus.countdownTargetMs=Date.now()+Math.round(n*1e3),rh(),_S()}}function oh(n){const e=Number(n?.print_duration);if(Number.isFinite(e)&&e>=0)return e;const t=Number(n?.total_duration);return Number.isFinite(t)&&t>=0?t:0}function wl(n){const e=typeof n=="string"?n.trim():"";if(!e)return null;const t=s.printStatus.metadataByFile.get(e);return t&&typeof t=="object"?t:null}function bS(n){const e=wl(s.printStatus.filename),t=Number(e?.estimatedTime);if(Number.isFinite(t)&&t>0)return t;const i=Number(s.printStatus.lastVirtualSd?.progress),r=oh(n);return Number.isFinite(i)&&i>0&&r>0?r/i:null}function ms(n){if(!l.statusEtp||!l.statusFinish)return;const e=bS(n),t=oh(n),i=Number.isFinite(e)?Math.max(e-t,0):null;l.statusEtp.textContent=Tl(e),l.statusFinish.textContent=xS(i),Cl(i)}function kc(n){const e=n&&typeof n=="object"?n:{},i={...s.printStatus.lastVirtualSd||{},...e};return s.printStatus.lastVirtualSd=i,i}function zc(n){const e=Number(n?.progress),t=Number.isFinite(e)?Math.max(0,Math.min(100,Math.round(e*100))):0;l.progressBar&&(l.progressBar.style.width=`${t}%`),l.progressText&&(l.progressText.textContent=`${t}%`)}function fu(n){const e=Number(n);return!Number.isFinite(e)||e<0?"--":`${Math.round(e)}`}function Ln(n){const e=Number(n);return Number.isFinite(e)?e:null}function cn(n){const e=Ln(n);return!Number.isFinite(e)||e<=0?null:e}function yS(){const n=s.printStatus.lastGcodeMove?.gcode_position,e=s.printStatus.lastGcodeMove?.position,t=[Array.isArray(n)?n[2]:null,Array.isArray(e)?e[2]:null,s.printStatus.lastGcodeMove?.gcode_z,s.printStatus.lastGcodeMove?.position_z];for(const i of t){const r=Ln(i);if(Number.isFinite(r)&&r>=0)return r}return null}function SS(n,e){const t=cn(e?.layerHeight);if(!Number.isFinite(t))return null;const i=cn(e?.firstLayerHeight)??t,r=yS();if(!Number.isFinite(r))return null;let o=1;return r>i+t*.5&&(o=1+Math.round((r-i)/t)),!Number.isFinite(o)||o<1?null:Number.isFinite(n)&&n>0?Math.min(o,n):o}function vS(n){const e=Ln(s.printStatus.lastVirtualSd?.progress);if(!Number.isFinite(e)||e<=0||!Number.isFinite(n)||n<=0)return null;const t=Math.max(0,Math.min(1,e)),i=Math.max(1,Math.round(t*n));return Math.min(i,n)}function gs(n){if(!l.statusLayer)return;const e=wl(s.printStatus.filename),t=Ln(n?.info?.current_layer??n?.current_layer),i=cn(n?.info?.total_layer??n?.total_layer),r=cn(e?.totalLayers),o=i??r,a=t??SS(o,e)??vS(o);l.statusLayer.textContent=`Layer: ${fu(a)}/${fu(o)}`}function ES(n){const e=n&&typeof n=="object"?n:{},t=s.printStatus.lastPrintStats||{},i={...t,...e},r=t?.info&&typeof t.info=="object"?t.info:{},o=e?.info&&typeof e.info=="object"?e.info:{};return(Object.keys(r).length||Object.keys(o).length)&&(i.info={...r,...o}),s.printStatus.lastPrintStats=i,i}function MS(n){ms(n)}function TS(n){return!Number.isFinite(n)||n<0?"--%":`${Math.round(n*100)}%`}function CS(n){return!Number.isFinite(n)||n<0?"--":n>=1e3?`${(n/1e3).toFixed(2)} m`:`${Math.round(n)} mm`}function wS(n){return!Number.isFinite(n)||n<0?"-- mm/s":n>=100?`${Math.round(n)} mm/s`:`${n.toFixed(1)} mm/s`}function AS(n,e=null,t=null,i=null){e&&typeof e=="object"&&(s.printStatus.lastGcodeMove={...s.printStatus.lastGcodeMove,...e}),t&&typeof t=="object"&&(s.printStatus.lastMotionReport={...s.printStatus.lastMotionReport,...t}),i&&typeof i=="object"&&(s.printStatus.lastToolhead={...s.printStatus.lastToolhead,...i});const r=Number(s.printStatus.lastMotionReport?.live_velocity),o=Number(s.printStatus.lastGcodeMove?.speed),a=Number.isFinite(r)&&r>=0?r:o,c=Number(s.printStatus.lastGcodeMove?.extrude_factor),d=Number(n?.filament_used);Number.isFinite(d)&&d>=0&&(s.printStatus.lastFilamentUsed=d),l.statusSpeed&&(l.statusSpeed.textContent=wS(a)),l.statusFlowrate&&(l.statusFlowrate.textContent=TS(c)),l.statusFilament&&(l.statusFilament.textContent=CS(s.printStatus.lastFilamentUsed))}function sh(n){const e=Array.isArray(n?.thumbnails)?n.thumbnails:[];if(!e.length)return"";const t=e.filter(r=>typeof r?.relative_path=="string"&&r.relative_path);return t.length&&t.map(r=>{const o=Number(r.width),a=Number.isFinite(o)?Math.abs(o-96):9999;return{thumb:r,delta:a}}).sort((r,o)=>r.delta-o.delta)[0]?.thumb?.relative_path||""}async function LS(n){const e=typeof n=="string"?n.trim():"";if(!e||!s.client){Mi("");return}if(s.printStatus.metadataByFile.has(e)){const i=wl(e);Mi(i?.thumbnailPath||""),ms(s.printStatus.lastPrintStats),gs(s.printStatus.lastPrintStats);return}const t=++s.printStatus.metadataRequestId;try{const r=(await s.client.call(`/server/files/metadata?filename=${encodeURIComponent(e)}`))?.result||{},o=sh(r),a=Number(r.estimated_time),c=Number(r.layer_count),d={thumbnailPath:o,estimatedTime:Number.isFinite(a)&&a>0?a:null,totalLayers:Number.isFinite(c)&&c>0?Math.round(c):null,layerHeight:cn(r.layer_height),firstLayerHeight:cn(r.first_layer_height)};if(s.printStatus.metadataByFile.set(e,d),t!==s.printStatus.metadataRequestId||s.printStatus.filename!==e)return;Mi(d.thumbnailPath||""),ms(s.printStatus.lastPrintStats),gs(s.printStatus.lastPrintStats)}catch(i){const r=i?.message||String(i);if(Ue.debug("Print file metadata load skipped.",{filename:e,error:r}),s.printStatus.metadataByFile.set(e,{thumbnailPath:"",estimatedTime:null,totalLayers:null,layerHeight:null,firstLayerHeight:null}),t!==s.printStatus.metadataRequestId||s.printStatus.filename!==e)return;Mi(""),ms(s.printStatus.lastPrintStats),gs(s.printStatus.lastPrintStats)}}function Hc(n,e=null,t=null,i=null){const r=ES(n),o=typeof r.filename=="string"?r.filename:"",a=o.trim(),c=yr(r?.state||r?.status);c!=="complete"&&(s.printStatus.fileClearedAfterComplete=!1);const d=c==="complete"&&s.printStatus.fileClearedAfterComplete?"":o,u=d.trim(),f=c==="complete"&&s.printStatus.fileClearedAfterComplete,p=yn();if(f){th(),Rn(),Ds(),As(r),p||Yt({skipRender:!ht()}),s.activeView==="files"&&Yc();return}if(eh(d),MS(r),AS(r,e,t,i),gs(r),Rn(),Ds(),As(r),p||Yt({skipRender:!ht()}),s.activeView==="files"&&Yc(),!u){Mi(""),a||(!p&&s.prettyGcode.activeFile?Di(""):ht()&&et());return}s.printStatus.metadataByFile.has(u)||Mi(""),LS(u),!p&&(ht()||s.prettyGcode.activeFile)&&Di(u)}function ah(n){Of(n)&&(l.navItems.forEach(e=>e.classList.toggle("active",e.dataset.view===n)),l.views.forEach(e=>e.classList.toggle("active",e.id===`view-${n}`)),l.pageTitle.textContent=yf[n]||n.slice(0,1).toUpperCase()+n.slice(1),s.activeView=n,Qf(),localStorage.setItem(Sf,n),ht()&&et())}function Ls(n){const e=Number(n),t=_f.find(i=>Math.abs(i-e)<1e-6);return Number.isFinite(t)?t:10}function Vs(n,e=3){const t=Number(n);if(!Number.isFinite(t)||Math.abs(t)<1e-6)return"0";const i=Number(t.toFixed(e));return String(i)}function Ii(n){const e=Number(n);return Number.isFinite(e)?Math.max(0,Math.min(100,Math.round(e))):100}function RS(n){const e=Ii(n);return Math.round(e/100*255)}function PS(n){const e=String(n||"").trim().toLowerCase().replace(/[^xyz]/g,"");return new Set(e.split("").filter(Boolean))}function Oa(n,e){n instanceof HTMLElement&&(n.classList.toggle("controls-homing-ready",!!e),n.classList.toggle("controls-homing-pending",!e))}function ch(){const n=String(l.printerState?.dataset?.state||"unknown").trim().toLowerCase(),e=s.connectionStatus==="connected",t=e&&!["unknown","connecting","disconnected","error"].includes(n);return{connected:e,operational:t,printing:n==="printing"}}function co(n){const e=s.controls?.[n];e&&(clearTimeout(e),s.controls[n]=null)}function hu(n,e){co(n),s.controls[n]=setTimeout(()=>{e instanceof HTMLInputElement&&document.activeElement!==e&&(e.value=""),s.controls[n]=null},5e3)}function jr(n){const{operational:e,printing:t}=ch(),i=!!n&&e&&!t;s.controls.keyboardActive=i}function lh(n,{persist:e=!0}={}){const t=Ls(n);s.controls.distance=t,e&&localStorage.setItem("controls_jog_distance",String(t)),dh()}function dh(){const n=Ls(s.controls.distance);l.controlsDistanceButtons.forEach(e=>{const t=Ls(e.dataset.jogDistance),i=Math.abs(t-n)<1e-6;e.classList.toggle("active",i),e.setAttribute("aria-pressed",i?"true":"false")})}function IS(n={}){const e=Object.keys(n||{}),t=[];e.forEach(r=>{const o=String(r||"").trim().toLowerCase();if(!o)return;if(o==="extruder"){t.push(0);return}const a=o.match(/^extruder(\d+)$/);if(!a)return;const c=Number(a[1]);Number.isFinite(c)&&c>=0&&t.push(c)}),t.length||t.push(0);const i=[...new Set(t)].sort((r,o)=>r-o);s.controls.tools=i.map(r=>({label:r===0?"Hotend":`Tool ${r}`,command:`T${r}`})),Rn()}function DS(){if(!l.controlsToolRow||!l.controlsToolSelect)return;const n=Array.isArray(s.controls.tools)&&s.controls.tools.length?s.controls.tools:[{label:"Hotend",command:"T0"}];l.controlsToolSelect.innerHTML="",n.forEach(e=>{const t=document.createElement("option");t.value=e.command,t.textContent=e.label,l.controlsToolSelect.appendChild(t)}),l.controlsToolRow.hidden=n.length<=1}function Rn(){if(!l.controlsCard)return;const{operational:n,printing:e}=ch(),t=!n||e,i=!n,r=PS(s.printStatus.lastToolhead?.homed_axes),o=r.has("x"),a=r.has("y"),c=r.has("z"),d=o&&a,u=d&&c;if(dh(),DS(),l.controlsExtrusionAmount&&(document.activeElement!==l.controlsExtrusionAmount&&(l.controlsExtrusionAmount.value=Vs(s.controls.extrusionAmount,2)),l.controlsExtrusionAmount.disabled=t),l.controlsFeedrateInput){if(!l.controlsFeedrateInput.value){const f=Number(s.printStatus.lastGcodeMove?.speed_factor);l.controlsFeedrateInput.placeholder=Number.isFinite(f)?String(Math.max(1,Math.round(f*100))):"100"}l.controlsFeedrateInput.disabled=i}if(l.controlsFlowrateInput){if(!l.controlsFlowrateInput.value){const f=Number(s.printStatus.lastGcodeMove?.extrude_factor);l.controlsFlowrateInput.placeholder=Number.isFinite(f)?String(Math.max(1,Math.round(f*100))):"100"}l.controlsFlowrateInput.disabled=i}if(l.controlsFanSpeed){const f=Ii(s.controls.fanSpeed);s.controls.fanSpeed=f,document.activeElement!==l.controlsFanSpeed&&(l.controlsFanSpeed.value=String(f)),l.controlsFanSpeed.disabled=i}l.controlsFanSpeedValue&&(l.controlsFanSpeedValue.textContent=`${Ii(s.controls.fanSpeed)}%`),l.controlsJogButtons.forEach(f=>{f.disabled=t;const p=String(f.dataset.controlJogAxis||"").trim().toLowerCase();Oa(f,p==="x"?o:p==="y"?a:p==="z"?c:u)}),l.controlsHomeButtons.forEach(f=>{f.disabled=t;const p=String(f.dataset.controlHome||"").trim().toLowerCase();Oa(f,p==="xy"?d:p==="z"?c:u)}),l.controlsDistanceButtons.forEach(f=>{f.disabled=t}),l.controlsFeedrateSet&&(l.controlsFeedrateSet.disabled=i),l.controlsFlowrateSet&&(l.controlsFlowrateSet.disabled=i),l.controlsExtrude&&(l.controlsExtrude.disabled=t),l.controlsRetract&&(l.controlsRetract.disabled=t),l.controlsToolSelect&&(l.controlsToolSelect.disabled=i),l.controlsToolSet&&(l.controlsToolSet.disabled=i),l.controlsMotorsOff&&(l.controlsMotorsOff.disabled=t,Oa(l.controlsMotorsOff,u)),l.controlsFanOn&&(l.controlsFanOn.disabled=i),l.controlsFanOff&&(l.controlsFanOff.disabled=i),t&&jr(!1)}function FS(n,e){const t=String(n||"").trim().toUpperCase();if(!["X","Y","Z"].includes(t))return"";const i=Number(e);if(!Number.isFinite(i)||i===0)return"";const r=Ls(s.controls.distance)*i;return`G91
G0 ${t}${Vs(r,3)} F6000
G90`}async function NS(n,e){const t=FS(n,e);t&&await nn(t,{actionLabel:`Jog ${String(n||"").toUpperCase()}${Number(e)>0?"+":"-"}`})}async function US(n){const e=String(n).trim().toLowerCase();let t="G28";e==="xy"?t="G28 X Y":e==="z"&&(t="G28 Z"),await nn(t,{actionLabel:`Home ${e||"all"}`})}async function pu(){const n=Number(l.controlsFeedrateInput?.value);if(!Number.isFinite(n)||n<1)return;await nn(`M220 S${Math.round(n)}`,{actionLabel:"Set feed rate modifier",successMessage:`Feed rate set to ${Math.round(n)}%.`})&&l.controlsFeedrateInput&&(l.controlsFeedrateInput.value="",co("feedRateResetter"))}async function mu(){const n=Number(l.controlsFlowrateInput?.value);if(!Number.isFinite(n)||n<1)return;await nn(`M221 S${Math.round(n)}`,{actionLabel:"Set flow rate modifier",successMessage:`Flow rate set to ${Math.round(n)}%.`})&&l.controlsFlowrateInput&&(l.controlsFlowrateInput.value="",co("flowRateResetter"))}function Vc(){if(!l.controlsExtrusionAmount)return;const n=Number(l.controlsExtrusionAmount.value);if(!Number.isFinite(n)||n<=0){l.controlsExtrusionAmount.value=Vs(s.controls.extrusionAmount,2);return}s.controls.extrusionAmount=Math.max(.1,Math.min(1e3,n)),localStorage.setItem("controls_extrusion_amount",String(s.controls.extrusionAmount))}async function gu(n){Vc();const e=Number(n);if(!Number.isFinite(e)||e===0)return;const t=s.controls.extrusionAmount*(e>0?1:-1),i=`M83
G1 E${Vs(t,3)} F300
M82`;await nn(i,{actionLabel:e>0?"Extrude":"Retract"})}async function OS(){const n=String(l.controlsToolSelect?.value||"").trim();n&&await nn(n,{actionLabel:`Switch tool (${n})`})}async function Ba(n,{persist:e=!0,successMessage:t=null}={}){const i=Ii(n);return s.controls.fanSpeed=i,e&&localStorage.setItem("controls_fan_speed",String(i)),Rn(),await nn(`M106 S${RS(i)}`,{actionLabel:"Set fan speed",successMessage:t})}function BS(n){if(!s.controls.keyboardActive)return;const e=n.target;if(e instanceof HTMLElement&&["INPUT","SELECT","TEXTAREA"].includes(e.tagName))return;let t="",i=!0;switch(n.key){case"ArrowLeft":t="control-xdec";break;case"ArrowUp":t="control-yinc";break;case"ArrowRight":t="control-xinc";break;case"ArrowDown":t="control-ydec";break;case"1":t="control-distance01",i=!1;break;case"2":t="control-distance1",i=!1;break;case"3":t="control-distance10",i=!1;break;case"4":t="control-distance100",i=!1;break;case"PageUp":case"w":case"W":t="control-zinc";break;case"PageDown":case"s":case"S":t="control-zdec";break;case"Home":t="control-xyhome";break;case"End":t="control-zhome";break;default:if(n.code==="Numpad1")t="control-distance01",i=!1;else if(n.code==="Numpad2")t="control-distance1",i=!1;else if(n.code==="Numpad3")t="control-distance10",i=!1;else if(n.code==="Numpad4")t="control-distance100",i=!1;else return}const r=document.getElementById(t);if(!(r instanceof HTMLButtonElement)||r.disabled){n.preventDefault();return}n.preventDefault(),i&&(r.classList.add("controls-jog-btn-active"),setTimeout(()=>{r.classList.remove("controls-jog-btn-active")},150)),r.click()}function Wc(n,e,t){if(n.innerHTML="",!e.enabled){const r=document.createElement("p");r.className="muted",r.textContent=`${t} disabled in Settings.`,n.appendChild(r);return}if(!e.url){const r=document.createElement("p");r.className="muted",r.textContent=`Set ${t} URL in Settings.`,n.appendChild(r);return}if(e.renderMode===gn.IFRAME){const r=document.createElement("iframe");r.src=e.url,r.title=t,r.loading="lazy",n.appendChild(r);return}const i=document.createElement("img");i.src=e.url,i.alt=t,i.referrerPolicy="no-referrer",i.addEventListener("error",()=>{n.innerHTML=`<p class="muted">${t} failed to load.</p>`}),n.appendChild(i)}function uh(){Wc(l.mainCameraFrame,s.camera,"Main Camera"),Wc(l.toolheadCameraFrame,s.toolheadCamera,"Toolhead Cam");const n=s.camera.enabled&&!!s.camera.url,e=s.toolheadCamera.enabled&&!!s.toolheadCamera.url;l.mainCameraFullscreen.disabled=!n,l.toolheadCameraFullscreen.disabled=!e}function xu(n){return typeof n!="number"||Number.isNaN(n)?"--.-°C":`${n.toFixed(1)}°C`}function $r(n){return typeof n!="number"||Number.isNaN(n)?"0":String(Math.round(Math.max(0,n)))}function fh(n,e){const t=n==="hotend"?320:130,i=Number(e);return Number.isFinite(i)?Math.round(Math.max(0,Math.min(t,i))):null}function _u(n,e){return!Number.isFinite(e)||e<=.5?"off":Number.isFinite(n)&&n<e-2?"heating":"on"}function xs(){cs&&(clearInterval(cs),cs=null)}function GS(){if(xs(),!s.client)return;let n=!1;const e=async()=>{if(!(!s.client||n)){n=!0;try{const i=(await s.client.call("/printer/objects/query?extruder&heater_bed&print_stats&virtual_sdcard&gcode_move&motion_report&toolhead"))?.result?.status||{};$c(i);const r=kc(i?.virtual_sdcard||null);zc(r),Hc(i?.print_stats||{},i?.gcode_move||null,i?.motion_report||null,i?.toolhead||null)}catch(t){const i=t?.message||String(t);Ue.debug("Status poll skipped.",{error:i})}finally{n=!1}}};e(),cs=setInterval(e,$b)}function mt(n,e=null){const t=Number(n);return Number.isFinite(t)?t:e}function kS(n){const e=mt(n,null);return Number.isFinite(e)?e.toFixed(2):"--"}function Yo(n){const e=mt(n,null);return!Number.isFinite(e)||e<0?"--":e>=1024*1024*1024?`${(e/(1024*1024*1024)).toFixed(1)} GB`:e>=1024*1024?`${(e/(1024*1024)).toFixed(1)} MB`:e>=1024?`${(e/1024).toFixed(1)} kB`:`${Math.round(e)} B`}function zS(n){const e=mt(n,null);return!Number.isFinite(e)||e<0?"--":e>=1024*1024?`${(e/(1024*1024)).toFixed(1)} MB/s`:e>=1024?`${(e/1024).toFixed(1)} kB/s`:`${e.toFixed(1)} B/s`}function Ko(n,{preferKiB:e=!1,allowHeuristic:t=!0}={}){const i=mt(n,null);return!Number.isFinite(i)||i<=0?null:e||t&&i<32*1024*1024?i*1024:i}function HS(n){const e=mt(n,null);return!Number.isFinite(e)||e<=0?"--":e>=1e6?`${Math.round(e/1e6)} MHz`:e>=1e3?`${Math.round(e/1e3)} kHz`:`${Math.round(e)} Hz`}function Zr(n){if(typeof n=="string")return n.trim()||"";if(!n||typeof n!="object")return"";const e=[n.git_version,n.version,n.software_version];for(const t of e)if(typeof t=="string"&&t.trim())return t.trim();return""}function VS(n){const e=n?.last_stats&&typeof n.last_stats=="object"?n.last_stats:{};return{load:mt(e.mcu_task_avg??n?.mcu_task_avg,null),awake:mt(e.mcu_awake??n?.mcu_awake,null),freq:mt(e.freq??n?.freq,null)}}function WS(n){const e=Array.isArray(n?.ip_addresses)?n.ip_addresses:[];if(!e.length)return"--";const t=e.find(i=>String(i?.family||"").toLowerCase().includes("ipv4")&&!i?.is_link_local)||e.find(i=>!i?.is_link_local)||e[0];return String(t?.address||"").trim()||"--"}function Ga(n,e,t,i){const r=Number.isFinite(t)?Math.max(0,Math.min(100,t)):0;n&&n.style.setProperty("--gauge-value",r.toFixed(2)),e&&(e.textContent=i)}function Jo(n){if(!l.machineSystemStatus)return;const e=String(n||"").trim();l.machineSystemStatus.textContent=e,l.machineSystemStatus.hidden=!e}function si(){const n=s.machineLoads||gl(),e=n.mcuStatus||{},t=n.systemStats||{},i=n.procStats||{},r=n.systemInfo||{},o=String(e?.name||"mcu").trim()||"mcu",a=String(e?.mcu_constants?.MCU||e?.mcu_constants?.MCU_TYPE||e?.mcu_type||"unknown").trim(),c=Zr(e?.mcu_version)||Zr(n.klipperVersion)||"--",d=VS(e),u=Number.isFinite(d.load)?d.load.toFixed(2):"--",f=Number.isFinite(d.awake)?d.awake.toFixed(2):"--",p=HS(d.freq);l.machineMcuName&&(l.machineMcuName.textContent=o),l.machineMcuChip&&(l.machineMcuChip.textContent=`(${a||"unknown"})`),l.machineMcuVersion&&(l.machineMcuVersion.textContent=`Version: ${c}`),l.machineMcuStats&&(l.machineMcuStats.textContent=`Load: ${u}, Awake: ${f}, Freq: ${p}`);const h=r?.cpu_info&&typeof r.cpu_info=="object"?r.cpu_info:{},m=r?.distribution&&typeof r.distribution=="object"?r.distribution:{},_=String(h.cpu_desc||h.arch||h.model||"").trim(),b=mt(h.bits??h.address_bits,null),x=[];_&&x.push(_),Number.isFinite(b)&&x.push(`${Math.round(b)}bit`);const g=x.length?`(${x.join(", ")})`:"(unknown)",w=Zr(n.klipperVersion)||c,T=String(m.name||m.pretty_name||m.id||"").trim(),L=String(m.version||"").trim(),R=String(m.codename||"").trim(),M=T?`${T}${L?` ${L}`:""}${R?` (${R})`:""}`:"Unknown",A=mt(t?.sysload,null),F=mt(i?.cpu_temp??t?.cpu_temp,null);let E=mt(i?.system_cpu_usage?.cpu,null);!Number.isFinite(E)&&Number.isFinite(A)&&(E=Math.max(0,Math.min(100,A*100)));const S=Ko(h?.total_memory??h?.mem_total??i?.total_memory??i?.mem_total,{preferKiB:!1}),P=Ko(t?.memavail??i?.mem_available??i?.memavail,{preferKiB:!0});let O=null,B=mt(i?.memory_usage?.percent??i?.memory_percent,null);Number.isFinite(S)&&Number.isFinite(P)?(O=Math.max(S-P,0),B=S>0?O/S*100:null):Number.isFinite(S)&&Number.isFinite(B)&&(O=S*Math.max(0,Math.min(100,B))/100);const W=Number.isFinite(O)&&Number.isFinite(S)?`${Yo(O)} / ${Yo(S)}`:"--",V=Number.isFinite(F)?`${Math.round(F)}°C`:"--";if(l.machineHostArch&&(l.machineHostArch.textContent=g),l.machineHostVersion&&(l.machineHostVersion.textContent=`Version: ${w}`),l.machineHostOs&&(l.machineHostOs.textContent=`OS: ${M}`),l.machineHostStats&&(l.machineHostStats.textContent=`Load: ${kS(A)}, Mem: ${W}, Temp: ${V}`),l.machineHostNetworkList){l.machineHostNetworkList.innerHTML="";const Q=i?.network&&typeof i.network=="object"?i.network:{},$=r?.network&&typeof r.network=="object"?r.network:{},ie=[...new Set([...Object.keys($),...Object.keys(Q)])].sort();if(ie.length)ie.forEach(ne=>{const xe=Q[ne]||{},je=$[ne]||{},tt=WS(je);let nt=mt(xe?.bandwidth??xe?.tx_bandwidth??xe?.rx_bandwidth,null);const it=mt(xe?.rx_bandwidth,null),q=mt(xe?.tx_bandwidth,null);!Number.isFinite(nt)&&(Number.isFinite(it)||Number.isFinite(q))&&(nt=(Number.isFinite(it)?it:0)+(Number.isFinite(q)?q:0));const J=Ko(xe?.rx_bytes??xe?.received_bytes,{preferKiB:!1,allowHeuristic:!1}),me=Ko(xe?.tx_bytes??xe?.transmitted_bytes,{preferKiB:!1,allowHeuristic:!1}),De=document.createElement("p");De.textContent=`${ne} (${tt}): Bandwidth: ${zS(nt)}`;const Se=document.createElement("p");Se.className="muted",Se.textContent=`Received: ${Yo(J)}, Transmitted: ${Yo(me)}`,l.machineHostNetworkList.append(De,Se)});else{const ne=document.createElement("p");ne.className="muted",ne.textContent="No network interfaces reported.",l.machineHostNetworkList.appendChild(ne)}}const X=e&&Object.keys(e).length?1:0;Ga(l.machineDevicesGauge,l.machineDevicesValue,X>0?14:0,String(X)),Ga(l.machineCpuGauge,l.machineCpuGaugeValue,E,Number.isFinite(E)?`${Math.round(E)}`:"--"),Ga(l.machineMemGauge,l.machineMemGaugeValue,B,Number.isFinite(B)?`${Math.round(B)}`:"--"),s.client?n.lastError?Jo(`System load update issue: ${n.lastError}`):n.lastUpdatedMs?Jo(""):Jo("Loading system stats..."):Jo("Connect to Moonraker to load system stats.")}async function jc({fetchStatic:n=!1}={}){if(!s.client){si();return}const e=s.machineLoads,t=n||!e.systemInfo?s.client.getMachineSystemInfo():Promise.resolve(null),i=n||!e.klipperVersion?s.client.getServerInfo():Promise.resolve(null),[r,o,a,c]=await Promise.allSettled([s.client.getMcuAndSystemStats(),s.client.getMachineProcStats(),t,i]),d=[];let u=!1;if(r.status==="fulfilled"){const f=r.value?.result?.status||{};e.mcuStatus=f?.mcu||null,e.systemStats=f?.system_stats||null,u=!0}else d.push(r.reason?.message||String(r.reason));if(o.status==="fulfilled"?(e.procStats=o.value?.result||null,u=!0):d.push(o.reason?.message||String(o.reason)),a.status==="fulfilled"?a.value&&(e.systemInfo=a.value?.result?.system_info||a.value?.result||null,u=!0):d.push(a.reason?.message||String(a.reason)),c.status==="fulfilled"){if(c.value){const f=c.value?.result||{},p=Zr(f?.klippy_version)||Zr(f?.software_version);p&&(e.klipperVersion=p),u=!0}}else d.push(c.reason?.message||String(c.reason));u&&(e.lastUpdatedMs=Date.now()),e.lastError=d.length?d[0]:"",d.length&&Ue.debug("Machine loads poll completed with warnings.",{errorCount:d.length,firstError:d[0]}),si()}function _s(){ls&&(clearInterval(ls),ls=null)}function jS(){if(_s(),!s.client)return;let n=!1;const e=async()=>{if(!(!s.client||n)){n=!0;try{await jc()}catch(t){const i=t?.message||String(t);s.machineLoads.lastError=i,Ue.debug("Machine loads poll failed.",{error:i}),si()}finally{n=!1}}};e(),ls=setInterval(e,Xb)}function $S(){s.machineLoads=gl(),si()}function XS(n){const e=String(n||"").trim().toLowerCase();return e==="triggered"||e==="closed"?"triggered":e==="open"?"open":"unknown"}function qS(n){if(!n||typeof n!="object")return{};const e=Object.entries(n).filter(([i])=>!!String(i||"").trim()).filter(([,i])=>["string","number","boolean"].includes(typeof i)),t={};return e.forEach(([i,r])=>{t[String(i).trim()]=String(r)}),t}function YS(n){const e=["x","y","z","probe","z_probe"];return[...n].sort((t,i)=>{const r=t.name.toLowerCase(),o=i.name.toLowerCase(),a=e.indexOf(r),c=e.indexOf(o),d=a>=0?a:e.length+(r[0]==="x"?0:r[0]==="y"?1:r[0]==="z"?2:3),u=c>=0?c:e.length+(o[0]==="x"?0:o[0]==="y"?1:o[0]==="z"?2:3);return d!==u?d-u:r.localeCompare(o)})}function nr(n,e="info"){const t=String(n||"").trim();[l.machineEndstopsStatus,l.controlsEndstopsStatus].filter(Boolean).forEach(r=>{r.textContent=t,r.dataset.level=e})}function Cn(){const n=s.endstops||xl(),e=s.connectionStatus==="connected",t=YS(Object.entries(n.values||{}).map(([r,o])=>({name:r,raw:String(o||"").trim(),state:XS(o)})));[{query:l.machineEndstopsQuery,summary:l.machineEndstopsSummary,list:l.machineEndstopsList},{query:l.controlsEndstopsQuery,summary:l.controlsEndstopsSummary,list:l.controlsEndstopsList}].forEach(r=>{if(r.query&&(r.query.disabled=!e||n.queryInFlight,r.query.textContent=n.queryInFlight?"Querying...":"Query"),r.list)if(r.list.innerHTML="",t.length)t.forEach(o=>{const a=document.createElement("div");a.className="machine-endstop-item";const c=document.createElement("span");c.className="machine-endstop-name",c.textContent=o.name;const d=document.createElement("span");d.className=`machine-endstop-pill machine-endstop-pill-${o.state}`,d.textContent=o.state==="triggered"?"TRIGGERED":o.state==="open"?"open":"unknown",a.append(c,d),r.list.appendChild(a)});else{const o=document.createElement("p");o.className="muted",o.textContent=e?"No endstop data available yet.":"Endstop data is unavailable while disconnected.",r.list.appendChild(o)}if(r.summary)if(!t.length)r.summary.textContent="Press Query to check current endstop states.";else{const o=t.filter(f=>f.state==="triggered").length,a=t.filter(f=>f.state==="open").length,c=t.length-o-a,d=[`${o} triggered`,`${a} open`];c>0&&d.push(`${c} unknown`);const u=n.lastUpdatedMs?` | Last query: ${new Date(n.lastUpdatedMs).toLocaleTimeString()}`:"";r.summary.textContent=`${d.join(" | ")}${u}`}}),s.client?e?n.queryInFlight?nr("Querying endstop state...","info"):n.lastError?nr(`Endstop query failed: ${n.lastError}`,"error"):n.lastUpdatedMs?nr("Endstop query complete.","info"):nr("Press Query to request endstop state from Moonraker.","info"):nr("Moonraker disconnected. Reconnect to query endstops.","warn"):nr("Connect to Moonraker to query endstops.","warn")}async function Rs({source:n="user",silent:e=!1}={}){if(!s.client||s.connectionStatus!=="connected")return Cn(),null;if(s.endstops.queryInFlight)return null;s.endstops.queryInFlight=!0,s.endstops.lastError="",Cn();try{const t=await s.client.getEndstopsStatus(),i=t?.result&&typeof t.result=="object"?t.result:t,r=qS(i);return s.endstops.values=r,s.endstops.lastUpdatedMs=Date.now(),s.endstops.lastError="",n==="user"&&pe("Endstops queried.","info"),Cn(),r}catch(t){const i=t?.message||String(t);return s.endstops.lastError=i,e||pe(`Endstop query failed: ${i}`,"error"),Cn(),null}finally{s.endstops.queryInFlight=!1,Cn()}}function KS(){s.endstops=xl(),Cn()}function Al(n){return String(n||"").trim().replace(/\\/g,"/").replace(/^\/+/,"").replace(/^logs\//i,"")}function JS(n){const e=Number(n);return!Number.isFinite(e)||e<=0?null:e>1e12?e:e*1e3}function ZS(n){const e=n?.result,t=Array.isArray(e)?e:Array.isArray(e?.files)?e.files:[],i=new Map;return t.forEach(r=>{if(!r||typeof r=="object"&&String(r.type||"").toLowerCase()==="directory")return;const o=typeof r=="string"?r:typeof r.path=="string"?r.path:[r.dirname,r.filename].filter(Boolean).join("/"),a=Al(o);if(!a||a.endsWith("/"))return;const c=Number(r?.size),d=Number.isFinite(c)&&c>=0?c:null,u=JS(r?.modified??r?.mtime??r?.date??r?.time);i.set(a,{relativePath:a,path:`logs/${a}`,size:d,modifiedMs:u})}),[...i.values()].sort((r,o)=>{const a=Number(r.modifiedMs)||0,c=Number(o.modifiedMs)||0;return a!==c?c-a:r.relativePath.localeCompare(o.relativePath)})}function bu(n){const e=Number(n);return!Number.isFinite(e)||e<=0?"--":new Date(e).toLocaleString()}function yi(n,e="info"){l.machineLogFilesStatus&&(l.machineLogFilesStatus.textContent=String(n||"").trim(),l.machineLogFilesStatus.dataset.level=e)}async function QS(n){const e=Al(n);if(!e||!s.client||s.connectionStatus!=="connected")return!1;s.logFiles.actionInFlight=!0,Pt();try{const t=await s.client.getFileBlob("logs",e),i=e.split("/").pop()||"log.txt",r=URL.createObjectURL(t),o=document.createElement("a");return o.href=r,o.download=i,document.body.appendChild(o),o.click(),o.remove(),URL.revokeObjectURL(r),pe(`Log downloaded: logs/${e}`,"info"),s.logFiles.lastError="",!0}catch(t){const i=t?.message||String(t);return s.logFiles.lastError=i,pe(`Log download failed (${e}): ${i}`,"error"),!1}finally{s.logFiles.actionInFlight=!1,Pt()}}async function ev(n){const e=Al(n);if(!e||!s.client||s.connectionStatus!=="connected"||!window.confirm(`Delete log file logs/${e}? This cannot be undone.`))return!1;s.logFiles.actionInFlight=!0,Pt();try{return await s.client.deleteLogFile(e),pe(`Log deleted: logs/${e}`,"warn"),s.logFiles.lastError="",await xo({source:"delete",silent:!0}),!0}catch(i){const r=i?.message||String(i);return s.logFiles.lastError=r,pe(`Log delete failed (${e}): ${r}`,"error"),Pt(),!1}finally{s.logFiles.actionInFlight=!1,Pt()}}async function tv(){if(!s.client||s.connectionStatus!=="connected")return!1;const n=[...s.logFiles.files||[]];if(!n.length||!window.confirm(`Delete all ${n.length} log file${n.length===1?"":"s"}? This cannot be undone.`))return!1;s.logFiles.actionInFlight=!0,Pt();let t=0,i=0;try{for(const r of n)try{await s.client.deleteLogFile(r.relativePath),t+=1}catch{i+=1}return s.logFiles.lastError="",pe(`Log cleanup complete: ${t} deleted${i?`, ${i} failed`:""}.`,i?"warn":"info"),await xo({source:"delete",silent:!0}),i===0}catch(r){const o=r?.message||String(r);return s.logFiles.lastError=o,pe(`Delete all logs failed: ${o}`,"error"),Pt(),!1}finally{s.logFiles.actionInFlight=!1,Pt()}}function Pt(){const n=s.logFiles||_l(),e=s.connectionStatus==="connected",t=Array.isArray(n.files)?n.files:[],i=n.isLoading||n.actionInFlight;if(l.machineLogFilesRefresh&&(l.machineLogFilesRefresh.disabled=!e||i,l.machineLogFilesRefresh.textContent=n.isLoading?"Loading...":"Refresh"),l.machineLogFilesDeleteAll&&(l.machineLogFilesDeleteAll.disabled=!e||i||!t.length),l.machineLogFilesSummary)if(!t.length)l.machineLogFilesSummary.textContent="No log files loaded.";else{const r=t.reduce((d,u)=>d+(Number(u.size)||0),0),o=t.reduce((d,u)=>Math.max(d,Number(u.modifiedMs)||0),0),a=o>0?` | Latest: ${bu(o)}`:"",c=r>0?` | Total: ${vr(r)}`:"";l.machineLogFilesSummary.textContent=`${t.length} log file${t.length===1?"":"s"}${c}${a}`}if(l.machineLogFilesList)if(l.machineLogFilesList.innerHTML="",t.length)t.forEach(r=>{const o=document.createElement("article");o.className="machine-log-file-item";const a=document.createElement("div");a.className="machine-log-file-meta";const c=document.createElement("p");c.className="machine-log-file-name",c.textContent=r.relativePath;const d=document.createElement("p");d.className="machine-log-file-detail muted";const u=vr(r.size)||"--",f=bu(r.modifiedMs);d.textContent=`${u} | Modified: ${f}`,a.append(c,d);const p=document.createElement("div");p.className="machine-log-file-row-actions";const h=document.createElement("button");h.type="button",h.className="machine-log-file-btn",h.textContent="Download",h.disabled=i,h.addEventListener("click",async()=>{await QS(r.relativePath)});const m=document.createElement("button");m.type="button",m.className="machine-log-file-btn danger",m.textContent="Delete",m.disabled=i,m.addEventListener("click",async()=>{await ev(r.relativePath)}),p.append(h,m),o.append(a,p),l.machineLogFilesList.appendChild(o)});else{const r=document.createElement("p");r.className="muted",r.textContent=e?"No log files reported in logs/.":"Log files are unavailable while disconnected.",l.machineLogFilesList.appendChild(r)}s.client?e?n.isLoading?yi("Loading log files...","info"):n.actionInFlight?yi("Running log file action...","warn"):n.lastError?yi(`Log files action failed: ${n.lastError}`,"error"):n.lastUpdatedMs?yi(`Last refreshed: ${new Date(n.lastUpdatedMs).toLocaleTimeString()}`,"info"):yi("Press Refresh to load log files.","info"):yi("Moonraker disconnected. Reconnect to manage logs.","warn"):yi("Connect to Moonraker to manage logs.","warn")}async function xo({source:n="user",silent:e=!1}={}){if(!s.client||s.connectionStatus!=="connected")return Pt(),[];if(s.logFiles.isLoading)return s.logFiles.files||[];s.logFiles.isLoading=!0,s.logFiles.lastError="",Pt();try{const t=await s.client.getLogFiles(),i=ZS(t);return s.logFiles.files=i,s.logFiles.lastError="",s.logFiles.lastUpdatedMs=Date.now(),n==="user"&&pe(`Loaded ${i.length} log file${i.length===1?"":"s"}.`,"info"),Pt(),i}catch(t){const i=t?.message||String(t);return s.logFiles.lastError=i,e||pe(`Log files load failed: ${i}`,"error"),Pt(),[]}finally{s.logFiles.isLoading=!1,Pt()}}function nv(){s.logFiles=_l(),Pt()}function qn(n){return String(n||"").trim().toLowerCase()}function Ci(n){const e=qn(n);return e?e==="klipper"?"Klipper":e==="moonraker"?"Moonraker":e==="fluidd"?"Fluidd":e==="mainsail"?"Mainsail":e==="system"?"System":e.split(/[\s_-]+/).filter(Boolean).map(t=>t.slice(0,1).toUpperCase()+t.slice(1)).join(" "):"Unknown"}function Qr(n){return Array.isArray(n)?n:[]}function iv(){const n=s.updateManager.versionInfo;if(!n||typeof n!="object")return[];const e=Object.entries(n).map(([t,i])=>{if(!i||typeof i!="object")return null;const r=String(i.name||t).trim();return r?{...i,name:r}:null}).filter(Boolean);return e.sort((t,i)=>{const r=qn(t.name),o=qn(i.name),a=$o.indexOf(r),c=$o.indexOf(o),d=a>=0?a:$o.length+10,u=c>=0?c:$o.length+10;return d!==u?d-u:r.localeCompare(o)}),e}function hh(n){if(!n||typeof n!="object")return!1;const e=qn(n.name),t=qn(n.configured_type);if(e==="system"||t==="system"){const d=mt(n.package_count,0);return Number.isFinite(d)&&d>0}const i=String(n.remote_hash||"").trim().toLowerCase(),r=String(n.current_hash||"").trim().toLowerCase();if(i==="update-available"||i&&r&&i!==r||Qr(n.commits_behind).length>0)return!0;const a=String(n.remote_version||"").trim(),c=String(n.version||"").trim();return!!(a&&c&&a!==c)}function rv(n){if(!n||typeof n!="object"||qn(n.name)==="system")return!1;const t=qn(n.configured_type);return t==="git_repo"||t==="zip"||t==="web"||n.is_valid===!1||n.is_dirty===!0||n.corrupt===!0}function ov(n){return!n||typeof n!="object"?!1:!!String(n.rollback_version||"").trim()}function sv(n){if(!n||typeof n!="object")return[];const e=[];return Qr(n.warnings).forEach(t=>{const i=String(t||"").trim();i&&e.push(i)}),Qr(n.anomalies).forEach(t=>{const i=String(t||"").trim();i&&e.push(i)}),Qr(n.recovery_messages).forEach(t=>{const i=String(t||"").trim();i&&e.push(i)}),[...new Set(e)]}function av(n){const e=Number(n);return Number.isFinite(e)?new Date(e).toLocaleTimeString():"--:--:--"}function Ot(n,e="info"){const t=String(n||"").trim();s.updateManager.statusMessage=t,l.machineUpdateStatus&&(l.machineUpdateStatus.textContent=t,l.machineUpdateStatus.dataset.level=e)}function wi(n,e="info"){const t=String(n||"").trim();t&&(s.updateManager.activityLog.push({time:Date.now(),message:t,level:e}),s.updateManager.activityLog.length>Zd&&s.updateManager.activityLog.splice(0,s.updateManager.activityLog.length-Zd),qt())}function cv(){if(!l.machineUpdateLog)return;l.machineUpdateLog.innerHTML="";const n=s.updateManager.activityLog;if(!n.length){const t=document.createElement("p");t.className="muted",t.textContent="No update activity yet.",l.machineUpdateLog.appendChild(t);return}n.slice(-60).forEach(t=>{const i=document.createElement("p");i.className="machine-update-log-line",t.level==="error"&&i.classList.add("machine-update-log-line-error"),i.textContent=`[${av(t.time)}] ${t.message}`,l.machineUpdateLog.appendChild(i)}),l.machineUpdateLog.scrollTop=l.machineUpdateLog.scrollHeight}function ka({label:n,kind:e="default",disabled:t=!1,onClick:i}){const r=document.createElement("button");return r.type="button",r.className=`machine-update-btn machine-update-btn-${e}`,r.textContent=n,r.disabled=t,r.addEventListener("click",i),r}function lv(n,e){const t=document.createElement("article");t.className="machine-update-item";const i=document.createElement("div");i.className="machine-update-item-head";const r=document.createElement("div");r.className="machine-update-title-wrap";const o=document.createElement("h4");o.textContent=Ci(n.name),r.appendChild(o);const a=document.createElement("span");a.className="machine-update-pill";const c=hh(n),d=n.is_valid!==!1,u=mt(n.package_count,0);d?u>0&&qn(n.name)==="system"?(a.classList.add("machine-update-pill-warn"),a.textContent=`${Math.round(u)} packages`):c?(a.classList.add("machine-update-pill-warn"),a.textContent="Update available"):(a.classList.add("machine-update-pill-ok"),a.textContent="Up to date"):(a.classList.add("machine-update-pill-danger"),a.textContent="Invalid"),r.appendChild(a),i.appendChild(r);const f=document.createElement("div");f.className="machine-update-item-actions";const p=String(n.name||"").trim();p&&c&&f.appendChild(ka({label:"Update",kind:"accent",disabled:e||!d,onClick:async()=>{await mh(p)}})),p&&rv(n)&&f.appendChild(ka({label:"Recover",kind:"warning",disabled:e,onClick:async()=>{const R=Ci(p);if(!window.confirm(`Recover ${R}?`))return;const A=window.confirm(`Use hard recover for ${R}?

Press OK for hard recover, or Cancel for standard recover.`);await hv(p,{hard:A})}})),p&&ov(n)&&f.appendChild(ka({label:"Rollback",kind:"default",disabled:e,onClick:async()=>{const R=Ci(p);window.confirm(`Rollback ${R} to ${n.rollback_version}?`)&&await pv(p)}})),f.childElementCount&&i.appendChild(f),t.appendChild(i);const h=document.createElement("p");h.className="machine-update-detail";const m=String(n.version||n.full_version_string||"--").trim()||"--",_=String(n.remote_version||"--").trim()||"--",b=String(n.configured_type||"").trim(),x=String(n.channel||"").trim(),g=String(n.branch||"").trim();qn(n.name)==="system"?h.textContent=`Package updates: ${Number.isFinite(u)?Math.max(0,Math.round(u)):0}`:h.textContent=`Current: ${m}  |  Latest: ${_}`,t.appendChild(h);const w=[];b&&w.push(`Type: ${b}`),x&&w.push(`Channel: ${x}`),g&&w.push(`Branch: ${g}`);const T=Qr(n.commits_behind).length;if(T>0&&w.push(`${T} commit${T===1?"":"s"} behind`),n.is_dirty===!0&&w.push("Dirty working tree"),n.is_valid===!1&&w.push("Invalid state"),w.length){const R=document.createElement("p");R.className="machine-update-meta",R.textContent=w.join(" | "),t.appendChild(R)}const L=sv(n);if(L.length){const R=document.createElement("div");R.className="machine-update-issues",L.slice(0,3).forEach(M=>{const A=document.createElement("p");A.textContent=M,R.appendChild(A)}),t.appendChild(R)}return t}function qt(){const n=s.updateManager,e=iv(),t=e.filter(r=>hh(r)).length,i=!!s.client;if(l.machineUpdateRefresh&&(l.machineUpdateRefresh.disabled=!i||n.actionInFlight),l.machineUpdateUpgradeAll&&(l.machineUpdateUpgradeAll.disabled=!i||n.actionInFlight||n.busy||!t),l.machineUpdateSummary&&(i?e.length?t?l.machineUpdateSummary.textContent=`${t} updater${t===1?"":"s"} need attention.`:l.machineUpdateSummary.textContent=`All ${e.length} updater${e.length===1?"":"s"} are up to date.`:l.machineUpdateSummary.textContent="No updaters reported by Moonraker.":l.machineUpdateSummary.textContent="Connect to Moonraker to check update status."),l.machineUpdateRate){const r=mt(n.githubRequestsRemaining,null),o=mt(n.githubRateLimit,null),a=mt(n.githubLimitResetTime,null);if(Number.isFinite(r)&&Number.isFinite(o)){const c=Number.isFinite(a)?` | Reset: ${new Date(a*1e3).toLocaleTimeString()}`:"";l.machineUpdateRate.textContent=`GitHub API: ${Math.round(r)}/${Math.round(o)}${c}`}else l.machineUpdateRate.textContent=""}if(l.machineUpdateList)if(l.machineUpdateList.innerHTML="",i)if(e.length){const r=n.actionInFlight||n.busy;e.forEach(o=>{l.machineUpdateList.appendChild(lv(o,r))})}else{const r=document.createElement("p");r.className="muted",r.textContent="No updater entries found in Moonraker update status.",l.machineUpdateList.appendChild(r)}else{const r=document.createElement("p");r.className="muted",r.textContent="Update controls are available after Moonraker connects.",l.machineUpdateList.appendChild(r)}cv(),n.statusMessage||(i?n.lastError?Ot(`Update manager error: ${n.lastError}`,"error"):n.busy?Ot("Update process running...","warn"):n.lastUpdatedMs?Ot(`Last checked: ${new Date(n.lastUpdatedMs).toLocaleTimeString()}`,"info"):Ot("Loading update status...","info"):Ot("Connect to Moonraker to use Update Manager.","warn"))}function ph(n,{keepStatusMessage:e=!1}={}){const t=n&&typeof n=="object"?n:{},i=t.version_info&&typeof t.version_info=="object"?t.version_info:{};s.updateManager.busy=!!t.busy,s.updateManager.versionInfo=i,s.updateManager.githubRateLimit=mt(t.github_rate_limit,null),s.updateManager.githubRequestsRemaining=mt(t.github_requests_remaining,null),s.updateManager.githubLimitResetTime=mt(t.github_limit_reset_time,null),s.updateManager.lastError="",s.updateManager.lastUpdatedMs=Date.now(),e||(s.updateManager.statusMessage="")}async function Lr({forceRefresh:n=!1,source:e="poll",name:t=null}={}){if(!s.client)return qt(),null;try{const i=n?await s.client.refreshMachineUpdates(t):await s.client.getMachineUpdateStatus(),r=i?.result&&typeof i.result=="object"?i.result:i;return ph(r),n&&e!=="poll"&&(Ot("Update status refreshed.","info"),wi("Update status refreshed.")),qt(),r}catch(i){const r=i?.message||String(i);throw s.updateManager.lastError=r,e!=="poll"?(pe(`Update manager refresh failed: ${r}`,"error"),wi(`Refresh failed: ${r}`,"error"),Ot(`Update manager refresh failed: ${r}`,"error")):s.updateManager.lastUpdatedMs||Ot(`Update manager refresh failed: ${r}`,"error"),qt(),i}}function bs(){ds&&(clearInterval(ds),ds=null)}function dv(){if(bs(),!s.client)return;let n=!1;const e=async()=>{if(!(!s.client||n)){n=!0;try{await Lr({forceRefresh:!1,source:"poll"})}catch(t){Ue.debug("Update manager poll failed.",{error:t?.message||String(t)})}finally{n=!1}}};e(),ds=setInterval(e,qb)}function uv(){s.updateManager=Hf(),qt()}async function Ll(n,e){if(!s.client)return Ot("Connect to Moonraker to run updater actions.","warn"),!1;if(s.updateManager.actionInFlight)return Ot("Another update action is currently running.","warn"),!1;s.updateManager.actionInFlight=!0,s.updateManager.activeActionLabel=n,Ot(`${n} requested...`,"warn"),wi(`${n} requested.`),qt();try{await e(),wi(`${n} accepted.`);try{await Lr({forceRefresh:!1,source:"action"})}catch(t){const i=t?.message||String(t);Ue.debug("Update manager post-action refresh failed.",{actionLabel:n,error:i})}return!0}catch(t){const i=t?.message||String(t);return s.updateManager.lastError=i,wi(`${n} failed: ${i}`,"error"),pe(`${n} failed: ${i}`,"error"),Ot(`${n} failed: ${i}`,"error"),qt(),!1}finally{s.updateManager.actionInFlight=!1,s.updateManager.activeActionLabel="",qt()}}async function fv(){await Lr({forceRefresh:!0,source:"user"})}async function mh(n=null){const e=n?`Update ${Ci(n)}`:"Update all components";return Ll(e,async()=>{await s.client.upgradeMachineUpdates(n)})}async function hv(n,{hard:e=!1}={}){const t=`${e?"Hard recover":"Recover"} ${Ci(n)}`;return Ll(t,async()=>{await s.client.recoverMachineUpdater(n,{hard:e})})}async function pv(n){const e=`Rollback ${Ci(n)}`;return Ll(e,async()=>{await s.client.rollbackMachineUpdater(n)})}function mv(n){const[e]=Array.isArray(n?.params)?n.params:[];if(!e||typeof e!="object")return;const t=String(e.application||e.name||"update").trim(),i=Ci(t),r=String(e.message||"").trim(),o=e.complete===!0,a=e.error===!0;r&&wi(`${i}: ${r}`,a?"error":"info"),a?(s.updateManager.lastError=r||"Update manager reported an error.",Ot(s.updateManager.lastError,"error")):o?(s.updateManager.busy=!1,s.updateManager.actionInFlight=!1,s.updateManager.activeActionLabel="",Ot(`${i} update completed.`,"info"),Lr({forceRefresh:!1,source:"notify"})):(s.updateManager.busy=!0,r&&Ot(`${i}: ${r}`,"warn")),qt()}function gv(n){const[e]=Array.isArray(n?.params)?n.params:[];!e||typeof e!="object"||(ph(e),Ot("Update status refreshed.","info"),wi("Moonraker pushed refreshed update status."),qt())}function $c(n,{recordHistory:e=!0}={}){const t=n?.extruder||{},i=n?.heater_bed||{};if(typeof t.temperature=="number"&&(s.temperatures.hotend.current=t.temperature),typeof i.temperature=="number"&&(s.temperatures.bed.current=i.temperature),typeof t.target=="number"&&(s.temperatures.hotend.target=t.target),typeof i.target=="number"&&(s.temperatures.bed.target=i.target),e){const r={time:Date.now(),hotendCurrent:s.temperatures.hotend.current,hotendTarget:s.temperatures.hotend.target,bedCurrent:s.temperatures.bed.current,bedTarget:s.temperatures.bed.target},o=s.temperatures.history,a=o[o.length-1];a&&r.time-a.time<Yb?o[o.length-1]={...r,time:a.time}:o.push(r);const c=o[o.length-1];Ty(c)}lo()}function xv(){localStorage.setItem("temperature_show_chart",String(s.temperatures.chart.show)),localStorage.setItem("temperature_hide_host_sensors",String(s.temperatures.chart.hideHostSensors)),localStorage.setItem("temperature_hide_monitors",String(s.temperatures.chart.hideMonitors)),localStorage.setItem("temperature_autoscale_chart",String(s.temperatures.chart.autoscale))}function ti(){!l.tempSettingsMenu||!l.tempSettingsToggle||(l.tempSettingsMenu.hidden=!0,l.tempSettingsToggle.setAttribute("aria-expanded","false"))}function zn(n=null){[l.tempHotendTargetMenu,l.tempBedTargetMenu].forEach(e=>{!e||e===n||(e.hidden=!0)})}function _v(){return`
    <svg class="target-preset-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2v20M4.93 6l14.14 12M19.07 6 4.93 18M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
    </svg>
  `}function Xc(n){const e=n==="hotend"?l.tempHotendTargetMenu:l.tempBedTargetMenu;if(!e)return;e.innerHTML="";const t=Math.round(s.temperatures[n].target||0);Wb[n].forEach(i=>{const r=document.createElement("button");r.type="button",r.className="target-preset-item",r.innerHTML=`${_v()}<span>${i}°C</span>`,i===t&&r.classList.add("target-preset-active"),r.addEventListener("click",async o=>{o.preventDefault(),await _h(n,i),zn()}),e.appendChild(r)})}function gh(){Xc("hotend"),Xc("bed")}function yu(n){const e=n==="hotend"?l.tempHotendTargetMenu:l.tempBedTargetMenu;if(!e)return;Xc(n);const t=e.hidden;zn(),e.hidden=!t}function bv(){if(l.temperatureChartWrap){if(l.temperatureChartWrap.classList.toggle("is-hidden",!s.temperatures.chart.show),!s.temperatures.chart.show){s.temperatures.chart.hoverIndex=null,l.temperatureChartTooltip&&(l.temperatureChartTooltip.hidden=!0);return}Sr()}}function yv(){const n=s.temperatures.hotend.current,e=s.temperatures.bed.current,t=s.temperatures.hotend.target,i=s.temperatures.bed.target;l.tempHotend&&(l.tempHotend.textContent=xu(n)),l.tempBed&&(l.tempBed.textContent=xu(e)),l.tempHotendTarget&&(l.tempHotendTarget.textContent=$r(t)),l.tempBedTarget&&(l.tempBedTarget.textContent=$r(i)),l.tempHotendState&&(l.tempHotendState.textContent=_u(n,t)),l.tempBedState&&(l.tempBedState.textContent=_u(e,i)),l.tempHotendTargetInput&&document.activeElement!==l.tempHotendTargetInput&&(l.tempHotendTargetInput.value=$r(t)),l.tempBedTargetInput&&document.activeElement!==l.tempBedTargetInput&&(l.tempBedTargetInput.value=$r(i)),gh()}function Su(n,e){const t=Number.isFinite(n)?n:0,i=Number.isFinite(e)?e:0,r=i>0?Math.round(t/i*100):0;return`${t.toFixed(1)} / ${i.toFixed(1)}°C [${Math.max(0,r)}%]`}function Rl(n,e){const t=(e-n.startTime)/(n.endTime-n.startTime||1);return n.left+t*n.width}function xh(n,e){const t=Number.isFinite(e)?e:0,i=Math.max(0,Math.min(1,t/n.yMax));return n.top+(1-i)*n.height}function Sv(n,e){n.save(),n.strokeStyle="rgba(148, 163, 184, 0.22)",n.lineWidth=1;const t=5;for(let r=0;r<=t;r+=1){const o=e.top+e.height*r/t;n.beginPath(),n.moveTo(e.left,o),n.lineTo(e.left+e.width,o),n.stroke();const a=e.yMax-e.yMax*r/t;n.fillStyle="rgba(203, 213, 225, 0.72)",n.font='13px "JetBrains Mono"',n.textAlign="right",n.textBaseline="middle",n.fillText(String(Math.round(a)),e.left-8,o)}const i=9;for(let r=0;r<=i;r+=1){const o=e.left+e.width*r/i;n.beginPath(),n.moveTo(o,e.top),n.lineTo(o,e.top+e.height),n.stroke();const a=e.startTime+(e.endTime-e.startTime)*r/i;n.fillStyle="rgba(148, 163, 184, 0.68)",n.font='13px "JetBrains Mono"',n.textAlign="center",n.textBaseline="top";const c=new Date(a).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});n.fillText(c,o,e.top+e.height+10)}n.restore()}function vu(n,e,t,i,r){n.save(),n.strokeStyle=r,n.lineWidth=3,n.lineCap="round",n.lineJoin="round",n.beginPath(),n.rect(e.left,e.top,e.width,e.height),n.clip();let o=!1,a=0,c=null;t.forEach(d=>{const u=d[i];if(!Number.isFinite(u))return;const f=Rl(e,d.time),p=xh(e,u);c={x:f,y:p},a+=1,o?n.lineTo(f,p):(n.beginPath(),n.moveTo(f,p),o=!0)}),o&&n.stroke(),a===1&&c&&(n.fillStyle=r,n.beginPath(),n.arc(c.x,c.y,3.2,0,Math.PI*2),n.fill()),n.restore()}function vv(n){if(!l.temperatureChartTooltip)return;const{hoverIndex:e}=s.temperatures.chart,t=Number.isInteger(e)?n.history[e]:null;if(!t){l.temperatureChartTooltip.hidden=!0;return}l.temperatureTooltipTime&&(l.temperatureTooltipTime.textContent=new Date(t.time).toLocaleTimeString()),l.temperatureTooltipHotend&&(l.temperatureTooltipHotend.textContent=Su(t.hotendCurrent,t.hotendTarget)),l.temperatureTooltipBed&&(l.temperatureTooltipBed.textContent=Su(t.bedCurrent,t.bedTarget));const i=Rl(n,t.time);l.temperatureChartTooltip.hidden=!1;const r=l.temperatureChartTooltip.offsetWidth||248,o=Math.max(8,Math.min(n.canvasWidth-r-8,i+12));l.temperatureChartTooltip.style.left=`${o}px`,l.temperatureChartTooltip.style.top=`${Math.max(8,n.top+10)}px`}function Ev(n,e){let t=0,i=n.length;for(;t<i;){const r=Math.floor((t+i)/2);n[r].time<e?t=r+1:i=r}return t}function Mv(n,e){let t=0,i=n.length;for(;t<i;){const r=Math.floor((t+i)/2);n[r].time<=e?t=r+1:i=r}return t-1}function Tv(n,e,t){if(!n.length)return[];let i=Ev(n,e),r=Mv(n,t);return i>0&&(i-=1),r<n.length-1&&(r+=1),i<0&&(i=0),r>=n.length&&(r=n.length-1),r<i?[]:n.slice(i,r+1)}function Sr(){const n=l.temperatureChart;if(!n||!s.temperatures.chart.show)return;const e=s.temperatures.history,t=s.temperatures.chart,i=Kb,r=e[e.length-1]?.time||Date.now(),o=e[0]?.time||r-i,a=Math.max(0,r-o),c=Math.max(0,a-i),d=Math.max(0,Math.min(t.offsetMs||0,c));d!==t.offsetMs&&(t.offsetMs=d);const u=r-d,f=Math.max(o,u-i),p=Math.max(u,f+i),h=Tv(e,f,p),m=n.getContext("2d");if(!m)return;const _=Math.max(10,n.clientWidth||10),b=Math.max(10,n.clientHeight||10),x=window.devicePixelRatio||1,g=Math.round(_*x),w=Math.round(b*x);(n.width!==g||n.height!==w)&&(n.width=g,n.height=w),m.setTransform(x,0,0,x,0,0),m.clearRect(0,0,_,b);const T=46,L=12,R=10,M=40,A=Math.max(16,_-T-L),F=Math.max(16,b-R-M),E=h.reduce((W,V)=>{const X=Math.max(Number.isFinite(V.hotendCurrent)?V.hotendCurrent:0,Number.isFinite(V.hotendTarget)?V.hotendTarget:0,Number.isFinite(V.bedCurrent)?V.bedCurrent:0,Number.isFinite(V.bedTarget)?V.bedTarget:0);return Math.max(W,X)},0),S=t.autoscale?Math.max(60,Math.ceil((E+12)/10)*10):jb,P={canvasWidth:_,canvasHeight:b,left:T,top:R,width:A,height:F,startTime:f,endTime:p,yMax:S,history:h,windowMs:i,maxOffsetMs:c};Sv(m,P);const O=dy();vu(m,P,h,"hotendCurrent",O.hotend),vu(m,P,h,"bedCurrent",O.bed);const B=Number.isInteger(t.hoverIndex)?h[t.hoverIndex]:null;if(!B&&t.hoverIndex!==null&&(t.hoverIndex=null),B){const W=Rl(P,B.time);m.save(),m.strokeStyle="rgba(184, 198, 219, 0.62)",m.setLineDash([6,6]),m.beginPath(),m.moveTo(W,R),m.lineTo(W,R+F),m.stroke(),m.setLineDash([]),[[B.hotendCurrent,O.hotend],[B.bedCurrent,O.bed]].forEach(([V,X])=>{if(!Number.isFinite(V))return;const Q=xh(P,V);m.fillStyle=X,m.beginPath(),m.arc(W,Q,4.5,0,Math.PI*2),m.fill(),m.lineWidth=2,m.strokeStyle="rgba(15, 23, 42, 0.9)",m.stroke()}),m.restore()}t.layout=P,vv(P)}function lo(){yv(),bv()}function Cv(n){const e=s.temperatures.chart.layout;if(!e||!l.temperatureChart)return;const t=l.temperatureChart.getBoundingClientRect(),i=n.clientX-t.left,r=n.clientY-t.top,o=i>=e.left&&i<=e.left+e.width,a=r>=e.top&&r<=e.top+e.height;if(!o||!a){s.temperatures.chart.hoverIndex!==null&&(s.temperatures.chart.hoverIndex=null,Sr());return}const c=(i-e.left)/e.width,d=e.startTime+c*(e.endTime-e.startTime);let u=null,f=Number.POSITIVE_INFINITY;e.history.forEach((p,h)=>{const m=Math.abs(p.time-d);m<f&&(f=m,u=h)}),u!==s.temperatures.chart.hoverIndex&&(s.temperatures.chart.hoverIndex=u,Sr())}function wv(n){const e=s.temperatures.chart.layout;if(!e||e.maxOffsetMs<=0)return;const t=Math.abs(n.deltaX)>Math.abs(n.deltaY)?n.deltaX:n.deltaY;if(!Number.isFinite(t)||t===0)return;n.preventDefault();const i=Math.max(15*1e3,Math.round(e.windowMs*Jb)),r=Math.min(12,Math.max(1,Math.abs(t)/100)),o=n.shiftKey?8:1,a=Math.round(i*r*o),c=Math.max(0,Math.min(e.maxOffsetMs,s.temperatures.chart.offsetMs+Math.sign(t)*a));c!==s.temperatures.chart.offsetMs&&(s.temperatures.chart.offsetMs=c,s.temperatures.chart.hoverIndex=null,Sr())}function Av(){s.temperatures.chart.hoverIndex!==null&&(s.temperatures.chart.hoverIndex=null,Sr())}async function _h(n,e){const t=fh(n,e);if(t===null)return;n==="hotend"?l.tempHotendTargetInput&&(l.tempHotendTargetInput.value=String(t)):l.tempBedTargetInput&&(l.tempBedTargetInput.value=String(t));const r=`SET_HEATER_TEMPERATURE HEATER=${n==="hotend"?"extruder":"heater_bed"} TARGET=${t}`;await nn(r,{actionLabel:`Set ${n==="hotend"?"Extruder":"Heater Bed"} target`})&&(s.temperatures[n].target=t,lo())}async function Lv(){await nn(`SET_HEATER_TEMPERATURE HEATER=extruder TARGET=0
SET_HEATER_TEMPERATURE HEATER=heater_bed TARGET=0`,{actionLabel:"Cooldown"})&&(s.temperatures.hotend.target=0,s.temperatures.bed.target=0,lo())}function Rv(){l.cardTemperatures&&(l.tempShowChart&&(l.tempShowChart.checked=s.temperatures.chart.show),l.tempHideHostSensors&&(l.tempHideHostSensors.checked=s.temperatures.chart.hideHostSensors),l.tempHideMonitors&&(l.tempHideMonitors.checked=s.temperatures.chart.hideMonitors),l.tempAutoscaleChart&&(l.tempAutoscaleChart.checked=s.temperatures.chart.autoscale),gh(),lo(),zn(),ti(),l.tempCooldown?.addEventListener("click",async()=>{zn(),ti(),await Lv()}),l.tempSettingsToggle?.addEventListener("click",n=>{if(n.preventDefault(),n.stopPropagation(),!l.tempSettingsMenu||!l.tempSettingsToggle)return;const e=l.tempSettingsMenu.hidden;zn(),l.tempSettingsMenu.hidden=!e,l.tempSettingsToggle.setAttribute("aria-expanded",String(e))}),[l.tempShowChart,l.tempHideHostSensors,l.tempHideMonitors,l.tempAutoscaleChart].forEach(n=>{n?.addEventListener("change",()=>{s.temperatures.chart.show=l.tempShowChart?.checked??!0,s.temperatures.chart.hideHostSensors=l.tempHideHostSensors?.checked??!1,s.temperatures.chart.hideMonitors=l.tempHideMonitors?.checked??!1,s.temperatures.chart.autoscale=l.tempAutoscaleChart?.checked??!1,xv(),lo()})}),l.tempHotendTargetToggle?.addEventListener("click",n=>{n.preventDefault(),n.stopPropagation(),ti(),yu("hotend")}),l.tempBedTargetToggle?.addEventListener("click",n=>{n.preventDefault(),n.stopPropagation(),ti(),yu("bed")}),[["hotend",l.tempHotendTargetInput],["bed",l.tempBedTargetInput]].forEach(([n,e])=>{e&&(e.addEventListener("keydown",async t=>{t.key==="Enter"&&(t.preventDefault(),await _h(n,e.value),zn(),ti())}),e.addEventListener("blur",async()=>{fh(n,e.value)===null&&(e.value=$r(s.temperatures[n].target))}))}),l.temperatureChart?.addEventListener("mousemove",Cv),l.temperatureChart?.addEventListener("mouseleave",Av),l.temperatureChart?.addEventListener("wheel",wv,{passive:!1}),window.addEventListener("resize",()=>{Sr()}),document.addEventListener("keydown",n=>{n.key==="Escape"&&(zn(),ti())}),document.addEventListener("click",n=>{const e=n.target;if(e instanceof Element){if(!l.cardTemperatures.contains(e)){zn(),ti();return}e.closest(".target-control")||zn(),!e.closest("#temp-settings-menu")&&!e.closest("#temp-settings-toggle")&&ti()}}))}function Eu(n,e){!n.enabled||!n.url||(l.cameraDialogContent.innerHTML="",Wc(l.cameraDialogContent,n,e),typeof l.cameraDialog.showModal=="function"&&l.cameraDialog.showModal())}function Mu(){l.cameraDialog.open&&l.cameraDialog.close()}function Pv(n,e){let t=n.querySelector(":scope > .card-head, :scope > .camera-card-head");if(t)return t.classList.add("card-head"),t;let i=n.querySelector(":scope > h2, :scope > h3");return i||(i=document.createElement("h3"),i.textContent=n.classList.contains("settings-actions")?"Actions":`Card ${e+1}`,n.prepend(i)),t=document.createElement("div"),t.className="card-head",i.remove(),t.appendChild(i),n.prepend(t),t}function Iv(n){let e=n.querySelector(":scope > .card-head-actions");if(e)return e;e=document.createElement("div"),e.className="card-head-actions";const t=n.querySelector(":scope > h2, :scope > h3");return[...n.children].filter(r=>r!==t&&!r.classList.contains("card-head-actions")).forEach(r=>e.appendChild(r)),n.appendChild(e),e}function Dv(n,e){let t=n.querySelector(":scope > .card-body");return t||(t=document.createElement("div"),t.className="card-body",[...n.children].filter(r=>r!==e).forEach(r=>t.appendChild(r)),n.appendChild(t),t)}function Fv(n,e){const t=n.closest(".view")?.id||"view",i=`card-${e+1}`,r=n.querySelector(":scope > .card-head > h2, :scope > .card-head > h3")?.textContent?.trim()||n.querySelector(":scope h2, :scope h3")?.textContent?.trim()||i,o=n.id||r||i;return`${Rb}${Sy(`${t}-${o}`)}`}function Nv(n,e){n.dataset.state=e?"collapsed":"expanded",n.setAttribute("aria-expanded",String(!e)),n.setAttribute("title",e?"Expand card":"Collapse card")}function Tu(n,e,t,i){n.classList.toggle("card-collapsed",i),Nv(e,i),localStorage.setItem(t,i?"1":"0")}function Uv(){[...document.querySelectorAll(".view .card")].forEach((e,t)=>{const i=Pv(e,t),r=Iv(i);Dv(e,i);let o=r.querySelector(":scope > .card-collapse-toggle");o?o.querySelector(".card-collapse-icon")||(o.innerHTML='<span class="card-collapse-icon" aria-hidden="true"></span>'):(o=document.createElement("button"),o.type="button",o.className="card-collapse-toggle",o.setAttribute("aria-label","Toggle card"),o.innerHTML='<span class="card-collapse-icon" aria-hidden="true"></span>',r.appendChild(o));const a=Fv(e,t),c=localStorage.getItem(a)==="1";Tu(e,o,a,c),o.addEventListener("click",()=>{const d=!e.classList.contains("card-collapsed");Tu(e,o,a,d)})})}function Xr(...n){const e=[],t=new Set;return n.forEach(i=>{(Array.isArray(i)?i:[]).forEach(o=>{let a=String(o||"").trim();if(!a)return;a.toLowerCase().startsWith("gcode_macro ")||(a=`gcode_macro ${a}`);const c=a.replace(/^gcode_macro\s+/i,"gcode_macro ").trim();if(!c)return;const d=c.toLowerCase();t.has(d)||(t.add(d),e.push(c))})}),e}function Ov(n){const e=String(n||"");if(!e.trim())return[];const t=[],i=e.matchAll(/^\s*\[\s*gcode_macro\s+([^\]\r\n]+?)\s*\]\s*$/gmi);for(const r of i){const o=String(r?.[1]||"").trim();o&&t.push(`gcode_macro ${o}`)}return Xr(t)}async function bh(){if(pe(`Connecting to ${s.moonrakerUrl}`,"info"),Ue.info("Connecting to Moonraker.",{baseUrl:s.moonrakerUrl}),xs(),_s(),bs(),ps(),lu(),$S(),uv(),KS(),nv(),s.client?.ws&&s.client.ws.readyState<=1)try{s.client.ws.close(),Ue.debug("Closed previous websocket before reconnect.")}catch(n){const e=n?.message||String(n);pe(`Previous websocket close failed: ${e}`,"warn"),Ue.warn("Previous websocket close failed.",{error:e})}s.client=new Qh(s.moonrakerUrl),ws("connecting"),s.client.onConnectionState(n=>{if(ws(n),n==="connected"){pe("Moonraker connected.","info"),GS(),jS(),dv(),lu(),rS(),$y(),jc({fetchStatic:!0}),Lr({forceRefresh:!1,source:"connect"}),Rs({source:"connect",silent:!0}),xo({source:"connect",silent:!0}),Ue.info("Moonraker websocket connected.");return}if(n==="disconnected"){pe("Moonraker disconnected.","warn"),xs(),_s(),bs(),ps(),s.machineLoads.lastError="Moonraker disconnected.",s.updateManager.lastError="Moonraker disconnected.",s.updateManager.statusMessage="",s.endstops.queryInFlight=!1,s.logFiles.isLoading=!1,s.logFiles.actionInFlight=!1,s.jobs.isLoading=!1,s.jobs.actionInFlight=!1,si(),qt(),Cn(),Pt(),Ge(),Ue.warn("Moonraker websocket disconnected.");return}if(n==="error"){pe("Moonraker websocket error.","error"),xs(),_s(),bs(),ps(),s.machineLoads.lastError="Moonraker websocket error.",s.updateManager.lastError="Moonraker websocket error.",s.updateManager.statusMessage="",s.endstops.queryInFlight=!1,s.logFiles.isLoading=!1,s.logFiles.actionInFlight=!1,s.jobs.isLoading=!1,s.jobs.actionInFlight=!1,si(),qt(),Cn(),Pt(),Ge(),Ue.error("Moonraker websocket error.");return}Ue.debug("Moonraker connection status update.",{status:n})}),s.client.onMessage(n=>{if(s.console.rawOutput)try{pe(JSON.stringify(n),"debug",{label:"RAW",consoleType:"system"})}catch{pe(String(n),"debug",{label:"RAW",consoleType:"system"})}if(n.method==="notify_gcode_response"){const[e]=n.params||[];bl(e).forEach(t=>{const i=t.startsWith("!!")||/^error\b/i.test(t);pe(t,i?"error":"info",{label:i?"ERROR":"RESPONSE",consoleType:i?"error":"response"})});return}if(n.method==="notify_gcode_store"){const e=nS(n);e.length&&Zf(e);return}if(n.method==="notify_status_update"){const[e]=n.params||[],t=e?.print_stats||{},i=kc(e?.virtual_sdcard||null);zc(i),Hc(t,e?.gcode_move||null,e?.motion_report||null,e?.toolhead||null),$c(e);const r=t.state||t.status;r&&cr(r);const o=e?.extruder||{},a=e?.heater_bed||{};Ue.debug("Status update received.",{printerState:r||null,progress:s.printStatus.lastVirtualSd?.progress??null,hotend:o.temperature??null,hotendTarget:o.target??null,bed:a.temperature??null,bedTarget:a.target??null});return}if(n.method==="notify_update_response"){mv(n);return}n.method==="notify_update_refreshed"&&gv(n)}),s.client.connectWebSocket();try{const e=(await s.client.call("/printer/objects/query?print_stats&gcode_move&virtual_sdcard&motion_report&toolhead"))?.result?.status||{},t=e.print_stats||{},i=e.gcode_move||null,r=e.motion_report||null,o=e.toolhead||null,a=kc(e.virtual_sdcard||null);zc(a);const c=t.state||t.status||"ready";cr(c),Hc(t,i,r,o),Ue.debug("Initial printer state loaded.",{printerState:c})}catch(n){const e=n?.message||String(n);pe(`Printer state load failed: ${e}`,"error"),Ue.error("Printer state load failed.",{error:e})}try{const e=(await s.client.call("/printer/objects/query?extruder&heater_bed"))?.result?.status||{};$c(e)}catch(n){const e=n?.message||String(n);pe(`Temperature load failed: ${e}`,"warn"),Ue.warn("Temperature load failed.",{error:e})}try{await jc({fetchStatic:!0})}catch(n){const e=n?.message||String(n);s.machineLoads.lastError=e,si(),Ue.debug("Initial machine loads snapshot failed.",{error:e})}try{const e=(await s.client.getMacros())?.result?.status?.configfile?.settings||{};IS(e);let t=Xr(Object.keys(e).filter(i=>String(i||"").toLowerCase().startsWith("gcode_macro ")));try{const i=await s.client.getConfigFileText("printer.cfg"),r=Ov(i);t=Xr(t,r)}catch(i){Ue.debug("printer.cfg macro parse fallback failed.",{error:i?.message||String(i)})}if(!t.length)try{const i=await s.client.call("/printer/objects/list"),r=Array.isArray(i?.result?.objects)?i.result.objects:[];t=Xr(r.filter(o=>String(o||"").toLowerCase().startsWith("gcode_macro ")))}catch(i){Ue.debug("Macro object list fallback failed.",{error:i?.message||String(i)})}if(!t.length)try{const i=await s.client.call("/printer/gcode/help"),o=Yf(i).map(a=>String(a.command||"").trim()).filter(a=>a.includes("_")).filter(a=>!/^[GMT]\d+$/i.test(a));t=Xr(o.map(a=>`gcode_macro ${a}`))}catch(i){Ue.debug("Macro gcode help fallback failed.",{error:i?.message||String(i)})}Bv(t),Ue.info("Macros loaded.",{count:t.length})}catch(n){const e=n?.message||String(n);pe(`Macro load failed: ${e}`,"error"),Ue.error("Macro load failed.",{error:e})}try{const n=await di({source:"connect",silent:!0});Ue.info("Print files loaded.",{count:n.length})}catch(n){const e=n?.message||String(n);pe(`Print files load failed: ${e}`,"error"),Ue.error("Print files load failed.",{error:e})}await Gi({preserveSelection:!0})}function Cu(n,e){if(n){if(n.innerHTML="",!e.length){const t=document.createElement("p");t.className="muted",t.textContent="No macros found.",n.appendChild(t);return}e.forEach(t=>{const i=t.replace("gcode_macro ",""),r=document.createElement("button");r.type="button",r.className="macro-action-btn",r.textContent=i,r.title=i,r.addEventListener("click",async()=>{await nn(i,{actionLabel:`Macro ${i}`})}),n.appendChild(r)})}}function Bv(n){const e=Array.isArray(n)?n:[];Cu(l.macroList,e),Cu(l.dashboardMacroList,e),Rn()}function ut(n){return String(n||"").trim().replace(/\\/g,"/").replace(/^\/+/,"").replace(/^gcodes\//i,"").replace(/\/+$/,"")}function Ps(n){const e=ut(n);if(!e)return"";const t=e.split("/").filter(Boolean);return t.length<=1?"":t.slice(0,-1).join("/")}function Ui(n){const e=ut(n);if(!e)return"";const t=e.split("/").filter(Boolean);return t.length?t[t.length-1]:e}function Dt(n,e="info"){l.prettyGcodeStatus&&(l.prettyGcodeStatus.textContent=String(n||"").trim(),l.prettyGcodeStatus.dataset.level=e)}function yn(){return s.prettyGcode.sourceMode==="simulation"}function Oi(n){const e=Number(n);return Number.isFinite(e)?Math.max(0,Math.min(1,e)):0}function Pl(n,e){const t=Math.max(0,Number(n)||0),i=Math.max(0,Number(e)||0),r=t*ry+i*30;return Math.max(Cr,Math.min(iy,r))}function yh(){fs&&(clearInterval(fs),fs=null)}function Sn({render:n=!0}={}){s.prettyGcode.simulationPlaying=!1,s.prettyGcode.simulationLastTickMs=null,yh(),n&&ht()&&et()}function Gv(n=s.prettyGcode.simulationProgress){const e=Array.isArray(s.prettyGcode.segments)?s.prettyGcode.segments:[];if(!e.length)return{x:null,y:null,z:null};const t=Oi(n),i=Array.isArray(s.prettyGcode.extrudingSegmentIndices)?s.prettyGcode.extrudingSegmentIndices:[];if(i.length){if(t<=0){const d=e[i[0]]||e[0];return{x:Number.isFinite(d?.x1)?d.x1:null,y:Number.isFinite(d?.y1)?d.y1:null,z:Number.isFinite(d?.z)?d.z:null}}const a=Math.max(0,Math.min(i.length-1,Math.round(t*(i.length-1)))),c=e[i[a]];if(c)return{x:Number.isFinite(c.x2)?c.x2:null,y:Number.isFinite(c.y2)?c.y2:null,z:Number.isFinite(c.z)?c.z:null}}const r=Math.max(0,Math.min(e.length-1,Math.round(t*(e.length-1)))),o=e[r];return{x:Number.isFinite(o?.x2)?o.x2:null,y:Number.isFinite(o?.y2)?o.y2:null,z:Number.isFinite(o?.z)?o.z:null}}function kv(){return yn()?s.prettyGcode.segments.length?(s.prettyGcode.simulationProgress>=1&&(s.prettyGcode.simulationProgress=0),yh(),s.prettyGcode.simulationPlaying=!0,s.prettyGcode.simulationLastTickMs=Date.now(),Yt({skipRender:!0}),fs=setInterval(()=>{if(!yn()||!s.prettyGcode.simulationPlaying){Sn({render:!1});return}const n=Date.now(),e=Number(s.prettyGcode.simulationLastTickMs)||n,t=Math.max(0,n-e);s.prettyGcode.simulationLastTickMs=n;const i=Math.max(1,Number(s.prettyGcode.simulationDurationMs)||Cr),r=Math.max(.1,Number(s.prettyGcode.simulationSpeed)||1),o=t*r/i;s.prettyGcode.simulationProgress=Oi(s.prettyGcode.simulationProgress+o),Yt({skipRender:!0}),s.prettyGcode.simulationProgress>=1&&Sn({render:!1}),ht()&&et()},ny),ht()&&et(),!0):(Dt("No path loaded. Load a file first.","warn"),!1):(Dt("Load a file with Simulation mode before pressing Play.","warn"),!1)}function zv(){return yn()?s.prettyGcode.simulationPlaying?(Sn(),!0):kv():(Dt("Load a file and enter Simulation mode to use playback controls.","warn"),!1)}function wu(n){return yn()?s.prettyGcode.segments.length?(Sn({render:!1}),s.prettyGcode.simulationProgress=Oi(s.prettyGcode.simulationProgress+(Number(n)||0)),Yt({skipRender:!0}),ht()&&et(),!0):(Dt("No path loaded. Load a file first.","warn"),!1):(Dt("Load a file and enter Simulation mode to use rewind or fast forward.","warn"),!1)}function Hv(n){l.prettyGcodeProgress&&(l.prettyGcodeProgress.value=String(Math.round(Oi(n)*1e3)))}function Vv(n,e){const t=Array.isArray(n)?n:[];if(!t.length)return{layerZValues:[],segmentLayerIndices:[],segmentExtrusionOrderInLayer:[],layerExtrusionCounts:[],layerExtrusionEndCounts:[],totalLayers:0};const i=[],r=Array.isArray(e)&&e.length?e:t.map((p,h)=>h);for(const p of r){const h=Number(p);if(!Number.isInteger(h)||h<0||h>=t.length)continue;const m=t[h],_=Number(m?.z);if(!Number.isFinite(_))continue;let b=-1;for(let x=0;x<i.length;x+=1)if(Math.abs(i[x]-_)<=oy){b=x;break}b>=0||i.push(_)}if(!i.length)return{layerZValues:[],segmentLayerIndices:[],segmentExtrusionOrderInLayer:[],layerExtrusionCounts:[],layerExtrusionEndCounts:[],totalLayers:0};i.sort((p,h)=>p-h);const o=p=>{if(!Number.isFinite(p))return 0;let h=0,m=Number.POSITIVE_INFINITY;for(let _=0;_<i.length;_+=1){const b=Math.abs(i[_]-p);b<m&&(m=b,h=_)}return h},a=new Array(t.length).fill(0),c=new Array(t.length).fill(0),d=new Array(i.length).fill(0);t.forEach((p,h)=>{const m=o(Number(p?.z));a[h]=m,p?.extruding&&(d[m]+=1,c[h]=d[m])});const u=[];let f=0;return d.forEach(p=>{f+=Number(p)||0,u.push(f)}),{layerZValues:i,segmentLayerIndices:a,segmentExtrusionOrderInLayer:c,layerExtrusionCounts:d,layerExtrusionEndCounts:u,totalLayers:i.length}}function Ws(n){const e=Number(s.prettyGcode.totalLayers)||0;if(e<=0)return 0;const t=Number(n),i=Number.isFinite(t)?Math.round(t):0;return Math.max(0,Math.min(e-1,i))}function Sh(n=_o()){const e=Number(s.prettyGcode.totalLayers)||0;if(e<=0||e===1)return 0;const t=Oi(n),i=Array.isArray(s.prettyGcode.layerExtrusionEndCounts)?s.prettyGcode.layerExtrusionEndCounts:[],r=Math.max(0,Number(s.prettyGcode.extrusionCount)||0);if(r>0&&i.length===e){const c=Math.round(t*r);for(let d=0;d<i.length;d+=1)if(c<=i[d])return d;return e-1}const o=Array.isArray(s.prettyGcode.layerZValues)?s.prettyGcode.layerZValues:[],a=Number(s.prettyGcode.toolhead?.z);if(o.length===e&&Number.isFinite(a)){let c=0,d=Number.POSITIVE_INFINITY;for(let u=0;u<o.length;u+=1){const f=Math.abs(o[u]-a);f<d&&(d=f,c=u)}return c}return Ws(Math.round(t*(e-1)))}function vh(n=_o()){if((Number(s.prettyGcode.totalLayers)||0)<=0)return s.prettyGcode.selectedLayerIndex=0,s.prettyGcode.layerSelectionPinned=!1,0;if(s.prettyGcode.layerSelectionPinned)return s.prettyGcode.selectedLayerIndex=Ws(s.prettyGcode.selectedLayerIndex),s.prettyGcode.selectedLayerIndex;const t=Sh(n);return s.prettyGcode.selectedLayerIndex=t,t}function Au(n,{pin:e=!0,render:t=!0}={}){if((Number(s.prettyGcode.totalLayers)||0)<=0){s.prettyGcode.selectedLayerIndex=0,s.prettyGcode.layerSelectionPinned=!1;return}s.prettyGcode.selectedLayerIndex=Ws(n),s.prettyGcode.layerSelectionPinned=!!e,t&&ht()&&et()}function Wv(n=_o()){const e=Number(s.prettyGcode.totalLayers)||0,t=e>0,i=t?vh(n):0,r=t?i+1:1;return l.prettyGcodeLayerSlider&&(l.prettyGcodeLayerSlider.min="1",l.prettyGcodeLayerSlider.max=String(Math.max(1,e)),l.prettyGcodeLayerSlider.step="1",l.prettyGcodeLayerSlider.value=String(r),l.prettyGcodeLayerSlider.disabled=!t||s.prettyGcode.isLoading,l.prettyGcodeLayerSlider.setAttribute("aria-valuenow",String(r)),l.prettyGcodeLayerSlider.setAttribute("aria-valuetext",t?`Layer ${r} of ${e}`:"No layers loaded")),l.prettyGcodeLayerTop&&(l.prettyGcodeLayerTop.textContent=t?`Layer ${e}`:"Layer --"),l.prettyGcodeLayerBottom&&(l.prettyGcodeLayerBottom.textContent="Layer 1"),i}function jv(n){if(!l.prettyGcodeFile)return;const e=String(s.prettyGcode.sourceLabel||"").trim();if(e){l.prettyGcodeFile.textContent=e;return}const t=ut(n);if(!t){l.prettyGcodeFile.textContent="No active print file.";return}l.prettyGcodeFile.textContent=`gcodes/${t}`}function $v(){const n=s.printStatus.lastGcodeMove||{},e=Array.isArray(n?.gcode_position)?n.gcode_position:[],t=Ln(e?.[0]??n?.position?.[0]??n?.gcode_x??n?.x),i=Ln(e?.[1]??n?.position?.[1]??n?.gcode_y??n?.y),r=Ln(e?.[2]??n?.position?.[2]??n?.gcode_z??n?.z);return{x:Number.isFinite(t)?t:null,y:Number.isFinite(i)?i:null,z:Number.isFinite(r)?r:null}}function _o(){if(yn())return Oi(s.prettyGcode.simulationProgress);const n=ut(s.prettyGcode.activeFile),e=ut(s.printStatus.lastPrintStats?.filename||s.printStatus.filename);if(!n||!e||n!==e)return 0;const t=Number(s.printStatus.lastVirtualSd?.progress);return Number.isFinite(t)?Math.max(0,Math.min(1,t)):0}function Xv(n){const e=String(n||"").toLowerCase().trim();if(!e)return null;for(const t of ay)if(e.includes(t.term))return t.featureType;return null}function Il(n){const e=String(n||"").replace(/\r/g,"").split(`
`);let t=0,i=0,r=0,o=0,a=!0,c=!0,d=fr;const u=[],f=[];let p=0,h=null,m=null,_=null,b=null;const x=(w,T)=>{!Number.isFinite(w)||!Number.isFinite(T)||(h=h===null?w:Math.min(h,w),m=m===null?w:Math.max(m,w),_=_===null?T:Math.min(_,T),b=b===null?T:Math.max(b,T))};for(const w of e){if(u.length>=ty)break;let T=String(w||"");const L=T.indexOf(";");if(L>=0){const B=T.slice(L+1),W=Xv(B);W&&(d=W),T=T.slice(0,L)}if(T=T.trim(),!T)continue;const R=T.split(/\s+/).filter(Boolean);if(!R.length)continue;const M=R[0].toUpperCase(),A={};for(let B=1;B<R.length;B+=1){const W=R[B];if(!W||W.length<2)continue;const V=W[0].toUpperCase(),X=Number(W.slice(1));Number.isFinite(X)&&(A[V]=X)}if(M==="G90"){a=!0;continue}if(M==="G91"){a=!1;continue}if(M==="M82"){c=!0;continue}if(M==="M83"){c=!1;continue}if(M==="G92"){Object.prototype.hasOwnProperty.call(A,"X")&&(t=A.X),Object.prototype.hasOwnProperty.call(A,"Y")&&(i=A.Y),Object.prototype.hasOwnProperty.call(A,"Z")&&(r=A.Z),Object.prototype.hasOwnProperty.call(A,"E")&&(o=A.E);continue}if(!["G0","G1","G2","G3"].includes(M))continue;const F=Object.prototype.hasOwnProperty.call(A,"X")?a?A.X:t+A.X:t,E=Object.prototype.hasOwnProperty.call(A,"Y")?a?A.Y:i+A.Y:i,S=Object.prototype.hasOwnProperty.call(A,"Z")?a?A.Z:r+A.Z:r,P=Object.prototype.hasOwnProperty.call(A,"E")?c?A.E:o+A.E:o;if(F!==t||E!==i){const B=P>o+1e-5,W=B?d:sy;u.push({x1:t,y1:i,x2:F,y2:E,z:S,extruding:B,featureType:W}),x(t,i),x(F,E),B&&(p+=1,f.push(u.length-1))}t=F,i=E,r=S,o=P}return{segments:u,extrudingSegmentIndices:f,extrusionCount:p,bounds:h===null||_===null||m===null||b===null?null:{minX:h,minY:_,maxX:m,maxY:b}}}function Eh(){if(!l.prettyGcodeCanvas)return{width:0,height:0,dpr:1};const n=l.prettyGcodeCanvas.getBoundingClientRect(),e=window.devicePixelRatio||1,t=Math.max(1,Math.round(n.width*e)),i=Math.max(1,Math.round(n.height*e));return{width:Math.max(1,n.width),height:Math.max(1,n.height),dpr:e,targetWidth:t,targetHeight:i}}function qv(n,e="#94a3b8"){const t=String(n||"").trim(),i=t.match(/^rgba?\(([^)]+)\)$/i);if(i){const r=i[1].split(",").map(u=>u.trim()),o=Number(r[0]),a=Number(r[1]),c=Number(r[2]),d=r.length>3?Number(r[3]):1;if([o,a,c].every(u=>Number.isFinite(u)))return{color:new ze(`rgb(${o}, ${a}, ${c})`),opacity:Number.isFinite(d)?Math.max(0,Math.min(1,d)):1}}try{return{color:new ze(t||e),opacity:1}}catch{return{color:new ze(e),opacity:1}}}function ir(n,e=1){const t=qv(n),i=Math.max(0,Math.min(1,t.opacity*e));return new dl({color:t.color,transparent:i<.999,opacity:i})}function $n(){fe.renderRequested=!0}function Mh(){fe.geometryDirty=!0,$n()}function Lu(n){n&&(n.traverse(e=>{if(e?.geometry?.dispose&&e.geometry.dispose(),!!e?.material){if(Array.isArray(e.material)){e.material.forEach(t=>t?.dispose?.());return}e.material.dispose?.()}}),n.clear())}function Th(){if(!l.prettyGcodeCanvas)return!1;if(fe.scene&&fe.renderer&&fe.camera)return!0;const n=new mb({canvas:l.prettyGcodeCanvas,antialias:!0,alpha:!1,preserveDrawingBuffer:!1}),e=new mm;e.background=new ze("#050b14");const t=new an(55,1,.1,5e3);t.position.set(180,160,180);const i=new xb(t,l.prettyGcodeCanvas);i.enableDamping=!0,i.dampingFactor=.08,i.screenSpacePanning=!0,i.target.set(110,0,110),i.update(),i.addEventListener("change",()=>{fe.lastInteractionMs=Date.now(),$n()});const r=new Cm(16777215,.62);e.add(r);const o=new Md(16777215,.68);o.position.set(80,220,120),e.add(o);const a=new Md(10274303,.28);a.position.set(-120,130,-100),e.add(a);const c=new ar;c.name="pretty-print-group",e.add(c);const d=new ar;d.name="pretty-mirror-group",d.scale.set(1,-1,1),e.add(d);const u=new lf(220,22,3359061,2042167);e.add(u);const f=new go(220,220,1,1);f.rotateX(-Math.PI/2);const p=new Dn(f,new cl({color:new ze("#0b1727"),transparent:!0,opacity:.36,depthWrite:!1,side:Tn}));p.position.y=-.05,e.add(p);const h=14,m=4,_=new fl(m,h,22),b=new Sm({color:new ze("#f59e0b"),metalness:.42,roughness:.38,emissive:new ze("#7c2d12"),emissiveIntensity:.2}),x=new Dn(_,b);x.rotation.x=Math.PI,x.visible=!1,e.add(x),fe.renderer=n,fe.scene=e,fe.camera=t,fe.controls=i,fe.printGroup=c,fe.mirrorGroup=d,fe.bedGrid=u,fe.bedPlane=p,fe.nozzleMesh=x,fe.lastInteractionMs=Date.now(),fe.geometryDirty=!0,fe.renderRequested=!0;const g=Eh();if(n.setPixelRatio(g.dpr),n.setSize(g.width,g.height,!1),!fe.animationFrame){const w=()=>{if(fe.animationFrame=window.requestAnimationFrame(w),!ht()||!fe.renderer||!fe.scene||!fe.camera)return;let L=!1;const R=Date.now(),M=fe.controls;M&&s.prettyGcode.orbitWhenIdle&&R-fe.lastInteractionMs>ly*1e3&&(M.rotateLeft(.0036),L=!0);const A=!!M?.update?.();(L||A)&&$n(),fe.renderRequested&&(fe.renderer.render(fe.scene,fe.camera),fe.renderRequested=!1)};w()}return!0}function Yv(n){if(!fe.scene||!n)return;const e=Math.max(60,Math.abs(n.maxX-n.minX)+28),t=Math.max(60,Math.abs(n.maxY-n.minY)+28),i=(n.minX+n.maxX)*.5,r=(n.minY+n.maxY)*.5;fe.bedCenter={x:i,y:0,z:r},fe.bedSize={x:e,z:t,y:Math.max(120,e,t)},fe.bedGrid&&(fe.scene.remove(fe.bedGrid),fe.bedGrid.geometry?.dispose?.(),fe.bedGrid.material?.dispose?.());const o=Math.max(8,Math.min(70,Math.round(Math.max(e,t)/10))),a=Math.max(e,t),c=new lf(a,o,3359061,2042167);if(c.position.set(i,0,r),fe.scene.add(c),fe.bedGrid=c,fe.bedPlane){const f=fe.bedPlane;f.scale.set(e/220,1,t/220),f.position.set(i,-.05,r)}const d=fe.camera,u=fe.controls;if(d&&u){const f=Math.max(e,t)*.9;u.target.set(i,0,r),d.position.set(i+f,Math.max(80,f*.75),r+f*.9),u.update()}}function Ru(n,e,t,i){if(!Array.isArray(n)||!n.length)return null;const r=()=>{const h=new un;return h.setAttribute("position",new Ht(n,3)),h},o=Math.floor(n.length/6),a=new ss(r(),ir(e)),c=new ss(r(),ir(t)),d=i?new ss(r(),ir(i)):null,u=a.clone();u.material=ir(e,Da);const f=c.clone();f.material=ir(t,Da);const p=d?d.clone():null;return p&&(p.material=ir(i,Da)),{segmentCount:o,current:a,history:c,future:d,currentMirror:u,historyMirror:f,futureMirror:p}}function Kv(){if(!Th())return;const e=s.prettyGcode,t=Array.isArray(e.segments)?e.segments:[],i=e.bounds;if(!fe.printGroup||!fe.mirrorGroup)return;if(Lu(fe.printGroup),Lu(fe.mirrorGroup),fe.layerEntries=[],!t.length||!i){fe.geometryDirty=!1,$n();return}Yv(i);const r=Math.max(1,Number(e.totalLayers)||0),o=Array.isArray(e.segmentLayerIndices)?e.segmentLayerIndices:[],a=Array.isArray(e.segmentExtrusionOrderInLayer)?e.segmentExtrusionOrderInLayer:[],c=Number(e.totalLayers)>0&&o.length===t.length&&a.length===t.length,d=Array.from({length:r},(f,p)=>{const h=new Map;return Ia.forEach(m=>{h.set(m,{positions:[],orders:[]})}),{layerIndex:p,travelPositions:[],features:h,travelPair:null,featurePairs:new Map}}),u=(f,p=!1)=>{const h=p?f.x2:f.x1,m=Number(f.z)||0,_=p?f.y2:f.y1;return{x:h,y:m,z:_}};t.forEach((f,p)=>{const h=c&&Number(o[p])||0,m=Math.max(0,Math.min(d.length-1,h)),_=d[m],b=u(f,!1),x=u(f,!0);if(!f.extruding){_.travelPositions.push(b.x,b.y,b.z,x.x,x.y,x.z);return}const g=Ia.includes(f.featureType)?f.featureType:fr,w=_.features.get(g)||_.features.get(fr);w.positions.push(b.x,b.y,b.z,x.x,x.y,x.z);const T=c&&Number(a[p])||w.orders.length+1;w.orders.push(T)}),d.forEach(f=>{const p=Ru(f.travelPositions,iu.current,iu.history,null);p&&(f.travelPair=p,fe.printGroup.add(p.current,p.history),fe.mirrorGroup.add(p.currentMirror,p.historyMirror)),Ia.forEach(h=>{const m=f.features.get(h);if(!m||!m.positions.length)return;const _=nu[h]||nu[fr],b=Ru(m.positions,_.current,_.history,cy);b&&(b.orders=m.orders,f.featurePairs.set(h,b),fe.printGroup.add(b.current,b.history,b.future),fe.mirrorGroup.add(b.currentMirror,b.historyMirror,b.futureMirror))}),fe.layerEntries.push(f)}),fe.geometryDirty=!1,$n()}function rr(n,e,t){if(!n?.geometry?.setDrawRange)return;const i=Math.max(0,Number(e)||0),r=Math.max(0,Number(t)||0);n.geometry.setDrawRange(i*2,r*2)}function Jv(n){const e=s.prettyGcode,t=vh(n),i=Math.round(n*Math.max(1,Number(e.extrusionCount)||0)),r=Array.isArray(e.layerExtrusionEndCounts)?e.layerExtrusionEndCounts:[],o=!!e.layerSelectionPinned,a=!!e.showMirror,c=t>0&&Number(r[t-1])||0,d=o?Number.POSITIVE_INFINITY:Math.max(0,i-c);fe.layerEntries.forEach(u=>{const f=u.layerIndex,p=f<t,h=f===t,m=u.travelPair;m&&(m.history.visible=p,m.historyMirror.visible=p&&a,m.current.visible=h,m.currentMirror.visible=h&&a,rr(m.history,0,m.segmentCount),rr(m.current,0,m.segmentCount)),u.featurePairs.forEach(_=>{if(p){_.history.visible=!0,_.historyMirror.visible=a,_.current.visible=!1,_.currentMirror.visible=!1,_.future.visible=!1,_.futureMirror.visible=!1,rr(_.history,0,_.segmentCount);return}if(!h){_.history.visible=!1,_.historyMirror.visible=!1,_.current.visible=!1,_.currentMirror.visible=!1,_.future.visible=!1,_.futureMirror.visible=!1;return}if(_.history.visible=!1,_.historyMirror.visible=!1,o){_.current.visible=!0,_.currentMirror.visible=a,_.future.visible=!1,_.futureMirror.visible=!1,rr(_.current,0,_.segmentCount);return}let b=0;for(let g=0;g<_.orders.length;g+=1)(Number(_.orders[g])||0)<=d&&(b+=1);const x=Math.max(0,_.segmentCount-b);_.current.visible=b>0,_.currentMirror.visible=b>0&&a,_.future.visible=x>0,_.futureMirror.visible=x>0&&a,rr(_.current,0,b),rr(_.future,b,x)})}),fe.mirrorGroup&&(fe.mirrorGroup.visible=a)}function Zv(){const n=fe.nozzleMesh;if(!n)return;const e=s.prettyGcode.toolhead||{x:null,y:null,z:null};if(!!!s.prettyGcode.showNozzle||!Number.isFinite(e.x)||!Number.isFinite(e.y)){n.visible=!1;return}const i=Math.max(40,fe.bedSize.x,fe.bedSize.z),r=Math.max(8,Math.min(20,i*.055));n.scale.set(r/14,r/14,r/14),n.position.set(Number(e.x),Number(e.z)+r*.45,Number(e.y)),n.visible=!0}function Hr(){if(!l.prettyGcodeCanvas||!Th())return;const n=Eh();fe.renderer&&fe.camera&&(fe.renderer.setPixelRatio(n.dpr),fe.renderer.setSize(n.width,n.height,!1),fe.camera.aspect=Math.max(.1,n.width/Math.max(1,n.height)),fe.camera.updateProjectionMatrix()),fe.geometryDirty&&Kv();const e=_o();Jv(e),Zv(),$n()}function et(){l.prettyGcodeFollow&&(l.prettyGcodeFollow.checked=!!s.prettyGcode.followToolhead),l.prettyGcodeShowMirror&&(l.prettyGcodeShowMirror.checked=!!s.prettyGcode.showMirror),l.prettyGcodeShowNozzle&&(l.prettyGcodeShowNozzle.checked=!!s.prettyGcode.showNozzle),l.prettyGcodeOrbitIdle&&(l.prettyGcodeOrbitIdle.checked=!!s.prettyGcode.orbitWhenIdle);const n=yn(),e=Array.isArray(s.prettyGcode.segments)&&s.prettyGcode.segments.length>0;jv(s.prettyGcode.activeFile),Yt({skipRender:!0});const t=_o();Hv(t);const i=Wv(t),r=Number(s.prettyGcode.totalLayers)||0,o=r>0?` | Layer: ${i+1}/${r}${s.prettyGcode.layerSelectionPinned?" (manual)":""}`:"";if(l.prettyGcodeMode&&(l.prettyGcodeMode.textContent=n?"Mode: Simulation":"Mode: Live"),l.prettyGcodePlayPause&&(l.prettyGcodePlayPause.textContent=s.prettyGcode.simulationPlaying?"Pause":"Play",l.prettyGcodePlayPause.disabled=!n||!e||s.prettyGcode.isLoading),l.prettyGcodeRewind&&(l.prettyGcodeRewind.disabled=!n||!e||s.prettyGcode.isLoading),l.prettyGcodeFastForward&&(l.prettyGcodeFastForward.disabled=!n||!e||s.prettyGcode.isLoading),l.prettyGcodeProgress&&(l.prettyGcodeProgress.disabled=!n||!e||s.prettyGcode.isLoading),l.prettyGcodeLive&&(l.prettyGcodeLive.disabled=!n),l.prettyGcodeLoadFile&&(l.prettyGcodeLoadFile.disabled=s.prettyGcode.isLoading),!n&&!s.client){Dt("Connect to Moonraker to use live print tracking.","warn"),Hr();return}if(!n&&s.connectionStatus!=="connected"){Dt("Moonraker disconnected. Reconnect to stream live path updates.","warn"),Hr();return}if(s.prettyGcode.isLoading){Dt(`Loading ${s.prettyGcode.loadingFile||"print file"}...`,"info"),Hr();return}if(s.prettyGcode.lastError){Dt(`KlipperView failed: ${s.prettyGcode.lastError}`,"error"),Hr();return}const a=s.prettyGcode.segments||[],c=Math.round(t*1e3)/10,d=s.prettyGcode.toolhead||{x:null,y:null},u=Number.isFinite(d.x)&&Number.isFinite(d.y)?` | Toolhead: X${d.x.toFixed(2)} Y${d.y.toFixed(2)}`:"";if(!a.length)Dt(n?"Load a GCode file and press Play to run simulation.":"No parsed path yet. Start a print or press Reload.","info");else if(n){const f=s.prettyGcode.simulationPlaying?"Playing":"Paused";Dt(`Simulation ${f} | Progress: ${c.toFixed(1)}%${o}${u}`,"info")}else Dt(`Loaded ${a.length.toLocaleString()} moves | Progress: ${c.toFixed(1)}%${o}${u}`,"info");Hr()}function Dl(n,e){s.prettyGcode.sourceTextLength=Number(e)||0,s.prettyGcode.segments=Array.isArray(n?.segments)?n.segments:[],s.prettyGcode.extrudingSegmentIndices=Array.isArray(n?.extrudingSegmentIndices)?n.extrudingSegmentIndices:[],s.prettyGcode.bounds=n?.bounds||null,s.prettyGcode.extrusionCount=Number(n?.extrusionCount)||0;const t=Vv(s.prettyGcode.segments,s.prettyGcode.extrudingSegmentIndices);s.prettyGcode.layerZValues=t.layerZValues,s.prettyGcode.segmentLayerIndices=t.segmentLayerIndices,s.prettyGcode.segmentExtrusionOrderInLayer=t.segmentExtrusionOrderInLayer,s.prettyGcode.layerExtrusionCounts=t.layerExtrusionCounts,s.prettyGcode.layerExtrusionEndCounts=t.layerExtrusionEndCounts,s.prettyGcode.totalLayers=t.totalLayers,s.prettyGcode.layerSelectionPinned?s.prettyGcode.selectedLayerIndex=Ws(s.prettyGcode.selectedLayerIndex):s.prettyGcode.selectedLayerIndex=Sh(),Mh()}function js(){s.prettyGcode.segments=[],s.prettyGcode.extrudingSegmentIndices=[],s.prettyGcode.bounds=null,s.prettyGcode.extrusionCount=0,s.prettyGcode.sourceTextLength=0,s.prettyGcode.layerZValues=[],s.prettyGcode.segmentLayerIndices=[],s.prettyGcode.segmentExtrusionOrderInLayer=[],s.prettyGcode.layerExtrusionCounts=[],s.prettyGcode.layerExtrusionEndCounts=[],s.prettyGcode.totalLayers=0,s.prettyGcode.selectedLayerIndex=0,s.prettyGcode.layerSelectionPinned=!1,Mh()}async function Qv(n){const e=n||null;if(!e)return!1;const t=String(e.name||"local-file.gcode").trim()||"local-file.gcode";Sn({render:!1});const i=s.prettyGcode.parseRequestId+1;s.prettyGcode.parseRequestId=i,s.prettyGcode.isLoading=!0,s.prettyGcode.loadingFile=t,s.prettyGcode.lastError="",s.prettyGcode.sourceMode="simulation",s.prettyGcode.sourceLabel=`local/${t}`,s.prettyGcode.activeFile=t,s.prettyGcode.simulationProgress=0,s.prettyGcode.simulationPlaying=!1,s.prettyGcode.simulationLastTickMs=null,s.prettyGcode.layerSelectionPinned=!1,s.prettyGcode.selectedLayerIndex=0,et();try{const r=await e.text();if(i!==s.prettyGcode.parseRequestId)return!1;const o=Il(r);return Dl(o,String(r||"").length),s.prettyGcode.simulationDurationMs=Pl(o.segments.length,o.extrusionCount),s.prettyGcode.lastLoadedAtMs=Date.now(),s.prettyGcode.lastError="",Yt({skipRender:!0}),!0}catch(r){const o=r?.message||String(r);return i===s.prettyGcode.parseRequestId&&(s.prettyGcode.lastError=o,js(),s.prettyGcode.simulationDurationMs=Cr),!1}finally{i===s.prettyGcode.parseRequestId&&(s.prettyGcode.isLoading=!1,s.prettyGcode.loadingFile="",et())}}async function eE(n){const e=ut(n);if(!e||!s.client||s.connectionStatus!=="connected")return Dt("Connect to Moonraker to load host print files.","warn"),!1;Sn({render:!1});const t=s.prettyGcode.parseRequestId+1;s.prettyGcode.parseRequestId=t,s.prettyGcode.isLoading=!0,s.prettyGcode.loadingFile=e,s.prettyGcode.lastError="",s.prettyGcode.sourceMode="simulation",s.prettyGcode.sourceLabel=`gcodes/${e}`,s.prettyGcode.activeFile=e,s.prettyGcode.simulationProgress=0,s.prettyGcode.simulationPlaying=!1,s.prettyGcode.simulationLastTickMs=null,s.prettyGcode.layerSelectionPinned=!1,s.prettyGcode.selectedLayerIndex=0,ht()&&et();try{const i=await s.client.getFileText("gcodes",e);if(t!==s.prettyGcode.parseRequestId)return!1;const r=Il(i);return Dl(r,String(i||"").length),s.prettyGcode.simulationDurationMs=Pl(r.segments.length,r.extrusionCount),s.prettyGcode.lastLoadedAtMs=Date.now(),s.prettyGcode.lastError="",Yt({skipRender:!0}),!0}catch(i){const r=i?.message||String(i);return t===s.prettyGcode.parseRequestId&&(s.prettyGcode.lastError=r,js(),s.prettyGcode.simulationDurationMs=Cr),!1}finally{t===s.prettyGcode.parseRequestId&&(s.prettyGcode.isLoading=!1,s.prettyGcode.loadingFile="",ht()&&et())}}async function tE(n,{force:e=!1}={}){const t=ut(n);if(!t||!s.client||s.connectionStatus!=="connected")return!1;if(Sn({render:!1}),s.prettyGcode.sourceMode="live",s.prettyGcode.sourceLabel="",s.prettyGcode.simulationProgress=0,s.prettyGcode.simulationPlaying=!1,s.prettyGcode.simulationLastTickMs=null,!e&&s.prettyGcode.activeFile===t&&s.prettyGcode.isLoading&&s.prettyGcode.loadingFile===t||!e&&s.prettyGcode.activeFile===t&&!s.prettyGcode.lastError&&Number.isFinite(s.prettyGcode.lastLoadedAtMs))return!0;const i=s.prettyGcode.parseRequestId+1;s.prettyGcode.parseRequestId=i,s.prettyGcode.isLoading=!0,s.prettyGcode.loadingFile=t,s.prettyGcode.lastError="",s.prettyGcode.activeFile=t,et();try{const r=await s.client.getFileText("gcodes",t);if(i!==s.prettyGcode.parseRequestId)return!1;const o=Il(r);return Dl(o,String(r||"").length),s.prettyGcode.lastLoadedAtMs=Date.now(),s.prettyGcode.lastError="",s.prettyGcode.simulationDurationMs=Pl(o.segments.length,o.extrusionCount),Yt({skipRender:!0}),!0}catch(r){const o=r?.message||String(r);return i===s.prettyGcode.parseRequestId&&(s.prettyGcode.lastError=o,js()),!1}finally{i===s.prettyGcode.parseRequestId&&(s.prettyGcode.isLoading=!1,s.prettyGcode.loadingFile="",et())}}async function Di(n,{force:e=!1}={}){const t=ut(n);if(!t)return Sn({render:!1}),s.prettyGcode.activeFile="",s.prettyGcode.sourceLabel="",js(),s.prettyGcode.lastLoadedAtMs=null,s.prettyGcode.lastError="",s.prettyGcode.simulationProgress=0,s.prettyGcode.simulationDurationMs=Cr,s.prettyGcode.simulationLastTickMs=null,s.prettyGcode.toolhead={x:null,y:null,z:null},ht()&&et(),!1;const i=await tE(t,{force:e});return ht()&&et(),i}async function nE(){if(yn())return s.prettyGcode.segments.length?(Sn({render:!1}),s.prettyGcode.simulationProgress=0,s.prettyGcode.simulationLastTickMs=null,s.prettyGcode.layerSelectionPinned=!1,s.prettyGcode.selectedLayerIndex=0,Yt({skipRender:!0}),ht()&&et(),!0):(Dt("No simulation file loaded to restart.","warn"),!1);const n=ut(s.printStatus.lastPrintStats?.filename||s.printStatus.filename||s.prettyGcode.activeFile);return n?Di(n,{force:!0}):(Dt("No active print file to reload.","warn"),!1)}async function iE(){Sn({render:!1}),s.prettyGcode.sourceMode="live",s.prettyGcode.sourceLabel="",s.prettyGcode.simulationProgress=0,s.prettyGcode.simulationLastTickMs=null,s.prettyGcode.layerSelectionPinned=!1,s.prettyGcode.selectedLayerIndex=0;const n=ut(s.printStatus.lastPrintStats?.filename||s.printStatus.filename);if(!n||!s.client||s.connectionStatus!=="connected")return await Di(""),Yt({skipRender:!0}),ht()&&et(),!1;const e=await Di(n,{force:!0});return Yt({skipRender:!0}),ht()&&et(),e}function Yt({skipRender:n=!1}={}){yn()?s.prettyGcode.toolhead=Gv():s.prettyGcode.toolhead=$v(),!n&&ht()&&et()}function rE(n){const e=Number(n);return!Number.isFinite(e)||e<=0?null:e>1e12?e:e*1e3}function Ch(n){const e=Number(n);return!Number.isFinite(e)||e<=0?"--":new Date(e).toLocaleString()}function oE(n){const e=String(n||"").trim().toLowerCase();return e==="directory"?"directory":e==="file"?"file":""}function Pu(n,e){const t=Ke(e);if(!t)return;const i=t.split("/").filter(Boolean);if(!i.length)return;let r="";i.forEach(o=>{r=r?`${r}/${o}`:o,n.add(r)})}function sE(n){const e=n?.result,t=Array.isArray(n)?n:Array.isArray(e)?e:Array.isArray(e?.files)?e.files:[],i=new Map,r=new Set;return t.forEach(a=>{if(!a)return;const c=oE(a?.type),d=typeof a=="string"?a:typeof a.path=="string"?a.path:[a.dirname,a.filename].filter(Boolean).join("/"),u=ut(d);if(!u)return;if(c==="directory"||String(d||"").trim().endsWith("/")){Pu(r,u);return}const p=Number(a?.size),h=Number.isFinite(p)&&p>=0?p:0,m=rE(a?.modified??a?.mtime??a?.date??a?.time);i.set(u,{path:u,displayName:Ui(u),directory:Ps(u),size:h,modifiedMs:m});const _=Ps(u);_&&Pu(r,_)}),{files:[...i.values()].sort((a,c)=>{const d=Number(a.modifiedMs)||0,u=Number(c.modifiedMs)||0;return d!==u?u-d:a.path.localeCompare(c.path)}),directories:[...r].sort((a,c)=>a.localeCompare(c))}}function aE(n){const e=new Set((n||[]).map(t=>ut(t.path)).filter(Boolean));[...s.jobs.metadataByPath.keys()].forEach(t=>{e.has(t)||s.jobs.metadataByPath.delete(t)}),[...s.jobs.metadataLoading].forEach(t=>{e.has(t)||s.jobs.metadataLoading.delete(t)})}function cE(n){const e=Array.isArray(n?.files)?n.files:[],t=Array.isArray(n?.directories)?n.directories:[];s.jobs.files=e,s.jobs.directories=t,aE(e),s.jobs.currentDirectory=Fl(s.jobs.currentDirectory)}function lE(){const n=Ke(s.jobs.currentDirectory),e=n?`${n}/`:"",t=new Map,i=[],r=a=>{const c=Ke(a);if(!c)return;const d=Ui(c)||c;t.has(c)||t.set(c,{path:c,displayName:d,fileCount:0,size:0,modifiedMs:0})},o=a=>{const c=Ke(a);if(!c)return"";if(n){if(!c.startsWith(e))return"";const u=c.slice(e.length);if(!u||u.startsWith("/"))return"";const f=u.split("/")[0];return f?`${e}${f}`:""}return c.split("/")[0]||""};return(s.jobs.directories||[]).forEach(a=>{const c=o(a);!c||c===n||r(c)}),(s.jobs.files||[]).forEach(a=>{const c=ut(a.path);if(!c||n&&!c.startsWith(e))return;const d=n?c.slice(e.length):c;if(!d||d.startsWith("/"))return;const u=d.indexOf("/");if(u>=0){const f=d.slice(0,u),p=e?`${e}${f}`:f;if(!p)return;r(p);const h=t.get(p);h.fileCount+=1,h.size+=Number(a.size)||0,h.modifiedMs=Math.max(h.modifiedMs,Number(a.modifiedMs)||0);return}i.push(a)}),{directories:[...t.values()],files:i}}function dE(n){return[...n].sort((e,t)=>e.path.localeCompare(t.path))}function uE(n){const e=wr(s.jobs.sortMode),t=[...n];return t.sort((i,r)=>{if(e==="name_asc")return i.displayName.localeCompare(r.displayName)||i.path.localeCompare(r.path);if(e==="name_desc")return r.displayName.localeCompare(i.displayName)||r.path.localeCompare(i.path);if(e==="size_desc")return(Number(r.size)||0)-(Number(i.size)||0)||i.displayName.localeCompare(r.displayName);if(e==="size_asc")return(Number(i.size)||0)-(Number(r.size)||0)||i.displayName.localeCompare(r.displayName);if(e==="eta_desc"||e==="eta_asc"){const a=s.jobs.metadataByPath.get(i.path),c=s.jobs.metadataByPath.get(r.path),d=Number(a?.estimatedTime)||0,u=Number(c?.estimatedTime)||0,f=e==="eta_desc"?u-d:d-u;return f!==0?f:i.displayName.localeCompare(r.displayName)}return e==="modified_asc"?(Number(i.modifiedMs)||0)-(Number(r.modifiedMs)||0)||i.displayName.localeCompare(r.displayName):(Number(r.modifiedMs)||0)-(Number(i.modifiedMs)||0)||i.displayName.localeCompare(r.displayName)}),t}function $s(){const n=s.printStatus.lastPrintStats||{},e=l.printerState?.dataset?.state||"unknown",t=n.state||n.status||e,i=yr(t),r=ut(n.filename),o=ut(s.printStatus.filename);return{state:i,filename:r||o}}function en(n,e="info"){l.jobsStatus&&(l.jobsStatus.textContent=String(n||"").trim(),l.jobsStatus.dataset.level=e)}function fE(n){const e=Number(n?.estimated_time),t=Number(n?.layer_count);return{thumbnailPath:sh(n),estimatedTime:Number.isFinite(e)&&e>0?e:null,totalLayers:Number.isFinite(t)&&t>0?Math.round(t):null,layerHeight:cn(n?.layer_height),firstLayerHeight:cn(n?.first_layer_height),objectHeight:cn(n?.object_height),filamentTotal:cn(n?.filament_total),filamentWeightTotal:cn(n?.filament_weight_total),filamentType:String(n?.filament_type||"").trim(),filamentName:String(n?.filament_name||"").trim(),nozzleDiameter:cn(n?.nozzle_diameter),firstLayerExtruderTemp:Ln(n?.first_layer_extr_temp??n?.first_layer_extruder_temp),firstLayerBedTemp:Ln(n?.first_layer_bed_temp),chamberTemp:Ln(n?.chamber_temp)}}async function Iu(n){const e=ut(n);if(!(!e||!s.client)&&!s.jobs.metadataByPath.has(e)&&!s.jobs.metadataLoading.has(e)){s.jobs.metadataLoading.add(e);try{const t=await s.client.getFileMetadata(e),i=fE(t?.result||{});s.jobs.metadataByPath.set(e,i),s.printStatus.metadataByFile.has(e)||s.printStatus.metadataByFile.set(e,i)}catch{s.jobs.metadataByPath.set(e,{thumbnailPath:"",estimatedTime:null,totalLayers:null,layerHeight:null,firstLayerHeight:null,objectHeight:null,filamentTotal:null,filamentWeightTotal:null,filamentType:"",filamentName:"",nozzleDiameter:null,firstLayerExtruderTemp:null,firstLayerBedTemp:null,chamberTemp:null})}finally{s.jobs.metadataLoading.delete(e),s.activeView==="files"&&Ge()}}}function bn(){localStorage.setItem(Tf,wr(s.jobs.sortMode)),localStorage.setItem(Cf,Ar(s.jobs.typeFilter)),localStorage.setItem(wf,String(s.jobs.searchQuery||"").trim()),localStorage.setItem(Af,Ke(s.jobs.currentDirectory)),localStorage.setItem(Lf,JSON.stringify(Gs(s.jobs.visibleColumns)))}function hE(n){const e=Ke(n);return!e||(s.jobs.directories||[]).some(t=>Ke(t)===e)?!0:(s.jobs.files||[]).some(t=>ut(t.path).startsWith(`${e}/`))}function Fl(n=s.jobs.currentDirectory){let e=Ke(n);if(!e)return"";for(;e&&!hE(e);){const t=e.split("/");t.pop(),e=t.join("/")}return e}function qc(n,{persist:e=!0}={}){s.jobs.currentDirectory=Fl(n),e&&bn(),Ge()}function pE(){return[{menu:l.jobsSortMenu,toggle:l.jobsSortToggle},{menu:l.jobsColumnsMenu,toggle:l.jobsColumnsToggle},{menu:l.jobsFilterMenu,toggle:l.jobsFilterToggle},{menu:l.jobsAddMenu,toggle:l.jobsAddToggle}].filter(n=>n.menu&&n.toggle)}function wh(n,e,t){!n||!e||(n.hidden=!t,e.setAttribute("aria-expanded",t?"true":"false"),e.classList.toggle("is-active",t))}function kt(n=null){pE().forEach(({menu:e,toggle:t})=>{e!==n&&wh(e,t,!1)})}function Zo(n,e){if(!n||!e)return;const t=n.hidden;kt(t?n:null),wh(n,e,t)}function mE(){if(!l.jobsPathDisplay)return;const n=Ke(s.jobs.currentDirectory),e=n?`/${n}`:"/";l.jobsPathDisplay.textContent=e,l.jobsPathDisplay.title=n?`gcodes/${n}`:"gcodes/"}function Rr(){return Gs(s.jobs.visibleColumns)}function Is(n){const e=Gs(n),t=Rr();e.length===t.length&&e.every((i,r)=>i===t[r])||(s.jobs.visibleColumns=e,bn(),Nl(),Ge())}function Du(n,e){const t=String(n||"").trim().toLowerCase();if(!ao.includes(t))return;const i=Rr();if(e){if(i.includes(t))return;Is([...i,t]);return}if(i.includes(t)){if(i.length===1){en("At least one file info field must remain visible.","warn"),Nl();return}Is(i.filter(r=>r!==t))}}function Fu(n,e){const t=String(n||"").trim().toLowerCase();if(!ao.includes(t))return;const i=Number(e);if(!Number.isFinite(i)||i===0)return;const r=Rr(),o=r.indexOf(t);if(o<0)return;const a=o+(i>0?1:-1);if(a<0||a>=r.length)return;const c=[...r],[d]=c.splice(o,1);c.splice(a,0,d),Is(c)}function gE(n,e,t="before"){const i=String(n||"").trim().toLowerCase(),r=String(e||"").trim().toLowerCase();if(!ao.includes(i)||!ao.includes(r)||i===r)return;const o=Rr(),a=o.indexOf(i),c=o.indexOf(r);if(a<0||c<0)return;const d=[...o];d.splice(a,1);const u=d.indexOf(r),f=t==="after"?u+1:u;d.splice(f,0,i),Is(d)}function Qo(){l.jobsColumnsList&&l.jobsColumnsList.querySelectorAll(".jobs-columns-row").forEach(n=>{n.classList.remove("is-drop-target","is-drop-after","is-dragging"),n.removeAttribute("data-drop-position")})}function Nl(){if(!l.jobsColumnsList)return;const n=Rr();l.jobsColumnsList.innerHTML="",n.forEach((t,i)=>{const r=Fc.find(m=>m.key===t);if(!r)return;const o=document.createElement("div");o.className="jobs-columns-row",o.draggable=!0;const a=document.createElement("label");a.className="jobs-columns-toggle";const c=document.createElement("input");c.type="checkbox",c.checked=!0,c.addEventListener("change",()=>{Du(t,c.checked)});const d=document.createElement("span");d.textContent=r.label,a.append(c,d);const u=document.createElement("div");u.className="jobs-columns-order";const f=document.createElement("span");f.className="jobs-columns-drag-handle",f.textContent="::",f.title=`Drag ${r.label} to reorder`;const p=document.createElement("button");p.type="button",p.className="jobs-columns-order-btn",p.textContent="^",p.title=`Move ${r.label} up`,p.disabled=i===0,p.addEventListener("click",()=>{Fu(t,-1)});const h=document.createElement("button");h.type="button",h.className="jobs-columns-order-btn",h.textContent="v",h.title=`Move ${r.label} down`,h.disabled=i===n.length-1,h.addEventListener("click",()=>{Fu(t,1)}),o.addEventListener("dragstart",m=>{if(tr=t,Qo(),o.classList.add("is-dragging"),m.dataTransfer){m.dataTransfer.effectAllowed="move";try{m.dataTransfer.setData("text/plain",t)}catch{}}}),o.addEventListener("dragover",m=>{if(!tr||tr===t)return;m.preventDefault();const _=o.getBoundingClientRect(),b=m.clientY>_.top+_.height/2;Qo(),o.classList.add("is-drop-target"),o.classList.toggle("is-drop-after",b),o.dataset.dropPosition=b?"after":"before",m.dataTransfer&&(m.dataTransfer.dropEffect="move")}),o.addEventListener("drop",m=>{m.preventDefault();const _=m.dataTransfer?.getData("text/plain")||"",b=String(tr||_||"").trim().toLowerCase(),x=t,g=o.dataset.dropPosition==="after"?"after":"before";tr=null,Qo(),gE(b,x,g)}),o.addEventListener("dragend",()=>{tr=null,Qo()}),u.append(f,p,h),o.append(a,u),l.jobsColumnsList.appendChild(o)}),Fc.filter(t=>!n.includes(t.key)).forEach(t=>{const i=document.createElement("div");i.className="jobs-columns-row is-hidden";const r=document.createElement("label");r.className="jobs-columns-toggle";const o=document.createElement("input");o.type="checkbox",o.checked=!1,o.addEventListener("change",()=>{Du(t.key,o.checked)});const a=document.createElement("span");a.textContent=t.label,r.append(o,a),i.append(r),l.jobsColumnsList.appendChild(i)})}function xE(){if(!l.jobsBreadcrumbs)return;const n=[],e=Ke(s.jobs.currentDirectory);if(n.push({label:"gcodes",path:""}),e){const t=e.split("/").filter(Boolean);let i="";t.forEach(r=>{i=i?`${i}/${r}`:r,n.push({label:r,path:i})})}l.jobsBreadcrumbs.innerHTML="",n.forEach((t,i)=>{const r=document.createElement("button");if(r.type="button",r.className="jobs-breadcrumb-btn",r.textContent=t.label,r.disabled=t.path===e,r.addEventListener("click",()=>{qc(t.path)}),l.jobsBreadcrumbs.appendChild(r),i<n.length-1){const o=document.createElement("span");o.className="jobs-breadcrumb-sep",o.textContent="/",l.jobsBreadcrumbs.appendChild(o)}})}function _E(n,{isConnected:e,busy:t}={}){const i=n&&typeof n=="object"?n:$s(),r=typeof e=="boolean"?e:s.connectionStatus==="connected",o=typeof t=="boolean"?t:s.jobs.actionInFlight,a=i.state==="printing",c=i.state==="paused",d=r&&(a||c);l.statusPrintActions&&(l.statusPrintActions.hidden=!d),l.statusPrintPause&&(l.statusPrintPause.hidden=!a,l.statusPrintPause.disabled=!d||o||!a),l.statusPrintResume&&(l.statusPrintResume.hidden=!c,l.statusPrintResume.disabled=!d||o||!c),l.statusPrintCancel&&(l.statusPrintCancel.hidden=!d,l.statusPrintCancel.disabled=!d||o)}function Ds(){const n=s.connectionStatus==="connected",e=s.jobs.actionInFlight,t=$s(),i=t.filename?`${Dc[t.state]?.label||"Job"}: ${t.filename}`:"Printer is idle.";if(l.jobsActiveLabel&&(l.jobsActiveLabel.textContent=i),l.jobsPause&&(l.jobsPause.disabled=!n||e||t.state!=="printing"),l.jobsResume&&(l.jobsResume.disabled=!n||e||t.state!=="paused"),l.jobsCancel){const r=t.state==="printing"||t.state==="paused";l.jobsCancel.disabled=!n||e||!r}_E(t,{isConnected:n,busy:e})}function Vr(n){const e=Number(n);return!Number.isFinite(e)||e<=0?"--":e>=1e3?`${(e/1e3).toFixed(2)} m`:`${e.toFixed(2)} mm`}function bE(n){const e=Number(n);return!Number.isFinite(e)||e<=0?"--":e>=1e3?`${(e/1e3).toFixed(2)} kg`:`${e.toFixed(2)} g`}function za(n){const e=Number(n);return Number.isFinite(e)?`${e.toFixed(1)}C`:"--"}function yE(n,e){const t=[];return Rr().forEach(r=>{if(r==="size"){t.push(vr(n.size)||"--");return}if(r==="modified"){t.push(`Modified: ${Ch(n.modifiedMs)}`);return}if(r==="eta"){const o=Number(e?.estimatedTime),a=Number.isFinite(o)&&o>0?Tl(o):"--";t.push(`ETA: ${a}`);return}if(r==="total_layers"){const o=Number(e?.totalLayers),a=Number.isFinite(o)&&o>0?String(Math.round(o)):"--";t.push(`Layers: ${a}`);return}if(r==="layer_height"){t.push(`Layer H: ${Vr(e?.layerHeight)}`);return}if(r==="first_layer_height"){t.push(`First Layer H: ${Vr(e?.firstLayerHeight)}`);return}if(r==="object_height"){t.push(`Object H: ${Vr(e?.objectHeight)}`);return}if(r==="filament_length"){t.push(`Filament: ${Vr(e?.filamentTotal)}`);return}if(r==="filament_weight"){t.push(`Filament W: ${bE(e?.filamentWeightTotal)}`);return}if(r==="filament_type"){t.push(`Filament Type: ${e?.filamentType||"--"}`);return}if(r==="filament_name"){t.push(`Filament Name: ${e?.filamentName||"--"}`);return}if(r==="nozzle_diameter"){t.push(`Nozzle: ${Vr(e?.nozzleDiameter)}`);return}if(r==="first_layer_extruder_temp"){t.push(`1st Nozzle: ${za(e?.firstLayerExtruderTemp)}`);return}if(r==="first_layer_bed_temp"){t.push(`1st Bed: ${za(e?.firstLayerBedTemp)}`);return}r==="chamber_temp"&&t.push(`Chamber: ${za(e?.chamberTemp)}`)}),t.join(" | ")}function Xs(n){const e=Ke(n);if(!e)return"";const t=e.split("/").filter(Boolean);return t.pop(),t.join("/")}function dn(n){const e=Ke(n);return e?`gcodes/${e}`:"gcodes/"}function Yc(){if(!l.fileList)return;const n=s.connectionStatus==="connected",e=s.jobs.isLoading||s.jobs.actionInFlight,t=String(s.jobs.searchQuery||"").trim().toLowerCase(),i=Ar(s.jobs.typeFilter),r=Ke(s.jobs.currentDirectory),o=Xs(r),{directories:a,files:c}=lE(),d=dE(a).filter(h=>i==="files"?!1:t?h.displayName.toLowerCase().includes(t):!0),u=uE(c).filter(h=>i==="folders"?!1:t?h.path.toLowerCase().includes(t):!0),f=!!r&&!t&&i!=="files";if(l.fileList.innerHTML="",!n){const h=document.createElement("p");h.className="muted",h.textContent="Print files are unavailable while disconnected.",l.fileList.appendChild(h);return}if(s.jobs.isLoading){const h=document.createElement("p");h.className="muted",h.textContent="Loading print files...",l.fileList.appendChild(h);return}if(!f&&!d.length&&!u.length){const h=document.createElement("p");h.className="muted",h.textContent=t?`No files or folders match "${t}".`:"No print files found in this directory.",l.fileList.appendChild(h);return}if(f){const h=document.createElement("article");h.className="jobs-entry jobs-entry-folder jobs-entry-parent";const m=document.createElement("div");m.className="jobs-entry-body";const _=document.createElement("p");_.className="jobs-entry-title",_.textContent="..";const b=document.createElement("p");b.className="jobs-entry-detail muted",b.textContent=`Up to ${dn(o)}`,m.append(_,b);const x=document.createElement("div");x.className="jobs-entry-actions";const g=document.createElement("button");g.type="button",g.className="jobs-entry-btn",g.textContent="^",g.disabled=e,g.addEventListener("click",()=>{qc(o)}),x.append(g),h.append(m,x),l.fileList.appendChild(h)}d.forEach(h=>{const m=document.createElement("article");m.className="jobs-entry jobs-entry-folder";const _=document.createElement("div");_.className="jobs-entry-body";const b=document.createElement("p");b.className="jobs-entry-title",b.textContent=h.displayName,b.title=h.path;const x=document.createElement("p");x.className="jobs-entry-detail muted";const g=h.fileCount===1?"file":"files",w=vr(h.size)||"--",T=h.modifiedMs?Ch(h.modifiedMs):"--";x.textContent=`${h.fileCount} ${g} | ${w} | Latest: ${T}`,_.append(b,x);const L=document.createElement("div");L.className="jobs-entry-actions";const R=document.createElement("button");R.type="button",R.className="jobs-entry-btn",R.textContent="Open",R.disabled=e,R.addEventListener("click",()=>{qc(h.path)});const M=document.createElement("button");M.type="button",M.className="jobs-entry-btn",M.textContent="Rename",M.disabled=e,M.addEventListener("click",async()=>{await wE(h.path)});const A=document.createElement("button");A.type="button",A.className="jobs-entry-btn",A.textContent="Move",A.disabled=e,A.addEventListener("click",async()=>{await AE(h.path)});const F=document.createElement("button");F.type="button",F.className="jobs-entry-btn danger",F.textContent="Delete",F.disabled=e,F.addEventListener("click",async()=>{await RE(h.path)}),L.append(R,M,A,F),m.append(_,L),l.fileList.appendChild(m)});const p=ut($s().filename);u.forEach(h=>{const m=document.createElement("article");m.className="jobs-entry jobs-entry-file",p&&p===h.path&&m.classList.add("is-active-job");const _=document.createElement("div");_.className="jobs-entry-thumb-wrap";const b=s.jobs.metadataByPath.get(h.path),x=b?.thumbnailPath||"";if(x){const P=document.createElement("img");P.className="jobs-entry-thumb",P.loading="lazy",P.alt=`Thumbnail for ${h.displayName}`,P.src=nh(x),P.addEventListener("error",()=>{_.classList.add("is-fallback"),P.remove(),_.textContent="G"}),_.appendChild(P)}else _.classList.add("is-fallback"),_.textContent="G",s.jobs.metadataLoading.has(h.path)||Iu(h.path);const g=document.createElement("div");g.className="jobs-entry-body";const w=document.createElement("p");w.className="jobs-entry-title",w.textContent=h.displayName,w.title=h.path;const T=document.createElement("p");T.className="jobs-entry-detail muted",T.textContent=yE(h,b),g.append(w,T);const L=document.createElement("div");L.className="jobs-entry-actions";const R=document.createElement("button");R.type="button",R.className="jobs-entry-btn",R.textContent=s.jobs.actionInFlight&&s.jobs.activePath===h.path&&s.jobs.actionLabel==="print"?"Printing...":"Print",R.disabled=e,R.addEventListener("click",async()=>{await Lh(h.path)});const M=document.createElement("button");M.type="button",M.className="jobs-entry-btn",M.textContent=s.jobs.actionInFlight&&s.jobs.activePath===h.path&&s.jobs.actionLabel==="simulate"?"Loading...":"Simulate",M.disabled=e,M.addEventListener("click",async()=>{await PE(h.path)});const A=document.createElement("button");A.type="button",A.className="jobs-entry-btn",A.textContent="Rename",A.disabled=e,A.addEventListener("click",async()=>{await TE(h.path)});const F=document.createElement("button");F.type="button",F.className="jobs-entry-btn",F.textContent="Move",F.disabled=e,F.addEventListener("click",async()=>{await CE(h.path)});const E=document.createElement("button");E.type="button",E.className="jobs-entry-btn",E.textContent="Download",E.disabled=e,E.addEventListener("click",async()=>{await EE(h.path)});const S=document.createElement("button");S.type="button",S.className="jobs-entry-btn danger",S.textContent="Delete",S.disabled=e,S.addEventListener("click",async()=>{await LE(h.path)}),L.append(R,M,A,F,E,S),m.append(_,g,L),l.fileList.appendChild(m),!b&&!s.jobs.metadataLoading.has(h.path)&&Iu(h.path)})}function SE(){if(!l.jobsSummary)return;const n=s.jobs.files.length,e=s.jobs.directories.length,t=s.jobs.files.reduce((d,u)=>d+(Number(u.size)||0),0),i=Ke(s.jobs.currentDirectory),r=i?`gcodes/${i}`:"gcodes/",o=t>0?` | Total: ${vr(t)}`:"",a=`${n} print file${n===1?"":"s"}`,c=`${e} folder${e===1?"":"s"}`;l.jobsSummary.textContent=`${a} | ${c} in ${r}${o}`}function vE(){if(!s.client){en("Connect to Moonraker to manage print files.","warn");return}if(s.connectionStatus!=="connected"){en("Moonraker disconnected. Reconnect to manage print files.","warn");return}if(s.jobs.isLoading){en("Loading print files...","info");return}if(s.jobs.actionInFlight){en("Running print file action...","warn");return}if(s.jobs.lastError){en(`Print files action failed: ${s.jobs.lastError}`,"error");return}if(s.jobs.lastUpdatedMs){en(`Last refreshed: ${new Date(s.jobs.lastUpdatedMs).toLocaleTimeString()}`,"info");return}en("Press Refresh to load print files.","info")}function Ge(){l.jobsSearch&&l.jobsSearch.value!==s.jobs.searchQuery&&(l.jobsSearch.value=s.jobs.searchQuery),l.jobsSort&&(l.jobsSort.value=wr(s.jobs.sortMode)),l.jobsTypeFilter&&(l.jobsTypeFilter.value=Ar(s.jobs.typeFilter));const n=s.connectionStatus==="connected",e=s.jobs.isLoading||s.jobs.actionInFlight;l.jobsRefresh&&(l.jobsRefresh.disabled=!n||e,l.jobsRefresh.classList.toggle("is-loading",s.jobs.isLoading),l.jobsRefresh.title=s.jobs.isLoading?"Loading...":"Refresh",l.jobsRefresh.setAttribute("aria-label",s.jobs.isLoading?"Loading print files":"Refresh file list")),l.jobsSortToggle&&(l.jobsSortToggle.disabled=e),l.jobsColumnsToggle&&(l.jobsColumnsToggle.disabled=e),l.jobsSearchToggle&&(l.jobsSearchToggle.disabled=e),l.jobsFilterToggle&&(l.jobsFilterToggle.disabled=e),l.jobsAddToggle&&(l.jobsAddToggle.disabled=!n||e),l.jobsUploadBtn&&(l.jobsUploadBtn.disabled=!n||e),l.jobsUploadFolderBtn&&(l.jobsUploadFolderBtn.disabled=!n||e),l.jobsUploadPrintBtn&&(l.jobsUploadPrintBtn.disabled=!n||e),l.jobsAddFileBtn&&(l.jobsAddFileBtn.disabled=!n||e),l.jobsNewFolder&&(l.jobsNewFolder.disabled=!n||e),l.jobsSearch&&(l.jobsSearch.disabled=e),(!n||e)&&(kt(),s.jobs.uploadDragDepth=0,eo(!1)),SE(),mE(),Nl(),xE(),Ds(),Yc(),vE()}async function di({source:n="user",silent:e=!1}={}){if(!s.client||s.connectionStatus!=="connected")return Ge(),[];if(s.jobs.isLoading)return s.jobs.files||[];s.jobs.isLoading=!0,s.jobs.lastError="",Ge();try{const t=await s.client.getGcodeFiles(),i=sE(t);return cE(i),s.jobs.lastError="",s.jobs.lastUpdatedMs=Date.now(),bn(),n==="user"&&pe(`Loaded ${i.files.length} print file${i.files.length===1?"":"s"}.`,"info"),Ge(),i.files}catch(t){const i=t?.message||String(t);return s.jobs.lastError=i,e||pe(`Print files load failed: ${i}`,"error"),Ge(),[]}finally{s.jobs.isLoading=!1,Ge()}}async function EE(n){const e=ut(n);if(!e||!s.client||s.connectionStatus!=="connected")return!1;s.jobs.actionInFlight=!0,s.jobs.actionLabel="download",s.jobs.activePath=e,Ge();try{const t=await s.client.getFileBlob("gcodes",e),i=Ui(e)||"print.gcode",r=URL.createObjectURL(t),o=document.createElement("a");return o.href=r,o.download=i,document.body.appendChild(o),o.click(),o.remove(),URL.revokeObjectURL(r),s.jobs.lastError="",pe(`Downloaded print file: ${dn(e)}`,"info"),!0}catch(t){const i=t?.message||String(t);return s.jobs.lastError=i,pe(`Print file download failed (${e}): ${i}`,"error"),!1}finally{s.jobs.actionInFlight=!1,s.jobs.actionLabel="",s.jobs.activePath="",Ge()}}function Ah(n){const e=String(n||"").trim();return!e||e.includes("/")||e.includes("\\")?"":e}function ME(n,e){const t=Ke(n),i=Ke(e),r=Ke(s.jobs.currentDirectory);if(!(!t||!i||!r)){if(r===t){s.jobs.currentDirectory=i,bn();return}if(r.startsWith(`${t}/`)){const o=r.slice(t.length+1);s.jobs.currentDirectory=o?`${i}/${o}`:i,bn()}}}async function qs(n,e,{entryType:t="file",mode:i="move"}={}){const r=t==="directory"?Ke:ut,o=r(n),a=r(e);if(!o||!a||!s.client||s.connectionStatus!=="connected"||o===a)return!1;if(t==="directory"&&a.startsWith(`${o}/`))return en("Cannot move a folder into itself.","warn"),!1;s.jobs.actionInFlight=!0,s.jobs.actionLabel=i,s.jobs.activePath=o,Ge();try{return await s.client.moveFile("gcodes",o,a),s.jobs.lastError="",t==="directory"&&ME(o,a),pe(`${i==="rename"?"Renamed":"Moved"} ${t==="directory"?"folder":"print file"}: ${dn(o)} -> ${dn(a)}`,"info"),await di({source:i,silent:!0}),!0}catch(c){const d=c?.message||String(c);return s.jobs.lastError=d,pe(`${t==="directory"?"Folder":"Print file"} ${i==="rename"?"rename":"move"} failed (${o}): ${d}`,"error"),Ge(),!1}finally{s.jobs.actionInFlight=!1,s.jobs.actionLabel="",s.jobs.activePath="",Ge()}}async function TE(n){const e=ut(n);if(!e)return!1;const t=Ui(e)||"",i=window.prompt("Rename print file to:",t);if(i===null)return!1;const r=Ah(i);if(!r)return en("Enter a valid file name.","warn"),!1;const o=Ps(e),a=o?`${o}/${r}`:r;return qs(e,a,{entryType:"file",mode:"rename"})}async function CE(n){const e=ut(n);if(!e)return!1;const t=Ui(e);if(!t)return!1;const i=Ps(e),r=window.prompt("Move print file to folder (relative to gcodes root):",i);if(r===null)return!1;const o=Ke(r),a=o?`${o}/${t}`:t;return qs(e,a,{entryType:"file",mode:"move"})}async function wE(n){const e=Ke(n);if(!e)return!1;const t=Ui(e)||"",i=window.prompt("Rename folder to:",t);if(i===null)return!1;const r=Ah(i);if(!r)return en("Enter a valid folder name.","warn"),!1;const o=Xs(e),a=o?`${o}/${r}`:r;return qs(e,a,{entryType:"directory",mode:"rename"})}async function AE(n){const e=Ke(n);if(!e)return!1;const t=Ui(e);if(!t)return!1;const i=Xs(e),r=window.prompt("Move folder to destination parent (relative to gcodes root):",i);if(r===null)return!1;const o=Ke(r),a=o?`${o}/${t}`:t;return qs(e,a,{entryType:"directory",mode:"move"})}async function LE(n){const e=ut(n);if(!e||!s.client||s.connectionStatus!=="connected"||!window.confirm(`Delete print file ${dn(e)}? This cannot be undone.`))return!1;s.jobs.actionInFlight=!0,s.jobs.actionLabel="delete",s.jobs.activePath=e,Ge();try{return await s.client.deleteFile("gcodes",e),s.jobs.lastError="",pe(`Deleted print file: ${dn(e)}`,"warn"),await di({source:"delete",silent:!0}),!0}catch(i){const r=i?.message||String(i);return s.jobs.lastError=r,pe(`Print file delete failed (${e}): ${r}`,"error"),Ge(),!1}finally{s.jobs.actionInFlight=!1,s.jobs.actionLabel="",s.jobs.activePath="",Ge()}}async function RE(n){const e=Ke(n);if(!e||!s.client||s.connectionStatus!=="connected"||!window.confirm(`Delete folder ${dn(e)} and its contents? This cannot be undone.`))return!1;s.jobs.actionInFlight=!0,s.jobs.actionLabel="delete",s.jobs.activePath=e,Ge();try{await s.client.deleteDirectory("gcodes",e,{force:!0});const i=Ke(s.jobs.currentDirectory);return(i===e||i.startsWith(`${e}/`))&&(s.jobs.currentDirectory=Xs(e),bn()),s.jobs.lastError="",pe(`Deleted folder: ${dn(e)}`,"warn"),await di({source:"delete",silent:!0}),!0}catch(i){const r=i?.message||String(i);return s.jobs.lastError=r,pe(`Folder delete failed (${e}): ${r}`,"error"),Ge(),!1}finally{s.jobs.actionInFlight=!1,s.jobs.actionLabel="",s.jobs.activePath="",Ge()}}async function PE(n){const e=ut(n);if(!e||!s.client||s.connectionStatus!=="connected")return!1;s.jobs.actionInFlight=!0,s.jobs.actionLabel="simulate",s.jobs.activePath=e,Ge();try{return await eE(e)?(s.jobs.lastError="",pe(`Loaded simulation file: ${dn(e)}`,"info"),await Jc("pretty-gcode"),!0):(s.jobs.lastError=s.prettyGcode.lastError||"Failed to load simulation file.",Ge(),!1)}catch(t){const i=t?.message||String(t);return s.jobs.lastError=i,pe(`Simulation load failed (${e}): ${i}`,"error"),Ge(),!1}finally{s.jobs.actionInFlight=!1,s.jobs.actionLabel="",s.jobs.activePath="",Ge()}}async function Lh(n){const e=ut(n);if(!e||!s.client||s.connectionStatus!=="connected")return!1;const t=$s();if((t.state==="printing"||t.state==="paused")&&!window.confirm(`A job is currently ${t.state}. Start ${dn(e)} anyway?`))return!1;s.jobs.actionInFlight=!0,s.jobs.actionLabel="print",s.jobs.activePath=e,Ge();try{return await s.client.startPrint(e),s.jobs.lastError="",pe(`Started print: ${dn(e)}`,"info"),!0}catch(r){const o=r?.message||String(r);return s.jobs.lastError=o,pe(`Start print failed (${e}): ${o}`,"error"),!1}finally{s.jobs.actionInFlight=!1,s.jobs.actionLabel="",s.jobs.activePath="",Ge()}}function IE(n){return String(n?.webkitRelativePath||n?.name||"").trim().replace(/\\/g,"/").replace(/^\/+/,"").replace(/\/+/g,"/")}function DE(n){const e=Ke(n);if(!e)return{directory:"",filename:""};const t=e.split("/").filter(Boolean),i=t.pop()||"";return{directory:t.join("/"),filename:i}}function FE(n){const e=String(n?.message||"").toLowerCase(),t=Number(n?.status);return e.includes("exist")||e.includes("already")||t===409}async function NE(n){const e=Ke(n);if(!e||!s.client)return;const t=e.split("/").filter(Boolean);let i="";for(const r of t){i=i?`${i}/${r}`:r;try{await s.client.createDirectory("gcodes",i)}catch(o){if(!FE(o))throw o}}}async function UE(n,e,t){const i=Ke(e),r=String(t||"").trim();if(!r)throw new Error("A valid file name is required for upload.");return i&&await NE(i),await s.client.uploadFile("gcodes",n,i,r),i?`${i}/${r}`:r}async function qr(n,{preserveRelativePaths:e=!1,printAfterUpload:t=!1,mode:i="upload"}={}){if(!s.client||s.connectionStatus!=="connected")return!1;const r=Array.isArray(n)?n:[...n||[]];if(!r.length)return!1;s.jobs.actionInFlight=!0,s.jobs.actionLabel=String(i||"upload").trim()||"upload",s.jobs.activePath="",Ge();let o=0;const a=[];try{const c=Ke(s.jobs.currentDirectory);for(const d of r){const u=e?IE(d):Ke(d?.name||""),{directory:f,filename:p}=DE(u);if(!p)continue;const h=e?Ke([c,f].filter(Boolean).join("/")):c,m=await UE(d,h,p);a.push(m),o+=1}if(!o)throw new Error("No valid files were selected for upload.");return s.jobs.lastError="",pe(`Uploaded ${o} file${o===1?"":"s"}.`,"info"),await di({source:"upload",silent:!0}),t&&a.length&&await Lh(a[0]),!0}catch(c){const d=c?.message||String(c);return s.jobs.lastError=d,pe(`Print file upload failed: ${d}`,"error"),Ge(),!1}finally{s.jobs.actionInFlight=!1,s.jobs.actionLabel="",s.jobs.activePath="",s.jobs.uploadDragDepth=0,l.jobsCard?.classList.remove("is-drag-over"),Ge()}}async function OE(){if(!s.client||s.connectionStatus!=="connected")return!1;const e=window.prompt("Enter the new folder name (relative to current directory):","new-folder");if(e===null)return!1;const t=Ke(e);if(!t)return en("Enter a valid folder name.","warn"),!1;const i=Ke(s.jobs.currentDirectory),r=i?`${i}/${t}`:t;s.jobs.actionInFlight=!0,s.jobs.actionLabel="mkdir",s.jobs.activePath=r,Ge();try{return await s.client.createDirectory("gcodes",r),s.jobs.lastError="",pe(`Created folder: ${dn(r)}`,"info"),s.jobs.currentDirectory=Ke(r),bn(),await di({source:"mkdir",silent:!0}),!0}catch(o){const a=o?.message||String(o);return s.jobs.lastError=a,pe(`Create folder failed (${r}): ${a}`,"error"),Ge(),!1}finally{s.jobs.actionInFlight=!1,s.jobs.actionLabel="",s.jobs.activePath="",Ge()}}function Kc(n){return n?Array.from(n.types||[]).includes("Files"):!1}function eo(n){l.jobsCard&&l.jobsCard.classList.toggle("is-drag-over",!!n)}async function BE(n){if(!s.client||s.connectionStatus!=="connected"||!Kc(n.dataTransfer))return;n.preventDefault(),s.jobs.uploadDragDepth=0,eo(!1);const e=[...n.dataTransfer?.files||[]];e.length&&await qr(e,{mode:"drop-upload"})}async function or(n){if(!s.client||s.connectionStatus!=="connected")return!1;const e=String(n||"").trim().toLowerCase();if(!["pause","resume","cancel"].includes(e))return!1;const t=e==="cancel"?"cancel":e;s.jobs.actionInFlight=!0,s.jobs.actionLabel=t,s.jobs.activePath="",Ge();try{if(e==="pause")await s.client.pausePrint();else if(e==="resume")await s.client.resumePrint();else{if(!window.confirm("Cancel the active print job?"))return!1;await s.client.cancelPrint()}return s.jobs.lastError="",pe(`Job action sent: ${e.toUpperCase()}`,"info"),!0}catch(i){const r=i?.message||String(i);return s.jobs.lastError=r,pe(`Job action failed (${e}): ${r}`,"error"),!1}finally{s.jobs.actionInFlight=!1,s.jobs.actionLabel="",s.jobs.activePath="",Ge()}}function bo(n){return String(n||"").trim().replace(/\\/g,"/").replace(/^\/+/,"").replace(/^config\//i,"")}function Rh(n){const e=bo(n);if(!e)return"";const t=e.split("/").filter(Boolean);return t.length<=1?"":t.slice(0,-1).join("/")}function uo(n){const e=String(n?.relativePath||n?.path||"").trim().replace(/\\/g,"/").replace(/\/+$/,"");if(!e)return"";const t=e.split("/").filter(Boolean);return t.length?t[t.length-1]:e}function vr(n){const e=Number(n);return!Number.isFinite(e)||e<0?"":e<1024?`${e} B`:e<1024*1024?`${Math.round(e/1024)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}function Pr(n){const e=String(n||"").toLowerCase().trim();switch(e){case dt.EXAMPLE:case dt.LOG:case dt.BACKUP:case dt.CONFIG:case dt.DOC:return e;default:return dt.ALL}}function GE(n,e=""){const t=String(n||"").toLowerCase(),i=String(e||"").toLowerCase().trim();if(!t)return null;if(i.includes("example")||t.includes("example"))return dt.EXAMPLE;if(i==="docs"&&(t.startsWith("img/")||t.startsWith("prints/")||t.startsWith("_klipper3d/")||t.startsWith("_kliper3d/")))return dt.DOC;const o=t.split("/").pop()||t,a=/^printer-\d{8}_\d{6}\.cfg$/i.test(o),c=/^crowsnest\.conf\.\d{4}-\d{2}-\d{2}-\d{4}$/i.test(o);return a||c||/\.bak(?:$|[._-]|\d)/i.test(t)||/\.bkp(?:$|[._-]|\d)/i.test(t)?dt.BACKUP:/\.log(?:$|[._-]|\d)/i.test(t)?dt.LOG:/\.(conf|cfg|config)$/i.test(t)?dt.CONFIG:/\.(doc|md|txt)$/i.test(t)?dt.DOC:null}function Ph(n,e){const t=String(n||"").trim().replace(/\\/g,"/").replace(/^\/+/,""),i=String(e||"").trim().replace(/^\/+/,"").replace(/\/+$/,"");if(!i)return t;const r=`${i}/`;return t.toLowerCase().startsWith(r.toLowerCase())?t.slice(r.length):t}function Ul(n,e){const t=String(n||"").trim(),i=Ph(e,n);return!t||!i?"":`${t}/${i}`}function ui(n){const e=String(n||"").trim();return e&&s.config.files.find(t=>t.path===e)||null}function kE(n){return String(n||"").replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function Ha(n,e){n&&(n.classList.toggle("is-active",!!e),n.setAttribute("aria-pressed",String(!!e)))}function Ti(){const n=!!s.config.selectedPath,e=s.configSearch.matches.length>0&&!s.configSearch.invalidRegex;if(l.configSearchInput&&(l.configSearchInput.disabled=!n),[l.configSearchPrev,l.configSearchNext].forEach(r=>{r&&(r.disabled=!n||!e)}),[l.configSearchCase,l.configSearchWord,l.configSearchRegex].forEach(r=>{r&&(r.disabled=!n)}),Ha(l.configSearchCase,s.configSearch.caseSensitive),Ha(l.configSearchWord,s.configSearch.wholeWord),Ha(l.configSearchRegex,s.configSearch.useRegex),!l.configSearchCount)return;if(!n){l.configSearchCount.textContent="0/0";return}if(s.configSearch.invalidRegex){l.configSearchCount.textContent="Invalid";return}const t=s.configSearch.matches.length,i=s.configSearch.activeIndex;l.configSearchCount.textContent=t>0&&i>=0?`${i+1}/${t}`:`0/${t}`}function Ol({clearQuery:n=!1}={}){n&&l.configSearchInput&&(l.configSearchInput.value=""),n&&(s.configSearch.query=""),s.configSearch.matches=[],s.configSearch.activeIndex=-1,s.configSearch.invalidRegex=!1,Ti()}function zE(){if(!s.configSearch.query)return null;const n=s.configSearch.useRegex?s.configSearch.query:kE(s.configSearch.query),e=s.configSearch.wholeWord?`\\b${n}\\b`:n,t=s.configSearch.caseSensitive?"g":"gi";try{return new RegExp(e,t)}catch{return s.configSearch.invalidRegex=!0,null}}function HE(n,e){const t=[];let i=0,r;for(;(r=e.exec(n))!==null&&!(i>2e4);){i+=1;const o=String(r[0]||"");if(!o.length){e.lastIndex+=1;continue}t.push({start:r.index,end:r.index+o.length})}return t}function Ih(){const n=l.configEditor;if(!n||n.disabled)return;const e=s.configSearch.matches[s.configSearch.activeIndex];e&&(n.focus(),n.setSelectionRange(e.start,e.end,"forward"))}function fo({preserveActive:n=!1,focusActive:e=!1}={}){const t=l.configEditor,i=!!s.config.selectedPath,r=String(l.configSearchInput?.value||"").trim();if(s.configSearch.query=r,s.configSearch.invalidRegex=!1,!i||!t||!r){s.configSearch.matches=[],s.configSearch.activeIndex=-1,Ti();return}const o=n&&s.configSearch.activeIndex>=0?s.configSearch.matches[s.configSearch.activeIndex]:null,a=zE();if(!a){s.configSearch.matches=[],s.configSearch.activeIndex=-1,Ti();return}const c=HE(t.value||"",a);if(s.configSearch.matches=c,!c.length){s.configSearch.activeIndex=-1,Ti();return}if(o){const d=c.findIndex(u=>u.start===o.start&&u.end===o.end);s.configSearch.activeIndex=d>=0?d:0}else{const d=Number(t.selectionStart),u=c.findIndex(f=>f.start>=d);s.configSearch.activeIndex=u>=0?u:0}Ti(),e&&Ih()}function es(n=1){if(!!!s.config.selectedPath)return;if(!s.configSearch.matches.length||s.configSearch.invalidRegex){fo({preserveActive:!1,focusActive:!0});return}const t=s.configSearch.matches.length,i=s.configSearch.activeIndex<0?0:(s.configSearch.activeIndex+n+t)%t;s.configSearch.activeIndex=i,Ti(),Ih()}function Va(n,e){s.configSearch[n]=!!e,Ti(),fo({preserveActive:!1,focusActive:!1})}function VE(){!l.configSearchInput||l.configSearchInput.disabled||(l.configSearchInput.focus(),l.configSearchInput.select())}function Je(n,e="info"){l.configStatus&&(l.configStatus.textContent=n,l.configStatus.dataset.level=e)}function Bi(n){const e=ui(s.config.selectedPath),t=s.config.draftContent!==s.config.originalContent,i=e?.root==="config";s.config.isDirty=!!n&&t&&i,l.configDirtyPrompt&&(l.configDirtyPrompt.hidden=!s.config.isDirty)}function Fi(){const n=ui(s.config.selectedPath),e=!!n,t=e?n.path:"";l.configCurrentFile&&(l.configCurrentFile.textContent=t||"No file selected"),l.configDownload&&(l.configDownload.hidden=!e,l.configDownload.disabled=!e),l.configDelete&&(l.configDelete.hidden=!e,l.configDelete.disabled=!e),!e&&l.configEditor&&(l.configEditor.value="",l.configEditor.disabled=!0),Bi(s.config.isDirty),e?fo({preserveActive:!1,focusActive:!1}):Ol({clearQuery:!0})}function to(){const n=Pr(s.config.fileTypeFilter),e=String(s.config.fileSearchQuery||"").trim(),t=e.toLowerCase().split(/\s+/).filter(Boolean);s.config.fileTypeFilter=n,s.config.fileSearchQuery=e,l.configFileSearch&&l.configFileSearch.value!==e&&(l.configFileSearch.value=e),ks(),s.config.filteredFiles=s.config.files.filter(i=>{if(n!==dt.ALL&&i.fileType!==n)return!1;if(!t.length)return!0;const r=`${i.path} ${i.relativePath}`.toLowerCase();return t.every(o=>r.includes(o))}),Dh()}function Dh(){if(!l.configFileList)return;if(l.configFileList.innerHTML="",!s.config.filteredFiles.length){const e=document.createElement("p");e.className="muted";const t=Pr(s.config.fileTypeFilter),i=String(s.config.fileSearchQuery||"").trim();if(!s.config.files.length)e.textContent="No supported files found (.conf, .cfg, .config, .log, .bak, .bkp, .doc, .md, .txt).";else if(i)if(t===dt.ALL)e.textContent=`No files match "${i}".`;else{const r=Ra[t]||"files";e.textContent=`No ${r.toLowerCase()} match "${i}".`}else if(t===dt.ALL)e.textContent="No files found for the selected filters.";else{const r=Ra[t]||"files";e.textContent=`No ${r.toLowerCase()} found.`}l.configFileList.appendChild(e);return}let n="";s.config.filteredFiles.forEach(e=>{if(e.fileType!==n){const o=document.createElement("p");o.className="config-file-group muted",o.textContent=Ra[e.fileType]||"Files",l.configFileList.appendChild(o),n=e.fileType}const t=document.createElement("button");t.type="button",t.className="config-file-item",t.classList.toggle("active",e.path===s.config.selectedPath),t.title=e.path;const i=document.createElement("span");i.className="config-file-path",i.textContent=uo(e);const r=document.createElement("span");r.className="config-file-size muted",r.textContent=vr(e.size),t.append(i,r),t.addEventListener("click",async()=>{await Fs(e.path)}),l.configFileList.appendChild(t)})}function WE(n,e="config"){const t=n?.result,i=Array.isArray(t)?t:Array.isArray(t?.files)?t.files:[],r=new Map;return i.forEach(o=>{if(!o||typeof o=="object"&&String(o.type||"").toLowerCase()==="directory")return;const a=typeof o=="string"?o:typeof o.path=="string"?o.path:[o.dirname,o.filename].filter(Boolean).join("/"),c=Ph(a,e);if(!c||c.endsWith("/"))return;const d=GE(c,e);if(!d)return;const u=Ul(e,c);if(!u)return;const f=Number(o?.size),p=Number.isFinite(f)&&f>=0?f:null;r.has(u)||r.set(u,{path:u,root:e,relativePath:c,size:p,fileType:d})}),[...r.values()].sort((o,a)=>{const c=Ts[o.fileType]??Number.MAX_SAFE_INTEGER,d=Ts[a.fileType]??Number.MAX_SAFE_INTEGER;if(c!==d)return c-d;const u=uo(o).toLowerCase(),f=uo(a).toLowerCase();return u!==f?u.localeCompare(f):o.path.localeCompare(a.path)})}async function jE(){if(!s.client)return[...Pa];try{const e=(await s.client.getServerInfo())?.result||{},i=(Array.isArray(e.registered_directories)?e.registered_directories:[]).map(o=>String(o||"").trim()).filter(Boolean).filter(o=>!ey.has(o)),r=[...new Set(i)];return Pa.forEach(o=>{r.includes(o)||r.push(o)}),r}catch(n){return Ue.debug("Config root discovery failed; using fallback roots.",{error:n?.message||String(n)}),[...Pa]}}async function Gi({preserveSelection:n=!0}={}){if(!s.client)return Je("Connect to Moonraker from Settings to manage configuration files.","warn"),[];s.activeView==="configuration"&&l.configFileList&&(l.configFileList.innerHTML='<p class="muted">Loading configuration files...</p>');try{const e=await jE(),i=(await Promise.allSettled(e.map(r=>s.client.getFilesByRoot(r)))).flatMap((r,o)=>r.status!=="fulfilled"?[]:WE(r.value,e[o]));return i.sort((r,o)=>{const a=Ts[r.fileType]??Number.MAX_SAFE_INTEGER,c=Ts[o.fileType]??Number.MAX_SAFE_INTEGER;if(a!==c)return a-c;const d=uo(r).toLowerCase(),u=uo(o).toLowerCase();return d!==u?d.localeCompare(u):r.path.localeCompare(o.path)}),s.config.files=i,n&&s.config.selectedPath&&(i.some(o=>o.path===s.config.selectedPath)||(s.config.selectedPath="",s.config.originalContent="",s.config.draftContent="",Bi(!1),ks())),to(),Fi(),n&&s.activeView==="configuration"&&s.config.selectedPath&&!s.config.originalContent&&!s.config.draftContent&&await Fh(s.config.selectedPath),Je(`Loaded ${i.length} supported file${i.length===1?"":"s"}.`),i}catch(e){const t=e?.message||String(e);return Je(`Failed to load configuration files: ${t}`,"error"),pe(`Config file load failed: ${t}`,"error"),Ue.error("Config file load failed.",{error:t}),l.configFileList&&(l.configFileList.innerHTML=`<p class="muted">Failed to load config files: ${t}</p>`),[]}}async function Fh(n){const e=ui(n);if(!e||!s.client||s.config.isLoadingFile)return!1;s.config.isLoadingFile=!0,Je(`Loading ${e.path}...`),l.configEditor&&(l.configEditor.disabled=!0);try{const t=await s.client.getFileText(e.root,e.relativePath);return s.config.selectedPath=e.path,ks(),s.config.originalContent=t,s.config.draftContent=t,l.configEditor&&(l.configEditor.value=t,l.configEditor.disabled=e.root!=="config"),Bi(!1),Fi(),Dh(),Je(`Loaded ${e.path}.`),!0}catch(t){const i=t?.message||String(t);return Je(`Failed to load ${e.path}: ${i}`,"error"),pe(`Config open failed: ${i}`,"error"),Ue.error("Config file load failed.",{path:e.path,error:i}),Fi(),!1}finally{s.config.isLoadingFile=!1}}function Nh({notify:n=!0}={}){s.config.selectedPath&&(s.config.draftContent=s.config.originalContent,l.configEditor&&(l.configEditor.value=s.config.originalContent,l.configEditor.disabled=!1),Bi(!1),n&&(Je(`Ignored changes for ${s.config.selectedPath}.`,"warn"),pe(`Ignored unsaved changes: ${s.config.selectedPath}`,"warn")))}async function Uh(){const n=ui(s.config.selectedPath);if(!n||!s.client)return Je("Select a configuration file before saving.","warn"),!1;if(n.root!=="config")return Je("Save & Restart Firmware is only available for files under config/.","warn"),!1;const e=bo(n.relativePath),t=l.configEditor?l.configEditor.value:s.config.draftContent;s.config.draftContent=t,Je(`Saving ${e}...`);try{return await s.client.saveConfigFileText(e,t),s.config.originalContent=t,s.config.draftContent=t,Bi(!1),Fi(),pe(`Config saved: ${e}`,"info"),Je(`Saved ${e}. Restarting firmware...`),await nn("FIRMWARE_RESTART",{actionLabel:"Firmware restart"})?Je(`Saved ${e} and requested firmware restart.`):(pe("Firmware restart failed after config save.","warn"),Je(`Saved ${e}, but firmware restart failed.`,"warn")),await Gi({preserveSelection:!0}),!0}catch(i){const r=i?.message||String(i);return pe(`Config save failed: ${r}`,"error"),Je(`Failed to save ${e}: ${r}`,"error"),Ue.error("Config save failed.",{path:e,error:r}),!1}}async function Bl(){return!s.config.isDirty||!s.config.selectedPath?!0:window.confirm(`Unsaved changes detected in ${s.config.selectedPath}.

Press OK to Save and Restart Firmware, or Cancel to Ignore Changes.`)?Uh():(Nh({notify:!0}),!0)}async function Fs(n){const e=String(n||"").trim();!e||e===s.config.selectedPath||s.config.isDirty&&!await Bl()||await Fh(e)}async function Jc(n){if(!(!n||n===s.activeView)&&!(s.activeView==="configuration"&&n!=="configuration"&&s.config.isDirty&&!await Bl())){if(ah(n),n==="files"){if(!s.client||s.connectionStatus!=="connected"){Ge();return}!s.jobs.files.length&&!s.jobs.directories.length?await di({source:"view",silent:!0}):(s.jobs.currentDirectory=Fl(s.jobs.currentDirectory),Ge());return}if(n==="pretty-gcode"){if(Yt({skipRender:!0}),yn()&&s.prettyGcode.segments.length){et();return}if(!s.client||s.connectionStatus!=="connected"){et();return}const e=ut(s.printStatus.lastPrintStats?.filename||s.printStatus.filename||s.prettyGcode.activeFile);if(!e){await Di(""),et();return}await Di(e);return}if(n==="configuration"){if(!s.client){Je("Connect to Moonraker from Settings to manage configuration files.","warn");return}if(s.config.files.length?(to(),Fi()):await Gi({preserveSelection:!0}),s.updateManager.lastUpdatedMs)qt();else try{await Lr({forceRefresh:!1,source:"view"})}catch{}s.connectionStatus==="connected"&&!s.endstops.lastUpdatedMs&&!s.endstops.queryInFlight?Rs({source:"view",silent:!0}):Cn(),s.connectionStatus==="connected"&&!s.logFiles.lastUpdatedMs&&!s.logFiles.isLoading?xo({source:"view",silent:!0}):Pt()}}}async function $E(n){if(!n)return!1;if(!s.client)return Je("Connect to Moonraker from Settings before uploading.","warn"),!1;const e=ui(s.config.selectedPath),t=e?.root==="config"?Rh(e.relativePath):"";Je(`Uploading ${n.name}...`);try{await s.client.uploadFile("config",n,t,n.name),pe(`Config uploaded: ${n.name}`,"info"),await Gi({preserveSelection:!0});const i=bo(t?`${t}/${n.name}`:n.name);return i&&await Fs(Ul("config",i)),Je(`Uploaded ${n.name}.`),!0}catch(i){const r=i?.message||String(i);return pe(`Config upload failed: ${r}`,"error"),Je(`Failed to upload ${n.name}: ${r}`,"error"),Ue.error("Config upload failed.",{filename:n.name,error:r}),!1}}function XE(n){if(!n||n.endsWith("/"))return!1;const e=n.split("/").filter(Boolean);return e.length?!e.some(t=>t==="."||t===".."):!1}function qE(){const n=ui(s.config.selectedPath),e=n?.root==="config"?Rh(n.relativePath):"";return e?`${e}/new-file.cfg`:"new-file.cfg"}async function YE(){if(!s.client)return Je("Connect to Moonraker from Settings before creating files.","warn"),!1;if(s.config.isDirty&&!await Bl())return!1;const n=qE(),e=window.prompt("Enter the new config file path (relative to config/):",n);if(e===null)return!1;const t=bo(e);if(!XE(t))return Je("Enter a valid file path for the new config file.","warn"),!1;const i=Ul("config",t);if(s.config.files.some(o=>o.path===i))return Je(`File already exists: ${t}`,"warn"),await Fs(i),!1;Je(`Creating ${t}...`);try{return await s.client.saveConfigFileText(t,""),pe(`Config file created: ${t}`,"info"),await Gi({preserveSelection:!0}),await Fs(i),Je(`Created ${t}.`),!0}catch(o){const a=o?.message||String(o);return pe(`Config file create failed: ${a}`,"error"),Je(`Failed to create ${t}: ${a}`,"error"),Ue.error("Config file create failed.",{path:t,error:a}),!1}}async function KE(){const n=ui(s.config.selectedPath);if(!n)return!1;if(!s.client)return Je("Connect to Moonraker from Settings before deleting files.","warn"),!1;if(n.root!=="config")return Je("Deleting is only available for files under config/.","warn"),!1;const e=bo(n.relativePath),t=s.config.isDirty?`

Unsaved edits will be lost.`:"";if(!window.confirm(`Delete ${e}? This cannot be undone.${t}`))return!1;Je(`Deleting ${e}...`,"warn");try{return await s.client.deleteConfigFile(e),pe(`Config deleted: ${e}`,"warn"),s.config.selectedPath="",ks(),s.config.originalContent="",s.config.draftContent="",Bi(!1),Fi(),await Gi({preserveSelection:!1}),Je(`Deleted ${e}.`),!0}catch(r){const o=r?.message||String(r);return pe(`Config delete failed: ${o}`,"error"),Je(`Failed to delete ${e}: ${o}`,"error"),Ue.error("Config delete failed.",{path:e,error:o}),!1}}function JE(){const n=ui(s.config.selectedPath);if(!n)return;const e=l.configEditor?l.configEditor.value:s.config.draftContent,t=n.relativePath.split("/").pop()||"config.txt",i=new Blob([e],{type:"text/plain"}),r=URL.createObjectURL(i),o=document.createElement("a");o.href=r,o.download=t,document.body.appendChild(o),o.click(),o.remove(),URL.revokeObjectURL(r),pe(`Config downloaded: ${n.path}`,"info")}async function nn(n,{actionLabel:e=n,successMessage:t=null}={}){if(!s.client)return pe(`Cannot run "${e}" while disconnected.`,"warn"),Ue.warn("Skipped G-code action because client is unavailable.",{actionLabel:e,script:n}),!1;Ue.info("Sending G-code action.",{actionLabel:e,script:n}),Jy(n);try{return await s.client.runGcode(n),t&&pe(t,"info"),Ue.debug("G-code action completed.",{actionLabel:e}),!0}catch(i){const r=i?.message||String(i);return pe(`${e} failed: ${r}`,"error"),Ue.error("G-code action failed.",{actionLabel:e,script:n,error:r}),!1}}function ZE(){l.navItems.forEach(n=>{n.addEventListener("click",async()=>{await Jc(n.dataset.view)})}),l.sidebarToggle?.addEventListener("click",fS),l.machineSideToggle?.addEventListener("click",hS),l.statusClearFile?.addEventListener("click",()=>{mS()}),l.statusPrintPause?.addEventListener("click",async()=>{await or("pause")}),l.statusPrintResume?.addEventListener("click",async()=>{await or("resume")}),l.statusPrintCancel?.addEventListener("click",async()=>{await or("cancel")}),l.configRefresh?.addEventListener("click",async()=>{await Gi({preserveSelection:!0})}),l.machineUpdateRefresh?.addEventListener("click",async()=>{await fv()}),l.machineUpdateUpgradeAll?.addEventListener("click",async()=>{window.confirm("Run Update All for every updater with available updates?")&&await mh()}),l.machineEndstopsQuery?.addEventListener("click",async()=>{await Rs({source:"user"})}),l.controlsEndstopsQuery?.addEventListener("click",async()=>{await Rs({source:"user"})}),l.machineLogFilesRefresh?.addEventListener("click",async()=>{await xo({source:"user"})}),l.machineLogFilesDeleteAll?.addEventListener("click",async()=>{await tv()}),l.jobsRefresh?.addEventListener("click",async()=>{kt(),await di({source:"user"})}),l.prettyGcodeFollow?.addEventListener("change",()=>{s.prettyGcode.followToolhead=!!l.prettyGcodeFollow?.checked,et()}),l.prettyGcodeShowMirror?.addEventListener("change",()=>{s.prettyGcode.showMirror=!!l.prettyGcodeShowMirror?.checked,$n(),ht()&&et()}),l.prettyGcodeShowNozzle?.addEventListener("change",()=>{s.prettyGcode.showNozzle=!!l.prettyGcodeShowNozzle?.checked,$n(),ht()&&et()}),l.prettyGcodeOrbitIdle?.addEventListener("change",()=>{s.prettyGcode.orbitWhenIdle=!!l.prettyGcodeOrbitIdle?.checked,fe.lastInteractionMs=Date.now(),$n(),ht()&&et()}),l.prettyGcodeReload?.addEventListener("click",async()=>{await nE()}),l.prettyGcodeLoadFile?.addEventListener("click",async()=>{if(!s.client||s.connectionStatus!=="connected"){Dt("Connect to Moonraker to browse host GCode files.","warn");return}await Jc("files"),en("Choose a GCode file and click Simulate to load it in KlipperView.","info")}),l.prettyGcodeLoadInput?.addEventListener("change",async n=>{const e=n.currentTarget,t=e?.files?.[0]||null;e.value="",t&&await Qv(t)}),l.prettyGcodeLive?.addEventListener("click",async()=>{await iE()}),l.prettyGcodeRewind?.addEventListener("click",()=>{wu(-tu)}),l.prettyGcodePlayPause?.addEventListener("click",()=>{zv()}),l.prettyGcodeFastForward?.addEventListener("click",()=>{wu(tu)}),l.prettyGcodeProgress?.addEventListener("input",n=>{if(!yn())return;const e=n.currentTarget,t=Number(e?.value),i=Number.isFinite(t)?t/1e3:0;Sn({render:!1}),s.prettyGcode.simulationProgress=Oi(i),s.prettyGcode.layerSelectionPinned=!1,Yt({skipRender:!0}),ht()&&et()}),l.prettyGcodeLayerSlider?.addEventListener("pointerdown",()=>{l.prettyGcodeLayerSlider?.focus()}),l.prettyGcodeLayerSlider?.addEventListener("input",n=>{const e=n.currentTarget,t=Number(e?.value);Number.isFinite(t)&&(Au(t-1,{pin:!0,render:!1}),et())}),l.prettyGcodeLayerSlider?.addEventListener("keydown",n=>{if(n.key!=="ArrowUp"&&n.key!=="ArrowDown")return;n.preventDefault();const e=n.key==="ArrowUp"?1:-1,t=Number(l.prettyGcodeLayerSlider?.value||1),i=Number(l.prettyGcodeLayerSlider?.max||1),r=Math.max(1,Math.min(i,t+e));Au(r-1,{pin:!0,render:!1}),et()}),window.addEventListener("resize",()=>{ht()&&et()}),l.jobsSortToggle?.addEventListener("click",n=>{n.preventDefault(),Zo(l.jobsSortMenu,l.jobsSortToggle)}),l.jobsColumnsToggle?.addEventListener("click",n=>{n.preventDefault(),Zo(l.jobsColumnsMenu,l.jobsColumnsToggle)}),l.jobsSearchToggle?.addEventListener("click",n=>{n.preventDefault(),kt(),l.jobsSearch&&(l.jobsSearch.focus(),l.jobsSearch.select())}),l.jobsFilterToggle?.addEventListener("click",n=>{n.preventDefault(),Zo(l.jobsFilterMenu,l.jobsFilterToggle)}),l.jobsAddToggle?.addEventListener("click",n=>{n.preventDefault(),Zo(l.jobsAddMenu,l.jobsAddToggle)}),l.jobsUploadBtn?.addEventListener("click",()=>{kt(),kr(l.jobsUploadInput)}),l.jobsUploadFolderBtn?.addEventListener("click",()=>{kt(),kr(l.jobsUploadFolderInput)}),l.jobsUploadPrintBtn?.addEventListener("click",()=>{kt(),kr(l.jobsUploadPrintInput)}),l.jobsAddFileBtn?.addEventListener("click",()=>{kt(),kr(l.jobsAddFileInput)}),l.jobsUploadInput?.addEventListener("change",async n=>{const e=n.currentTarget,t=[...e?.files||[]];t.length&&(await qr(t,{mode:"upload-files"}),e.value="")}),l.jobsUploadFolderInput?.addEventListener("change",async n=>{const e=n.currentTarget,t=[...e?.files||[]];t.length&&(await qr(t,{preserveRelativePaths:!0,mode:"upload-folder"}),e.value="")}),l.jobsUploadPrintInput?.addEventListener("change",async n=>{const e=n.currentTarget,t=e?.files?.[0]||null;t&&(await qr([t],{printAfterUpload:!0,mode:"upload-print"}),e.value="")}),l.jobsAddFileInput?.addEventListener("change",async n=>{const e=n.currentTarget,t=[...e?.files||[]];t.length&&(await qr(t,{mode:"add-file"}),e.value="")}),l.jobsCard?.addEventListener("dragenter",n=>{Kc(n.dataTransfer)&&(!s.client||s.connectionStatus!=="connected"||(n.preventDefault(),s.jobs.uploadDragDepth+=1,eo(!0)))}),l.jobsCard?.addEventListener("dragover",n=>{Kc(n.dataTransfer)&&(!s.client||s.connectionStatus!=="connected"||(n.preventDefault(),n.dataTransfer.dropEffect="copy",eo(!0)))}),l.jobsCard?.addEventListener("dragleave",n=>{n.preventDefault(),s.jobs.uploadDragDepth=Math.max(0,s.jobs.uploadDragDepth-1),s.jobs.uploadDragDepth===0&&eo(!1)}),l.jobsCard?.addEventListener("drop",async n=>{await BE(n)}),l.jobsNewFolder?.addEventListener("click",async()=>{kt(),await OE()}),l.jobsSearch?.addEventListener("focus",()=>{kt()}),l.jobsSearch?.addEventListener("input",()=>{s.jobs.searchQuery=String(l.jobsSearch.value||"").trim(),bn(),Ge()}),l.jobsSearch?.addEventListener("keydown",n=>{n.key==="Escape"&&(n.preventDefault(),s.jobs.searchQuery="",kt(),l.jobsSearch&&(l.jobsSearch.value="",l.jobsSearch.blur()),bn(),Ge())}),l.jobsSort?.addEventListener("change",()=>{s.jobs.sortMode=wr(l.jobsSort.value),bn(),kt(),Ge()}),l.jobsTypeFilter?.addEventListener("change",()=>{s.jobs.typeFilter=Ar(l.jobsTypeFilter.value),bn(),kt(),Ge()}),l.jobsPause?.addEventListener("click",async()=>{await or("pause")}),l.jobsResume?.addEventListener("click",async()=>{await or("resume")}),l.jobsCancel?.addEventListener("click",async()=>{await or("cancel")}),l.configSearchInput?.addEventListener("input",()=>{fo({preserveActive:!1,focusActive:!1})}),l.configSearchInput?.addEventListener("keydown",n=>{if(n.key==="Enter"){n.preventDefault(),es(n.shiftKey?-1:1);return}n.key==="Escape"&&(n.preventDefault(),Ol({clearQuery:!0}),l.configEditor&&!l.configEditor.disabled&&l.configEditor.focus())}),l.configSearchPrev?.addEventListener("click",()=>{es(-1)}),l.configSearchNext?.addEventListener("click",()=>{es(1)}),l.configSearchCase?.addEventListener("click",()=>{Va("caseSensitive",!s.configSearch.caseSensitive)}),l.configSearchWord?.addEventListener("click",()=>{Va("wholeWord",!s.configSearch.wholeWord)}),l.configSearchRegex?.addEventListener("click",()=>{Va("useRegex",!s.configSearch.useRegex)}),l.configUploadBtn?.addEventListener("click",()=>{kr(l.configUploadInput)}),l.configUploadInput?.addEventListener("change",async n=>{const e=n.currentTarget,t=e?.files?.[0]||null;t&&(await $E(t),e.value="")}),l.configNewBtn?.addEventListener("click",async()=>{await YE()}),l.configDelete?.addEventListener("click",async()=>{await KE()}),l.configFilter?.addEventListener("change",()=>{s.config.fileTypeFilter=Pr(l.configFilter.value),to()}),l.configFileSearch?.addEventListener("input",()=>{s.config.fileSearchQuery=String(l.configFileSearch.value||""),to()}),l.configFileSearch?.addEventListener("keydown",n=>{n.key==="Escape"&&(n.preventDefault(),l.configFileSearch.value="",s.config.fileSearchQuery="",to(),l.configFileSearch.blur())}),l.configDownload?.addEventListener("click",()=>{JE()}),l.configIgnoreChanges?.addEventListener("click",()=>{Nh({notify:!0})}),l.configSaveRestart?.addEventListener("click",async()=>{await Uh()}),l.configEditor?.addEventListener("input",()=>{if(!s.config.selectedPath)return;s.config.draftContent=l.configEditor.value;const n=s.config.draftContent!==s.config.originalContent;Bi(n),n?Je(`Unsaved changes in ${s.config.selectedPath}. Choose Ignore Changes or Save & Restart Firmware.`,"warn"):Je(`Loaded ${s.config.selectedPath}.`),fo({preserveActive:!0,focusActive:!1})}),l.configEditor?.addEventListener("keydown",n=>{if((n.ctrlKey||n.metaKey)&&n.key.toLowerCase()==="f"){n.preventDefault(),VE();return}n.key==="F3"&&(n.preventDefault(),es(n.shiftKey?-1:1))}),l.openDashboardLayout?.addEventListener("click",lS),l.dashboardLayoutClose?.addEventListener("click",Gc),l.dashboardLayoutSave?.addEventListener("click",dS),l.dashboardLayoutReset?.addEventListener("click",uS),l.dashboardLayoutDialog?.addEventListener("click",n=>{n.target===l.dashboardLayoutDialog&&Gc()}),l.settingsForm.addEventListener("submit",async n=>{n.preventDefault();const e=l.moonrakerUrl.value.trim();e&&(s.moonrakerUrl=e,s.interface.theme=gf.includes(l.interfaceTheme.value)?l.interfaceTheme.value:"ocean",s.interface.compact=l.interfaceCompact.checked,s.interface.density=xf.includes(l.interfaceDensity.value)?l.interfaceDensity.value:"comfortable",s.dashboard.showPrintProgress=l.dashShowPrintProgress.checked,s.dashboard.showTemperatures=l.dashShowTemperatures.checked,s.dashboard.showMotion=l.dashShowMotion.checked,s.dashboard.showQuickCommands=l.dashShowQuickCommands.checked,s.dashboard.showMacros=l.dashShowMacros.checked,s.dashboard.showMainCamera=l.dashShowMainCamera.checked,s.dashboard.showToolheadCamera=l.dashShowToolheadCamera.checked,s.dashboard.showConsole=!!l.dashShowConsole?.checked,s.dashboard.showKlipperView=!!l.dashShowKlipperView?.checked,s.camera.enabled=l.cameraEnabled.checked,s.camera.url=l.cameraUrl.value.trim(),s.camera.renderMode=l.cameraRenderMode.value===gn.IFRAME?gn.IFRAME:gn.IMAGE,s.toolheadCamera.enabled=l.toolheadCameraEnabled.checked,s.toolheadCamera.url=l.toolheadCameraUrl.value.trim(),s.toolheadCamera.renderMode=l.toolheadCameraRenderMode.value===gn.IFRAME?gn.IFRAME:gn.IMAGE,localStorage.setItem("moonraker_url",s.moonrakerUrl),localStorage.setItem("interface_theme",s.interface.theme),localStorage.setItem("interface_compact",String(s.interface.compact)),localStorage.setItem("interface_density",s.interface.density),localStorage.setItem("interface_sidebar_collapsed",String(s.interface.sidebarCollapsed)),localStorage.setItem(ml,String(s.interface.machineSideCollapsed)),localStorage.setItem("dashboard_show_print_progress",String(s.dashboard.showPrintProgress)),localStorage.setItem("dashboard_show_temperatures",String(s.dashboard.showTemperatures)),localStorage.setItem("dashboard_show_motion",String(s.dashboard.showMotion)),localStorage.setItem("dashboard_show_quick_commands",String(s.dashboard.showQuickCommands)),localStorage.setItem("dashboard_show_macros",String(s.dashboard.showMacros)),localStorage.setItem("dashboard_show_main_camera",String(s.dashboard.showMainCamera)),localStorage.setItem("dashboard_show_toolhead_camera",String(s.dashboard.showToolheadCamera)),localStorage.setItem("dashboard_show_console",String(s.dashboard.showConsole)),localStorage.setItem("dashboard_show_klipperview",String(s.dashboard.showKlipperView)),localStorage.setItem("dashboard_layout",JSON.stringify(s.dashboard.layout)),localStorage.setItem("dashboard_layout_order",JSON.stringify(Bf(s.dashboard.layout))),localStorage.setItem("camera_enabled",String(s.camera.enabled)),localStorage.setItem("camera_url",s.camera.url),localStorage.setItem("camera_render_mode",s.camera.renderMode),localStorage.setItem("toolhead_camera_enabled",String(s.toolheadCamera.enabled)),localStorage.setItem("toolhead_camera_url",s.toolheadCamera.url),localStorage.setItem("toolhead_camera_render_mode",s.toolheadCamera.renderMode),Hs(),El(),Ml(),uh(),pe("Settings saved.","info"),Ue.info("Settings saved.",{moonrakerUrl:s.moonrakerUrl,theme:s.interface.theme,density:s.interface.density}),await bh())}),Ct().forEach(n=>{n.form?.addEventListener("submit",async e=>{e.preventDefault();const t=String(n.input?.value||"").trim();if(!t)return;await nn(t,{actionLabel:"Console command"})&&(qy(t),Oc(""),Kr(),n.input?.focus())}),n.clearButton?.addEventListener("click",()=>{au()}),n.pauseButton?.addEventListener("click",()=>{Oy(!s.console.paused)}),n.helperToggle?.addEventListener("click",e=>{e.preventDefault(),zy(n.key)}),n.settingsToggle?.addEventListener("click",e=>{e.preventDefault(),Hy(n.key)}),n.helperGrid?.addEventListener("click",e=>{const t=e.target;if(!(t instanceof Element))return;const i=t.closest("[data-console-helper]");if(!i)return;const r=i.getAttribute("data-console-helper")||"";r&&(Bc(r,n.input),Kr(),n.input?.focus(),hr())}),n.hideTempsInput?.addEventListener("change",()=>{Vy(!!n.hideTempsInput?.checked)}),n.rawOutputInput?.addEventListener("change",()=>{Wy(!!n.rawOutputInput?.checked)}),n.autoscrollInput?.addEventListener("change",()=>{By(!!n.autoscrollInput?.checked)}),n.filterSelect?.addEventListener("change",()=>{Gy(n.filterSelect?.value||"all")}),n.searchInput?.addEventListener("input",()=>{ky(n.searchInput?.value||"")}),n.input?.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="l"){e.preventDefault(),au();return}if(e.key==="ArrowUp"&&!e.altKey&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey){e.preventDefault(),cu(-1,n.input);return}if(e.key==="ArrowDown"&&!e.altKey&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey){e.preventDefault(),cu(1,n.input);return}e.key==="Escape"&&(e.preventDefault(),hr(),Oc(""),Kr())})}),document.addEventListener("click",n=>{const e=n.target;if(!(e instanceof Node))return;const t=Ct().some(o=>!!o.helperToggle?.contains(e)||!!o.settingsToggle?.contains(e)),i=Ct().some(o=>!!o.helperPanel?.contains(e)||!!o.settingsPanel?.contains(e));!t&&!i&&hr(),e instanceof Element&&e.closest("#jobs-feature-panel")||kt()}),document.addEventListener("keydown",n=>{n.key==="Escape"&&kt()}),l.quickGcode.forEach(n=>{n.addEventListener("click",async()=>{const e=n.dataset.gcode;e&&await nn(e,{actionLabel:`Quick command ${e}`})})}),l.controlsDistanceButtons.forEach(n=>{n.addEventListener("click",()=>{const e=n.dataset.jogDistance;e&&lh(e,{persist:!0})})}),l.controlsJogButtons.forEach(n=>{n.addEventListener("click",async()=>{const e=n.dataset.controlJogAxis,t=Number(n.dataset.controlJogDir);!e||!Number.isFinite(t)||await NS(e,t)})}),l.controlsHomeButtons.forEach(n=>{n.addEventListener("click",async()=>{const e=n.dataset.controlHome;await US(e||"all")})}),l.controlsFeedrateSet?.addEventListener("click",async()=>{await pu()}),l.controlsFlowrateSet?.addEventListener("click",async()=>{await mu()}),l.controlsFeedrateInput?.addEventListener("focus",()=>{co("feedRateResetter")}),l.controlsFeedrateInput?.addEventListener("blur",()=>{hu("feedRateResetter",l.controlsFeedrateInput)}),l.controlsFlowrateInput?.addEventListener("focus",()=>{co("flowRateResetter")}),l.controlsFlowrateInput?.addEventListener("blur",()=>{hu("flowRateResetter",l.controlsFlowrateInput)}),l.controlsFeedrateInput?.addEventListener("keydown",async n=>{n.key==="Enter"&&(n.preventDefault(),await pu())}),l.controlsFlowrateInput?.addEventListener("keydown",async n=>{n.key==="Enter"&&(n.preventDefault(),await mu())}),l.controlsExtrusionAmount?.addEventListener("change",()=>{Vc(),Rn()}),l.controlsExtrusionAmount?.addEventListener("blur",()=>{Vc(),Rn()}),l.controlsExtrude?.addEventListener("click",async()=>{await gu(1)}),l.controlsRetract?.addEventListener("click",async()=>{await gu(-1)}),l.controlsToolSet?.addEventListener("click",async()=>{await OS()}),l.controlsFanOn?.addEventListener("click",async()=>{await Ba(100,{successMessage:"Fan speed set to 100%."})}),l.controlsFanOff?.addEventListener("click",async()=>{await Ba(0,{successMessage:"Fan speed set to 0%."})}),l.controlsFanSpeed?.addEventListener("input",()=>{s.controls.fanSpeed=Ii(l.controlsFanSpeed?.value),Rn()}),l.controlsFanSpeed?.addEventListener("change",async()=>{const n=Ii(l.controlsFanSpeed?.value);await Ba(n)}),l.controlsKeyboardSurface?.addEventListener("focus",()=>{jr(!0)}),l.controlsKeyboardSurface?.addEventListener("blur",()=>{jr(!1)}),l.controlsCard?.addEventListener("mouseenter",()=>{l.controlsKeyboardSurface&&l.controlsKeyboardSurface.focus(),jr(!0)}),l.controlsCard?.addEventListener("mouseleave",()=>{jr(!1)}),l.controlsKeyboardSurface?.addEventListener("keydown",n=>{BS(n)}),l.mainCameraFullscreen.addEventListener("click",()=>Eu(s.camera,"Main Camera")),l.toolheadCameraFullscreen.addEventListener("click",()=>Eu(s.toolheadCamera,"Toolhead Cam")),l.cameraDialogClose.addEventListener("click",Mu),l.cameraDialog.addEventListener("click",n=>{n.target===l.cameraDialog&&Mu()})}async function QE(){l.moonrakerUrl.value=s.moonrakerUrl,l.interfaceTheme.value=s.interface.theme,l.interfaceCompact.checked=s.interface.compact,l.interfaceDensity.value=s.interface.density,l.dashShowPrintProgress.checked=s.dashboard.showPrintProgress,l.dashShowTemperatures.checked=s.dashboard.showTemperatures,l.dashShowMotion.checked=s.dashboard.showMotion,l.dashShowQuickCommands.checked=s.dashboard.showQuickCommands,l.dashShowMacros.checked=s.dashboard.showMacros,l.dashShowMainCamera.checked=s.dashboard.showMainCamera,l.dashShowToolheadCamera.checked=s.dashboard.showToolheadCamera,l.dashShowConsole&&(l.dashShowConsole.checked=s.dashboard.showConsole),l.dashShowKlipperView&&(l.dashShowKlipperView.checked=s.dashboard.showKlipperView),l.cameraEnabled.checked=s.camera.enabled,l.cameraUrl.value=s.camera.url,l.cameraRenderMode.value=s.camera.renderMode,l.toolheadCameraEnabled.checked=s.toolheadCamera.enabled,l.toolheadCameraUrl.value=s.toolheadCamera.url,l.toolheadCameraRenderMode.value=s.toolheadCamera.renderMode,l.configFilter&&(l.configFilter.value=Pr(s.config.fileTypeFilter)),l.configFileSearch&&(l.configFileSearch.value=String(s.config.fileSearchQuery||"")),l.jobsSearch&&(l.jobsSearch.value=String(s.jobs.searchQuery||"")),l.jobsSort&&(l.jobsSort.value=wr(s.jobs.sortMode)),l.jobsTypeFilter&&(l.jobsTypeFilter.value=Ar(s.jobs.typeFilter)),Ct().forEach(n=>{n.autoscrollInput&&(n.autoscrollInput.checked=s.console.autoscroll),n.filterSelect&&(n.filterSelect.value=zs(s.console.filter)),n.searchInput&&(n.searchInput.value=s.console.searchQuery),n.hideTempsInput&&(n.hideTempsInput.checked=s.console.hideTemps),n.rawOutputInput&&(n.rawOutputInput.checked=s.console.rawOutput)}),hr(),hs(),Kr(),li(),ah(s.activeView),Fi(),Ol({clearQuery:!0}),Je("Connect to Moonraker from Settings to manage configuration files.","warn"),El(),Uv(),si(),qt(),Cn(),Pt(),Ge(),et();try{await Cy()}catch(n){Ue.debug("Temperature history restore failed.",{error:n?.message||String(n)})}Rv(),Hs(),Ml(),uh(),lh(s.controls.distance,{persist:!1}),s.controls.fanSpeed=Ii(s.controls.fanSpeed),Rn(),ZE(),bh().catch(n=>{const e=n?.message||String(n);Ue.error("Initial Moonraker connection failed.",{error:e}),ws("error"),pe(`Connect failed: ${e}`,"error")})}QE().catch(n=>{const e=n?.message||String(n);Ue.error("App init failed.",{error:e}),ws("error"),pe(`Init failed: ${e}`,"error")});
