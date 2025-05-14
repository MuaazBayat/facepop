import { CredentialProvider, TopicClient, CacheDeleteResponse, TopicItem, CacheClient, Configurations, CreateCacheResponse, CacheSetResponse, CacheGetResponse } from "@gomomento/sdk-web";


let momentoTopicClient;
let momentoCacheClient;

export async function initMomento() {
  console.log(`Initializing Momento client`);

  try {
    const authToken = import.meta.env.VITE_MOMENTO_AUTH_TOKEN;
    if (!authToken) {
      throw new Error("Missing VITE_MOMENTO_AUTH_TOKEN in environment variables");
    }

    console.log(`Auth token found`);

    const credentials = CredentialProvider.fromString({ apiKey: authToken });

    try {
      momentoCacheClient = await CacheClient.create({
        configuration: Configurations.Laptop.v1(),
        credentialProvider: CredentialProvider.fromString(authToken),
        defaultTtlSeconds: 60,
      });
      console.log(`Created Momento cache client`, momentoCacheClient);
    } catch (cacheErr) {
      console.error(`Error creating Momento cache client:`, cacheErr);
    }

    try {
      momentoTopicClient = new TopicClient({ credentialProvider: credentials });
      console.log(`Created Momento topic client`, momentoTopicClient);
    } catch (topicErr) {
      console.error(`Error creating Momento topic client:`, topicErr);
    }

  } catch (err) {
    console.error(`Failed to initialize Momento:`, err);
  }
}


export async function subscribeToMessages(cacheName, topic, handle) {
  try {
    if (!momentoTopicClient) {
      throw new Error("Momento not initialized");
    }

    console.log(`Subscribing to topic "${topic}" on cache "${cacheName}"...`);

    momentoTopicClient.subscribe(cacheName, topic, {
      onItem: function(msg) {
        try {
          const raw = msg.value();
          if (!raw) {
            console.warn("Received empty message");
            return;
          }

          const data = JSON.parse(raw);
          console.log(`Received message on topic "${topic}":`, data);
          handle(data);
        } catch (e) {
          console.error("Failed to handle incoming message:", e);
        }
      },
      onError: function(err) {
        console.error(`Subscription error on topic "${topic}":`, err);
      },
    });

  } catch (err) {
    console.error("Failed to subscribe to topic:", err);
  }
}


export function publish(cacheName, topic, message) {
    console.log(`Publishing message to topic ${topic}`);
    if (!momentoTopicClient) throw new Error("Momento not initialized");
    // Publish the message to the topic
    return momentoTopicClient.publish(cacheName, topic, message)
      .then(() => {
        console.log(`Message successfully published to ${topic}`);
      })
      .catch((err) => {
        console.error(`Error publishing message to ${topic}:`, err);
      });
  }

export async function createCache(cacheName){
    if (!momentoCacheClient) throw new Error("Momento not initialized");
    const result = await momentoCacheClient.createCache(cacheName);
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
    if (!momentoCacheClient) throw new Error("Momento not initialized");

    const result = await momentoCacheClient.set(cacheName,key,value);
    switch (result.type) {
        case CacheSetResponse.Success:
            console.log(`Key ${key} stored successfully`);
            break;
        case CacheSetResponse.Error:
          throw new Error(
            `An error occurred while attempting to store key ${key} in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
          );
    }
}

export async function getKey(cacheName, key){
    if (!momentoCacheClient) throw new Error("Momento not initialized");
    
    const getResponse = await momentoCacheClient.get(cacheName,key);
    switch (getResponse.type) {
        case CacheGetResponse.Hit:
            console.log(`Retrieved value for key '${key}'`);
            return getResponse.valueString();
        case CacheGetResponse.Miss:
            console.log(`Key '${key}' was not found in cache '${cacheName}'`);
            break;
        case CacheGetResponse.Error:
    
        throw new Error(`An error occurred while attempting to get key ${key} from cache '${cacheName}': ${getResponse.errorCode()}: ${getResponse.toString()}`);
    }
}

export async function valueExists(cacheName, key){
    if (!momentoCacheClient) throw new Error("Momento not initialized");
    const getResponse = await momentoCacheClient.get(cacheName,key);
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
  if (!momentoCacheClient) throw new Error("Momento not initialized");
  const result = await momentoCacheClient.delete(cacheName, key);
  switch (result.type) {
    case CacheDeleteResponse.Success:
      console.log(` ${key} deleted successfully`);
      break;
    case CacheDeleteResponse.Error:
      throw new Error(
        `An error occurred while attempting to delete key ${key} from cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}
