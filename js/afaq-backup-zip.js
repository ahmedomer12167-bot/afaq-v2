/* Client-side simple ZIP backup creator */
(function(){
 function strToU8(s){return new TextEncoder().encode(s)}
 function crc32(buf){let c=~0;for(let i=0;i<buf.length;i++){c^=buf[i];for(let k=0;k<8;k++)c=(c>>>1)^(0xEDB88320&-(c&1))}return ~c>>>0}
 function u16(n){return [n&255,(n>>>8)&255]} function u32(n){return [n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255]}
 function makeZip(files){
   let chunks=[],central=[],offset=0;
   files.forEach(f=>{
     const name=strToU8(f.name), data=strToU8(f.content), crc=crc32(data);
     const local=[...u32(0x04034b50),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0)];
     chunks.push(new Uint8Array([...local,...name,...data]));
     const cent=[...u32(0x02014b50),...u16(20),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(offset)];
     central.push(new Uint8Array([...cent,...name]));
     offset += local.length+name.length+data.length;
   });
   const centralStart=offset; central.forEach(c=>offset+=c.length);
   const end=new Uint8Array([...u32(0x06054b50),...u16(0),...u16(0),...u16(files.length),...u16(files.length),...u32(offset-centralStart),...u32(centralStart),...u16(0)]);
   return new Blob([...chunks,...central,end],{type:"application/zip"});
 }
 function allLocalStorageFiles(){
   const files=[];
   for(let i=0;i<localStorage.length;i++){
     const key=localStorage.key(i);
     if(key&&key.startsWith("afaq_")) files.push({name:"data/"+key+".json",content:localStorage.getItem(key)||""});
   }
   files.push({name:"README.txt",content:"نسخة احتياطية من بيانات منصة آفاق - تحتوي ملفات JSON للبيانات الحالية."});
   return files;
 }
 function downloadZip(){
   const blob=makeZip(allLocalStorageFiles());
   const a=document.createElement("a");
   a.href=URL.createObjectURL(blob);
   a.download="afaq-platform-backup-"+new Date().toISOString().slice(0,10)+".zip";
   document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
 }
 window.AfaqBackupZip={downloadZip};
})();
