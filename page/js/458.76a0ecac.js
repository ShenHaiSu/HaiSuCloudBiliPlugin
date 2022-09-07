"use strict";(self["webpackChunkbili_overtime_work_frontend"]=self["webpackChunkbili_overtime_work_frontend"]||[]).push([[458],{7458:function(t,e,i){i.r(e),i.d(e,{default:function(){return f}});var r=function(){var t=this,e=t._self._c;return e("div",{attrs:{id:"OBSOvertimeWork"}},[e("div",{attrs:{id:"timeLeftShow"}},[e("h5",[t._v("加班时间")]),e("span",[t._v(t._s(t._f("timeFormat")(t.currentWorkTime)))])]),e("div",{attrs:{id:"modItemList"}},[e("h5",[t._v("礼物列表")]),e("b-row",[t._l(t.modList,(function(i,r){return[e("b-col",{key:r+"key",staticClass:"",attrs:{cols:"4"}},[e("b-container",{staticClass:"modListDataShow",staticStyle:{position:"relative",padding:"0"}},[i.img?e("b-img-lazy",{staticClass:"modListDataImg",attrs:{src:i.img}}):e("span",[t._v(t._s(i.giftName))]),e("span",{staticClass:"modListItemCount"},[t._v(t._s(1!==i.count?"x"+i.count:""))])],1),e("p",{staticClass:"modListDataDesc"},[t._v(t._s(t._f("modTypeFormat")(i)))])],1)]})),0===t.modList.length?[e("b-container",[e("br"),e("p",{staticStyle:{color:"white","font-size":"30px"}},[t._v("当前礼物列表为空")])])]:t._e()],2)],1)])},a=[],s=i(9669),o=i.n(s),n=i(289);function m(t,e="get"){return o()({url:t,method:e}).then((t=>({err:!1,data:t.data}))).catch((t=>(n.C.call(this,"请求出现错误",t.message,"danger"),{err:!0})))}var c={sendRequest:m},d={name:"ViewOvertimeWork",data(){return{currentWorkTime:7213211531,modList:[],tempGiftList:[]}},methods:{async getBaseInfo(){let t=await c.sendRequest.call(this,"/API/overtimeWork/getInfo");t.err||(this.currentWorkTime=t.data.currentWorkTime,this.modList=t.data.modList,this.tempGiftList=t.data.tempGiftList,this.$forceUpdate())}},mounted(){this.getBaseInfo(),this.$EventBus.$on("OvertimeWork-changeTime",(t=>{t=JSON.parse(t),this.currentWorkTime=t["timeLeft"]})),this.$EventBus.$on("OvertimeWork-changeModList",(t=>{t=JSON.parse(t),this.modList=t["data"]})),setInterval((()=>{this.currentWorkTime<=0||!this.$store.state.liveStatus||this.currentWorkTime--}),1e3)},computed:{},filters:{timeFormat(t){let e="";return e+=Math.floor(t/86400)+"天 ",t-=86400*Math.floor(t/86400),e+=Math.floor(t/3600)+"小时 ",t-=3600*Math.floor(t/3600),e+=Math.floor(t/60)+"分钟 ",t-=60*Math.floor(t/60),e+=Math.floor(t)+"秒",e},modTypeFormat(t){let e="";switch(t.type){case"add":e=`加班时间 增加${t.timeChange}秒`;break;case"reduce":e=`加班时间 减少${t.timeChange}秒`;break;case"multi":e=`加班时间 乘以${t.timeChange}`;break;case"division":e=`加班时间 除以${t.timeChange}`;break;case"power":e=`剩余时间 ${t.timeChange}次方`;break}return e}}},h=d,l=i(1001),u=(0,l.Z)(h,r,a,!1,null,"0d65ccb3",null),f=u.exports}}]);
//# sourceMappingURL=458.76a0ecac.js.map