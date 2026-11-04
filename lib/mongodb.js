// lib/mongodb.js
import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/hotel_pos"
const options = {}

if (!uri) {
  throw new Error("Please add your Mongo URI to .env")
}

async function getConnectedClient() {
  if (global._mongoClient) {
    try {
      await global._mongoClient.db("admin").command({ ping: 1 })
      return global._mongoClient
    } catch (err) {
      try {
        await global._mongoClient.close()
      } catch (_) {}
      global._mongoClient = null
    }
  }

  if (!global._mongoConnectPromise) {
    const client = new MongoClient(uri, options)
    global._mongoConnectPromise = client.connect()
      .then((c) => {
        global._mongoClient = c
        global._mongoConnectPromise = null
        return c
      })
      .catch((err) => {
        global._mongoConnectPromise = null
        throw err
      })
  }

  return global._mongoConnectPromise
}

// Thenable object that behaves exactly like a Promise<MongoClient>
const clientPromise = {
  then(onFulfilled, onRejected) {
    return getConnectedClient().then(onFulfilled, onRejected)
  },
  catch(onRejected) {
    return getConnectedClient().catch(onRejected)
  },
}

export default clientPromise


