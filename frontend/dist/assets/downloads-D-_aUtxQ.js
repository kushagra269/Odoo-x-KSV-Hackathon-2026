import{c as l}from"./index-y9A0iInR.js";/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const r=l("Download",[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"7 10 12 15 17 10",key:"2ggqvy"}],["line",{x1:"12",x2:"12",y1:"15",y2:"3",key:"1vk2je"}]]);function d(n,t,a="text/plain;charset=utf-8"){const c=new Blob([t],{type:a}),o=URL.createObjectURL(c),e=document.createElement("a");e.href=o,e.download=n,document.body.appendChild(e),e.click(),e.remove(),URL.revokeObjectURL(o)}function s(n,t){const a=t.map(c=>c.map(o=>`"${String(o??"").replaceAll('"','""')}"`).join(",")).join(`
`);d(n,a,"text/csv;charset=utf-8")}export{r as D,s as a,d};
