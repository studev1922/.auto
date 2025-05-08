
const container = document.createElement("div");
container.style.cssText = "position:fixed;bottom:10px;left:0;transform:translateX(1rem);z-index:1200;display:flex;flex-direction:column;gap:.1em";
document.body.appendChild(container);

const notify={
    notificationIdCounter:0,
    showNotification(t,i={}){let e=`notification-${++this.notificationIdCounter}`,n=document.createElement("div");if(n.className=`alert alert-${i.type||"info"} d-flex align-items-center mb-1`,n.style.cssText="min-width:300px;max-width:90vw;padding:10px 20px",n.id=e,i.loading){let o=document.createElement("div");o.className="spinner-border spinner-border-sm me-2",o.role="status",n.appendChild(o)}let a=document.createElement("span");return a.textContent=t,n.appendChild(a),container.appendChild(n),i.sticky||i.loading||setTimeout(()=>this.hideNotification(e),i.duration||3e3),e},
    hideNotification(t){let i=document.getElementById(t);i&&(i.style.transition="opacity 0.5s ease",i.style.opacity=0,setTimeout(()=>i.remove(),500))},
    notifyAction(t,i="info",e=3e3){notify.showNotification(t,{type:i,duration:e})},
    async notifyPromise(t,i){let e=notify.showNotification(t,{type:"primary",loading:!0,sticky:!0});try{await i,notify.hideNotification(e),notify.showNotification(`${t} th\xe0nh c\xf4ng`,{type:"success"})}catch(n){notify.hideNotification(e),notify.showNotification(`${t} thất bại`,{type:"warning"}),console.error(n)}}
};
