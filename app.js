// عناصر الصفحة
const avatarInput = document.getElementById("avatarInput");
const avatarPreview = document.getElementById("avatarPreview");
const nicknameInput = document.getElementById("nickname");
const voiceBtn = document.getElementById("voiceBtn");
const videoBtn = document.getElementById("videoBtn");

const mainCard = document.getElementById("mainCard");
const waitingCard = document.getElementById("waitingCard");
const callCard = document.getElementById("callCard");

const nextBtn = document.getElementById("nextBtn");
const disconnectBtn = document.getElementById("disconnectBtn");
const endCallBtn = document.getElementById("endCallBtn");

const remoteVideo = document.getElementById("remoteVideo");
const peerName = document.getElementById("peerName");
const peerAvatar = document.getElementById("peerAvatar");

// رفع الصورة وعرضها في الدائرة مباشرة
avatarInput.addEventListener("change", function(){
  const file = this.files[0];
  if(file){
    const reader = new FileReader();
    reader.onload = function(e){
      avatarPreview.src = e.target.result;
      avatarPreview.style.display="block";
    }
    reader.readAsDataURL(file);
  }
});

// PeerJS setup + matchmaking عشوائي عالمي مع منع الاتصال مع النفس
let peer, currentCall;
let waitingPeers = [];

// إعداد WebSocket صغير جداً للتوصيل العالمي
const ws = new WebSocket("wss://ws-server-production-682a.up.railway.app"); // هنا رابط السيرفر الحقيقي

ws.onopen = ()=>{
  console.log("Connected to WebSocket server for global matching");
};

ws.onmessage = (msg)=>{
  const data = JSON.parse(msg.data);
  if(data.type==="matchRequest"){
    // إضافة كل المستخدمين الجدد للقائمة المؤقتة
    if(!waitingPeers.find(p=>p.id===data.id)){
      waitingPeers.push({id:data.id, name:data.name, avatar:data.avatar});
    }
  }
};

function sendMatchRequest(myData){
  ws.send(JSON.stringify({
    type:"matchRequest",
    id:myData.id,
    name:myData.name,
    avatar:myData.avatar
  }));
}

function startCall(type){
  const name = nicknameInput.value.trim();
  if(!name){ alert("Enter your nickname!"); return; }

  mainCard.style.display = "none";
  waitingCard.style.display = "block";

  peer = new Peer({
    host: '0.peerjs.com',
    port: 443,
    secure: true,
    debug: 2
  });

  peer.on('open', id=>{
    console.log("Your Peer ID:", id);
    const myData = {id, name, avatar: avatarPreview.src};
    waitingPeers.push(myData);
    sendMatchRequest(myData); // نرسل بياناتنا للعالم

    setTimeout(()=> tryMatch(type, id), 2000); // محاولة البحث بعد 2 ثانية
  });

  navigator.mediaDevices.getUserMedia({
    audio:true,
    video:type==="video"
  }).then(stream=>{
    window.localStream = stream;
  }).catch(err=>{
    alert("Camera/Microphone error: "+err);
  });

  peer.on('call', call=>{
    if(call.peer===peer.id) return; // منع self-call
    currentCall = call;
    call.answer(window.localStream);
    call.on('stream', remoteStream=>{
      remoteVideo.srcObject = remoteStream;
      waitingCard.style.display = "none";
      callCard.style.display = "block";

      const other = waitingPeers.find(p=>p.id===call.peer);
      if(other){
        peerName.textContent = other.name;
        peerAvatar.src = other.avatar;
        peerAvatar.style.display="block";
      }
    });
  });
}

// البحث عن مطابقة عشوائية مع تأخير + إعادة محاولة تلقائية
function tryMatch(type, myId){
  const others = waitingPeers.filter(p=>p.id!==myId);
  if(others.length>0){
    const random = others[Math.floor(Math.random()*others.length)];
    const call = peer.call(random.id, window.localStream);
    currentCall = call;
    call.on('stream', remoteStream=>{
      remoteVideo.srcObject = remoteStream;
      waitingCard.style.display = "none";
      callCard.style.display = "block";

      peerName.textContent = random.name;
      peerAvatar.src = random.avatar;
      peerAvatar.style.display="block";
    });
  } else {
    setTimeout(()=> tryMatch(type, myId), 2000); // إعادة المحاولة كل ثانيتين
  }
}

// أحداث الأزرار
nextBtn.addEventListener("click", ()=>{
  if(currentCall) currentCall.close();
  waitingCard.style.display = "block";
  callCard.style.display = "none";
  alert("Next match 🔥");
});

disconnectBtn.addEventListener("click", ()=>{
  if(currentCall) currentCall.close();
  waitingCard.style.display="none";
  mainCard.style.display="block";
});

endCallBtn.addEventListener("click", ()=>{
  if(currentCall) currentCall.close();
  callCard.style.display="none";
  mainCard.style.display="block";
});

voiceBtn.addEventListener("click", ()=>startCall("voice"));
videoBtn.addEventListener("click", ()=>startCall("video"));

// Adsterra Ad Integration
function showAd(){
  const adScript = document.createElement('script');
  adScript.src = "https://pl28740334.effectivegatecpm.com/04/7b/14/047b14cf60657df4f417f3bbb5ebcbef.js";
  document.body.appendChild(adScript);
}

// إعلان عند التشغيل
showAd();

// تكرار الإعلان كل 20 دقيقة
setInterval(showAd, 20*60*1000);
