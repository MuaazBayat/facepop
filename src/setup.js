import { initMomento, subscribeToMessages, getKey } from './momento.js';
import { onEvent } from './main.js';
const cacheName = import.meta.env.VITE_CACHE_NAME;
const agentId = 'xyz';

export async function start(visitorId) {
   
  try {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    if (!backendUrl) {
        throw new Error("Missing VITE_BACKEND_URL in environment variables");
      }
    const response = await fetch(`${backendUrl}/token?agentId=${agentId}&visitorId=${visitorId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    console.log(`Token fetched successfully`);

    await initMomento(data.token); // assuming `initMomento` takes the token
    subscribeToMessages(cacheName, `visitor:${visitorId}:inbox`, onEvent);

  } catch (error) {
    console.error('Error fetching token or initializing Momento:', error);
  }
}

