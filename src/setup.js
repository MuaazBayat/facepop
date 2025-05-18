import { initMomento, subscribeToMessages, getKey } from './momento.js';
import { onEvent } from './main.js';
import { cacheName, api } from './config.js'; 

export async function start(visitorId, agentId) {
   
  try {
    const response = await fetch(`${api}/token?agentId=${agentId}&visitorId=${visitorId}`, {
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

