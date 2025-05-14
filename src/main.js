import { initMomento, subscribeToMessages, publish, setKey } from './momento.js';
import { allThere, pieceTogether, sendOfferInFragments } from './utils.js';

const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const statusText = document.getElementById('statusText');
const container = document.getElementById('container');

hangupButton.disabled = true;

let pc;
let localStream;
let remoteCandidatesBuffer = [];
let remoteDescriptionSet = false;

const cacheName = 'test';
const agentId = 'xyz';
const visitorId = 'abc';

await initMomento();
subscribeToMessages(cacheName, `visitor:${visitorId}:inbox`, onEvent);

callButton.onclick = handleCallClick;
hangupButton.onclick = handleHangupClick;

setUIState('idle');

function setUIState(state) {
  callButton.disabled = state !== 'idle';
  hangupButton.disabled = state === 'idle' || state === 'ended';

  switch (state) {
    case 'idle':
      statusText.textContent = 'Call an agent!';
      break;
    case 'calling':
      statusText.textContent = 'Calling...';
      break;
    case 'in-call':
      statusText.textContent = 'You’re in a call';
      break;
    case 'ended':
      statusText.textContent = 'Call ended';
      break;
  }

  container.className = `card ${state}`;
}

async function handleCallClick() {
  setUIState('calling');

  const message = createEventMessage('call');
  publish(cacheName, `agent:${agentId}:inbox`, message);
}

async function handleHangupClick() {
  setUIState('ended');

  const message = createEventMessage('hangup');
  await publish(cacheName, `agent:${agentId}:inbox`, message);

  await hangup();
}

function createEventMessage(type, data = {}) {
  return JSON.stringify({
    from: visitorId,
    to: agentId,
    type,
    ...data,
  });
}

async function onEvent(e) {
  console.log(`incoming event: ${e.type}`);

  switch (e.type) {
    case 'answer':
      await handleAnswer(e);
      break;
    case 'candidate':
      handleRemoteIceCandidate(e);
      break;
    case 'call-accepted':
      await handleAccepted();
      break;
    case 'bye':
      await hangup();
      setUIState('ended');
      break;
    default:
      console.log('unhandled', e);
  }
}

async function handleAnswer(e) {
  const { part, totalParts, sdpFragment, from } = e;
  await setKey(cacheName, `${from}-${part}`, sdpFragment);

  const ready = await allThere(cacheName, from, totalParts);
  if (!ready) return;

  const fullSdp = await pieceTogether(cacheName, from, totalParts);
  const success = await trySetRemoteDescription(fullSdp);
  if (success) flushBufferedCandidates();
}

async function handleAccepted() {
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
  localVideo.srcObject = localStream;

  setupRTC();

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  await sendOfferInFragments(cacheName, agentId, visitorId, offer.sdp);

  setUIState('in-call');
}

function setupRTC() {
  pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });

  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

  pc.onicecandidate = e => {
    if (e.candidate) {
      publish(cacheName, `agent:${agentId}:inbox`, JSON.stringify({
        type: 'candidate',
        candidate: e.candidate.toJSON()
      }));
    }
  };

  pc.ontrack = e => {
    if (!remoteVideo.srcObject) {
      remoteVideo.srcObject = new MediaStream();
    }
    e.streams[0].getTracks().forEach(track => {
      remoteVideo.srcObject.addTrack(track);
    });
  };
}

async function trySetRemoteDescription(sdp) {
  try {
    await pc.setRemoteDescription({ type: 'answer', sdp });
    remoteDescriptionSet = true;
    return true;
  } catch (err) {
    console.error("setRemoteDescription failed:", err);
    return false;
  }
}

function handleRemoteIceCandidate(e) {
  if (!e.candidate) return;
  const candidate = new RTCIceCandidate(e.candidate);
  if (remoteDescriptionSet) {
    pc.addIceCandidate(candidate).catch(console.error);
  } else {
    remoteCandidatesBuffer.push(candidate);
  }
}

function flushBufferedCandidates() {
  remoteCandidatesBuffer.forEach(candidate => {
    pc.addIceCandidate(candidate).catch(console.error);
  });
  remoteCandidatesBuffer = [];
}

async function hangup() {
  if (pc) {
    pc.close();
    pc = null;
  }
  if (localStream) {
    localStream.getTracks().forEach(t => t.stop());
    localStream = null;
  }

  remoteVideo.srcObject = null;
  localVideo.srcObject = null;
  remoteCandidatesBuffer = [];
  remoteDescriptionSet = false;

  callButton.disabled = false;
  hangupButton.disabled = true;
}
