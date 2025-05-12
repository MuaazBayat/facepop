import { CredentialProvider, TopicClient, CacheDeleteResponse, TopicItem, CacheClient, Configurations, CreateCacheResponse, CacheSetResponse, CacheGetResponse } from "@gomomento/sdk-web";


let client;
let momentoCache;

export async function initMomento() {
    console.log(`initializing momento client`);
    const authToken = import.meta.env.VITE_MOMENTO_AUTH_TOKEN;
    console.log(`auth token: ${authToken}`);
    const credentials = CredentialProvider.fromString({apiKey: authToken})
    // const configuration = Configurations.Laptop.v1();
    // // const props: CacheClientProps = {
    // //     CredentialProvider,
    // //     configuration,
    // //     defaultTtlSeconds: 60,
    // // }

    client = new TopicClient({credentialProvider: credentials});
    console.log(`created momento client ${client}`);
    console.log(`creating momento cache client`);
    momentoCache = await CacheClient.create({
        configuration: Configurations.Laptop.v1(),
        credentialProvider: CredentialProvider.fromString(authToken),
        defaultTtlSeconds: 60,
      });
    console.log(`created momento cache client ${momentoCache}`);
};


export async function subscribeToMessages(cacheName, topic, handle) {
    if (!client) {
      throw new Error("Momento not initialized");
    }
  
    client.subscribe(cacheName, topic, {
      onItem: function(msg) {
        if (!msg.value()) return;
  
        try {
          const data = JSON.parse(msg.value());
          handle(data);
        } catch (e) {
          console.error("Failed to parse message value as JSON:", e);
        }
      },
      onError: function(err) {
        console.error("Subscription error:", err);
      }
    });
  };


export function publish(cacheName, topic, message) {
    console.log(`Publishing message to topic ${topic}`);
    if (!client) throw new Error("Momento not initialized");
    // Publish the message to the topic
    return client.publish(cacheName, topic, message)
      .then(() => {
        console.log(`Message successfully published to ${topic}`);
      })
      .catch((err) => {
        console.error(`Error publishing message to ${topic}:`, err);
      });
  }


  function subscribe(cacheName, topic, functionToHandleIncomingMessages) {
    console.log("subscribing to momento topic", topic);
    
    if (!client) {
      throw new Error("Momento not initialized");
    }
  
    return client.subscribe(cacheName, topic, {
      onItem: function(msg) {
        if (msg.value()) {
          console.log(msg);
          functionToHandleIncomingMessages(msg);
        }
      },
      onError: function(err) {
        console.error("Momento error:", err);
      }
    });
  }

//   // TYPES
// export interface SignalMessage {
//     type: "sdp-offer" | "answer" | "candidate";
//     sdpFragment?: RTCSessionDescriptionInit;
//     candidate?: RTCIceCandidateInit;
//     sender: string;
// }
  
  

export async function createCache(cacheName){
    if (!momentoCache) throw new Error("Momento not initialized");
    const result = await momentoCache.createCache(cacheName);
    switch (result.type) {
      case CreateCacheResponse.AlreadyExists:
        console.log(`Cache '${cacheName}' already exists`);
        break;
      case CreateCacheResponse.Success:
        console.log(`Cache '${cacheName}' created`);
        break;
    }
}

export async function setKey(cacheName, key, value){
    if (!momentoCache) throw new Error("Momento not initialized");

    const result = await momentoCache.set(cacheName,key,value);
    switch (result.type) {
        case CacheSetResponse.Success:
            console.log("Key 'test-key' stored successfully");
            break;
        case CacheSetResponse.Error:
          throw new Error(
            `An error occurred while attempting to store key 'test-key' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
          );
    }
}

export async function getKey(cacheName, key){
    if (!momentoCache) throw new Error("Momento not initialized");
    const getResponse = await momentoCache.get(cacheName,key);
    switch (getResponse.type) {
        case CacheGetResponse.Hit:
            console.log(`Retrieved value for key '${key}'`);
            return getResponse.valueString();
        case CacheGetResponse.Miss:
            console.log(`Key '${key}' was not found in cache '${cacheName}'`);
            break;
        case CacheGetResponse.Error:
    
        throw new Error(`An error occurred while attempting to get key 'test-key' from cache '${cacheName}': ${getResponse.errorCode()}: ${getResponse.toString()}`);
    }
}

export async function valueExists(cacheName, key){
    if (!momentoCache) throw new Error("Momento not initialized");
    const getResponse = await momentoCache.get(cacheName,key);
    switch (getResponse.type) {
        case CacheGetResponse.Hit:
            console.log(`${key} exists in ${cacheName}`)
            return true
            break;
        case CacheGetResponse.Miss:
            return false
            break;
        case CacheGetResponse.Error:
    
        throw new Error(`An error occurred while attempting to get key 'test-key' from cache '${cacheName}': ${getResponse.errorCode()}: ${getResponse.toString()}`);
    }
}


export async function deleteKey(cacheName, key){
  if (!momentoCache) throw new Error("Momento not initialized");
  const result = await momentoCache.delete(cacheName, key);
  switch (result.type) {
    case CacheDeleteResponse.Success:
      console.log("Key 'test-key' deleted successfully");
      break;
    case CacheDeleteResponse.Error:
      throw new Error(
        `An error occurred while attempting to delete key ${key} from cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}
